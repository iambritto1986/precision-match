/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ResumeData, TemplateId } from './types';
import { TemplateRenderer } from './components/ResumeTemplates';
import VoiceInterview from './components/VoiceInterview';
import CareerChat from './components/CareerChat';
import ResumeFormEditor from './components/ResumeFormEditor';
import { exportToDocx, exportToPdf, exportCoverLetterDocx } from './lib/export';
import { Upload, FileText, Download, Briefcase, RefreshCw, Layers, CheckCircle2, Image as ImageIcon, MapPin, Phone, Mail, Linkedin, Globe, FileOutput, Mic, MessageCircle, ChevronUp, ChevronDown, Code, X, Users, LogOut, LogIn, ZoomIn, ZoomOut, Maximize2, Sparkles, Check, AlertCircle, Info, Menu, ShieldAlert } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ParticleNetworkBackground } from './components/ParticleNetworkBackground';

import { useAuth } from './context/AuthContext';

import { FounderDashboard } from './components/FounderDashboard';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs, query, updateDoc } from 'firebase/firestore';
import { AuthPortal } from './pages/AuthPortal';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingTour } from './components/OnboardingTour';
import { PricingModal } from './components/modals/PricingModal';
import { Sidebar } from './components/layout/Sidebar';
import { Routes, Route, useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAppUpdate } from './hooks/useAppUpdate';
import { ChangelogModal } from './components/modals/ChangelogModal';
import { API_BASE_URL } from './config';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'iambrittothomas@gmail.com';
const STRIPE_PRICE_PRO = import.meta.env.VITE_STRIPE_PRICE_PRO || '';
const STRIPE_PRICE_CREDITS = import.meta.env.VITE_STRIPE_PRICE_CREDITS || '';

const defaultData: ResumeData = {
  personalDetails: {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    profilePictureUrl: ""
  },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
  projects: []
};

const blankData: ResumeData = {
  personalDetails: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "", profilePictureUrl: "" },
  experience: [],
  education: [],
  skills: [],
  projects: []
};

