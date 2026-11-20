import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TrickEngine } from './player/TrickEngine';
import { SurfaceType, TerrainSample } from './world/alpineHeightfield';
import { GmaPlayerPhysics } from './mechanics/GmaPlayerPhysics';
import { SportType, TurnType, MovementState } from './mechanics/GmaConfig';
import { InputState } from './mechanics/ControlsProcessor';

class SnowAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private initialized = false;

  public init(): void {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.22;
      }
      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'bandpass';
      this.filter.frequency.value = 950;
      this.filter.Q.value = 1.3;

      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0.0;

      this.noiseNode.connect(this.filter);
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      this.noiseNode.start(0);
      this.initialized = true;
    } catch {
      // Audio autoplay restrictions or headless environment
    }
  }

  public playLandThump(isClean: boolean): void {
    if (!this.initialized || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      const thumpFilter = this.ctx.createBiquadFilter();

      thumpFilter.type = 'lowpass';
      thumpFilter.frequency.value = isClean ? 180 : 120;

      osc.type = isClean ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isClean ? 90 : 65, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.14);

      thumpGain.gain.setValueAtTime(isClean ? 0.35 : 0.50, this.ctx.currentTime);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(thumpFilter);
      thumpFilter.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {
      // Headless / restricted
    }
  }

  public playPolePlant(): void {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Procedural hardpack snow pole jab click: short crisp transient noise click
      const sampleCount = Math.floor(this.ctx.sampleRate * 0.035);
      const buffer = this.ctx.createBuffer(1, sampleCount, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        const decay = Math.exp(-i / (this.ctx.sampleRate * 0.005));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = buffer;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(3200 + Math.random() * 400, now);
      clickFilter.Q.setValueAtTime(3.6, now);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.26, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      // Low resonant tap of pole basket striking crust
      const tapOsc = this.ctx.createOscillator();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(240, now);
      tapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.045);

      const tapGain = this.ctx.createGain();
      tapGain.gain.setValueAtTime(0.16, now);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      clickSrc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      tapOsc.connect(tapGain);
      tapGain.connect(this.ctx.destination);

      clickSrc.start(now);
      tapOsc.start(now);
      clickSrc.stop(now + 0.04);
      tapOsc.stop(now + 0.05);
    } catch {
      // Audio restricted
    }
  }

  public update(speed: number, vLateral: number, isGrounded: boolean, isDrifting: boolean = false, gripUtilization: number = 0): void {
    if (!this.initialized || !this.ctx || !this.gain || !this.filter) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!isGrounded || speed < 0.5) {
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      return;
    }
    const absLat = Math.abs(vLateral);
    if (isDrifting) {
      // Skid / Drift / Snowplow: deep hollow rushing white noise plowing sound (380 Hz – 1030 Hz)
      const latT = Math.min(1.0, absLat / 7.0);
      const speedT = Math.min(1.0, speed / 30.0);
      const targetGain = Math.min(0.35, 0.09 + speedT * 0.14 + latT * 0.18);
      const targetFreq = 380 + Math.min(650, speedT * 420 + latT * 230); // 380 Hz to 1030 Hz
      this.filter.Q.setTargetAtTime(1.1, this.ctx.currentTime, 0.04);
      this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.03);
    } else {
      // Clean Carve: high-frequency bandpass slicing sound (950 Hz – 3150 Hz) proportional to edge bite and speed
      const biteT = THREE.MathUtils.clamp(gripUtilization, 0, 1);
      const speedT = THREE.MathUtils.clamp(speed / 35.0, 0, 1);
      const factor = THREE.MathUtils.clamp(0.40 * speedT + 0.60 * biteT, 0, 1);
      let targetFreq = 950 + 2200 * factor; // 950 Hz to 3150 Hz
      let targetGain = Math.min(0.24, (0.04 + 0.16 * speedT) * (0.6 + 0.4 * biteT));

      // Edge-Bite Limit Audio Cue: subtle high-frequency board chatter between 80% and 100% grip limit
      if (gripUtilization > 0.80) {
        const chatterT = THREE.MathUtils.clamp((gripUtilization - 0.80) / 0.20, 0, 1);
        targetFreq = THREE.MathUtils.lerp(targetFreq, 3150, chatterT * 0.5);
        targetGain += chatterT * 0.06;
      }

      this.filter.Q.setTargetAtTime(1.6, this.ctx.currentTime, 0.04);
      this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.04);
    }
  }
}

export class SnowTrailRibbon {
  private readonly maxSegments = 400;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly mesh: THREE.Mesh;
  private count = 0;
  private lastEmitPos = new THREE.Vector3(9999, 9999, 9999);
  private readonly emitDist = 0.28;
  private wasGrounded = false;

