import { createSeededNoise2D } from './prng';
import { smoothstep } from './noiseLayers';
import { NoiseFunction2D } from 'simplex-noise';

const noiseCache = new Map<string, NoiseFunction2D>();

function getAlpineNoise2D(seed: string): NoiseFunction2D {
  let fn = noiseCache.get(seed);
  if (!fn) {
    fn = createSeededNoise2D(`${seed}_alpine_crags_v1`);
    noiseCache.set(seed, fn);
  }
  return fn;
}

/**
 * Computes high-altitude alpine mountain geomorphology:
 * 1. Altitude gating: completely inactive in valleys & foothills (<85m), active on high peaks (>140m).
 * 2. Zero-mean ridged multi-fractal: sculpts natural knife-edge arêtes (+) and glacial cirques (-)
 *    without inflating macro mountain elevation or shifting the landscape.
 * 3. Smooth continuous geological rock strata (no discontinuous step functions).
 */
export function computeAlpineElevation(
  x: number,
  z: number,
  baseHeight: number,
  seed: string = '20'
): number {
  // 1. Altitude mask: inactive below 85m, fully active on high peaks (>140m)
  if (baseHeight < 85.0) {
    return 0.0;
  }
  const altMask = smoothstep(85.0, 140.0, baseHeight);

  const noise2D = getAlpineNoise2D(seed);

  // 2. Domain warp for organic curving arêtes and glacial cirques
  const warpX = x + noise2D(x * 0.0016 + 50.0, z * 0.0016 + 50.0) * 40.0;
  const warpZ = z + noise2D(x * 0.0016 + 150.0, z * 0.0016 + 150.0) * 40.0;

  // 3. Zero-mean ridged multi-fractal (sculpts peaks with arêtes [+] and glacial cirques [-])
  // Octave 1: Major alpine arêtes & cirque bowls (wavelength ~160m, +/- 3.5m)
  const n1 = noise2D(warpX * 0.006, warpZ * 0.006);
  const ridge1 = (1.0 - Math.sqrt(n1 * n1 + 0.03)) * 1.5 - 0.55;
  const spineRidge = ridge1 * 3.8;

  // Octave 2: Secondary spurs and chutes (wavelength ~65m, +/- 1.8m)
  const n2 = noise2D(warpX * 0.015 + 20.0, warpZ * 0.015 + 20.0);
  const spurRidge = n2 * 1.8;

  // Octave 3: Crags and geological rock texture (wavelength ~25m, +/- 0.8m)
  const n3 = noise2D(warpX * 0.040 + 75.0, warpZ * 0.040 + 75.0);
  const crags = n3 * 0.85;

  // 4. Smooth continuous geological rock strata (wavelength 8m, +/- 0.6m)
  const strataPhase = (baseHeight + (spineRidge + spurRidge) * 0.4) / 8.0;
  const strata = Math.sin(strataPhase * Math.PI * 2) * 0.6;

  return (spineRidge + spurRidge + crags + strata) * altMask;
}
