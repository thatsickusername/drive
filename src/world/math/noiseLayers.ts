import { NoiseFunction2D } from 'simplex-noise';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function fract(x: number): number {
  return x - Math.floor(x);
}

/**
 * 1. Base Continental Valley: Low-frequency 3-octave fBm mapped through power curve
 */
export function getBaseElevation(x: number, z: number, noise2D: NoiseFunction2D, maxHeight: number): number {
  const scale = 0.0018;
  let total = 0;
  let amplitude = 1.0;
  let frequency = scale;
  let maxAmp = 0;

  for (let o = 0; o < 3; o++) {
    total += noise2D(x * frequency, z * frequency) * amplitude;
    maxAmp += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  // Normalize [-1, 1] -> [0, 1]
  const normalized = (total / maxAmp) * 0.5 + 0.5;
  // Power curve makes valleys wide & driveable while peaks rise sharply
  const curved = Math.pow(normalized, 1.8);
  return curved * maxHeight;
}

/**
 * 2. Rock-Crawling Terraces: Smooth floor stepping for rock ledges and shelves
 */
export function getTerracedRock(height: number, stepSize = 4.0, sharpness = 3.0): number {
  const s = Math.max(stepSize, 0.001);
  const hDivS = height / s;
  const f = fract(hDivS);
  const shaped = Math.pow(f, sharpness);
  const smoothed = smoothstep(0, 1, shaped);
  return Math.floor(hDivS) * s + s * smoothed;
}

/**
 * 3. Ridged Mountain Spines: (1.0 - |noise2D(x, z)|)^2
 */
export function getRidgedNoise(x: number, z: number, noise2D: NoiseFunction2D, scale = 0.005): number {
  const n = noise2D(x * scale, z * scale);
  const r = 1.0 - Math.abs(n);
  return r * r;
}
