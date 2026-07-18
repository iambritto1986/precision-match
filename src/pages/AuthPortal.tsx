import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ParticleNetworkBackground } from '../components/ParticleNetworkBackground';
import ParticleText from '../components/ParticleText';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * AuthPortal — Login/Registration page
 * 
 * Aesthetic: Soft UI Evolution (Mature 3D / Refined Neumorphism)
 * - Retains the ParticleNetworkBackground for the tech/precision theme
 * - Cards are "extruded" (convex) using soft multi-layer outer shadows + a bright top inner edge
 * - Inputs are "inset" (concave) using inner shadows, creating depth
 * - Buttons are extruded but push in on tap (scale 0.98)
 * - Animations are smooth 200-300ms transitions
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

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

  // --- Mature 3D Styles ---
  
  // The main container looks like it is slightly raised off the background
  const extrudedCardStyle = {
    backgroundColor: '#0d111d', // Slightly lighter than background to stand out
    border: '1px solid rgba(255,255,255,0.03)',
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.05), /* Subtle top edge highlight */
      0 10px 15px -3px rgba(0, 0, 0, 0.5),    /* Soft medium shadow */
      0 4px 6px -2px rgba(0, 0, 0, 0.3),      /* Tight dark shadow */
      0 0 0 1px rgba(0, 0, 0, 0.5)            /* Crisp edge */
    `,
  };

  // Inputs look like they are carved into the surface
  const insetInputStyle = {
    backgroundColor: '#090b14', // Darker than card
    border: '1px solid transparent', // Managed by tailwind on focus
    boxShadow: `
      inset 0 2px 4px rgba(0, 0, 0, 0.5),     /* Top inner shadow (depth) */
      inset 0 0 2px rgba(0, 0, 0, 0.8),       /* Hard inner edge */
      0 1px 0 rgba(255, 255, 255, 0.03)       /* Bottom outer highlight */
    `,
  };

  // Buttons are raised but press in
  const extrudedButtonStyle = {
    boxShadow: `
      inset 0 1px 0 rgba(255, 255, 255, 0.2), /* Top highlight */
      0 4px 6px -1px rgba(0, 0, 0, 0.5),      /* Drop shadow */
      0 2px 4px -1px rgba(0, 0, 0, 0.3)
    `,
  };

  const insetToggleContainerStyle = {
    backgroundColor: '#0a0d17',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.02)',
  };

  const extrudedToggleThumbStyle = {
    backgroundColor: '#1e293b',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#070911] font-inter overflow-hidden">
      <ParticleNetworkBackground />
      
      {/* Mature 3D Extruded Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div 
          className="rounded-2xl p-8 overflow-hidden transition-all duration-300"
          style={extrudedCardStyle}
        >
          
          <div className="text-center mb-8 relative">
            <div className="h-24 w-full flex items-center justify-center">
              <ParticleText 
                text="PORTAL" 
                fontSize={64} 
                particleSize={6} 
                particleCount={40} 
                mouseRadius={80} 
                colors={["#FFFFFF", "#00F0FF", "#3b82f6"]} 
              />
            </div>
            <p className="text-slate-400 text-sm font-medium mt-2">Access the precision network</p>
          </div>

          {/* Toggle Interface (Inset Track, Extruded Thumb) */}
          <div 
            className="flex rounded-lg p-1 mb-8 relative"
            style={insetToggleContainerStyle}
          >
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 z-10 ${
                !isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              New User Signup
            </button>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 z-10 ${
                isLogin ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Existing User Login
            </button>
            <motion.div
              layout
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md z-0"
              style={extrudedToggleThumbStyle}
              initial={false}
              animate={{ left: isLogin ? 'calc(50% + 2px)' : '4px' }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-3 mb-6 rounded-lg bg-red-900/30 border border-red-500/20 text-red-300 text-xs text-center font-medium"
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
                  transition={{ duration: 0.25 }}
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c101d] transition-all duration-200 border border-transparent"
                    style={insetInputStyle}
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
                className="w-full rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c101d] transition-all duration-200 border border-transparent"
                style={insetInputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div layout>
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c101d] transition-all duration-200 border border-transparent"
                style={insetInputStyle}
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
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-between mt-2 text-sm px-1"
                >
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox bg-[#090b14] border-slate-700 text-indigo-500 rounded focus:ring-0 focus:ring-offset-0 transition-colors"
                      style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember Me</span>
                  </label>
                  <button type="button" onClick={() => { setShowResetPassword(true); setResetEmail(email); setResetSent(false); setResetError(''); }} className="text-cyan-500 hover:text-cyan-400 transition-colors font-medium">
                    Forgot Password?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
              type="submit"
              className="w-full mt-6 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-indigo-400/20"
              style={extrudedButtonStyle}
            >
              {isLogin ? (
                <><LogIn className="w-5 h-5 mr-2 drop-shadow-sm" /> Authenticate</>
              ) : (
                <><UserPlus className="w-5 h-5 mr-2 drop-shadow-sm" /> Create Account</>
              )}
            </motion.button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-800" />
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-800" />
          </div>

          <motion.button
            whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.98, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
            onClick={handleGoogle}
            className="w-full mt-8 bg-gradient-to-b from-slate-800 to-slate-900 text-white font-medium py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center border border-slate-700"
            style={extrudedButtonStyle}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-3 opacity-90 drop-shadow-sm" />
            Continue with Google
          </motion.button>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showResetPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetPassword(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm mx-4 rounded-2xl p-8"
              style={extrudedCardStyle}
              onClick={(e) => e.stopPropagation()}
            >
              {!resetSent ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                  <p className="text-slate-400 text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>

                  {resetError && (
                    <div className="w-full p-3 mb-4 rounded-lg bg-red-900/30 border border-red-500/20 text-red-300 text-xs text-center font-medium">
                      {resetError}
                    </div>
                  )}

                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:bg-[#0c101d] transition-all duration-200 border border-transparent mb-4"
                    style={insetInputStyle}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoFocus
                  />

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.98, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
                      type="button"
                      onClick={() => setShowResetPassword(false)}
                      className="flex-1 bg-gradient-to-b from-slate-800 to-slate-900 text-white font-medium py-3 rounded-lg transition-all duration-200 border border-slate-700"
                      style={extrudedButtonStyle}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
                      whileTap={{ scale: 0.98, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
                      type="button"
                      onClick={async () => {
                        setResetError('');
                        try {
                          await sendPasswordResetEmail(auth, resetEmail);
                          setResetSent(true);
                        } catch (err: any) {
                          setResetError(err.message || 'Failed to send reset email');
                        }
                      }}
                      className="flex-1 bg-gradient-to-b from-cyan-600 to-cyan-800 text-white font-bold py-3 rounded-lg transition-all duration-200 border border-cyan-500/20"
                      style={extrudedButtonStyle}
                    >
                      Send Link
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
                  <p className="text-slate-400 text-sm mb-6">We've sent a password reset link to <span className="text-cyan-400 font-medium">{resetEmail}</span>. Check your inbox and follow the instructions.</p>
                  <motion.button
                    whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
                    whileTap={{ scale: 0.98, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="w-full bg-gradient-to-b from-indigo-500 to-indigo-700 text-white font-bold py-3 rounded-lg transition-all duration-200 border border-indigo-400/20"
                    style={extrudedButtonStyle}
                  >
                    Back to Login
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
