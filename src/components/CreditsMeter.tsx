import React from 'react';
import { Zap, FileOutput } from 'lucide-react';

interface CreditsMeterProps {
  credits: number;
  isPro: boolean;
  /** Resume exports left on the free plan. */
  downloadsRemaining: number;
  /** Total free exports allowed, so the readout reads "2 / 3 Exports". */
  downloadLimit?: number;
  onUpgrade: () => void;
  /** Set on exactly one instance so the onboarding tour has a single target. */
  tourAnchor?: boolean;
}

const FREE_CREDIT_ALLOWANCE = 3;
const PRO_CREDIT_SCALE = 100;

/**
 * Compact credits + free-export readout for page headers.
 *
 * This used to live at the bottom of the sidebar as a tall stacked block. It was
 * moved into the headers to free up vertical space in the nav — and because the
 * bottom of a sidebar is a weak spot for something the user is meant to watch
 * deplete. Rendered wherever credits are actually spent, not just on one route.
 */
export const CreditsMeter: React.FC<CreditsMeterProps> = ({
  credits,
  isPro,
  downloadsRemaining,
  downloadLimit = 3,
  onUpgrade,
  tourAnchor = false,
}) => {
  const creditPct = isPro
    ? Math.min((credits / PRO_CREDIT_SCALE) * 100, 100)
    : Math.min((credits / FREE_CREDIT_ALLOWANCE) * 100, 100);

  const creditsEmpty = credits <= 0;

  return (
    <div
      {...(tourAnchor ? { id: 'tour-credits' } : {})}
      className="hidden md:flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5"
    >
      {/* AI credits */}
      <div className="flex items-center gap-2" title={isPro ? `${credits} AI credits remaining` : `${credits} of ${FREE_CREDIT_ALLOWANCE} free AI credits remaining`}>
        <Zap className={`w-3.5 h-3.5 shrink-0 ${creditsEmpty ? 'text-red-400' : 'text-[#00F0FF]'}`} />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-bold text-slate-200 whitespace-nowrap">
            {isPro ? `${credits} Credits` : `${credits} / ${FREE_CREDIT_ALLOWANCE} Credits`}
          </span>
          <div className="w-16 h-1 bg-slate-800/60 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${creditsEmpty ? 'bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.6)]' : 'bg-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.6)]'}`}
              style={{ width: `${creditPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Free exports — Pro accounts have unlimited, so this is noise for them */}
      {!isPro && (
        <>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2" title={`${downloadsRemaining} of ${downloadLimit} free resume exports remaining. Resumes you've already exported can be downloaded again for free.`} data-meter="exports">
            <FileOutput className={`w-3.5 h-3.5 shrink-0 ${downloadsRemaining > 0 ? 'text-[#B500FF]' : 'text-red-400'}`} />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold text-slate-200 whitespace-nowrap">
                {downloadsRemaining} / {downloadLimit} Exports
              </span>
              <div className="w-16 h-1 bg-slate-800/60 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all ${downloadsRemaining > 0 ? 'bg-[#B500FF] shadow-[0_0_10px_rgba(181,0,255,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.6)]'}`}
                  style={{ width: `${(Math.min(downloadsRemaining, downloadLimit) / downloadLimit) * 100}%` }}
                />
              </div>
            </div>
          </div>

        </>
      )}

      {/* Billing entry point — shown to EVERYONE.
          Pro users previously had nothing clickable here at all, which left no
          route in the whole app to buy more credits, change plan, or cancel a
          subscription. "Upgrade" is the wrong word once you've upgraded, so the
          label changes but the destination is the same modal (which offers Buy
          Credits and Manage Subscription to Pro accounts). */}
      <div className="w-px h-6 bg-white/10" />
      <button
        onClick={onUpgrade}
        title={isPro ? 'Buy credits, change plan, or cancel your subscription' : 'See plans and upgrade'}
        className="text-[10px] text-[#00F0FF] font-bold uppercase tracking-wider hover:text-white transition drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] whitespace-nowrap"
      >
        {isPro ? 'Manage Plan' : 'Upgrade'}
      </button>
    </div>
  );
};

export default CreditsMeter;
