import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Rocket } from 'lucide-react';

interface ChangelogModalProps {
  version: string;
  changelog: string[];
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ version, changelog, onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center px-4 backdrop-enter">
      {/* Dark overlay with blur */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg glass-card-3d rounded-2xl overflow-hidden modal-enter border border-white/10 shadow-2xl">
        {/* Header Graphic */}
        <div className="relative h-32 bg-gradient-to-br from-indigo-900 via-slate-900 to-black overflow-hidden flex items-center justify-center">
           {/* Abstract shapes */}
           <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
           <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 mb-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] glow-pulse">
                <Rocket className="w-6 h-6 text-[#00F0FF]" />
             </div>
             <h2 className="text-xl font-bold text-white tracking-wide">Update Successful!</h2>
           </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                What's New in v{version}
             </h3>
             <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium uppercase tracking-wider">
               Latest
             </span>
          </div>

          <div className="space-y-3 mb-8 stagger-enter">
            {changelog.map((item, idx) => (
              <div key={idx} className="flex items-start bg-white/5 border border-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mt-2 mr-3 shadow-[0_0_5px_#00F0FF] shrink-0" />
                <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-semibold tracking-wide transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] tilt-3d"
          >
            Awesome, let's go!
          </button>
        </div>

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all backdrop-blur-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
