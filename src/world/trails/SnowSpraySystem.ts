import * as THREE from 'three';

export interface SnowSprayParams {
  posX: number;
  posY: number;
  posZ: number;
  fwdX: number;
  fwdY: number;
  fwdZ: number;
  rightX: number;
  rightY: number;
  rightZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  speed: number;
  leanAngle: number;
  slipAngleDeg: number;
  vLateral: number;
  isGrounded: boolean;
  isDrifting: boolean;
  isSharpTurn: boolean;
  sphereRadius: number;
}

export class SnowSpraySystem {
  public readonly points: THREE.Points;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.ShaderMaterial;
  private readonly count: number;

  private readonly positions: Float32Array;
  private readonly velocities: Float32Array;
  private readonly lifetimes: Float32Array;
  private readonly maxLifetimes: Float32Array;
  private readonly baseSizes: Float32Array;
  private readonly sizes: Float32Array;
  private readonly alphas: Float32Array;
  private readonly seeds: Float32Array;

  private readonly posAttr: THREE.BufferAttribute;
  private readonly sizeAttr: THREE.BufferAttribute;
  private readonly alphaAttr: THREE.BufferAttribute;

  private cursor = 0;
  private emitAccumulator = 0;

  constructor(scene: THREE.Scene, count: number = 520) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.lifetimes = new Float32Array(count);
    this.maxLifetimes = new Float32Array(count);
    this.baseSizes = new Float32Array(count);
    this.sizes = new Float32Array(count);
    this.alphas = new Float32Array(count);
    this.seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.positions[i * 3 + 1] = -9999;
      this.lifetimes[i] = 0;
      this.maxLifetimes[i] = 1;
      this.sizes[i] = 0;
      this.alphas[i] = 0;
      this.seeds[i] = Math.random();
    }

    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr = new THREE.BufferAttribute(this.sizes, 1);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.alphaAttr = new THREE.BufferAttribute(this.alphas, 1);
    this.alphaAttr.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('aSize', this.sizeAttr);
    this.geometry.setAttribute('aAlpha', this.alphaAttr);
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));

    const initialVpH = typeof window !== 'undefined'
      ? window.innerHeight * Math.min(window.devicePixelRatio || 1, 2)
      : 1080;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xffffff) },
        uShadowTint: { value: new THREE.Color(0xdce6f4) },
        uViewportHeight: { value: initialVpH }
      },
      vertexShader: /* glsl */ `
        uniform float uViewportHeight;
        attribute float aSize;
        attribute float aAlpha;
        attribute float aSeed;
        varying float vAlpha;
        varying float vSeed;

        void main() {
          vAlpha = aAlpha;
          vSeed = aSeed;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float dist = max(0.5, -mvPosition.z);
          float pxSize = aSize * uViewportHeight * 0.5 * projectionMatrix[1][1] / dist;
          gl_PointSize = clamp(pxSize, 1.0, 56.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uShadowTint;
        varying float vAlpha;
        varying float vSeed;

        void main() {
          if (vAlpha <= 0.002) discard;
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float r = length(p);
          if (r > 1.0) discard;

          float shape;
          vec3 col;
          if (vSeed < 0.52) {
            // Soft powdery snow-cloud / smoke puff (dense milky mist core, ultra-soft edge)
            float wisp = 1.0 + 0.16 * sin(p.x * 5.2 + vSeed * 43.0) * cos(p.y * 5.2 - vSeed * 27.0);
            float gauss = exp(-r * r * 2.8 * wisp);
            shape = gauss * smoothstep(1.0, 0.25, r) * 0.62;
            float topLight = clamp(0.42 + p.y * 0.58, 0.0, 1.0);
            col = mix(uShadowTint, uColor, topLight);
          } else {
            // Tiny crisp airborne powder grain
            float dotFalloff = smoothstep(1.0, 0.10, r);
            shape = dotFalloff * dotFalloff * 0.92;
            col = uColor * 1.15;
          }

          float alpha = shape * vAlpha;
          if (alpha <= 0.002) discard;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.castShadow = false;
    this.points.receiveShadow = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
  }

  public setVisible(visible: boolean): void {
    this.points.visible = visible;
  }

  public setLightingColor(sunColor?: THREE.Color): void {
    if (sunColor) {
      this.material.uniforms.uColor.value.copy(sunColor).lerp(_whiteSnowTint, 0.72);
      this.material.uniforms.uShadowTint.value.copy(sunColor).lerp(_coolShadowTint, 0.78);
    }
  }

  public emitCrashBurst(posX: number, posY: number, posZ: number, sphereRadius: number): void {
    const burstCount = Math.min(40, Math.floor(this.count * 0.12));
    for (let e = 0; e < burstCount; e++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.count;
      const isMist = this.seeds[i] < 0.42;
      const life = isMist ? (0.45 + Math.random() * 0.30) : (0.35 + Math.random() * 0.25);

      this.lifetimes[i] = life;
      this.maxLifetimes[i] = life;
      this.baseSizes[i] = isMist ? (0.16 + Math.random() * 0.12) : (0.032 + Math.random() * 0.042);
      this.sizes[i] = this.baseSizes[i];
      this.alphas[i] = 0.2;

      const idx = i * 3;
      this.positions[idx] = posX + (Math.random() - 0.5) * 0.8;
      this.positions[idx + 1] = posY - sphereRadius + 0.08;
      this.positions[idx + 2] = posZ + (Math.random() - 0.5) * 0.8;

      this.velocities[idx] = (Math.random() - 0.5) * 4.8;
      this.velocities[idx + 1] = 1.4 + Math.random() * 2.4;
      this.velocities[idx + 2] = (Math.random() - 0.5) * 4.8;
    }
  }

  public update(dt: number, params: SnowSprayParams): void {
    if (typeof window !== 'undefined') {
      this.material.uniforms.uViewportHeight.value =
        window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
    }

    let anyDirty = false;

    if (params.isGrounded && params.speed > 2.5) {
      // Speed factor: 0 below 2.5 m/s, ramps smoothly up to ~19 m/s
      const speedNorm = THREE.MathUtils.clamp((params.speed - 2.5) / 16.5, 0.0, 1.0);
      // Carve-angle factor from steering/lean angle and lateral slip angle
      const carveFactor = THREE.MathUtils.clamp((Math.abs(params.leanAngle) - 0.12) / 0.88, 0.0, 1.0);
      const slipFactor = THREE.MathUtils.clamp((Math.abs(params.slipAngleDeg) - 6.0) / 34.0, 0.0, 1.0);
      const angleFactor = Math.max(carveFactor, slipFactor);

      if (speedNorm > 0.01 && angleFactor > 0.01) {
        const isSliding = params.isDrifting || Math.abs(params.slipAngleDeg) > 26.0;
        const styleMult = isSliding ? 1.45 : (params.isSharpTurn ? 1.12 : 0.85);
        const scaledCurve = Math.pow(speedNorm, 0.95) * Math.pow(angleFactor, 1.10);
        const intensity = Math.min(1.0, (0.06 + 0.94 * scaledCurve) * styleMult);

        // High-speed slide reaches ~860 fine/mist particles/s; low speed & shallow angle scales softly down to ~25-45/s
        const particlesPerSec = intensity * (isSliding ? 860.0 : 520.0);
        this.emitAccumulator += particlesPerSec * dt;
        const emitCount = Math.min(22, Math.floor(this.emitAccumulator));
        this.emitAccumulator -= emitCount;

        if (emitCount > 0) {
          anyDirty = true;
          const absLat = Math.abs(params.vLateral);
          const scrubSign = params.vLateral !== 0
            ? Math.sign(params.vLateral)
            : (params.leanAngle >= 0 ? -1 : 1);
          const outsideSkiSign = params.leanAngle > 0 ? -1 : (params.leanAngle < 0 ? 1 : scrubSign);

          // Exact ski-base contact on terrain surface + slight clearance along slope normal so particles never spawn underground
          const groundOffset = params.sphereRadius - 0.14;
          const baseX = params.posX - params.normalX * groundOffset;
          const baseY = params.posY - params.normalY * groundOffset;
          const baseZ = params.posZ - params.normalZ * groundOffset;

          if (isSliding) {
            const scrubX = params.rightX * scrubSign * 0.90 - params.fwdX * 0.25;
            const scrubZ = params.rightZ * scrubSign * 0.90 - params.fwdZ * 0.25;
            const scrubLen = Math.hypot(scrubX, scrubZ) || 1.0;
            const normScrubX = scrubX / scrubLen;
            const normScrubZ = scrubZ / scrubLen;
            const latScale = 1.0 + Math.min(1.0, absLat / 10.0) * 0.60;

            for (let e = 0; e < emitCount; e++) {
              const i = this.cursor;
              this.cursor = (this.cursor + 1) % this.count;
              const isMist = this.seeds[i] < 0.52;
              const life = isMist
                ? (0.54 + Math.random() * 0.38) * (0.76 + 0.36 * intensity)
                : (0.38 + Math.random() * 0.30) * (0.76 + 0.36 * intensity);

              this.lifetimes[i] = life;
              this.maxLifetimes[i] = life;
              this.baseSizes[i] = isMist
                ? (0.14 + Math.random() * 0.12) * (0.78 + 0.48 * intensity)
                : (0.023 + Math.random() * 0.032) * (0.80 + 0.40 * intensity);
              this.sizes[i] = this.baseSizes[i];
              this.alphas[i] = 0.0;

              const idx = i * 3;
              const skiDist = (Math.random() - 0.5) * 0.92;
              const edgeOffset = scrubSign * (0.08 + Math.random() * 0.16);
              const liftJitter = Math.random() * 0.08;
              this.positions[idx] = baseX + params.fwdX * skiDist + params.rightX * edgeOffset + params.normalX * liftJitter;
              this.positions[idx + 1] = baseY + params.normalY * liftJitter;
              this.positions[idx + 2] = baseZ + params.fwdZ * skiDist + params.rightZ * edgeOffset + params.normalZ * liftJitter;

              const fanAngle = (Math.random() - 0.5) * 0.82;
              const cosA = Math.cos(fanAngle);
              const sinA = Math.sin(fanAngle);
              const fanDirX = normScrubX * cosA - normScrubZ * sinA;
              const fanDirZ = normScrubX * sinA + normScrubZ * cosA;

              const baseOutward = isMist
                ? (1.45 + Math.random() * 2.1)
                : (2.1 + Math.random() * 3.1);
              const plumeSpeed = baseOutward * (0.54 + 0.72 * intensity) * latScale;
              this.velocities[idx] = fanDirX * plumeSpeed;
              this.velocities[idx + 1] = (isMist ? (1.75 + Math.random() * 2.0) : (2.25 + Math.random() * 2.7)) * (0.58 + 0.66 * intensity);
              this.velocities[idx + 2] = fanDirZ * plumeSpeed;
            }
          } else {
            for (let e = 0; e < emitCount; e++) {
              const i = this.cursor;
              this.cursor = (this.cursor + 1) % this.count;
              const isMist = this.seeds[i] < 0.52;
              const side = e % 4 === 0 ? -outsideSkiSign : outsideSkiSign;
              const isOutside = side === outsideSkiSign;

              const life = isMist
                ? (0.44 + Math.random() * 0.30) * (0.74 + 0.36 * intensity)
                : (0.32 + Math.random() * 0.26) * (0.74 + 0.36 * intensity);

              this.lifetimes[i] = life;
              this.maxLifetimes[i] = life;
              this.baseSizes[i] = isMist
                ? (0.13 + Math.random() * 0.10) * (0.75 + 0.45 * intensity)
                : (0.022 + Math.random() * 0.030) * (0.78 + 0.38 * intensity);
              this.sizes[i] = this.baseSizes[i];
              this.alphas[i] = 0.0;

              const idx = i * 3;
              const skiPosOffset = side * 0.114 + (side > 0 ? 0.02 : -0.02);
              const tailPosOffset = -0.50 + (Math.random() - 0.5) * 0.40;
              const liftJitter = Math.random() * 0.08;
              this.positions[idx] = baseX + params.rightX * skiPosOffset + params.fwdX * tailPosOffset + params.normalX * liftJitter;
              this.positions[idx + 1] = baseY + params.normalY * liftJitter;
              this.positions[idx + 2] = baseZ + params.rightZ * skiPosOffset + params.fwdZ * tailPosOffset + params.normalZ * liftJitter;

              const peelFactor = isOutside ? 1.55 : 0.85;
              const latSpeed = side * (1.1 + Math.random() * 1.75) * peelFactor * (0.50 + 0.72 * intensity);
              const backSpeed = -(0.65 + Math.random() * 0.95);
              const liftSpeed = (isMist ? (1.15 + Math.random() * 1.55) : (1.55 + Math.random() * 2.15)) * (0.52 + 0.68 * intensity);

              this.velocities[idx] = params.rightX * latSpeed + params.fwdX * backSpeed;
              this.velocities[idx + 1] = liftSpeed;
              this.velocities[idx + 2] = params.rightZ * latSpeed + params.fwdZ * backSpeed;
            }
          }
        }
      } else {
        this.emitAccumulator = 0;
      }
    } else {
      this.emitAccumulator = 0;
    }

    // Integrate active particles with air drag & gentle mist billowing
    const mistHorizDrag = Math.exp(-2.6 * dt);
    const mistVertDrag = Math.exp(-1.4 * dt);
    const grainDrag = Math.exp(-1.6 * dt);

    for (let i = 0; i < this.count; i++) {
      if (this.lifetimes[i] > 0) {
        this.lifetimes[i] -= dt;
        const idx = i * 3;
        if (this.lifetimes[i] <= 0) {
          this.positions[idx + 1] = -9999;
          this.alphas[i] = 0;
          this.sizes[i] = 0;
        } else {
          const isMist = this.seeds[i] < 0.52;
          const hDrag = isMist ? mistHorizDrag : grainDrag;
          const grav = isMist ? 2.4 : 7.2;

          this.velocities[idx] *= hDrag;
          this.velocities[idx + 2] *= hDrag;
          this.velocities[idx + 1] = this.velocities[idx + 1] * (isMist ? mistVertDrag : 1.0) - grav * dt;

          this.positions[idx] += this.velocities[idx] * dt;
          this.positions[idx + 1] += this.velocities[idx + 1] * dt;
          this.positions[idx + 2] += this.velocities[idx + 2] * dt;

          const age = 1.0 - this.lifetimes[i] / this.maxLifetimes[i];
          const fadeIn = Math.min(1.0, age / 0.10);
          const fadeOut = Math.pow(Math.max(0.0, 1.0 - age), isMist ? 1.25 : 1.15);
          this.alphas[i] = fadeIn * fadeOut;

          // Mist puffs gently billow outward as they disperse; grains stay tiny
          this.sizes[i] = isMist
            ? this.baseSizes[i] * (0.95 + age * 2.05)
            : this.baseSizes[i] * (1.0 - age * 0.20);
        }
        anyDirty = true;
      }
    }

    if (anyDirty) {
      this.posAttr.needsUpdate = true;
      this.sizeAttr.needsUpdate = true;
      this.alphaAttr.needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.points);
    this.geometry.dispose();
    this.material.dispose();
  }
}

const _whiteSnowTint = new THREE.Color(0xffffff);
const _coolShadowTint = new THREE.Color(0xdce6f4);
