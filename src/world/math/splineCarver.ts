import { NoiseFunction2D } from 'simplex-noise';
import { TerrainConfig } from '../config/terrainConfig';
import { smoothstep } from './noiseLayers';
import { getSlowRoadsPipeline, getRoadCenterZ } from './slowRoadsCore';

export interface TrailSample {
  trailMask: number;       // 0.0 = directly on trail bed, 1.0 = outside road bed
  corridorMask: number;    // 0.0 = on trail, 1.0 = outside shoulder blend
  challengeNoise: number;
  heightOffset: number;
  surfaceProfile: number;  // road crown (+0.08m) and dual wheel ruts (-0.12m)
  isMudPit: boolean;
  isRockCrawl: boolean;
}

/**
 * Primary Arterial Route with mountain switchback hairpins
 */
export function getTrailSplineZ(wx: number, noise2D: NoiseFunction2D): {
  z: number;
  dZdX: number;
  mountainWeave: number;
} {
  const mountainWeave = smoothstep(
    0.32,
    0.75,
    noise2D(wx * 0.00035, 50.0) * 0.5 + 0.5
  );

  // Base valley curve + tight mountain switchback hairpins
  const baseZ = Math.sin(wx * 0.0022) * 220.0 + noise2D(wx * 0.0012, 100.0) * 160.0;
  const switchbackZ = Math.sin(wx * 0.014) * (95.0 * mountainWeave);
  const z = baseZ + switchbackZ;

  const dZdX =
    0.0022 * 220.0 * Math.cos(wx * 0.0022) +
    0.014 * 95.0 * mountainWeave * Math.cos(wx * 0.014);

  return { z, dZdX, mountainWeave };
}

export function getMainTrailCenterZ(wx: number, _noise2D?: NoiseFunction2D): number {
  return getRoadCenterZ(wx);
}

/**
 * Secondary Ridge Climb Spur Trail (Layer 4 Summit Spur)
 * Narrower 4L trail climbing perpendicular to radio towers / summits
 */
export function getSpurSplineX(wz: number, noise2D: NoiseFunction2D): {
  x: number;
  dXdZ: number;
  mountainWeave: number;
} {
  const mountainWeave = smoothstep(
    0.35,
    0.78,
    noise2D(120.0, wz * 0.00035) * 0.5 + 0.5
  );

  const baseX = Math.sin(wz * 0.0025 + 1.2) * 210.0 + noise2D(wz * 0.0013, 300.0) * 150.0;
  const switchbackX = Math.sin(wz * 0.016) * (85.0 * mountainWeave);
  const x = baseX + switchbackX;

  const dXdZ =
    0.0025 * 210.0 * Math.cos(wz * 0.0025 + 1.2) +
    0.016 * 85.0 * mountainWeave * Math.cos(wz * 0.016);

  return { x, dXdZ, mountainWeave };
}

export function evaluateTrails(
  worldX: number,
  worldZ: number,
  noise2D: NoiseFunction2D,
  config: TerrainConfig
): TrailSample {
  const pipeline = getSlowRoadsPipeline(config.seed);
  const roadHit = pipeline.getRoadHit(worldX, worldZ);
  const dist = roadHit ? roadHit.d : 999.0;
  const halfWidth = (config.trailWidth || 8.0) * 0.5;
  const blendWidth = config.trailBlendWidth || 16.0;

  const trailMask = smoothstep(halfWidth, halfWidth + blendWidth, dist);
  const challengeNoise = noise2D ? noise2D(worldX * 0.012, worldZ * 0.012) : 0;

  return {
    trailMask,
    corridorMask: trailMask,
    challengeNoise,
    heightOffset: 0,
    surfaceProfile: 0,
    isMudPit: false,
    isRockCrawl: challengeNoise > 0.65 && trailMask > 0.8,
  };
}

/**
 * Slow Roads Layered RBF Procedural Elevation with Roadbed Carving
 */
export function computeRawTerrainHeight(
  wx: number,
  wz: number,
  _noise2D: NoiseFunction2D,
  config: TerrainConfig
): number {
  const pipeline = getSlowRoadsPipeline(config.seed);
  return pipeline.getHeight(wx, wz);
}
