import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="bg-[#111424] border border-white/5 rounded-3xl p-8 md:p-16">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-a:text-cyan-400">
          <p className="text-slate-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">1. Information We Collect</h2>
          <p className="text-slate-400 mb-4">
            We collect information you provide directly to us, such as when you create or modify your account, use our services, or communicate with us. This may include your name, email address, resume content, and payment information.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">2. How We Use Your Information</h2>
          <p className="text-slate-400 mb-4">
            We use the information we collect to provide, maintain, and improve our services. Specifically, we use your resume data and job descriptions to generate tailored resumes using AI. We do not sell your personal data to third parties.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">3. Data Security</h2>
          <p className="text-slate-400 mb-4">
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. Your data is stored securely using modern encryption standards.
          </p>
        </div>
      </div>
    </div>
  );
};
