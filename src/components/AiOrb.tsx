import React, { useRef, useEffect } from 'react';

interface AiOrbProps {
  state: 'idle' | 'connecting' | 'listening' | 'ai-speaking' | 'user-speaking' | 'muted';
  size?: number;
}

// Compact 3D simplex-like noise
function noise3D(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const a = p[X] + Y, aa = p[a] + Z, ab = p[a + 1] + Z;
  const b = p[X + 1] + Y, ba = p[b] + Z, bb = p[b + 1] + Z;
  return lerp(w,
    lerp(v, lerp(u, grad(p[aa], x, y, z), grad(p[ba], x - 1, y, z)),
             lerp(u, grad(p[ab], x, y - 1, z), grad(p[bb], x - 1, y - 1, z))),
    lerp(v, lerp(u, grad(p[aa + 1], x, y, z - 1), grad(p[ba + 1], x - 1, y, z - 1)),
             lerp(u, grad(p[ab + 1], x, y - 1, z - 1), grad(p[bb + 1], x - 1, y - 1, z - 1)))
  );
}
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
const perm = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
const p = new Array(512);
for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

interface Particle {
  theta: number;
  phi: number;
  baseRadius: number;
  speed: number;
  noiseOffset: number;
  size: number;
}

function createParticles(count: number, baseRadius: number): Particle[] {
  const particles: Particle[] = [];
  // Fibonacci sphere for even distribution
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = Math.acos(1 - 2 * (i + 0.5) / count);
    const phi = 2 * Math.PI * i / goldenRatio;
    particles.push({
      theta,
      phi,
      baseRadius: baseRadius + (Math.random() - 0.5) * baseRadius * 0.15,
      speed: 0.3 + Math.random() * 0.7,
      noiseOffset: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
    });
  }
  return particles;
}

function getColorPalette(state: string): { r: number; g: number; b: number }[] {
  switch (state) {
    case 'ai-speaking':
      return [
        { r: 0, g: 220, b: 255 },   // cyan
        { r: 80, g: 120, b: 255 },   // blue
        { r: 160, g: 80, b: 255 },   // purple
        { r: 0, g: 255, b: 200 },    // teal
      ];
    case 'user-speaking':
      return [
        { r: 255, g: 50, b: 150 },   // magenta
        { r: 255, g: 100, b: 50 },   // orange
        { r: 200, g: 50, b: 255 },   // violet
        { r: 255, g: 180, b: 50 },   // gold
      ];
    case 'connecting':
      return [
        { r: 100, g: 100, b: 255 },
        { r: 150, g: 80, b: 255 },
        { r: 80, g: 150, b: 255 },
        { r: 120, g: 120, b: 200 },
      ];
    case 'muted':
      return [
        { r: 80, g: 80, b: 120 },
        { r: 60, g: 60, b: 100 },
        { r: 100, g: 70, b: 110 },
        { r: 70, g: 70, b: 90 },
      ];
    default: // idle, listening
      return [
        { r: 100, g: 60, b: 255 },   // indigo
        { r: 150, g: 50, b: 200 },   // purple
        { r: 60, g: 100, b: 255 },   // blue
        { r: 180, g: 80, b: 220 },   // lavender
      ];
  }
}

export const AiOrb: React.FC<AiOrbProps> = ({ state, size = 380 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const stateRef = useRef(state);
  const timeRef = useRef(0);

  // Keep state in ref for animation loop
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const baseRadius = size * 0.28;
    const particleCount = 900;
    particlesRef.current = createParticles(particleCount, baseRadius);

    const cx = size / 2;
    const cy = size / 2;

    const animate = () => {
      const currentState = stateRef.current;
      const speed = currentState === 'ai-speaking' ? 0.018 
                  : currentState === 'user-speaking' ? 0.014
                  : currentState === 'connecting' ? 0.008
                  : currentState === 'muted' ? 0.003
                  : 0.006;
      
      const distortion = currentState === 'ai-speaking' ? 0.45
                       : currentState === 'user-speaking' ? 0.38
                       : currentState === 'connecting' ? 0.2
                       : currentState === 'muted' ? 0.1
                       : 0.2;

      const glowIntensity = currentState === 'ai-speaking' ? 0.4
                          : currentState === 'user-speaking' ? 0.35
                          : currentState === 'muted' ? 0.05
                          : 0.15;

      timeRef.current += speed;
      const t = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      // Background glow
      const palette = getColorPalette(currentState);
      const glowColor = palette[0];
      const grd = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius * 1.8);
      grd.addColorStop(0, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity})`);
      grd.addColorStop(0.5, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${glowIntensity * 0.3})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, size, size);

      // Sort particles by depth for layering
      const sortedParticles = particlesRef.current.map((p, i) => {
        const theta = p.theta + t * p.speed * 0.5;
        const phi = p.phi + t * p.speed * 0.3;
        
        // Noise-based radius distortion (ferrofluid effect)
        const n = noise3D(
          Math.sin(theta) * 2 + t * 0.5 + p.noiseOffset,
          Math.cos(phi) * 2 + t * 0.3,
          t * 0.2 + p.noiseOffset * 0.5
        );
        const r = p.baseRadius * (1 + n * distortion);

        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta);

        return { x: cx + x, y: cy + y, z, particle: p, index: i };
      }).sort((a, b) => a.z - b.z);

      // Draw particles
      for (const { x, y, z, particle, index } of sortedParticles) {
        const depthFactor = (z + baseRadius) / (2 * baseRadius); // 0 = back, 1 = front
        const alpha = 0.15 + depthFactor * 0.75;
        const sz = particle.size * (0.5 + depthFactor * 0.8);

        // Color based on position and palette
        const colorIndex = index % palette.length;
        const nextColorIndex = (colorIndex + 1) % palette.length;
        const blend = (Math.sin(t * 2 + index * 0.1) + 1) / 2;
        const c1 = palette[colorIndex];
        const c2 = palette[nextColorIndex];
        const r = Math.round(c1.r + (c2.r - c1.r) * blend);
        const g = Math.round(c1.g + (c2.g - c1.g) * blend);
        const b = Math.round(c1.b + (c2.b - c1.b) * blend);

        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        // Bright core for front particles
        if (depthFactor > 0.6) {
          ctx.beginPath();
          ctx.arc(x, y, sz * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${(depthFactor - 0.6) * 0.5})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none"
    />
  );
};
