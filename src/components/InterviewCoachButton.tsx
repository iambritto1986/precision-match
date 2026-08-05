import React from 'react';
import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';

/**
 * Premium shortcut to the voice interview coach.
 *
 * Same destination as the "Interview with Aadhya" sidebar link — this is a second,
 * far more prominent entry point, because voice interview practice is the feature
 * competitors don't have and it was previously buried in one nav item.
 *
 * Deliberately gold rather than the app's cyan/magenta so it reads as the premium
 * thing on the page. The layered gradients imitate a machined metal bezel: a bright
 * outer ring, a darker inset face, and a specular highlight across the top third.
 */
export const InterviewCoachButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Link
    to="/interview"
    title="Practice a live voice interview with Aadhya"
    className={`group relative inline-flex shrink-0 rounded-full p-[2px] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.99] ${className}`}
    style={{
      // The bezel. Light source top-left, so pale champagne sits there, the
      // shadowed underside is deep bronze, and a second highlight near the
      // bottom-right suggests light bouncing back off the surface below.
      background: 'linear-gradient(145deg, #FFF3C4 0%, #E8C46A 18%, #C9962E 38%, #8A6318 55%, #E8C46A 78%, #FFF3C4 100%)',
      boxShadow: '0 0 18px rgba(255,201,74,0.35), 0 2px 6px rgba(0,0,0,0.55)',
    }}
  >
    <span
      className="relative flex items-center gap-2 rounded-full px-4 py-[7px] overflow-hidden"
      style={{
        // Inset face — dark so the gold ring reads as metal around it.
        background: 'linear-gradient(180deg, #3A3218 0%, #1C1808 55%, #241E0C 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255,240,190,0.28), inset 0 -2px 4px rgba(0,0,0,0.6)',
      }}
    >
      {/* Specular sweep across the top of the face. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full opacity-60 group-hover:opacity-80 transition-opacity"
        style={{ background: 'linear-gradient(180deg, rgba(255,245,205,0.30) 0%, rgba(255,245,205,0) 100%)' }}
      />
      <Mic className="relative w-3.5 h-3.5 shrink-0 text-[#FFDE8A] drop-shadow-[0_0_5px_rgba(255,201,74,0.8)]" />
      <span className="relative text-[11px] font-bold uppercase tracking-wider whitespace-nowrap text-[#FFEFC0]">
        Interview Coach
      </span>
    </span>
  </Link>
);

export default InterviewCoachButton;
