import { NoiseFunction2D } from 'simplex-noise';
import { TerrainConfig } from '../config/terrainConfig';
import { clamp, lerp, smoothstep } from '../math/noiseLayers';

export interface VertexSurfaceInfo {
  r: number;
  g: number;
  b: number;
  friction: number;
  surfaceType: 'ROCK' | 'TRAIL' | 'MUD' | 'TUNDRA' | 'FROST';
}

function hexToRgb(hex: number): [number, number, number] {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  // Gamma expansion to linear space for Three.js PBR / ACES tone mapping
  return [Math.pow(r, 2.2), Math.pow(g, 2.2), Math.pow(b, 2.2)];
}

const COLOR_SLATE_GREY = hexToRgb(0x4a4d50);
const COLOR_DARK_BASALT = hexToRgb(0x36383a);
const COLOR_DRY_EARTH = hexToRgb(0x6e5a4f);
const COLOR_WET_MUD = hexToRgb(0x3b2f26);
const COLOR_OLIVE_MOSS = hexToRgb(0x555e4b);
const COLOR_DEAD_GRASS = hexToRgb(0x686452);
const COLOR_ASH_FROST = hexToRgb(0xc8ced4);

export function getRiverCarveOffset(
  worldX: number,
  worldZ: number,
  noise2D: NoiseFunction2D,
  _riverLevel?: number
): { offset: number; riverDist: number; inRiver: boolean } {
  const riverDist = Math.abs(noise2D(worldX * 0.0008, worldZ * 0.0008));
  if (riverDist < 0.045) {
    // Sharp riverbank walls carving down to riverLevel - 2.5m
    const t = riverDist / 0.045; // 0 at center, 1 at bank edge
    const bankCarve = (1.0 - smoothstep(0.0, 1.0, t));
    return {
      offset: -bankCarve * 6.5,
      riverDist,
      inRiver: true,
    };
  }
  return { offset: 0, riverDist, inRiver: false };
}

export function evaluateVertexSurface(
  worldX: number,
  worldY: number,
  worldZ: number,
  slope: number, // gradient hypot(dy/dx, dy/dz)
  trailMask: number,
  challengeNoise: number,
  isMudPit: boolean,
  noise2D: NoiseFunction2D,
  config: TerrainConfig
): VertexSurfaceInfo {
  // Moisture: low-frequency noise
  const rawMoisture = noise2D(worldX * 0.001, worldZ * 0.001) * 0.5 + 0.5;
  const isNearRiver = worldY < config.riverLevel + 3.0;
  const moisture = clamp(rawMoisture + (isNearRiver ? 0.4 : 0.0), 0, 1);

  // 1. Deep Mud / Washout
  if (worldY < config.riverLevel + 2.5 || (isMudPit && trailMask < 0.5)) {
    return {
      r: COLOR_WET_MUD[0],
      g: COLOR_WET_MUD[1],
      b: COLOR_WET_MUD[2],
      friction: 0.35,
      surfaceType: 'MUD',
    };
  }

  // 2. Compacted Dirt Trail (non-challenge or technical rock-crawl)
  if (trailMask < 0.35 && challengeNoise <= 0.55) {
    const dirtNoise = (noise2D(worldX * 0.05, worldZ * 0.05) + 1) * 0.5;
    const r = lerp(COLOR_DRY_EARTH[0], COLOR_DARK_BASALT[0], dirtNoise * 0.3);
    const g = lerp(COLOR_DRY_EARTH[1], COLOR_DARK_BASALT[1], dirtNoise * 0.3);
    const b = lerp(COLOR_DRY_EARTH[2], COLOR_DARK_BASALT[2], dirtNoise * 0.3);
    return {
      r,
      g,
      b,
      friction: 0.80,
      surfaceType: 'TRAIL',
    };
  }

  // 3. Exposed Cliff / Rock Crawl
  if (slope > 0.52 || (trailMask < 0.5 && challengeNoise > 0.55)) {
    const basaltBlend = smoothstep(0.52, 0.9, slope);
    const r = lerp(COLOR_SLATE_GREY[0], COLOR_DARK_BASALT[0], basaltBlend);
    const g = lerp(COLOR_SLATE_GREY[1], COLOR_DARK_BASALT[1], basaltBlend);
    const b = lerp(COLOR_SLATE_GREY[2], COLOR_DARK_BASALT[2], basaltBlend);
    return {
      r,
      g,
      b,
      friction: 0.95,
      surfaceType: 'ROCK',
    };
  }

  // 4. Highland Frost / Ash Peak
  if (worldY >= 42.0 && slope <= 0.52) {
    const frostBlend = smoothstep(42.0, 60.0, worldY);
    const r = lerp(COLOR_DEAD_GRASS[0], COLOR_ASH_FROST[0], frostBlend);
    const g = lerp(COLOR_DEAD_GRASS[1], COLOR_ASH_FROST[1], frostBlend);
    const b = lerp(COLOR_DEAD_GRASS[2], COLOR_ASH_FROST[2], frostBlend);
    return {
      r,
      g,
      b,
      friction: 0.45,
      surfaceType: 'FROST',
    };
  }

  // 5. Wasteland Pine / Tundra
  const mossGrassBlend = moisture;
  const r = lerp(COLOR_DEAD_GRASS[0], COLOR_OLIVE_MOSS[0], mossGrassBlend);
  const g = lerp(COLOR_DEAD_GRASS[1], COLOR_OLIVE_MOSS[1], mossGrassBlend);
  const b = lerp(COLOR_DEAD_GRASS[2], COLOR_OLIVE_MOSS[2], mossGrassBlend);
  return {
    r,
    g,
    b,
    friction: 0.70,
    surfaceType: 'TUNDRA',
  };
}
