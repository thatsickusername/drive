import * as THREE from 'three';
import { getSharedSnowTrailMaterial, updateSharedSnowTrailUniforms } from '../shaders/SnowTrailMaterial';

export class CarvedSnowTrail {
  private readonly maxSegments = 1200;
  private readonly VERTS_PER_SEG = 19;
  private readonly QUADS_PER_SEG = 18;
  private readonly INDICES_PER_SEG = 18 * 6;
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

  // Circular ring buffer cursors
  private headSlot = -1;
  private segCount = 0;
  private currentRunLen = 0;
  private lastEmitPos = new THREE.Vector3(9999, 9999, 9999);
  private readonly emitDist = 0.20; // Distance interval between segment slices
  private cumulativeDistance = 0.0;
  private terrainSampler: ((x: number, z: number) => number) | null = null;
  private pendingJumpGap = false;
  private readonly segmentGaps: Uint8Array;

  // Pre-allocated 19-node cross-section scratch arrays (zero per-emit allocation)
  private readonly _nodeCx = new Float64Array(19);
  private readonly _nodeCz = new Float64Array(19);
  private readonly _nodeLat = new Float32Array(19);
  private readonly _nodeH = new Float32Array(19);
  private readonly _nodeU = new Float32Array(19);
  private readonly _nodeAlpha = new Float32Array(19);
  private readonly _nodeWallTilt = new Float32Array(19);

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

    const indices = new Uint32Array(this.maxSegments * this.INDICES_PER_SEG);
    const indexAttr = new THREE.BufferAttribute(indices, 1);
    indexAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setIndex(indexAttr);
    for (let s = 0; s < this.maxSegments; s++) {
      this.setSegmentIndices(s, true);
    }
    this.geometry.setDrawRange(0, 0);

    this.material = getSharedSnowTrailMaterial();

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

  public setVisible(visible: boolean): void {
    this.mesh.visible = visible;
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
    updateSharedSnowTrailUniforms(time, sunDir, cameraPos, nightFactor, sunColor, shadowColor, goldenFactor);
  }

  public reset(): void {
    this.headSlot = -1;
    this.segCount = 0;
    this.currentRunLen = 0;
    this.cumulativeDistance = 0.0;
    this.lastEmitPos.set(9999, 9999, 9999);
    this.pendingJumpGap = false;
    this.segmentGaps.fill(0);

    const indexAttr = this.geometry.getIndex() as THREE.BufferAttribute;
    for (let s = 0; s < this.maxSegments; s++) {
      this.setSegmentIndices(s, true);
    }
    indexAttr.clearUpdateRanges();
    indexAttr.needsUpdate = true;

    this.basePositions.fill(0);
    this.baseAlphas.fill(0);
    this.positions.fill(0);
    this.normals.fill(0);
    this.colors.fill(1.0);
    this.uvs.fill(0);
    this.alphas.fill(0);
    this.geometry.setDrawRange(0, 0);

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const normAttr = this.geometry.attributes.normal as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const uvAttr = this.geometry.attributes.uv as THREE.BufferAttribute;
    const alphaAttr = this.geometry.attributes.aAlpha as THREE.BufferAttribute;
    posAttr.clearUpdateRanges();
    normAttr.clearUpdateRanges();
    colAttr.clearUpdateRanges();
    uvAttr.clearUpdateRanges();
    alphaAttr.clearUpdateRanges();
    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    uvAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  }

  public onJumpStart(): void {
    this.pendingJumpGap = true;
  }

  public onCrash(): void {
    this.pendingJumpGap = true;
  }

  public onRespawn(): void {
    this.pendingJumpGap = true;
  }

  private setSegmentIndices(slot: number, enabled: boolean): void {
    const indicesAttr = this.geometry.getIndex();
    if (!indicesAttr) return;
    const indices = indicesAttr.array as Uint32Array;
    const base = slot * this.INDICES_PER_SEG;

    if (!enabled) {
      indices.fill(0, base, base + this.INDICES_PER_SEG);
      return;
    }

    const sliceNew = ((slot + 1) % this.maxSegments) * this.VERTS_PER_SEG;
    const sliceOld = slot * this.VERTS_PER_SEG;
    let curIdx = base;
    for (let q = 0; q < this.QUADS_PER_SEG; q++) {
      const a = sliceNew + q;
      const b = sliceNew + q + 1;
      const c = sliceOld + q;
      const d = sliceOld + q + 1;

      indices[curIdx++] = a;
      indices[curIdx++] = c;
      indices[curIdx++] = b;

      indices[curIdx++] = b;
      indices[curIdx++] = c;
      indices[curIdx++] = d;
    }
  }

