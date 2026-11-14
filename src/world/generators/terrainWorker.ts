import { TerrainConfig } from '../config/terrainConfig';
import { createSeededNoise2D } from '../math/prng';
import { evaluateTrails, computeRawTerrainHeight } from '../math/splineCarver';
import { getSlowRoadsPipeline, SerializedRoadNode, syncWorkerRoadNodes } from '../math/slowRoadsCore';
import { evaluateVertexSurface } from '../biomes/biomeEvaluator';
import { evaluateStructureForChunk, applyPadFlattening, StructurePOI } from './structurePlacer';
import { spawnFoliageAndBoulders, TreeColliderData, BoulderColliderData } from './foliageSpawner';

export interface ChunkWorkerInput {
  cx: number;
  cz: number;
  config: TerrainConfig;
  carX?: number;
  carZ?: number;
  roadNodes?: SerializedRoadNode[];
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
    if (!event.data || !event.data.config) return;
    const { cx, cz, config, carX, carZ, roadNodes } = event.data;

    // Synchronize authoritative road nodes if provided by main thread
    if (roadNodes && roadNodes.length > 0) {
      syncWorkerRoadNodes(config.seed, config.roadMode, roadNodes);
    }

    const output = generateChunkData(cx, cz, config, carX, carZ, roadNodes);

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

export function generateChunkData(
  cx: number,
  cz: number,
  config: TerrainConfig,
  carX?: number,
  carZ?: number,
  roadNodes?: SerializedRoadNode[]
): ChunkWorkerOutput {
  const noise2D = createSeededNoise2D(config.seed);
  const N = config.segments;
  const V = N + 1;
  const chunkSize = config.chunkSize;
  const worldChunkCenterX = cx * chunkSize;
  const worldChunkCenterZ = cz * chunkSize;

  // Synchronize dynamic road streaming horizon inside Web Worker thread if roadNodes wasn't passed directly
  if (config.roadMode === 'ENDLESS' && (!roadNodes || roadNodes.length === 0)) {
    const pipeline = getSlowRoadsPipeline(config.seed, config.roadMode);
    if (carX !== undefined && carZ !== undefined) {
      pipeline.ensureRoadHorizon(carX, carZ, 2500);
    }
  }

  // Raw terrain height function without structure flattening
  function computeRaw(wx: number, wz: number): number {
    return computeRawTerrainHeight(wx, wz, noise2D, config);
  }

  // Pre-evaluate structure POI if applicable for this chunk
  const poi = evaluateStructureForChunk(cx, cz, config, computeRaw);

  // Final height function with structure pad flattening
  function computeFinalHeight(wx: number, wz: number): number {
    let y = computeRaw(wx, wz);
    if (poi) {
      y = applyPadFlattening(wx, wz, y, poi);
    }
    return y;
  }

  const skirtDepth = 25.0; // 25-meter vertical perimeter skirts to eliminate terrain seams
  const gridVerts = V * V;
  const skirtVerts = V * 4;
  const totalVerts = gridVerts + skirtVerts;

  const gridTriangles = N * N * 2;
  const skirtTriangles = N * 4 * 2;
  const totalTriangles = gridTriangles + skirtTriangles;

  const rapierHeights = new Float32Array(gridVerts);
  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalTriangles * 3);

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
      // Laplacian curvature: positive = concave dip/valley, negative = convex ridge
      const curvature = (hE + hW + hN + hS) * 0.25 - wy;

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
        config,
        curvature
      );

      colors[pIdx + 0] = surface.r;
      colors[pIdx + 1] = surface.g;
      colors[pIdx + 2] = surface.b;
    }
  }

  // 2. Surface grid triangle indices
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

  // 3. Vertical skirts along all 4 perimeter borders to eliminate LOD seams and sky gaps
  let vIdx = gridVerts;
  const addSkirtEdge = (startGridIdx: number, stride: number, count: number, isReversed: boolean) => {
    const edgeStart = vIdx;
    for (let i = 0; i < count; i++) {
      const surfaceIdx = startGridIdx + i * stride;
      positions[vIdx * 3 + 0] = positions[surfaceIdx * 3 + 0];
      positions[vIdx * 3 + 1] = positions[surfaceIdx * 3 + 1] - skirtDepth;
      positions[vIdx * 3 + 2] = positions[surfaceIdx * 3 + 2];

      normals[vIdx * 3 + 0] = normals[surfaceIdx * 3 + 0];
      normals[vIdx * 3 + 1] = normals[surfaceIdx * 3 + 1];
      normals[vIdx * 3 + 2] = normals[surfaceIdx * 3 + 2];

      colors[vIdx * 3 + 0] = colors[surfaceIdx * 3 + 0];
      colors[vIdx * 3 + 1] = colors[surfaceIdx * 3 + 1];
      colors[vIdx * 3 + 2] = colors[surfaceIdx * 3 + 2];

      vIdx++;
    }

    for (let i = 0; i < count - 1; i++) {
      const topA = startGridIdx + i * stride;
      const topB = startGridIdx + (i + 1) * stride;
      const botA = edgeStart + i;
      const botB = edgeStart + (i + 1);

      if (isReversed) {
        indices[idxOffset++] = topA;
        indices[idxOffset++] = botA;
        indices[idxOffset++] = topB;

        indices[idxOffset++] = topB;
        indices[idxOffset++] = botA;
        indices[idxOffset++] = botB;
      } else {
        indices[idxOffset++] = topA;
        indices[idxOffset++] = topB;
        indices[idxOffset++] = botA;

        indices[idxOffset++] = topB;
        indices[idxOffset++] = botB;
        indices[idxOffset++] = botA;
      }
    }
  };

  // 4 perimeter edges (N, S, W, E)
  addSkirtEdge(0, 1, V, false);
  addSkirtEdge(N * V, 1, V, true);
  addSkirtEdge(0, V, V, true);
  addSkirtEdge(N, V, V, false);

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
