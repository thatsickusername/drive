import { NoiseFunction2D } from 'simplex-noise';
import { cyrb128, mulberry32 } from '../math/prng';
import { TerrainConfig } from '../config/terrainConfig';
import { StructurePOI } from './structurePlacer';

export interface TreeColliderData {
  x: number;
  y: number;
  z: number;
  radius: number;
  halfHeight: number;
  isWinchAnchor: boolean;
}

export interface BoulderColliderData {
  x: number;
  y: number;
  z: number;
  hx: number;
  hy: number;
  hz: number;
  rx: number;
  ry: number;
  rz: number;
}

export interface FoliageSpawnResult {
  treeMatrices: Float32Array;
  treeColliders: TreeColliderData[];
  boulderMatrices: Float32Array;
  boulderColliders: BoulderColliderData[];
}

function composeMatrix4(
  out: Float32Array,
  offset: number,
  tx: number, ty: number, tz: number,
  rx: number, ry: number, rz: number,
  sx: number, sy: number, sz: number
): void {
  // Euler YXZ rotation to matrix column-major
  const cx = Math.cos(rx), sx_sin = Math.sin(rx);
  const cy = Math.cos(ry), sy_sin = Math.sin(ry);
  const cz = Math.cos(rz), sz_sin = Math.sin(rz);

  // Column 0
  out[offset + 0] = (cy * cz + sy_sin * sx_sin * sz_sin) * sx;
  out[offset + 1] = (cx * sz_sin) * sx;
  out[offset + 2] = (-sy_sin * cz + cy * sx_sin * sz_sin) * sx;
  out[offset + 3] = 0;

  // Column 1
  out[offset + 4] = (-cy * sz_sin + sy_sin * sx_sin * cz) * sy;
  out[offset + 5] = (cx * cz) * sy;
  out[offset + 6] = (sy_sin * sz_sin + cy * sx_sin * cz) * sy;
  out[offset + 7] = 0;

  // Column 2
  out[offset + 8] = (sy_sin * cx) * sz;
  out[offset + 9] = (-sx_sin) * sz;
  out[offset + 10] = (cy * cx) * sz;
  out[offset + 11] = 0;

  // Column 3
  out[offset + 12] = tx;
  out[offset + 13] = ty;
  out[offset + 14] = tz;
  out[offset + 15] = 1;
}

export function spawnFoliageAndBoulders(
  cx: number,
  cz: number,
  config: TerrainConfig,
  getHeightAt: (wx: number, wz: number) => number,
  getSurfaceProps: (wx: number, wz: number, y: number) => { slope: number; trailMask: number; challengeNoise: number },
  poi: StructurePOI | null,
  noise2D: NoiseFunction2D
): FoliageSpawnResult {
  const [s1] = cyrb128(config.seed + '_foliage');
  const chunkSeed = ((s1 ^ (cx * 16807) ^ (cz * 48271)) >>> 0);
  const rand = mulberry32(chunkSeed);

  const step = 6.0;
  const halfChunk = config.chunkSize * 0.5;
  const startX = cx * config.chunkSize - halfChunk;
  const startZ = cz * config.chunkSize - halfChunk;

  const treeList: { x: number; y: number; z: number; scale: number; yaw: number; isWinch: boolean }[] = [];
  const boulderList: { x: number; y: number; z: number; sx: number; sy: number; sz: number; rx: number; ry: number; rz: number }[] = [];

  for (let x = 3.0; x < config.chunkSize; x += step) {
    for (let z = 3.0; z < config.chunkSize; z += step) {
      // Jitter
      const jx = (rand() - 0.5) * (step * 0.85);
      const jz = (rand() - 0.5) * (step * 0.85);
      const wx = startX + x + jx;
      const wz = startZ + z + jz;
      const wy = getHeightAt(wx, wz);

      const props = getSurfaceProps(wx, wz, wy);

      // Pad clearance check
      let distToPad = 999;
      if (poi) {
        distToPad = Math.hypot(wx - poi.x, wz - poi.z);
      }

      // 1. Boulder check (Challenge zones, cliff transitions)
      const canSpawnBoulder =
        distToPad > (poi ? poi.radius + 2 : 0) &&
        wy > config.riverLevel + 1.0 &&
        ((props.challengeNoise > 0.55 && props.trailMask < 0.6) || (props.slope > 0.38 && props.slope < 0.58 && rand() < 0.12));

      if (canSpawnBoulder && boulderList.length < 32) {
        const bScale = 0.6 + rand() * 0.9;
        const bSx = bScale * (0.8 + rand() * 0.4);
        const bSy = bScale * (0.5 + rand() * 0.4);
        const bSz = bScale * (0.8 + rand() * 0.4);
        const rx = (rand() - 0.5) * 0.3;
        const ry = rand() * Math.PI * 2;
        const rz = (rand() - 0.5) * 0.3;
        // Embed slightly into ground
        boulderList.push({
          x: wx,
          y: wy + bSy * 0.35,
          z: wz,
          sx: bSx,
          sy: bSy,
          sz: bSz,
          rx,
          ry,
          rz,
        });
        continue;
      }

      // 2. Tree spawn check
      const canSpawnTree =
        props.trailMask > 0.85 &&
        distToPad > (poi ? poi.radius + 4 : 0) &&
        props.slope < 0.48 &&
        wy > config.riverLevel + 1.5 &&
        wy < 46.0;

      if (canSpawnTree) {
        // Density modulation using noise
        const densityNoise = noise2D(wx * 0.02, wz * 0.02);
        if (densityNoise > -0.1 && rand() < 0.42 && treeList.length < 48) {
          const tScale = 0.75 + rand() * 0.5;
          const yaw = rand() * Math.PI * 2;
          const isWinch = props.trailMask < 0.95; // Close to trail edge
          treeList.push({
            x: wx,
            y: wy,
            z: wz,
            scale: tScale,
            yaw,
            isWinch,
          });
        }
      }
    }
  }

  // Build matrix Float32Arrays and colliders
  const treeMatrices = new Float32Array(treeList.length * 16);
  const treeColliders: TreeColliderData[] = [];
  for (let i = 0; i < treeList.length; i++) {
    const t = treeList[i];
    composeMatrix4(treeMatrices, i * 16, t.x, t.y, t.z, 0, t.yaw, 0, t.scale, t.scale, t.scale);
    treeColliders.push({
      x: t.x,
      y: t.y + 2.5 * t.scale,
      z: t.z,
      radius: 0.35 * t.scale,
      halfHeight: 2.5 * t.scale,
      isWinchAnchor: t.isWinch,
    });
  }

  const boulderMatrices = new Float32Array(boulderList.length * 16);
  const boulderColliders: BoulderColliderData[] = [];
  for (let i = 0; i < boulderList.length; i++) {
    const b = boulderList[i];
    composeMatrix4(boulderMatrices, i * 16, b.x, b.y, b.z, b.rx, b.ry, b.rz, b.sx, b.sy, b.sz);
    boulderColliders.push({
      x: b.x,
      y: b.y,
      z: b.z,
      hx: b.sx * 0.8,
      hy: b.sy * 0.6,
      hz: b.sz * 0.8,
      rx: b.rx,
      ry: b.ry,
      rz: b.rz,
    });
  }

  return {
    treeMatrices,
    treeColliders,
    boulderMatrices,
    boulderColliders,
  };
}