  private setNode(
    i: number,
    cx: number,
    cz: number,
    lat: number,
    h: number,
    u: number,
    alpha: number,
    wallTilt: number
  ): void {
    this._nodeCx[i] = cx;
    this._nodeCz[i] = cz;
    this._nodeLat[i] = lat;
    this._nodeH[i] = h;
    this._nodeU[i] = u;
    this._nodeAlpha[i] = alpha;
    this._nodeWallTilt[i] = wallTilt;
  }

  private restoreSlice(slot: number): void {
    const vStart = slot * this.VERTS_PER_SEG * 3;
    const vLen = this.VERTS_PER_SEG * 3;
    this.positions.set(this.basePositions.subarray(vStart, vStart + vLen), vStart);
    const aStart = slot * this.VERTS_PER_SEG;
    this.alphas.set(this.baseAlphas.subarray(aStart, aStart + this.VERTS_PER_SEG), aStart);
  }

  private applySliceScale(slot: number, w: number, hScale: number, aScale: number): void {
    const centerOffset = (slot * this.VERTS_PER_SEG + 9) * 3;
    const centerX = this.basePositions[centerOffset + 0];
    const centerY = this.basePositions[centerOffset + 1];
    const centerZ = this.basePositions[centerOffset + 2];
    const groundY = this.terrainSampler ? this.terrainSampler(centerX, centerZ) : centerY;

    for (let v = 0; v < this.VERTS_PER_SEG; v++) {
      const vIdx = (slot * this.VERTS_PER_SEG + v) * 3;
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

      const aIdx = slot * this.VERTS_PER_SEG + v;
      this.alphas[aIdx] = this.baseAlphas[aIdx] * aScale;
    }
  }

