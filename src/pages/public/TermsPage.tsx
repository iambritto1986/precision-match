import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
      <div className="bg-[#111424] border border-white/5 rounded-3xl p-8 md:p-16">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-a:text-cyan-400">
          <p className="text-slate-300 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mb-4 mt-8">1. Acceptance of Terms</h2>
          <p className="text-slate-400 mb-4">
            By accessing or using Precision Match, you agree to be bound by these Terms of Service and all applicable laws and regulations.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">2. Use License</h2>
          <p className="text-slate-400 mb-4">
            Permission is granted to temporarily use the materials on Precision Match for personal, non-commercial viewing only. This is the grant of a license, not a transfer of title.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-8">3. Refunds and Cancellations</h2>
          <p className="text-slate-400 mb-4">
            If you are not satisfied with your purchase, you may request a refund within 7 days of your initial transaction. Subscriptions can be canceled at any time, and you will retain access to the service until the end of your billing cycle.
          </p>
        </div>
      </div>
    </div>
  );
};
