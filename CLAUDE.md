# Precision Match: AI Assistant Context & Grounding

This document serves as the absolute source of truth for Claude and other AI assistants working on this codebase. Please read this before proposing or making changes.

## 1. Tech Stack
*   **Frontend**: React 18, TypeScript, Vite, Tailwind CSS.
*   **Backend**: Node.js / Express (all housed within `server.ts`), ESBuild.
*   **Database & Auth**: Firebase (Auth & Firestore).
*   **AI Provider**: Google Gemini (`@google/genai` SDK) for text generation and WebSockets for Gemini Live voice interviews.
*   **Payments**: Stripe.
*   **Email**: Resend.

## 2. Project Settings & Environments
*   **Production Domain**: `https://precision-match.com` (Ensure all SEO, canonicals, and sitemaps point here, NOT to `precision-match.onrender.com`).
*   **Firebase Project**: The actual production Firebase project ID is **`precision-match-745b2`**. 
    *   *CRITICAL:* Do NOT rely on `firebase-applet-config.json` for backend initialization. The backend `firebase-admin` SDK must prioritize `.env` variables (`VITE_FIREBASE_PROJECT_ID`) so it connects to the real production project and database (`default`), rather than legacy AI Studio environments.
*   **Hosting**: The app is deployed as a single full-stack instance on Render.

## 3. Design System & Brand Identity
*   **Core Palette**: The brand relies on a strict dark mode aesthetic with vibrant neon glow accents.
    *   **Primary Cyan**: `#00F0FF` (`--accent-primary` in CSS)
    *   **Secondary Magenta**: `#B500FF` (`--accent-secondary` in CSS)
    *   *Rule:* Do NOT use generic Tailwind colors (e.g., `text-blue-500`, `bg-purple-600`). Use the CSS tokens. 
    *   *Tailwind Opacity Exception:* Because Tailwind opacity modifiers (like `/20`) do not work with CSS variables, you must use hex literals for those specific cases (e.g., `bg-[#00F0FF]/20`).
*   **Logo / Brand Mark**: Handled by the `<AnimatedLogo />` component.
    *   For persistent UI badges, use `animated={false}` and `hoverPlay={true}` so it isn't distracting.
    *   For loading states, use `animated={true}`.

## 4. Architectural Rules & Constraints
*   **Do Not Touch**: Do not modify `ParticleNetworkBackground` or the internal template logic inside `ResumeTemplates.tsx` unless explicitly asked.
*   **Reference Materials**: The `UI_UX_Skill/` folder contains reference materials. Do NOT delete it as technical debt.
*   **Auth Enforcement**: All AI endpoints in `server.ts` are protected by a `requireAuth` middleware that verifies Firebase ID tokens. The frontend must pass `{ Authorization: 'Bearer <token>' }` in headers or the `idToken` payload via WebSockets.
*   **Credit System**: AI generation has a server-side credit limit enforced via `checkAndConsume` in `server.ts`. 

## 5. Known Quirks
*   **Linting**: Running `tsc --noEmit` might throw some `TS2769` (overload mismatch) errors related to `logger.error` in `server.ts`. These are known legacy issues and do not block production deployment.
*   **Guest Mode**: `isGuestMode` in `App.tsx` is dead code. All users reaching the dashboard have a real Firebase Auth session.