  private taperActiveRun(posAttr: THREE.BufferAttribute, alphaAttr: THREE.BufferAttribute): void {
    if (this.segCount <= 0 || this.currentRunLen <= 0) return;

    const taperSteps = 4;
    const runLen = this.currentRunLen;
    const runStartSlot = (this.headSlot - (runLen - 1) + this.maxSegments) % this.maxSegments;

    if (runLen > taperSteps + 4) {
      const exitedSlot = (this.headSlot - taperSteps + this.maxSegments) % this.maxSegments;
      this.restoreSlice(exitedSlot);
      posAttr.addUpdateRange(exitedSlot * this.VERTS_PER_SEG * 3, this.VERTS_PER_SEG * 3);
      alphaAttr.addUpdateRange(exitedSlot * this.VERTS_PER_SEG, this.VERTS_PER_SEG);
    }

    if (runLen === 1) {
      this.applySliceScale(this.headSlot, 0.0, 0.0, 0.0);
      posAttr.addUpdateRange(this.headSlot * this.VERTS_PER_SEG * 3, this.VERTS_PER_SEG * 3);
      alphaAttr.addUpdateRange(this.headSlot * this.VERTS_PER_SEG, this.VERTS_PER_SEG);
      return;
    }

    const maxTaper = Math.min(taperSteps, Math.ceil(runLen / 2));
    for (let d = 0; d < maxTaper; d++) {
      const u = d / taperSteps;
      const w = Math.sqrt(Math.max(0.0, u * (2.0 - u)));
      const hScale = w * w;
      const aScale = u;

      if (runLen <= taperSteps * 2) {
        const startSlot = (runStartSlot + d) % this.maxSegments;
        this.applySliceScale(startSlot, w, hScale, aScale);
        posAttr.addUpdateRange(startSlot * this.VERTS_PER_SEG * 3, this.VERTS_PER_SEG * 3);
        alphaAttr.addUpdateRange(startSlot * this.VERTS_PER_SEG, this.VERTS_PER_SEG);
      }

      const endSlot = (this.headSlot - d + this.maxSegments) % this.maxSegments;
      this.applySliceScale(endSlot, w, hScale, aScale);
      posAttr.addUpdateRange(endSlot * this.VERTS_PER_SEG * 3, this.VERTS_PER_SEG * 3);
      alphaAttr.addUpdateRange(endSlot * this.VERTS_PER_SEG, this.VERTS_PER_SEG);
    }
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
    const alphaAttr = this.geometry.attributes.aAlpha as THREE.BufferAttribute;

    if (!isGrounded || speed < 0.8) {
      alphaAttr.clearUpdateRanges();
      this.decayTrail(alphaAttr);
      return;
    }

    const dist = pos.distanceTo(this.lastEmitPos);
    if (dist >= this.emitDist || this.pendingJumpGap) {
      const isJumpLanding = this.pendingJumpGap && this.segCount > 0;
      this.lastEmitPos.copy(pos);
      if (isJumpLanding) {
        this.cumulativeDistance += this.emitDist;
        this.pendingJumpGap = false;
      } else {
        this.cumulativeDistance += dist;
      }

      const slipT = THREE.MathUtils.clamp(slipAngleDeg / 40.0, 0, 1);
      const halfWidth = isDrifting
        ? THREE.MathUtils.lerp(0.075, 0.130, Math.max(slipT, 0.55))
        : 0.075;

      const bermWidth = isDrifting ? 0.140 : 0.115;
      const shoulderDx = 0.050;
      const rutFloorY = 0.013;
      const powderSurfaceY = 0.028;

      const speedFactor = THREE.MathUtils.clamp(speed / 10.0, 0.6, 2.8);
      const turnEffort = THREE.MathUtils.clamp(carveTurn, -1.0, 1.0);
      const carveFactor = turnEffort * speedFactor;

      let leftBermExtraH = 0.0;
      let leftBermExtraW = 0.0;
      let rightBermExtraH = 0.0;
      let rightBermExtraW = 0.0;

      if (carveFactor < 0.0) {
        const rightPush = Math.min(2.5, -carveFactor);
        rightBermExtraH = rightPush * 0.090;
        rightBermExtraW = rightPush * 0.220;
        leftBermExtraH = -rightPush * 0.005;
      } else if (carveFactor > 0.0) {
        const leftPush = Math.min(2.5, carveFactor);
        leftBermExtraH = leftPush * 0.090;
        leftBermExtraW = leftPush * 0.220;
        rightBermExtraH = -leftPush * 0.005;
      }

      const driftExtraH = isDrifting ? 0.009 : 0.0;
      const driftExtraW = isDrifting ? 0.025 : 0.0;

      const wobble = Math.sin(this.cumulativeDistance * 8.0) * 0.0025 + Math.cos(this.cumulativeDistance * 18.0) * 0.0015;
      const bermHeight = (isDrifting ? 0.027 : 0.022) + wobble;

      const leftBermHeight = powderSurfaceY + bermHeight + leftBermExtraH + driftExtraH;
      const leftBermWidth = bermWidth + leftBermExtraW + driftExtraW;
      const leftShoulderY = rutFloorY + (leftBermHeight - rutFloorY) * 0.58;

      const rightBermHeight = powderSurfaceY + bermHeight + rightBermExtraH + driftExtraH;
      const rightBermWidth = bermWidth + rightBermExtraW + driftExtraW;
      const rightShoulderY = rutFloorY + (rightBermHeight - rutFloorY) * 0.58;

      const medianY = powderSurfaceY + 0.012;
      const innerShoulderY = rutFloorY + (medianY - rutFloorY) * 0.55;

      const prevSlot = this.headSlot;
      const writeSlot = (this.headSlot + 1) % this.maxSegments;
      this.headSlot = writeSlot;
      if (this.segCount < this.maxSegments) {
        this.segCount++;
      }
      if (prevSlot < 0 || isJumpLanding) {
        this.currentRunLen = 1;
      } else {
        this.currentRunLen = Math.min(this.currentRunLen + 1, this.maxSegments);
      }

      const indexAttr = this.geometry.getIndex() as THREE.BufferAttribute;
      indexAttr.clearUpdateRanges();
      let indexDirty = false;
      if (prevSlot >= 0) {
        if (isJumpLanding) {
          this.segmentGaps[prevSlot] = 1;
          this.setSegmentIndices(prevSlot, false);
        } else {
          this.segmentGaps[prevSlot] = 0;
          this.setSegmentIndices(prevSlot, true);
        }
        indexAttr.addUpdateRange(prevSlot * this.INDICES_PER_SEG, this.INDICES_PER_SEG);
        indexDirty = true;
      }
      if (this.segCount === this.maxSegments) {
        this.segmentGaps[writeSlot] = 1;
        this.setSegmentIndices(writeSlot, false);
        indexAttr.addUpdateRange(writeSlot * this.INDICES_PER_SEG, this.INDICES_PER_SEG);
        indexDirty = true;
      }
      if (indexDirty) {
        indexAttr.needsUpdate = true;
      }

      const contactX = pos.x - normal.x * 0.45;
      const contactY = pos.y - normal.y * 0.45;
      const contactZ = pos.z - normal.z * 0.45;

      const leftCenterX = contactX - right.x * 0.135;
      const leftCenterZ = contactZ - right.z * 0.135;
      const rightCenterX = contactX + right.x * 0.135;
      const rightCenterZ = contactZ + right.z * 0.135;

      const rx = right.x;
      const rz = right.z;
      const nx = normal.x;
      const ny = normal.y;
      const nz = normal.z;

      this.setNode(0, leftCenterX, leftCenterZ, -(halfWidth + leftBermWidth * 1.80), 0.007, 0.00, 0.0, 0.0);
      this.setNode(1, leftCenterX, leftCenterZ, -(halfWidth + leftBermWidth * 0.95), powderSurfaceY + 0.006 + leftBermExtraH * 0.60, 0.05, 0.70, -0.28);
      this.setNode(2, leftCenterX, leftCenterZ, -(halfWidth + leftBermWidth * 0.40), leftBermHeight, 0.10, 1.0, -0.16);
      this.setNode(3, leftCenterX, leftCenterZ, -(halfWidth + (shoulderDx + leftBermExtraW * 0.25) * 0.4), leftShoulderY, 0.15, 1.0, 0.42);
      this.setNode(4, leftCenterX, leftCenterZ, -halfWidth * 0.70, rutFloorY + 0.004, 0.20, 1.0, 0.26);
      this.setNode(5, leftCenterX, leftCenterZ, 0.0, rutFloorY, 0.27, 1.0, 0.0);
      this.setNode(6, leftCenterX, leftCenterZ, halfWidth * 0.70, rutFloorY + 0.004, 0.34, 1.0, -0.26);
      this.setNode(7, leftCenterX, leftCenterZ, halfWidth + shoulderDx * 0.3, innerShoulderY, 0.39, 1.0, -0.36);
      this.setNode(8, leftCenterX, leftCenterZ, halfWidth + shoulderDx * 0.8, medianY * 0.92, 0.44, 1.0, -0.16);
      this.setNode(9, (leftCenterX + rightCenterX) * 0.5, (leftCenterZ + rightCenterZ) * 0.5, 0.0, medianY, 0.50, 1.0, 0.0);
      this.setNode(10, rightCenterX, rightCenterZ, -(halfWidth + shoulderDx * 0.8), medianY * 0.92, 0.56, 1.0, 0.16);
      this.setNode(11, rightCenterX, rightCenterZ, -(halfWidth + shoulderDx * 0.3), innerShoulderY, 0.61, 1.0, 0.36);
      this.setNode(12, rightCenterX, rightCenterZ, -halfWidth * 0.70, rutFloorY + 0.004, 0.66, 1.0, 0.26);
      this.setNode(13, rightCenterX, rightCenterZ, 0.0, rutFloorY, 0.73, 1.0, 0.0);
      this.setNode(14, rightCenterX, rightCenterZ, halfWidth * 0.70, rutFloorY + 0.004, 0.80, 1.0, -0.26);
      this.setNode(15, rightCenterX, rightCenterZ, halfWidth + (shoulderDx + rightBermExtraW * 0.25) * 0.4, rightShoulderY, 0.85, 1.0, -0.42);
      this.setNode(16, rightCenterX, rightCenterZ, halfWidth + rightBermWidth * 0.40, rightBermHeight, 0.90, 1.0, 0.16);
      this.setNode(17, rightCenterX, rightCenterZ, halfWidth + rightBermWidth * 0.95, powderSurfaceY + 0.006 + rightBermExtraH * 0.60, 0.95, 0.70, 0.28);
      this.setNode(18, rightCenterX, rightCenterZ, halfWidth + rightBermWidth * 1.80, 0.007, 1.00, 0.0, 0.0);

      const baseVert = writeSlot * this.VERTS_PER_SEG;
      for (let i = 0; i < this.VERTS_PER_SEG; i++) {
        const cx = this._nodeCx[i];
        const cz = this._nodeCz[i];
        const lat = this._nodeLat[i];
        const h = this._nodeH[i];

        const px = cx + rx * lat + nx * h;
        const pz = cz + rz * lat + nz * h;
        const groundY = this.terrainSampler ? this.terrainSampler(px, pz) : contactY;
        const py = groundY + ny * h;

        const vIdx = (baseVert + i) * 3;
        this.basePositions[vIdx + 0] = px;
        this.basePositions[vIdx + 1] = py;
        this.basePositions[vIdx + 2] = pz;
        this.positions[vIdx + 0] = px;
        this.positions[vIdx + 1] = py;
        this.positions[vIdx + 2] = pz;

        const wallTilt = this._nodeWallTilt[i];
        const normX = nx + rx * wallTilt;
        const normY = ny;
        const normZ = nz + rz * wallTilt;
        const invLen = 1.0 / Math.sqrt(normX * normX + normY * normY + normZ * normZ);

        this.normals[vIdx + 0] = normX * invLen;
        this.normals[vIdx + 1] = normY * invLen;
        this.normals[vIdx + 2] = normZ * invLen;

        const uvIdx = (baseVert + i) * 2;
        this.uvs[uvIdx + 0] = this._nodeU[i];
        this.uvs[uvIdx + 1] = this.cumulativeDistance * 0.8;

        const a = this._nodeAlpha[i];
        this.baseAlphas[baseVert + i] = a;
        this.alphas[baseVert + i] = a;
      }

      const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
      const normAttr = this.geometry.attributes.normal as THREE.BufferAttribute;
      const uvAttr = this.geometry.attributes.uv as THREE.BufferAttribute;

      posAttr.clearUpdateRanges();
      normAttr.clearUpdateRanges();
      uvAttr.clearUpdateRanges();
      alphaAttr.clearUpdateRanges();

      posAttr.addUpdateRange(baseVert * 3, this.VERTS_PER_SEG * 3);
      normAttr.addUpdateRange(baseVert * 3, this.VERTS_PER_SEG * 3);
      uvAttr.addUpdateRange(baseVert * 2, this.VERTS_PER_SEG * 2);
      alphaAttr.addUpdateRange(baseVert, this.VERTS_PER_SEG);

      this.taperActiveRun(posAttr, alphaAttr);

      posAttr.needsUpdate = true;
      normAttr.needsUpdate = true;
      uvAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;

      const activeSegs = this.segCount < this.maxSegments ? Math.max(0, this.segCount - 1) : this.maxSegments;
      this.geometry.setDrawRange(0, activeSegs * this.INDICES_PER_SEG);

      this.decayTrail(alphaAttr);
      return;
    }

    alphaAttr.clearUpdateRanges();
    this.decayTrail(alphaAttr);
  }

