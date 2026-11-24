import * as THREE from 'three';
import { createSnowTrailMaterial } from './SnowTrailMaterial';

export class CarvedSnowTrail {
  private readonly maxSegments = 1200;
  private readonly VERTS_PER_SEG = 19;
  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly colors: Float32Array;
  private readonly uvs: Float32Array;
  private readonly alphas: Float32Array;

  private readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshStandardMaterial;

  private count = 0;
  private lastEmitPos = new THREE.Vector3(9999, 9999, 9999);
  private readonly emitDist = 0.20; // Distance interval between segment slices
  private wasGrounded = false;
  private cumulativeDistance = 0.0;
  private terrainSampler: ((x: number, z: number) => number) | null = null;

  constructor(scene: THREE.Scene) {
    const totalVerts = this.maxSegments * this.VERTS_PER_SEG;
    this.positions = new Float32Array(totalVerts * 3);
    this.normals = new Float32Array(totalVerts * 3);
    this.colors = new Float32Array(totalVerts * 3);
    this.uvs = new Float32Array(totalVerts * 2);
    this.alphas = new Float32Array(totalVerts);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(this.normals, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));

    // Build quad strip index buffer across 19-point slices
    // Each pair of adjacent slices has (19 - 1) = 18 quads = 36 triangles
    const numQuadsPerSegment = this.VERTS_PER_SEG - 1;
    const indices = new Uint32Array((this.maxSegments - 1) * numQuadsPerSegment * 6);
    let idx = 0;

