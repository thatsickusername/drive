// Slow Roads procedural terrain generation core wrapper
// Directly imports and integrates HillsMidlineGenerator, LayeredHeightmap, RoadTerrainBlender,
// MidlineSpatialIndex, and RoadMeshGenerator from slow_roads_extracted_core

import {
  LayeredHeightmap,
  HillsMidlineGenerator,
  MidlineState,
  MidlineSpatialIndex,
  RoadTerrainBlender,
  RoadMeshGenerator,
  BiomePresets,
  Vector3
} from '../../../slow_roads_extracted_core/src/index.js';
import { RoadMode } from '../config/terrainConfig';

export interface SlowRoadsPipeline {
  heightmap: any;
  blender: any;
  spatialIndex: any;
  roadMeshGen: any;
  surveyor: any;
  roadNodes: any[];
  fineNodes: any[];
  roadMode: RoadMode;
  startPose: { x: number; y: number; z: number; heading: number };
  getHeight: (x: number, z: number) => number;
  getNaturalHeight: (x: number, z: number) => number;
  getRoadHit: (x: number, z: number) => any;
  getSpawnPosition: () => { x: number; y: number; z: number; heading: number };
  ensureRoadHorizon: (carX: number, carZ: number, horizonMeters?: number) => void;
}

const pipelineCache = new Map<string, SlowRoadsPipeline>();

