import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export const AuthModal: React.FC<{ onGuest: () => void }> = ({ onGuest }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="modal-container max-w-md w-full p-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest text-center">
          {isLogin ? 'Access Portal' : 'Initialize Account'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 text-center">
          {isLogin ? 'Enter your credentials to continue.' : 'Create a new node in the network.'}
        </p>

        {error && (
          <div className="w-full p-3 mb-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 mb-6">
          <input
            type="email"
            placeholder="EMAIL ADDRESS"
            className="tech-input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="PASSWORD"
            className="tech-input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary w-full mt-2">
            {isLogin ? (
              <><LogIn className="w-4 h-4 mr-2" /> Authenticate</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> Register</>
            )}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] uppercase font-bold text-slate-500">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button 
          onClick={handleGoogle}
          className="btn-secondary w-full mb-4"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2 opacity-70" />
          Continue with Google
        </button>

        <div className="flex flex-col items-center gap-4 mt-2">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-[var(--accent-primary)] hover:text-white transition-colors underline"
          >
            {isLogin ? "Need an account? Register here." : "Already have an account? Login here."}
          </button>
          
          <button 
            onClick={onGuest}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};
