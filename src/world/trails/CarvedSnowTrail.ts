import * as THREE from 'three';
import { createSnowTrailMaterial } from '../shaders/SnowTrailMaterial';

export class CarvedSnowTrail {
  private readonly maxSegments = 1200;
  private readonly VERTS_PER_SEG = 19;
  private readonly basePositions: Float32Array;
  private readonly baseAlphas: Float32Array;
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
  private cumulativeDistance = 0.0;
  private terrainSampler: ((x: number, z: number) => number) | null = null;
  private pendingJumpGap = false;
  private readonly segmentGaps: Uint8Array;
  private hasActiveGaps = false;

  constructor(scene: THREE.Scene) {
    this.segmentGaps = new Uint8Array(this.maxSegments);
    const totalVerts = this.maxSegments * this.VERTS_PER_SEG;
    this.basePositions = new Float32Array(totalVerts * 3);
    this.baseAlphas = new Float32Array(totalVerts);
    this.positions = new Float32Array(totalVerts * 3);
    this.normals = new Float32Array(totalVerts * 3);
    this.colors = new Float32Array(totalVerts * 3);
    this.colors.fill(1.0);
    this.uvs = new Float32Array(totalVerts * 2);
    this.alphas = new Float32Array(totalVerts);

    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', posAttr);

    const normAttr = new THREE.BufferAttribute(this.normals, 3);
    normAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('normal', normAttr);

    const colAttr = new THREE.BufferAttribute(this.colors, 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('color', colAttr);

    const uvAttr = new THREE.BufferAttribute(this.uvs, 2);
    uvAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('uv', uvAttr);

    const alphaAttr = new THREE.BufferAttribute(this.alphas, 1);
    alphaAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('aAlpha', alphaAttr);

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
    const indexAttr = new THREE.BufferAttribute(indices, 1);
    indexAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setIndex(indexAttr);

    this.material = createSnowTrailMaterial();

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
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
    shadowColor?: THREE.Color,
    goldenFactor: number = 0.0
  ): void {
    if (this.material.userData && this.material.userData.update) {
      this.material.userData.update(time, sunDir, cameraPos, nightFactor, sunColor, shadowColor, goldenFactor);
    }
  }

  public reset(): void {
    this.count = 0;
    this.cumulativeDistance = 0.0;
    this.lastEmitPos.set(9999, 9999, 9999);
    this.pendingJumpGap = false;
    this.segmentGaps.fill(0);
    if (this.hasActiveGaps) {
      this.hasActiveGaps = false;
      this.restoreAllIndices();
    }
    this.basePositions.fill(0);
    this.baseAlphas.fill(0);
    this.positions.fill(0);
    this.normals.fill(0);
    this.colors.fill(1.0);
    this.uvs.fill(0);
    this.alphas.fill(0);
    this.geometry.setDrawRange(0, 0);
    const totalVerts = this.maxSegments * this.VERTS_PER_SEG;
    this.setAttributeUpdateRange(this.geometry.attributes.position as THREE.BufferAttribute, 0, totalVerts * 3);
    this.setAttributeUpdateRange(this.geometry.attributes.normal as THREE.BufferAttribute, 0, totalVerts * 3);
    this.setAttributeUpdateRange(this.geometry.attributes.color as THREE.BufferAttribute, 0, totalVerts * 3);
    this.setAttributeUpdateRange(this.geometry.attributes.uv as THREE.BufferAttribute, 0, totalVerts * 2);
    this.setAttributeUpdateRange(this.geometry.attributes.aAlpha as THREE.BufferAttribute, 0, totalVerts);
  }

  public onJumpStart(): void {
    this.pendingJumpGap = true;
    if (this.count > 0) {
      this.applyTrailCaps();
      this.notifyGeometryUpdate();
    }
  }

  public onCrash(): void {
    this.pendingJumpGap = true;
    if (this.count > 0) {
      this.applyTrailCaps();
      this.notifyGeometryUpdate();
    }
  }

  public onRespawn(): void {
    this.pendingJumpGap = true;
    if (this.count > 0) {
      this.applyTrailCaps();
      this.notifyGeometryUpdate();
    }
  }

  private applyTrailCaps(): void {
    if (this.count <= 0) return;

    // 1. Reset active range from pristine un-tapered base arrays
    const stride = this.VERTS_PER_SEG * 3;
    const alphaStride = this.VERTS_PER_SEG;
    this.positions.set(this.basePositions.subarray(0, this.count * stride));
    this.alphas.set(this.baseAlphas.subarray(0, this.count * alphaStride));

    const taperSteps = 4;

    // 2. Identify all continuous trail segments separated by segmentGaps
    let segStart = 0;
    for (let s = 0; s < this.count - 1; s++) {
      if (this.segmentGaps[s] === 1) {
        this.taperSegment(segStart, s, taperSteps);
        segStart = s + 1;
      }
    }
    if (segStart < this.count) {
      this.taperSegment(segStart, this.count - 1, taperSteps);
    }
  }

  private taperSegment(segStart: number, segEnd: number, taperSteps: number): void {
    const segLen = segEnd - segStart + 1;
    if (segLen <= 1) {
      this.applySliceScale(segStart, 0.0, 0.0, 0.0);
      return;
    }

    const maxTaper = Math.min(taperSteps, Math.ceil(segLen / 2));
    for (let d = 0; d < maxTaper; d++) {
      const u = d / taperSteps;
      const w = Math.sqrt(Math.max(0.0, u * (2.0 - u)));
      const hScale = w * w;
      const aScale = u;

      const idxStart = segStart + d;
      const idxEnd = segEnd - d;

      this.applySliceScale(idxStart, w, hScale, aScale);
      if (idxEnd !== idxStart) {
        this.applySliceScale(idxEnd, w, hScale, aScale);
      }
    }
  }

  private applySliceScale(s: number, w: number, hScale: number, aScale: number): void {
    const centerOffset = (s * this.VERTS_PER_SEG + 9) * 3;
    const centerX = this.basePositions[centerOffset + 0];
    const centerY = this.basePositions[centerOffset + 1];
    const centerZ = this.basePositions[centerOffset + 2];
    const groundY = this.terrainSampler ? this.terrainSampler(centerX, centerZ) : centerY;

    for (let v = 0; v < this.VERTS_PER_SEG; v++) {
      const vIdx = (s * this.VERTS_PER_SEG + v) * 3;
      const origX = this.basePositions[vIdx + 0];
      const origY = this.basePositions[vIdx + 1];
      const origZ = this.basePositions[vIdx + 2];

      const dx = origX - centerX;
      const dz = origZ - centerZ;
      const px = centerX + dx * w;
      const pz = centerZ + dz * w;
      const vGroundY = this.terrainSampler ? this.terrainSampler(px, pz) : groundY;
      const h = (origY - groundY) * hScale;

      this.positions[vIdx + 0] = px;
      this.positions[vIdx + 1] = vGroundY + h;
      this.positions[vIdx + 2] = pz;

      const aIdx = s * this.VERTS_PER_SEG + v;
      this.alphas[aIdx] = this.baseAlphas[aIdx] * aScale;
    }
  }

  private rebuildIndexBuffer(): void {
    if (!this.hasActiveGaps) return;

    const numQuadsPerSegment = this.VERTS_PER_SEG - 1;
    const indicesAttr = this.geometry.getIndex();
    if (!indicesAttr) return;
    const indices = indicesAttr.array as Uint32Array;
    const maxS = Math.min(this.count - 1, this.maxSegments - 1);
    let anyGapRemaining = false;

    for (let s = 0; s < maxS; s++) {
      const isGap = this.segmentGaps[s] === 1;
      if (isGap) anyGapRemaining = true;
      const idx = s * numQuadsPerSegment * 6;

      if (isGap) {
        indices.fill(0, idx, idx + numQuadsPerSegment * 6);
      } else {
        let curIdx = idx;
        const sliceA = s * this.VERTS_PER_SEG;
        const sliceB = (s + 1) * this.VERTS_PER_SEG;
        for (let q = 0; q < numQuadsPerSegment; q++) {
          const a = sliceA + q;
          const b = sliceA + q + 1;
          const c = sliceB + q;
          const d = sliceB + q + 1;

          indices[curIdx++] = a;
          indices[curIdx++] = c;
          indices[curIdx++] = b;

          indices[curIdx++] = b;
          indices[curIdx++] = c;
          indices[curIdx++] = d;
        }
      }
    }

    if (!anyGapRemaining) {
      this.hasActiveGaps = false;
      this.restoreAllIndices();
    } else {
      indicesAttr.needsUpdate = true;
    }
  }

  private restoreAllIndices(): void {
    const numQuadsPerSegment = this.VERTS_PER_SEG - 1;
    const indicesAttr = this.geometry.getIndex();
    if (!indicesAttr) return;
    const indices = indicesAttr.array as Uint32Array;
    let idx = 0;

    for (let s = 0; s < this.maxSegments - 1; s++) {
      const sliceA = s * this.VERTS_PER_SEG;
      const sliceB = (s + 1) * this.VERTS_PER_SEG;

      for (let q = 0; q < numQuadsPerSegment; q++) {
        const a = sliceA + q;
        const b = sliceA + q + 1;
        const c = sliceB + q;
        const d = sliceB + q + 1;

        indices[idx++] = a;
        indices[idx++] = c;
        indices[idx++] = b;

        indices[idx++] = b;
        indices[idx++] = c;
        indices[idx++] = d;
      }
    }
    indicesAttr.needsUpdate = true;
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
      this.decayTrail();
      return;
    }

    const dist = pos.distanceTo(this.lastEmitPos);
    if (dist >= this.emitDist || this.pendingJumpGap) {
      const isJumpLanding = this.pendingJumpGap && this.count > 0;
      this.lastEmitPos.copy(pos);
      if (isJumpLanding) {
        this.cumulativeDistance += this.emitDist;
        this.pendingJumpGap = false;
      } else {
        this.cumulativeDistance += dist;
      }

      // Dynamic rut width:
      // Clean carving: ~0.15m width per rut (half-width 0.075m)
      // Drift / skid turn / hockey stop: widens up to 0.26m
      const slipT = THREE.MathUtils.clamp(slipAngleDeg / 40.0, 0, 1);
      const halfWidth = isDrifting
        ? THREE.MathUtils.lerp(0.075, 0.130, Math.max(slipT, 0.55))
        : 0.075;

      const bermWidth = isDrifting ? 0.140 : 0.115;
      const shoulderDx = 0.050; // Gentle rounded curve from crest down to rut

      // Soft, Realistic 3D Rut Depth & Rounded Berm Heights:
      // Shallow, natural rut floor (+0.013m above ground surface)
      const rutFloorY = 0.013;
      // Powder surface reference elevation (+0.028m)
      const powderSurfaceY = 0.028;

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
        rightBermExtraH = rightPush * 0.090; // Subtle elevated outer snow berm
        rightBermExtraW = rightPush * 0.220; // Wide displaced snow displayed outward
        leftBermExtraH = -rightPush * 0.005; // Compressed inside edge
      } else if (carveFactor > 0.0) {
        // Carving Right: Centrifugal force dynamically throws snow to the Left outside edge
        const leftPush = Math.min(2.5, carveFactor);
        leftBermExtraH = leftPush * 0.090;  // Subtle elevated outer snow berm
        leftBermExtraW = leftPush * 0.220;  // Wide displaced snow displayed outward
        rightBermExtraH = -leftPush * 0.005; // Compressed inside edge
      }

      // Drift / skid / hockey stop adds extra symmetric pushed snow volume
      const driftExtraH = isDrifting ? 0.009 : 0.0;
      const driftExtraW = isDrifting ? 0.025 : 0.0;

      // Soft natural micro-wobble along the berm crest
      const wobble = Math.sin(this.cumulativeDistance * 8.0) * 0.0025 + Math.cos(this.cumulativeDistance * 18.0) * 0.0015;
      const bermHeight = (isDrifting ? 0.027 : 0.022) + wobble;

      const leftBermHeight = powderSurfaceY + bermHeight + leftBermExtraH + driftExtraH;
      const leftBermWidth = bermWidth + leftBermExtraW + driftExtraW;
      const leftShoulderY = rutFloorY + (leftBermHeight - rutFloorY) * 0.58;

      const rightBermHeight = powderSurfaceY + bermHeight + rightBermExtraH + driftExtraH;
      const rightBermWidth = bermWidth + rightBermExtraW + driftExtraW;
      const rightShoulderY = rutFloorY + (rightBermHeight - rutFloorY) * 0.58;

      // Gentle center median spine between skis (softly rounded)
      const medianY = powderSurfaceY + 0.012;
      const innerShoulderY = rutFloorY + (medianY - rutFloorY) * 0.55;

      // Shift existing vertices down by 1 slice (19 vertices)
      const stride = this.VERTS_PER_SEG * 3;
      const uvStride = this.VERTS_PER_SEG * 2;
      const alphaStride = this.VERTS_PER_SEG;

      this.basePositions.copyWithin(stride, 0, (this.maxSegments - 1) * stride);
      this.baseAlphas.copyWithin(alphaStride, 0, (this.maxSegments - 1) * alphaStride);
      this.normals.copyWithin(stride, 0, (this.maxSegments - 1) * stride);
      this.uvs.copyWithin(uvStride, 0, (this.maxSegments - 1) * uvStride);

      this.segmentGaps.copyWithin(1, 0, this.maxSegments - 1);
      this.segmentGaps[0] = isJumpLanding ? 1 : 0;
      if (isJumpLanding) {
        this.hasActiveGaps = true;
      }
      if (this.hasActiveGaps) {
        this.rebuildIndexBuffer();
      }

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
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + leftBermWidth * 1.80), h: 0.007, u: 0.00, alpha: 0.0, isRut: false, wallTilt: 0.0 },
        // 1: Outer left flank (gentle outer ramp)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + leftBermWidth * 0.95), h: powderSurfaceY + 0.006 + leftBermExtraH * 0.60, u: 0.05, alpha: 0.70, isRut: false, wallTilt: -0.28 },
        // 2: Left berm crest (smooth rounded peak)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + leftBermWidth * 0.40), h: leftBermHeight, u: 0.10, alpha: 1.0, isRut: false, wallTilt: -0.16 },
        // 3: Left outer rounded shoulder (soft S-curve roll down into rut)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + (shoulderDx + leftBermExtraW * 0.25) * 0.4), h: leftShoulderY, u: 0.15, alpha: 1.0, isRut: false, wallTilt: 0.42 },
        // 4: Left rut outer bowl edge (shallow concave dip)
        { cx: leftCenterX, cz: leftCenterZ, lat: -halfWidth * 0.70, h: rutFloorY + 0.004, u: 0.20, alpha: 1.0, isRut: true, wallTilt: 0.26 },
        // 5: Left rut floor center (ski base trough)
        { cx: leftCenterX, cz: leftCenterZ, lat: 0.0, h: rutFloorY, u: 0.27, alpha: 1.0, isRut: true, wallTilt: 0.0 },
        // 6: Left rut inner bowl edge
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth * 0.70, h: rutFloorY + 0.004, u: 0.34, alpha: 1.0, isRut: true, wallTilt: -0.26 },
        // 7: Left inner rounded shoulder (soft curve rolling up to median)
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth + shoulderDx * 0.3, h: innerShoulderY, u: 0.39, alpha: 1.0, isRut: false, wallTilt: -0.36 },
        // 8: Left median flank
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth + shoulderDx * 0.8, h: medianY * 0.92, u: 0.44, alpha: 1.0, isRut: false, wallTilt: -0.16 },

        // 9: Center median crest (gentle rounded mound between skis)
        { cx: (leftCenterX + rightCenterX) * 0.5, cz: (leftCenterZ + rightCenterZ) * 0.5, lat: 0.0, h: medianY, u: 0.50, alpha: 1.0, isRut: false, wallTilt: 0.0 },

        // 10: Right median flank
        { cx: rightCenterX, cz: rightCenterZ, lat: -(halfWidth + shoulderDx * 0.8), h: medianY * 0.92, u: 0.56, alpha: 1.0, isRut: false, wallTilt: 0.16 },
        // 11: Right inner rounded shoulder
        { cx: rightCenterX, cz: rightCenterZ, lat: -(halfWidth + shoulderDx * 0.3), h: innerShoulderY, u: 0.61, alpha: 1.0, isRut: false, wallTilt: 0.36 },
        // 12: Right rut inner bowl edge
        { cx: rightCenterX, cz: rightCenterZ, lat: -halfWidth * 0.70, h: rutFloorY + 0.004, u: 0.66, alpha: 1.0, isRut: true, wallTilt: 0.26 },
        // 13: Right rut floor center
        { cx: rightCenterX, cz: rightCenterZ, lat: 0.0, h: rutFloorY, u: 0.73, alpha: 1.0, isRut: true, wallTilt: 0.0 },
        // 14: Right rut outer bowl edge
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth * 0.70, h: rutFloorY + 0.004, u: 0.80, alpha: 1.0, isRut: true, wallTilt: -0.26 },
        // 15: Right outer rounded shoulder (soft S-curve roll up to berm)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + (shoulderDx + rightBermExtraW * 0.25) * 0.4, h: rightShoulderY, u: 0.85, alpha: 1.0, isRut: false, wallTilt: -0.42 },
        // 16: Right berm crest (smooth rounded peak)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + rightBermWidth * 0.40, h: rightBermHeight, u: 0.90, alpha: 1.0, isRut: false, wallTilt: 0.16 },
        // 17: Outer right flank (gentle outer ramp)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + rightBermWidth * 0.95, h: powderSurfaceY + 0.006 + rightBermExtraH * 0.60, u: 0.95, alpha: 0.70, isRut: false, wallTilt: 0.28 },
        // 18: Outer right feather (softly blends into untouched snow)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + rightBermWidth * 1.80, h: 0.007, u: 1.00, alpha: 0.0, isRut: false, wallTilt: 0.0 }
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
        this.basePositions[vIdx + 0] = px;
        this.basePositions[vIdx + 1] = py;
        this.basePositions[vIdx + 2] = pz;

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

        this.baseAlphas[i] = node.alpha;
      }

      this.count = Math.min(this.count + 1, this.maxSegments);
      this.applyTrailCaps();
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
            this.baseAlphas[idx] = Math.min(this.baseAlphas[idx], segAlpha);
            this.alphas[idx] = Math.min(this.alphas[idx], segAlpha);
            needsUpdate = true;
          }
        }
      }
      if (needsUpdate) {
        const start = fadeStart * this.VERTS_PER_SEG;
        const count = (this.count - fadeStart) * this.VERTS_PER_SEG;
        this.setAttributeUpdateRange(this.geometry.attributes.aAlpha as THREE.BufferAttribute, start, count);
      }
    }
  }

  private setAttributeUpdateRange(attr: THREE.BufferAttribute, offset: number, count: number): void {
    if (count <= 0) return;
    attr.clearUpdateRanges();
    attr.addUpdateRange(offset, count);
    attr.needsUpdate = true;
  }

  private notifyGeometryUpdate(): void {
    if (this.count <= 0) return;
    const activeVerts = this.count * this.VERTS_PER_SEG;
    this.setAttributeUpdateRange(this.geometry.attributes.position as THREE.BufferAttribute, 0, activeVerts * 3);
    this.setAttributeUpdateRange(this.geometry.attributes.normal as THREE.BufferAttribute, 0, activeVerts * 3);
    this.setAttributeUpdateRange(this.geometry.attributes.uv as THREE.BufferAttribute, 0, activeVerts * 2);
    this.setAttributeUpdateRange(this.geometry.attributes.aAlpha as THREE.BufferAttribute, 0, activeVerts);
  }

  public dispose(scene?: THREE.Scene): void {
    if (scene) {
      scene.remove(this.mesh);
    } else if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.geometry.dispose();
    this.material.dispose();
  }
}
