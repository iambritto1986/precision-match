/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ResumeData, TemplateId } from './types';
import { TemplateRenderer } from './components/ResumeTemplates';
import VoiceInterview from './components/VoiceInterview';
import CareerChat from './components/CareerChat';
import ResumeFormEditor from './components/ResumeFormEditor';
import { exportToDocx, exportToPdf, exportCoverLetterDocx } from './lib/export';
import { Upload, FileText, Download, Briefcase, RefreshCw, Layers, CheckCircle2, Image as ImageIcon, MapPin, Phone, Mail, Linkedin, Globe, FileOutput, Mic, MessageCircle, ChevronUp, ChevronDown, Code, X, Users, LogOut, LogIn, ZoomIn, ZoomOut, Maximize2, Sparkles, Check, AlertCircle, Info } from 'lucide-react';
import { auth, loginWithGoogle, logout, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs, query, updateDoc } from 'firebase/firestore';

const defaultData: ResumeData = {
  personalDetails: {
    name: "Alex Rivera",
    title: "Senior Product Designer",
    email: "arivera@email.com",
    phone: "+1 555 0123",
    location: "New York, NY",
    linkedin: "linkedin.com/in/arivera",
    website: "",
    summary: "Innovative Product Designer with over 7 years of experience in creating scalable SaaS solutions. Expert in building design systems that increased engineering velocity by 30%. Passionate about mentoring junior designers and bridging the gap between design and engineering teams.",
    profilePictureUrl: ""
  },
  experience: [
    {
      company: "TechFlow Inc.",
      role: "Lead Product Designer",
      duration: "2019 — Present",
      location: "New York, NY",
      responsibilities: [
        "Architected the v3 design system adopted by 14 cross-functional product squads.",
        "Led UX research initiative that reduced user churn by 12% in the first quarter."
      ]
    },
    {
      company: "CreativeSols",
      role: "Product Designer",
      duration: "2016 — 2019",
      location: "San Francisco, CA",
      responsibilities: [
        "Designed end-to-end features for core B2B platform.",
        "Collaborated closely with PMs and engineers."
      ]
    }
  ],
  education: [
    {
      institution: "State University",
      degree: "B.S. in Design",
      duration: "2012 — 2016",
      location: "State College, PA",
      details: ""
    }
  ],
  skills: [
    { category: "Design Tools", items: ["Figma", "Sketch", "Adobe CC"] },
    { category: "Methods", items: ["User Research", "Wireframing", "Prototyping"] }
  ]
};

