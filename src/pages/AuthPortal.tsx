import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { ParticleNetworkBackground } from '../components/ParticleNetworkBackground';
import { LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0f0b1e] font-inter overflow-hidden">
      <ParticleNetworkBackground />
      
      {/* Floating Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-slate-900/40 border border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.15)] rounded-2xl p-8 overflow-hidden">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-wider mb-2">PORTAL</h1>
            <p className="text-slate-400 text-sm">Access the precision network</p>
          </div>

          {/* Toggle Interface */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 mb-8 border border-white/5 relative">
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all z-10 ${
                !isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New User Signup
            </button>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all z-10 ${
                isLogin ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Existing User Login
            </button>
            <motion.div
              layout
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-indigo-500/20 border border-indigo-500/50 rounded-md z-0"
              initial={false}
              animate={{ left: isLogin ? 'calc(50% + 2px)' : '4px' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-3 mb-6 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs text-center"
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
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
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
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div layout>
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
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
                  className="flex items-center justify-between mt-1 text-sm"
                >
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="form-checkbox bg-slate-900 border-slate-700 text-indigo-500 rounded focus:ring-0 focus:ring-offset-0"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember Me</span>
                  </label>
                  <a href="#" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-all">
                    Forgot Password?
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center"
            >
              {isLogin ? (
                <><LogIn className="w-5 h-5 mr-2" /> Authenticate</>
              ) : (
                <><UserPlus className="w-5 h-5 mr-2" /> Create Account</>
              )}
            </motion.button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-700/50" />
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-slate-700/50" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            className="w-full mt-8 bg-slate-800/50 border border-slate-700 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center hover:border-slate-500"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-3 opacity-90" />
            Continue with Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
