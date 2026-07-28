import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Wand2, Upload, Download, Sparkles, ShieldCheck, CreditCard, RefreshCw, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8">
              Land more interviews with <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">AI-tailored resumes.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
              Precision Match uses Gemini AI to instantly analyze job descriptions and optimize your resume to match. Beat the Applicant Tracking Systems (ATS) and get hired faster.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/auth/register"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black text-lg font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2"
              >
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/15 text-white text-lg font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                See how it works <ChevronDown className="w-5 h-5" />
              </a>
            </div>
            <p className="text-slate-400 text-sm mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4 text-slate-500" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-slate-500" /> 3 free AI credits to start</span>
            </p>
          </motion.div>
        </div>

        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* Trust Strip */}
      <section className="py-8 border-y border-white/5 bg-[#0a0c16]/30 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-medium text-slate-400">
          <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> Powered by Google Gemini AI</span>
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-400" /> Secure sign-in with Firebase</span>
          <span className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Free plan, no credit card</span>
          <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-cyan-400" /> Cancel your subscription anytime</span>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-[#0a0c16]/50 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">How it works</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">Three simple steps to a perfectly tailored resume that catches the recruiter's eye.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-[#111424] border border-white/5 p-8 rounded-3xl relative group overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-6">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Upload Resume</h3>
              <p className="text-slate-400 leading-relaxed">
                Upload your base resume in PDF or DOCX format. We'll securely parse your experience and skills.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#111424] border border-white/5 p-8 rounded-3xl relative group overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
                <Wand2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. AI Optimization</h3>
              <p className="text-slate-400 leading-relaxed">
                Paste the job description. Our Gemini AI engine intelligently highlights your most relevant qualifications.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#111424] border border-white/5 p-8 rounded-3xl relative group overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                <Download className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Export & Apply</h3>
              <p className="text-slate-400 leading-relaxed">
                Download your perfectly formatted, ATS-friendly PDF and apply with absolute confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Built to beat the ATS.</h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Most companies use Applicant Tracking Systems (ATS) that filter out resumes missing key keywords. Our AI ensures your resume speaks the exact language the employer is looking for.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Instant Keyword Matching</h4>
                    <p className="text-slate-400 text-sm">Automatically integrates the exact keywords from the JD.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Impactful Phrasing</h4>
                    <p className="text-slate-400 text-sm">Rewrites your bullet points to sound more professional and action-oriented.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">Cover Letter Generation</h4>
                    <p className="text-slate-400 text-sm">Generate matching cover letters in a single click.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-3xl blur-2xl opacity-20"></div>
              <div className="bg-[#111424] border border-white/10 rounded-3xl p-3 relative shadow-2xl overflow-hidden">
                <img
                  src="/logo-tech.png"
                  alt="Precision Match resume builder interface showing a resume being tailored to a job description with a live PDF preview"
                  className="w-full h-auto rounded-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to land your dream job?</h2>
          <p className="text-xl text-slate-400 mb-10">Start with 3 free AI credits. No credit card, no risk — upgrade only if it works for you.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/register"
              className="inline-flex px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-lg font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all hover:scale-105 items-center gap-2"
            >
              Create Your Free Resume <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex px-8 py-4 rounded-full border border-white/15 text-white text-lg font-bold hover:bg-white/5 transition-colors items-center gap-2"
            >
              View Pricing
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-6">Free forever plan available. Pro is $5/mo, cancel anytime.</p>
        </div>
      </section>
    </div>
  );
};
