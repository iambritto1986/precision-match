import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle2, X } from 'lucide-react';

interface PricingModalProps {
  setShowPricing: (show: boolean) => void;
  user: any;
  resumeData: any;
  isPro: boolean;
}

const STRIPE_PRICE_PRO = import.meta.env.VITE_STRIPE_PRICE_PRO || '';
const STRIPE_PRICE_CREDITS = import.meta.env.VITE_STRIPE_PRICE_CREDITS || '';

export const PricingModal: React.FC<PricingModalProps> = ({ setShowPricing, user, resumeData, isPro }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      alert("Please sign in to upgrade.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
      if (!stripe) throw new Error("Stripe failed to load");

      // Verify user doc exists
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
         console.warn("User doc missing, proceeding anyway");
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           priceId,
           userId: user.uid,
           userEmail: user.email,
           mode: priceId === STRIPE_PRICE_PRO ? 'subscription' : 'payment',
           metadata: {
              resumeId: resumeData?.id || 'new'
           }
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // @ts-ignore
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (e: any) {
      console.error(e);
      alert("Checkout failed: " + e.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
       <div className="modal-container max-w-5xl w-full p-8 relative overflow-hidden modal-enter">
          <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-600" onClick={() => setShowPricing(false)}>
             <span className="sr-only">Close</span>
             <X className="w-6 h-6" />
          </button>
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

          <div className="text-center mb-10">
             <h2 className="text-3xl font-black text-white mb-4">Honest, Transparent Pricing</h2>
             <p className="text-slate-400">The resume market is full of trial traps ($2.95/14 days then $25/mo). We are doing something different. Deeply competitive flat pricing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             {/* Free Tier */}
             <div className="card p-6 flex flex-col lift-3d">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Free Tier</h3>
                <div className="text-4xl font-black text-white mb-4">$0</div>
                <p className="text-sm text-slate-400 mb-6">Perfect for trying out the platform and generating a quick resume.</p>
                <ul className="space-y-3 text-sm text-slate-300 flex-1 mb-8">
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> 3 AI Generation Credits</li>
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> 1 Free Download (PDF/Word)</li>
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> Standard Templates</li>
                </ul>
                <button onClick={() => setShowPricing(false)} className="w-full py-2.5 rounded-xl btn-secondary font-bold">{user ? 'Current Plan' : 'Dismiss'}</button>
             </div>

             {/* Top Up Credits */}
             <div className="card p-6 flex flex-col lift-3d">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-2">Additional Credits</h3>
                <div className="text-4xl font-black text-white mb-1">$3<span className="text-lg text-slate-400 font-normal">/pack</span></div>
                <p className="text-xs text-slate-500 mb-4">One-time purchase.</p>
                <p className="text-sm text-slate-600 mb-6 border-b border-slate-100 pb-4">Need a few more edits? Grab a top-up.</p>
                <ul className="space-y-3 text-sm text-slate-300 flex-1 mb-8">
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-slate-600 mr-2 mt-0.5 shrink-0"/> +10 AI Generations</li>
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-slate-600 mr-2 mt-0.5 shrink-0"/> Never expires</li>
                </ul>
                <button onClick={() => isPro ? handlePurchase(STRIPE_PRICE_CREDITS) : null} disabled={!isPro || isProcessing} className={`w-full py-2.5 rounded-xl font-bold transition-all ${isPro ? 'btn-secondary' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70'}`}>{isPro ? 'Buy Credits' : 'Requires Pro Subscription'}</button>
             </div>

             {/* Pro Tier */}
             <div className="border-2 border-blue-500/50 card p-6 flex flex-col relative shadow-[0_0_30px_rgba(59,130,246,0.15)] lift-3d">
                <div className="absolute top-0 right-0 bg-blue-500/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg rounded-tr-2xl">Most Popular</div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-2">Pro Member</h3>
                <div className="text-4xl font-black text-white mb-1">$5<span className="text-lg text-slate-400 font-normal">/mo</span></div>
                <p className="text-xs text-slate-500 mb-4">No hidden fees. Cancel anytime.</p>
                <p className="text-sm text-slate-600 mb-6 border-b border-slate-100 pb-4">Everything you need to land your dream job.</p>
                <ul className="space-y-3 text-sm text-slate-300 flex-1 mb-8">
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> <strong>100</strong> AI Generations / mo</li>
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> Auto-Cover Letters</li>
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> Live AI Voice Interview Practice</li>
                   <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> Export to MS Word (DOCX)</li>
                </ul>
                <button onClick={() => handlePurchase(STRIPE_PRICE_PRO)} disabled={isProcessing} className="w-full py-2.5 rounded-xl btn-primary">{isPro ? 'Manage Subscription' : 'Upgrade to Pro'}</button>
             </div>
          </div>
       </div>
    </div>
  );
};
