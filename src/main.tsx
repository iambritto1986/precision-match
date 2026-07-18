import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
const Router = navigator.userAgent.includes('Electron') ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);

