import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, ShieldAlert, Zap } from 'lucide-react';

export const FounderDashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.email !== 'iambrittothomas@gmail.com') {
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

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[var(--bg-app)] text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--accent-primary)] mb-2 uppercase tracking-widest">Founder Control Panel</h1>
          <p className="text-slate-400">Welcome back, Commander. Here are the latest system metrics.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card p-6 border-l-4 border-[var(--accent-primary)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</p>
                <h3 className="text-3xl font-black mt-1">1,248</h3>
              </div>
              <Users className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <p className="text-xs text-emerald-400">+12% from last week</p>
          </div>

          <div className="card p-6 border-l-4 border-[var(--accent-secondary)]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumes Generated</p>
                <h3 className="text-3xl font-black mt-1">8,492</h3>
              </div>
              <Activity className="w-6 h-6 text-[var(--accent-secondary)]" />
            </div>
            <p className="text-xs text-emerald-400">+24% from last week</p>
          </div>

          <div className="card p-6 border-l-4 border-yellow-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Status</p>
                <h3 className="text-3xl font-black mt-1">Optimal</h3>
              </div>
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-xs text-yellow-500">99.99% Uptime</p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Recent Activity Log</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">User registered via Google</p>
                    <p className="text-xs text-slate-500">user_{Math.floor(Math.random() * 1000)}@example.com</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{i * 12} mins ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
