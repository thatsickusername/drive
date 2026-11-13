import { NoiseFunction2D } from 'simplex-noise';
import { TerrainConfig } from '../config/terrainConfig';
import {
  smoothstep,
  lerp,
  clamp,
  getMacroTopography,
  getOffRoadSurfaceDetail,
} from './noiseLayers';
import { getRiverCarveOffset } from '../biomes/biomeEvaluator';

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

export function getMainTrailCenterZ(wx: number, noise2D: NoiseFunction2D): number {
  return getTrailSplineZ(wx, noise2D).z;
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
  // 1. Primary Arterial Trail with arc-length corrected distance
  const splineZ = getTrailSplineZ(worldX, noise2D);
  const perpDistMain = Math.abs(worldZ - splineZ.z) / Math.sqrt(1.0 + splineZ.dZdX * splineZ.dZdX);

  const mainHalfWidth = config.trailWidth * 0.5;
  const mainBlendEnd = mainHalfWidth + config.trailBlendWidth;
  const mainTrailMask = smoothstep(mainHalfWidth, mainBlendEnd, perpDistMain);

  // 2. Secondary Summit Spur Trail
  const splineX = getSpurSplineX(worldZ, noise2D);
  const perpDistSpur = Math.abs(worldX - splineX.x) / Math.sqrt(1.0 + splineX.dXdZ * splineX.dXdZ);

  const spurHalfWidth = 2.4;
  const spurBlendEnd = spurHalfWidth + 10.0;
  const spurTrailMask = smoothstep(spurHalfWidth, spurBlendEnd, perpDistSpur);

  const trailMask = Math.min(mainTrailMask, spurTrailMask);
  const isSpurNearer = spurTrailMask < mainTrailMask;
  const effectiveDist = isSpurNearer ? perpDistSpur : perpDistMain;
  const halfWidth = isSpurNearer ? spurHalfWidth : mainHalfWidth;

  // 3. Road Crown (+0.08m) & Wheel Ruts (-0.12m)
  let surfaceProfile = 0;
  if (effectiveDist < halfWidth + 1.5) {
    const rutDist = Math.abs(effectiveDist - 1.1);
    const rut = Math.exp(-rutDist * rutDist * 3.5) * -0.12;
    const crown = Math.max(0, 1.0 - (effectiveDist / (halfWidth * 0.6))) * 0.08;
    const edgeFade = 1.0 - smoothstep(halfWidth * 0.75, halfWidth + 1.2, effectiveDist);
    surfaceProfile = (rut + crown) * edgeFade;
  }

  // 4. Mud ruts & Rock crawl challenges
  const challengeNoise = noise2D(worldX * 0.012, worldZ * 0.012);
  const mudNoise = noise2D(worldX * 0.015, worldZ * 0.015);
  const isMudPit = mudNoise > 0.6 && effectiveDist < halfWidth;
  const isRockCrawl = challengeNoise > 0.55 && trailMask < 0.7;

  let heightOffset = 0;
  if (trailMask < 0.8) {
    const influence = 1.0 - trailMask;
    if (isRockCrawl) {
      heightOffset += 0.25 * influence;
    } else if (isMudPit) {
      heightOffset -= 0.45 * influence;
    }
  }

  return {
    trailMask,
    corridorMask: trailMask,
    challengeNoise,
    heightOffset,
    surfaceProfile,
    isMudPit,
    isRockCrawl,
  };
}

/**
 * 4-Layer Procedural Geological Synthesis (over the hill Architecture)
 * 1. Macro Mountain Massifs (up to 240m+)
 * 2. Off-Road Drivable Surface Detail (0.15m - 0.6m soil/rock slabs)
 * 3. Bench-Cut Mountain Switchbacks (7m shelf carved directly into steep faces)
 * 4. Secondary Summit Spur Climbs
 */
export function computeRawTerrainHeight(
  wx: number,
  wz: number,
  noise2D: NoiseFunction2D,
  config: TerrainConfig
): number {
  // Layer 1: Continuous Mountain Massifs & Spine Ridges
  const macro = getMacroTopography(wx, wz, noise2D);

  // Layer 2: Drivable Off-Trail Surface Detail
  const surfaceDetail = getOffRoadSurfaceDetail(wx, wz, macro.height, macro.mountainMask, noise2D);
  let naturalHeight = macro.height + surfaceDetail;

  // River basins (only in low valley basins, never across mountain peaks)
  if (macro.mountainMask < 0.45 && naturalHeight < 35.0) {
    const river = getRiverCarveOffset(wx, wz, noise2D, config.riverLevel);
    naturalHeight += river.offset;
  }

  // Layer 3: Mountain Switchback Bench-Cut Trail (Primary Arterial Route)
  const splineZ = getTrailSplineZ(wx, noise2D);
  const perpDistMain = Math.abs(wz - splineZ.z) / Math.sqrt(1.0 + splineZ.dZdX * splineZ.dZdX);

  const mainHalfWidth = config.trailWidth * 0.5; // 3.5m -> 7m level shelf
  const mainShoulder = config.trailBlendWidth;   // 15m graded mountain bank

  if (perpDistMain < mainHalfWidth + mainShoulder) {
    // Road climbs WITH the mountain's macro elevation at the centerline
    const centerMacro = getMacroTopography(wx, splineZ.z, noise2D).height;
    const centerDetail = getOffRoadSurfaceDetail(wx, splineZ.z, centerMacro, macro.mountainMask, noise2D) * 0.15;
    const trailCenterY = centerMacro + centerDetail;

    const t = smoothstep(mainHalfWidth, mainHalfWidth + mainShoulder, perpDistMain);
    const rutProfile = Math.cos(clamp(perpDistMain / mainHalfWidth, 0, 1) * Math.PI * 1.5) * 0.12;
    const mudZone = smoothstep(0.6, 0.85, noise2D(wx * 0.015, splineZ.z * 0.015));
    const trailSurfaceY = trailCenterY - mudZone * 0.45 + rutProfile * (1.0 + mudZone);

    naturalHeight = lerp(trailSurfaceY, naturalHeight, t);
  }

  // Layer 4: Secondary Ridge Climb Trails (Summit Spur Trails)
  const splineX = getSpurSplineX(wz, noise2D);
  const perpDistSpur = Math.abs(wx - splineX.x) / Math.sqrt(1.0 + splineX.dXdZ * splineX.dXdZ);

  const spurHalfWidth = 2.4; // 4.8m single-track mountain ridge climb
  const spurShoulder = 10.0;

  if (perpDistSpur < spurHalfWidth + spurShoulder) {
    const centerMacroSpur = getMacroTopography(splineX.x, wz, noise2D).height;
    const trailCenterYSpur = centerMacroSpur;

    const tSpur = smoothstep(spurHalfWidth, spurHalfWidth + spurShoulder, perpDistSpur);
    const rockRoughness = noise2D(wx * 0.08, wz * 0.08) * 0.12;
    const spurSurfaceY = trailCenterYSpur + rockRoughness;

    naturalHeight = lerp(spurSurfaceY, naturalHeight, tSpur);
  }

  return naturalHeight;
}