export function getSlowRoadsPipeline(
  seed: string = '20',
  roadMode: RoadMode = 'ENDLESS'
): SlowRoadsPipeline {
  const cacheKey = `${seed}_${roadMode}`;
  if (pipelineCache.has(cacheKey)) {
    return pipelineCache.get(cacheKey)!;
  }

  const preset = BiomePresets.Hills;
  const hmConfig = {
    ...preset.heightmap,
    seed: seed || '20'
  };

  const mlConfig = {
    ...preset.midline,
    seed: seed || '20',
    maxStartElev: 500,
    maxGradLon: 25,
    direction: { x: 1, y: 0, z: 0.2 }
  };

  const heightmapState = { set: () => {} };

  // 1. Instantiate HillsMidlineGenerator with heightmap and surveyor config
  const surveyor = new HillsMidlineGenerator(
    mlConfig,
    hmConfig,
    LayeredHeightmap,
    heightmapState
  );

  // Initialize surveyor at start node 0
  surveyor.initialise(seed || '20', 0);

  const ms = MidlineState as any;

  // 2. Initial Survey: Option A (ENDLESS) starts with 150 nodes (~1.5km), Option B (FIXED_5KM) surveys 500 nodes (5km)
  const targetNodes = roadMode === 'FIXED_5KM' ? 500 : 150;
  const maxIters = roadMode === 'FIXED_5KM' ? 1200 : 250;
  let iters = 0;
  while ((ms.tail?.i || 0) < targetNodes && iters < maxIters) {
    surveyor.update();
    iters++;
  }

  // Extend fine Catmull-Rom nodes between anchor nodes
  while (
    ms.fineTail &&
    ms.fineTail.next &&
    ms.fineTail.i < (ms.tail?.i || 0) - 5
  ) {
    surveyor.extendFine();
  }

  const heightmap = surveyor.heightmap || new LayeredHeightmap(hmConfig);
  const blender = new RoadTerrainBlender(mlConfig);
  const spatialIndex = new MidlineSpatialIndex(400);
  const roadMeshGen = new RoadMeshGenerator(mlConfig);

  // 3. Use MidlineSpatialIndex to index surveyed road nodes
  if (ms.head) {
    spatialIndex.initialise(ms.head);
    spatialIndex.update();
  }

  // Gather anchor nodes
  const roadNodes: any[] = [];
  let curr = ms.head;
  while (curr) {
    roadNodes.push(curr);
    curr = curr.next;
  }

  // Gather fine nodes
  const fineNodes: any[] = [];
  let fineCurr = ms.head;
  while (fineCurr) {
    fineNodes.push(fineCurr);
    fineCurr = fineCurr.nextFine || fineCurr.next;
  }

  const startHead = ms.head || { p: new Vector3(0, 70, 0), a: 0 };
  const startPose = {
    x: startHead.p.x,
    y: startHead.p.y,
    z: startHead.p.z,
    heading: startHead.a || 0
  };

  const getNaturalHeight = (x: number, z: number): number => {
    return heightmap.getXZ(x, z);
  };

  const getRoadHit = (x: number, z: number): any => {
    return spatialIndex.getClosestNode(x, z, 50);
  };

  // 4. Use RoadTerrainBlender to carve the terrain around the surveyed road
  const getHeight = (x: number, z: number): number => {
    const nh = heightmap.getXZ(x, z);
    const hit = spatialIndex.getClosestNode(x, z, 50);
    return hit ? blender.getBlendedHeight(nh, hit, x, z) : nh;
  };

  const getSpawnPosition = () => {
    const groundY = getHeight(startPose.x, startPose.z);
    return {
      x: startPose.x,
      y: groundY + 0.85,
      z: startPose.z,
      heading: startPose.heading
    };
  };

  // Option A (ENDLESS): Dynamically stream road nodes ahead of vehicle
  const ensureRoadHorizon = (carX: number, carZ: number, horizonMeters: number = 2000): void => {
    if (roadMode !== 'ENDLESS') return;
    if (roadNodes.length === 0) return;

    // Locate closest surveyed road node to player vehicle
    let closestNode = roadNodes[0];
    let minDSq = (closestNode.p.x - carX) ** 2 + (closestNode.p.z - carZ) ** 2;
    for (let i = 1; i < roadNodes.length; i++) {
      const dSq = (roadNodes[i].p.x - carX) ** 2 + (roadNodes[i].p.z - carZ) ** 2;
      if (dSq < minDSq) {
        minDSq = dSq;
        closestNode = roadNodes[i];
      }
    }

    ms.vehicleIndex = closestNode.i;
    ms.vehicleNode = closestNode;

    const targetTailIndex = closestNode.i + Math.ceil(horizonMeters / 10);
    if ((ms.tail?.i || 0) >= targetTailIndex) {
      return;
    }

    const previousTail = ms.tail;
    let stepCount = 0;
    while ((ms.tail?.i || 0) < targetTailIndex && stepCount < 50) {
      surveyor.update();
      stepCount++;
    }

    // Subdivide new fine Catmull-Rom nodes
    while (
      ms.fineTail &&
      ms.fineTail.next &&
      ms.fineTail.i < (ms.tail?.i || 0) - 5
    ) {
      surveyor.extendFine();
    }

    // Update spatial index with newly added lookahead segment
    if (previousTail && previousTail.next) {
      spatialIndex.lookaheadNode = previousTail.next;
      spatialIndex.update();
    }

    // Append newly surveyed anchor nodes to cache
    let n = previousTail ? previousTail.next : null;
    while (n) {
      if (!roadNodes.includes(n)) {
        roadNodes.push(n);
      }
      n = n.next;
    }

    // Append newly subdivided fine nodes to cache
    let fn = fineNodes.length > 0 ? (fineNodes[fineNodes.length - 1].nextFine || fineNodes[fineNodes.length - 1].next) : ms.head;
    while (fn) {
      if (!fineNodes.includes(fn)) {
        fineNodes.push(fn);
      }
      fn = fn.nextFine || fn.next;
    }
  };

  const pipeline: SlowRoadsPipeline = {
    heightmap,
    blender,
    spatialIndex,
    roadMeshGen,
    surveyor,
    roadNodes,
    fineNodes,
    roadMode,
    startPose,
    getHeight,
    getNaturalHeight,
    getRoadHit,
    getSpawnPosition,
    ensureRoadHorizon
  };

  pipelineCache.set(cacheKey, pipeline);
  return pipeline;
}

export function getMainTrailCenterZ(
  x: number,
  seed: string = '20',
  roadMode: RoadMode = 'ENDLESS'
): number {
  const pipeline = getSlowRoadsPipeline(seed, roadMode);
  if (pipeline.roadNodes.length === 0) return pipeline.startPose.z;

  let closestNode = pipeline.roadNodes[0];
  let minDiff = Math.abs(closestNode.p.x - x);
  for (let i = 1; i < pipeline.roadNodes.length; i++) {
    const diff = Math.abs(pipeline.roadNodes[i].p.x - x);
    if (diff < minDiff) {
      minDiff = diff;
      closestNode = pipeline.roadNodes[i];
    }
  }
  return closestNode.p.z;
}

export const getRoadCenterZ = getMainTrailCenterZ;
