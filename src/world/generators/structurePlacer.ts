import { cyrb128, mulberry32 } from '../math/prng';
import { smoothstep, lerp } from '../math/noiseLayers';
import { TerrainConfig } from '../config/terrainConfig';

export interface StructurePOI {
  type: 'FUEL_DEPOT' | 'OUTPOST' | 'RANGER_CABIN' | 'WATCHTOWER';
  x: number;
  y: number;
  z: number;
  yaw: number;
  radius: number;
  blendSkirt: number;
}

export function evaluateStructureForChunk(
  cx: number,
  cz: number,
  config: TerrainConfig,
  getHeightAt: (x: number, z: number) => number
): StructurePOI | null {
  const [s1] = cyrb128(config.seed);
  const chunkSeed = ((s1 ^ (cx * 73856093) ^ (cz * 19349663)) >>> 0);
  const rand = mulberry32(chunkSeed);

  const roll = rand();
  let type: StructurePOI['type'];
  let radius = 12;
  let blendSkirt = 10;

  if (roll < 0.04) {
    type = 'FUEL_DEPOT';
    radius = 22;
    blendSkirt = 14;
  } else if (roll < 0.10) {
    type = 'OUTPOST';
    radius = 16;
    blendSkirt = 12;
  } else if (roll < 0.16) {
    type = 'RANGER_CABIN';
    radius = 11;
    blendSkirt = 8;
  } else if (roll < 0.22) {
    type = 'WATCHTOWER';
    radius = 9;
    blendSkirt = 7;
  } else {
    return null;
  }

  // Chunk center with slight jitter
  const centerX = (cx + 0.5) * config.chunkSize + (rand() - 0.5) * (config.chunkSize * 0.35);
  const centerZ = (cz + 0.5) * config.chunkSize + (rand() - 0.5) * (config.chunkSize * 0.35);

  const yCenter = getHeightAt(centerX, centerZ);

  // Reject if too close to or below water
  if (yCenter <= config.riverLevel + 2.0) {
    return null;
  }

  // Check slope around site
  const delta = 2.0;
  const yE = getHeightAt(centerX + delta, centerZ);
  const yW = getHeightAt(centerX - delta, centerZ);
  const yN = getHeightAt(centerX, centerZ + delta);
  const yS = getHeightAt(centerX, centerZ - delta);
  const slope = Math.hypot((yE - yW) / (2 * delta), (yN - yS) / (2 * delta));

  // Reject excessive slope unless it's a watchtower (which can perch on cliffs)
  if (slope > 0.35 && type !== 'WATCHTOWER') {
    return null;
  }

  const yaw = rand() * Math.PI * 2;

  return {
    type,
    x: centerX,
    y: yCenter,
    z: centerZ,
    yaw,
    radius,
    blendSkirt,
  };
}

export function applyPadFlattening(
  worldX: number,
  worldZ: number,
  currentY: number,
  poi: StructurePOI
): number {
  const dist = Math.hypot(worldX - poi.x, worldZ - poi.z);
  const totalRadius = poi.radius + poi.blendSkirt;
  if (dist < totalRadius) {
    const padMask = smoothstep(poi.radius, totalRadius, dist);
    return lerp(poi.y, currentY, padMask);
  }
  return currentY;
}
