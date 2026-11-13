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
 * Layer 1: Macro Mountain Massifs & Spine Ridges
 * Continuous geological forms with distinct base valleys, foothills, and alpine peaks.
 * Wavelengths > 150m ensure slopes stay within 15 deg - 38 deg without physical spikes.
 */
export function getMacroTopography(wx: number, wz: number, noise2D: NoiseFunction2D): {
  height: number;
  mountainMask: number;
  ridgeFactor: number;
} {
  // 1. Domain warp so mountain ranges curve organically like British Columbia geology
  const warpX = wx + noise2D(wx * 0.0004, wz * 0.0004) * 320.0;
  const warpZ = wz + noise2D(wx * 0.0004 + 100.0, wz * 0.0004 + 100.0) * 320.0;

  // 2. Regional Mountain Mask (wavelength ~2.5km)
  // 0.0 = Valley / Lake basin (Emerald Lake)
  // 1.0 = High Alpine Massif (Asgard Mountain / Gimli Ridge)
  const rawRegion = noise2D(warpX * 0.00035, warpZ * 0.00035) * 0.5 + 0.5;
  const mountainMask = smoothstep(0.28, 0.78, rawRegion);

  // 3. Connected Mountain Spine (Rounded Ridge with hyperbolic smooth-abs)
  const spineNoise = noise2D(warpX * 0.00075 + 200.0, warpZ * 0.00075 + 200.0);
  const smoothAbs = Math.sqrt(spineNoise * spineNoise + 0.025);
  const ridgeFactor = Math.pow(Math.max(0, 1.0 - smoothAbs), 1.6);

  // 4. Secondary Foothills & Spurs (wavelength ~350m - 700m)
  const foothills1 = noise2D(warpX * 0.0016, warpZ * 0.0016) * 0.5 + 0.5;
  const foothills2 = noise2D(wx * 0.0032, wz * 0.0032) * 0.5 + 0.5;
  const spurHeight = foothills1 * 55.0 + foothills2 * 18.0 * foothills1;

  // 5. Base valley elevation + massif elevation
  const valleyBase = (noise2D(wx * 0.0008, wz * 0.0008) * 0.5 + 0.5) * 22.0;
  const massifHeight = mountainMask * (ridgeFactor * 165.0 + spurHeight);

  return {
    height: valleyBase + massifHeight,
    mountainMask,
    ridgeFactor,
  };
}

/**
 * Layer 2: Drivable Off-Trail Surface Detail
 * Separates macro elevation from micro undulations so off-trail hillslopes remain
 * drivable under 4L crawling without vertex needles catching raycast suspension.
 */
export function getOffRoadSurfaceDetail(
  wx: number,
  wz: number,
  macroHeight: number,
  mountainMask: number,
  noise2D: NoiseFunction2D
): number {
  // 1. Medium-scale hummocks / gullies (wavelength ~45m, height +/- 2.2m)
  const hummocks = noise2D(wx * 0.022, wz * 0.022) * 2.2;

  // 2. Localized Bedrock Slabs / Ledges (patchy alpine rock zones)
  const rockZoneMask =
    smoothstep(0.55, 0.8, noise2D(wx * 0.003 + 500.0, wz * 0.003 + 500.0) * 0.5 + 0.5) *
    mountainMask;

  let rockLedgeOffset = 0;
  if (rockZoneMask > 0.01) {
    const stepSize = 2.2;
    const phase = (macroHeight + noise2D(wx * 0.012, wz * 0.012) * 3.0) / stepSize;
    const f = phase - Math.floor(phase);
    // Smooth ramped ledge: flat shelf + 40-degree climbable face
    const terraceDelta = (smoothstep(0.65, 0.95, f) - f) * stepSize;
    rockLedgeOffset = terraceDelta * rockZoneMask * 0.75;
  }

  // 3. Micro soil/root undulation (wavelength ~8m, amplitude 0.28m)
  const microBumps = noise2D(wx * 0.12, wz * 0.12) * 0.28;

  return hummocks + rockLedgeOffset + microBumps;
}

