import { TerrainConfig } from '../config/terrainConfig';
import { createSeededNoise2D } from '../math/prng';
import { getBaseElevation, getTerracedRock, getRidgedNoise, lerp } from '../math/noiseLayers';
import { evaluateTrails, getMainTrailCenterZ } from '../math/splineCarver';
import { getRiverCarveOffset, evaluateVertexSurface } from '../biomes/biomeEvaluator';
import { evaluateStructureForChunk, applyPadFlattening, StructurePOI } from './structurePlacer';
import { spawnFoliageAndBoulders, TreeColliderData, BoulderColliderData } from './foliageSpawner';

export interface ChunkWorkerInput {
  cx: number;
  cz: number;
  config: TerrainConfig;
}

export interface ChunkWorkerOutput {
  cx: number;
  cz: number;
  rapierHeights: Float32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  treeMatrices: Float32Array;
  treeColliders: TreeColliderData[];
  boulderMatrices: Float32Array;
  boulderColliders: BoulderColliderData[];
  structureData: StructurePOI | null;
  hasRiver: boolean;
}

if (typeof self !== 'undefined') {
  self.onmessage = (event: MessageEvent<ChunkWorkerInput>) => {
    const { cx, cz, config } = event.data;
    const output = generateChunkData(cx, cz, config);

    const transferables = [
      output.rapierHeights.buffer,
      output.positions.buffer,
      output.normals.buffer,
      output.colors.buffer,
      output.indices.buffer,
      output.treeMatrices.buffer,
      output.boulderMatrices.buffer,
    ] as unknown as Transferable[];

    (self as any).postMessage(output, transferables);
  };
}

export function generateChunkData(cx: number, cz: number, config: TerrainConfig): ChunkWorkerOutput {
  const noise2D = createSeededNoise2D(config.seed);
  const N = config.segments;
  const V = N + 1;
  const chunkSize = config.chunkSize;
  const worldChunkCenterX = cx * chunkSize;
  const worldChunkCenterZ = cz * chunkSize;

  // Raw terrain height function without structure flattening
  function computeRawTerrainHeight(wx: number, wz: number): number {
    let base = getBaseElevation(wx, wz, noise2D, config.maxHeight);

    if (base > 12.0) {
      const ridged = getRidgedNoise(wx, wz, noise2D, 0.005);
      base += ridged * Math.min(22.0, (base - 12.0) * 0.55);
    }

    const terraced = getTerracedRock(base, 4.0, 3.0);
    let h = lerp(base, terraced, 0.4);

    const river = getRiverCarveOffset(wx, wz, noise2D, config.riverLevel);
    h += river.offset;

    const trail = evaluateTrails(wx, wz, noise2D, config);
    if (trail.trailMask < 0.99) {
      const centerZ = getMainTrailCenterZ(wx, noise2D);
      const trailGradedHeight = getBaseElevation(wx, centerZ, noise2D, config.maxHeight) + trail.heightOffset;
      h = lerp(trailGradedHeight - 0.25, h, trail.trailMask);
    }

    return h;
  }

  // Pre-evaluate structure POI if applicable for this chunk
  const poi = evaluateStructureForChunk(cx, cz, config, computeRawTerrainHeight);

  // Final height function with structure pad flattening
  function computeFinalHeight(wx: number, wz: number): number {
    let y = computeRawTerrainHeight(wx, wz);
    if (poi) {
      y = applyPadFlattening(wx, wz, y, poi);
    }
    return y;
  }

  const numVertices = V * V;
  const rapierHeights = new Float32Array(numVertices);
  const positions = new Float32Array(numVertices * 3);
  const normals = new Float32Array(numVertices * 3);
  const colors = new Float32Array(numVertices * 3);

  let hasRiver = false;

  // Height evaluations across the grid
  for (let r = 0; r <= N; r++) {
    const localX = (r / N - 0.5) * chunkSize;
    const wx = worldChunkCenterX + localX;

    for (let c = 0; c <= N; c++) {
      const localZ = (c / N - 0.5) * chunkSize;
      const wz = worldChunkCenterZ + localZ;

      const wy = computeFinalHeight(wx, wz);
      if (wy <= config.riverLevel + 0.5) {
        hasRiver = true;
      }

      // 1. Rapier heightfield index: r * V + c (rows along X, columns along Z)
      const rapierIndex = r * V + c;
      rapierHeights[rapierIndex] = wy;

      // 2. Three.js position: r * V + c
      const vertIndex = r * V + c;
      const pIdx = vertIndex * 3;
      positions[pIdx + 0] = localX;
      positions[pIdx + 1] = wy;
      positions[pIdx + 2] = localZ;

      // Central difference slope / gradient
      const eps = 1.0;
      const hE = computeFinalHeight(wx + eps, wz);
      const hW = computeFinalHeight(wx - eps, wz);
      const hN = computeFinalHeight(wx, wz + eps);
      const hS = computeFinalHeight(wx, wz - eps);

      const dx = (hE - hW) / (2 * eps);
      const dz = (hN - hS) / (2 * eps);
      const slope = Math.hypot(dx, dz);

      // Normal = normalize(-dx, 1, -dz)
      const len = Math.hypot(-dx, 1.0, -dz);
      normals[pIdx + 0] = -dx / len;
      normals[pIdx + 1] = 1.0 / len;
      normals[pIdx + 2] = -dz / len;

      // Biome vertex colors
      const trail = evaluateTrails(wx, wz, noise2D, config);
      const surface = evaluateVertexSurface(
        wx,
        wy,
        wz,
        slope,
        trail.trailMask,
        trail.challengeNoise,
        trail.isMudPit,
        noise2D,
        config
      );

      colors[pIdx + 0] = surface.r;
      colors[pIdx + 1] = surface.g;
      colors[pIdx + 2] = surface.b;
    }
  }

  // Generate triangle indices
  const numQuads = N * N;
  const indices = new Uint32Array(numQuads * 6);
  let idxOffset = 0;

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const a = r * V + c;
      const b = (r + 1) * V + c;
      const d = r * V + (c + 1);
      const e = (r + 1) * V + (c + 1);

      // Counter-clockwise winding facing +Y
      indices[idxOffset++] = a;
      indices[idxOffset++] = d;
      indices[idxOffset++] = b;

      indices[idxOffset++] = b;
      indices[idxOffset++] = d;
      indices[idxOffset++] = e;
    }
  }

  // Foliage and boulder scatter
  const foliage = spawnFoliageAndBoulders(
    cx,
    cz,
    config,
    computeFinalHeight,
    (wx, wz, _wy) => {
      const eps = 1.0;
      const hE = computeFinalHeight(wx + eps, wz);
      const hW = computeFinalHeight(wx - eps, wz);
      const hN = computeFinalHeight(wx, wz + eps);
      const hS = computeFinalHeight(wx, wz - eps);
      const slope = Math.hypot((hE - hW) / (2 * eps), (hN - hS) / (2 * eps));
      const trail = evaluateTrails(wx, wz, noise2D, config);
      return {
        slope,
        trailMask: trail.trailMask,
        challengeNoise: trail.challengeNoise,
      };
    },
    poi,
    noise2D
  );

  return {
    cx,
    cz,
    rapierHeights,
    positions,
    normals,
    colors,
    indices,
    treeMatrices: foliage.treeMatrices,
    treeColliders: foliage.treeColliders,
    boulderMatrices: foliage.boulderMatrices,
    boulderColliders: foliage.boulderColliders,
    structureData: poi,
    hasRiver,
  };
}