  private decayTrail(alphaAttr: THREE.BufferAttribute): void {
    const fadeThreshold = 950;
    if (this.segCount <= fadeThreshold) return;

    const fadeLen = this.segCount - fadeThreshold;
    const oldestSlot = this.segCount < this.maxSegments
      ? 0
      : (this.headSlot + 1) % this.maxSegments;

    let anyUpdated = false;
    for (let k = 0; k < fadeLen; k++) {
      const slot = (oldestSlot + k) % this.maxSegments;
      const segAlpha = k / fadeLen;
      const offset = slot * this.VERTS_PER_SEG;
      for (let v = 1; v < this.VERTS_PER_SEG - 1; v++) {
        const idx = offset + v;
        if (this.alphas[idx] > segAlpha) {
          this.baseAlphas[idx] = Math.min(this.baseAlphas[idx], segAlpha);
          this.alphas[idx] = Math.min(this.alphas[idx], segAlpha);
          anyUpdated = true;
        }
      }
    }

    if (anyUpdated) {
      const firstLen = Math.min(fadeLen, this.maxSegments - oldestSlot);
      alphaAttr.addUpdateRange(oldestSlot * this.VERTS_PER_SEG, firstLen * this.VERTS_PER_SEG);
      const rem = fadeLen - firstLen;
      if (rem > 0) {
        alphaAttr.addUpdateRange(0, rem * this.VERTS_PER_SEG);
      }
      alphaAttr.needsUpdate = true;
    }
  }

  public dispose(scene?: THREE.Scene): void {
    if (scene) {
      scene.remove(this.mesh);
    } else if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.geometry.dispose();
  }
}
