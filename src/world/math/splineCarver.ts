import { NoiseFunction2D } from 'simplex-noise';
import { TerrainConfig } from '../config/terrainConfig';
import { smoothstep, lerp } from './noiseLayers';

export interface TrailSample {
  trailMask: number; // 0.0 = directly on trail, 1.0 = outside trail
  challengeNoise: number;
  heightOffset: number;
  isMudPit: boolean;
  isRockCrawl: boolean;
}

export function getMainTrailCenterZ(x: number, noise2D: NoiseFunction2D): number {
  return (
    Math.sin(x * 0.003) * 180.0 +
    noise2D(x * 0.0015, 100.0) * 140.0
  );
}

export function evaluateTrails(
  worldX: number,
  worldZ: number,
  noise2D: NoiseFunction2D,
  config: TerrainConfig
): TrailSample {
  // 1. Primary Arterial Trail
  const mainTrailCenterZ = getMainTrailCenterZ(worldX, noise2D);
  const distToMainTrail = Math.abs(worldZ - mainTrailCenterZ);

  // 2. Secondary Branching Trails (Domain-warped zero crossing)
  const warpX = noise2D(worldX * 0.002, worldZ * 0.002) * 25.0;
  const warpZ = noise2D(worldZ * 0.002, worldX * 0.002 + 50.0) * 25.0;
  const branchVal = Math.abs(noise2D(worldX * 0.004 + warpX, worldZ * 0.004 + warpZ));
  const branchDist = branchVal * 35.0; // scale to distance-like metric

  const effectiveDist = Math.min(distToMainTrail, branchDist);

  // 3. Trail mask: 0 inside, 1 outside
  const halfWidth = config.trailWidth * 0.5;
  const blendEnd = halfWidth + config.trailBlendWidth;
  const trailMask = smoothstep(halfWidth, blendEnd, effectiveDist);

  // 4. Technical Challenge Mask
  const challengeNoise = noise2D(worldX * 0.012, worldZ * 0.012);

  let heightOffset = 0;
  let isMudPit = false;
  let isRockCrawl = false;

  // Modulate challenge when on trail
  if (trailMask < 0.8) {
    const influence = 1.0 - trailMask;
    if (challengeNoise > 0.55) {
      isRockCrawl = true;
      // High-frequency rock bumps (0.35m - 0.65m) and stepped ledges
      const rockNoise = Math.abs(noise2D(worldX * 0.4, worldZ * 0.4));
      const bump = lerp(0.35, 0.65, rockNoise);
      heightOffset += bump * influence;
    } else if (challengeNoise < -0.55) {
      isMudPit = true;
      // Depress trail bed by -0.6m for deep mud rut/washout
      heightOffset -= 0.6 * influence;
    }
  }

  return {
    trailMask,
    challengeNoise,
    heightOffset,
    isMudPit,
    isRockCrawl,
  };
}
