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
const COLOR_BRIDGE_DECK = hexToRgb(0x383b3f); // Weathered structural asphalt/concrete bridge deck
const COLOR_BRIDGE_EMBANKMENT = hexToRgb(0x4c5055); // Engineered crushed rock rip-rap / causeway stone

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
  config: TerrainConfig,
  curvature = 0.0, // Laplacian curvature: positive = concave dip/valley, negative = convex ridge
  isBridge = false
): VertexSurfaceInfo {
  // Moisture: low-frequency noise
  const rawMoisture = noise2D(worldX * 0.001, worldZ * 0.001) * 0.5 + 0.5;
  const isNearRiver = worldY < config.riverLevel + 3.0;
  const moisture = clamp(rawMoisture + (isNearRiver ? 0.4 : 0.0), 0, 1);

  // 1. Deep Mud / Washout (Valleys & designated mud pits)
  if (worldY < config.riverLevel + 2.5 || (isMudPit && trailMask < 0.55)) {
    return {
      r: COLOR_WET_MUD[0],
      g: COLOR_WET_MUD[1],
      b: COLOR_WET_MUD[2],
      friction: 0.35,
      surfaceType: 'MUD',
    };
  }

  // 2. Bridge / Causeway Structure: Dedicated engineered deck & rip-rap abutment stone
  if (isBridge && trailMask < 0.45) {
    const deckNoise = (noise2D(worldX * 0.08, worldZ * 0.08) + 1) * 0.5;
    if (trailMask < 0.20) {
      // Main bridge roadbed surface: engineered concrete / paved bridge deck
      const r = lerp(COLOR_BRIDGE_DECK[0], COLOR_DARK_BASALT[0], deckNoise * 0.25);
      const g = lerp(COLOR_BRIDGE_DECK[1], COLOR_DARK_BASALT[1], deckNoise * 0.25);
      const b = lerp(COLOR_BRIDGE_DECK[2], COLOR_DARK_BASALT[2], deckNoise * 0.25);
      return {
        r,
        g,
        b,
        friction: 0.90,
        surfaceType: 'TRAIL',
      };
    } else {
      // Causeway embankment slope: protective crushed rock rip-rap / retaining abutment
      const r = lerp(COLOR_BRIDGE_EMBANKMENT[0], COLOR_SLATE_GREY[0], deckNoise * 0.3);
      const g = lerp(COLOR_BRIDGE_EMBANKMENT[1], COLOR_SLATE_GREY[1], deckNoise * 0.3);
      const b = lerp(COLOR_BRIDGE_EMBANKMENT[2], COLOR_SLATE_GREY[2], deckNoise * 0.3);
      return {
        r,
        g,
        b,
        friction: 0.88,
        surfaceType: 'ROCK',
      };
    }
  }

  // 3. Compacted Dirt / Crushed Rock Trail
  if (trailMask < 0.35 && challengeNoise <= 0.55) {
    const dirtNoise = (noise2D(worldX * 0.05, worldZ * 0.05) + 1) * 0.5;
    const isAlpineTrail = worldY > 110.0;
    const baseColor = isAlpineTrail ? COLOR_DARK_BASALT : COLOR_DRY_EARTH;
    let r = lerp(baseColor[0], COLOR_DARK_BASALT[0], dirtNoise * 0.3);
    let g = lerp(baseColor[1], COLOR_DARK_BASALT[1], dirtNoise * 0.3);
    let b = lerp(baseColor[2], COLOR_DARK_BASALT[2], dirtNoise * 0.3);

    // Subtle off-road rut/berm shading from surface curvature:
    // Curvature > 0: concave compacted rut trough (slightly darker, damp soil)
    // Curvature < 0: convex raised berm crest (slightly lighter, loose displaced earth/gravel)
    if (curvature > 0.015) {
      const rutShade = clamp((curvature - 0.015) * 4.0, 0, 0.35);
      r = lerp(r, COLOR_WET_MUD[0], rutShade);
      g = lerp(g, COLOR_WET_MUD[1], rutShade);
      b = lerp(b, COLOR_WET_MUD[2], rutShade);
    } else if (curvature < -0.015) {
      const bermShade = clamp((-curvature - 0.015) * 3.5, 0, 0.25);
      r = clamp(r + bermShade * 0.04, 0, 1);
      g = clamp(g + bermShade * 0.035, 0, 1);
      b = clamp(b + bermShade * 0.03, 0, 1);
    }

    return {
      r,
      g,
      b,
      friction: isAlpineTrail ? 0.85 : 0.82,
      surfaceType: 'TRAIL',
    };
  }

  // Horizontal strata banding function for steep rock faces
  const getStrataMod = (y: number) => Math.sin(y * 1.8) * 0.06;

  // 3. High Alpine Peaks & Snow Slopes (145m+)
  if (worldY >= 135.0) {
    const snowAltitudeBlend = smoothstep(135.0, 155.0, worldY);

    // Steep rock cliff faces that shed snow (slope > 0.65, ~38 deg)
    if (slope > 0.65) {
      const basaltBlend = smoothstep(0.65, 0.95, slope);
      let r = lerp(COLOR_SLATE_GREY[0], COLOR_DARK_BASALT[0], basaltBlend);
      let g = lerp(COLOR_SLATE_GREY[1], COLOR_DARK_BASALT[1], basaltBlend);
      let b = lerp(COLOR_SLATE_GREY[2], COLOR_DARK_BASALT[2], basaltBlend);

      const strata = getStrataMod(worldY);
      r = clamp(r + strata, 0, 1);
      g = clamp(g + strata, 0, 1);
      b = clamp(b + strata, 0, 1);

      return {
        r,
        g,
        b,
        friction: 0.95,
        surfaceType: 'ROCK',
      };
    }

    // High alpine snow cover on drivable slopes (slope <= 0.65)
    const snowSlopeDamp = 1.0 - smoothstep(0.45, 0.65, slope);
    const snowFactor = snowAltitudeBlend * snowSlopeDamp;

    let r = lerp(COLOR_SLATE_GREY[0], COLOR_ASH_FROST[0], snowFactor);
    let g = lerp(COLOR_SLATE_GREY[1], COLOR_ASH_FROST[1], snowFactor);
    let b = lerp(COLOR_SLATE_GREY[2], COLOR_ASH_FROST[2], snowFactor);

    return {
      r,
      g,
      b,
      friction: lerp(0.85, 0.42, snowFactor),
      surfaceType: 'FROST',
    };
  }

  // 4. Sub-Alpine Timberline & Scree (65m - 145m)
  if (worldY >= 65.0) {
    // Exposed cliff or technical rock climb
    if (slope > 0.48 || (trailMask < 0.5 && challengeNoise > 0.55)) {
      const basaltBlend = smoothstep(0.48, 0.85, slope);
      let r = lerp(COLOR_SLATE_GREY[0], COLOR_DARK_BASALT[0], basaltBlend);
      let g = lerp(COLOR_SLATE_GREY[1], COLOR_DARK_BASALT[1], basaltBlend);
      let b = lerp(COLOR_SLATE_GREY[2], COLOR_DARK_BASALT[2], basaltBlend);

      const strata = getStrataMod(worldY);
      r = clamp(r + strata, 0, 1);
      g = clamp(g + strata, 0, 1);
      b = clamp(b + strata, 0, 1);

      return {
        r,
        g,
        b,
        friction: 0.95,
        surfaceType: 'ROCK',
      };
    }

    // Golden-brown alpine tundra grass & scree
    const altitudeProgression = smoothstep(65.0, 135.0, worldY);
    let r = lerp(COLOR_OLIVE_MOSS[0], COLOR_DEAD_GRASS[0], altitudeProgression);
    let g = lerp(COLOR_OLIVE_MOSS[1], COLOR_DEAD_GRASS[1], altitudeProgression);
    let b = lerp(COLOR_OLIVE_MOSS[2], COLOR_DEAD_GRASS[2], altitudeProgression);

    // Convex scree modulation
    if (curvature < -0.1) {
      const screeBlend = clamp(-curvature * 0.3, 0, 0.4);
      r = lerp(r, COLOR_SLATE_GREY[0], screeBlend);
      g = lerp(g, COLOR_SLATE_GREY[1], screeBlend);
      b = lerp(b, COLOR_SLATE_GREY[2], screeBlend);
    }

    return {
      r,
      g,
      b,
      friction: 0.85,
      surfaceType: 'TUNDRA',
    };
  }

  // 5. Valley Floor & Boreal Forest (0m - 65m)
  if (slope > 0.52) {
    const basaltBlend = smoothstep(0.52, 0.85, slope);
    let r = lerp(COLOR_SLATE_GREY[0], COLOR_DARK_BASALT[0], basaltBlend);
    let g = lerp(COLOR_SLATE_GREY[1], COLOR_DARK_BASALT[1], basaltBlend);
    let b = lerp(COLOR_SLATE_GREY[2], COLOR_DARK_BASALT[2], basaltBlend);
    const strata = getStrataMod(worldY);
    r = clamp(r + strata, 0, 1);
    g = clamp(g + strata, 0, 1);
    b = clamp(b + strata, 0, 1);
    return {
      r,
      g,
      b,
      friction: 0.95,
      surfaceType: 'ROCK',
    };
  }

  // Forest floor with Laplacian curvature lushness
  const curvatureBias = clamp(curvature * 0.5, -0.35, 0.35);
  const meadowLushness = clamp(moisture + curvatureBias, 0, 1);

  let r = lerp(COLOR_DRY_EARTH[0], COLOR_OLIVE_MOSS[0], meadowLushness);
  let g = lerp(COLOR_DRY_EARTH[1], COLOR_OLIVE_MOSS[1], meadowLushness);
  let b = lerp(COLOR_DRY_EARTH[2], COLOR_OLIVE_MOSS[2], meadowLushness);

  return {
    r,
    g,
    b,
    friction: 0.78,
    surfaceType: 'TUNDRA',
  };
}
