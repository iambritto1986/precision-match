import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticleNetworkBackground } from '../components/ParticleNetworkBackground';
import ParticleText from '../components/ParticleText';

/**
 * NotFoundPage — A styled 404 page matching the deep-space dark theme.
 * Shown when users navigate to an unknown route.
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#030712] font-inter overflow-hidden">
      <ParticleNetworkBackground />
      
      <div className="relative z-10 text-center px-6">
        {/* Glowing 404 Particles */}
        <div className="h-40 w-full flex items-center justify-center mb-4">
          <ParticleText 
            text="404" 
            fontSize={120} 
            particleSize={8} 
            particleCount={60} 
            mouseRadius={100} 
            colors={["#FFFFFF", "#00F0FF", "#B500FF"]} 
          />
        </div>

        <h2 className="text-2xl font-bold text-white tracking-wider mb-3 uppercase">
          Signal Lost
        </h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          The page you're looking for doesn't exist in this network. 
          It may have been moved or the link may be incorrect.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-cyan-400 font-semibold text-sm rounded-lg hover:border-cyan-400/50 hover:bg-cyan-500/30 transition-all duration-200 uppercase tracking-wider"
          >
            Return to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 font-medium text-sm rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};
