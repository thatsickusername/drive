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

export interface SlowRoadsPipeline {
  heightmap: any;
  blender: any;
  spatialIndex: any;
  roadMeshGen: any;
  surveyor: any;
  roadNodes: any[];
  fineNodes: any[];
  startPose: { x: number; y: number; z: number; heading: number };
  getHeight: (x: number, z: number) => number;
  getNaturalHeight: (x: number, z: number) => number;
  getRoadHit: (x: number, z: number) => any;
  getSpawnPosition: () => { x: number; y: number; z: number; heading: number };
}

const pipelineCache = new Map<string, SlowRoadsPipeline>();

export function getSlowRoadsPipeline(seed: string = '20'): SlowRoadsPipeline {
  if (pipelineCache.has(seed)) {
    return pipelineCache.get(seed)!;
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

  // 2. Call surveyor.update() to autonomously survey winding roads with guaranteed drivability
  const surveySteps = 120;
  for (let i = 0; i < surveySteps; i++) {
    surveyor.update();
  }

  const ms = MidlineState as any;

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

  const pipeline: SlowRoadsPipeline = {
    heightmap,
    blender,
    spatialIndex,
    roadMeshGen,
    surveyor,
    roadNodes,
    fineNodes,
    startPose,
    getHeight,
    getNaturalHeight,
    getRoadHit,
    getSpawnPosition
  };

  pipelineCache.set(seed, pipeline);
  return pipeline;
}

export function getMainTrailCenterZ(x: number, seed: string = '20'): number {
  const pipeline = getSlowRoadsPipeline(seed);
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

