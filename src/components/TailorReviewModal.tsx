import React, { useMemo, useState } from 'react';
import { Check, X, AlertTriangle, Plus, Minus, Pencil } from 'lucide-react';
import { ResumeChange } from '../lib/resumeDiff';

interface TailorReviewModalProps {
  changes: ResumeChange[];
  accepted: Set<string>;
  setAccepted: React.Dispatch<React.SetStateAction<Set<string>>>;
  onApply: () => void;
  onCancel: () => void;
}

const KIND_META = {
  modified: { Icon: Pencil, tone: 'text-[#00F0FF]', label: 'Reworded' },
  added:    { Icon: Plus,   tone: 'text-emerald-400', label: 'Added' },
  removed:  { Icon: Minus,  tone: 'text-slate-400',   label: 'Removed' },
} as const;

/**
 * Review step between the AI's tailored draft and the user's actual resume.
 *
 * Nothing is applied until the user says so, and rejecting everything returns the
 * resume exactly as it was. Changes that add new claims — new skills, new bullets,
 * altered employers or dates — start UNCHECKED, because those are the edits the
 * grounding rules prohibit and the ones a candidate would have to defend in an
 * interview. Safe rewrites start checked so the common path stays one click.
 */
export const TailorReviewModal: React.FC<TailorReviewModalProps> = ({
  changes, accepted, setAccepted, onApply, onCancel,
}) => {
  const [showRiskyOnly, setShowRiskyOnly] = useState(false);

  const grouped = useMemo(() => {
    const visible = showRiskyOnly ? changes.filter(c => c.risky) : changes;
    const map = new Map<string, ResumeChange[]>();
    visible.forEach(c => {
      if (!map.has(c.section)) map.set(c.section, []);
      map.get(c.section)!.push(c);
    });
    return [...map.entries()];
  }, [changes, showRiskyOnly]);

  const riskyCount = changes.filter(c => c.risky).length;
  const toggle = (id: string) => setAccepted(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const setAll = (on: boolean) => setAccepted(on ? new Set(changes.map(c => c.id)) : new Set());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
      <div className="modal-container max-w-3xl w-full modal-enter flex flex-col max-h-[88vh]">
        <div className="p-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Review tailored changes</h2>
              <p className="text-xs text-slate-400">
                {changes.length} proposed {changes.length === 1 ? 'change' : 'changes'}. Nothing is applied to your
                resume until you choose. Reject everything and it stays exactly as it is.
              </p>
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-white p-1 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {riskyCount > 0 && (
            <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                <strong>{riskyCount}</strong> {riskyCount === 1 ? 'change adds' : 'changes add'} something that wasn't
                in your original resume — a new skill, bullet, or a changed employer or date. These are switched off
                by default. Turn one on only if it's genuinely true of you; you'd have to defend it in an interview.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button onClick={() => setAll(true)} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white transition">Accept all</button>
            <span className="text-slate-700">·</span>
            <button onClick={() => setAll(false)} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-white transition">Reject all</button>
            {riskyCount > 0 && (
              <>
                <span className="text-slate-700">·</span>
                <button
                  onClick={() => setShowRiskyOnly(v => !v)}
                  className={`text-[10px] uppercase tracking-wider font-bold transition ${showRiskyOnly ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                  {showRiskyOnly ? 'Show all' : 'Needs attention only'}
                </button>
              </>
            )}
            <span className="ml-auto text-[10px] font-bold text-slate-500">
              {accepted.size} of {changes.length} selected
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scroll-hide p-6 space-y-6">
          {grouped.map(([section, items]) => (
            <div key={section}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">{section}</h3>
              <div className="space-y-2">
                {items.map(c => {
                  const { Icon, tone, label } = KIND_META[c.kind];
                  const on = accepted.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl border p-3 transition-colors ${
                        c.risky
                          ? on ? 'border-amber-500/50 bg-amber-500/[0.07]' : 'border-amber-500/25 bg-white/[0.02]'
                          : on ? 'border-[#00F0FF]/40 bg-[#00F0FF]/[0.05]' : 'border-white/10 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggle(c.id)}
                          aria-pressed={on}
                          className={`mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                            on ? 'bg-[#00F0FF] border-[#00F0FF]' : 'border-white/25 hover:border-white/50'
                          }`}
                          title={on ? 'Accepted — click to reject' : 'Rejected — click to accept'}
                        >
                          {on && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className={`w-3 h-3 shrink-0 ${tone}`} />
                            <span className="text-[11px] font-bold text-slate-300">{c.label}</span>
                            <span className={`text-[9px] uppercase tracking-wider font-bold ${tone}`}>{label}</span>
                            {c.risky && (
                              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" /> Check this
                              </span>
                            )}
                          </div>

                          {c.before && (
                            <p className="text-[11px] text-slate-500 leading-relaxed line-through decoration-slate-600 mb-1">
                              {c.before}
                            </p>
                          )}
                          {c.after && (
                            <p className="text-[11px] text-slate-200 leading-relaxed">{c.after}</p>
                          )}
                          {c.risky && c.riskNote && (
                            <p className="text-[10px] text-amber-300/80 mt-1.5 italic">{c.riskNote}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-slate-500">
            {accepted.size === 0 ? 'Your resume will be left unchanged.' : `${accepted.size} ${accepted.size === 1 ? 'change' : 'changes'} will be applied.`}
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">Discard</button>
            <button onClick={onApply} className="px-5 py-2 btn-primary text-sm rounded-xl font-bold">
              {accepted.size === 0 ? 'Keep original' : `Apply ${accepted.size}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorReviewModal;
