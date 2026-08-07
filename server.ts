import { logger } from './src/lib/logger.js';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import 'dotenv/config';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
import { WebSocketServer } from 'ws';
import mammoth from 'mammoth';
import Stripe from 'stripe';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --------------- Simple in-memory rate limiter ---------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window per IP

function rateLimit(req: express.Request, res: express.Response): boolean {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false; // not limited
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMITED' });
    return true; // limited
  }
  return false;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

let firebaseAdminApp: any;
try {
  const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

    // Determine credential: service account file > application default > graceful skip
    let credential: any;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const saPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(saPath)) {
        credential = cert(JSON.parse(fs.readFileSync(saPath, 'utf8')));
      } else {
        logger.warn(`FIREBASE_SERVICE_ACCOUNT_PATH set to "${saPath}" but file not found. Falling back.`);
      }
    }

    if (!credential) {
      try {
        credential = applicationDefault();
      } catch {
        logger.warn('Application Default Credentials not available. Firebase Admin will not be initialised.');
      }
    }

    if (credential) {
      firebaseAdminApp = initializeApp({
        credential,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
      });
      // Store database id for reference (client uses 'default')
      firebaseAdminApp.customDatabaseId = process.env.FIREBASE_DATABASE_ID || 'default';
    }
  } else {
    logger.warn('firebase-applet-config.json not found – Firebase Admin is disabled.');
  }
} catch (e) {
  logger.warn("Failed to initialize Firebase Admin (non-fatal):", e);
}

const getDb = () => {
    if (!firebaseAdminApp) return null;
    return getFirestore(firebaseAdminApp, firebaseAdminApp.customDatabaseId || 'default');
};

// The founder/admin account gets unlimited access, mirroring the client-side
// ADMIN_EMAIL bypass in App.tsx (handleDeductCredits).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || 'iambrittothomas@gmail.com';

// --------------- Auth verification ---------------
// Verifies the Firebase ID token sent by the client in the Authorization header
// (or, for the WebSocket handshake, in the 'setup' message body). Returns the
// decoded token (with uid/email) on success, or null if missing/invalid.
async function verifyIdToken(token: string | undefined | null): Promise<{ uid: string; email?: string } | null> {
  if (!token || !firebaseAdminApp) return null;
  try {
    const decoded = await getAuth(firebaseAdminApp).verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    return null;
  }
}

function extractBearerToken(req: express.Request): string | null {
  const header = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(header);
  return match ? match[1] : null;
}

// Express middleware: rejects the request with 401 unless a valid Firebase ID
// token is present. On success, attaches { uid, email } to req.auth.
function requireAuth(): express.RequestHandler {
  return async (req: any, res, next) => {
    if (!firebaseAdminApp) {
      logger.error('requireAuth: Firebase Admin is not initialized — cannot verify tokens.');
      return res.status(503).json({ error: 'Authentication service unavailable.', code: 'AUTH_UNAVAILABLE' });
    }
    const decoded = await verifyIdToken(extractBearerToken(req));
    if (!decoded) {
      return res.status(401).json({ error: 'Please sign in to use this feature.', code: 'AUTH_REQUIRED' });
    }
    req.auth = decoded;
    next();
  };
}

// --------------- Credit / free-allowance enforcement ---------------
// Mirrors the exact business rules currently enforced only client-side:
//  - 3 starting credits per new user (see AuthContext.tsx / App.tsx defaults)
//  - resume generation: free & unlimited for Pro users, else 1 credit/generation
//  - chat: first 5 messages free per user (freeChatMessagesUsed), else 1 credit/message for non-Pro; unlimited for Pro
//  - voice interview: 1 free trial (freeInterviewUsed) for non-Pro, then blocked until upgrade; Pro pays 5 credits/session
// The founder/admin account (ADMIN_EMAIL) always bypasses these checks.
type CreditAction = 'resume' | 'chat' | 'voice';
type CreditCheckResult = { ok: boolean; isTrial?: boolean; error?: string; code?: string };

