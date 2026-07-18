import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import 'dotenv/config';
import { WebSocketServer } from 'ws';
import mammoth from 'mammoth';
import Stripe from 'stripe';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

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
        console.warn(`FIREBASE_SERVICE_ACCOUNT_PATH set to "${saPath}" but file not found. Falling back.`);
      }
    }

    if (!credential) {
      try {
        credential = applicationDefault();
      } catch {
        console.warn('Application Default Credentials not available. Firebase Admin will not be initialised.');
      }
    }

    if (credential) {
      firebaseAdminApp = initializeApp({
        credential,
        projectId: config.projectId,
      });
      // Store database id for reference
      firebaseAdminApp.customDatabaseId = config.firestoreDatabaseId;
    }
  } else {
    console.warn('firebase-applet-config.json not found – Firebase Admin is disabled.');
  }
} catch (e) {
  console.warn("Failed to initialize Firebase Admin (non-fatal):", e);
}

const getDb = () => {
    if (!firebaseAdminApp) return null;
    return getFirestore(firebaseAdminApp, firebaseAdminApp.customDatabaseId);
};

const stripeClient = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as any
}) : null;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
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

  // Stripe webhook needs raw body
  app.post("/api/webhooks/stripe", express.raw({type: 'application/json'}), async (req, res) => {
    if (!stripeClient || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("Stripe webhook received but keys missing.");
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
        
        console.log(`Payment successful for user ID: ${userId}`);
        
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
              console.log(`Upgraded user ${userId} to Pro and granted 100 credits`);
            } else if (session.mode === 'payment') {
              await userRef.update({
                  credits: FieldValue.increment(10)
              });
              console.log(`Added 10 credits to user ${userId}`);
            }
          } else {
             console.error("Firebase Admin DB not initialized to fulfill order.");
          }
        }
      } else {
        console.log(`Unhandled event type ${event.type}`);
      }

      res.status(200).end();
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
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
      console.error("Refund error:", e);
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
      console.error('Checkout session error:', err);
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
      console.error('Portal session error:', err);
      res.status(500).json({ error: err.message, code: "PORTAL_FAILED" });
    }
  });

  app.post("/api/extract-linkedin", async (req, res) => {
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
      console.error(e);
      res.status(500).json({ error: e.message, code: "LINKEDIN_EXTRACT_FAILED" });
   }
});


  app.post("/api/extract-resume", async (req, res) => {
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
      console.error(e);
      res.status(500).json({ error: e.message, code: "RESUME_EXTRACT_FAILED" });
    }
  });

  app.post("/api/generate-resume", async (req, res) => {
    try {
      const { baseData, jobDescription, instructions } = req.body;
      if (!baseData || typeof baseData !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: baseData", code: "VALIDATION_ERROR" });
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

Ensure the content highlights relevant skills and experiences for the job description. Do not add fictitious information.
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
      console.error(e);
      res.status(500).json({ error: e.message, code: "RESUME_GENERATE_FAILED" });
    }
  });

  app.post("/api/generate-cover-letter", async (req, res) => {
    try {
      const { baseData, jobDescription } = req.body;
      if (!baseData || typeof baseData !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: baseData", code: "VALIDATION_ERROR" });
      }
      if (!jobDescription || typeof jobDescription !== 'string') {
        return res.status(400).json({ error: "Missing or invalid required field: jobDescription", code: "VALIDATION_ERROR" });
      }
      
      const prompt = `
You are an expert executive cover letter writer.
Based on the candidate's experience and the job description, write a compelling, tailored cover letter.

Candidate Experience:
${baseData}

Target Job Description:
${jobDescription}

Write the cover letter in professional plain text matching standard business letter format.
Include placeholders like [Hiring Manager Name] or [Company Name] where appropriate if not found.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });

      res.json({ text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message, code: "COVER_LETTER_FAILED" });
    }
  });

  app.post("/api/ats-score", async (req, res) => {
    try {
      const { resumeData, jobDescription } = req.body;
      if (!resumeData || !jobDescription) {
        return res.status(400).json({ error: "Missing resumeData or jobDescription", code: "VALIDATION_ERROR" });
      }

      const prompt = `
You are an expert ATS (Applicant Tracking System) algorithm and senior technical recruiter.
Analyze the provided resume against the job description.
Return a JSON object with EXACTLY the following structure:
{
  "score": number (0-100 indicating how well the resume matches the JD),
  "matchedKeywords": string[] (important keywords from the JD that are present in the resume),
  "missingKeywords": string[] (important keywords from the JD that are missing in the resume)
}
Be strict and realistic. Do not give a 100% score unless it is a perfect match.

Resume:
${JSON.stringify(resumeData)}

Job Description:
${jobDescription}
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
      res.json(result);
    } catch (e: any) {
      console.error("ATS Score error:", e);
      res.status(500).json({ error: e.message, code: "ATS_SCORE_FAILED" });
    }
  });

  app.post('/api/chat', async (req, res) => {
     try {
        const { messages, thinkingMode, resumeContext } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required', code: 'VALIDATION_ERROR' });
        }
        
        const modelName = thinkingMode ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite";
        const config: any = {};
        if (resumeContext) {
           config.systemInstruction = `You are an AI Career Advisor. You have access to the user's current resume:\n${resumeContext}\nUse this context to give tailored advice.`;
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
         console.error('Chat error:', e);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  wss.on("connection", async (clientWs, req) => {
    try {
      if (req.url === '/api/live') {
        let session: any = null;

        clientWs.on("message", async (data) => {
          try {
            const msg = JSON.parse(data.toString());
            
            if (msg.type === 'setup') {
              const resumeContext = msg.data || '';
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
                  systemInstruction: `You are a helpful AI career coach. You help the user practice interviews, refine their resume, and discuss career goals. Here is context about the candidate's custom resume:\n${resumeContext}`,
                },
              });
              clientWs.send(JSON.stringify({ type: 'ready' }));
            } else if (msg.audio && session) {
              session.sendRealtimeInput({
                audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
              });
            }
          } catch (e) {
            console.error('Error handling WS message:', e);
          }
        });

        clientWs.on("close", () => {
             if (session) session.close();
        });
      }
    } catch(err) {
       console.error("Failed to connect to Live API", err);
       clientWs.close();
    }
  });
}

startServer();
