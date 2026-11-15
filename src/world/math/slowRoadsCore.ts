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
} from '../slowroads/index.js';
import { RoadMode } from '../config/terrainConfig';
import { cyrb128 } from './prng';

export interface SurveyorDebugInfo {
  tailIndex: number;
  tailPos: { x: number; y: number; z: number } | null;
  headIndex: number;
  totalRoadNodes: number;
  totalFineNodes: number;
  vehicleIndex: number;
  lastViolation: string | null;
}

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
  getSurveyorDebugInfo: () => SurveyorDebugInfo;
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
    maxGradLon: 35,
    direction: { x: 1, y: 0, z: 0.2 },
    turnTrackers: [
      { i: 0, m: 15, r: 15, a: 6.0, daThreshold: 6.0 },
      { i: 1, m: 30, r: 10, a: 8.0, daThreshold: 8.0, gThreshold: 45 },
      { i: 2, m: 60, r: 15, a: 12.0, daThreshold: 12.0, gThreshold: 55 },
      { i: 3, m: 120, r: 20, a: 16.0, daThreshold: 16.0 }
    ],
    turnbackLimits: [6.0, 8.0, 12.0, 16.0],
    canEmergencyBridge: true
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
  const maxIters = roadMode === 'FIXED_5KM' ? 1400 : 850;

  // Macro undulating arterial heading: base ~0.2 rad with gentle +/- 0.55 rad meander (wavelength ~1.8km and ~4km)
  // allows the road to traverse mountain saddles, valleys, and switch naturally between left and right mountain flanks
  const [s1] = cyrb128(seed || '20');
  const seedPhase = (s1 % 10000) * 0.01;
  const updateSurveyorTarget = () => {
    const dist = (ms.tail?.i || 0) * 10;
    const wanderAngle = 0.2 + Math.sin(dist * 0.0035 + seedPhase) * 0.55 + Math.sin(dist * 0.001 + seedPhase * 1.7) * 0.25;
    (surveyor as any).targetDir.set(Math.cos(wanderAngle), 0, Math.sin(wanderAngle)).normalize();
  };

  let iters = 0;
  while ((ms.tail?.i || 0) < targetNodes && iters < maxIters) {
    updateSurveyorTarget();
    surveyor.update();
    iters++;
  }

  // Extend fine Catmull-Rom nodes between smoothed anchor nodes
  const maxSmoothIdx = surveyor.smoothWindowHead ? surveyor.smoothWindowHead.i : (ms.tail?.i || 0) - 10;
  while (ms.fineTail && ms.fineTail.next && ms.fineTail.next.next && ms.fineTail.i < maxSmoothIdx) {
    surveyor.extendFine();
  }

  const heightmap = surveyor.heightmap || new LayeredHeightmap(hmConfig);
  const blender = new RoadTerrainBlender(mlConfig);
  const spatialIndex = new MidlineSpatialIndex(100);
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
  let roadHeading = 0;
  if (spawnNode && spawnNode.next) {
    const dx = spawnNode.next.p.x - spawnNode.p.x;
    const dz = spawnNode.next.p.z - spawnNode.p.z;
    roadHeading = Math.atan2(dx, dz);
  } else if (startHead && startHead.next) {
    const dx = startHead.next.p.x - startHead.p.x;
    const dz = startHead.next.p.z - startHead.p.z;
    roadHeading = Math.atan2(dx, dz);
  } else {
    roadHeading = Math.atan2(Math.sin(startHead.a || 0), Math.cos(startHead.a || 0));
  }

  const startPose = {
    x: startHead.p.x,
    y: startHead.p.y,
    z: startHead.p.z,
    heading: roadHeading
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
    const initialTailIndex = ms.tail?.i || 0;
    let stepCount = 0;
    while ((ms.tail?.i || 0) < targetTailIndex && stepCount < 500) {
      updateSurveyorTarget();
      surveyor.update();
      stepCount++;
    }

    const didRetract = (ms.tail?.i || 0) < initialTailIndex;

    // Subdivide new fine Catmull-Rom nodes only up to smoothed anchor nodes
    const maxSmoothIdx = surveyor.smoothWindowHead ? surveyor.smoothWindowHead.i : (ms.tail?.i || 0) - 10;
    while (ms.fineTail && ms.fineTail.next && ms.fineTail.next.next && ms.fineTail.i < maxSmoothIdx) {
      surveyor.extendFine();
    }

    // Update spatial index: if surveyor retracted, completely re-index from ms.head
    // to eliminate stale/retracted nodes from spatial tiles; otherwise append newly surveyed segment.
    if (didRetract || !previousTail || !previousTail.next) {
      spatialIndex.initialise(ms.head);
      spatialIndex.update();
    } else {
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
    ensureRoadHorizon,
    getSurveyorDebugInfo: (): SurveyorDebugInfo => ({
      tailIndex: ms.tail?.i ?? 0,
      tailPos: ms.tail ? { x: ms.tail.p.x, y: ms.tail.p.y, z: ms.tail.p.z } : null,
      headIndex: ms.head?.i ?? 0,
      totalRoadNodes: roadNodes.length,
      totalFineNodes: fineNodes.length,
      vehicleIndex: ms.vehicleIndex ?? 0,
      lastViolation: (surveyor as any).trackerViolation || null
    })
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

export interface SerializedRoadNode {
  i: number;
  p: { x: number; y: number; z: number };
  a: number;
  h: number;
  g: number;
  gfa: number;
  blend: number;
  bridge: boolean;
}

export function serializeRoadNodes(nodes: any[]): SerializedRoadNode[] {
  if (!nodes || nodes.length === 0) return [];
  return nodes.map((n) => ({
    i: n.i,
    p: { x: n.p.x, y: n.p.y, z: n.p.z },
    a: n.a || 0,
    h: n.h || 0,
    g: n.g || 0,
    gfa: n.gfa || 0,
    blend: n.blend !== undefined ? n.blend : 1,
    bridge: !!n.bridge,
  }));
}

export function syncWorkerRoadNodes(
  seed: string = '20',
  roadMode: RoadMode = 'ENDLESS',
  serialized: SerializedRoadNode[]
): void {
  if (!serialized || serialized.length === 0) return;
  const pipeline = getSlowRoadsPipeline(seed, roadMode);

  // Reconstruct contiguous linked list for spatial index
  const nodes = serialized.map((s) => ({
    ...s,
    next: null as any,
    prev: null as any,
  }));

  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].next = nodes[i + 1];
    nodes[i + 1].prev = nodes[i];
  }

  pipeline.spatialIndex.initialise(nodes[0]);
  pipeline.spatialIndex.update();

  pipeline.roadNodes.length = 0;
  for (const n of nodes) {
    pipeline.roadNodes.push(n);
  }
}

