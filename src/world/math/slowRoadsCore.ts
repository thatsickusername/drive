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

export function clearSlowRoadsCache(): void {
  pipelineCache.clear();
}

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

  // 2. Initial Survey:
  // Option A (ENDLESS) surveys 300 nodes (~3.0km: 800m behind spawn + 2.2km ahead)
  // Option B (FIXED_5KM) surveys 580 nodes (~5.8km: 800m behind spawn + 5.0km ahead)
  const SPAWN_NODE_INDEX = 80;
  const targetNodes = roadMode === 'FIXED_5KM' ? 580 : 300;
  const maxIters = roadMode === 'FIXED_5KM' ? 1400 : 650;
  let iters = 0;
  while ((ms.tail?.i || 0) < targetNodes && iters < maxIters) {
    surveyor.update();
    iters++;
  }

  // Extend fine Catmull-Rom nodes between anchor nodes
  while (ms.fineTail && ms.fineTail.next && ms.fineTail.next.next) {
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
    fineCurr = fineCurr.nextFine;
  }

  // Establish spawn pose on surveyed road with seamless immersion (road behind & ahead)
  let spawnNode = roadNodes.find((n: any) => n.i === SPAWN_NODE_INDEX);
  if (!spawnNode && roadNodes.length > 0) {
    const fallbackIdx = Math.min(SPAWN_NODE_INDEX, roadNodes.length - 1);
    spawnNode = roadNodes[fallbackIdx];
  }
  const startHead = spawnNode || ms.head || { p: new Vector3(0, 70, 0), a: 0 };
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
  const ensureRoadHorizon = (carX: number, carZ: number, horizonMeters: number = 2500): void => {
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

    // Keep vehicleIndex safely bounded so complex turnback reverts never trigger false restartGeneration
    ms.vehicleIndex = Math.min(closestNode.i, Math.max(0, (ms.tail?.i || 0) - 50));
    ms.vehicleNode = closestNode;

    const targetTailIndex = closestNode.i + Math.ceil(horizonMeters / 10);
    if ((ms.tail?.i || 0) >= targetTailIndex) {
      return;
    }

    const previousTail = ms.tail;
    let stepCount = 0;
    while ((ms.tail?.i || 0) < targetTailIndex && stepCount < 300) {
      surveyor.update();
      stepCount++;
    }

    // Subdivide new fine Catmull-Rom nodes
    while (ms.fineTail && ms.fineTail.next && ms.fineTail.next.next) {
      surveyor.extendFine();
    }

    // Update spatial index with newly added lookahead segment
    if (previousTail && previousTail.next) {
      spatialIndex.lookaheadNode = previousTail.next;
      spatialIndex.update();
    }

    // Re-synchronize authoritative roadNodes list from head to tail
    roadNodes.length = 0;
    let n = ms.head;
    while (n) {
      roadNodes.push(n);
      if (n === ms.tail) break;
      n = n.next;
    }

    // Re-synchronize authoritative fineNodes list from head to fineTail
    fineNodes.length = 0;
    let fn = ms.head;
    while (fn) {
      fineNodes.push(fn);
      fn = fn.nextFine;
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
