<div align="center">

# ✨ Precision Match — AI Resume Builder

**Craft job-winning resumes tailored to every opportunity, powered by Google Gemini AI.**

[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Powered by Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Stripe Payments](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🚀 What is Precision Match?

Precision Match analyzes job descriptions and intelligently rewrites your resume to highlight the most relevant skills, experience, and keywords — maximizing your chances of getting past ATS filters and landing interviews.

## ✅ Features

- 🤖 **AI-Powered Tailoring** — Gemini AI rewrites bullet points to match job requirements
- 📄 **Resume Upload** — Import your existing resume (DOCX) as a starting point
- 🎯 **Job Description Matching** — Paste any job posting and get a precision-tuned resume
- 📊 **Match Score** — See how well your resume aligns with the target role
- 📝 **Multiple Export Formats** — Download as PDF or DOCX
- 💳 **Stripe Payments** — Monetize with secure checkout for premium features
- 🔐 **Firebase Auth** — Google sign-in and user account management
- 🎨 **Beautiful UI** — Tailwind CSS + Framer Motion animations
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile

## 🛠 Tech Stack

| Layer        | Technology                                  |
| ------------ | ------------------------------------------- |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4        |
| **Backend**  | Node.js, Express, TypeScript                |
| **AI**       | Google Gemini API (`@google/genai`)         |
| **Auth**     | Firebase Authentication                     |
| **Payments** | Stripe Checkout                             |
| **Bundler**  | Vite 6 (client) + esbuild (server)          |
| **Styling**  | Tailwind CSS, Lucide Icons, Framer Motion   |
| **Export**    | jsPDF, docx, html2canvas                    |

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- (Optional) [Stripe API keys](https://dashboard.stripe.com/apikeys) for payments
- (Optional) A [Firebase project](https://console.firebase.google.com) for auth

### Install & Run

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/precision-match.git
cd precision-match

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Production Build

```bash
# Build client + server
npm run build

# Start the production server
npm run start
```

## 🔑 Environment Variables

| Variable                       | Required | Description                          |
| ------------------------------ | -------- | ------------------------------------ |
| `GEMINI_API_KEY`               | ✅       | Google Gemini API key                |
| `APP_URL`                      | ✅       | Deployed app URL or `http://localhost:3000` |
| `STRIPE_SECRET_KEY`            | 💳       | Stripe secret key (for payments)     |
| `VITE_STRIPE_PUBLISHABLE_KEY`  | 💳       | Stripe publishable key (client-side) |
| `STRIPE_WEBHOOK_SECRET`        | 💳       | Stripe webhook signing secret        |
| `GOOGLE_APPLICATION_CREDENTIALS` | ⚙️     | Path to Firebase service account JSON |

> Copy `.env.example` to `.env.local` and fill in your values. See the comments in `.env.example` for details on where to obtain each key.

## 🚢 Deployment

### Render.com (Recommended)

1. Push your repo to GitHub
2. Connect to [Render](https://render.com) and create a new **Web Service**
3. Render will auto-detect `render.yaml` and configure the build
4. Add your environment variables in the Render dashboard
5. Deploy!

### Heroku

```bash
heroku create precision-match
heroku config:set GEMINI_API_KEY=your_key_here
# Set other env vars...
git push heroku main
```

### Any Node.js Host

```bash
npm install
npm run build
npm run start
```

The production server listens on `PORT` (default: 3000).

## 📸 Screenshots

<!-- Add screenshots of your app here -->
<!-- ![Dashboard](./assets/screenshot-dashboard.png) -->
<!-- ![Resume Builder](./assets/screenshot-builder.png) -->

*Screenshots coming soon!*

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m "Add my feature"`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

Please make sure your code passes `npm run lint` before submitting.

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Built with ❤️ using Google Gemini AI</strong>
</div>