const blankData: ResumeData = {
  personalDetails: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "", profilePictureUrl: "" },
  experience: [],
  education: [],
  skills: [],
  projects: []
};

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [adminUsersInfo, setAdminUsersInfo] = useState<any[]>([]);

  const [fontFamily, setFontFamily] = useState<string>('');
  const [credits, setCredits] = useState<number>(3);
  const [isPro, setIsPro] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const defaultOrder = ['summary', 'experience', 'skills', 'education', 'projects'];
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [pageBreaks, setPageBreaks] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<'resume' | 'chat' | 'interview' | 'edit' | 'dashboard'>('resume');
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
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser((prev: any) => {
         if (prev && prev.uid === 'local-guest-uid') return prev;
         return currentUser;
      });
      if (currentUser) {
        // Read user doc
        const userRef = doc(db, 'users', currentUser.uid);
        onSnapshot(userRef, (snapshot) => {
           if (snapshot.exists()) {
              const data = snapshot.data();
              setUserData(data);
              setCredits(data.credits ?? 3);
              setIsPro(data.isPro || currentUser.email === 'iambrittothomas@gmail.com');
           } else {
              // Create user
              setDoc(userRef, { 
                 email: currentUser.email || '',
                 createdAt: new Date().toISOString(),
                 credits: 3,
                 isPro: currentUser.email === 'iambrittothomas@gmail.com'
              }).catch(e => console.error("Error setting user doc", e));
           }
        }, (error) => {
           console.error("Firestore Error User Profile: ", error);
        });

        // Check Admin
        setIsAdmin(false); // Default to false before checking
        const adminRef = doc(db, 'admins', currentUser.uid);
        try {
            const adminSnap = await getDoc(adminRef);
            if (adminSnap.exists() || currentUser.email === 'iambrittothomas@gmail.com') {
               setIsAdmin(true);
               // Fetch all users for dashboard
               try {
                  const userSnap = await getDocs(collection(db, 'users'));
                  const users: any[] = [];
                  userSnap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
                  setAdminUsersInfo(users);
               } catch(e) {
                  console.error("Error fetching users for dashboard", e);
               }
            }
        } catch(e) {
            console.error(e);
            if (currentUser.email === 'iambrittothomas@gmail.com') {
               setIsAdmin(true);
            }
        }
      } else {
        setUserData(null);
        setCredits(3);
        setIsPro(false);
        setIsAdmin(false);
        setAdminUsersInfo([]);
        if (activeTab === 'dashboard') setActiveTab('resume');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const handlePurchase = async (priceId: string) => {
    if (!user) {
       alert("Please sign in to purchase.");
       return loginWithGoogle();
    }
    try {
      const res = await fetch('/api/create-checkout-session', {
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

  const [jobDescription, setJobDescription] = useState('Seeking a Senior Product Designer with 5+ years experience in SaaS. Proficient in Figma, Design Systems, and User Research. Experience with React/Frontend is a plus. Must lead complex projects and mentor junior staff.');
  const [instructions, setInstructions] = useState('');
  const [resumes, setResumes] = useState<{id: string, name: string, data: ResumeData}[]>([{id: '1', name: defaultData.personalDetails.name || 'Untitled Resume', data: defaultData}]);
  const [activeResumeId, setActiveResumeId] = useState<string>('1');

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

  const handleStartNewResume = () => {
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
      const res = await fetch('/api/generate-resume', {
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
      const res = await fetch('/api/extract-resume', {
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

  const generateResume = async () => {
    if (credits <= 0) {
       setShowPricing(true);
       return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-resume', {
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
      const res = await fetch('/api/generate-cover-letter', {
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
    { id: 'modern', name: 'Modern', previewClass: 'bg-white border text-blue-600' },
    { id: 'minimalist', name: 'Minimal', previewClass: 'bg-slate-900 border text-white' },
    { id: 'executive', name: 'Executive', previewClass: 'bg-white border text-slate-800' },
    { id: 'aesthetic', name: 'Aesthetic', previewClass: 'bg-pink-50 border text-pink-600' },
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

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-inter">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-4 animate-pulse">P</div>
          <p className="text-sm text-slate-400 animate-pulse">Loading Precision Match...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-inter">
         <div className="max-w-md w-full bg-white p-8 border border-slate-200 rounded-xl shadow-lg text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-2xl text-white mx-auto mb-6">P</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 mb-2">Precision Match</h1>
            <p className="text-slate-500 text-sm mb-8 font-medium">Please log in to continue building your resume and accessing premium AI features.</p>
            <button onClick={loginWithGoogle} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition shadow-sm hover:shadow-md flex items-center justify-center">
               <LogIn className="w-4 h-4 mr-2" />
               Log in with Google
            </button>
            <button 
              onClick={() => {
                setIsGuestMode(true);
                setUser({
                  uid: 'local-guest-uid',
                  displayName: 'Local Guest',
                  email: 'guest@example.com',
                  photoURL: ''
                });
                setIsPro(true);
                setCredits(100);
                setAuthLoading(false);
              }}
              className="w-full mt-3 bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200 transition text-sm flex items-center justify-center border border-slate-200"
            >
               <Users className="w-4 h-4 mr-2 text-slate-500" />
               Continue as Guest (Local Test)
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-inter">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .status-badge { background: #dcfce7; color: #166534; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; }
      ` }} />
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-lg">P</div>
            <div>
              <h1 className="text-lg font-bold leading-none">Precision Match</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Resume Builder</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 mt-4 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 space-y-1">
            <div className="px-6 py-3 text-slate-400 text-[11px] uppercase font-semibold tracking-wider">Main Menu</div>
            {isAdmin && <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} className={`flex items-center px-6 py-3 text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 border-r-4 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}><Users className="w-4 h-4 mr-3"/> Founder Hub</a>}
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('resume'); }} className={`flex items-center px-6 py-3 text-sm transition-colors ${activeTab === 'resume' ? 'bg-slate-800 border-r-4 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}><FileText className="w-4 h-4 mr-3"/> Resume Builder</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('edit'); }} className={`flex items-center px-6 py-3 text-sm transition-colors ${activeTab === 'edit' ? 'bg-slate-800 border-r-4 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}><Code className="w-4 h-4 mr-3"/> Source Data</a>
            <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                if (!isPro) { setShowPricing(true); return; }
                setActiveTab('chat'); 
            }} className={`flex items-center px-6 py-3 text-sm transition-colors ${activeTab === 'chat' ? 'bg-slate-800 border-r-4 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                <MessageCircle className="w-4 h-4 mr-3" /> Career Chat {!isPro && <span className="ml-auto bg-slate-800 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Pro</span>}
            </a>
            <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                if (!isPro) { setShowPricing(true); return; }
                setActiveTab('interview'); 
            }} className={`flex items-center px-6 py-3 text-sm transition-colors ${activeTab === 'interview' ? 'bg-slate-800 border-r-4 border-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Mic className="w-4 h-4 mr-3"/> Live Interview {!isPro && <span className="ml-auto bg-slate-800 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">Pro</span>}
            </a>
          </div>
          <div className="px-6 py-6 mt-4 border-t border-slate-800 flex flex-col overflow-y-auto flex-1">
            <button 
               onClick={(e) => { 
                 e.preventDefault(); 
                 handleStartNewResume();
               }} 
               className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition border border-blue-500 mb-6 shadow shrink-0"
            >
               + Start New Resume
            </button>
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold">Resume History</p>
              <div className="flex flex-col gap-2">
                 {resumes.map(resume => (
                   <div 
                      key={resume.id}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${resume.id === activeResumeId ? 'bg-slate-700 ring-1 ring-blue-500' : 'bg-slate-800 hover:bg-slate-700/80'}`}
                   >
                     <div onClick={() => setActiveResumeId(resume.id)} className="pr-6">
                       <p className="text-sm font-medium truncate">{resume.name}</p>
                       <p className="text-[10px] text-slate-400 mt-1 truncate">
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
          
          <div className="px-6 pb-6 pt-2 shrink-0">
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="flex justify-between items-end mb-2">
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">AI Credits</p>
                 <p className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-500/20" onClick={() => setShowPricing(true)}>Upgrade</p>
              </div>
              <p className="text-sm font-medium">{credits} / 3 Free Remaining</p>
              <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${credits > 0 ? 'bg-green-400' : 'bg-red-500'}`} style={{ width: `${(credits/3)*100}%` }}></div>
              </div>
              <p className="text-[10px] mt-2 text-slate-400">1 Credit deducted per generation</p>
            </div>
          </div>
        </nav>
        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden bg-cover bg-center shrink-0" style={{ backgroundImage: user?.photoURL ? `url(${user.photoURL})` : resumeData.personalDetails.profilePictureUrl ? `url(${resumeData.personalDetails.profilePictureUrl})` : 'none' }}></div>
             <div className="overflow-hidden">
               <p className="text-xs font-medium truncate w-24">{user?.displayName || user?.email || resumeData.personalDetails.name || 'Guest'}</p>
               <p className="text-[10px] text-slate-400">{isPro ? 'Pro Member' : 'Free Tier'}</p>
             </div>
             {user ? (
                <button onClick={logout} className="text-slate-400 hover:text-white p-1" title="Log Out"><LogOut className="w-4 h-4" /></button>
             ) : (
                <button onClick={loginWithGoogle} className="text-blue-400 hover:text-blue-300 p-1" title="Log In"><LogIn className="w-4 h-4" /></button>
             )}
          </div>
        </div>
        <div className="px-6 pb-4 flex flex-wrap gap-x-3 gap-y-1">
          <button onClick={() => setShowFeedback(true)} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Feedback</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <button onClick={() => setShowLegalModal('privacy')} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Privacy</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <button onClick={() => setShowLegalModal('terms')} className="text-[10px] text-slate-500 hover:text-slate-300 transition">Terms</button>
          <span className="text-slate-700 text-[10px]">&middot;</span>
          <a href="mailto:support@precisionmatch.app" className="text-[10px] text-slate-500 hover:text-slate-300 transition">Support</a>
          {user && user.uid !== 'local-guest-uid' && (
            <>
              <span className="text-slate-700 text-[10px]">&middot;</span>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-[10px] text-red-400/70 hover:text-red-400 transition">Delete Account</button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'resume' && (
           <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-semibold text-slate-800">Workspace: Tailoring {resumeData.personalDetails.name}'s Resume</h2>
            <span className="status-badge pr-3"><CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />Optimized for ATS</span>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => exportToPdf('resume-preview-content', `${resumeData.personalDetails.name.replace(/ /g, '_')}_Resume.pdf`)} className="px-4 py-2 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center text-slate-700">
               <FileOutput className="w-3 h-3 mr-2" />
               Export PDF
             </button>
             <button onClick={() => exportToDocx(resumeData)} className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center shadow-sm">
               <Download className="w-3 h-3 mr-2" />
               Download Word
             </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <section className={`${
            workspaceSubTab === 'form' ? 'w-[55%] lg:w-[50%]' : 'w-[45%] lg:w-[40%] xl:w-[35%]'
          } border-r border-slate-200 p-6 flex flex-col bg-white overflow-y-auto transition-all duration-300`}>
             
             {/* Sub-tab Navigation */}
             <div className="flex border-b border-slate-200 mb-6 shrink-0">
               {[
                 { id: 'ai', name: 'AI Tailor' },
                 { id: 'form', name: 'Manual Edit' },
                 { id: 'layout', name: 'Page Layout' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setWorkspaceSubTab(tab.id as any)}
                   className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                     workspaceSubTab === tab.id
                       ? 'border-blue-500 text-blue-600 font-bold'
                       : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'
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
                        className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center hover:border-blue-300 cursor-pointer transition-all bg-slate-50 group hover:bg-blue-50/30"
                        onClick={() => fileInputRef.current?.click()}
                      >
                         {isUploading ? (
                            <RefreshCw className="w-5 h-5 text-blue-500 mb-2 animate-spin" />
                         ) : (
                            <Upload className="w-5 h-5 text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                         )}
                         <p className="text-[11px] font-semibold text-slate-700 leading-tight">{isUploading ? 'Parsing...' : 'Upload File'}</p>
                         <p className="text-[9px] text-slate-400 mt-1">PDF/DOCX</p>
                      </div>
                      <div 
                         onClick={() => setIngestionModal('linkedin')}
                         className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-white cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all shadow-sm"
                      >
                         <Linkedin className="w-5 h-5 text-blue-500 mb-2" />
                         <p className="text-[11px] font-semibold text-slate-700 leading-tight">Sync LinkedIn</p>
                         <p className="text-[9px] text-slate-400 mt-1">Paste URL</p>
                      </div>
                      <div 
                         onClick={() => setIngestionModal('paste')}
                         className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-white cursor-pointer hover:border-green-300 hover:bg-green-50/30 transition-all shadow-sm"
                      >
                         <FileText className="w-5 h-5 text-green-500 mb-2" />
                         <p className="text-[11px] font-semibold text-slate-700 leading-tight">Paste Data</p>
                         <p className="text-[9px] text-slate-400 mt-1">Manual Entry</p>
                      </div>
                    </div>
                    
                    {baseContext && (
                       <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 max-h-32 overflow-y-auto">
                         <strong>Extracted text context:</strong><br />
                         {baseContext}
                       </div>
                    )}
                 </div>

                 <div className="space-y-3 flex-1 flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tailor to Job Description</h3>
                    <textarea 
                      className="w-full flex-1 p-4 text-xs lg:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 focus:outline-none placeholder:text-slate-300 resize-none font-inter text-slate-700 shadow-inner min-h-[120px]" 
                      placeholder="Paste the target job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Custom Instructions</h3>
                    <textarea 
                      className="w-full p-4 text-xs lg:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 focus:outline-none placeholder:text-slate-300 resize-none font-inter text-slate-700 shadow-inner min-h-[80px]" 
                      placeholder="e.g. Keep it strictly to one page, highlight my leadership skills..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                    />
                    <button 
                      onClick={generateResume}
                      disabled={isGenerating}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center disabled:opacity-70 mt-4 shrink-0"
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
                 <div className="space-y-4 border-b pb-6">
                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Typography & Style</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Font Family</label>
                       <select 
                         className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
                       <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Profile Photo</label>
                       <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                         <span className="text-xs text-slate-600 flex-1">Show Photo</span>
                         <button 
                           onClick={() => setShowProfilePicture(!showProfilePicture)}
                           className={`w-8 h-4 rounded-full relative transition-colors ${showProfilePicture ? 'bg-blue-500' : 'bg-slate-300'}`}
                         >
                           <div className={`absolute top-0 w-4 h-4 rounded-full bg-white border border-slate-200 transition-all ${showProfilePicture ? 'right-0' : 'left-0'}`}></div>
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
                     <label htmlFor="pic-upload-layout" className="flex-1 text-center py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer shadow-sm text-slate-700 transition">
                       Upload Photo
                     </label>

                     {resumeData.personalDetails.profilePictureUrl && (
                        <button 
                           onClick={async () => {
                             const url = resumeData.personalDetails.profilePictureUrl;
                             if(!url || isUploading) return;
                             setIsUploading(true);
                             try {
                                const base64Code = url.split(',')[1];
                                const mimeType = url.substring(url.indexOf(':') + 1, url.indexOf(';'));
                                const customPrompt = window.prompt("How would you like to edit the picture? (e.g. professional corporate headshot, clean background)");
                                if(!customPrompt) { setIsUploading(false); return; }
                                const res = await fetch('/api/enhance-photo', {
                                   method: 'POST',
                                   headers: {'Content-Type': 'application/json'},
                                   body: JSON.stringify({ fileBase64: base64Code, mimeType, prompt: customPrompt })
                                });
                                const data = await res.json();
                                if(data.imageBase64) {
                                   setResumeData(prev => ({ ...prev, personalDetails: { ...prev.personalDetails, profilePictureUrl: `data:image/jpeg;base64,${data.imageBase64}`} }));
                                   alert("Photo enhanced successfully!");
                                } else {
                                   alert("Error enhancing photo.");
                                }
                             } catch(e) { console.error(e); alert("Failed to enhance photo"); }
                             finally { setIsUploading(false); }
                           }}
                           className="flex-1 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold text-purple-700 transition flex items-center justify-center gap-1.5"
                        >
                           {isUploading ? 'Enhancing...' : <>Sparkles <Sparkles className="w-3.5 h-3.5" /> AI Enhance</>}
                        </button>
                     )}
                   </div>
                 </div>

                 {/* Sections Reordering & Page Breaks */}
                 <div className="space-y-4 flex-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Section Order & Page Breaks</h3>
                    <p className="text-[11px] text-slate-400">Reorder sections on your page and set where you want page breaks to begin for multi-page exports.</p>
                    <div className="flex flex-col gap-2">
                       {sectionOrder.map((sec, i) => (
                          <div key={sec} className="bg-slate-50 border border-slate-200 p-3 rounded-xl hover:bg-slate-100/70 transition-colors">
                             <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-700 capitalize cursor-default">
                                <span>{sec}</span>
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                   <button disabled={i === 0} onClick={() => {
                                      const newOrder = [...sectionOrder];
                                      [newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]];
                                      setSectionOrder(newOrder);
                                   }} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-opacity text-slate-500"><ChevronUp className="w-3.5 h-3.5"/></button>
                                   <button disabled={i === sectionOrder.length - 1} onClick={() => {
                                      const newOrder = [...sectionOrder];
                                      [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
                                      setSectionOrder(newOrder);
                                   }} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-opacity text-slate-500"><ChevronDown className="w-3.5 h-3.5"/></button>
                                </div>
                             </div>
                             <div className="flex items-center space-x-2 pt-2 mt-2 border-t border-slate-200/60">
                                 <input type="checkbox" id={`pb-${sec}`} checked={!!pageBreaks[sec]} onChange={(e) => setPageBreaks(p => ({ ...p, [sec]: e.target.checked }))} className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded border-gray-300" />
                                 <label htmlFor={`pb-${sec}`} className="text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer">Add Page Break After</label>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
             )}
          </section>

          <section className="flex-1 bg-slate-100 overflow-y-auto scroll-hide flex flex-col p-6 items-center">
             
             {/* PDF Preview Zoom & Nav Toolbar */}
             <div className="w-full max-w-[816px] flex items-center justify-between mb-4 shrink-0 bg-white px-4 py-2 border border-slate-200 rounded-xl shadow-sm z-10">
               <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  PDF Resume Live Preview
               </h3>
               
               <div className="flex items-center space-x-3 text-slate-600">
                  <button 
                    onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.05))} 
                    className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-200 hover:text-slate-800 transition"
                    title="Zoom Out"
                  >
                     <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-700 select-none">
                     {Math.round(zoomScale * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoomScale(prev => Math.min(1.5, prev + 0.05))} 
                    className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-200 hover:text-slate-800 transition"
                    title="Zoom In"
                  >
                     <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <button 
                    onClick={() => setZoomScale(0.85)} 
                    className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-200 hover:text-slate-800 transition text-[10px] font-bold uppercase tracking-wider"
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
                       <div key={i} className="shadow-2xl ring-1 ring-slate-900/5 bg-white overflow-hidden print-page relative break-inside-avoid" style={{ pageBreakAfter: 'always' }}>
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

        <footer className="h-20 bg-white border-t border-slate-200 px-8 flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-6">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
               Templates
             </div>
             <div className="flex space-x-3 overflow-x-auto scroll-hide">
               {templates.map(t => (
                 <div 
                   key={t.id}
                   onClick={() => setSelectedTemplate(t.id)}
                   className={`w-32 h-10 border rounded flex items-center justify-center cursor-pointer transition-all ${
                     selectedTemplate === t.id 
                       ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)] bg-blue-50' 
                       : 'border-slate-200 hover:border-slate-400 bg-slate-50'
                   }`}
                 >
                   <span className={`text-[11px] font-bold uppercase tracking-wider ${
                     selectedTemplate === t.id ? 'text-blue-700' : 'text-slate-500'
                   }`}>{t.name}</span>
                 </div>
               ))}
               {selectedTemplate === 'aesthetic' && (
                 <div className="flex items-center space-x-2 pl-4 ml-2 border-l border-slate-200">
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
             className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-70 flex items-center"
           >
             {isCoverLetterGenerating ? (
               <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Auto-Writing...</>
             ) : (
               <><FileText className="w-4 h-4 mr-2" /> Write Cover Letter (Word)</>
             )}
           </button>
        </footer>
        </div>
        )}

        {activeTab === 'edit' && (
          <div className="flex-1 flex flex-col p-8 bg-slate-50 items-center overflow-y-auto">
             <div className="w-full max-w-4xl bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black text-slate-800">Source Data Editor</h2>
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
                     className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded shadow hover:bg-blue-700 transition"
                   >Save Changes</button>
                </div>
                <p className="text-sm text-slate-500 mb-4 font-medium">Edit the raw JSON data that powers your resume. Be careful to maintain valid JSON syntax.</p>
                <textarea 
                   id="json-editor"
                   className="w-full flex-1 p-4 font-mono text-xs border border-slate-200 rounded-lg focus:ring-2 focus:border-blue-500 outline-none resize-none bg-slate-50 text-slate-700"
                   defaultValue={JSON.stringify(resumeData, null, 2)}
                />
             </div>
          </div>
        )}

        {activeTab === 'chat' && <div className="flex-1 overflow-hidden h-full"><CareerChat resumeData={resumeData} /></div>}
        {activeTab === 'interview' && <div className="flex-1 overflow-hidden h-full"><VoiceInterview resumeData={resumeData} /></div>}
        
        {activeTab === 'dashboard' && isAdmin && (
           <div className="flex-1 bg-slate-50 overflow-y-auto p-8 lg:p-12">
              <div className="max-w-5xl mx-auto space-y-8">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Founder Analytics Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-1">Metrics and user acquisition insights.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Total Users</p>
                       <p className="text-3xl font-black text-slate-900">{adminUsersInfo.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Pro Members</p>
                       <p className="text-3xl font-black text-blue-600">{adminUsersInfo.filter(u => u.isPro).length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Current Active Revenue (MRR)</p>
                       <p className="text-3xl font-black text-green-600">${adminUsersInfo.filter(u => u.isPro).length * 5}</p>
                    </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                       <h3 className="text-sm font-bold text-slate-800">User Registry</h3>
                    </div>
                    <div className="p-0 overflow-x-auto">
                       <table className="w-full text-left border-collapse text-sm text-slate-600">
                          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                             <tr>
                                <th className="px-6 py-3">User Email</th>
                                <th className="px-6 py-3">Joined Date</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Credits</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {adminUsersInfo.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                                   <td className="px-6 py-4 font-medium text-slate-800">{u.email}</td>
                                   <td className="px-6 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                                   <td className="px-6 py-4">
                                      {u.isPro ? 
                                         <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full">Pro</span> : 
                                         <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 rounded-full">Free</span>
                                      }
                                   </td>
                                   <td className="px-6 py-4 font-mono text-xs">{u.credits}</td>
                                   <td className="px-6 py-4 text-right space-x-2">
                                     <button 
                                       onClick={async () => {
                                         if (!u.id) return;
                                         try {
                                           await updateDoc(doc(db, 'users', u.id), { isPro: !u.isPro });
                                           setAdminUsersInfo(prev => prev.map(user => user.id === u.id ? { ...user, isPro: !user.isPro } : user));
                                         } catch(e) { console.error("Error toggling pro", e); }
                                       }}
                                       className="text-[10px] uppercase font-bold text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-white border border-slate-200 px-3 py-1.5 rounded transition"
                                     >
                                       {u.isPro ? 'Revoke Pro' : 'Grant Pro'}
                                     </button>
                                     <button 
                                       onClick={async () => {
                                         if (!u.id) return;
                                         try {
                                           const newCredits = (u.credits || 0) + 10;
                                           await updateDoc(doc(db, 'users', u.id), { credits: newCredits });
                                           setAdminUsersInfo(prev => prev.map(user => user.id === u.id ? { ...user, credits: newCredits } : user));
                                         } catch(e) { console.error("Error adding credits", e); }
                                       }}
                                       className="text-[10px] uppercase font-bold text-slate-500 hover:text-green-600 bg-slate-100 hover:bg-white border border-slate-200 px-3 py-1.5 rounded transition"
                                     >
                                       Add Credits
                                     </button>
                                     <button
                                       onClick={async () => {
                                         if (!u.id) return;
                                         try {
                                           const res = await fetch('/api/refund', {
                                             method: 'POST',
                                             headers: { 'Content-Type': 'application/json' },
                                             body: JSON.stringify({ userId: u.id })
                                           });
                                           const data = await res.json();
                                           if (data.success) {
                                              alert("Refund issued successfully!");
                                              // Ensure UI updates properly
                                              setAdminUsersInfo(prev => prev.map(user => user.id === u.id ? { ...user, isPro: false } : user));
                                           } else {
                                              alert("Refund failed: " + data.error);
                                           }
                                         } catch(e) { console.error("Error refunding", e); alert("Failed to issue refund."); }
                                       }}
                                       className="text-[10px] uppercase font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-white border border-slate-200 px-3 py-1.5 rounded transition"
                                     >
                                       Refund
                                     </button>
                                   </td>
                                </tr>
                             ))}
                             {adminUsersInfo.length === 0 && (
                                <tr>
                                   <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      {showPricing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-8 relative overflow-hidden">
              <button className="absolute top-6 right-6 text-slate-400 hover:text-slate-600" onClick={() => setShowPricing(false)}>
                 <span className="sr-only">Close</span>
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

              <div className="text-center mb-10">
                 <h2 className="text-3xl font-black text-slate-900 mb-4">Honest, Transparent Pricing</h2>
                 <p className="text-slate-600">The resume market is full of trial traps ($2.95/14 days then $25/mo). We are doing something different. Deeply competitive flat pricing.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                 {/* Free Tier */}
                 <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-2">Free Tier</h3>
                    <div className="text-4xl font-black text-slate-900 mb-4">$0</div>
                    <p className="text-sm text-slate-600 mb-6">Perfect for trying out the platform and generating a quick resume.</p>
                    <ul className="space-y-3 text-sm text-slate-700 flex-1 mb-8">
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> 3 AI Generation Credits</li>
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> Export to PDF</li>
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0"/> Standard Templates</li>
                    </ul>
                    <button onClick={() => setShowPricing(false)} className="w-full py-2.5 rounded border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition">{user ? 'Current Plan' : 'Dismiss'}</button>
                 </div>

                 {/* Top Up Credits */}
                 <div className="border border-slate-200 rounded-xl p-6 bg-white flex flex-col shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-2">Additional Credits</h3>
                    <div className="text-4xl font-black text-slate-900 mb-1">$3<span className="text-lg text-slate-500 font-normal">/pack</span></div>
                    <p className="text-xs text-slate-500 mb-4">One-time purchase.</p>
                    <p className="text-sm text-slate-600 mb-6 border-b border-slate-100 pb-4">Need a few more edits? Grab a top-up.</p>
                    <ul className="space-y-3 text-sm text-slate-700 flex-1 mb-8">
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-slate-600 mr-2 mt-0.5 shrink-0"/> +10 AI Generations</li>
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-slate-600 mr-2 mt-0.5 shrink-0"/> Never expires</li>
                    </ul>
                    <button onClick={() => handlePurchase('price_1TjhoWKc3d6UbNauMyXLfggD')} className="w-full py-2.5 rounded border border-slate-800 text-slate-800 font-bold hover:bg-slate-50 transition">Buy Credits</button>
                 </div>

                 {/* Pro Tier */}
                 <div className="border-2 border-blue-500 rounded-xl p-6 bg-white shadow-xl shadow-blue-500/10 flex flex-col relative">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg rounded-tr-xl">Most Popular</div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-2">Pro Member</h3>
                    <div className="text-4xl font-black text-slate-900 mb-1">$5<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                    <p className="text-xs text-slate-500 mb-4">No hidden fees. Cancel anytime.</p>
                    <p className="text-sm text-slate-600 mb-6 border-b border-slate-100 pb-4">Everything you need to land your dream job.</p>
                    <ul className="space-y-3 text-sm text-slate-700 flex-1 mb-8">
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> <strong>100</strong> AI Generations / mo</li>
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> Auto-Cover Letters</li>
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> Live AI Voice Interview Practice</li>
                       <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0"/> Export to MS Word (DOCX)</li>
                    </ul>
                    <button onClick={() => handlePurchase('price_1TjhnmKc3d6UbNauXULxTxrh')} className="w-full py-2.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">{isPro ? 'Manage Subscription' : 'Upgrade to Pro'}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {ingestionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">
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
                   className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                   placeholder="https://linkedin.com/in/yourprofile"
                 />
              ) : (
                 <textarea 
                   value={ingestionInput}
                   onChange={e => setIngestionInput(e.target.value)}
                   className="w-full h-32 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
                   placeholder="My name is... I have 5 years of experience in..."
                 />
              )}
              <div className="flex justify-end space-x-3">
                 <button 
                   onClick={() => {
                      setIngestionModal(null);
                      setIngestionInput('');
                   }}
                   className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
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
           <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                 <div>
                    <h2 className="text-lg font-bold text-slate-800 capitalize">Edit {editingSection}</h2>
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
                    className="w-full h-[50vh] font-mono text-sm p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-800"
                    spellCheck="false"
                 />
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                 <button 
                   onClick={() => setEditingSection(null)}
                   className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
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
            className={`p-4 rounded-xl shadow-lg flex items-start gap-3 border text-xs font-semibold uppercase tracking-wider text-slate-800 bg-white pointer-events-auto transition-all duration-300 ${
              toast.type === 'success' ? 'border-green-200 bg-green-50/90 text-green-800' :
              toast.type === 'error' ? 'border-red-200 bg-red-50/90 text-red-800' :
              'border-blue-200 bg-blue-50/90 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <Check className="w-4 h-4 text-green-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="flex-1 normal-case font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Onboarding Wizard Modal */}
      {isOnboarding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative overflow-hidden border border-slate-100 flex flex-col min-h-[400px] justify-between">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 left-0"></div>
            
            {resumes.length > 0 && resumes[0].name !== 'Alex Rivera' && (
              <button 
                onClick={() => setIsOnboarding(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {onboardingStep === 'options' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="text-center mb-8">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Precision Match AI</span>
                  <h2 className="text-2xl font-black text-slate-950 mt-3 tracking-tight">Create a New Resume</h2>
                  <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Select how you'd like to construct your resume. Let AI do the heavy lifting or build it manually step-by-step.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
                  {/* Card 1: Upload File */}
                  <div 
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 rounded-xl p-5 bg-white cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Upload Resume</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Import from PDF, DOCX, or text file. AI extracts all fields.</p>
                  </div>

                  {/* Card 2: Sync LinkedIn */}
                  <div 
                    onClick={() => setOnboardingStep('linkedin')}
                    className="border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 rounded-xl p-5 bg-white cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                      <Linkedin className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">LinkedIn Sync</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Paste your LinkedIn profile URL and sync details instantly.</p>
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
                    className="border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 rounded-xl p-5 bg-white cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Build Manually</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Start with a clean slate and type details in our manual form.</p>
                  </div>
                </div>

                <div className="text-center mt-6">
                  {resumes.length > 0 && resumes[0].name !== 'Alex Rivera' && (
                    <button 
                      onClick={() => setIsOnboarding(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition underline"
                    >
                      Cancel and return to workspace
                    </button>
                  )}
                </div>
              </div>
            )}

            {onboardingStep === 'linkedin' && (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Sync LinkedIn Profile</h3>
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
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                  >Back</button>
                  <button 
                    onClick={async () => {
                      const val = ingestionInput.trim();
                      if (!val) return;
                      setOnboardingStep('loading');
                      setIngestionInput('');
                      
                      try {
                        const res = await fetch('/api/extract-linkedin', {
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
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4 animate-[spin_2s_linear_infinite]" />
                <h3 className="text-lg font-bold text-slate-800 animate-pulse">AI Is Structuring Your Resume...</h3>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Send Feedback</h2>
            <p className="text-sm text-slate-500 mb-4">Found a bug? Have a feature request? Let us know.</p>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              className="w-full h-28 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowFeedback(false); setFeedbackText(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
              <button
                onClick={async () => {
                  if (!feedbackText.trim()) return;
                  try {
                    if (user && user.uid !== 'local-guest-uid') {
                      const feedbackRef = doc(collection(db, 'feedback'), Date.now().toString());
                      await setDoc(feedbackRef, {
                        userId: user.uid,
                        email: user.email || '',
                        text: feedbackText.trim(),
                        createdAt: new Date().toISOString()
                      });
                    }
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

      {/* Delete Account Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-red-600 mb-2">Delete Account</h2>
            <p className="text-sm text-slate-600 mb-6">This will permanently delete your account and all associated resume data. This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{showLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
              <button onClick={() => setShowLegalModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto text-sm text-slate-700 leading-relaxed space-y-4">
              {showLegalModal === 'privacy' ? (
                <>
                  <p><strong>Last Updated:</strong> June 2026</p>
                  <p>Precision Match (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information.</p>
                  <h3 className="font-bold text-slate-900 text-base">Information We Collect</h3>
                  <p>We collect information you provide directly: your name, email address (via Google Sign-In), resume content (employment history, education, skills, contact details), and job descriptions you submit for AI tailoring.</p>
                  <h3 className="font-bold text-slate-900 text-base">How We Use Your Information</h3>
                  <p>Your data is used solely to: generate and tailor resumes using AI, provide the app&apos;s core functionality, process payments via Stripe, and improve our service. We do <strong>not</strong> sell your personal data to third parties.</p>
                  <h3 className="font-bold text-slate-900 text-base">Data Storage &amp; Security</h3>
                  <p>Data is stored securely in Google Cloud Firestore with encryption at rest and in transit. Access is restricted by Firebase Security Rules that ensure users can only access their own data.</p>
                  <h3 className="font-bold text-slate-900 text-base">Third-Party Services</h3>
                  <p>We use Google Gemini AI (to process resumes), Stripe (to process payments), and Firebase (for authentication and storage). Each service has its own privacy policy.</p>
                  <h3 className="font-bold text-slate-900 text-base">Data Retention &amp; Deletion</h3>
                  <p>You may delete your account and all associated data at any time using the &quot;Delete Account&quot; option in the sidebar. Upon deletion, your data is permanently removed from our database.</p>
                  <h3 className="font-bold text-slate-900 text-base">Contact</h3>
                  <p>For privacy inquiries, email <a href="mailto:support@precisionmatch.app" className="text-blue-600 underline">support@precisionmatch.app</a>.</p>
                </>
              ) : (
                <>
                  <p><strong>Last Updated:</strong> June 2026</p>
                  <p>By using Precision Match, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
                  <h3 className="font-bold text-slate-900 text-base">Service Description</h3>
                  <p>Precision Match is an AI-powered resume builder that helps users create and tailor resumes. The service uses artificial intelligence to generate content suggestions.</p>
                  <h3 className="font-bold text-slate-900 text-base">AI-Generated Content Disclaimer</h3>
                  <p><strong>Important:</strong> AI-generated resume content is provided as suggestions only. You are solely responsible for reviewing, verifying, and approving all content before using it in job applications. We do not guarantee the accuracy, completeness, or effectiveness of AI-generated content.</p>
                  <h3 className="font-bold text-slate-900 text-base">User Responsibilities</h3>
                  <p>You agree to: provide accurate information, review all AI-generated content for accuracy, not use the service for illegal purposes, and not attempt to abuse or circumvent rate limits or security measures.</p>
                  <h3 className="font-bold text-slate-900 text-base">Payments &amp; Refunds</h3>
                  <p>Payments are processed securely through Stripe. Subscription charges recur monthly until cancelled. Refund requests are handled on a case-by-case basis — contact support within 7 days of purchase.</p>
                  <h3 className="font-bold text-slate-900 text-base">Limitation of Liability</h3>
                  <p>Precision Match is provided &quot;as is&quot; without warranties. We are not liable for any damages arising from the use of AI-generated resume content, including but not limited to job application outcomes.</p>
                  <h3 className="font-bold text-slate-900 text-base">Changes to Terms</h3>
                  <p>We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.</p>
                  <h3 className="font-bold text-slate-900 text-base">Contact</h3>
                  <p>For questions about these terms, email <a href="mailto:support@precisionmatch.app" className="text-blue-600 underline">support@precisionmatch.app</a>.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

