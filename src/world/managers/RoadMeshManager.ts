import * as THREE from 'three';
import { RoadMeshGenerator } from '../../../slow_roads_extracted_core/src/index.js';
import { SlowRoadsPipeline } from '../math/slowRoadsCore';

const SEGMENT_SIZE = 50; // 50 fine nodes per road segment (~50m continuous ribbon)

export class RoadMeshManager {
  private scene: THREE.Scene;
  private roadMeshGen: any;
  private pipeline: SlowRoadsPipeline;
  private segments = new Map<number, THREE.Mesh>();
  private material: THREE.Material;

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
    const fineNodes = this.pipeline.fineNodes;
    if (fineNodes.length < 2) return;

    // Check if new continuous segments can be built
    const totalSegments = Math.floor((fineNodes.length - 1) / SEGMENT_SIZE);

    for (let segIdx = 0; segIdx < totalSegments; segIdx++) {
      if (this.segments.has(segIdx)) continue;

      const startIdx = segIdx * SEGMENT_SIZE;
      // Overlap by 1 node so segment N seamlessly connects with segment N+1
      const endIdx = Math.min(startIdx + SEGMENT_SIZE + 1, fineNodes.length);
      const segmentNodes = fineNodes.slice(startIdx, endIdx);

      if (segmentNodes.length >= 2) {
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
        }
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
          }
        }
      }
    }
  }

  public dispose(): void {
    for (const mesh of this.segments.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    this.segments.clear();
    this.material.dispose();
  }
}
