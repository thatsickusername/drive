import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TerrainConfig, DEFAULT_TERRAIN_CONFIG } from '../config/terrainConfig';
import { TerrainChunk } from './TerrainChunk';
import { ChunkWorkerInput, ChunkWorkerOutput, generateChunkData } from '../generators/terrainWorker';
import { createSeededNoise2D } from '../math/prng';
import { getBaseElevation, getTerracedRock, getRidgedNoise, lerp } from '../math/noiseLayers';
import { evaluateTrails, getMainTrailCenterZ } from '../math/splineCarver';
import { getRiverCarveOffset } from '../biomes/biomeEvaluator';
import { evaluateStructureForChunk, applyPadFlattening } from '../generators/structurePlacer';

export class TerrainManager {
  public config: TerrainConfig;
  private scene: THREE.Scene;
  private rapier: typeof RAPIER;
  private world: RAPIER.World;

  public chunks = new Map<string, TerrainChunk>();
  private pendingRequests = new Set<string>();
  private queue: { cx: number; cz: number; distSq: number }[] = [];

  private workerPool: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private activeJobs = new Map<Worker, string>();
  private useWorker = true;

  // Shared assets for chunks to minimize draw call / shader compile stutter
  private sharedMaterials = {
    terrainMaterial: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    }),
    waterMaterial: new THREE.MeshStandardMaterial({
      color: 0x1f3844,
      roughness: 0.15,
      metalness: 0.6,
      transparent: true,
      opacity: 0.82,
    }),
    treeMaterial: new THREE.MeshStandardMaterial({
      color: 0x3d4734,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    }),
    boulderMaterial: new THREE.MeshStandardMaterial({
      color: 0x5a5d60,
      roughness: 0.95,
      metalness: 0.08,
      flatShading: true,
    }),
    treeGeometry: new THREE.ConeGeometry(1.6, 4.0, 6),
    boulderGeometry: new THREE.DodecahedronGeometry(1.0, 1),
  };

  private lastCheckPos = new THREE.Vector2(99999, 99999);
  private initialBootPromise: Promise<TerrainChunk>;
  private resolveInitialBoot!: (chunk: TerrainChunk) => void;
  private chunkWaiters = new Map<string, Array<(chunk: TerrainChunk) => void>>();

  constructor(
    scene: THREE.Scene,
    rapier: typeof RAPIER,
    world: RAPIER.World,
    config: Partial<TerrainConfig> = {}
  ) {
    this.scene = scene;
    this.rapier = rapier;
    this.world = world;
    this.config = { ...DEFAULT_TERRAIN_CONFIG, ...config };

    this.initialBootPromise = new Promise<TerrainChunk>((resolve) => {
      this.resolveInitialBoot = resolve;
    });

    this.initWorkers();
  }

  private initWorkers(): void {
    const poolSize = typeof navigator !== 'undefined' ? Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1)) : 2;

    for (let i = 0; i < poolSize; i++) {
      try {
        const worker = new Worker(
          new URL('../generators/terrainWorker.ts', import.meta.url),
          { type: 'module' }
        );
        worker.onmessage = (e: MessageEvent<ChunkWorkerOutput>) => {
          this.handleWorkerOutput(worker, e.data);
        };
        worker.onerror = (err) => {
          console.warn('[TerrainManager] Worker error, falling back to synchronous generation:', err);
          this.useWorker = false;
        };
        this.workerPool.push(worker);
        this.idleWorkers.push(worker);
      } catch (e) {
        console.warn('[TerrainManager] Web Worker initialization failed, using main thread generation:', e);
        this.useWorker = false;
        break;
      }
    }
  }

  public getInitialChunkReady(): Promise<TerrainChunk> {
    return this.initialBootPromise;
  }

  public waitForChunk(cx: number, cz: number): Promise<TerrainChunk> {
    const key = `${cx},${cz}`;
    const existing = this.chunks.get(key);
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise<TerrainChunk>((resolve) => {
      const list = this.chunkWaiters.get(key) || [];
      list.push(resolve);
      this.chunkWaiters.set(key, list);
    });
  }

  public update(carX: number, carZ: number): void {
    const chunkSize = this.config.chunkSize;
    const currentCx = Math.floor((carX + chunkSize * 0.5) / chunkSize);
    const currentCz = Math.floor((carZ + chunkSize * 0.5) / chunkSize);

    // Only re-evaluate queue if vehicle moved more than 16m
    const distSinceLastCheck = Math.hypot(carX - this.lastCheckPos.x, carZ - this.lastCheckPos.y);
    if (distSinceLastCheck < 16 && this.chunks.size > 0 && this.queue.length === 0) {
      return;
    }
    this.lastCheckPos.set(carX, carZ);

    const radius = this.config.viewRadiusChunks;
    const unloadDist = radius + 1;

    // 1. Unload out-of-range chunks using Chebyshev distance
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = Math.abs(chunk.cx - currentCx);
      const dz = Math.abs(chunk.cz - currentCz);
      if (Math.max(dx, dz) > unloadDist) {
        chunk.dispose(this.scene, this.world);
        this.chunks.delete(key);
      }
    }

    // 2. Queue missing chunks within view radius
    const needed: { cx: number; cz: number; distSq: number }[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const cx = currentCx + dx;
        const cz = currentCz + dz;
        const key = `${cx},${cz}`;

        if (!this.chunks.has(key) && !this.pendingRequests.has(key)) {
          const worldCenterX = cx * chunkSize;
          const worldCenterZ = cz * chunkSize;
          const distSq = (carX - worldCenterX) ** 2 + (carZ - worldCenterZ) ** 2;
          needed.push({ cx, cz, distSq });
        }
      }
    }

    // Sort closest first so the chunk under the vehicle generates immediately
    needed.sort((a, b) => a.distSq - b.distSq);
    this.queue.push(...needed);

    this.processQueue();
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    if (!this.useWorker || this.workerPool.length === 0) {
      // Fallback synchronous processing
      while (this.queue.length > 0) {
        const item = this.queue.shift()!;
        const key = `${item.cx},${item.cz}`;
        if (this.chunks.has(key)) continue;

        const data = generateChunkData(item.cx, item.cz, this.config);
        this.instantiateChunk(data);
      }
      return;
    }

    while (this.idleWorkers.length > 0 && this.queue.length > 0) {
      const item = this.queue.shift()!;
      const key = `${item.cx},${item.cz}`;
      if (this.chunks.has(key) || this.pendingRequests.has(key)) continue;

      const worker = this.idleWorkers.pop()!;
      this.pendingRequests.add(key);
      this.activeJobs.set(worker, key);

      const payload: ChunkWorkerInput = {
        cx: item.cx,
        cz: item.cz,
        config: this.config,
      };
      worker.postMessage(payload);
    }
  }

  private handleWorkerOutput(worker: Worker, data: ChunkWorkerOutput): void {
    const key = `${data.cx},${data.cz}`;
    this.pendingRequests.delete(key);
    this.activeJobs.delete(worker);
    this.idleWorkers.push(worker);

    this.instantiateChunk(data);
    this.processQueue();
  }

  private instantiateChunk(data: ChunkWorkerOutput): void {
    const key = `${data.cx},${data.cz}`;
    if (this.chunks.has(key)) return;

    const chunk = new TerrainChunk(
      data,
      this.config,
      this.scene,
      this.rapier,
      this.world,
      this.sharedMaterials
    );
    this.chunks.set(key, chunk);

    if (data.cx === 0 && data.cz === 0) {
      this.resolveInitialBoot(chunk);
    }

    const waiters = this.chunkWaiters.get(key);
    if (waiters) {
      for (const resolve of waiters) {
        resolve(chunk);
      }
      this.chunkWaiters.delete(key);
    }
  }

  /**
   * Deterministic mathematical height query anywhere in the world
   */
  public getTerrainHeightAt(worldX: number, worldZ: number): number {
    const noise2D = createSeededNoise2D(this.config.seed);
    const computeRaw = (wx: number, wz: number): number => {
      let base = getBaseElevation(wx, wz, noise2D, this.config.maxHeight);

      if (base > 12.0) {
        const ridged = getRidgedNoise(wx, wz, noise2D, 0.005);
        base += ridged * Math.min(22.0, (base - 12.0) * 0.55);
      }

      const terraced = getTerracedRock(base, 4.0, 3.0);
      let h = lerp(base, terraced, 0.4);

      const river = getRiverCarveOffset(wx, wz, noise2D, this.config.riverLevel);
      h += river.offset;

      const trail = evaluateTrails(wx, wz, noise2D, this.config);
      if (trail.trailMask < 0.99) {
        const centerZ = getMainTrailCenterZ(wx, noise2D);
        const trailGradedHeight = getBaseElevation(wx, centerZ, noise2D, this.config.maxHeight) + trail.heightOffset;
        h = lerp(trailGradedHeight - 0.25, h, trail.trailMask);
      }

      return h;
    };

    let y = computeRaw(worldX, worldZ);
    const cx = Math.floor((worldX + this.config.chunkSize * 0.5) / this.config.chunkSize);
    const cz = Math.floor((worldZ + this.config.chunkSize * 0.5) / this.config.chunkSize);
    const poi = evaluateStructureForChunk(cx, cz, this.config, computeRaw);
    if (poi) {
      y = applyPadFlattening(worldX, worldZ, y, poi);
    }

    return y;
  }

  public dispose(): void {
    for (const worker of this.workerPool) {
      worker.terminate();
    }
    this.workerPool.length = 0;
    this.idleWorkers.length = 0;
    this.activeJobs.clear();
    this.queue.length = 0;
    this.pendingRequests.clear();
    this.chunkWaiters.clear();

    for (const chunk of this.chunks.values()) {
      chunk.dispose(this.scene, this.world);
    }
    this.chunks.clear();

    // Dispose shared assets
    this.sharedMaterials.terrainMaterial.dispose();
    this.sharedMaterials.waterMaterial.dispose();
    this.sharedMaterials.treeMaterial.dispose();
    this.sharedMaterials.boulderMaterial.dispose();
    this.sharedMaterials.treeGeometry.dispose();
    this.sharedMaterials.boulderGeometry.dispose();
  }
}
