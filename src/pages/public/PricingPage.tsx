import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Simple, transparent pricing.</h1>
        <p className="text-xl text-slate-400">Everything you need to land your dream job, for a flat monthly price.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Tier */}
        <div className="bg-[#111424] border border-white/5 p-10 rounded-3xl flex flex-col hover:border-cyan-500/30 transition-colors">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Free Tier</h3>
          <div className="text-5xl font-black text-white mb-4">$0</div>
          <p className="text-slate-400 mb-8 border-b border-white/5 pb-8">Perfect for trying out the platform and generating a quick resume.</p>
          <ul className="space-y-4 text-slate-300 flex-1 mb-10">
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-cyan-500 mr-3 shrink-0"/> 3 AI Generation Credits</li>
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-cyan-500 mr-3 shrink-0"/> 1 Free Download (PDF/Word)</li>
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-cyan-500 mr-3 shrink-0"/> Standard Templates</li>
          </ul>
          <Link to="/auth/register" className="w-full py-4 rounded-xl font-bold text-center border border-white/10 hover:bg-white/5 transition-colors">Get Started Free</Link>
        </div>

        {/* Pro Tier */}
        <div className="bg-[#111424] border-2 border-indigo-500/50 p-10 rounded-3xl flex flex-col relative shadow-[0_0_40px_rgba(99,102,241,0.15)]">
          <div className="absolute top-0 right-8 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-b-lg">Most Popular</div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-2">Pro Member</h3>
          <div className="text-5xl font-black text-white mb-1">$5<span className="text-xl text-slate-400 font-normal">/mo</span></div>
          <p className="text-slate-400 mb-8 border-b border-white/5 pb-8">Everything you need to land your dream job without limits.</p>
          <ul className="space-y-4 text-slate-300 flex-1 mb-10">
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0"/> <strong>100</strong> AI Generations / mo</li>
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0"/> Auto-Cover Letters</li>
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0"/> Live AI Voice Interview Practice</li>
            <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-indigo-500 mr-3 shrink-0"/> Export to MS Word (DOCX)</li>
          </ul>
          <Link to="/auth/register" className="w-full py-4 rounded-xl font-bold text-center bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-lg">Upgrade to Pro</Link>
        </div>
      </div>
    </div>
  );
};
