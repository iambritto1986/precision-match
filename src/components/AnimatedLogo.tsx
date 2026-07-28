import React, { useId } from 'react';

interface AnimatedLogoProps {
  /** Pixel size for both width and height. */
  size?: number;
  /** Extra classes applied to the root <svg> (e.g. margin, drop-shadow). */
  className?: string;
  /**
   * When true (default), plays the scan-and-confirm loop: corner brackets
   * appear, the center ring flickers like it's scanning, then a checkmark
   * draws in to confirm a match, holds, and repeats.
   * Set to false for a static mark (e.g. persistent nav/sidebar icons,
   * where a looping animation would be distracting rather than delightful).
   */
  animated?: boolean;
}

/**
 * Precision Match brand mark. Vector, transparent background, brand
 * gradient (#00F0FF -> #B500FF) matching --accent-gradient in index.css.
 * Animation keyframes (.pm-logo-*) live in index.css.
 */
export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 64,
  className = '',
  animated = true,
}) => {
  const gradId = `pm-logo-gradient-${useId().replace(/:/g, '')}`;
  const stateClass = animated ? '' : 'pm-logo-static';

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Precision Match"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#B500FF" />
        </linearGradient>
      </defs>
      <g
        className={`pm-logo-bracket ${stateClass}`}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M30,70 L30,30 L70,30" />
        <path d="M170,70 L170,30 L130,30" />
        <path d="M30,130 L30,170 L70,170" />
        <path d="M170,130 L170,170 L130,170" />
      </g>
      <circle
        className={`pm-logo-ring ${stateClass}`}
        cx={100}
        cy={100}
        r={48}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={4}
      />
      <path
        className={`pm-logo-check ${stateClass}`}
        d="M68,104 L90,126 L136,78"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AnimatedLogo;
