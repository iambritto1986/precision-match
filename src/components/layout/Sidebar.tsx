import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Menu, Users, FileText, Code, MessageCircle, Mic, Compass, Plus, FileOutput, CheckCircle2, ChevronDown, Download, Layers, ShieldAlert, LogOut, LogIn, Briefcase } from 'lucide-react';
import { ResumeData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import ParticleText from '../ParticleText';
import { AnimatedLogo } from '../AnimatedLogo';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAdmin: boolean;
  isPro: boolean;
  resumes: Array<{id: string, name: string, data: ResumeData}>;
  activeResumeId: string | null;
  setActiveResumeId: (id: string | null) => void;
  setResumes: React.Dispatch<React.SetStateAction<Array<{id: string, name: string, data: ResumeData}>>>;
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
  resumes,
  activeResumeId,
  setActiveResumeId,
  setResumes,
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
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Resume History expands on hover. Main Menu is deliberately NOT collapsed
  // when this happens.
  //
  // An earlier version made the two sections mutually exclusive (opening one
  // closed the other). That oscillates: Main Menu sits above Resume History, so
  // collapsing it pulls the History header ~360px up and out from under the
  // cursor, which fires mouseleave, which re-expands Main Menu, which pushes the
  // header back under the cursor, which fires mouseenter — an infinite
  // shake at frame rate.
  //
  // The invariant that prevents it: a hover-driven section must never change the
  // height of anything ABOVE its own hover target. History only grows downward,
  // so its header never moves and the loop can't start.
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
            {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f0b1e]/90 backdrop-blur-md z-50 border-b border-white/10 flex items-center px-4 justify-between no-print">
        <div className="flex items-center space-x-2">
          <AnimatedLogo tile animated={false} hoverPlay size={32} className="rounded-lg shadow-lg shadow-white/20" />
          <h1 className="text-lg font-bold leading-none truncate tracking-wide">Precision Match</h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-300 hover:text-white">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar stays full width always — no width-collapsing rail. Instead,
          "Main Menu" and "Resume History" are each their own vertical accordion:
          collapsed to just a header by default, expanding downward on hover
          (and staying open while the pointer is anywhere within, including the
          revealed items) so more sections can live in the same space. */}
      <aside id="tour-sidebar" style={{ perspective: '800px' }} className={`fixed md:relative md:flex w-64 glass-sidebar text-white flex-col shrink-0 z-40 overflow-y-auto scroll-hide h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 pt-14 md:pt-0' : '-translate-x-full md:translate-x-0'} bg-[#0f0b1e] md:bg-transparent no-print`}>
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <AnimatedLogo tile animated={false} hoverPlay size={36} className="rounded-xl shadow-lg shadow-white/20 shrink-0" />
            <div>
              <h1 className="text-lg font-bold leading-none tracking-wide text-white">Precision Match</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1.5 font-semibold text-[#00F0FF]">AI Resume Builder</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-4 flex flex-col overflow-y-auto scroll-hide min-h-0">

          {/* --- Main Menu: always expanded (see historyOpen note above) --- */}
          <div className="flex-shrink-0 stagger-enter">
            <div className="px-6 py-3 flex items-center cursor-default select-none">
              <span className="text-slate-500 text-[11px] uppercase font-semibold tracking-wider">Main Menu</span>
            </div>
            <div className="space-y-1 pb-1">
              {isAdmin && <Link to="/dashboard" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/dashboard' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Users className="w-4 h-4 mr-3 text-slate-400 shrink-0"/> Founder Hub</Link>}
              <Link to="/resume" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/resume' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><FileText className="w-4 h-4 mr-3 text-slate-400 shrink-0"/> Home</Link>
              <Link to="/tracker" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/tracker' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Briefcase className="w-4 h-4 mr-3 text-slate-400 shrink-0"/> Application Tracker</Link>
              <Link to="/edit" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/edit' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}><Code className="w-4 h-4 mr-3 text-slate-400 shrink-0"/> Source Data</Link>
              <Link to="/chat" id="tour-career-chat" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg ${location.pathname === '/chat' ? 'bg-white/10 border-l-2 border-[#00F0FF] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                  <MessageCircle className="w-4 h-4 mr-3 shrink-0" /> Chat with Aadhya {!isPro && <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Try Free</span>}
              </Link>
              {/* Signature feature — deliberately gold rather than the app's cyan/magenta
                  so it outranks every other item in the menu at a glance. */}
              <Link to="/interview" id="tour-live-interview" className={`flex items-center px-6 py-3 text-sm transition-all rounded-r-lg border-l-2 ${location.pathname === '/interview' ? 'bg-[#FFC94A]/10 border-[#FFC94A] text-white shadow-[inset_1px_0_14px_rgba(255,201,74,0.12)]' : 'border-[#FFC94A]/50 text-[#F3D89B] hover:text-white hover:bg-[#FFC94A]/[0.07] hover:border-[#FFC94A]'}`}>
                  <Mic className="w-4 h-4 mr-3 shrink-0 text-[#FFC94A] drop-shadow-[0_0_6px_rgba(255,201,74,0.6)]"/> Interview with Aadhya {!isPro && <span className="ml-auto bg-[#FFC94A]/20 text-[#FFC94A] px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Try Free</span>}
              </Link>
              <button onClick={() => window.startTour?.()} className="flex w-full items-center px-6 py-3 text-sm transition-all rounded-r-lg border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5">
                  <Compass className="w-4 h-4 mr-3 text-slate-400 shrink-0"/> Guided Tour
              </button>
            </div>
          </div>

          <button
             onClick={(e) => {
               e.preventDefault();
               handleStartNewResume();
             }}
             className="mx-6 mt-4 flex items-center justify-center gap-2 px-4 py-2 btn-primary text-sm rounded-xl shrink-0"
          >
             <Plus className="w-4 h-4 shrink-0" /> Start New Resume
          </button>

          {/* --- Resume History: vertical accordion, hover to expand --- */}
          <div
            className="px-6 pt-4 pb-2 mt-2 flex flex-col min-h-0"
            onMouseEnter={() => setHistoryOpen(true)}
            onMouseLeave={() => setHistoryOpen(false)}
          >
            <div className="flex items-center justify-between cursor-default select-none">
              <p className="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-widest font-bold">
                <Layers className="w-3.5 h-3.5 shrink-0" /> Resume History
              </p>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${historyOpen ? 'rotate-180 text-slate-400' : 'text-slate-600'}`} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${historyOpen ? 'max-h-[420px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
              <div className="flex flex-col gap-2 pt-3">
                 {resumes.map(resume => (
                   <div
                      key={resume.id}
                      className={`group relative py-2.5 px-3 cursor-pointer transition-all border-l-2 rounded-r-lg ${resume.id === activeResumeId ? 'border-[#00F0FF] bg-[#00F0FF]/[0.03] text-white shadow-[inset_1px_0_10px_rgba(0,240,255,0.05)]' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'}`}
                   >
                     <div onClick={() => { setActiveResumeId(resume.id); navigate('/resume'); }} className="pr-6">
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

          {/* AI Credits / Free Exports used to live here. Moved into the page
              headers (see CreditsMeter) to reclaim vertical space in the nav. */}
          <div className="mt-auto" />
        </nav>
        <div className="p-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             {/* Account identity comes ONLY from the signed-in user. This used to
                 fall back to resumeData.personalDetails, which meant building a
                 resume for someone else put THEIR name and photo in your account
                 widget. A resume is a document about someone; it is not proof of
                 who is logged in. */}
             <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden bg-cover bg-center shrink-0" style={{ backgroundImage: user?.photoURL ? `url(${user.photoURL})` : 'none' }}></div>
             <div className="overflow-hidden">
               <p className="text-xs font-medium truncate w-24">{user?.displayName || user?.email || 'Guest'}</p>
               <p className="text-[10px] text-slate-400">{isPro ? 'Pro Member' : 'Free Tier'}</p>
             </div>
             {user ? (
                <button onClick={handleLogout} className="text-slate-400 hover:text-white p-1" title="Log Out"><LogOut className="w-4 h-4" /></button>
             ) : (
                <button onClick={() => setIsGuestMode(false)} className="text-[#00F0FF] hover:text-[#00C4D1] p-1" title="Log In"><LogIn className="w-4 h-4" /></button>
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
