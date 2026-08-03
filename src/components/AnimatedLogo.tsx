import React from 'react';

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
  /**
   * When true, renders as a filled rounded-square badge (white mark on the
   * brand gradient) instead of a transparent line mark. Use this for small
   * badge/avatar-style spots (nav header, sidebar, auth screen) where the
   * old flat "PM" tile or the logo.png placeholder used to sit. Use the
   * default (false) for larger standalone placements like a loading screen.
   */
  tile?: boolean;
  /**
   * When true and animated is false, the mark sits fully resolved (static)
   * until the pointer hovers over it, then replays the scan-and-confirm
   * sequence once. Use this for persistent badges (nav header, sidebar,
   * auth screen) so the animation is a delightful hover moment instead of
   * a constant distraction. Ignored when animated is true.
   */
  hoverPlay?: boolean;
}

/**
 * Precision Match brand mark. Vector, monochrome (black/white) — a tile
 * badge is a white rounded square with a black mark; a standalone (non-tile)
 * mark is drawn in white line-art for use on dark backgrounds. Animation
 * keyframes (.pm-logo-*) live in index.css.
 */
export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 64,
  className = '',
  animated = true,
  tile = false,
  hoverPlay = false,
}) => {
  const stateClass = animated ? '' : hoverPlay ? 'pm-logo-hover' : 'pm-logo-static';
  const rootHoverClass = !animated && hoverPlay ? 'pm-logo-hover-root' : '';
  const strokeColor = tile ? '#000000' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={[rootHoverClass, className].filter(Boolean).join(' ')}
      role="img"
      aria-label="Precision Match"
    >
      {tile && <rect x={0} y={0} width={200} height={200} rx={44} fill="#FFFFFF" />}

      <g
        className={`pm-logo-bracket ${stateClass}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tile ? (
          <>
            <path d="M46,82 L46,46 L82,46" />
            <path d="M154,82 L154,46 L118,46" />
            <path d="M46,118 L46,154 L82,154" />
            <path d="M154,118 L154,154 L118,154" />
          </>
        ) : (
          <>
            <path d="M30,70 L30,30 L70,30" />
            <path d="M170,70 L170,30 L130,30" />
            <path d="M30,130 L30,170 L70,170" />
            <path d="M170,130 L170,170 L130,170" />
          </>
        )}
      </g>

      <circle
        className={`pm-logo-ring ${stateClass}`}
        cx={100}
        cy={100}
        r={tile ? 42 : 48}
        fill="none"
        stroke={strokeColor}
        strokeWidth={4}
        opacity={tile ? 0.85 : 1}
      />

      <path
        className={`pm-logo-check ${stateClass}`}
        d={tile ? 'M76,106 L96,126 L134,84' : 'M68,104 L90,126 L136,78'}
        fill="none"
        stroke={strokeColor}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AnimatedLogo;
