import React, { useMemo } from 'react';
import { motion } from 'motion/react';

/**
 * LiquidGlassBackground — Animated iridescent blobs for the login page.
 * 
 * Built from UI/UX Pro Max Style #14 (Liquid Glass):
 *   - Morphing blob shapes via CSS border-radius keyframes (400-600ms curves)
 *   - Iridescent gradients with hue-rotate cycling
 *   - mix-blend-mode: screen for realistic light blending
 *   - Dynamic randomization: every mount generates unique positions, speeds, and hue offsets
 * 
 * Design Variables:
 *   --morph-duration: 400-600ms (per blob morph cycle)
 *   --blur-amount: 80-120px (soft liquid diffusion)
 *   --blend-mode: screen
 *   --iridescent: true (hue-rotate animation)
 */

// Blob configuration presets — each blob gets a unique gradient, morph animation, and behavior
const BLOB_CONFIGS = [
  {
    gradient: 'conic-gradient(from 0deg, #00F0FF, #B500FF, #FF1493, #00F0FF)',
    morphAnim: 'blob-morph-1',
    size: { w: 500, h: 500 },
    blur: 100,
  },
  {
    gradient: 'conic-gradient(from 120deg, #8B00FF, #20B2AA, #FF1493, #0080FF, #8B00FF)',
    morphAnim: 'blob-morph-2',
    size: { w: 600, h: 600 },
    blur: 120,
  },
  {
    gradient: 'conic-gradient(from 240deg, #20B2AA, #FF1493, #00F0FF, #B500FF, #20B2AA)',
    morphAnim: 'blob-morph-3',
    size: { w: 450, h: 450 },
    blur: 90,
  },
];

export const LiquidGlassBackground: React.FC = () => {
  // Randomize on every mount — no two logins look the same
  const blobs = useMemo(() => {
    const hueOffset = Math.random() * 360; // Random starting hue for the entire scene

    return BLOB_CONFIGS.map((config, i) => {
      const xStart = Math.random() * 60 - 30;  // -30% to +30%
      const yStart = Math.random() * 60 - 30;
      const xEnd = Math.random() * 60 - 30;
      const yEnd = Math.random() * 60 - 30;
      const duration = 14 + Math.random() * 12; // 14-26s per orbit
      const morphDuration = 8 + Math.random() * 8; // 8-16s per morph cycle
      const rotateDir = Math.random() > 0.5 ? 360 : -360;
      const scaleMin = 0.8 + Math.random() * 0.2;
      const scaleMax = 1.1 + Math.random() * 0.3;
      const hueCycleDuration = 10 + Math.random() * 15; // 10-25s per full hue rotation
      const delay = i * 0.3; // Stagger entrance

      return {
        ...config,
        hueOffset,
        xStart, yStart, xEnd, yEnd,
        duration, morphDuration, rotateDir,
        scaleMin, scaleMax,
        hueCycleDuration, delay,
      };
    });
  }, []);

  // Positions for each blob to spread them across the viewport
  const positions = [
    { top: '10%', left: '5%' },
    { top: '30%', right: '0%' },
    { bottom: '5%', left: '20%' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: blob.scaleMin }}
          animate={{
            opacity: [0, 0.5, 0.6, 0.5],
            scale: [blob.scaleMin, blob.scaleMax, blob.scaleMin],
            x: [`${blob.xStart}%`, `${blob.xEnd}%`, `${blob.xStart}%`],
            y: [`${blob.yStart}%`, `${blob.yEnd}%`, `${blob.yStart}%`],
            rotate: [0, blob.rotateDir],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: blob.delay,
            rotate: { duration: blob.duration * 2, repeat: Infinity, ease: 'linear' },
          }}
          style={{
            position: 'absolute',
            ...positions[i],
            width: blob.size.w,
            height: blob.size.h,
            background: blob.gradient,
            filter: `blur(${blob.blur}px) hue-rotate(${blob.hueOffset}deg)`,
            mixBlendMode: 'screen' as const,
            animation: `${blob.morphAnim} ${blob.morphDuration}s ease-in-out infinite, hue-cycle ${blob.hueCycleDuration}s linear infinite`,
            willChange: 'transform, filter',
          }}
        />
      ))}
    </div>
  );
};
