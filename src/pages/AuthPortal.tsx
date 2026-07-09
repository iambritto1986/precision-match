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
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#0a0514] font-inter overflow-hidden">
      <ParticleNetworkBackground />
      
      {/* Animated Background Blobs for Liquid Refraction */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[100px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/4 w-[800px] h-[400px] bg-indigo-500/30 rounded-full blur-[100px] mix-blend-screen"
        />
      </div>

      {/* Floating Liquid Glass Container */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-[40px] bg-white/[0.02] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_40px_rgba(79,70,229,0.15)] rounded-3xl p-8 overflow-hidden">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-widest mb-2 drop-shadow-md">PORTAL</h1>
            <p className="text-white/60 text-sm tracking-wide">Access the precision network</p>
          </div>

          {/* Toggle Interface */}
          <div className="flex bg-black/20 rounded-xl p-1 mb-8 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.3)] relative">
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 ${
                !isLogin ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              New User Signup
            </button>
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 ${
                isLogin ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Existing User Login
            </button>
            <motion.div
              layout
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 border border-white/20 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] z-0"
              initial={false}
              animate={{ left: isLogin ? 'calc(50% + 2px)' : '4px' }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full p-3 mb-6 rounded-xl bg-red-500/20 border border-red-500/40 text-red-100 text-xs text-center backdrop-blur-md"
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
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.05] focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
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
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.05] focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div layout>
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:bg-white/[0.05] focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all"
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
                      className="form-checkbox bg-black/30 border-white/20 text-cyan-500 rounded focus:ring-0 focus:ring-offset-0"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-white/50 group-hover:text-white/80 transition-colors">Remember Me</span>
                  </label>
                  <a href="#" className="text-cyan-400/80 hover:text-cyan-300 hover:underline transition-all">
                    Forgot Password?
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full mt-6 relative overflow-hidden group bg-gradient-to-r from-cyan-500/80 to-indigo-500/80 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-3.5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center border border-white/20"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative z-10 flex items-center drop-shadow-md">
                {isLogin ? (
                  <><LogIn className="w-5 h-5 mr-2" /> Authenticate</>
                ) : (
                  <><UserPlus className="w-5 h-5 mr-2" /> Create Account</>
                )}
              </span>
            </motion.button>
          </form>

          <div className="mt-8 flex items-center gap-4 px-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogle}
            className="w-full mt-8 bg-white/[0.03] border border-white/10 text-white font-medium py-3.5 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all flex items-center justify-center hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-3 opacity-90 drop-shadow-md" />
            Continue with Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
