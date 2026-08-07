import React, { useMemo, useState } from 'react';
import { Plus, X, ExternalLink, Trash2, Briefcase, Pencil } from 'lucide-react';
import { JobApplication, ApplicationStage, APPLICATION_STAGES, ResumeData } from '../types';

interface ApplicationTrackerProps {
  applications: JobApplication[];
  setApplications: React.Dispatch<React.SetStateAction<JobApplication[]>>;
  resumes: Array<{ id: string; name: string; data: ResumeData }>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  /**
   * Set when the user arrives from the tailoring workspace via "Save to Tracker".
   * Opens the add form already carrying the job description and the resume that
   * was actually tailored for it — the link that makes this more than a spreadsheet.
   */
  prefill?: { jobDescription?: string; resumeId?: string } | null;
  onPrefillConsumed?: () => void;
}

const STAGE_META: Record<ApplicationStage, { label: string; accent: string; dot: string }> = {
  saved:        { label: 'Saved',        accent: 'border-slate-500/40',   dot: 'bg-slate-400' },
  applied:      { label: 'Applied',      accent: 'border-[#00F0FF]/40',   dot: 'bg-[#00F0FF]' },
  interviewing: { label: 'Interviewing', accent: 'border-[#FFC94A]/50',   dot: 'bg-[#FFC94A]' },
  offer:        { label: 'Offer',        accent: 'border-emerald-500/50', dot: 'bg-emerald-400' },
  rejected:     { label: 'Rejected',     accent: 'border-red-500/30',     dot: 'bg-red-400' },
};