  constructor(scene: THREE.Scene) {
    // 4 vertices per segment (2 for left ski track, 2 for right ski track)
    this.positions = new Float32Array(this.maxSegments * 4 * 3);
    this.colors = new Float32Array(this.maxSegments * 4 * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Two distinct quad strips: Left track and Right track
    const indices = new Uint32Array((this.maxSegments - 1) * 12);
    let idx = 0;
    for (let i = 0; i < this.maxSegments - 1; i++) {
      // Left ski ribbon quad
      const la = i * 4;
      const lb = i * 4 + 1;
      const lc = (i + 1) * 4;
      const ld = (i + 1) * 4 + 1;
      indices[idx++] = la;
      indices[idx++] = lc;
      indices[idx++] = lb;
      indices[idx++] = lb;
      indices[idx++] = lc;
      indices[idx++] = ld;

      // Right ski ribbon quad
      const ra = i * 4 + 2;
      const rb = i * 4 + 3;
      const rc = (i + 1) * 4 + 2;
      const rd = (i + 1) * 4 + 3;
      indices[idx++] = ra;
      indices[idx++] = rc;
      indices[idx++] = rb;
      indices[idx++] = rb;
      indices[idx++] = rc;
      indices[idx++] = rd;
    }
    geo.setIndex(new THREE.BufferAttribute(indices, 1));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  public reset(): void {
    this.count = 0;
    this.wasGrounded = false;
    this.lastEmitPos.set(9999, 9999, 9999);
    for (let i = 0; i < this.positions.length; i++) {
      this.positions[i] = 0;
      this.colors[i] = 0;
    }
    (this.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.mesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
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
    if (!isGrounded || speed < 0.8) {
      this.wasGrounded = false;
      // Persistent trail mesh vertex decay rate (0.9985)
      if (this.count > 0) {
        for (let i = 0; i < this.colors.length; i++) {
          this.colors[i] *= 0.9985;
        }
        (this.mesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
      }
      return;
    }

    const dist = pos.distanceTo(this.lastEmitPos);
    if (dist >= this.emitDist) {
      const isFreshTouchdown = !this.wasGrounded || dist > 2.2;
      this.lastEmitPos.copy(pos);
      this.wasGrounded = true;

      // Ribbon width: razor-thin (0.03m) during pure carving, smeared wide plume (0.35m) during slide turns & snowplow braking
      const slipT = THREE.MathUtils.clamp(slipAngleDeg / 42.0, 0, 1);
      const width = isDrifting ? THREE.MathUtils.lerp(0.14, 0.35, Math.max(slipT, 0.6)) : 0.03;
      const halfWidth = width * 0.5;

      // Color/tone: subtle icy cyan-grey for carving groove (#9bbad6), bright soft white for smeared powder plume
      const baseR = isDrifting ? 0.90 : 0.62;
      const baseG = isDrifting ? 0.94 : 0.74;
      const baseB = isDrifting ? 0.98 : 0.86;

      const liftX = normal.x * 0.035;
      const liftY = normal.y * 0.035;
      const liftZ = normal.z * 0.035;
      const groundContactY = pos.y - 0.44;

      // Shift existing vertices to prevent ring-buffer seams and air-gap bridging
      const stride = 12; // 4 vertices * 3 floats
      this.positions.copyWithin(stride, 0, (this.maxSegments - 1) * stride);
      this.colors.copyWithin(stride, 0, (this.maxSegments - 1) * stride);

      // Left ski track: offset -0.20m along right vector
      const leftCenterX = pos.x - right.x * 0.20;
      const leftCenterZ = pos.z - right.z * 0.20;

      // Right ski track: offset +0.20m along right vector
      const rightCenterX = pos.x + right.x * 0.20;
      const rightCenterZ = pos.z + right.z * 0.20;

      // Left ski ribbon vertices (vL0, vL1)
      this.positions[0] = leftCenterX + right.x * halfWidth + liftX;
      this.positions[1] = groundContactY + liftY;
      this.positions[2] = leftCenterZ + right.z * halfWidth + liftZ;

      this.positions[3] = leftCenterX - right.x * halfWidth + liftX;
      this.positions[4] = groundContactY + liftY;
      this.positions[5] = leftCenterZ - right.z * halfWidth + liftZ;

      // Right ski ribbon vertices (vR0, vR1)
      this.positions[6] = rightCenterX + right.x * halfWidth + liftX;
      this.positions[7] = groundContactY + liftY;
      this.positions[8] = rightCenterZ + right.z * halfWidth + liftZ;

      this.positions[9] = rightCenterX - right.x * halfWidth + liftX;
      this.positions[10] = groundContactY + liftY;
      this.positions[11] = rightCenterZ - right.z * halfWidth + liftZ;

      if (isFreshTouchdown) {
        // Zero color alpha on fresh touchdown to avoid bridging across air jumps
        for (let k = 0; k < stride; k++) {
          this.colors[k] = 0;
        }
      } else {
        for (let k = 0; k < 4; k++) {
          this.colors[k * 3 + 0] = baseR;
          this.colors[k * 3 + 1] = baseG;
          this.colors[k * 3 + 2] = baseB;
        }
      }

      this.count = Math.min(this.count + 1, this.maxSegments);
      (this.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.mesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }

    // Persistent trail mesh vertex decay rate (0.9985)
    if (this.count > 0) {
      for (let i = 0; i < this.colors.length; i++) {
        this.colors[i] *= 0.9985;
      }
      (this.mesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }
}

export interface SkierInput {
  forward: boolean; // W / Up: pole staking push on flats/uphills + aero tuck
  brake: boolean;   // S / Down: dig edges to brake / snowplow wedge
  left: boolean;    // A / Left: carve left / air spin left
  right: boolean;   // D / Right: carve right / air spin right
  jump: boolean;    // Space: instantaneous vertical pop (4.0 m/s)
  grab?: boolean;   // J / Gamepad RB: ski grab (Safety Grab)
  sharpTurn?: boolean; // Q / Shift / Gamepad X: Sharp carve mode (50 deg cap)
  slideTurn?: boolean; // E / Gamepad B: Slide / drift turn mode (+2m/s boost)
  tackle?: boolean;    // F / Gamepad Y: Shoulder tackle / Pole slap
  steerX?: number;     // Analog steering input (-1.0 to +1.0)
  trickSpinX?: number;
  trickFlipY?: number;
  trickRoll?: number;
}
export type BoarderInput = SkierInput;

export interface BoarderConfig {
  mass: number;
  sphereRadius: number;
  gravity: number;
  sidecutRadius: number;       // Physical snowboard edge sidecut radius (m)
  baseFriction: number;        // Low forward glide friction on snow
  powderFriction: number;      // Extra friction when off-piste
  edgeGrip: number;            // Lateral carving resistance bite
  gripTransfer: number;        // GMA secret: % of stopped lateral slide redirected forward (0.75)
  driftAngleThreshold: number; // Slip angle threshold in radians (~37 deg)
  carveSpeedBleed: number;     // Speed lost when drifting/skidding hard
  brakeDrag: number;           // Extra drag when holding S
  airDrag: number;             // Quadratic aero drag (sets terminal velocity)
  tuckAirDrag: number;         // Reduced aero drag when tucking (holding W at speed)
  pushAccel: number;           // Weak flat-ground push acceleration
  maxPushSpeed: number;        // Max speed achievable by pushing on flat ground
  turnRate: number;            // Base yaw rad/s
  maxPumpBoost: number;        // Boost impulse magnitude on rhythmic edge transition
  maxPumpSpeed: number;        // Soft speed cap for rhythm pumping
  chargeRate: number;          // Carve charge buildup rate during deep turns
  jumpImpulseMin: number;
  jumpImpulseMax: number;
}

const DEFAULT_CONFIG: BoarderConfig = {
  mass: 75,
  sphereRadius: 0.45,
  gravity: 14.5,
  sidecutRadius: 8.2,          // Authentic Grand Mountain Adventure ~8m sidecut
  baseFriction: 0.018,         // Slick, fast glide on groomed snow
  powderFriction: 0.040,
  edgeGrip: 12.0,
  gripTransfer: 0.85,          // High edge grip transfer during carve
  driftAngleThreshold: 0.645,  // ~37 degrees slip angle threshold in radians
  carveSpeedBleed: 0.45,
  brakeDrag: 9.0,
  airDrag: 0.008,
  tuckAirDrag: 0.004,
  pushAccel: 4.5,
  maxPushSpeed: 5.5,
  turnRate: 3.0,
  maxPumpBoost: 2.5,           // Boost impulse magnitude on rhythmic edge transition
  maxPumpSpeed: 14.0,          // Soft speed cap for rhythm pumping
  chargeRate: 2.4,             // Edge-pressure charge buildup rate during deep turns
  jumpImpulseMin: 5.8,
  jumpImpulseMax: 9.2,
};

export class Skier {
  public readonly rigidBody: RAPIER.RigidBody;
  public readonly collider: RAPIER.Collider;
  public readonly root: THREE.Group;
  public readonly trickEngine: TrickEngine;
  public readonly gmaPhysics: GmaPlayerPhysics;

  // Procedural rig hierarchy
  private readonly visualRoot = new THREE.Group();
  private readonly skisGroup = new THREE.Group();
  private readonly polesGroup = new THREE.Group();
  private readonly hipsGroup = new THREE.Group();
  private readonly torsoGroup = new THREE.Group();
  private readonly armL = new THREE.Group();
  private readonly armR = new THREE.Group();

  private readonly cfg: BoarderConfig;
  private readonly world: RAPIER.World;

  // State
  public yaw = 0; // Heading in radians (0 = -Z)
  public isGrounded = false;
  public speed = 0;
  public leanAngle = 0;        // Lateral lean: -1.0 (left) to +1.0 (right)
  public carveCharge = 0;      // Edge-pressure charge: 0.0 to 1.0
  public pumpChain = 0;        // Multi-turn cadence chain (0 to 4)
  public pumpFlow = 1.0;       // Rhythm flow multiplier (starts at 1.0, caps at 2.2)
  public isDrifting = false;   // True when slip angle > 35 degrees or braking
  public isSlashing = false;   // True during controlled carve-slash spray turn
  public slipAngleDeg = 0;     // Current slip angle between heading and velocity
  public vForward = 0;
  public vLateral = 0;
  public groundDistance = 0;
  public stumbleTimer = 0;     // Reduced steering after bad landing (> 45 deg)
  public gripUtilization = 0;  // Centripetal acceleration / edge bite limit
  public pumpKick = 0;         // FOV kick surge trigger for camera director
  public preWindCoil = 0;      // -1 (left) to +1 (right) pre-wind coil for spins
  public prevSlopeGrade = 0;   // Downslope tracking for roller terrain pump
  public wiggleTimer = 0;      // Flat ground wiggle skate timer
  public lastWiggleSign = 0;   // Flat ground wiggle alternation sign
  public airTimer = 0;         // Airborne duration in seconds

  private smoothNormal = new THREE.Vector3(0, 1, 0);

  // Procedural animation springs
  private hipOffsetY = 0;
  private hipVelY = 0;
  private wasGrounded = false;

  // Audio, Trail Ribbon and Particles
  private readonly audio = new SnowAudio();
  private trailRibbon!: SnowTrailRibbon;
  private sprayParticles!: THREE.Points;
  private sprayGeo!: THREE.BufferGeometry;
  private sprayPositions!: Float32Array;
  private sprayVelocities!: Float32Array;
  private sprayLifetimes!: Float32Array;
  private readonly sprayCount = 420;
  private wasStaking = false;
  private lastStakingSide = 0;

  // Scratch objects (zero allocations in hot path)
  private readonly _up = new THREE.Vector3(0, 1, 0);
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _rawNormal = new THREE.Vector3();
  private readonly _rayOrigin = { x: 0, y: 0, z: 0 };
  private readonly _rayOriginNose = { x: 0, y: 0, z: 0 };
  private readonly _rayOriginTail = { x: 0, y: 0, z: 0 };
  private readonly _rayDir = { x: 0, y: -1, z: 0 };
  private readonly _alignQuat = new THREE.Quaternion();
  private readonly _yawQuat = new THREE.Quaternion();
  private readonly _targetQuat = new THREE.Quaternion();
  private readonly _airEuler = new THREE.Euler(0, 0, 0, 'YXZ');

  constructor(
    world: RAPIER.World,
    scene: THREE.Scene,
    spawnPos: THREE.Vector3,
    config: Partial<BoarderConfig> = {}
  ) {
    this.world = world;
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.trickEngine = new TrickEngine();
    this.gmaPhysics = new GmaPlayerPhysics(SportType.Skis, true);
    this.gmaPhysics.reset(spawnPos, 0);

    // 1. Rapier Physics Body (frictionless sphere prevents triangle seam snags)
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(spawnPos.x, spawnPos.y + this.cfg.sphereRadius, spawnPos.z)
      .setLinearDamping(0.05)
      .lockRotations()
      .setCcdEnabled(true);

    this.rigidBody = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.ball(this.cfg.sphereRadius)
      .setDensity(this.cfg.mass / ((4 / 3) * Math.PI * Math.pow(this.cfg.sphereRadius, 3)))
      .setFriction(0.0)
      .setRestitution(0.0);

    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // 2. Build Procedural Character & Snowboard
    this.root = new THREE.Group();
    this.root.add(this.visualRoot);
    this.buildCharacterMesh();
    scene.add(this.root);

    // 3. Build Snow Spray Particle System & Trail Ribbon
    this.initSnowSpray(scene);
    this.trailRibbon = new SnowTrailRibbon(scene);

    // 4. Setup Audio gesture trigger
    const initAudio = () => {
      this.audio.init();
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('pointerdown', initAudio);
    };
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('pointerdown', initAudio, { once: true });
  }

  private initSnowSpray(scene: THREE.Scene): void {
    this.sprayPositions = new Float32Array(this.sprayCount * 3);
    this.sprayVelocities = new Float32Array(this.sprayCount * 3);
    this.sprayLifetimes = new Float32Array(this.sprayCount);

    for (let i = 0; i < this.sprayCount; i++) {
      this.sprayPositions[i * 3] = 0;
      this.sprayPositions[i * 3 + 1] = -9999;
      this.sprayPositions[i * 3 + 2] = 0;
      this.sprayLifetimes[i] = 0;
    }

    this.sprayGeo = new THREE.BufferGeometry();
    this.sprayGeo.setAttribute('position', new THREE.BufferAttribute(this.sprayPositions, 3));

    const sprayMat = new THREE.PointsMaterial({
      color: 0xf5f8fc,
      size: 0.38,
      transparent: true,
      opacity: 0.70,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.sprayParticles = new THREE.Points(this.sprayGeo, sprayMat);
    scene.add(this.sprayParticles);
  }

  public get mesh(): THREE.Group {
    return this.root;
  }

  public get heading(): number {
    return this.yaw;
  }

  public set heading(val: number) {
    this.yaw = val;
  }

  public get speedKmh(): number {
    return this.speed * 3.6;
  }

  public get sport(): SportType {
    return this.gmaPhysics.sport;
  }

  public get turnType(): TurnType {
    return this.gmaPhysics.currentTurnType;
  }

  public get movementState(): MovementState {
    return this.gmaPhysics.state;
  }

  public toggleSport(): SportType {
    this.gmaPhysics.hasTwintips = !this.gmaPhysics.hasTwintips;
    return SportType.Skis;
  }

  public toggleTwintips(): boolean {
    this.gmaPhysics.hasTwintips = !this.gmaPhysics.hasTwintips;
    return this.gmaPhysics.hasTwintips;
  }

  public toggleReverseTurn(): boolean {
    this.gmaPhysics.controls.reverseTurn = !this.gmaPhysics.controls.reverseTurn;
    return this.gmaPhysics.controls.reverseTurn;
  }

  private buildCharacterMesh(): void {
    // Materials
    const skiMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.3, metalness: 0.1 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.6 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x264653, roughness: 0.8 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf1faee, roughness: 0.4 });
    const goggleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });

    // 1. Dual Independent Skis (length 1.85m, two parallel skis)
    const skiGeo = new THREE.BoxGeometry(0.12, 0.035, 1.85);
    const skiTipGeo = new THREE.BoxGeometry(0.12, 0.03, 0.25);

    const skiLeft = new THREE.Group();
    const skiLMesh = new THREE.Mesh(skiGeo, skiMat);
    const skiLTip = new THREE.Mesh(skiTipGeo, skiMat);
    skiLTip.position.set(0, 0.035, -1.0);
    skiLTip.rotation.x = 0.38;
    skiLeft.add(skiLMesh, skiLTip);
    skiLeft.position.set(-0.20, 0, 0);

    const skiRight = new THREE.Group();
    const skiRMesh = new THREE.Mesh(skiGeo, skiMat);
    const skiRTip = new THREE.Mesh(skiTipGeo, skiMat);
    skiRTip.position.set(0, 0.035, -1.0);
    skiRTip.rotation.x = 0.38;
    skiRight.add(skiRMesh, skiRTip);
    skiRight.position.set(0.20, 0, 0);

    this.skisGroup.add(skiLeft, skiRight);
    this.skisGroup.position.y = -this.cfg.sphereRadius + 0.02;
    this.skisGroup.visible = true;
    this.visualRoot.add(this.skisGroup);

    // 2. Character Rig (Parallel Alpine Ski Stance)
    this.hipsGroup.position.set(0, 0.55, 0);
    this.visualRoot.add(this.hipsGroup);

    // Legs (boots/shins aligned over each ski)
    const legGeo = new THREE.CapsuleGeometry(0.085, 0.38, 4, 8);
    const legLeft = new THREE.Mesh(legGeo, pantsMat);
    legLeft.position.set(-0.20, -0.22, 0);
    legLeft.castShadow = true;

    const legRight = new THREE.Mesh(legGeo, pantsMat);
    legRight.position.set(0.20, -0.22, 0);
    legRight.castShadow = true;
    this.hipsGroup.add(legLeft, legRight);

    // Torso (forward-facing alpine stance)
    this.torsoGroup.position.set(0, 0.08, 0);
    this.torsoGroup.rotation.y = 0;
    this.hipsGroup.add(this.torsoGroup);

    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.36, 6, 10), jacketMat);
    torsoMesh.position.y = 0.26;
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.14), baseMat);
    pack.position.set(0, 0.28, 0.18);
    pack.castShadow = true;
    this.torsoGroup.add(pack);

    // Head + Helmet + Goggles (forward-facing)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.62, 0);
    headGroup.rotation.y = 0;
    this.torsoGroup.add(headGroup);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), helmetMat);
    helmet.castShadow = true;
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.10), goggleMat);
    goggles.position.set(0, 0.01, -0.12);
    headGroup.add(helmet, goggles);

    // Arms & Ski Poles
    const armGeo = new THREE.CapsuleGeometry(0.06, 0.36, 4, 8);
    const armLMesh = new THREE.Mesh(armGeo, jacketMat);
    armLMesh.position.set(-0.22, -0.12, 0);
    armLMesh.rotation.z = -0.55;
    this.armL.position.set(-0.22, 0.44, 0);
    this.armL.add(armLMesh);

    const armRMesh = new THREE.Mesh(armGeo, jacketMat);
    armRMesh.position.set(0.22, -0.12, 0);
    armRMesh.rotation.z = 0.55;
    this.armR.position.set(0.22, 0.44, 0);
    this.armR.add(armRMesh);

    // Ski Poles
    const poleGeo = new THREE.CylinderGeometry(0.012, 0.010, 1.05, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const basketGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.01, 8);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xe76f51 });

    const poleL = new THREE.Mesh(poleGeo, poleMat);
    const basketL = new THREE.Mesh(basketGeo, basketMat);
    basketL.position.y = -0.42;
    poleL.add(basketL);
    poleL.position.set(0, -0.38, 0);
    poleL.rotation.x = 0.25;
    this.armL.add(poleL);

    const poleR = new THREE.Mesh(poleGeo, poleMat);
    const basketR = new THREE.Mesh(basketGeo, basketMat);
    basketR.position.y = -0.42;
    poleR.add(basketR);
    poleR.position.set(0, -0.38, 0);
    poleR.rotation.x = 0.25;
    this.armR.add(poleR);

    this.polesGroup.add(poleL, poleR);
    this.polesGroup.visible = true;

    this.torsoGroup.add(this.armL, this.armR);
  }

  /**
   * Reset boarder state and position for respawns and teleports.
   */
  public reset(x: number, y: number, z: number, yaw: number = 0): void {
    const pos = new THREE.Vector3(x, y, z);
    this.gmaPhysics.reset(pos, yaw);
    const bodyY = y + this.cfg.sphereRadius;
    this.rigidBody.setTranslation({ x, y: bodyY, z }, true);
    this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.yaw = yaw;
    this.speed = 0;
    this.leanAngle = 0;
    this.carveCharge = 0;
    this.pumpChain = 0;
    this.pumpFlow = 1.0;
    this.isDrifting = false;
    this.isSlashing = false;
    this.slipAngleDeg = 0;
    this.vForward = 0;
    this.vLateral = 0;
    this.groundDistance = 0;
    this.airTimer = 0;
    this.isGrounded = false;
    this.hipOffsetY = 0;
    this.hipVelY = 0;
    if (this.trailRibbon) this.trailRibbon.reset();
    this.root.position.set(x, bodyY, z);
    this.visualRoot.quaternion.setFromAxisAngle(this._up, yaw);
    this.trickEngine.startAir();
  }

  /**
   * Call once per fixed physics step (integrating 333.3 Hz GMA sub-steps).
   */
  public fixedUpdate(
    dt: number,
    input: BoarderInput,
    surfaceOrSample: SurfaceType | TerrainSample = 'POWDER'
  ): void {
    const terrainSample = typeof surfaceOrSample === 'object' ? surfaceOrSample : undefined;
    const pos = this.rigidBody.translation();

    // 1. Multi-Point Ground Detection (Nose, Center, Tail probes for smooth cresting)
    const fwdX = -Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const probeHalfLen = 0.65;

    this._rayOrigin.x = pos.x;
    this._rayOrigin.y = pos.y + 0.15;
    this._rayOrigin.z = pos.z;

    this._rayOriginNose.x = pos.x + fwdX * probeHalfLen;
    this._rayOriginNose.y = pos.y + 0.15;
    this._rayOriginNose.z = pos.z + fwdZ * probeHalfLen;

    this._rayOriginTail.x = pos.x - fwdX * probeHalfLen;
    this._rayOriginTail.y = pos.y + 0.15;
    this._rayOriginTail.z = pos.z - fwdZ * probeHalfLen;

    const maxRayDist = this.cfg.sphereRadius + 0.15 + 1.25;
    const rayCenter = new RAPIER.Ray(this._rayOrigin, this._rayDir);
    const rayNose = new RAPIER.Ray(this._rayOriginNose, this._rayDir);
    const rayTail = new RAPIER.Ray(this._rayOriginTail, this._rayDir);

    const hitCenter = this.world.castRayAndGetNormal(rayCenter, maxRayDist, true, undefined, undefined, this.collider);
    const hitNose = this.world.castRayAndGetNormal(rayNose, maxRayDist, true, undefined, undefined, this.collider);
    const hitTail = this.world.castRayAndGetNormal(rayTail, maxRayDist, true, undefined, undefined, this.collider);

    const distCenter = hitCenter ? hitCenter.timeOfImpact - 0.15 : 999.0;
    const distNose = hitNose ? hitNose.timeOfImpact - 0.15 : 999.0;
    const distTail = hitTail ? hitTail.timeOfImpact - 0.15 : 999.0;

    const normalDistCenter = hitCenter ? distCenter * Math.max(0.15, hitCenter.normal.y) : 999.0;
    const normalDistNose = hitNose ? distNose * Math.max(0.15, hitNose.normal.y) : 999.0;
    const normalDistTail = hitTail ? distTail * Math.max(0.15, hitTail.normal.y) : 999.0;

    const rayMinDist = Math.min(normalDistCenter, normalDistNose, normalDistTail);
    const terrainHeight = terrainSample ? terrainSample.height : -9999.0;
    const terrainDist = terrainSample ? Math.max(0, (pos.y - this.cfg.sphereRadius) - terrainHeight) : 999.0;
    this.groundDistance = Math.min(rayMinDist, terrainDist);

    const maxContactDist = this.cfg.sphereRadius + 0.38;
    let normX = 0, normY = 0, normZ = 0, normW = 0;
    if (hitCenter && normalDistCenter <= maxContactDist && hitCenter.normal.y > 0.12) {
      normX += hitCenter.normal.x * 2.0;
      normY += hitCenter.normal.y * 2.0;
      normZ += hitCenter.normal.z * 2.0;
      normW += 2.0;
    }
    if (hitNose && normalDistNose <= maxContactDist && hitNose.normal.y > 0.12) {
      normX += hitNose.normal.x;
      normY += hitNose.normal.y;
      normZ += hitNose.normal.z;
      normW += 1.0;
    }
    if (hitTail && normalDistTail <= maxContactDist && hitTail.normal.y > 0.12) {
      normX += hitTail.normal.x;
      normY += hitTail.normal.y;
      normZ += hitTail.normal.z;
      normW += 1.0;
    }

    if (normW > 0) {
      this._rawNormal.set(normX / normW, normY / normW, normZ / normW).normalize();
      this.smoothNormal.lerp(this._rawNormal, Math.min(1, dt * 25)).normalize();
    } else if (terrainSample) {
      this.smoothNormal.lerp(terrainSample.normal, Math.min(1, dt * 15)).normalize();
    } else {
      this.smoothNormal.lerp(this._up, Math.min(1, dt * 4)).normalize();
    }

    const rayGround = hitCenter ? (pos.y + 0.15 - hitCenter.timeOfImpact) : -9999.0;
    const groundElevation = Math.max(terrainHeight, rayGround);

    // 2. Prepare GMA input state
    let steerVal = 0.0;
    if (input.steerX !== undefined) steerVal = input.steerX;
    else if (input.left && !input.right) steerVal = -1.0;
    else if (input.right && !input.left) steerVal = 1.0;

    const inputState: InputState = {
      steerX: steerVal,
      steerY: input.brake ? -1.0 : 0.0,
      trickSpinX: input.trickSpinX !== undefined ? input.trickSpinX : (input.left ? 1.0 : (input.right ? -1.0 : 0.0)),
      trickFlipY: input.trickFlipY !== undefined ? input.trickFlipY : 0.0,
      trickRoll: input.trickRoll !== undefined ? input.trickRoll : 0.0,
      jump: input.jump,
      sharpTurn: !!input.sharpTurn,
      slideTurn: !!input.slideTurn,
      brake: input.brake,
      slapTackle: !!input.tackle,
      stakePole: false,
      reverseTurnEnabled: this.gmaPhysics.controls.reverseTurn
    };

    // 3. Step 333.3 Hz GMA Player Physics
    this.gmaPhysics.update(dt, inputState, groundElevation, this.smoothNormal);

    // 4. Sync Rapier RigidBody
    this.rigidBody.setTranslation(
      {
        x: this.gmaPhysics.position.x,
        y: this.gmaPhysics.position.y + this.cfg.sphereRadius,
        z: this.gmaPhysics.position.z
      },
      true
    );
    this.rigidBody.setLinvel(
      {
        x: this.gmaPhysics.velocity.x,
        y: this.gmaPhysics.velocity.y,
        z: this.gmaPhysics.velocity.z
      },
      true
    );

    // 5. Update Cached State
    this.yaw = this.gmaPhysics.currentHeadingAngle;
    this.speed = this.gmaPhysics.speed;
    this.isGrounded = this.gmaPhysics.state !== MovementState.Airborne && this.gmaPhysics.state !== MovementState.Crashing;
    this.isDrifting = this.gmaPhysics.currentTurnType === TurnType.SlideTurn || this.gmaPhysics.currentTurnType === TurnType.OverTurn || input.brake;
    this.isSlashing = this.gmaPhysics.currentTurnType === TurnType.SharpTurn;
    this._forward.copy(this.gmaPhysics.forwardDir);
    this._right.crossVectors(this._forward, this.smoothNormal).normalize();
    this.vForward = this.gmaPhysics.velocity.dot(this._forward);
    this.vLateral = this.gmaPhysics.velocity.dot(this._right);
    const planarSpeed = Math.hypot(this.vForward, this.vLateral);
    this.slipAngleDeg = planarSpeed > 0.2 ? Math.acos(THREE.MathUtils.clamp(Math.abs(this.vForward) / planarSpeed, 0, 1)) * (180 / Math.PI) : 0;
    this.airTimer = this.gmaPhysics.airTime;

    const targetLean = (input.right ? 1.0 : 0.0) - (input.left ? 1.0 : 0.0);
    this.leanAngle = THREE.MathUtils.damp(this.leanAngle, targetLean, 12, dt);

    const steerEffort = Math.abs(steerVal);
    const speedRatio = Math.min(1.0, this.speed / 24.0);
    this.gripUtilization = THREE.MathUtils.clamp(
      (Math.abs(this.leanAngle) * 0.65 + steerEffort * 0.35) * speedRatio + (this.isSlashing ? 0.30 : 0.0),
      0.0,
      1.0
    );

    this.carveCharge = this.gmaPhysics.currentTurnType === TurnType.SlideTurn
      ? Math.min(1, this.gmaPhysics.slideTurnBoostTimer / 0.5)
      : (this.gmaPhysics.currentTurnType === TurnType.SharpTurn ? 0.9 : (this.gmaPhysics.currentTurnType === TurnType.StandardTurn ? 0.5 : 0));
    this.pumpChain = this.gmaPhysics.driftMilestoneIndex;
    this.pumpFlow = 1.0 + this.gmaPhysics.driftMilestoneIndex * 0.5;
    if (this.gmaPhysics.slideTurnBoostTimer > 0.45) this.pumpKick = 1.0;

    // Sync trick engine
    this.trickEngine.totalScore = this.gmaPhysics.trickScoring.totalGameScore;
    this.trickEngine.currentMultiplier = this.gmaPhysics.trickScoring.comboMultiplier;
    this.trickEngine.lastTrickName = this.gmaPhysics.trickScoring.lastFinalizedTrickName;
    this.trickEngine.lastTrickPoints = this.gmaPhysics.trickScoring.lastFinalizedPoints;
    this.trickEngine.displayTimer = this.gmaPhysics.trickScoring.displayTimer;

    // Land audio thump
    if (this.wasGrounded !== this.isGrounded) {
      if (this.isGrounded && this.airTimer > 0.25) {
        this.audio.playLandThump(this.gmaPhysics.state !== MovementState.Crashing);
      }
      this.wasGrounded = this.isGrounded;
    }
  }

  /**
   * Call once per render frame to sync visuals and procedural character animation.
   */
  public renderUpdate(dt: number, input: BoarderInput): void {
    const pos = this.rigidBody.translation();
    this.root.position.set(pos.x, pos.y, pos.z);

    // If crashing, ragdoll limbs track the Verlet particles
    if (this.gmaPhysics.state === MovementState.Crashing && this.gmaPhysics.ragdoll.active) {
      const pts = this.gmaPhysics.ragdoll.points;
      if (pts.length >= 7) {
        this.hipsGroup.position.copy(pts[2].pos).sub(this.root.position);
        this.torsoGroup.position.copy(pts[1].pos).sub(pts[2].pos);
        this.armL.position.copy(pts[3].pos).sub(pts[1].pos);
        this.armR.position.copy(pts[4].pos).sub(pts[1].pos);
      }
      this.triggerCrashSpray();
    } else {
      // 1. Align visualRoot to terrain normal + boarder yaw
      this._alignQuat.setFromUnitVectors(this._up, this.smoothNormal);
      this._yawQuat.setFromAxisAngle(this._up, this.yaw);
      this._targetQuat.multiplyQuaternions(this._alignQuat, this._yawQuat);

      if (!this.isGrounded) {
        this._airEuler.set(this.gmaPhysics.airPitch, 0, this.gmaPhysics.airRoll);
        const airQ = new THREE.Quaternion().setFromEuler(this._airEuler);
        this._targetQuat.multiply(airQ);
      }
      this.visualRoot.quaternion.slerp(this._targetQuat, Math.min(1, dt * 16));

      // 2. Procedural Carving Lean & Edge Banking
      const speedRollScale = THREE.MathUtils.clamp(0.28 + 0.72 * (this.speed / 4.0), 0.28, 1.0);
      const targetRoll = -this.leanAngle * 0.52 * speedRollScale;
      this.skisGroup.rotation.z = THREE.MathUtils.damp(this.skisGroup.rotation.z, targetRoll, 10, dt);

      // 3. Hip Spring & Snowdepth Suspension Absorption
      const tuckDrop = input.forward && this.speed > 8 ? -0.14 : 0;
      const targetHipY = 0.55 + tuckDrop + this.gmaPhysics.snowDepthPos * 0.5;
      const springK = 140;
      const damping = 16;
      const force = (targetHipY - (0.55 + this.hipOffsetY)) * springK - this.hipVelY * damping;
      this.hipVelY += force * dt;
      this.hipOffsetY += this.hipVelY * dt;
      this.hipsGroup.position.y = THREE.MathUtils.clamp(0.55 + this.hipOffsetY, 0.26, 0.70);
      this.skisGroup.position.y = -this.cfg.sphereRadius + 0.02 - this.gmaPhysics.snowDepthPos * 0.4;

      // 4. Torso Counter-Rotation & Tuck (Forward-facing ski stance)
      this.torsoGroup.rotation.y = THREE.MathUtils.damp(this.torsoGroup.rotation.y, 0, 10, dt);
      this.torsoGroup.rotation.z = THREE.MathUtils.damp(
        this.torsoGroup.rotation.z,
        -this.leanAngle * 0.36 * speedRollScale,
        10,
        dt
      );

      // 5. Procedural Dual-Pole Plant Animation & Airborne Arm Spread
      const armSpread = this.isGrounded ? 0.0 : 0.45;
      this.armL.rotation.z = THREE.MathUtils.damp(this.armL.rotation.z, -armSpread, 8, dt);
      this.armR.rotation.z = THREE.MathUtils.damp(this.armR.rotation.z, armSpread, 8, dt);

      if (this.isGrounded && this.gmaPhysics.isStaking) {
        // Drive specific pole into snow based on left/right steering side
        const isLeftPlant = this.gmaPhysics.stakingPoleSide < 0;
        const armSwingL = isLeftPlant ? 0.55 : -0.15;
        const armSwingR = isLeftPlant ? -0.15 : 0.55;
        this.armL.rotation.x = THREE.MathUtils.damp(this.armL.rotation.x, armSwingL, 16, dt);
        this.armR.rotation.x = THREE.MathUtils.damp(this.armR.rotation.x, armSwingR, 16, dt);
        this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.14, 12, dt);

        // Staking Sound: rhythmic crisp pole jab clicks into hardpack snow
        if (!this.wasStaking || this.lastStakingSide !== this.gmaPhysics.stakingPoleSide) {
          this.audio.playPolePlant();
          this.lastStakingSide = this.gmaPhysics.stakingPoleSide;
        }
      } else {
        this.armL.rotation.x = THREE.MathUtils.damp(this.armL.rotation.x, 0.0, 8, dt);
        this.armR.rotation.x = THREE.MathUtils.damp(this.armR.rotation.x, 0.0, 8, dt);
        this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, 0.0, 8, dt);
      }
      this.wasStaking = this.isGrounded && this.gmaPhysics.isStaking;
    }

    // 6. Snow Spray Particles, Persistent Trail Ribbon & Audio
    this.updateSnowSpray(dt);
    if (this.trailRibbon) {
      this.trailRibbon.update(
        this.root.position,
        this._right,
        this.smoothNormal,
        this.isGrounded,
        this.slipAngleDeg,
        this.speed,
        this.isDrifting
      );
    }
    this.audio.update(this.speed, this.vLateral, this.isGrounded, this.isDrifting, this.gripUtilization);

    this.gmaPhysics.trickScoring.updateDisplay(dt);
    this.trickEngine.updateDisplayTimer(dt);
  }

  private triggerCrashSpray(): void {
    if (!this.sprayPositions) return;
    const pos = this.rigidBody.translation();
    let emitted = 0;
    for (let i = 0; i < this.sprayCount && emitted < 55; i++) {
      if (this.sprayLifetimes[i] <= 0) {
        this.sprayLifetimes[i] = 0.40 + Math.random() * 0.25;
        const idx = i * 3;
        this.sprayPositions[idx] = pos.x + (Math.random() - 0.5) * 0.8;
        this.sprayPositions[idx + 1] = pos.y - this.cfg.sphereRadius + 0.1;
        this.sprayPositions[idx + 2] = pos.z + (Math.random() - 0.5) * 0.8;
        this.sprayVelocities[idx] = (Math.random() - 0.5) * 6.5;
        this.sprayVelocities[idx + 1] = 2.5 + Math.random() * 3.5;
        this.sprayVelocities[idx + 2] = (Math.random() - 0.5) * 6.5;
        emitted++;
      }
    }
  }

  private updateSnowSpray(dt: number): void {
    const pos = this.rigidBody.translation();
    const isEmitting = this.isGrounded && this.speed > 1.2;
    const absLat = Math.abs(this.vLateral);

    if (isEmitting) {
      if (this.isDrifting || this.gmaPhysics.currentTurnType === TurnType.SlideTurn || Math.abs(this.slipAngleDeg) > 28) {
        // Slide Turn / Hockey Stop: massive fan plume spraying in the direction of lateral velocity scrub
        const scrubSign = Math.sign(this.vLateral) || (this.leanAngle > 0 ? 1 : -1);
        const lateralScrubMag = Math.max(0.4, absLat);
        const scrubX = this._right.x * scrubSign * 0.85 + this._forward.x * 0.25;
        const scrubZ = this._right.z * scrubSign * 0.85 + this._forward.z * 0.25;
        const scrubLen = Math.hypot(scrubX, scrubZ) || 1;
        const normScrubX = scrubX / scrubLen;
        const normScrubZ = scrubZ / scrubLen;

        const emitRate = Math.min(26, Math.floor(7 + this.speed * 0.40 + lateralScrubMag * 1.5));
        for (let e = 0; e < emitRate; e++) {
          for (let i = 0; i < this.sprayCount; i++) {
            if (this.sprayLifetimes[i] <= 0) {
              // Particle lifetime: 0.35s - 0.60s
              this.sprayLifetimes[i] = 0.35 + Math.random() * 0.25;
              const idx = i * 3;

              // Spread along ski length and scrubbing edge
              const skiDist = (Math.random() - 0.5) * 1.5;
              const edgeOffset = scrubSign * (0.15 + Math.random() * 0.25);
              this.sprayPositions[idx] = pos.x + this._forward.x * skiDist + this._right.x * edgeOffset;
              this.sprayPositions[idx + 1] = pos.y - this.cfg.sphereRadius + 0.05;
              this.sprayPositions[idx + 2] = pos.z + this._forward.z * skiDist + this._right.z * edgeOffset;

              // Wide fan plume spreading in scrub direction
              const fanAngle = (Math.random() - 0.5) * 1.15; // ~66 deg fan spread
              const cosA = Math.cos(fanAngle);
              const sinA = Math.sin(fanAngle);
              const fanDirX = normScrubX * cosA - normScrubZ * sinA;
              const fanDirZ = normScrubX * sinA + normScrubZ * cosA;

              const plumeSpeed = 3.8 + Math.random() * 5.2 + (this.speed / 30.0) * 3.0;
              this.sprayVelocities[idx] = fanDirX * plumeSpeed;
              this.sprayVelocities[idx + 1] = 1.6 + Math.random() * 3.2; // Massive vertical fan lift
              this.sprayVelocities[idx + 2] = fanDirZ * plumeSpeed;
              break;
            }
          }
        }
      } else {
        // Carving: twin thin rooster tails peeling outward from the outside ski edge
        // Outside ski edge relative to turn direction
        const outsideSkiSign = this.leanAngle > 0 ? -1 : (this.leanAngle < 0 ? 1 : 0);
        const emitRate = Math.min(10, Math.floor(2 + (this.speed / 35.0) * 6));

        for (let e = 0; e < emitRate; e++) {
          // Emit for both skis (twin tails)
          const sides = outsideSkiSign !== 0 ? [outsideSkiSign, -outsideSkiSign] : [-1, 1];
          for (const side of sides) {
            for (let i = 0; i < this.sprayCount; i++) {
              if (this.sprayLifetimes[i] <= 0) {
                // Particle lifetime: 0.35s - 0.60s
                this.sprayLifetimes[i] = 0.35 + Math.random() * 0.25;
                const idx = i * 3;

                const isOutside = side === outsideSkiSign;
                const skiPosOffset = side * 0.20 + (side > 0 ? 0.02 : -0.02);
                const tailPosOffset = -0.72 + (Math.random() - 0.5) * 0.16;

                this.sprayPositions[idx] = pos.x + this._right.x * skiPosOffset + this._forward.x * tailPosOffset;
                this.sprayPositions[idx + 1] = pos.y - this.cfg.sphereRadius + 0.04;
                this.sprayPositions[idx + 2] = pos.z + this._right.z * skiPosOffset + this._forward.z * tailPosOffset;

                // Rooster tail peeling outward laterally from ski edge
                const peelFactor = isOutside ? 1.6 : 1.0;
                const latSpeed = side * (1.6 + Math.random() * 1.6) * peelFactor;
                const backSpeed = -(0.8 + Math.random() * 0.7);
                const liftSpeed = 1.5 + Math.random() * 2.2 + (this.speed / 35.0) * 1.5;

                this.sprayVelocities[idx] = this._right.x * latSpeed + this._forward.x * backSpeed;
                this.sprayVelocities[idx + 1] = liftSpeed;
                this.sprayVelocities[idx + 2] = this._right.z * latSpeed + this._forward.z * backSpeed;
                break;
              }
            }
          }
        }
      }
    }

    // Gravity (9.81 m/s^2) and trajectory integration
    for (let i = 0; i < this.sprayCount; i++) {
      if (this.sprayLifetimes[i] > 0) {
        this.sprayLifetimes[i] -= dt;
        const idx = i * 3;
        this.sprayPositions[idx] += this.sprayVelocities[idx] * dt;
        this.sprayPositions[idx + 1] += this.sprayVelocities[idx + 1] * dt;
        this.sprayPositions[idx + 2] += this.sprayVelocities[idx + 2] * dt;
        this.sprayVelocities[idx + 1] -= 9.81 * dt; // Gravity: 9.81 m/s^2
      } else {
        this.sprayPositions[i * 3 + 1] = -9999;
      }
    }
    this.sprayGeo.attributes.position.needsUpdate = true;
  }
}

export { Skier as SnowBoarder };

