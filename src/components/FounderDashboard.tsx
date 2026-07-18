import React, { useState, useEffect } from 'react';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, ShieldAlert, Zap, MessageSquare, LifeBuoy } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';

interface FounderDashboardProps {
  adminUsersInfo: any[];
  setAdminUsersInfo: React.Dispatch<React.SetStateAction<any[]>>;
}

export const FounderDashboard: React.FC<FounderDashboardProps> = ({ adminUsersInfo, setAdminUsersInfo }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'feedback' | 'support'>('users');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let unsubFeedback: () => void;
    let unsubSupport: () => void;
    
    if (user?.email === ADMIN_EMAIL) {
      setLoadingData(true);
      
      const feedbackQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      unsubFeedback = onSnapshot(feedbackQuery, (snapshot) => {
        setFeedbacks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingData(false);
      }, (error) => {
        console.error("Error fetching feedback stream", error);
        setLoadingData(false);
      });

      const supportQuery = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
      unsubSupport = onSnapshot(supportQuery, (snapshot) => {
        setSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => {
        console.error("Error fetching support stream", error);
      });
    }

    return () => {
      if (unsubFeedback) unsubFeedback();
      if (unsubSupport) unsubSupport();
    };
  }, [user]);

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="card p-12 text-center flex flex-col items-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">ACCESS DENIED</h2>
          <p className="text-slate-400">You do not have clearance for this sector.</p>
        </div>
      </div>
    );
  }

  const proCount = adminUsersInfo.filter(u => u.isPro).length;
  const mrr = proCount * 5;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[var(--bg-app)] text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--accent-primary)] mb-2 uppercase tracking-widest">Founder Control Panel</h1>
          <p className="text-slate-400">Welcome back, Commander. Here are the latest system metrics.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 border-l-4 border-[var(--accent-primary)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                <h3 className="text-3xl font-black mt-1 text-white">{adminUsersInfo.length}</h3>
              </div>
              <Users className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-[var(--accent-secondary)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pro Members</p>
                <h3 className="text-3xl font-black mt-1 text-blue-400">{proCount}</h3>
              </div>
              <Activity className="w-6 h-6 text-[var(--accent-secondary)]" />
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active MRR</p>
                <h3 className="text-3xl font-black mt-1 text-green-500">${mrr}</h3>
              </div>
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="flex border-b border-white/10 mb-6 space-x-6">
          <button onClick={() => setActiveTab('users')} className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'users' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <Users className="w-4 h-4 inline mr-2 -mt-1" />
            User Registry
          </button>
          <button onClick={() => setActiveTab('feedback')} className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'feedback' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <MessageSquare className="w-4 h-4 inline mr-2 -mt-1" />
            Feedback ({feedbacks.length})
          </button>
          <button onClick={() => setActiveTab('support')} className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'support' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-slate-400 hover:text-white'}`}>
            <LifeBuoy className="w-4 h-4 inline mr-2 -mt-1" />
            Support Tickets ({supportTickets.length})
          </button>
        </div>

        <div className="glass-modal overflow-hidden">
          {activeTab === 'users' && (
            <div className="p-0 overflow-x-auto">
               <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                     <tr>
                        <th className="px-6 py-4">User Email</th>
                        <th className="px-6 py-4">Joined Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Credits</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {adminUsersInfo.map(u => (
                        <tr key={u.id} className="hover:bg-white/5 transition">
                           <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                           <td className="px-6 py-4 text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                           <td className="px-6 py-4">
                              {u.isPro ? 
                                 <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] bg-[#00F0FF]/10 rounded-full border border-[#00F0FF]/20">Pro</span> : 
                                 <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 rounded-full border border-white/10">Free</span>
                              }
                           </td>
                           <td className="px-6 py-4 font-mono text-xs">{u.credits ?? 0}</td>
                           <td className="px-6 py-4 text-right space-x-2">
                             <button 
                               onClick={async () => {
                                 if (!u.id) return;
                                 try {
                                   await updateDoc(doc(db, 'users', u.id), { isPro: !u.isPro });
                                   setAdminUsersInfo(prev => prev.map(user => user.id === u.id ? { ...user, isPro: !user.isPro } : user));
                                 } catch(e) { console.error("Error toggling pro", e); }
                               }}
                               className="text-[10px] uppercase font-bold text-slate-300 hover:text-[#00F0FF] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded transition"
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
                               className="text-[10px] uppercase font-bold text-slate-300 hover:text-green-400 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded transition"
                             >
                               Add Credits
                             </button>
                           </td>
                        </tr>
                     ))}
                     {adminUsersInfo.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                             {user ? "Fetching registry data..." : "No users found."}
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="p-0 overflow-x-auto">
               <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                     <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">User Email</th>
                        <th className="px-6 py-4 w-1/2">Feedback</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {feedbacks.map(f => (
                        <tr key={f.id} className="hover:bg-white/5 transition">
                           <td className="px-6 py-4 text-slate-400">{f.createdAt ? new Date(f.createdAt).toLocaleString() : 'N/A'}</td>
                           <td className="px-6 py-4 font-medium text-white">{f.email || 'Anonymous'}</td>
                           <td className="px-6 py-4 text-slate-300 whitespace-pre-wrap">{f.text}</td>
                        </tr>
                     ))}
                     {feedbacks.length === 0 && (
                        <tr>
                           <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                             {loadingData ? "Loading feedback..." : "No feedback found."}
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="p-0 overflow-x-auto">
               <table className="w-full text-left border-collapse text-sm text-slate-300">
                  <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                     <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">User Email</th>
                        <th className="px-6 py-4 w-1/2">Issue Details</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {supportTickets.map(s => (
                        <tr key={s.id} className="hover:bg-white/5 transition">
                           <td className="px-6 py-4 text-slate-400">{s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A'}</td>
                           <td className="px-6 py-4 font-medium text-white">{s.email || 'Unknown'}</td>
                           <td className="px-6 py-4 text-slate-300 whitespace-pre-wrap">{s.message}</td>
                        </tr>
                     ))}
                     {supportTickets.length === 0 && (
                        <tr>
                           <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                             {loadingData ? "Loading tickets..." : "No support tickets found."}
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
