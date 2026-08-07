import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const R = 24;
const CIRC = 2 * Math.PI * R;

/**
 * Score dial for resume readiness.
 *
 * Geometry note: the ring must be centred on the viewBox (28,28 in a 0 0 56 56
 * box) and the dash array must equal the true circumference. The previous
 * version hardcoded both and drew the ring 4px off-centre.
 *
 * `delta` shows movement since the last measurement — this is the "before and
 * after" of tailoring. It's rendered plainly rather than celebratorily: a score
 * going up is only meaningful if the content behind it is true, and dressing it
 * up as a win encourages people to accept claims they can't defend.
 */
export const ReadinessDial: React.FC<{ label: string; score: number; delta?: number }> = ({ label, score, delta }) => {
  const pct = Math.min(Math.max(score, 0), 100);
  const tone = pct > 75 ? 'text-emerald-500' : pct > 50 ? 'text-amber-500' : 'text-rose-500';
  const showDelta = typeof delta === 'number' && Math.abs(delta) >= 1;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 p-3">
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="28" cy="28" r={R} stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700/60" />
          <circle
            cx="28" cy="28" r={R} stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"
            className={tone}
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 900ms ease' }}
          />
        </svg>
        <span className="relative text-sm font-black text-white">{Math.round(pct)}%</span>
      </div>

      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2 text-center leading-tight">{label}</p>

      {showDelta && (
        <p className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${delta! > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {delta! > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
          {Math.abs(Math.round(delta!))} pts
        </p>
      )}
    </div>
  );
};

export default ReadinessDial;
