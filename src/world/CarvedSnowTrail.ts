import * as THREE from 'three';
import { createSnowTrailMaterial } from './SnowTrailMaterial';

export class CarvedSnowTrail {
  private readonly maxSegments = 400;
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
  private readonly emitDist = 0.18; // Distance interval between segment slices
  private wasGrounded = false;
  private cumulativeDistance = 0.0;

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
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);
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
    isDrifting: boolean
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
      // Clean carving: ~0.13m width per rut (half-width 0.065m), perfectly matching the 0.112m ski plank
      // Drift / skid turn / hockey stop: widens up to 0.26m
      const slipT = THREE.MathUtils.clamp(slipAngleDeg / 40.0, 0, 1);
      const halfWidth = isDrifting
        ? THREE.MathUtils.lerp(0.068, 0.135, Math.max(slipT, 0.55))
        : 0.064;

      const bermWidth = isDrifting ? 0.095 : 0.075;

      // 3D Depressed Rut Depth & Raised Berm Heights:
      // Base powder snow rests at +0.028m above collision pack.
      // Carved trough indents down to +0.002m (a 2.6cm - 3.4cm deep carve into soft powder).
      // Displaced snow berm pushed up to +0.054m (+0.026m above powder surface).
      const powderSurfaceY = 0.028;
      const rutDepth = isDrifting ? 0.032 : 0.028; // How deep the rut cuts below powder surface
      const rutFloorY = Math.max(0.002, powderSurfaceY - rutDepth);

      // Procedural micro-wobble giving the displaced berm an authentic churned powder contour
      const wobble = Math.sin(this.cumulativeDistance * 14.0) * 0.003 + Math.sin(this.cumulativeDistance * 6.5) * 0.002;
      const bermHeight = (isDrifting ? 0.030 : 0.026) + wobble;
      const bermY = powderSurfaceY + bermHeight;
      const medianY = powderSurfaceY + 0.012;

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
      // Skier stance: ~0.175m to left and right, perfectly matching ski binding coordinates
      const leftCenterX = contactX - right.x * 0.175;
      const leftCenterZ = contactZ - right.z * 0.175;
      const rightCenterX = contactX + right.x * 0.175;
      const rightCenterZ = contactZ + right.z * 0.175;

      // Define 19 cross-section offsets relative to left and right ski centers:
      // Format: [lateralRef (left / right / center), lateralDistFactor, normalHeightOffset, uCoord, baseColorTint]
      const rx = right.x;
      const rz = right.z;
      const nx = normal.x;
      const ny = normal.y;
      const nz = normal.z;

      // 19 cross-sectional nodes
      const nodes = [
        // 0: Outer left feather (blends into untouched terrain)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + bermWidth * 1.5), h: 0.002, u: 0.00, alpha: 0.0, isRut: false },
        // 1: Left outer berm peak (displaced powder crest)
        { cx: leftCenterX, cz: leftCenterZ, lat: -(halfWidth + bermWidth * 0.50), h: bermY, u: 0.08, alpha: 1.0, isRut: false },
        // 2: Left rut outer rim
        { cx: leftCenterX, cz: leftCenterZ, lat: -halfWidth * 1.05, h: powderSurfaceY, u: 0.16, alpha: 1.0, isRut: false },
        // 3: Left rut outer wall (steep slope downward)
        { cx: leftCenterX, cz: leftCenterZ, lat: -halfWidth * 0.65, h: rutFloorY + rutDepth * 0.35, u: 0.20, alpha: 1.0, isRut: true },
        // 4: Left rut floor outer groove (ski edge carve line)
        { cx: leftCenterX, cz: leftCenterZ, lat: -halfWidth * 0.35, h: rutFloorY * 0.85, u: 0.24, alpha: 1.0, isRut: true },
        // 5: Left rut floor center (ski base trough)
        { cx: leftCenterX, cz: leftCenterZ, lat: 0.0, h: rutFloorY, u: 0.28, alpha: 1.0, isRut: true },
        // 6: Left rut floor inner groove
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth * 0.35, h: rutFloorY * 0.85, u: 0.32, alpha: 1.0, isRut: true },
        // 7: Left rut inner wall (steep slope upward)
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth * 0.65, h: rutFloorY + rutDepth * 0.35, u: 0.36, alpha: 1.0, isRut: true },
        // 8: Left rut inner rim
        { cx: leftCenterX, cz: leftCenterZ, lat: halfWidth * 1.05, h: powderSurfaceY, u: 0.40, alpha: 1.0, isRut: false },

        // 9: Center median spine between skis
        { cx: (leftCenterX + rightCenterX) * 0.5, cz: (leftCenterZ + rightCenterZ) * 0.5, lat: 0.0, h: medianY, u: 0.50, alpha: 1.0, isRut: false },

        // 10: Right rut inner rim
        { cx: rightCenterX, cz: rightCenterZ, lat: -halfWidth * 1.05, h: powderSurfaceY, u: 0.60, alpha: 1.0, isRut: false },
        // 11: Right rut inner wall (steep slope downward)
        { cx: rightCenterX, cz: rightCenterZ, lat: -halfWidth * 0.65, h: rutFloorY + rutDepth * 0.35, u: 0.64, alpha: 1.0, isRut: true },
        // 12: Right rut floor inner groove
        { cx: rightCenterX, cz: rightCenterZ, lat: -halfWidth * 0.35, h: rutFloorY * 0.85, u: 0.68, alpha: 1.0, isRut: true },
        // 13: Right rut floor center
        { cx: rightCenterX, cz: rightCenterZ, lat: 0.0, h: rutFloorY, u: 0.72, alpha: 1.0, isRut: true },
        // 14: Right rut floor outer groove
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth * 0.35, h: rutFloorY * 0.85, u: 0.76, alpha: 1.0, isRut: true },
        // 15: Right rut outer wall (steep slope upward)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth * 0.65, h: rutFloorY + rutDepth * 0.35, u: 0.80, alpha: 1.0, isRut: true },
        // 16: Right rut outer rim
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth * 1.05, h: powderSurfaceY, u: 0.84, alpha: 1.0, isRut: false },
        // 17: Right outer berm peak (displaced powder crest)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + bermWidth * 0.50, h: bermY, u: 0.92, alpha: 1.0, isRut: false },
        // 18: Outer right feather (blends into untouched terrain)
        { cx: rightCenterX, cz: rightCenterZ, lat: halfWidth + bermWidth * 1.5, h: 0.002, u: 1.00, alpha: 0.0, isRut: false }
      ];

      // Populate new slice at index 0..18
      for (let i = 0; i < this.VERTS_PER_SEG; i++) {
        const node = nodes[i];
        const px = node.cx + rx * node.lat + nx * node.h;
        const py = contactY + ny * node.h;
        const pz = node.cz + rz * node.lat + nz * node.h;

        const vIdx = i * 3;
        this.positions[vIdx + 0] = px;
        this.positions[vIdx + 1] = py;
        this.positions[vIdx + 2] = pz;

        // Calculate 3D surface normal:
        // Sloped rut walls tilt strongly towards or away from lateral axis:
        // Node 3, 11 (sloping down to the right): normal tilts up and left (-R)
        // Node 7, 15 (sloping up to the right): normal tilts up and right (+R)
        let wallTilt = 0.0;
        if (i === 3 || i === 11) wallTilt = -0.85; // Leftward-pointing normal
        else if (i === 7 || i === 15) wallTilt = 0.85; // Rightward-pointing normal
        else if (i === 1) wallTilt = -0.42; // Outer berm crest
        else if (i === 17) wallTilt = 0.42;

        const normX = nx + rx * wallTilt;
        const normY = ny;
        const normZ = nz + rz * wallTilt;
        const invLen = 1.0 / Math.sqrt(normX * normX + normY * normY + normZ * normZ);

        this.normals[vIdx + 0] = normX * invLen;
        this.normals[vIdx + 1] = normY * invLen;
        this.normals[vIdx + 2] = normZ * invLen;

        // Vertex color:
        // Rut cavity compressed snow has cool blue-grey crystalline tint (#8faecc)
        // Outer berm powder has soft ivory tone (#fff8f2)
        if (node.isRut) {
          this.colors[vIdx + 0] = 0.86;
          this.colors[vIdx + 1] = 0.91;
          this.colors[vIdx + 2] = 0.96;
        } else {
          this.colors[vIdx + 0] = 0.995;
          this.colors[vIdx + 1] = 0.985;
          this.colors[vIdx + 2] = 0.975;
        }

        const uvIdx = i * 2;
        this.uvs[uvIdx + 0] = node.u;
        this.uvs[uvIdx + 1] = this.cumulativeDistance * 0.8;

        // Touchdown handling: zero alpha across air gaps
        this.alphas[i] = isFreshTouchdown ? 0.0 : node.alpha;
      }

      this.count = Math.min(this.count + 1, this.maxSegments);
      this.notifyGeometryUpdate();
    }

    this.decayTrail();
  }

  private decayTrail(): void {
    if (this.count <= 0) return;

    // Smooth exponential decay of older trail segments (fade over 70m-90m)
    let needsUpdate = false;
    for (let i = 0; i < this.count * this.VERTS_PER_SEG; i++) {
      if (this.alphas[i] > 0.005) {
        this.alphas[i] *= 0.9992;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.geometry.attributes.aAlpha.needsUpdate = true;
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