    for (let s = 0; s < this.maxSegments - 1; s++) {
      const sliceA = s * this.VERTS_PER_SEG;
      const sliceB = (s + 1) * this.VERTS_PER_SEG;

      for (let q = 0; q < numQuadsPerSegment; q++) {
        const a = sliceA + q;
        const b = sliceA + q + 1;
        const c = sliceB + q;
        const d = sliceB + q + 1;

        // Triangle 1: a, c, b
        indices[idx++] = a;
        indices[idx++] = c;
        indices[idx++] = b;

        // Triangle 2: b, c, d
        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }
    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    this.material = createSnowTrailMaterial();

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = 4;
    scene.add(this.mesh);
  }

  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.terrainSampler = sampler;
  }

  public updateUniforms(
    time: number,
    sunDir: THREE.Vector3,
    cameraPos: THREE.Vector3,
    nightFactor: number = 0.0,
    sunColor?: THREE.Color,
    shadowColor?: THREE.Color
  ): void {
    if (this.material.userData && this.material.userData.update) {
      this.material.userData.update(time, sunDir, cameraPos, nightFactor, sunColor, shadowColor);
    }
  }

  public reset(): void {
    this.count = 0;
    this.wasGrounded = false;
    this.cumulativeDistance = 0.0;
    this.lastEmitPos.set(9999, 9999, 9999);
    this.positions.fill(0);
    this.normals.fill(0);
    this.colors.fill(0);
    this.uvs.fill(0);
    this.alphas.fill(0);
    this.geometry.setDrawRange(0, 0);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }

  public update(
    pos: THREE.Vector3,
    right: THREE.Vector3,
    normal: THREE.Vector3,
    isGrounded: boolean,
    slipAngleDeg: number,
    speed: number,
    isDrifting: boolean,
    carveTurn: number = 0.0
  ): void {
    // 1. Airtime handling & segment decay
    if (!isGrounded || speed < 0.8) {
      this.wasGrounded = false;
      this.decayTrail();
      return;
    }

    const dist = pos.distanceTo(this.lastEmitPos);
    if (dist >= this.emitDist) {
      const isFreshTouchdown = !this.wasGrounded || dist > 2.0;
      this.lastEmitPos.copy(pos);
      this.wasGrounded = true;
      this.cumulativeDistance += dist;

      // Dynamic rut width:
      // Clean carving: ~0.15m width per rut (half-width 0.075m)
      // Drift / skid turn / hockey stop: widens up to 0.26m
      const slipT = THREE.MathUtils.clamp(slipAngleDeg / 40.0, 0, 1);
      const halfWidth = isDrifting
        ? THREE.MathUtils.lerp(0.075, 0.130, Math.max(slipT, 0.55))
        : 0.075;

      const bermWidth = isDrifting ? 0.140 : 0.115;
      const shoulderDx = 0.045; // 4.5cm gentle rounded curve from crest down to rut

      // Soft, Realistic 3D Rut Depth & Rounded Berm Heights:
      // Shallow, natural rut floor (+0.010m above ground surface)
      const rutFloorY = 0.010;
      // Powder surface reference elevation (+0.035m)
      const powderSurfaceY = 0.035;

      // Dynamic Asymmetric Snow Accumulation during Carving & Turning:
      // When carving left (carveTurn < 0), centrifugal force pushes churned snow to the RIGHT (outer edge).
      // When carving right (carveTurn > 0), centrifugal force pushes churned snow to the LEFT (outer edge).
      // Scaled proportionally with player speed: faster speed = higher and wider thrown snow berm.
      const speedFactor = THREE.MathUtils.clamp(speed / 10.0, 0.6, 2.8);
      const turnEffort = THREE.MathUtils.clamp(carveTurn, -1.0, 1.0);
      const carveFactor = turnEffort * speedFactor;

      let leftBermExtraH = 0.0;
      let leftBermExtraW = 0.0;
      let rightBermExtraH = 0.0;
      let rightBermExtraW = 0.0;

      if (carveFactor < 0.0) {
        // Carving Left: Centrifugal force dynamically throws snow to the Right outside edge
        const rightPush = Math.min(2.5, -carveFactor);
        rightBermExtraH = rightPush * 0.120; // Prominently elevated outer snow berm (+12cm to +30cm)
        rightBermExtraW = rightPush * 0.240; // Wide displaced snow displayed far outward (+24cm to +60cm)
        leftBermExtraH = -rightPush * 0.006; // Compressed inside edge
      } else if (carveFactor > 0.0) {
        // Carving Right: Centrifugal force dynamically throws snow to the Left outside edge
        const leftPush = Math.min(2.5, carveFactor);
        leftBermExtraH = leftPush * 0.120;  // Prominently elevated outer snow berm (+12cm to +30cm)
        leftBermExtraW = leftPush * 0.240;  // Wide displaced snow displayed far outward (+24cm to +60cm)
        rightBermExtraH = -leftPush * 0.006; // Compressed inside edge
      }

      // Drift / skid / hockey stop adds extra symmetric pushed snow volume
      const driftExtraH = isDrifting ? 0.012 : 0.0;
      const driftExtraW = isDrifting ? 0.030 : 0.0;

      // Soft natural micro-wobble along the berm crest
      const wobble = Math.sin(this.cumulativeDistance * 8.0) * 0.003 + Math.cos(this.cumulativeDistance * 18.0) * 0.002;
      const bermHeight = (isDrifting ? 0.035 : 0.028) + wobble;

      const leftBermHeight = powderSurfaceY + bermHeight + leftBermExtraH + driftExtraH;
      const leftBermWidth = bermWidth + leftBermExtraW + driftExtraW;
      const leftShoulderY = rutFloorY + (leftBermHeight - rutFloorY) * 0.62;

      const rightBermHeight = powderSurfaceY + bermHeight + rightBermExtraH + driftExtraH;
      const rightBermWidth = bermWidth + rightBermExtraW + driftExtraW;
      const rightShoulderY = rutFloorY + (rightBermHeight - rutFloorY) * 0.62;

      // Gentle center median spine between skis (4.1cm above rut floor)
      const medianY = powderSurfaceY + 0.016;
      const innerShoulderY = rutFloorY + (medianY - rutFloorY) * 0.60;

      // Shift existing vertices down by 1 slice (19 vertices)
      const stride = this.VERTS_PER_SEG * 3;
      const uvStride = this.VERTS_PER_SEG * 2;
      const alphaStride = this.VERTS_PER_SEG;

      this.positions.copyWithin(stride, 0, (this.maxSegments - 1) * stride);
      this.normals.copyWithin(stride, 0, (this.maxSegments - 1) * stride);
      this.colors.copyWithin(stride, 0, (this.maxSegments - 1) * stride);
      this.uvs.copyWithin(uvStride, 0, (this.maxSegments - 1) * uvStride);
      this.alphas.copyWithin(alphaStride, 0, (this.maxSegments - 1) * alphaStride);

      // Exact terrain contact origin: root position minus normal * sphereRadius (0.45m)
      const contactX = pos.x - normal.x * 0.45;
      const contactY = pos.y - normal.y * 0.45;
      const contactZ = pos.z - normal.z * 0.45;

      // Left ski and Right ski centers along lateral right vector
      // Skier stance: ~0.135m to left and right (27cm stance width, matching real skis)
      const leftCenterX = contactX - right.x * 0.135;
      const leftCenterZ = contactZ - right.z * 0.135;
      const rightCenterX = contactX + right.x * 0.135;
      const rightCenterZ = contactZ + right.z * 0.135;

      const rx = right.x;
      const rz = right.z;
      const nx = normal.x;
      const ny = normal.y;
      const nz = normal.z;

      // 19 cross-sectional nodes forming a continuous, soft, parabolic-curved snow sculpture
      const nodes = [
        // 0: Outer left feather (softly blends into untouched snow)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + leftBermWidth * 1.80), h: 0.008, u: 0.00, alpha: 0.0, isRut: false, wallTilt: 0.0 },
        // 1: Outer left flank (gentle outer ramp)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + leftBermWidth * 0.95), h: powderSurfaceY + 0.008 + leftBermExtraH * 0.70, u: 0.05, alpha: 0.70, isRut: false, wallTilt: -0.35 },
        // 2: Left berm crest (smooth rounded peak)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + leftBermWidth * 0.40), h: leftBermHeight, u: 0.10, alpha: 1.0, isRut: false, wallTilt: -0.20 },
        // 3: Left outer rounded shoulder (soft S-curve roll down into rut)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + (shoulderDx + leftBermExtraW * 0.25) * 0.4), h: leftShoulderY, u: 0.15, alpha: 1.0, isRut: false, wallTilt: 0.55 },
        // 4: Left rut outer bowl edge (shallow concave dip)
        { cx: leftCenterX, cz: leftCenterZ, lat: -halfWidth * 0.70, h: rutFloorY + 0.006, u: 0.20, alpha: 1.0, isRut: true, wallTilt: 0.35 },
        // 5: Left rut floor center (ski base trough)
        { cx: leftCenterX, cz: leftCenterZ, lat: 0.0, h: rutFloorY, u: 0.27, alpha: 1.0, isRut: true, wallTilt: 0.0 },
        // 6: Left rut inner bowl edge
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth * 0.70, h: rutFloorY + 0.006, u: 0.34, alpha: 1.0, isRut: true, wallTilt: -0.35 },
        // 7: Left inner rounded shoulder (soft curve rolling up to median)
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth + shoulderDx * 0.3, h: innerShoulderY, u: 0.39, alpha: 1.0, isRut: false, wallTilt: -0.45 },
        // 8: Left median flank
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth + shoulderDx * 0.8, h: medianY * 0.90, u: 0.44, alpha: 1.0, isRut: false, wallTilt: -0.20 },

        // 9: Center median crest (gentle rounded mound between skis)
        { cx: (leftCenterX + rightCenterX) * 0.5, cz: (leftCenterZ + rightCenterZ) * 0.5, lat: 0.0, h: medianY, u: 0.50, alpha: 1.0, isRut: false, wallTilt: 0.0 },

        // 10: Right median flank
        { cx: rightCenterX, cz: rightCenterZ, lat: -(halfWidth + shoulderDx * 0.8), h: medianY * 0.90, u: 0.56, alpha: 1.0, isRut: false, wallTilt: 0.20 },
        // 11: Right inner rounded shoulder
        { cx: rightCenterX, cz: rightCenterZ, lat: -(halfWidth + shoulderDx * 0.3), h: innerShoulderY, u: 0.61, alpha: 1.0, isRut: false, wallTilt: 0.45 },
        // 12: Right rut inner bowl edge
        { cx: rightCenterX, cz: rightCenterZ, lat: -halfWidth * 0.70, h: rutFloorY + 0.006, u: 0.66, alpha: 1.0, isRut: true, wallTilt: 0.35 },
        // 13: Right rut floor center
        { cx: rightCenterX, cz: rightCenterZ, lat: 0.0, h: rutFloorY, u: 0.73, alpha: 1.0, isRut: true, wallTilt: 0.0 },
        // 14: Right rut outer bowl edge
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth * 0.70, h: rutFloorY + 0.006, u: 0.80, alpha: 1.0, isRut: true, wallTilt: -0.35 },
        // 15: Right outer rounded shoulder (soft S-curve roll up to berm)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + (shoulderDx + rightBermExtraW * 0.25) * 0.4, h: rightShoulderY, u: 0.85, alpha: 1.0, isRut: false, wallTilt: -0.55 },
        // 16: Right berm crest (smooth rounded peak)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + rightBermWidth * 0.40, h: rightBermHeight, u: 0.90, alpha: 1.0, isRut: false, wallTilt: 0.20 },
        // 17: Outer right flank (gentle outer ramp)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + rightBermWidth * 0.95, h: powderSurfaceY + 0.008 + rightBermExtraH * 0.70, u: 0.95, alpha: 0.70, isRut: false, wallTilt: 0.35 },
        // 18: Outer right feather (softly blends into untouched snow)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + rightBermWidth * 1.80, h: 0.008, u: 1.00, alpha: 0.0, isRut: false, wallTilt: 0.0 }
      ];

      // Populate new slice at index 0..18
      for (let i = 0; i < this.VERTS_PER_SEG; i++) {
        const node = nodes[i];
        const px = node.cx + rx * node.lat + nx * node.h;
        const pz = node.cz + rz * node.lat + nz * node.h;
        // Sample exact ground elevation at every vertex to hug the terrain across any slope
        const groundY = this.terrainSampler ? this.terrainSampler(px, pz) : contactY;
        const py = groundY + ny * node.h;

        const vIdx = i * 3;
        this.positions[vIdx + 0] = px;
        this.positions[vIdx + 1] = py;
        this.positions[vIdx + 2] = pz;

        // Calculate 3D surface normal:
        const wallTilt = node.wallTilt;
        const normX = nx + rx * wallTilt;
        const normY = ny;
        const normZ = nz + rz * wallTilt;
        const invLen = 1.0 / Math.sqrt(normX * normX + normY * normY + normZ * normZ);

        this.normals[vIdx + 0] = normX * invLen;
        this.normals[vIdx + 1] = normY * invLen;
        this.normals[vIdx + 2] = normZ * invLen;

        // Vertex color: pure luminous alpine white snow across entire trail
        this.colors[vIdx + 0] = 1.0;
        this.colors[vIdx + 1] = 1.0;
        this.colors[vIdx + 2] = 1.0;

        const uvIdx = i * 2;
        this.uvs[uvIdx + 0] = node.u;
        this.uvs[uvIdx + 1] = this.cumulativeDistance * 0.8;

        // Touchdown handling: zero alpha across air gaps
        this.alphas[i] = isFreshTouchdown ? 0.0 : node.alpha;
      }

      // Soft Leading-Edge Head Blend:
      // Smoothly blend opacity across the leading 5 segments (0m to 1.0m behind contact point)
      // so the trail softly and seamlessly emerges from beneath the ski bases without an abrupt geometric start cut.
      const headSteps = 5;
      const headAlphaWeights = [0.0, 0.22, 0.55, 0.82, 0.95];
      for (let s = 0; s < Math.min(this.count, headSteps); s++) {
        const headA = headAlphaWeights[s];
        const offset = s * this.VERTS_PER_SEG;
        for (let v = 0; v < this.VERTS_PER_SEG; v++) {
          const idx = offset + v;
          if (v === 0 || v === 18) {
            this.alphas[idx] = 0.0;
          } else {
            this.alphas[idx] = headA;
          }
        }
      }
      if (this.count > headSteps) {
        const offset = headSteps * this.VERTS_PER_SEG;
        for (let v = 1; v < this.VERTS_PER_SEG - 1; v++) {
          this.alphas[offset + v] = 1.0;
        }
      }

      this.count = Math.min(this.count + 1, this.maxSegments);
      const numQuadsPerSegment = this.VERTS_PER_SEG - 1;
      this.geometry.setDrawRange(0, Math.max(0, this.count - 1) * numQuadsPerSegment * 6);
      this.notifyGeometryUpdate();
    }

    this.decayTrail();
  }

  private decayTrail(): void {
    if (this.count <= 0) return;

    // Keep active trail behind player completely crisp and solid (100% alpha)
    // Only fade smoothly at the tail end of the buffer (beyond segment 950)
    const fadeStart = Math.min(this.count, 950);
    const fadeLen = this.maxSegments - fadeStart;
    if (this.count > fadeStart && fadeLen > 0) {
      let needsUpdate = false;
      for (let s = fadeStart; s < this.count; s++) {
        const segAlpha = 1.0 - (s - fadeStart) / fadeLen;
        const offset = s * this.VERTS_PER_SEG;
        for (let v = 0; v < this.VERTS_PER_SEG; v++) {
          const idx = offset + v;
          if (v !== 0 && v !== 18) {
            this.alphas[idx] = Math.min(this.alphas[idx], segAlpha);
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) {
        this.geometry.attributes.aAlpha.needsUpdate = true;
      }
    }
  }

  private notifyGeometryUpdate(): void {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.uv.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
  }
}
