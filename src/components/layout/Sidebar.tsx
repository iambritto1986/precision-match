import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { X, Menu, Users, FileText, Code, MessageCircle, Mic, Compass, Plus, FileOutput, CheckCircle2, ChevronDown, Download, Layers, ShieldAlert, LogOut, LogIn } from 'lucide-react';
import { ResumeData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ParticleText from '../ParticleText';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAdmin: boolean;
  isPro: boolean;
  credits: number;
  resumes: Array<{id: string, name: string, data: ResumeData}>;
  activeResumeId: string | null;
  setActiveResumeId: (id: string | null) => void;
  setResumes: React.Dispatch<React.SetStateAction<Array<{id: string, name: string, data: ResumeData}>>>;
  downloadsRemaining: number;
  setShowPricing: (show: boolean) => void;
  user: any;
  setShowFeedback: (show: boolean) => void;
  setShowSupport: (show: boolean) => void;
  handleStartNewResume: () => void;
  resumeData: ResumeData;
  setIsGuestMode: (mode: boolean) => void;
  setShowSecurity: (show: boolean) => void;
  setShowLegalModal: (show: 'privacy' | 'terms' | null) => void;
  setShowDeleteConfirm: (show: boolean) => void;
}

export function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  isAdmin,
  isPro,
  credits,
  resumes,
  activeResumeId,
  setActiveResumeId,
  setResumes,
  downloadsRemaining,
  setShowPricing,
  user,
  setShowFeedback,
  setShowSupport,
  handleStartNewResume,
  resumeData,
  setIsGuestMode,
  setShowSecurity,
  setShowLegalModal,
  setShowDeleteConfirm
}: SidebarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  return (
    <>
            {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f0b1e]/90 backdrop-blur-md z-50 border-b border-white/10 flex items-center px-4 justify-between no-print">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="Precision Match Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-[#00F0FF]/30 object-cover border border-[#00F0FF]/20" />
          <h1 className="text-lg font-bold leading-none truncate tracking-wide">Precision Match</h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-300 hover:text-white">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside id="tour-sidebar" style={{ perspective: '800px' }} className={`fixed md:relative md:flex w-64 glass-sidebar text-white flex-col shrink-0 z-40 overflow-y-auto scroll-hide h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 pt-14 md:pt-0' : '-translate-x-full md:translate-x-0'} bg-[#0f0b1e] md:bg-transparent no-print`}>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Precision Match Logo" className="w-9 h-9 rounded-xl shadow-lg shadow-[#00F0FF]/30 object-cover border border-[#00F0FF]/30 glow-pulse shrink-0" />
            <div>
              <h1 className="text-lg font-bold leading-none tracking-wide text-white">Precision Match</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-semibold text-[#00F0FF]">AI Resume Builder</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-4 flex flex-col overflow-hidden min-h-0">
          <div className="flex-shrink-0 space-y-1 stagger-enter">
            <div className="px-6 py-3 text-slate-500 text-[11px] uppercase font-semibold tracking-wider">Main Menu</div>
            {isAdmin && <Link to="/dashboard" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/dashboard' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Users className="w-4 h-4 mr-3 text-slate-400"/> Founder Hub</Link>}
            <Link to="/resume" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/resume' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><FileText className="w-4 h-4 mr-3 text-slate-400"/> Home</Link>
            <Link to="/edit" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/edit' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Code className="w-4 h-4 mr-3 text-slate-400"/> Source Data</Link>
            <Link to="/chat" id="tour-career-chat" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/chat' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <MessageCircle className="w-4 h-4 mr-3" /> Chat with Sage {!isPro && <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Try Free</span>}
            </Link>
            <Link to="/interview" id="tour-live-interview" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/interview' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <Mic className="w-4 h-4 mr-3"/> Interview with Sage {!isPro && <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Try Free</span>}
            </Link>
            <button onClick={() => window.startTour?.()} className="flex w-full items-center px-6 py-3 text-sm transition-all rounded-r-lg border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5">
                <Compass className="w-4 h-4 mr-3 text-slate-400"/> Guided Tour
            </button>
          </div>
          <div className="px-6 py-6 mt-4 border-t border-white/5 flex flex-col overflow-y-auto flex-1 min-h-0">
            <button 
               onClick={(e) => { 
                 e.preventDefault(); 
                 handleStartNewResume();
               }} 
               className="w-full flex items-center justify-center px-4 py-2 btn-primary text-sm rounded-xl mb-6 shrink-0"
            >
               + Start New Resume
            </button>
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold">Resume History</p>
              <div className="flex flex-col gap-2">
                 {resumes.map(resume => (
                   <div 
                      key={resume.id}
                      className={`group relative py-2.5 px-3 cursor-pointer transition-all border-l-2 ${resume.id === activeResumeId ? 'border-[#00F0FF] bg-[#00F0FF]/[0.03] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'}`}
                   >
                     <div onClick={() => setActiveResumeId(resume.id)} className="pr-6">
                       <p className="text-sm font-medium truncate">{resume.name}</p>
                       <p className="text-[10px] text-slate-300 mt-1 truncate">
                         {resume.data.personalDetails?.title || 'No Title'}
                       </p>
                     </div>
                     {resumes.length > 1 && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           const newResumes = resumes.filter(r => r.id !== resume.id);
                           setResumes(newResumes);
                           if (activeResumeId === resume.id) setActiveResumeId(newResumes[0].id);
                         }}
                         className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition"
                       >
                         <X className="w-3.5 h-3.5" />
                       </button>
                     )}
                   </div>
                 ))}
              </div>
            </div>
          </div>
          
          <div id="tour-credits" className="px-6 pb-6 pt-5 shrink-0 border-t border-white/5 mt-2">
            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-2">
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Credits</p>
                 <p className="text-[10px] text-[#00F0FF] font-bold cursor-pointer hover:text-white transition drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" onClick={() => setShowPricing(true)}>Upgrade</p>
              </div>
              <p className="text-xs font-semibold text-slate-300 mb-2">{isPro ? `${credits} Credits` : `${credits} / 3 Free Remaining`}</p>
              <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all ${credits > 0 ? 'bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.6)]'}`} style={{ width: `${isPro ? Math.min((credits/100)*100, 100) : (credits/3)*100}%` }}></div>
              </div>
              
              {!isPro && (
                <>
                  <div className="flex justify-between items-end mb-2 mt-5">
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Free Exports</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-300 mb-2">{downloadsRemaining} / 1 Free Remaining</p>
                  <div className="w-full bg-slate-800/50 h-1 rounded-full overflow-hidden mb-1">
                     <div className={`h-full rounded-full transition-all ${downloadsRemaining > 0 ? 'bg-[#B500FF] shadow-[0_0_10px_rgba(181,0,255,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.6)]'}`} style={{ width: `${downloadsRemaining * 100}%` }}></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden bg-cover bg-center shrink-0" style={{ backgroundImage: user?.photoURL ? `url(${user.photoURL})` : resumeData.personalDetails.profilePictureUrl ? `url(${resumeData.personalDetails.profilePictureUrl})` : 'none' }}></div>
             <div className="overflow-hidden">
               <p className="text-xs font-medium truncate w-24">{user?.displayName || user?.email || resumeData.personalDetails.name || 'Guest'}</p>
               <p className="text-[10px] text-slate-400">{isPro ? 'Pro Member' : 'Free Tier'}</p>
             </div>
             {user ? (
                <button onClick={logout} className="text-slate-400 hover:text-white p-1" title="Log Out"><LogOut className="w-4 h-4" /></button>
             ) : (
                <button onClick={() => setIsGuestMode(false)} className="text-blue-400 hover:text-blue-300 p-1" title="Log In"><LogIn className="w-4 h-4" /></button>
             )}
          </div>
        </div>
        <div className="px-6 pb-4 flex flex-wrap gap-x-3 gap-y-1 mt-auto">
          <button onClick={() => setShowFeedback(true)} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Feedback</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <button onClick={() => setShowSupport(true)} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Support</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <button onClick={() => setShowSecurity(true)} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Security</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <button onClick={() => setShowLegalModal('privacy')} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Privacy</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <button onClick={() => setShowLegalModal('terms')} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Terms</button>
          {user && user.uid !== 'local-guest-uid' && (
            <>
              <span className="text-slate-700 text-[10px]">&middot;</span>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] text-red-400/70 hover:text-red-400 transition">Delete Account</button>
            </>
          )}
        </div>
        
        {/* Singularity Insight Footer */}
        <div className="px-6 pb-6 w-full flex flex-col items-center justify-center border-t border-white/5 pt-4">
           <p className="text-[8px] uppercase tracking-widest text-slate-500 mb-1 font-semibold">A product of</p>
           <h3 className="text-xs font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B500FF] uppercase opacity-80 hover:opacity-100 transition-opacity">
             Singularity Insight
           </h3>
        </div>
      </aside>

    </>
  );
}
