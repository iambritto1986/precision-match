import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
  onOpenSupport: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, onOpenSupport }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
      <div className="modal-container max-w-2xl w-full flex flex-col max-h-[85vh] modal-enter bg-[#0d111d] border border-white/10 rounded-2xl shadow-2xl">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-slate-300 leading-relaxed space-y-4">
          {type === 'privacy' ? (
            <>
              <p><strong>Last Updated:</strong> July 2026</p>
              <p>Precision Match (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy and ensuring compliance with applicable data protection laws, including the GDPR and CCPA. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
              <h3 className="font-bold text-white text-base">Information We Collect</h3>
              <p>We collect information you provide directly: your name, email address (via Google Sign-In), resume content (employment history, education, skills, contact details), and job descriptions you submit for AI tailoring.</p>
              <h3 className="font-bold text-white text-base">How We Use Your Information (AI Consent)</h3>
              <p>Your data is used solely to: generate and tailor resumes using AI, provide the app&apos;s core functionality, process payments via Stripe, and improve our service. <strong>By using our service, you explicitly consent to your resume data and job descriptions being processed by Google Gemini AI</strong> to generate tailored content. We do <strong>not</strong> sell your personal data to third parties.</p>
              <h3 className="font-bold text-white text-base">Data Storage &amp; Security</h3>
              <p>Data is stored securely in Google Cloud Firestore with encryption at rest and in transit. Access is restricted by Firebase Security Rules that ensure users can only access their own data.</p>
              <h3 className="font-bold text-white text-base">Third-Party Services</h3>
              <p>We use Google Gemini AI (to process resumes), Stripe (to process payments securely—we never store your credit card details), and Firebase (for authentication and storage). Each service operates under its respective strict privacy guidelines.</p>
              <h3 className="font-bold text-white text-base">Your Data Rights (GDPR &amp; CCPA)</h3>
              <p>You have the right to access, update, or delete your personal data at any time. You may delete your account and all associated data permanently using the &quot;Delete Account&quot; option in the sidebar. To request a copy of your data, please contact us.</p>
              <h3 className="font-bold text-white text-base">Contact</h3>
              <p>For privacy inquiries or data requests, <button onClick={() => { onClose(); onOpenSupport(); }} className="text-blue-400 hover:text-blue-300 underline">contact support</button>.</p>
            </>
          ) : (
            <>
              <p><strong>Last Updated:</strong> July 2026</p>
              <p>By using Precision Match, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
              <h3 className="font-bold text-white text-base">Service Description</h3>
              <p>Precision Match is an AI-powered resume builder that helps users create and tailor resumes. The service uses advanced artificial intelligence to generate content suggestions based on the information you provide.</p>
              <h3 className="font-bold text-white text-base">AI-Generated Content Disclaimer</h3>
              <p><strong>Important:</strong> AI-generated resume content is provided as suggestions only. You are solely responsible for reviewing, verifying, and approving all content before using it in job applications. We do not guarantee the accuracy, completeness, or effectiveness of AI-generated content, nor do we guarantee job placement or interview success.</p>
              <h3 className="font-bold text-white text-base">User Responsibilities</h3>
              <p>You agree to: provide accurate information, review all AI-generated content for accuracy, not use the service for illegal or fraudulent purposes, and not attempt to abuse, scrape, or circumvent rate limits or security measures of the platform.</p>
              <h3 className="font-bold text-white text-base">Payments &amp; Billing (Stripe)</h3>
              <p>Payments for premium features and credits are processed securely through Stripe. By completing a purchase, you agree to provide current, complete, and accurate billing information. All charges are final. Refund requests are evaluated on a case-by-case basis; please contact support within 7 days of your purchase if you experience a technical failure.</p>
              <h3 className="font-bold text-white text-base">Limitation of Liability</h3>
              <p>Precision Match is provided &quot;as is&quot; without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our service or AI-generated resume content.</p>
              <h3 className="font-bold text-white text-base">Changes to Terms</h3>
              <p>We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of any updated terms.</p>
              <h3 className="font-bold text-white text-base">Contact</h3>
              <p>For questions about these terms, <button onClick={() => { onClose(); onOpenSupport(); }} className="text-blue-400 hover:text-blue-300 underline">contact support</button>.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