const emptyDraft = (): Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> => ({
  company: '', role: '', stage: 'saved', url: '', location: '', salary: '', notes: '', resumeId: '', jobDescription: '',
});

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications, setApplications, resumes, showToast, prefill, onPrefillConsumed,
}) => {
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [isOpen, setIsOpen] = useState(false);

  // Arriving with a prefill means the user just tailored a resume for a role and
  // asked to track it, so open straight into the form with what we already know.
  React.useEffect(() => {
    if (!prefill) return;
    setEditing(null);
    setDraft({
      ...emptyDraft(),
      stage: 'applied',
      jobDescription: prefill.jobDescription ?? '',
      resumeId: prefill.resumeId ?? '',
    });
    setIsOpen(true);
    onPrefillConsumed?.();
  }, [prefill]);

  const byStage = useMemo(() => {
    const map = {} as Record<ApplicationStage, JobApplication[]>;
    APPLICATION_STAGES.forEach(s => { map[s] = []; });
    applications.forEach(a => { (map[a.stage] ?? map.saved).push(a); });
    // Most recently touched first — the card you just moved should be visible.
    APPLICATION_STAGES.forEach(s => map[s].sort((a, b) => b.updatedAt - a.updatedAt));
    return map;
  }, [applications]);

  const openNew = () => { setEditing(null); setDraft(emptyDraft()); setIsOpen(true); };
  const openEdit = (app: JobApplication) => {
    setEditing(app);
    setDraft({
      company: app.company, role: app.role, stage: app.stage, url: app.url ?? '',
      location: app.location ?? '', salary: app.salary ?? '', notes: app.notes ?? '',
      resumeId: app.resumeId ?? '', jobDescription: app.jobDescription ?? '',
    });
    setIsOpen(true);
  };

  const save = () => {
    if (!draft.company.trim() || !draft.role.trim()) {
      showToast('Company and role are both needed to save an application.', 'error');
      return;
    }
    const now = Date.now();
    if (editing) {
      setApplications(prev => prev.map(a => a.id === editing.id
        ? { ...a, ...draft, updatedAt: now, appliedAt: a.appliedAt ?? (draft.stage === 'applied' ? now : undefined) }
        : a));
    } else {
      setApplications(prev => [{
        ...draft,
        id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now,
        appliedAt: draft.stage === 'applied' ? now : undefined,
      }, ...prev]);
    }
    setIsOpen(false);
  };

  const remove = (id: string) => {
    setApplications(prev => prev.filter(a => a.id !== id));
  };

  const moveStage = (id: string, stage: ApplicationStage) => {
    const now = Date.now();
    setApplications(prev => prev.map(a => a.id === id
      ? { ...a, stage, updatedAt: now, appliedAt: a.appliedAt ?? (stage === 'applied' ? now : undefined) }
      : a));
  };

  const total = applications.length;
  const active = applications.filter(a => a.stage !== 'rejected').length;

  return (
    <div className="flex flex-col h-full font-inter">
      <div className="h-16 px-6 border-b border-white/5 glass-header flex items-center justify-between shrink-0 z-10">
        <h2 className="text-sm font-bold text-slate-200 flex items-center">
          <Briefcase className="w-4 h-4 mr-2 text-[#00F0FF]" />
          Application Tracker
          {total > 0 && (
            <span className="ml-3 text-[10px] uppercase tracking-wider font-bold text-slate-500">
              {active} active &middot; {total} total
            </span>
          )}
        </h2>
        <button onClick={openNew} className="px-4 py-2 text-xs font-medium btn-primary rounded-xl flex items-center">
          <Plus className="w-3 h-3 mr-2" /> Add Application
        </button>
      </div>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <Briefcase className="w-10 h-10 text-slate-600 mb-4" />
          <h3 className="text-base font-bold text-slate-300 mb-2">Nothing tracked yet</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Keep every role in one place: what you applied for, which resume you sent, and where it stands.
            Add the first one and it'll show up on the board.
          </p>
          <button onClick={openNew} className="px-5 py-2.5 text-xs font-medium btn-primary rounded-xl flex items-center">
            <Plus className="w-3 h-3 mr-2" /> Add Your First Application
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 h-full min-w-max">
            {APPLICATION_STAGES.map(stage => (
              <div key={stage} className="w-72 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STAGE_META[stage].dot}`} />
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      {STAGE_META[stage].label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{byStage[stage].length}</span>
                </div>

                <div className="flex-1 overflow-y-auto scroll-hide space-y-2 pr-1">
                  {byStage[stage].map(app => (
                    <div
                      key={app.id}
                      className={`group bg-white/[0.04] border ${STAGE_META[stage].accent} rounded-xl p-3 hover:bg-white/[0.07] transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-100 leading-tight">{app.role}</p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => openEdit(app)} className="p-1 text-slate-400 hover:text-white" title="Edit">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => remove(app.id)} className="p-1 text-slate-400 hover:text-red-400" title="Remove">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{app.company}</p>

                      {(app.location || app.salary) && (
                        <p className="text-[10px] text-slate-500 mb-2">
                          {[app.location, app.salary].filter(Boolean).join(' · ')}
                        </p>
                      )}

                      {app.resumeId && (
                        <p className="text-[10px] text-slate-500 mb-2 truncate">
                          Resume: {resumes.find(r => r.id === app.resumeId)?.name ?? 'deleted'}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={app.stage}
                          onChange={e => moveStage(app.id, e.target.value as ApplicationStage)}
                          className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-1 text-slate-300 outline-none focus:ring-1 focus:ring-[#00F0FF]/40"
                        >
                          {APPLICATION_STAGES.map(s => (
                            <option key={s} value={s}>{STAGE_META[s].label}</option>
                          ))}
                        </select>
                        {app.url && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-[#00F0FF] transition"
                            title="Open posting"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {byStage[stage].length === 0 && (
                    <div className="border border-dashed border-white/10 rounded-xl py-6 text-center">
                      <span className="text-[10px] text-slate-600 uppercase tracking-wider">Empty</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
          <div className="modal-container max-w-lg w-full p-6 modal-enter max-h-[90vh] overflow-y-auto scroll-hide">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editing ? 'Edit Application' : 'Add Application'}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company *</label>
                <input value={draft.company} onChange={e => setDraft(d => ({ ...d, company: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none" placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role *</label>
                <input value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none" placeholder="Program Lead" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stage</label>
                <select value={draft.stage} onChange={e => setDraft(d => ({ ...d, stage: e.target.value as ApplicationStage }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none">
                  {APPLICATION_STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Resume Sent</label>
                <select value={draft.resumeId} onChange={e => setDraft(d => ({ ...d, resumeId: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none">
                  <option value="">Not linked</option>
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location</label>
                <input value={draft.location} onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none" placeholder="Remote" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Salary</label>
                <input value={draft.salary} onChange={e => setDraft(d => ({ ...d, salary: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none" placeholder="$120k" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Posting URL</label>
                <input value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none" placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notes</label>
                <textarea value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                  className="w-full text-xs tech-input px-3 py-2 rounded-lg outline-none resize-none min-h-[70px]"
                  placeholder="Recruiter name, referral, next step..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={save} className="px-5 py-2 btn-primary text-sm rounded-xl font-bold">
                {editing ? 'Save Changes' : 'Add Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