/**
 * 1. Slope-Eroded Derivative Noise (Inigo Quilez Method)
 * Analytical gradient damping prevents high-frequency octaves from forming needle spikes.
 */
export function getErodedHills(wx: number, wz: number, noise2D: NoiseFunction2D, seedOffset = 0): number {
  let freq = 0.0012; // Wide wavelength (~800m macro hills)
  let amp = 28.0;    // Max hill height in meters
  let totalHeight = 0;
  let gradX = 0;
  let gradZ = 0;
  const eps = 0.5;

  for (let i = 0; i < 4; i++) {
    const n = noise2D(wx * freq + seedOffset, wz * freq + seedOffset);
    // Finite-difference gradient for analytical slope damping
    const nx = noise2D((wx + eps) * freq + seedOffset, wz * freq + seedOffset);
    const nz = noise2D(wx * freq + seedOffset, (wz + eps) * freq + seedOffset);

    const dx = (nx - n) / eps;
    const dz = (nz - n) / eps;

    gradX += dx;
    gradZ += dz;

    // Dampen amplitude where accumulated gradient is steep
    const slopeDamping = 1.0 / (1.0 + 0.65 * (gradX * gradX + gradZ * gradZ));
    totalHeight += amp * (n * 0.5 + 0.5) * slopeDamping;

    freq *= 2.05;
    amp *= 0.38; // Aggressive persistence drop for smooth drivable surfaces
  }

  return totalHeight;
}

/**
 * 2. Base Valley Elevation: Low-frequency 2-octave base for broad, driveable valley basins
 */
export function getBaseElevation(x: number, z: number, noise2D: NoiseFunction2D, maxHeight: number): number {
  const n1 = noise2D(x * 0.0008, z * 0.0008) * 1.0;
  const n2 = noise2D(x * 0.002, z * 0.002) * 0.35;
  const n3 = noise2D(x * 0.005, z * 0.005) * 0.08;
  const total = (n1 + n2 + n3) / 1.43;

  const normalized = total * 0.5 + 0.5;
  const curved = Math.pow(normalized, 1.4);
  return curved * maxHeight;
}

/**
 * 3. Stratified Mesa Terrace: Flattens tops and steps only in the upper fraction of each shelf
 */
export function getSmoothMesaTerrace(baseHeight: number, stepHeight = 8.0, flatness = 0.75): number {
  const level = Math.floor(baseHeight / stepHeight);
  const frac = (baseHeight / stepHeight) - level;
  const ramp = Math.min(1.0, Math.max(0.0, (frac - flatness) / (1.0 - flatness)));
  const smoothRamp = ramp * ramp * (3.0 - 2.0 * ramp);
  return (level + smoothRamp) * stepHeight;
}

/**
 * Legacy rock terracing for backward compatibility
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
 * 4. Smooth Mountain Ridges: Domain-warped coordinates with hyperbolic smooth-abs
 * Eliminates needle-sharp C0 crease at zero-crossings.
 */
export function getSmoothMountainRidge(wx: number, wz: number, noise2D: NoiseFunction2D): number {
  const warpX = wx + noise2D(wx * 0.0008, wz * 0.0008) * 90.0;
  const warpZ = wz + noise2D(wx * 0.0008 + 50.0, wz * 0.0008 + 50.0) * 90.0;

  const n1 = noise2D(warpX * 0.0009, warpZ * 0.0009);
  const smoothAbs = Math.sqrt(n1 * n1 + 0.04);
  const ridge = Math.max(0.0, 1.0 - smoothAbs);
  return (ridge * ridge) * 55.0;
}

/**
 * Legacy ridged noise with smooth-abs rounding
 */
export function getRidgedNoise(x: number, z: number, noise2D: NoiseFunction2D, scale = 0.005): number {
  const n = noise2D(x * scale, z * scale);
  const smoothAbs = Math.sqrt(n * n + 0.02);
  const r = Math.max(0, 1.0 - smoothAbs);
  return r * r;
}
