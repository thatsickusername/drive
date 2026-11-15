import * as THREE from 'three';
import { RoadMeshGenerator } from '../../../slow_roads_extracted_core/src/index.js';
import { SlowRoadsPipeline } from '../math/slowRoadsCore';

const SEGMENT_SIZE = 50; // 50 fine nodes per road segment (~50m continuous ribbon)

export class RoadMeshManager {
  private scene: THREE.Scene;
  private roadMeshGen: any;
  private pipeline: SlowRoadsPipeline;
  private segments = new Map<number, THREE.Mesh>();
  private segmentSignatures = new Map<number, string>();
  private material: THREE.Material;
  // Terrain pipeline already carves and vertex-colors the road directly into the heightfield.
  // Superimposing floating ribbon plane meshes creates z-fighting, pass-through ghost planes,
  // and floating step artifacts. Keep disabled so user sees the clean road terrain.
  public enabled = false;

  constructor(scene: THREE.Scene, pipeline: SlowRoadsPipeline) {
    this.scene = scene;
    this.pipeline = pipeline;
    this.roadMeshGen = pipeline.roadMeshGen || new RoadMeshGenerator();

    this.material = new THREE.MeshStandardMaterial({
      color: 0x22262a,
      roughness: 0.8,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  public update(carX: number, carZ: number): void {
    if (!this.enabled) {
      if (this.segments.size > 0) {
        this.dispose();
      }
      return;
    }

    const fineNodes = this.pipeline.fineNodes;
    if (fineNodes.length < 2) return;

    // Check if new continuous segments can be built
    const totalSegments = Math.floor((fineNodes.length - 1) / SEGMENT_SIZE);

    // 1. Cull any stale/retracted segment meshes beyond current totalSegments
    for (const [segIdx, mesh] of this.segments.entries()) {
      if (segIdx >= totalSegments) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.segments.delete(segIdx);
        this.segmentSignatures.delete(segIdx);
      }
    }

    // 2. Build or update continuous segments
    for (let segIdx = 0; segIdx < totalSegments; segIdx++) {
      const startIdx = segIdx * SEGMENT_SIZE;
      // Overlap by 1 node so segment N seamlessly connects with segment N+1
      const endIdx = Math.min(startIdx + SEGMENT_SIZE + 1, fineNodes.length);
      const segmentNodes = fineNodes.slice(startIdx, endIdx);
      if (segmentNodes.length < 2) continue;

      const p0 = segmentNodes[0].p;
      const pMid = segmentNodes[Math.floor(segmentNodes.length / 2)].p;
      const p1 = segmentNodes[segmentNodes.length - 1].p;
      const signature = `${p0.x.toFixed(1)},${p0.y.toFixed(1)},${p0.z.toFixed(1)}_${pMid.y.toFixed(1)}_${p1.x.toFixed(1)},${p1.y.toFixed(1)},${p1.z.toFixed(1)}`;

      if (this.segments.has(segIdx)) {
        if (this.segmentSignatures.get(segIdx) === signature) {
          continue; // Mesh matches current road path geometry
        }
        // Mesh signature mismatch: road retracted or re-routed, remove obsolete ghost mesh
        const oldMesh = this.segments.get(segIdx)!;
        this.scene.remove(oldMesh);
        oldMesh.geometry.dispose();
        this.segments.delete(segIdx);
        this.segmentSignatures.delete(segIdx);
      }

      const meshData = this.roadMeshGen.generateRoadMesh(segmentNodes);
      if (meshData && meshData.positions && meshData.positions.length > 0) {
        const geo = new THREE.BufferGeometry();
        // Road positions sit 0.04m above carved terrain bed to eliminate z-fighting
        const pos = new Float32Array(meshData.positions.length);
        for (let i = 0; i < meshData.positions.length; i += 3) {
          pos[i] = meshData.positions[i];
          pos[i + 1] = meshData.positions[i + 1] + 0.04;
          pos[i + 2] = meshData.positions[i + 2];
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2));
        geo.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

        const mesh = new THREE.Mesh(geo, this.material);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.segments.set(segIdx, mesh);
        this.segmentSignatures.set(segIdx, signature);
      }
    }

    // In ENDLESS mode, cull segments far behind the car (>2000m)
    if (this.pipeline.roadMode === 'ENDLESS') {
      const maxDistSq = 2000 * 2000;
      for (const [segIdx, mesh] of this.segments.entries()) {
        const startIdx = segIdx * SEGMENT_SIZE;
        if (startIdx < fineNodes.length) {
          const node = fineNodes[startIdx];
          const distSq = (node.p.x - carX) ** 2 + (node.p.z - carZ) ** 2;
          if (distSq > maxDistSq && node.i < (this.pipeline.surveyor?.vehicleIndex || 0) - 150) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            this.segments.delete(segIdx);
            this.segmentSignatures.delete(segIdx);
          }
        }
      }
    }
  }

  public getDebugInfo(): { segmentCount: number; minSegment: number; maxSegment: number; enabled: boolean } {
    const keys = Array.from(this.segments.keys());
    return {
      enabled: this.enabled,
      segmentCount: keys.length,
      minSegment: keys.length > 0 ? Math.min(...keys) : 0,
      maxSegment: keys.length > 0 ? Math.max(...keys) : 0,
    };
  }

  public dispose(): void {
    for (const mesh of this.segments.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.segments.clear();
    this.segmentSignatures.clear();
    this.material.dispose();
  }
}
