import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AlpineHeightfield } from './alpineHeightfield';
import { createSnowMaterial } from './shaders/SnowMaterial';
import { createSnowDetailTexture, createSnowDetailTextureFromData, disposeSnowDetailTexture } from './shaders/DetailTexture';
import { buildMassifRawData, MASSIF_CHUNK_SIZE, MASSIF_SEGMENTS, RawChunkData, RawLodGeometryData, RawPineChunkData } from './massifBuilder';
import type { MassifWorkerRequest, MassifWorkerResponse } from './massifWorker';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface AlpineMassifAsyncOptions {
  detailSize?: number;
  anisotropy?: number;
  spawnX?: number;
  spawnZ?: number;
  onProgress?: (label: string, progress01: number) => void;
}

function yieldToNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export class AlpineMassif {
  public group: THREE.Group;
  public heightfield: AlpineHeightfield;
  private chunkLODs: THREE.LOD[] = [];
  private rigidBodies: RAPIER.RigidBody[] = [];
  private colliders: RAPIER.Collider[] = [];
  private treeMeshes: THREE.InstancedMesh[] = [];
  private treeLodGroups: { high: THREE.InstancedMesh; low: THREE.InstancedMesh; center: THREE.Vector3 }[] = [];
  private treeFoliageGeom: THREE.BufferGeometry | null = null;
  private treeLowGeom: THREE.BufferGeometry | null = null;
  private treeMaterial: THREE.MeshStandardMaterial | null = null;
  private iceMesh: THREE.Mesh | null = null;

  // Fixed 6x6 Grid of 400m chunks (2,400m x 2,400m total span)
  public readonly chunkSize = MASSIF_CHUNK_SIZE;
  public readonly segments = MASSIF_SEGMENTS; // ~4.0m vertex spacing
  public readonly chunksAcross = 6;

  private terrainMaterial: THREE.MeshStandardMaterial;
  public readonly sunDir = new THREE.Vector3(140, 110, -50).normalize();
  public mainThreadBuildMs: number = 0;

  constructor(
    private scene: THREE.Scene,
    private rapier: typeof RAPIER,
    private world: RAPIER.World,
    deferBuild: boolean = false,
    detailTexture?: THREE.DataTexture,
    detailSize: number = 1024,
    anisotropy: number = 4
  ) {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.heightfield = new AlpineHeightfield();

    this.terrainMaterial = createSnowMaterial({
      sunDir: this.sunDir,
      sunColor: new THREE.Color(0xfff6ec),
      shadowColor: new THREE.Color(0x9ca9cb),
      detailTexture,
      detailSize,
      anisotropy
    });

    if (!deferBuild) {
      const t0 = performance.now();
      const raw = buildMassifRawData({ x: this.sunDir.x, y: this.sunDir.y, z: this.sunDir.z });
      this.assembleChunksSync(raw.chunks);
      this.createFrozenRiverPlane();
      this.assemblePines(raw.pineChunks);
      this.mainThreadBuildMs = performance.now() - t0;
    }
  }

  public static async createAsync(
    scene: THREE.Scene,
    rapier: typeof RAPIER,
    world: RAPIER.World,
    options: AlpineMassifAsyncOptions = {}
  ): Promise<AlpineMassif> {
    const detailSize = options.detailSize ?? 1024;
    const anisotropy = options.anisotropy ?? 4;
    const sunDir = new THREE.Vector3(140, 110, -50).normalize();

    options.onProgress?.('Synthesizing terrain & snow microfacets...', 0.25);
    const workerPayload = await AlpineMassif.runMassifWorker(detailSize, {
      x: sunDir.x,
      y: sunDir.y,
      z: sunDir.z
    });

    const mainStart = performance.now();
    const detailTex = createSnowDetailTextureFromData(
      workerPayload.detailData,
      workerPayload.detailSize,
      anisotropy
    );
    const massif = new AlpineMassif(scene, rapier, world, true, detailTex, detailSize, anisotropy);
    let mainThreadAccumMs = performance.now() - mainStart;

    // Sort chunks so the spawn chunk is mounted first
    const spawnX = options.spawnX ?? -300;
    const spawnZ = options.spawnZ ?? -750;
    const chunks = [...workerPayload.massif.chunks].sort((a, b) => {
      const da = Math.hypot(a.worldChunkCenterX - spawnX, a.worldChunkCenterZ - spawnZ);
      const db = Math.hypot(b.worldChunkCenterX - spawnX, b.worldChunkCenterZ - spawnZ);
      return da - db;
    });

    // Assemble chunks & Rapier colliders in small batches so main thread stays responsive
    const batchSize = 6;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchStart = performance.now();
      const end = Math.min(i + batchSize, chunks.length);
      for (let j = i; j < end; j++) {
        massif.mountChunk(chunks[j]);
      }
      if (i === 0) {
        massif.createFrozenRiverPlane();
      }
      mainThreadAccumMs += performance.now() - batchStart;

      const frac = 0.45 + 0.35 * (end / chunks.length);
      options.onProgress?.(`Uploading terrain chunks (${end}/${chunks.length})...`, frac);
      if (end < chunks.length) {
        await yieldToNextFrame();
      }
    }

    const pineStart = performance.now();
    massif.assemblePines(workerPayload.massif.pineChunks);
    mainThreadAccumMs += performance.now() - pineStart;

    massif.mainThreadBuildMs = mainThreadAccumMs;
    return massif;
  }

  private static runMassifWorker(
    detailSize: number,
    sunDir: { x: number; y: number; z: number }
  ): Promise<MassifWorkerResponse> {
    if (typeof Worker === 'undefined') {
      const detailData = createSnowDetailTexture(4, detailSize).image.data as Uint8Array<ArrayBuffer>;
      return Promise.resolve({
        detailSize,
        detailData,
        massif: buildMassifRawData(sunDir)
      });
    }

    return new Promise((resolve) => {
      try {
        const worker = new Worker(new URL('./massifWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event: MessageEvent<MassifWorkerResponse>) => {
          worker.terminate();
          resolve(event.data);
        };
        worker.onerror = () => {
          worker.terminate();
          const detailTex = createSnowDetailTexture(4, detailSize);
          resolve({
            detailSize,
            detailData: detailTex.image.data as Uint8Array<ArrayBuffer>,
            massif: buildMassifRawData(sunDir)
          });
        };
        const req: MassifWorkerRequest = { detailSize, sunDir };
        worker.postMessage(req);
      } catch {
        const detailTex = createSnowDetailTexture(4, detailSize);
        resolve({
          detailSize,
          detailData: detailTex.image.data as Uint8Array<ArrayBuffer>,
          massif: buildMassifRawData(sunDir)
        });
      }
    });
  }

  private createGeometryFromRaw(raw: RawLodGeometryData): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(raw.positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(raw.normals, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(raw.colors, 3, true));
    geom.setIndex(new THREE.BufferAttribute(raw.indices, 1));
    geom.computeBoundingBox();
    geom.computeBoundingSphere();
    return geom;
  }

  private mountChunk(chunk: RawChunkData): void {
    const lod = new THREE.LOD();
    lod.autoUpdate = false;
    lod.position.set(chunk.worldChunkCenterX, chunk.centerSurfaceY, chunk.worldChunkCenterZ);
    lod.matrixAutoUpdate = false;
    lod.updateMatrix();

    const makeChunkMesh = (raw: RawLodGeometryData): THREE.Mesh => {
      const m = new THREE.Mesh(this.createGeometryFromRaw(raw), this.terrainMaterial);
      m.position.set(0, -chunk.centerSurfaceY, 0);
      m.receiveShadow = true;
      m.castShadow = false;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      return m;
    };

    lod.addLevel(makeChunkMesh(chunk.lod0), 0);
    lod.addLevel(makeChunkMesh(chunk.lod1), 480);
    lod.addLevel(makeChunkMesh(chunk.lod2), 950);

    this.group.add(lod);
    this.chunkLODs.push(lod);

    const scale = new this.rapier.Vector3(this.chunkSize, 1.0, this.chunkSize);
    const bodyDesc = this.rapier.RigidBodyDesc.fixed().setTranslation(chunk.worldChunkCenterX, 0, chunk.worldChunkCenterZ);
    const rigidBody = this.world.createRigidBody(bodyDesc);

    const heightfieldDesc = this.rapier.ColliderDesc.heightfield(
      this.segments,
      this.segments,
      chunk.rapierHeights,
      scale
    )
      .setFriction(0.02)
      .setRestitution(0.0);

    const collider = this.world.createCollider(heightfieldDesc, rigidBody);
    this.rigidBodies.push(rigidBody);
    this.colliders.push(collider);
  }

  private assembleChunksSync(chunks: RawChunkData[]): void {
    for (let i = 0; i < chunks.length; i++) {
      this.mountChunk(chunks[i]);
    }
  }

  // Flat Frozen River / Ice Mesh across the bottom basin (z in [800, 1220]) at y = 0
  private createFrozenRiverPlane(): void {
    const iceGeom = new THREE.PlaneGeometry(2400, 420);
    iceGeom.rotateX(-Math.PI / 2);
    iceGeom.computeBoundingBox();
    iceGeom.computeBoundingSphere();

    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x7da3b8,
      roughness: 0.12,
      metalness: 0.18,
      side: THREE.FrontSide
    });
    this.iceMesh = new THREE.Mesh(iceGeom, iceMat);
    this.iceMesh.position.set(0, 0, 1010);
    this.iceMesh.receiveShadow = true;
    this.iceMesh.castShadow = false;
    this.iceMesh.matrixAutoUpdate = false;
    this.iceMesh.updateMatrix();
    this.group.add(this.iceMesh);
  }

  private createSnowyPineGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, 4.0, 6);
    trunkGeom.translate(0, 2.0, 0);
    const trunkCount = trunkGeom.attributes.position.count;
    const trunkColors = new Float32Array(trunkCount * 3);
    for (let i = 0; i < trunkCount; i++) {
      trunkColors[i * 3 + 0] = 0.22;
      trunkColors[i * 3 + 1] = 0.16;
      trunkColors[i * 3 + 2] = 0.12;
    }
    trunkGeom.setAttribute('color', new THREE.BufferAttribute(trunkColors, 3));
    parts.push(trunkGeom);

    // 3 tiered stylized foliage cones with thick white snow caps
    const tiers = [
      { radius: 4.5, height: 7.2, y: 5.8 },
      { radius: 3.5, height: 6.2, y: 9.6 },
      { radius: 2.3, height: 5.2, y: 13.5 }
    ];

    for (const tier of tiers) {
      const coneGeom = new THREE.ConeGeometry(tier.radius, tier.height, 6, 2);
      coneGeom.translate(0, tier.y, 0);
      const pos = coneGeom.attributes.position;
      const count = pos.count;
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const py = pos.getY(i);
        // Upper 62% of each cone tier is covered in thick snow
        if (py > tier.y - tier.height * 0.12) {
          colors[i * 3 + 0] = 0.98;
          colors[i * 3 + 1] = 0.98;
          colors[i * 3 + 2] = 1.0;
        } else {
          // Dark alpine evergreen needles underneath
          colors[i * 3 + 0] = 0.10;
          colors[i * 3 + 1] = 0.19;
          colors[i * 3 + 2] = 0.14;
        }
      }

      coneGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      parts.push(coneGeom);
    }

    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    const finalGeom = merged || new THREE.ConeGeometry(3.8, 16.0, 6);
    finalGeom.computeBoundingBox();
    finalGeom.computeBoundingSphere();
    return finalGeom;
  }

  private createSnowyPineLowGeometry(): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];

    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.65, 4.0, 5);
    trunkGeom.translate(0, 2.0, 0);
    const trunkCount = trunkGeom.attributes.position.count;
    const trunkColors = new Float32Array(trunkCount * 3);
    for (let i = 0; i < trunkCount; i++) {
      trunkColors[i * 3 + 0] = 0.22;
      trunkColors[i * 3 + 1] = 0.16;
      trunkColors[i * 3 + 2] = 0.12;
    }
    trunkGeom.setAttribute('color', new THREE.BufferAttribute(trunkColors, 3));
    parts.push(trunkGeom);

    const coneGeom = new THREE.ConeGeometry(4.5, 14.2, 5, 2);
    coneGeom.translate(0, 9.5, 0);
    const pos = coneGeom.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const py = pos.getY(i);
      if (py > 9.5 - 14.2 * 0.12) {
        colors[i * 3 + 0] = 0.98;
        colors[i * 3 + 1] = 0.98;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3 + 0] = 0.10;
        colors[i * 3 + 1] = 0.19;
        colors[i * 3 + 2] = 0.14;
      }
    }
    coneGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    parts.push(coneGeom);

    const merged = mergeGeometries(parts, false);
    for (const p of parts) p.dispose();
    const finalGeom = merged || new THREE.ConeGeometry(4.2, 16.0, 5);
    finalGeom.computeBoundingBox();
    finalGeom.computeBoundingSphere();
    return finalGeom;
  }

  // Assemble spatially partitioned InstancedMeshes from worker/builder matrices
  private assemblePines(pineChunks: RawPineChunkData[]): void {
    this.treeFoliageGeom = this.createSnowyPineGeometry();
    this.treeLowGeom = this.createSnowyPineLowGeometry();

    this.treeMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.03
    });

    for (let c = 0; c < pineChunks.length; c++) {
      const chunk = pineChunks[c];
      if (chunk.count === 0) continue;

      const instancedMesh = new THREE.InstancedMesh(this.treeFoliageGeom, this.treeMaterial, chunk.count);
      (instancedMesh.instanceMatrix.array as Float32Array).set(chunk.matrices);

      // Invariant 4: instanceMatrix.needsUpdate set once at boot, never per frame
      instancedMesh.instanceMatrix.needsUpdate = true;
      instancedMesh.matrixAutoUpdate = false;
      instancedMesh.updateMatrix();
      instancedMesh.computeBoundingSphere();
      instancedMesh.computeBoundingBox();

      // Shadow discipline: only chunks in active mountain terrain cast shadows, distant river bed skipped
      instancedMesh.castShadow = (chunk.cz <= 0);
      instancedMesh.receiveShadow = true;

      // Low-poly distant pine LOD sharing the exact same instanceMatrix buffer
      const lowMesh = new THREE.InstancedMesh(this.treeLowGeom, this.treeMaterial, chunk.count);
      lowMesh.instanceMatrix = instancedMesh.instanceMatrix;
      lowMesh.matrixAutoUpdate = false;
      lowMesh.updateMatrix();
      if (instancedMesh.boundingSphere) lowMesh.boundingSphere = instancedMesh.boundingSphere.clone();
      if (instancedMesh.boundingBox) lowMesh.boundingBox = instancedMesh.boundingBox.clone();
      lowMesh.castShadow = false;
      lowMesh.receiveShadow = false;
      lowMesh.visible = false;

      const center = instancedMesh.boundingSphere
        ? instancedMesh.boundingSphere.center.clone()
        : new THREE.Vector3();

      this.group.add(instancedMesh);
      this.group.add(lowMesh);
      this.treeMeshes.push(instancedMesh, lowMesh);
      this.treeLodGroups.push({ high: instancedMesh, low: lowMesh, center });
    }
  }

  public setDetailQuality(size: number, anisotropy: number): void {
    const tex = createSnowDetailTexture(anisotropy, size);
    if (this.terrainMaterial?.userData?.setDetailTexture) {
      this.terrainMaterial.userData.setDetailTexture(tex);
    }
  }

  public updateLOD(camera: THREE.Camera): void {
    for (let i = 0; i < this.chunkLODs.length; i++) {
      this.chunkLODs[i].update(camera);
    }
    const camPos = camera.position;
    const pineLodDistSq = 450 * 450;
    for (let i = 0; i < this.treeLodGroups.length; i++) {
      const entry = this.treeLodGroups[i];
      const useHigh = camPos.distanceToSquared(entry.center) <= pineLodDistSq;
      entry.high.visible = useHigh;
      entry.low.visible = !useHigh;
    }
  }

  public dispose(): void {
    for (const c of this.colliders) {
      this.world.removeCollider(c, false);
    }
    for (const rb of this.rigidBodies) {
      this.world.removeRigidBody(rb);
    }
    this.colliders = [];
    this.rigidBodies = [];

    for (const lod of this.chunkLODs) {
      for (const level of lod.levels) {
        const mesh = level.object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      }
      this.group.remove(lod);
    }
    this.chunkLODs = [];

    if (this.iceMesh) {
      this.iceMesh.geometry.dispose();
      (this.iceMesh.material as THREE.Material).dispose();
      this.group.remove(this.iceMesh);
      this.iceMesh = null;
    }

    for (const treeMesh of this.treeMeshes) {
      treeMesh.dispose();
      this.group.remove(treeMesh);
    }
    this.treeMeshes = [];
    this.treeLodGroups = [];

    if (this.treeFoliageGeom) {
      this.treeFoliageGeom.dispose();
      this.treeFoliageGeom = null;
    }
    if (this.treeLowGeom) {
      this.treeLowGeom.dispose();
      this.treeLowGeom = null;
    }
    if (this.treeMaterial) {
      this.treeMaterial.dispose();
      this.treeMaterial = null;
    }

    if (this.terrainMaterial) {
      this.terrainMaterial.dispose();
    }
    disposeSnowDetailTexture();

    this.scene.remove(this.group);
  }

  public update(
    time: number,
    cameraPos: THREE.Vector3,
    playerPos?: THREE.Vector3,
    nightFactor: number = 0.0,
    sunColor?: THREE.Color,
    shadowColor?: THREE.Color,
    goldenFactor: number = 0.0
  ): void {
    if (this.terrainMaterial && this.terrainMaterial.userData && this.terrainMaterial.userData.update) {
      this.terrainMaterial.userData.update(time, this.sunDir, cameraPos, playerPos, nightFactor, sunColor, shadowColor, goldenFactor);
    }
  }
}
