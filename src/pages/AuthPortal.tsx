import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ParticleNetworkBackground } from '../components/ParticleNetworkBackground';
import { LiquidGlassBackground } from '../components/LiquidGlassBackground';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * AuthPortal — Login/Registration page with Liquid Glass UI
 * 
 * Built from UI/UX Pro Max Style #14 (Liquid Glass) + Style #15 (Motion-Driven):
 *   - Iridescent morphing blobs visible through the glass card
 *   - Chromatic aberration on the title
 *   - backdrop-filter: blur(15px) saturate(180%) per spec
 *   - Specular inner-shadow highlights for glass thickness
 *   - Spring physics on toggle (stiffness: 400, damping: 25)
 *   - Dynamic randomization — different every login
 */

export const AuthPortal: React.FC = () => {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false); // Default to signup as requested
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.uid !== 'local-guest-uid') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
        // Note: Full Name isn't currently supported by registerWithEmail in AuthContext,
        // but we collect it as requested in the design.
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  };

  // Shared glass input styling
  const glassInputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.06] focus:border-cyan-400/40 focus:shadow-[0_0_20px_rgba(0,240,255,0.12)] transition-all duration-200";

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0a0514] font-inter overflow-hidden">
      {/* Layer 1: Iridescent liquid glass blobs (deepest) */}
      <LiquidGlassBackground />
      
      {/* Layer 2: Interactive particle network (on top of blobs, behind card) */}
      <ParticleNetworkBackground />
      
      {/* Layer 3: Liquid Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* The glass panel itself */}
        <div
          className="rounded-3xl p-8 overflow-hidden relative"
          style={{
            background: 'rgba(15, 11, 30, 0.55)',
            backdropFilter: 'blur(15px) saturate(180%)',
            WebkitBackdropFilter: 'blur(15px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.06), 0 0 40px rgba(0, 240, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Specular top-edge highlight (glass thickness illusion) */}
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 10%, rgba(0, 240, 255, 0.15) 30%, rgba(181, 0, 255, 0.12) 70%, transparent 90%)',
            }}
          />

          {/* Title with chromatic aberration */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-black text-white tracking-[0.2em] mb-2"
              style={{
                textShadow: '2px 0 0 rgba(0, 240, 255, 0.3), -2px 0 0 rgba(181, 0, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.15)',
              }}
            >
              PORTAL
            </h1>
            <p className="text-white/50 text-sm tracking-wide">Access the precision network</p>
          </div>

          {/* Toggle Interface — spring physics per Motion-Driven spec */}
          <div className="flex bg-black/20 rounded-xl p-1 mb-8 border border-white/[0.06] relative"
            style={{ boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)' }}
          >
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${
                !isLogin ? 'text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              New User Signup
            </button>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${
                isLogin ? 'text-white' : 'text-white/35 hover:text-white/60'
              }`}
            >
              Existing User Login
            </button>
            <motion.div
              layout
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg z-0"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.08), 0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
              initial={false}
              animate={{ left: isLogin ? 'calc(50% + 2px)' : '4px' }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full p-3 mb-6 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs text-center"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {!isLogin && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={glassInputClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout>
              <input
                type="email"
                placeholder="Email Address"
                className={glassInputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div layout>
              <input
                type="password"
                placeholder="Password"
                className={glassInputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </motion.div>

            <AnimatePresence mode="popLayout">
              {isLogin && (
                <motion.div
                  key="login-options"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between mt-1 text-sm px-1"
                >
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox bg-black/30 border-white/15 text-cyan-500 rounded focus:ring-0 focus:ring-offset-0"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-white/40 group-hover:text-white/70 transition-colors duration-200">Remember Me</span>
                  </label>
                  <a href="#" className="text-cyan-400/70 hover:text-cyan-300 hover:underline transition-all duration-200">
                    Forgot Password?
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button with iridescent gradient */}
            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full mt-5 relative overflow-hidden group text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.7) 0%, rgba(79, 70, 229, 0.8) 50%, rgba(181, 0, 255, 0.7) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 0 25px rgba(0, 240, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Hover sweep overlay */}
              <div className="absolute inset-0 bg-white/15 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center drop-shadow-sm">
                {isLogin ? (
                  <><LogIn className="w-5 h-5 mr-2" /> Authenticate</>
                ) : (
                  <><UserPlus className="w-5 h-5 mr-2" /> Create Account</>
                )}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4 px-2">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Google button — glass nested */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            className="w-full mt-8 text-white font-medium py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.04)',
            }}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-3 opacity-80" />
            Continue with Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
