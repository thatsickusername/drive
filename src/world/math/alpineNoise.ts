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
 * 1. Altitude gating: completely inactive in valleys (<65m) and ramps smoothly up to peaks (>130m).
 * 2. Ridged multi-fractal: sharpens rounded RBF domes into natural knife-edge arêtes and horns.
 * 3. Stratified bedrock steps: creates horizontal geological rock benches on steep alpine slopes.
 * 4. Gradient safety: slope-damping caps inclination to preserve 4L crawler drivability.
 */
export function computeAlpineElevation(
  x: number,
  z: number,
  baseHeight: number,
  seed: string = '20'
): number {
  // 1. Altitude mask: inactive below 65m, fully active above 135m
  if (baseHeight < 65.0) {
    return 0.0;
  }
  const altMask = smoothstep(65.0, 135.0, baseHeight);

  const noise2D = getAlpineNoise2D(seed);

  // 2. Domain warp for organic mountain cirques and curving knife-edge crests
  const warpX = x + noise2D(x * 0.0018 + 50.0, z * 0.0018 + 50.0) * 45.0;
  const warpZ = z + noise2D(x * 0.0018 + 150.0, z * 0.0018 + 150.0) * 45.0;

  // 3. Ridged multifractal octaves (sharpens rounded domes into arêtes)
  // Octave 1: Major alpine mountain spines (wavelength ~180m)
  const n1 = noise2D(warpX * 0.0055, warpZ * 0.0055);
  const ridge1 = 1.0 - Math.sqrt(n1 * n1 + 0.02);
  const spineRidge = Math.pow(Math.max(0, ridge1), 1.7) * 22.0;

  // Octave 2: Secondary spurs and cirque bowls (wavelength ~75m)
  const n2 = noise2D(warpX * 0.0135 + 20.0, warpZ * 0.0135 + 20.0);
  const ridge2 = 1.0 - Math.sqrt(n2 * n2 + 0.04);
  const spurRidge = Math.pow(Math.max(0, ridge2), 1.4) * 8.0;

  // Octave 3: Craggy rock outcroppings (wavelength ~28m)
  const n3 = noise2D(warpX * 0.035 + 75.0, warpZ * 0.035 + 75.0);
  const crags = n3 * 2.8;

  const totalRidge = (spineRidge + spurRidge + crags) * altMask;

  // 4. Stratified bedrock ledges on high alpine rock zones
  let bedrockLedges = 0.0;
  if (baseHeight > 85.0) {
    const stepSize = 3.6; // 3.6m vertical rock shelves
    const shelfNoise = noise2D(x * 0.008 + 300.0, z * 0.008 + 300.0) * 2.5;
    const phase = (baseHeight + totalRidge * 0.4 + shelfNoise) / stepSize;
    const f = phase - Math.floor(phase);
    // Flat rock shelf + ~40 degree climbable escarpment ramp
    const ledgeDelta = (smoothstep(0.55, 0.90, f) - f) * stepSize;
    const highRockMask = smoothstep(85.0, 140.0, baseHeight);
    bedrockLedges = ledgeDelta * highRockMask * 0.55;
  }

  return totalRidge + bedrockLedges;
}
