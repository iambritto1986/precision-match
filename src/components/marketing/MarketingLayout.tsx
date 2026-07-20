import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ParticleNetworkBackground } from '../ParticleNetworkBackground';

export const MarketingLayout: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen w-full relative bg-[#070911] font-inter text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden">
      <ParticleNetworkBackground />
      
      {/* Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#070911]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg group-hover:shadow-cyan-500/25 transition-shadow">
              PM
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Precision Match</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/auth/login" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log In
            </Link>
            <Link to="/auth/register" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-slate-200 transition-colors shadow-lg">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 pt-20">
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0c16]/80 backdrop-blur-sm pt-16 pb-8 mt-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">PM</div>
              <span className="text-lg font-bold text-white">Precision Match</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              AI-powered resume optimization that helps you beat the ATS and land your dream job faster. Tailor your resume to any job description in seconds.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link></li>
              <li><Link to="/auth/register" className="hover:text-cyan-400 transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Precision Match. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