export default function App() {
    const { user, logout, loading: authLoading, loginWithGoogle } = useAuth();


  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [adminUsersInfo, setAdminUsersInfo] = useState<any[]>([]);

  const [fontFamily, setFontFamily] = useState<string>('');
  const [credits, setCredits] = useState<number>(3);
  const [downloadsRemaining, setDownloadsRemaining] = useState<number>(1);
  const [isPro, setIsPro] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const defaultOrder = ['summary', 'experience', 'skills', 'education', 'projects'];
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [pageBreaks, setPageBreaks] = useState<Record<string, boolean>>({});

  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;
  const activeTab = currentPath === '/edit' ? 'edit' : 
                    currentPath === '/chat' ? 'chat' : 
                    currentPath === '/interview' ? 'interview' : 
                    currentPath === '/dashboard' ? 'dashboard' : 'resume';
  const [baseContext, setBaseContext] = useState('');

  // Premium states
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'ai' | 'form' | 'layout'>('ai');
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<'options' | 'linkedin' | 'loading'>('options');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [supportText, setSupportText] = useState('');
  const [showSecurity, setShowSecurity] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [changelogData, setChangelogData] = useState<{version: string, changelog: string[]} | null>(null);

  const { updateAvailable, newVersionData, triggerUpdate } = useAppUpdate();

  useEffect(() => {
    const showVersion = localStorage.getItem('show_changelog_for_version');
    const storedChangelog = localStorage.getItem('latest_changelog_data');
    if (showVersion && storedChangelog) {
      setChangelogData({
        version: showVersion,
        changelog: JSON.parse(storedChangelog)
      });
      setShowChangelogModal(true);
      localStorage.removeItem('show_changelog_for_version');
    }
  }, []);

  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [atsScoreData, setAtsScoreData] = useState<{score: number, matchedKeywords: string[], missingKeywords: string[]} | null>(null);
  const [isAtsScanning, setIsAtsScanning] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Shadow window.alert with beautiful Toast notifications
  const alert = (msg: string) => {
    const lower = msg.toLowerCase();
    const type = (lower.includes('success') || lower.includes('saved') || lower.includes('enhanced')) ? 'success' : 'error';
    showToast(msg, type);
  };


  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
         if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            setCredits(data.credits ?? 3);
            setDownloadsRemaining(data.downloadsRemaining ?? 1);
            setIsPro(data.isPro || user.email === ADMIN_EMAIL);
            
            if (!data.onboardingCompleted) {
              setIsOnboarding(true);
              setOnboardingStep('options');
              updateDoc(userRef, { onboardingCompleted: true });
            }
         } else {
            setDoc(userRef, { 
               email: user.email || '',
               createdAt: new Date().toISOString(),
               credits: 3,
                 downloadsRemaining: 1,
               isPro: user.email === ADMIN_EMAIL,
               onboardingCompleted: true
            }).catch(e => console.error("Error setting user doc", e));
            setIsOnboarding(true);
            setOnboardingStep('options');
         }
         setProfileLoading(false);
      }, (error) => {
         console.error("Firestore Error User Profile: ", error);
         setProfileLoading(false);
      });

      let unsubscribeAdminUsers: (() => void) | undefined;
      setIsAdmin(false);
      
      const setupAdminListener = () => {
         setIsAdmin(true);
         setIsPro(true);
         unsubscribeAdminUsers = onSnapshot(collection(db, 'users'), (userSnap) => {
            const users: any[] = [];
            userSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
            // Optional: sort by createdAt if needed, but registry usually handles it
            setAdminUsersInfo(users);
         }, (e) => console.error("Error fetching users for dashboard", e));
      };

      if (user.email === ADMIN_EMAIL) {
         setupAdminListener();
      } else {
         const adminRef = doc(db, 'admins', user.uid);
         getDoc(adminRef).then(adminSnap => {
             if (adminSnap.exists()) {
                setupAdminListener();
             }
         }).catch(e => console.error(e));
      }
      
      return () => {
        unsubscribeUser();
        if (unsubscribeAdminUsers) unsubscribeAdminUsers();
      };
    } else {
      setUserData(null);
      setCredits(3);
        setDownloadsRemaining(1);
      setIsPro(false);
      setIsAdmin(false);
      setAdminUsersInfo([]);
      setProfileLoading(false);
    }
  }, [user, authLoading]);
































































  const handlePurchase = async (priceId: string) => {
    if (!user) {
       alert("Please sign in to purchase.");
       return loginWithGoogle();
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.uid })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate checkout");
      }
    } catch (e) {
      console.error(e);
      alert("Error opening checkout");
    }
  };

  const [jobDescription, setJobDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [resumes, setResumes] = useState<{id: string, name: string, data: ResumeData}[]>([{id: '1', name: defaultData.personalDetails.name || 'Untitled Resume', data: defaultData}]);
  const [activeResumeId, setActiveResumeId] = useState<string>('1');

  React.useEffect(() => {
    if (user?.uid) {
      const stored = localStorage.getItem(`resumes_${user.uid}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setResumes(parsed);
          if (parsed.length > 0) setActiveResumeId(parsed[0].id);
        } catch(e) {
          setResumes([{id: '1', name: defaultData.personalDetails.name || 'Untitled Resume', data: defaultData}]);
        }
      } else {
        setResumes([{id: '1', name: defaultData.personalDetails.name || 'Untitled Resume', data: defaultData}]);
      }
    } else {
      setResumes([{id: '1', name: defaultData.personalDetails.name || 'Untitled Resume', data: defaultData}]);
    }
  }, [user?.uid]);

  React.useEffect(() => {
    if (user?.uid && resumes.length > 0) {
      localStorage.setItem(`resumes_${user.uid}`, JSON.stringify(resumes));
    }
  }, [resumes, user?.uid]);

  const resumeData = resumes.find(r => r.id === activeResumeId)?.data || blankData;
  
  React.useEffect(() => {
     let newOrder = [...sectionOrder];
     let changed = false;
     if (resumeData.certifications && resumeData.certifications.length > 0 && !newOrder.includes('certifications')) {
         newOrder.push('certifications'); changed = true;
     }
     if (resumeData.customSections) {
         resumeData.customSections.forEach(cs => {
             if (!newOrder.includes(cs.id)) { newOrder.push(cs.id); changed = true; }
         });
     }
     if (changed) setSectionOrder(newOrder);
  }, [resumeData, sectionOrder]);

  const setResumeData = (newDataOrUpdater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setResumes(prev => prev.map(r => {
      if (r.id === activeResumeId) {
          const updatedData = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(r.data) : newDataOrUpdater;
          return { ...r, data: updatedData, name: updatedData.personalDetails.name || 'Untitled Resume' };
      }
      return r;
    }));
  };

  
  const handleExport = async (type: 'pdf' | 'docx') => {
    if (isPro) {
      if (type === 'pdf') {
        exportToPdf('resume-preview-content', `${resumeData.personalDetails.name.replace(/ /g, '_')}_Resume.pdf`);
      }
      else exportToDocx(resumeData);
    } else {
      if (downloadsRemaining > 0) {
        if (type === 'pdf') {
          exportToPdf('resume-preview-content', `${resumeData.personalDetails.name.replace(/ /g, '_')}_Resume.pdf`);
        }
        else exportToDocx(resumeData);
        
        const newCount = downloadsRemaining - 1;
        setDownloadsRemaining(newCount);
        if (user && user.uid !== 'local-guest-uid') {
          updateDoc(doc(db, 'users', user.uid), { downloadsRemaining: newCount }).catch(console.error);
        }
      } else {
        showToast("You've used your free download. Upgrade to Pro for unlimited exports.", "error");
        setShowPricing(true);
      }
    }
  };

  const handleDeductCredits = (amount: number): boolean => {
    if (user?.email === ADMIN_EMAIL) return true;
    if (credits >= amount) {
      const newCount = credits - amount;
      setCredits(newCount);
      if (user) {
        updateDoc(doc(db, 'users', user.uid), { credits: newCount }).catch(console.error);
      }
      return true;
    }
    showToast(`You need ${amount} AI Credits to perform this action.`, "error");
    setShowPricing(true);
    return false;
  };

  const handleStartNewResume = () => {
    if (!isPro && resumes.length >= 1) {
       showToast("Free users are limited to 1 active resume. Upgrade to Pro for unlimited resumes.", "error");
       setShowPricing(true);
       return;
    }
    setIsOnboarding(true);
    setOnboardingStep('options');
  };
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('classic');
  const [aestheticTheme, setAestheticTheme] = useState<'default' | 'ocean' | 'sunset' | 'forest'>('default');
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverLetterGenerating, setIsCoverLetterGenerating] = useState(false);
  const [ingestionModal, setIngestionModal] = useState<'linkedin' | 'paste' | null>(null);
  const [ingestionInput, setIngestionInput] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionEditValue, setSectionEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        } else {
          reject(new Error("Failed to convert file to base64"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const processIngestion = async (sourceText: string) => {
    let targetId = activeResumeId;
    const currentResume = resumes.find(r => r.id === activeResumeId);
    
    if (isOnboarding) {
      setOnboardingStep('loading');
      targetId = Date.now().toString();
      setResumes(prev => [...prev, { id: targetId, name: 'Importing...', data: blankData }]);
      setActiveResumeId(targetId);
    } else {
      const isInitial = currentResume?.data === defaultData || currentResume?.data === blankData || currentResume?.name === "Untitled Resume";
      if (!isInitial) {
        targetId = Date.now().toString();
        setResumes(prev => [...prev, { id: targetId, name: 'Importing...', data: blankData }]);
        setActiveResumeId(targetId);
      }
    }

    if (credits <= 0 && !isPro) {
      showToast("You've used all your free credits. Upgrade to continue.", "error");
      setShowPricing(true);
      return;
    }

    setBaseContext(sourceText);
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseData: sourceText,
          jobDescription,
          instructions
        })
      });
      const generated = await res.json();
      if (generated.data && generated.data.personalDetails) {
        setResumes(prev => prev.map(r => {
           if (r.id === targetId) {
             return {
                ...r,
                name: generated.data.personalDetails.name || 'Imported Resume',
                data: {
                  ...generated.data,
                  personalDetails: { ...generated.data.personalDetails, profilePictureUrl: r.data.personalDetails?.profilePictureUrl || '' }
                }
             };
           }
           return r;
        }));
        setIsOnboarding(false); // Onboarding complete!
        setWorkspaceSubTab('form'); // Open form editor directly
      } else {
        alert("Failed to intelligently format resume from the text.");
      }
      if (!isPro) {
        setCredits(prev => Math.max(0, prev - 1));
        if (user && user.uid !== 'local-guest-uid') {
          updateDoc(doc(db, 'users', user.uid), { credits: credits - 1 }).catch(console.error);
        }
      }
    } catch(e) {
      console.error(e);
      alert("Error formatting your data. Showing raw text in context.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(`${API_BASE_URL}/api/extract-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, mimeType: file.type })
      });
      const data = await res.json();
      if (!res.ok) {
         alert(data.error || "Error uploading file.");
         return;
      }
      if (data.text) {
        await processIngestion(data.text);
      } else {
        alert("Could not extract text from the file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const constructBaseResumeText = () => {
    if (baseContext) return baseContext;
    return JSON.stringify(resumeData);
  };

  const handleAtsScan = async () => {
    if (!jobDescription) {
      showToast("Please enter a job description to scan against.", "error");
      return;
    }
    setIsAtsScanning(true);
    setAtsScoreData(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ats-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan');
      setAtsScoreData(data);
      showToast("ATS Scan Complete!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message, "error");
    } finally {
      setIsAtsScanning(false);
    }
  };

  const generateResume = async () => {
    if (credits <= 0) {
       setShowPricing(true);
       return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseData: constructBaseResumeText(),
          jobDescription,
          instructions
        })
      });
      const generated = await res.json();
      if (generated.data && generated.data.personalDetails) {
        setResumeData({
          ...generated.data,
          personalDetails: {
             ...generated.data.personalDetails,
             profilePictureUrl: resumeData.personalDetails.profilePictureUrl
          }
        });
        setCredits(prev => prev - 1);
      } else {
        throw new Error(generated.error || "Failed to generate");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating resume.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCoverLetter = async () => {
    setIsCoverLetterGenerating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           baseData: JSON.stringify(resumeData),
           jobDescription
         })
      });
      const data = await res.json();
      if (data.text) {
        await exportCoverLetterDocx(data.text, `${resumeData.personalDetails.name.replace(/\s+/g, '_')}_Cover_Letter.docx`);
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating cover letter.");
    } finally {
      setIsCoverLetterGenerating(false);
    }
  };

  const templates: { id: TemplateId, name: string, previewClass: string }[] = [
    { id: 'classic', name: 'Classic', previewClass: 'bg-white border-2 border-blue-500' },
    { id: 'modern', name: 'Modern', previewClass: 'bg-white border text-blue-400' },
    { id: 'minimalist', name: 'Minimal', previewClass: 'bg-slate-900 border text-white' },
    { id: 'executive', name: 'Executive', previewClass: 'bg-white border text-white' },
    { id: 'aesthetic', name: 'Aesthetic', previewClass: 'bg-pink-50 border text-pink-600' },
    { id: 'creative', name: 'Creative', previewClass: 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]/20 border-indigo-200 text-indigo-700' },
    { id: 'tech', name: 'Tech', previewClass: 'bg-slate-950 border-emerald-500/50 text-emerald-400 font-mono' },
    { id: 'academic', name: 'Academic', previewClass: 'bg-[#fcfaf8] border-stone-300 text-stone-800 font-serif' },
  ];

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setResumeData(prev => ({
             ...prev,
             personalDetails: { ...prev.personalDetails, profilePictureUrl: event.target!.result as string }
          }));
          setShowProfilePicture(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (authLoading || (user && profileLoading)) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0612] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 to-[#B500FF]/10 blur-[100px] -z-10 animate-pulse"></div>
          <img src="/logo.png" alt="Precision Match Logo" className="w-16 h-16 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.3)] object-cover border border-[#00F0FF]/30 animate-pulse mb-6" />
          <p className="text-[10px] text-[#00F0FF] uppercase font-black tracking-[0.2em] animate-pulse">Loading Precision Match...</p>
        </div>
      );
  }

  if (location.pathname === '/auth/register') {
    return <AuthPortal />;
  }

  if (!user && !isGuestMode && !authLoading) {
    return <Navigate to="/auth/register" replace />;
  }

  // 404 for unknown paths
  const knownPaths = ['/', '/auth/register', '/resume', '/edit', '/chat', '/interview', '/dashboard'];
  if (!knownPaths.includes(location.pathname)) {
    return <NotFoundPage />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full bg-[#0f0b1e] text-slate-100 font-inter relative overflow-x-hidden md:overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .scroll-hide::-webkit-scrollbar { display: none; }
      ` }} />
      
      <ParticleNetworkBackground />
      <OnboardingTour />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isAdmin={isAdmin}
        isPro={isPro}
        credits={credits}
        resumes={resumes}
        activeResumeId={activeResumeId}
        setActiveResumeId={setActiveResumeId}
        setResumes={setResumes}
        downloadsRemaining={downloadsRemaining}
        setShowPricing={setShowPricing}
        user={user}
        handleStartNewResume={handleStartNewResume}
        resumeData={resumeData}
        setIsGuestMode={setIsGuestMode}
        setShowSecurity={setShowSecurity}
        setShowLegalModal={setShowLegalModal}
        setShowDeleteConfirm={setShowDeleteConfirm}
        setShowFeedback={setShowFeedback}
        setShowSupport={setShowSupport}
      />
      {/* Mobile overlay for when sidebar is open */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-y-auto z-10" id="main-content" role="main">
        <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/resume" replace />} />
          <Route path="/resume" element={
           <motion.div
            key="resume"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col w-full overflow-y-visible md:overflow-hidden min-h-0"
           >
        <header className="h-16 border-b border-white/5 glass-header flex items-center justify-between px-4 md:px-8 shrink-0 no-print">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-semibold text-slate-200">Workspace: Tailoring {resumeData.personalDetails.name}'s Resume</h2>
            <span className="status-badge pr-3"><CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />Optimized for ATS</span>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => handleExport('pdf')} className="px-4 py-2 text-xs font-medium btn-primary rounded-xl flex items-center">
               <FileOutput className="w-3 h-3 mr-2" />
               Export PDF
             </button>
             <button onClick={() => handleExport('docx')} className="px-4 py-2 text-xs font-medium btn-secondary rounded-xl flex items-center">
               <Download className="w-3 h-3 mr-2" />
               Download Word
             </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row md:overflow-hidden min-h-0 min-w-0 w-full">
          <section className={`${
            workspaceSubTab === 'form' ? 'w-full lg:w-[50%]' : 'w-full lg:w-[40%] xl:w-[35%]'
          } border-r border-white/[0.06] p-4 lg:p-6 flex flex-col bg-transparent shrink-0 overflow-y-visible md:overflow-y-auto transition-all duration-300 h-auto no-print`}>
             
             {/* Sub-tab Navigation */}
             <div className="flex border-b border-white/10 mb-6 shrink-0">
               {[
                 { id: 'ai', name: 'AI Tailor' },
                 { id: 'form', name: 'Manual Edit' },
                 { id: 'layout', name: 'Page Layout' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   id={'tour-tab-' + tab.id}
                   onClick={() => setWorkspaceSubTab(tab.id as 'form' | 'ai' | 'layout')}
                   className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                     workspaceSubTab === tab.id
                       ? 'border-indigo-400 text-indigo-300 font-bold'
                       : 'border-transparent text-slate-500 hover:text-slate-300 font-medium'
                   }`}
                 >
                   {tab.name}
                 </button>
               ))}
             </div>

             {/* Tab 1: AI Tailor */}
             {workspaceSubTab === 'ai' && (
               <div className="flex-1 flex flex-col space-y-6">
                 <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Source Information</h3>
                    
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx,.txt" />
                                    <div className="grid grid-cols-3 gap-3">
                      <div 
                        id="tour-upload"
                        className="border border-white/10 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-indigo-500/40 cursor-pointer transition-all bg-white/[0.03] group hover:bg-white/[0.07]"
                        onClick={() => fileInputRef.current?.click()}
                      >
                         {isUploading ? (
                            <RefreshCw className="w-5 h-5 text-indigo-400 mb-2 animate-spin" />
                         ) : (
                            <Upload className="w-5 h-5 text-slate-400 mb-2 group-hover:text-indigo-400 transition-colors" />
                         )}
                         <p className="text-[11px] font-semibold text-slate-300 leading-tight">{isUploading ? 'Parsing...' : 'Upload File'}</p>
                         <p className="text-[9px] text-slate-500 mt-1">PDF/DOCX</p>
                      </div>
                      <div 
                         onClick={() => setIngestionModal('linkedin')}
                         className="border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-white/[0.03] cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.07] transition-all"
                      >
                         <Linkedin className="w-5 h-5 text-blue-400 mb-2" />
                         <p className="text-[11px] font-semibold text-slate-300 leading-tight">Sync LinkedIn</p>
                         <p className="text-[9px] text-slate-500 mt-1">Paste URL</p>
                      </div>
                      <div 
                         onClick={() => setIngestionModal('paste')}
                         className="border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-white/[0.03] cursor-pointer hover:border-emerald-500/40 hover:bg-white/[0.07] transition-all"
                      >
                         <FileText className="w-5 h-5 text-emerald-400 mb-2" />
                         <p className="text-[11px] font-semibold text-slate-300 leading-tight">Paste Data</p>
                         <p className="text-[9px] text-slate-500 mt-1">Manual Entry</p>
                      </div>
                    </div>
                    
                    {baseContext && (
                       <div className="text-xs text-slate-400 bg-white/[0.03] p-3 rounded-lg border border-white/10 max-h-32 overflow-y-auto">
                         <strong>Extracted text context:</strong><br />
                         {baseContext}
                       </div>
                    )}
                 </div>

                 <div className="space-y-3 flex-1 flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tailor to Job Description</h3>
                    <textarea 
                      id="tour-jd-paste"
                      className="w-full flex-1 p-4 text-xs lg:text-sm tech-input rounded-xl resize-none font-inter min-h-[120px]" 
                      placeholder="Paste the target job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                    
                    {/* ATS MATCH SCANNER UI */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">ATS Keyword Match</h3>
                        <button 
                          onClick={handleAtsScan}
                          disabled={isAtsScanning || !jobDescription}
                          className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/200/10 hover:bg-emerald-500/200/20 border border-emerald-500/20 px-3 py-1.5 rounded transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {isAtsScanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Scan Resume
                        </button>
                      </div>
                      
                      {atsScoreData && (
                        <div className="space-y-4 mt-4 border-t border-white/10 pt-4 animate-fadeIn">
                          <div className="flex items-center gap-4">
                            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center rounded-full bg-slate-900 border-4 border-slate-800">
                               <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                 <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="none" className="text-white" />
                                 <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="4" fill="none" 
                                   className={atsScoreData.score > 75 ? "text-emerald-500" : atsScoreData.score > 50 ? "text-amber-500" : "text-rose-500"} 
                                   strokeDasharray="138" strokeDashoffset={138 - (138 * atsScoreData.score) / 100} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                               </svg>
                               <span className="relative text-sm font-black text-white">{atsScoreData.score}%</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {atsScoreData.score > 80 ? "Excellent match! You're highly aligned with this role." : atsScoreData.score > 50 ? "Good start, but missing some key terminology. Try generating a tailored version." : "Low match. A tailored rewrite is highly recommended."}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Matched Keywords</p>
                            <div className="flex flex-wrap gap-1.5">
                              {atsScoreData.matchedKeywords.length === 0 && <span className="text-xs text-slate-600 italic">None found</span>}
                              {atsScoreData.matchedKeywords.map((kw, i) => (
                                <span key={i} className="text-[10px] bg-emerald-500/200/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{kw}</span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Missing Keywords (Add These)</p>
                            <div className="flex flex-wrap gap-1.5">
                              {atsScoreData.missingKeywords.length === 0 && <span className="text-xs text-emerald-400 italic">Looks good!</span>}
                              {atsScoreData.missingKeywords.map((kw, i) => (
                                <span key={i} className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">{kw}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">Custom Instructions</h3>
                    <textarea 
                      className="w-full p-4 text-xs lg:text-sm tech-input rounded-xl resize-none font-inter min-h-[80px]" 
                      placeholder="e.g. Keep it strictly to one page, highlight my leadership skills..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    />
                    <button 
                      onClick={generateResume}
                      disabled={isGenerating}
                      className="w-full py-3.5 btn-primary text-sm rounded-xl flex items-center justify-center disabled:opacity-70 mt-4 shrink-0"
                    >
                      {isGenerating ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating Magic...</>
                      ) : (
                        <><Layers className="w-4 h-4 mr-2" /> AI Curate & Tailor</>
                      )}
                    </button>
                 </div>
               </div>
             )}

             {/* Tab 2: Manual Edit Form */}
             {workspaceSubTab === 'form' && (
               <div className="flex-1 flex flex-col overflow-hidden">
                 <ResumeFormEditor data={resumeData} onChange={setResumeData} />
               </div>
             )}

             {/* Tab 3: Design & Page Layout */}
             {workspaceSubTab === 'layout' && (
               <div className="flex-1 flex flex-col space-y-6">
                 {/* Fonts & Images */}
                 <div className="space-y-4 border-b border-white/10 pb-6">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Typography & Style</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Font Family</label>
                       <select 
                         className="w-full text-xs font-semibold text-slate-200 tech-input px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50"
                         value={fontFamily}
                         onChange={(e) => setFontFamily(e.target.value)}
                       >
                          <option value="">Template Default</option>
                          <option value="font-inter">Inter (Modern)</option>
                          <option value="font-sans">System Sans (Clean)</option>
                          <option value="font-serif">Playfair (Serif/Classic)</option>
                          <option value="font-mono">JetBrains (Developer)</option>
                          <option value="font-roboto">Roboto (Clean Serif)</option>
                          <option value="font-montserrat">Montserrat (Bold)</option>
                          <option value="font-opensans">Open Sans</option>
                          <option value="font-space">Space Grotesk</option>
                          <option value="font-outfit">Outfit (Elegant)</option>
                       </select>
                     </div>

                     <div>
                       <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profile Photo</label>
                       <div className="flex items-center space-x-2 tech-input px-3 py-1.5 rounded-lg">
                         <span className="text-xs text-slate-400 flex-1">Show Photo</span>
                         <button 
                           onClick={() => setShowProfilePicture(!showProfilePicture)}
                           className={`w-8 h-4 rounded-full relative transition-colors ${showProfilePicture ? 'bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]/200' : 'bg-slate-600'}`}
                         >
                           <div className={`absolute top-0 w-4 h-4 rounded-full bg-white border border-white/20 transition-all ${showProfilePicture ? 'right-0' : 'left-0'}`}></div>
                         </button>
                       </div>
                     </div>
                   </div>

                   <div className="flex items-center gap-3 mt-4">
                     <input 
                       type="file" 
                       id="pic-upload-layout"
                       className="hidden" 
                       accept="image/*" 
                       onChange={handleProfilePictureUpload} 
                     />
                     <label htmlFor="pic-upload-layout" className="flex-1 text-center py-2.5 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold cursor-pointer text-slate-300 transition">
                       Upload Photo
                     </label>
                   </div>
                 </div>

                 {/* Sections Reordering & Page Breaks */}
                 <div id="tour-pagination" className="space-y-4 flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Order & Page Breaks</h3>
                    <p className="text-[11px] text-slate-400">Reorder sections on your page and set where you want page breaks to begin for multi-page exports.</p>
                    <div className="flex flex-col gap-2">
                       {sectionOrder.map((sec, i) => (
                          <div key={sec} className="bg-white/[0.04] border border-white/10 p-3 rounded-xl hover:bg-white/[0.08] transition-colors">
                             <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-300 capitalize cursor-default">
                                <span>{sec}</span>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                   <button disabled={i === 0} onClick={() => {
                                      const newOrder = [...sectionOrder];
                                      [newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]];
                                      setSectionOrder(newOrder);
                                   }} className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-opacity text-slate-400"><ChevronUp className="w-3.5 h-3.5"/></button>
                                   <button disabled={i === sectionOrder.length - 1} onClick={() => {
                                      const newOrder = [...sectionOrder];
                                      [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                                      setSectionOrder(newOrder);
                                   }} className="p-1 hover:bg-white/10 rounded disabled:opacity-30 transition-opacity text-slate-400"><ChevronDown className="w-3.5 h-3.5"/></button>
                                </div>
                             </div>
                             <div className="flex items-center space-x-2 pt-2 mt-2 border-t border-white/[0.06]">
                                 <input type="checkbox" id={`pb-${sec}`} checked={!!pageBreaks[sec]} onChange={(e) => setPageBreaks(p => ({ ...p, [sec]: e.target.checked }))} className="w-3.5 h-3.5 text-indigo-500 focus:ring-indigo-500/50 rounded border-white/20 bg-white/5" />
                                 <label htmlFor={`pb-${sec}`} className="text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer">Add Page Break After</label>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
             )}
          </section>

          <section className="flex-1 bg-white/[0.03] overflow-y-auto scroll-hide flex flex-col p-6 items-center min-w-0 min-h-0 relative z-0">
             
             {/* PDF Preview Zoom & Nav Toolbar */}
             <div className="w-full max-w-[816px] flex items-center justify-between mb-4 shrink-0 glass px-4 py-2 rounded-xl z-10">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  PDF Resume Live Preview
               </h3>
               
               <div className="flex items-center space-x-3 text-slate-600">
                  <button 
                    onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.05))} 
                    className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 transition"
                    title="Zoom Out"
                  >
                     <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold tech-input px-2 py-0.5 rounded text-slate-300 select-none">
                     {Math.round(zoomScale * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoomScale(prev => Math.min(1.5, prev + 0.05))} 
                    className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 transition"
                    title="Zoom In"
                  >
                     <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-white/10"></div>
                  <button 
                    onClick={() => setZoomScale(0.85)} 
                    className="p-1.5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 transition text-[10px] font-bold uppercase tracking-wider"
                    title="Fit to Page"
                  >
                     <Maximize2 className="w-3.5 h-3.5" />
                  </button>
               </div>
             </div>

              <div 
                className="pb-10 origin-top transition-transform duration-200 relative flex flex-col gap-8" 
                style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                id="resume-preview-content"
              >
                {(() => {
                    const pages: string[][] = [[]];
                    let currentPage = 0;
                    sectionOrder.forEach(sec => {
                       pages[currentPage].push(sec);
                       if (pageBreaks[sec]) {
                           currentPage++;
                           pages.push([]);
                       }
                    });
                    
                    // remove empty pages at the end
                    if (pages[pages.length > 0 && pages.length - 1].length === 0) pages.pop();
                    if (pages.length === 0) pages.push([]); // ensure at least 1 page

                    return pages.map((pageSections, i) => (
                       <div key={i} className="shadow-2xl ring-1 ring-slate-900/5 bg-white print-page relative w-[816px] min-h-[1056px]" style={{ pageBreakAfter: 'always' }}>
                         <TemplateRenderer 
                            template={selectedTemplate} 
                            data={resumeData} 
                            showProfilePicture={showProfilePicture} 
                            sectionOrder={pageSections} 
                            fontFamily={fontFamily} 
                            aestheticTheme={aestheticTheme} 
                            pageBreaks={pageBreaks}
                            pageIndex={i}
                         />
                         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 font-bold uppercase tracking-widest no-print">Page {i + 1}</div>
                       </div>
                    ));
                 })()}
             </div>
          </section>
        </div>

        <footer className="h-20 glass-header px-8 flex items-center justify-between shrink-0 relative z-10">
           <div className="flex items-center space-x-6">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
               Templates
             </div>
             <div className="flex space-x-3 overflow-x-auto scroll-hide">
               {templates.map(t => (
                 <div 
                   key={t.id}
                   onClick={() => setSelectedTemplate(t.id)}
                   className={`w-32 h-10 border rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                     selectedTemplate === t.id 
                       ? 'border-indigo-500/50 shadow-[0_0_0_2px_rgba(99,102,241,0.2)] bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]/200/10' 
                       : 'border-white/10 hover:border-white/20 bg-white/5'
                   }`}
                 >
                   <span className={`text-[11px] font-bold uppercase tracking-wider ${
                     selectedTemplate === t.id ? 'text-indigo-300' : 'text-slate-500'
                   }`}>{t.name}</span>
                 </div>
               ))}
               {selectedTemplate === 'aesthetic' && (
                 <div className="flex items-center space-x-2 pl-4 ml-2 border-l border-white/10">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Color:</span>
                   {[
                     { id: 'default', color: 'bg-pink-400' },
                     { id: 'ocean', color: 'bg-sky-400' },
                     { id: 'sunset', color: 'bg-orange-400' },
                     { id: 'forest', color: 'bg-emerald-400' }
                   ].map(th => (
                      <div 
                         key={th.id}
                         onClick={() => setAestheticTheme(th.id as any)}
                         className={`w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 ${th.color} ${aestheticTheme === th.id ? 'ring-2 ring-offset-2 ring-blue-500' : 'ring-1 ring-black/10'}`}
                         title={th.id}
                      />
                   ))}
                 </div>
               )}
             </div>
           </div>
           
           <button 
             onClick={generateCoverLetter}
             disabled={isCoverLetterGenerating}
             className="px-6 py-2.5 btn-primary text-xs rounded-xl disabled:opacity-70 flex items-center"
           >
             {isCoverLetterGenerating ? (
               <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Auto-Writing...</>
             ) : (
               <><FileText className="w-4 h-4 mr-2" /> Write Cover Letter (Word)</>
             )}
           </button>
        </footer>
         </motion.div>
          } />
          
          <Route path="/edit" element={
           <motion.div
            key="edit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col p-8 bg-slate-900/50 items-center overflow-y-auto"
           >
             <div className="w-full max-w-4xl card flex flex-col h-full overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black text-white">Source Data Editor</h2>
                   <button 
                     onClick={() => {
                        try {
                           const editorText = (document.getElementById('json-editor') as HTMLTextAreaElement).value;
                           const parsed = JSON.parse(editorText);
                           setResumeData(parsed);
                           alert('Data saved successfully!');
                        } catch(e) {
                           alert('Invalid JSON! Please check your formatting.');
                        }
                     }}
                      className="px-4 py-2 btn-primary text-sm rounded-xl fab-glow"
                   >Save Changes</button>
                </div>
                <p className="text-sm text-slate-500 mb-4 font-medium">Edit the raw JSON data that powers your resume. Be careful to maintain valid JSON syntax.</p>
                <textarea 
                   id="json-editor"
                    className="w-full flex-1 p-4 font-mono text-xs border border-slate-700 rounded-lg focus:ring-2 focus:border-[var(--accent-primary)] outline-none resize-none bg-slate-900/50 text-slate-300"
                   defaultValue={JSON.stringify(resumeData, null, 2)}
                />
             </div>
          </motion.div>
          } />
          
          <Route path="/chat" element={
          <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="flex-1 overflow-hidden h-full">
            <CareerChat resumeData={resumeData} deductCredits={handleDeductCredits} />
          </motion.div>
          } />
          
          <Route path="/interview" element={
          <motion.div key="interview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="flex-1 overflow-hidden h-full">
            <VoiceInterview resumeData={resumeData} deductCredits={handleDeductCredits} />
          </motion.div>
          } />
          
          <Route path="/dashboard" element={
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 overflow-hidden h-full"
          >
            {isAdmin ? <FounderDashboard adminUsersInfo={adminUsersInfo} setAdminUsersInfo={setAdminUsersInfo} /> : <Navigate to="/resume" replace />}
          </motion.div>
          } />
          <Route path="*" element={<Navigate to="/resume" replace />} />
        </Routes>
        </AnimatePresence>













































































































      </main>

      {showPricing && <PricingModal setShowPricing={setShowPricing} user={user} resumeData={resumeData} isPro={isPro} />}

      {ingestionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="modal-container max-w-lg w-full p-6">
              <h2 className="text-lg font-bold text-white mb-2">
                 {ingestionModal === 'linkedin' ? 'Sync LinkedIn Profile' : 'Paste Manual Data'}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                 {ingestionModal === 'linkedin' ? 'Enter your public LinkedIn URL.' : 'Paste your basic resume text, skills, or background here:'}
              </p>
              {ingestionModal === 'linkedin' ? (
                 <input 
                   type="text" 
                   value={ingestionInput} 
                   onChange={e => setIngestionInput(e.target.value)}
                   className="w-full tech-input rounded-xl px-3 py-2 text-sm mb-4"
                   placeholder="https://linkedin.com/in/yourprofile"
                 />
              ) : (
                 <textarea 
                   value={ingestionInput}
                   onChange={e => setIngestionInput(e.target.value)}
                   className="w-full h-32 tech-input rounded-xl px-3 py-2 text-sm mb-4 resize-none"
                   placeholder="My name is... I have 5 years of experience in..."
                 />
              )}
              <div className="flex justify-end space-x-3">
                 <button 
                   onClick={() => {
                      setIngestionModal(null);
                      setIngestionInput('');
                   }}
                   className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-white"
                 >Cancel</button>
                 <button 
                   onClick={async () => {
                      const val = ingestionInput.trim();
                      if (!val) return;
                      
                      if (ingestionModal === 'linkedin') {
                         setResumeData(prev => ({
                            ...prev,
                            personalDetails: { ...prev.personalDetails, linkedin: val }
                         }));
                         setIngestionModal(null);
                         setIngestionInput('');
                      } else {
                         setIngestionModal(null);
                         setIngestionInput('');
                         await processIngestion(val);
                      }
                   }}
                   className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded shadow hover:bg-blue-700 transition"
                 >
                    {ingestionModal === 'linkedin' ? 'Sync Profile' : 'Add Data'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {editingSection && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="modal-container max-w-2xl w-full flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center rounded-t-xl">
                 <div>
                    <h2 className="text-lg font-bold text-white capitalize">Edit {editingSection}</h2>
                    <p className="text-xs text-slate-500 mt-1">Make your edits below in JSON format. Tip: You can add or reduce items directly in the arrays.</p>
                 </div>
                 <button onClick={() => setEditingSection(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-4 flex-1 overflow-auto">
                 <textarea
                    value={sectionEditValue}
                    onChange={e => setSectionEditValue(e.target.value)}
                    className="w-full h-[50vh] font-mono text-sm p-4 tech-input rounded-xl text-slate-200"
                    spellCheck="false"
                 />
              </div>
              <div className="p-4 border-t border-white/10 flex justify-end gap-3 rounded-b-xl">
                 <button 
                   onClick={() => setEditingSection(null)}
                   className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-white"
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={() => {
                      try {
                         const parsed = JSON.parse(sectionEditValue);
                         if (editingSection === 'summary') {
                            setResumeData(prev => ({...prev, personalDetails: {...prev.personalDetails, summary: parsed}}));
                         } else {
                            setResumeData(prev => ({...prev, [editingSection]: parsed}));
                         }
                         setEditingSection(null);
                      } catch (err) {
                         alert("Invalid JSON format! Please check brackets and quotes.");
                      }
                   }}
                   className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded shadow hover:bg-blue-700 transition"
                 >
                    Save Changes
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-lg flex items-start gap-3 border text-xs font-semibold uppercase tracking-wider pointer-events-auto transition-all duration-300 backdrop-blur-xl ${
              toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-900/80 text-emerald-300' :
              toast.type === 'error' ? 'border-red-500/30 bg-red-900/80 text-red-300' :
              'border-blue-500/30 bg-blue-900/80 text-blue-300'
            }`}
          >
            {toast.type === 'success' && <Check className="w-4 h-4 text-green-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span className="flex-1 normal-case font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Onboarding Wizard Modal */}
      {isOnboarding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-2xl w-full p-6 md:p-8 relative flex flex-col min-h-[300px] max-h-[90vh] overflow-y-auto scroll-hide justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-3xl modal-enter">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 left-0"></div>
            
            <button 
                onClick={() => setIsOnboarding(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition z-50"
              >
                <X className="w-5 h-5" />
              </button>

            {onboardingStep === 'options' && (
              <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full px-4">
                <div className="text-center mb-8 mt-2">
                  <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#B500FF]/20 px-4 py-1.5 rounded-full border border-white/10 mb-5 backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Precision Match AI</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2 drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">Create Your Next Resume</h2>
                  <p className="text-sm md:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">Choose how you want to build your resume. Let our AI do the heavy lifting from an existing source, or start with a clean slate.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 my-2 perspective-1000">
                  {/* Card 1: Upload File */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative cursor-pointer flex flex-col items-center justify-center text-center p-6 rounded-2xl glass-sidebar border border-white/10 hover:border-[#00F0FF]/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-2xl bg-[#0f0b1e]/60 lift-3d"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4 group-hover:bg-[#00F0FF]/20 group-hover:text-[#00F0FF] group-hover:border-[#00F0FF]/50 transition-all shadow-lg">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-0 group-hover:mb-2 transition-all duration-300">Upload File</h3>
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300">
                       <p className="text-[10px] text-slate-400 leading-relaxed overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Import an existing PDF or DOCX. AI will extract and structure all your data.</p>
                    </div>
                  </div>

                  {/* Card 2: Sync LinkedIn */}
                  <div 
                    onClick={() => setOnboardingStep('linkedin')}
                    className="group relative cursor-pointer flex flex-col items-center justify-center text-center p-6 rounded-2xl glass-sidebar border border-white/10 hover:border-[#B500FF]/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-2xl bg-[#0f0b1e]/60 lift-3d"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4 group-hover:bg-[#B500FF]/20 group-hover:text-[#B500FF] group-hover:border-[#B500FF]/50 transition-all shadow-lg">
                      <Linkedin className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-0 group-hover:mb-2 transition-all duration-300">LinkedIn Sync</h3>
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300">
                       <p className="text-[10px] text-slate-400 leading-relaxed overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Paste your LinkedIn URL and magically sync your entire professional history.</p>
                    </div>
                  </div>

                  {/* Card 3: Build Manually */}
                  <div 
                    onClick={() => {
                      const newId = Math.random().toString(36).substring(7);
                      setResumes(prev => [...prev, { id: newId, name: 'Untitled Resume', data: blankData }]);
                      setActiveResumeId(newId);
                      setBaseContext(''); 
                      setJobDescription('');
                      setIsOnboarding(false);
                      setWorkspaceSubTab('form');
                    }}
                    className="group relative cursor-pointer flex flex-col items-center justify-center text-center p-6 rounded-2xl glass-sidebar border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-2xl bg-[#0f0b1e]/60 lift-3d"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-all shadow-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-0 group-hover:mb-2 transition-all duration-300">Build Manually</h3>
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300">
                       <p className="text-[10px] text-slate-400 leading-relaxed overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Start with a clean slate and type your details step-by-step.</p>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-10">
                  {resumes.length > 0 && resumes[0].name !== '' && (
                    <button 
                      onClick={() => setIsOnboarding(false)}
                      className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                      ← Cancel and return to workspace
                    </button>
                  )}
                </div>
              </div>
            )}

            {onboardingStep === 'linkedin' && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Sync LinkedIn Profile</h3>
                  <p className="text-xs text-slate-500 mb-4">Paste your public LinkedIn profile URL below. Our AI scraper will extract your work experience, education, and skills to populate your resume.</p>
                  <input 
                    type="text" 
                    value={ingestionInput} 
                    onChange={e => setIngestionInput(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button 
                    onClick={() => {
                      setOnboardingStep('options');
                      setIngestionInput('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-white"
                  >Back</button>
                  <button 
                    onClick={async () => {
                      const val = ingestionInput.trim();
                      if (!val) return;
                      setOnboardingStep('loading');
                      setIngestionInput('');
                      
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/extract-linkedin`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: val })
                        });
                        const data = await res.json();
                        if (data.text) {
                          await processIngestion(data.text);
                        } else {
                          alert("Failed to sync LinkedIn details. Try pasting text manually.");
                          setOnboardingStep('options');
                        }
                      } catch(e) {
                        console.error(e);
                        alert("Error contacting LinkedIn sync service.");
                        setOnboardingStep('options');
                      }
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition"
                  >
                    Sync Profile
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 'loading' && (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4 animate-[spin_2s_linear_infinite]" />
                <h3 className="text-lg font-bold text-white animate-pulse">AI Is Structuring Your Resume...</h3>
                <p className="text-xs text-slate-400 mt-2 text-center max-w-xs leading-relaxed">
                  We are processing your professional data and structuring it into a beautiful, ATS-optimized layout. This may take up to 20 seconds.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-md w-full p-6 modal-enter">
            <h2 className="text-lg font-bold text-white mb-2">Send Feedback</h2>
            <p className="text-sm text-slate-400 mb-4">Found a bug? Have a feature request? Let us know.</p>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              className="w-full h-28 tech-input rounded-xl px-3 py-2 text-sm mb-4 resize-none"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowFeedback(false); setFeedbackText(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-white">Cancel</button>
              <button
                onClick={async () => {
                  if (!feedbackText.trim()) return;
                  try {
                    const feedbackRef = doc(collection(db, 'feedback'), Date.now().toString());
                    await setDoc(feedbackRef, {
                      userId: (user && user.uid !== 'local-guest-uid') ? user.uid : 'anonymous',
                      email: (user && user.email) ? user.email : 'Anonymous',
                      text: feedbackText.trim(),
                      createdAt: new Date().toISOString()
                    });
                    showToast('Thank you for your feedback!', 'success');
                    setShowFeedback(false);
                    setFeedbackText('');
                  } catch (e) {
                    console.error(e);
                    showToast('Failed to submit feedback.', 'error');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded shadow hover:bg-blue-700 transition"
              >Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-md w-full p-6 modal-enter">
            <h2 className="text-lg font-bold text-white mb-2">Contact Support</h2>
            <p className="text-sm text-slate-400 mb-4">Need help or facing an issue? Describe it below and our team will investigate.</p>
            <textarea
              value={supportText}
              onChange={e => setSupportText(e.target.value)}
              className="w-full h-32 tech-input rounded-xl px-3 py-2 text-sm mb-4 resize-none"
              placeholder="Describe your issue in detail..."
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowSupport(false); setSupportText(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-white">Cancel</button>
              <button
                onClick={async () => {
                  if (!supportText.trim()) return;
                  try {
                    const supportRef = doc(collection(db, 'support_tickets'), Date.now().toString());
                    await setDoc(supportRef, {
                      userId: (user && user.uid !== 'local-guest-uid') ? user.uid : 'anonymous',
                      email: (user && user.email) ? user.email : 'Anonymous',
                      message: supportText.trim(),
                      status: 'open',
                      createdAt: new Date().toISOString()
                    });
                    showToast('Support ticket submitted successfully!', 'success');
                    setShowSupport(false);
                    setSupportText('');
                  } catch (e) {
                    console.error(e);
                    showToast('Failed to submit support ticket.', 'error');
                  }
                }}
                className="px-4 py-2 bg-[var(--accent-primary)] text-slate-900 text-sm font-bold rounded shadow hover:opacity-90 transition"
              >Submit Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* Security & Privacy Modal */}
      {showSecurity && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-2xl w-full p-8 overflow-y-auto max-h-[90vh] scroll-hide modal-enter">
            <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
               <ShieldAlert className="w-6 h-6 mr-3 text-green-400" /> Security & SOC2 Compliance Overview
            </h2>
            <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
               <p>
                 At Precision Match, we take the security and privacy of your professional data extremely seriously. While we are continuously evaluating official SOC2 Type II certification, our infrastructure is built upon Google Cloud and Firebase, which inherently provides enterprise-grade security protocols.
               </p>
               <div>
                  <h3 className="text-white font-bold mb-2">Data Encryption</h3>
                  <p>All data, including your resume details and job descriptions, is encrypted in transit using industry-standard HTTPS/TLS and encrypted at rest using AES-256 encryption.</p>
               </div>
               <div>
                  <h3 className="text-white font-bold mb-2">Access Control</h3>
                  <p>Authentication is handled securely via Google Identity Services. We do not store or process passwords directly. Internal access to production databases is strictly audited and restricted.</p>
               </div>
               <div>
                  <h3 className="text-white font-bold mb-2">Privacy & AI Processing</h3>
                  <p>When you use our AI features, your data is processed securely to generate your tailored resume. We do not use your personal resume data to train foundational models. Your data remains yours.</p>
               </div>
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={() => setShowSecurity(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded transition">Close</button>
            </div>
          </div>
        </div>
      )}
      

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-sm w-full p-6 modal-enter">
            <h2 className="text-lg font-bold text-red-400 mb-2">Delete Account</h2>
            <p className="text-sm text-slate-400 mb-6">This will permanently delete your account and all associated resume data. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-white">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    if (user && user.uid !== 'local-guest-uid') {
                      const userRef = doc(db, 'users', user.uid);
                      const { deleteDoc } = await import('firebase/firestore');
                      await deleteDoc(userRef);
                    }
                    await logout();
                    setShowDeleteConfirm(false);
                    showToast('Your account has been deleted.', 'info');
                  } catch (e) {
                    console.error(e);
                    showToast('Failed to delete account. Please contact support.', 'error');
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded shadow hover:bg-red-700 transition"
              >Delete My Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Modal (Privacy / Terms) */}
      {showLegalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-2xl w-full flex flex-col max-h-[85vh] modal-enter">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{showLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
              <button onClick={() => setShowLegalModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-300 leading-relaxed space-y-4">
              {showLegalModal === 'privacy' ? (
                <>
                  <p><strong>Last Updated:</strong> July 2026</p>
                  <p>Precision Match (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy and ensuring compliance with applicable data protection laws, including the GDPR and CCPA. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
                  <h3 className="font-bold text-white text-base">Information We Collect</h3>
                  <p>We collect information you provide directly: your name, email address (via Google Sign-In), resume content (employment history, education, skills, contact details), and job descriptions you submit for AI tailoring.</p>
                  <h3 className="font-bold text-white text-base">How We Use Your Information (AI Consent)</h3>
                  <p>Your data is used solely to: generate and tailor resumes using AI, provide the app&apos;s core functionality, process payments via Stripe, and improve our service. <strong>By using our service, you explicitly consent to your resume data and job descriptions being processed by Google Gemini AI</strong> to generate tailored content. We do <strong>not</strong> sell your personal data to third parties.</p>
                  <h3 className="font-bold text-white text-base">Data Storage &amp; Security</h3>
                  <p>Data is stored securely in Google Cloud Firestore with encryption at rest and in transit. Access is restricted by Firebase Security Rules that ensure users can only access their own data.</p>
                  <h3 className="font-bold text-white text-base">Third-Party Services</h3>
                  <p>We use Google Gemini AI (to process resumes), Stripe (to process payments securely—we never store your credit card details), and Firebase (for authentication and storage). Each service operates under its respective strict privacy guidelines.</p>
                  <h3 className="font-bold text-white text-base">Your Data Rights (GDPR &amp; CCPA)</h3>
                  <p>You have the right to access, update, or delete your personal data at any time. You may delete your account and all associated data permanently using the &quot;Delete Account&quot; option in the sidebar. To request a copy of your data, please contact us.</p>
                  <h3 className="font-bold text-white text-base">Contact</h3>
                  <p>For privacy inquiries or data requests, <button onClick={() => { setShowLegalModal(null); setShowSupport(true); }} className="text-blue-400 hover:text-blue-300 underline">contact support</button>.</p>
                </>
              ) : (
                <>
                  <p><strong>Last Updated:</strong> July 2026</p>
                  <p>By using Precision Match, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
                  <h3 className="font-bold text-white text-base">Service Description</h3>
                  <p>Precision Match is an AI-powered resume builder that helps users create and tailor resumes. The service uses advanced artificial intelligence to generate content suggestions based on the information you provide.</p>
                  <h3 className="font-bold text-white text-base">AI-Generated Content Disclaimer</h3>
                  <p><strong>Important:</strong> AI-generated resume content is provided as suggestions only. You are solely responsible for reviewing, verifying, and approving all content before using it in job applications. We do not guarantee the accuracy, completeness, or effectiveness of AI-generated content, nor do we guarantee job placement or interview success.</p>
                  <h3 className="font-bold text-white text-base">User Responsibilities</h3>
                  <p>You agree to: provide accurate information, review all AI-generated content for accuracy, not use the service for illegal or fraudulent purposes, and not attempt to abuse, scrape, or circumvent rate limits or security measures of the platform.</p>
                  <h3 className="font-bold text-white text-base">Payments &amp; Billing (Stripe)</h3>
                  <p>Payments for premium features and credits are processed securely through Stripe. By completing a purchase, you agree to provide current, complete, and accurate billing information. All charges are final. Refund requests are evaluated on a case-by-case basis; please contact support within 7 days of your purchase if you experience a technical failure.</p>
                  <h3 className="font-bold text-white text-base">Limitation of Liability</h3>
                  <p>Precision Match is provided &quot;as is&quot; without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our service or AI-generated resume content.</p>
                  <h3 className="font-bold text-white text-base">Changes to Terms</h3>
                  <p>We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of any updated terms.</p>
                  <h3 className="font-bold text-white text-base">Contact</h3>
                  <p>For questions about these terms, <button onClick={() => { setShowLegalModal(null); setShowSupport(true); }} className="text-blue-400 hover:text-blue-300 underline">contact support</button>.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Update Toast */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999999] flex items-center gap-4 bg-slate-900/90 border border-[#00F0FF]/30 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,240,255,0.2)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00F0FF]/10 flex items-center justify-center border border-[#00F0FF]/20 animate-pulse">
                <Sparkles className="w-5 h-5 text-[#00F0FF]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">New Update Available</p>
                <p className="text-slate-400 text-xs">v{newVersionData?.version} is ready.</p>
              </div>
            </div>
            <button
              onClick={triggerUpdate}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
            >
              Refresh to Update
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Changelog Modal */}
      {showChangelogModal && changelogData && (
        <ChangelogModal
          version={changelogData.version}
          changelog={changelogData.changelog}
          onClose={() => setShowChangelogModal(false)}
        />
      )}

    </div>
  );
}