async function checkAndConsume(uid: string, email: string | undefined, action: CreditAction): Promise<CreditCheckResult> {
  if (email && email === ADMIN_EMAIL) return { ok: true };

  const db = getDb();
  if (!db) {
    logger.error('checkAndConsume: Firestore not configured — failing closed.');
    return { ok: false, error: 'Server is temporarily unable to verify your account. Please try again shortly.', code: 'DB_UNAVAILABLE' };
  }

  const userRef = db.collection('users').doc(uid);

  try {
    return await db.runTransaction(async (tx): Promise<CreditCheckResult> => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        return { ok: false, error: 'User account not found.', code: 'USER_NOT_FOUND' };
      }
      const data = snap.data() || {};
      const isPro = !!data.isPro;
      const credits = typeof data.credits === 'number' ? data.credits : 0;

      if (action === 'resume') {
        if (isPro) return { ok: true };
        if (credits <= 0) {
          return { ok: false, error: "You've used all your AI credits. Upgrade to continue.", code: 'OUT_OF_CREDITS' };
        }
        tx.update(userRef, { credits: credits - 1 });
        return { ok: true };
      }

      if (action === 'chat') {
        if (isPro) return { ok: true };
        const freeUsed = typeof data.freeChatMessagesUsed === 'number' ? data.freeChatMessagesUsed : 0;
        if (freeUsed < 5) {
          tx.update(userRef, { freeChatMessagesUsed: freeUsed + 1 });
          return { ok: true };
        }
        if (credits <= 0) {
          return { ok: false, error: "You've used your free messages and AI credits. Upgrade to continue.", code: 'OUT_OF_CREDITS' };
        }
        tx.update(userRef, { credits: credits - 1 });
        return { ok: true };
      }

      // action === 'voice'
      if (!isPro) {
        const freeInterviewUsed = !!data.freeInterviewUsed;
        if (freeInterviewUsed) {
          return { ok: false, error: 'Your free interview trial is over! Upgrade to Pro for unlimited interview practice.', code: 'TRIAL_USED' };
        }
        tx.update(userRef, { freeInterviewUsed: true });
        return { ok: true, isTrial: true };
      }
      if (credits < 5) {
        return { ok: false, error: 'You need 5 AI credits for a voice interview session.', code: 'OUT_OF_CREDITS' };
      }
      tx.update(userRef, { credits: credits - 5 });
      return { ok: true };
    });
  } catch (e: any) {
    logger.error('checkAndConsume transaction failed:', e);
    return { ok: false, error: 'Could not verify your account. Please try again.', code: 'CHECK_FAILED' };
  }
}

const stripeClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as any
}) : null;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  Sentry.setupExpressErrorHandler(app);
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // --------------- CORS ---------------
  const allowedOrigin = process.env.APP_URL || 'http://localhost:3000';
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || origin === allowedOrigin || allowedOrigin === '*') {
      res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // --------------- Health check ---------------
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --------------- Welcome Email ---------------
  app.post('/api/welcome-email', express.json(), async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }

      const firstName = name ? name.split(' ')[0] : 'there';

      const data = await resend.emails.send({
        from: 'Precision Match <hello@precision-match.com>',
        to: email,
        subject: `Welcome to Precision Match, ${firstName}!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin-bottom: 10px; font-size: 28px;">Welcome to Precision Match!</h1>
              <p style="font-size: 16px; color: #666; margin: 0;">Your curated AI career platform is ready.</p>
            </div>
            
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
              <p style="font-size: 16px; margin-top: 0; margin-bottom: 15px;">Hey ${firstName},</p>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                Welcome to Precision Match. We're thrilled to have you onboard! Here is what you can do to accelerate your career right now:
              </p>
              
              <a href="https://precision-match.com/resume" style="display: block; text-decoration: none; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 16px;">📄 Start a resume from scratch</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Build a highly effective resume tailored to your skills.</p>
              </a>

              <a href="https://precision-match.com/resume" style="display: block; text-decoration: none; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 16px;">🎯 Curate a resume for a specific job</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Optimize your existing experience for your dream role.</p>
              </a>

              <a href="https://precision-match.com/edit" style="display: block; text-decoration: none; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 16px;">✨ Choose from different professional templates</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Stand out with modern, beautifully designed layouts.</p>
              </a>

              <a href="https://precision-match.com/chat" style="display: block; text-decoration: none; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 16px;">💬 Chat with your AI coach, Aadhya</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Get personalized career advice and guidance anytime.</p>
              </a>

              <a href="https://precision-match.com/interview" style="display: block; text-decoration: none; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 4px 0; color: #4f46e5; font-size: 16px;">🎙️ Speak with your mentor and interview coach, Aadhya</h3>
                <p style="margin: 0; color: #64748b; font-size: 14px;">Practice with real-time voice conversations.</p>
              </a>

              <div style="text-align: center; margin: 10px 0;">
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Need support? <a href="https://precision-match.com/contact" style="color: #4f46e5; text-decoration: underline;">Contact us here</a>.</p>
              </div>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">
              Let's make the next move count.<br>
              <strong>Your Precision Match Team</strong>
            </p>
          </div>
        `
      });

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      logger.error("Failed to send welcome email:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook needs raw body
  app.post("/api/webhooks/stripe", express.raw({type: 'application/json'}), async (req, res) => {
    if (!stripeClient || !process.env.STRIPE_WEBHOOK_SECRET) {
      logger.warn("Stripe webhook received but keys missing.");
      return res.status(400).json({ error: "Stripe webhook not configured.", code: "WEBHOOK_NOT_CONFIGURED" });
    }
    const signature = req.headers['stripe-signature'] as string;
    try {
      const event = stripeClient.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        
        logger.info(`Payment successful for user ID: ${userId}`);
        
        if (userId) {
          const db = getDb();
          if (db) {
            const userRef = db.collection('users').doc(userId);
            
            if (session.mode === 'subscription') {
              await userRef.update({
                  isPro: true,
                  credits: 100, // Grant 100 credits upon subscription
                  stripeCustomerId: session.customer as string
              });
              logger.info(`Upgraded user ${userId} to Pro and granted 100 credits`);
            } else if (session.mode === 'payment') {
              await userRef.update({
                  credits: FieldValue.increment(10)
              });
              logger.info(`Added 10 credits to user ${userId}`);
            }
          } else {
             logger.error("Firebase Admin DB not initialized to fulfill order.");
          }
        }
      } else if (event.type === 'invoice.payment_succeeded') {
        // Recurring subscription renewal — refill the Pro monthly credit allowance.
        // We deliberately skip 'subscription_create' here: that first invoice's credits
        // are already granted by the checkout.session.completed handler above. Only
        // 'subscription_cycle' (a genuine renewal) should trigger a refill, otherwise
        // we'd double-grant credits on brand-new subscriptions.
        const invoice = event.data.object as Stripe.Invoice;
        const billingReason = (invoice as any).billing_reason;

        if (billingReason === 'subscription_cycle') {
          const customerId = invoice.customer as string;
          const db = getDb();
          if (!db) {
            logger.error("Firebase Admin DB not initialized to fulfill subscription renewal.");
          } else if (customerId) {
            const matches = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
            if (matches.empty) {
              logger.warn(`Subscription renewal for Stripe customer ${customerId} but no matching user doc found.`);
            } else {
              const userDoc = matches.docs[0];
              await userDoc.ref.update({
                isPro: true,
                credits: 100 // Refill to the Pro monthly allowance on each renewal
              });
              logger.info(`Renewed Pro subscription for user ${userDoc.id} — refilled to 100 credits`);
            }
          }
        } else {
          logger.info(`invoice.payment_succeeded received with billing_reason=${billingReason} — no credit action taken`);
        }
      } else if (event.type === 'customer.subscription.deleted') {
        // Subscription was canceled/deleted — revoke Pro status.
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const db = getDb();
        if (!db) {
          logger.error("Firebase Admin DB not initialized to handle subscription deletion.");
        } else if (customerId) {
          const matches = await db.collection('users').where('stripeCustomerId', '==', customerId).limit(1).get();
          if (matches.empty) {
            logger.warn(`Subscription deleted for Stripe customer ${customerId} but no matching user doc found.`);
          } else {
            const userDoc = matches.docs[0];
            await userDoc.ref.update({
              isPro: false
            });
            logger.info(`Revoked Pro subscription for user ${userDoc.id} due to subscription deletion`);
          }
        }
      } else {
        logger.info(`Unhandled event type ${event.type}`);
      }

      res.status(200).end();
    } catch (err: any) {
      logger.error(`Webhook Error: ${err.message}`);
      res.status(400).json({ error: err.message, code: "WEBHOOK_SIGNATURE_FAILED" });
    }
  });

  app.use(express.json({ limit: '50mb' }));

  // Apply rate limiting to all AI and payment endpoints
  app.use('/api/generate-resume', (req, res, next) => { if (!rateLimit(req, res)) next(); });
  app.use('/api/generate-cover-letter', (req, res, next) => { if (!rateLimit(req, res)) next(); });
  app.use('/api/ats-score', (req, res, next) => { if (!rateLimit(req, res)) next(); });
  app.use('/api/chat', (req, res, next) => { if (!rateLimit(req, res)) next(); });
  app.use('/api/extract-resume', (req, res, next) => { if (!rateLimit(req, res)) next(); });
  app.use('/api/extract-linkedin', (req, res, next) => { if (!rateLimit(req, res)) next(); });
  
  app.post("/api/refund", async (req, res) => {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured.", code: "STRIPE_NOT_CONFIGURED" });
    }
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: "Missing or invalid required field: userId", code: "VALIDATION_ERROR" });
    }
    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not configured", code: "DB_NOT_CONFIGURED" });
    }
    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
      }
      const data = userSnap.data();
      if (!data?.stripeCustomerId) {
        return res.status(400).json({ error: "User has no active Stripe customer ID", code: "NO_CUSTOMER_ID" });
      }
      
      // Look up latest charges for this customer
      const charges = await stripeClient.charges.list({ customer: data.stripeCustomerId, limit: 1 });
      if (charges.data.length === 0) {
        return res.status(400).json({ error: "No charges found for this user to refund", code: "NO_CHARGES" });
      }

      // Create refund
      const refund = await stripeClient.refunds.create({ charge: charges.data[0].id });
      
      // Update DB to revoke Pro status if it was a subscription/pro payment
      await userRef.update({
        isPro: false
      });

      return res.json({ success: true, refundId: refund.id });
    } catch (e: any) {
      logger.error("Refund error:", e);
      return res.status(500).json({ error: "Failed to issue refund", code: "REFUND_FAILED" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured.", code: "STRIPE_NOT_CONFIGURED" });
    }
    const { priceId, userId, successUrl, cancelUrl } = req.body;
    if (!priceId || typeof priceId !== 'string') {
      return res.status(400).json({ error: "Missing or invalid required field: priceId", code: "VALIDATION_ERROR" });
    }
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: "Missing or invalid required field: userId", code: "VALIDATION_ERROR" });
    }
    try {
      const creditPriceId = process.env.STRIPE_CREDIT_PRICE_ID || 'price_1TjhoWKc3d6UbNauMyXLfggD';
      const session = await stripeClient.checkout.sessions.create({
        mode: priceId === creditPriceId ? 'payment' : 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        client_reference_id: userId,
        success_url: successUrl || `${process.env.APP_URL || 'http://localhost:3000'}/?success=true`,
        cancel_url: cancelUrl || `${process.env.APP_URL || 'http://localhost:3000'}/?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (err: any) {
      logger.error('Checkout session error:', err);
      res.status(500).json({ error: err.message, code: "CHECKOUT_FAILED" });
    }
  });

  app.post("/api/create-portal-session", async (req, res) => {
    if (!stripeClient) {
      return res.status(500).json({ error: "Stripe is not configured.", code: "STRIPE_NOT_CONFIGURED" });
    }
    const { userId, returnUrl } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: "Missing or invalid required field: userId", code: "VALIDATION_ERROR" });
    }

    try {
      const db = getDb();
      if (!db) {
         return res.status(500).json({ error: "Database not configured.", code: "DB_NOT_CONFIGURED" });
      }
      
      // Find the user's stripe customer ID
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (!userData || !userData.stripeCustomerId) {
        return res.status(400).json({ error: "User does not have an active subscription.", code: "NO_CUSTOMER_ID" });
      }

      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: returnUrl || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`,
      });

      res.json({ url: portalSession.url });
    } catch (err: any) {
      logger.error('Portal session error:', err);
      res.status(500).json({ error: err.message, code: "PORTAL_FAILED" });
    }
  });

  app.post("/api/extract-linkedin", requireAuth(), async (req, res) => {
   try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: url", code: "VALIDATION_ERROR" });
      }

      const response = await ai.models.generateContent({
         model: "gemini-3.1-flash-lite",
         contents: `Extract the full professional profile details, experience, education, skills, and summary from this LinkedIn URL: ${url}. Provide a comprehensive markdown output that captures all available data.`,
         config: {
             tools: [
                { googleSearch: {} }
             ]
         }
      });

      res.json({ text: response.text });
   } catch(e: any) {
      logger.error(e);
      res.status(500).json({ error: e.message, code: "LINKEDIN_EXTRACT_FAILED" });
   }
});


  app.post("/api/extract-resume", requireAuth(), async (req, res) => {
    try {
      const { fileBase64, mimeType } = req.body;
      if (!fileBase64 || typeof fileBase64 !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: fileBase64", code: "VALIDATION_ERROR" });
      }

      const prompt = `Extract the full, exact text from this resume document, retaining every single detail, bullet point, date, and description exactly as written. Do not summarize, truncate, or omit any information, even if it is very long. Provide a comprehensive markdown formatting of the extracted text, clearly sectioning personal details, summary, experience (with all responsibilities), education, skills, and projects.`;
      
      let contents: any[] = [];

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
         const buffer = Buffer.from(fileBase64, 'base64');
         const result = await mammoth.extractRawText({ buffer });
         contents = [
            { text: `Here is the text extracted from the user's DOCX resume:\n\n${result.value}\n\n` },
            { text: prompt }
         ];
      } else {
         contents = [
             { text: prompt },
             {
                inlineData: {
                   data: fileBase64,
                   mimeType: mimeType || 'application/pdf'
                }
             }
         ];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: contents
      });

      res.json({ text: response.text });
    } catch (e: any) {
      logger.error(e);
      res.status(500).json({ error: e.message, code: "RESUME_EXTRACT_FAILED" });
    }
  });

  app.post("/api/generate-resume", requireAuth(), async (req: any, res) => {
    try {
      const { baseData, jobDescription, instructions } = req.body;
      if (!baseData || typeof baseData !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: baseData", code: "VALIDATION_ERROR" });
      }

      const creditCheck = await checkAndConsume(req.auth.uid, req.auth.email, 'resume');
      if (!creditCheck.ok) {
        return res.status(402).json({ error: creditCheck.error, code: creditCheck.code });
      }

      const prompt = `
You are an expert executive resume writer.
You are tasked with curating and tailoring a candidate's base resume data to a specific job description.

Base Resume Data:
${baseData}

Target Job Description:
${jobDescription || 'N/A (Provide purely an enhanced version of the base data)'}

Additional Instructions:
${instructions || 'None'}

=== GROUNDING RULES (these override every other instruction below) ===

Every factual claim in your output MUST be traceable to the Base Resume Data above.
The job description tells you what to EMPHASISE. It is never a source of facts about
this candidate. A resume that gets the candidate caught out in an interview is a
total failure, no matter how well it matches the job description.

You MAY:
- Reorder and reprioritise experience, bullets and skills so the most relevant appear first.
- Reword existing bullets using clearer, stronger language, and adopt the job
  description's vocabulary WHERE THE UNDERLYING FACT IS ALREADY PRESENT
  (e.g. if the base data says "managed the product backlog" and the job description
  says "backlog grooming", you may use the phrase "backlog grooming").
- Drop or condense content that is irrelevant to the target role.
- Group skills into categories that mirror how the job description organises them.
- Set personalDetails.title to the target role ONLY IF the candidate's actual
  experience genuinely supports it. This is a headline, not a past job title.

You MUST NOT:
- Invent, infer or estimate any metric, percentage, dollar figure, team size,
  or timeframe that is not explicitly in the base data. If a bullet has no number,
  leave it without a number. Never write placeholders like "X%" or "[number]".
- Add any skill, tool, technology, language or certification that does not appear
  in the base data, even if the job description requires it. Missing skills are the
  user's problem to solve honestly, not yours to paper over.
- Alter the title, employer name, location or dates of any past role.
- Invent employers, degrees, institutions, publications, awards or certifications.
- Upgrade scope or seniority (e.g. "contributed to" must not become "led";
  "team member" must not become "team lead").
- Claim years of experience with something beyond what the dates in the base data support.

If the candidate is genuinely a weak match for the job description, produce an honest
resume that presents their real strengths. Do not close the gap by fabricating.

=== END GROUNDING RULES ===

Please generate a highly professional, tailored resume formatted in JSON.
The structured output must comprehensively include ALL roles, experiences, education, and bullet points from the base data. Do not arbitrarily truncate or limit length to a single page. If the input is long, the output should faithfully incorporate that depth.
The JSON should exactly match this TypeScript interface:
{
  personalDetails: { name: string, title: string, email: string, phone: string, location: string, linkedin: string, website: string, summary: string },
  experience: Array<{ company: string, role: string, duration: string, location: string, responsibilities: string[] }>,
  education: Array<{ institution: string, degree: string, duration: string, location: string, details: string }>,
  skills: Array<{ category: string, items: string[] }>,
  certifications?: Array<{ name: string, issuer: string, date: string }>,
  projects?: Array<{ name: string, role: string, duration: string, description: string, url?: string }>,
  customSections?: Array<{ id: string, title: string, items: Array<{ title: string, subtitle?: string, date?: string, description?: string }> }>
}

Ensure the content highlights relevant skills and experiences for the job description, strictly within the grounding rules above.
If there are any other sections (like Credentials, Publications, Awards, etc.) in the original resume that do not fit into the standard properties above, please add them to the 'customSections' array. Use a simple lowercase string for the 'id' (e.g. 'credentials').
Respond only with valid JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
      });

      res.json({ data: JSON.parse(response.text || '{}') });
    } catch (e: any) {
      logger.error(e);
      res.status(500).json({ error: e.message, code: "RESUME_GENERATE_FAILED" });
    }
  });

  app.post("/api/generate-cover-letter", requireAuth(), async (req, res) => {
    try {
      const { baseData, jobDescription } = req.body;
      if (!baseData || typeof baseData !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: baseData", code: "VALIDATION_ERROR" });
      }
      if (typeof jobDescription !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: jobDescription", code: "VALIDATION_ERROR" });
      }
      
      const jdText = jobDescription.trim() || "General application - no specific job description provided.";

      const prompt = `
You are an expert executive cover letter writer.
Based on the candidate's experience and the job description, write a compelling, tailored cover letter.

Candidate Experience:
${baseData}

Target Job Description:
${jdText}

=== GROUNDING RULES (these override every other instruction) ===

Cover letters are where invented claims creep in most easily, because the format
invites confident storytelling. Do not let it. Every factual claim about this
candidate MUST be traceable to the Candidate Experience above.

You MUST NOT:
- Invent metrics, percentages, revenue figures, team sizes or timeframes. If the
  candidate's experience contains no numbers, write a strong letter without numbers.
- Claim skills, tools or technologies the candidate has not listed, even if the job
  description asks for them.
- Invent employers, projects, achievements, qualifications or awards.
- Inflate seniority or scope (do not turn "contributed to" into "led").
- Assert enthusiasm-as-fact about the company's specifics (products, culture,
  recent news) that you have not been given. Keep interest genuine and general.

You MAY:
- Select which real experiences to foreground for this role.
- Frame real experience in the job description's language where the substance matches.
- Express motivation and fit in the candidate's voice.

If the candidate's background is thin for this role, write an honest, confident
letter about what they genuinely bring. Never fabricate to fill the gap — the
candidate has to defend every sentence of this letter in an interview.

=== END GROUNDING RULES ===

Write the cover letter in professional plain text matching standard business letter format.
Include placeholders like [Hiring Manager Name] or [Company Name] where appropriate if not found.
Use a placeholder rather than inventing any detail you were not given.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (e: any) {
      logger.error(e);
      res.status(500).json({ error: e.message, code: "COVER_LETTER_FAILED" });
    }
  });

  app.post("/api/ats-score", requireAuth(), async (req, res) => {
    try {
      const { resumeData, jobDescription } = req.body;
      if (!resumeData) {
        return res.status(400).json({ error: "Missing resumeData", code: "VALIDATION_ERROR" });
      }

      // Readiness is deliberately TWO things:
      //  - quality: intrinsic strength of the resume. Needs no job description, so
      //    it can be scored the moment a resume is imported.
      //  - fit: match against one specific posting. Only computed when a JD exists.
      // Collapsing them into one number meant nothing could be shown until both
      // were present, and made "score" ambiguous between "good resume" and
      // "good for this job".
      const hasJd = typeof jobDescription === 'string' && jobDescription.trim().length > 0;

      const fitBlock = hasJd ? `
Also assess fit against this specific job description.

"fit": {
  "score": number (0-100, how well this resume matches THIS role),
  "matchedKeywords": string[] (important JD terms genuinely evidenced in the resume),
  "gaps": [
    {
      "keyword": string,
      "likelyHave": boolean,
      "note": string
    }
  ]
}

RULES FOR "gaps" — read carefully, this is the part that matters most:

A gap is something the job asks for that the resume does not evidence. Your job is
to describe it honestly, NOT to tell the candidate to insert the keyword.

Set "likelyHave" to true ONLY when the resume contains adjacent evidence suggesting
the candidate probably has done this but didn't spell it out — e.g. the JD says
"stakeholder management" and the resume describes running steering committees.
In that case "note" should point at the specific existing experience they could
draw out, e.g. "Your steering committee work likely covers this — consider making
it explicit."

Set "likelyHave" to false when there is no evidence at all. In that case "note"
must state plainly that this is a genuine gap, e.g. "Nothing in your background
shows this. Adding it would not be truthful."

NEVER phrase a note as an instruction to add a keyword to score higher. The
candidate has to defend every line of this resume in an interview.

Target Job Description:
${jobDescription}
` : '';

      const prompt = `
You are a senior recruiter and an expert on how applicant tracking systems parse resumes.

Assess the resume below on its own merits, independent of any specific job.

Return a JSON object with EXACTLY this structure:
{
  "quality": {
    "score": number (0-100, overall strength and ATS-readability of this resume),
    "checks": [
      {
        "id": string (short slug, e.g. "quantified-impact"),
        "label": string (short human label, e.g. "Quantified impact"),
        "status": "pass" | "warn" | "fail",
        "detail": string (one specific sentence about THIS resume, not generic advice)
      }
    ]
  }${hasJd ? ',\n  "fit": { ... as specified below ... }' : ''}
}

Cover these quality checks, in this order:
  contact-complete    — are name, email, phone and location present and parseable?
  summary-strength    — is there a summary, and is it specific rather than generic filler?
  quantified-impact   — do bullets contain concrete numbers, scale or outcomes?
  active-language     — do bullets lead with strong verbs rather than "responsible for"?
  section-structure   — are standard sections present and clearly named for ATS parsing?
  length-density      — is the volume of content appropriate for the experience shown?

Be strict and realistic. Do not award a high score to a thin or vague resume.
Never invent facts about the candidate; describe only what is actually present.
${fitBlock}

Resume:
${JSON.stringify(resumeData)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      const result = JSON.parse(text);
      // Backwards compatibility: older clients read score/matchedKeywords/
      // missingKeywords at the top level. Keep those populated from the fit
      // block so a stale frontend bundle doesn't break mid-deploy.
      res.json({
        ...result,
        score: result?.fit?.score ?? result?.quality?.score ?? 0,
        matchedKeywords: result?.fit?.matchedKeywords ?? [],
        missingKeywords: (result?.fit?.gaps ?? []).map((g: any) => g?.keyword).filter(Boolean),
      });
    } catch (e: any) {
      logger.error("ATS Score error:", e);
      res.status(500).json({ error: e.message, code: "ATS_SCORE_FAILED" });
    }
  });

  app.post('/api/chat', requireAuth(), async (req: any, res) => {
     try {
        const { messages, thinkingMode, resumeContext } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required', code: 'VALIDATION_ERROR' });
        }

        const creditCheck = await checkAndConsume(req.auth.uid, req.auth.email, 'chat');
        if (!creditCheck.ok) {
          return res.status(402).json({ error: creditCheck.error, code: creditCheck.code });
        }

        const modelName = thinkingMode ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite";
        const config: any = {};
        if (resumeContext) {
           config.systemInstruction = `You are Aadhya, the AI Career Advisor for Precision Match. You are warm, insightful, and deeply knowledgeable about career development, interviewing, and professional growth. Always introduce yourself as Aadhya when greeting the user for the first time. You have access to the user's current resume:\n${resumeContext}\nUse this context to give tailored, specific advice. Be encouraging but honest.`;
        }
        if (thinkingMode) {
           config.thinkingConfig = { thinkingLevel: 'HIGH' };
        }

        const contents = messages.map((m: any) => ({
           role: m.role,
           parts: [{ text: m.text }]
        }));

        const response = await ai.models.generateContent({
           model: modelName,
           contents,
           config
        });

        res.json({ text: response.text });
     } catch (e: any) {
         logger.error('Chat error:', e);
         res.status(500).json({ error: e.message, code: "CHAT_FAILED" });
     }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  // Hard safety cap on live voice sessions, independent of client-reported duration.
  // Free-trial sessions are additionally capped in checkAndConsume/client at 120s;
  // this cap protects paid/Pro sessions (and any client that fails to self-limit)
  // from running indefinitely against the (expensive) live voice model.
  const MAX_VOICE_SESSION_MS = 15 * 60_000; // 15 minutes

  wss.on("connection", async (clientWs, req) => {
    try {
      if (req.url === '/api/live') {
        let session: any = null;
        let sessionTimeout: NodeJS.Timeout | null = null;

        clientWs.on("message", async (data) => {
          try {
            const msg = JSON.parse(data.toString());

            if (msg.type === 'setup') {
              const decoded = await verifyIdToken(msg.idToken);
              if (!decoded) {
                clientWs.send(JSON.stringify({ type: 'error', message: 'Please sign in to start a voice interview.' }));
                clientWs.close();
                return;
              }
              const creditCheck = await checkAndConsume(decoded.uid, decoded.email, 'voice');
              if (!creditCheck.ok) {
                clientWs.send(JSON.stringify({ type: 'error', message: creditCheck.error }));
                clientWs.close();
                return;
              }

              const resumeContext = msg.data || '';

              // The client always sends *some* JSON here, even for a brand-new
              // user who hasn't filled anything in yet (empty strings, empty
              // arrays). Without this check, the system prompt below always told
              // Aadhya to "acknowledge their experience" — so with nothing real
              // to acknowledge, the model would just fabricate something ("I see
              // you have some experience") instead of noticing the resume is
              // empty. Detect that case and give Aadhya an honest, different
              // opening instead of pretending to know the candidate's background.
              let hasResumeContent = false;
              try {
                const parsedResume = JSON.parse(resumeContext);
                const p = parsedResume?.personalDetails || {};
                hasResumeContent = !!(
                  (p.name && p.name.trim()) ||
                  (p.summary && p.summary.trim()) ||
                  (Array.isArray(parsedResume?.experience) && parsedResume.experience.length > 0)
                );
              } catch {
                hasResumeContent = false;
              }

              const systemInstruction = hasResumeContent
                ? `You are Aadhya, the AI career coach for Precision Match. You are conducting a live mock interview session. IMPORTANT: You MUST begin the conversation by introducing yourself — say something like "Hi, I'm Aadhya, your career coach from Precision Match." Then greet the candidate by name, briefly acknowledge their experience and target role from the resume context below, and ask your first interview question. Do NOT wait for the user to speak first — you initiate. Keep your responses concise, warm, and conversational. After each answer, give brief constructive feedback and follow up with the next question. Here is context about the candidate's resume:\n${resumeContext}`
                : `You are Aadhya, the AI career coach for Precision Match. The candidate has NOT filled out their resume in the app yet — you have no real information about their background, experience, or target role. IMPORTANT: You MUST begin the conversation by introducing yourself — say something like "Hi, I'm Aadhya, your career coach from Precision Match." Then honestly explain that you don't see a completed resume for them yet, so you can't tailor questions to their real experience. Offer two options conversationally: they can quickly tell you about their background out loud right now so you can run a general interview, or they can go fill in their resume in the app first for a more tailored session. Do NOT invent or assume any details about their experience, skills, or target role — you have none. Do NOT wait for the user to speak first — you initiate. Keep your tone warm and encouraging, not critical.`;

              session = await ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                callbacks: {
                  onmessage: (message: LiveServerMessage) => {
                    const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audio && clientWs.readyState === 1) {
                      clientWs.send(JSON.stringify({ audio }));
                    }
                    if (message.serverContent?.interrupted && clientWs.readyState === 1) {
                      clientWs.send(JSON.stringify({ interrupted: true }));
                    }
                  },
                },
                config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
                  },
                  systemInstruction,
                },
              });
              // Send an initial text trigger so Aadhya starts speaking immediately
              session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'Hi Aadhya, I\'m ready. Please introduce yourself and start the interview.' }] }] });
              clientWs.send(JSON.stringify({ type: 'ready' }));

              // Hard server-side cap — force-close regardless of client behavior.
              sessionTimeout = setTimeout(() => {
                if (clientWs.readyState === 1) {
                  clientWs.send(JSON.stringify({ type: 'session_ended', message: 'Session time limit reached.' }));
                }
                if (session) session.close();
                clientWs.close();
              }, MAX_VOICE_SESSION_MS);
            } else if (msg.audio && session) {
              session.sendRealtimeInput({
                audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
              });
            }
          } catch (e) {
            logger.error('Error handling WS message:', e);
          }
        });

        clientWs.on("close", () => {
             if (sessionTimeout) clearTimeout(sessionTimeout);
             if (session) session.close();
        });
      }
    } catch(err) {
       logger.error("Failed to connect to Live API", err);
       clientWs.close();
    }
  });
}

startServer();
