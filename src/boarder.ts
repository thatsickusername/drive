import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TrickEngine } from './player/TrickEngine';
import { SkierCharacter, SkierAnimator, buildSkierCharacter, PALETTES } from './player/SkierCharacter';
import { SurfaceType, TerrainSample } from './world/alpineHeightfield';
import { GmaPlayerPhysics } from './mechanics/GmaPlayerPhysics';
import { SportType, TurnType, MovementState } from './mechanics/GmaConfig';
import { InputState } from './mechanics/ControlsProcessor';
import { CarvedSnowTrail } from './world/CarvedSnowTrail';

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

  private lastPolePlantTime = 0;

  public playPolePlant(): void {
    if (!this.initialized || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (now - this.lastPolePlantTime < 0.22) return;
      this.lastPolePlantTime = now;
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
  gravity: 9.81,               // Authentic GMA standard gravity (9.81 m/s^2)
  sidecutRadius: 8.2,          // Authentic Grand Mountain Adventure ~8m sidecut
  baseFriction: 0.1,           // Authentic GMA groomed snow (Snow_Any_Pist_Fast: 0.1)
  powderFriction: 0.3,         // Authentic GMA powder snow (Snow_Any_Powder: 0.3)
  edgeGrip: 12.0,
  gripTransfer: 0.85,          // High edge grip transfer during carve
  driftAngleThreshold: 0.645,  // ~37 degrees slip angle threshold in radians
  carveSpeedBleed: 0.0,        // Non-dissipative clean edge carving in authentic GMA
  brakeDrag: 2.5,              // Authentic GMA player.breaking.power: 2.5
  airDrag: 0.006,              // Authentic GMA player.air_friction: 0.006
  tuckAirDrag: 0.004,
  pushAccel: 4.5,
  maxPushSpeed: 5.5,
  turnRate: 5.0,               // Standard GMA turn rate curve base
  maxPumpBoost: 2.0,           // Authentic GMA slide turn burst (+2.0 m/s)
  maxPumpSpeed: 14.0,          // Soft speed cap for rhythm pumping
  chargeRate: 2.4,             // Edge-pressure charge buildup rate during deep turns
  jumpImpulseMin: 4.0,         // Authentic GMA player.jump_strenght: 4.0 m/s
  jumpImpulseMax: 4.0,         // Authentic GMA player.jump_strenght: 4.0 m/s
};

export class Skier {
  public readonly rigidBody: RAPIER.RigidBody;
  public readonly collider: RAPIER.Collider;
  public readonly root: THREE.Group;
  public readonly trickEngine: TrickEngine;
  public readonly gmaPhysics: GmaPlayerPhysics;

  // Procedural rig hierarchy & dynamic animator
  private readonly visualRoot = new THREE.Group();
  public skierCharacter!: SkierCharacter;
  public animator!: SkierAnimator;

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

  public smoothNormal = new THREE.Vector3(0, 1, 0);

  private wasGrounded = false;
  private wasCrashing = false;

  // Audio, Trail Ribbon and Particles
  private readonly audio = new SnowAudio();
  private trailRibbon!: CarvedSnowTrail;
  private sprayParticles!: THREE.Points;
  private sprayGeo!: THREE.BufferGeometry;
  private sprayPositions!: Float32Array;
  private sprayVelocities!: Float32Array;
  private sprayLifetimes!: Float32Array;
  private readonly sprayCount = 420;

  // Scratch objects (zero allocations in hot path)
  private readonly _up = new THREE.Vector3(0, 1, 0);
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _rawNormal = new THREE.Vector3();
  private readonly _rayOrigin = { x: 0, y: 0, z: 0 };
  private readonly _rayOriginNose = { x: 0, y: 0, z: 0 };
  private readonly _rayOriginTail = { x: 0, y: 0, z: 0 };
  private readonly _rayDir = { x: 0, y: -1, z: 0 };
  private readonly _targetQuat = new THREE.Quaternion();
  private readonly _airEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _basisMatrix = new THREE.Matrix4();
  private readonly _slopeFwd = new THREE.Vector3();
  private readonly _negSlopeFwd = new THREE.Vector3();
  private readonly _contactWorldPos = new THREE.Vector3();
  private terrainSampler: ((x: number, z: number) => number) | null = null;
  private groundClearanceOffset = 0.0;

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

    // 1. Rapier Kinematic Body (GMA 333.3 Hz integrator has sole position authority)
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(spawnPos.x, spawnPos.y + this.cfg.sphereRadius, spawnPos.z);

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
    this.root.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        c.castShadow = true;
      }
    });
    scene.add(this.root);

    // 3. Build Snow Spray Particle System & Trail Ribbon
    this.initSnowSpray(scene);
    this.trailRibbon = new CarvedSnowTrail(scene);
    if (this.terrainSampler) {
      this.trailRibbon.setTerrainSampler(this.terrainSampler);
    }

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

  public get isGliding(): boolean {
    return this.gmaPhysics.isGliding;
  }

  public toggleSport(): SportType {
    this.gmaPhysics.sport = this.gmaPhysics.sport === SportType.Skis ? SportType.Snowboard : SportType.Skis;
    this.updateSportVisuals();
    return this.gmaPhysics.sport;
  }

  public updateSportVisuals(): void {
    // Skier character uses authentic alpine skis and dual poles
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
    this.skierCharacter = buildSkierCharacter(PALETTES.coral);
    this.animator = new SkierAnimator(this.skierCharacter);
    this.animator.onPolePlantAudio = () => this.audio.playPolePlant();
    this.skierCharacter.root.position.y = -this.cfg.sphereRadius + 0.02;
    this.visualRoot.add(this.skierCharacter.root);
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
    if (this.trailRibbon) this.trailRibbon.reset();
    this.root.position.set(x, bodyY, z);
    this.visualRoot.quaternion.setFromAxisAngle(this._up, yaw);
    this.skierCharacter.resetPose();
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
      stakePole: !!input.forward,
      reverseTurnEnabled: this.gmaPhysics.controls.reverseTurn
    };

    // 3. Step 333.3 Hz GMA Player Physics
    const surfaceType = terrainSample ? terrainSample.surfaceType : 'POWDER';
    this.gmaPhysics.update(dt, inputState, groundElevation, this.smoothNormal, surfaceType);

    // 4. Sync Rapier Kinematic Collider Translation (zero double-integration jitter)
    this.rigidBody.setNextKinematicTranslation({
      x: this.gmaPhysics.position.x,
      y: this.gmaPhysics.position.y + this.cfg.sphereRadius,
      z: this.gmaPhysics.position.z
    });

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
    const trueGroundHeight = this.terrainSampler
      ? this.terrainSampler(this.gmaPhysics.position.x, this.gmaPhysics.position.z)
      : this.gmaPhysics.position.y;

    const visualGroundY = this.isGrounded
      ? Math.max(this.gmaPhysics.position.y - this.gmaPhysics.snowDepthPos, trueGroundHeight)
      : this.gmaPhysics.position.y;

    if (this.isGrounded) {
      this.root.position.set(
        this.gmaPhysics.position.x + this.smoothNormal.x * this.cfg.sphereRadius,
        visualGroundY + this.smoothNormal.y * this.cfg.sphereRadius,
        this.gmaPhysics.position.z + this.smoothNormal.z * this.cfg.sphereRadius
      );
    } else {
      this.root.position.set(
        this.gmaPhysics.position.x,
        visualGroundY + this.cfg.sphereRadius,
        this.gmaPhysics.position.z
      );
    }

    const isCrashing = this.gmaPhysics.state === MovementState.Crashing && this.gmaPhysics.ragdoll.active;
    if (this.wasCrashing && !isCrashing) {
      this.skierCharacter.resetPose();
    }
    this.wasCrashing = isCrashing;

    // If crashing, ragdoll limbs track the Verlet particles without detaching
    if (isCrashing) {
      const pts = this.gmaPhysics.ragdoll.points;
      if (pts.length >= 21) {
        // 1. Root translates strictly with pelvis particle
        this.root.position.copy(pts[0].pos);
        this.skierCharacter.root.position.set(0, 0, 0);
        this.skierCharacter.joints.hips.position.set(0, 0, 0);

        // 2. Compute 3D Torso / Pelvis Orientation
        // Up: Pelvis (0) -> Chest (2)
        const uUp = new THREE.Vector3().subVectors(pts[2].pos, pts[0].pos).normalize();
        if (uUp.lengthSq() < 0.5) uUp.set(0, 1, 0);

        // Lateral Right: Left Hip (11) -> Right Hip (14)
        const uHipLat = new THREE.Vector3().subVectors(pts[14].pos, pts[11].pos).normalize();
        if (uHipLat.lengthSq() < 0.5) uHipLat.set(1, 0, 0);

        // Character Back: uHipLat x uUp (orthogonal to chest)
        const uBack = new THREE.Vector3().crossVectors(uHipLat, uUp).normalize();
        if (uBack.lengthSq() < 0.5) {
          uBack.set(0, 0, 1);
          if (Math.abs(uUp.dot(uBack)) > 0.9) uBack.set(1, 0, 0);
          uBack.crossVectors(uBack, uUp).normalize();
        }

        // Re-orthogonalize Right: Up x Back
        const uRight = new THREE.Vector3().crossVectors(uUp, uBack).normalize();

        // Right-handed basis for visualRoot: X = uRight, Y = uUp, Z = uBack
        // Note: SkierCharacter.root has rotation.y = Math.PI, mapping its local +Z (facing/toes/goggles)
        // to visualRoot's -Z (-uBack = uFront) and local +X (left) to visualRoot's -X (-uRight = uLeft).
        // det([uRight, uUp, uBack]) is strictly +1 (no reflection / squashing).
        const basisMat = new THREE.Matrix4().makeBasis(uRight, uUp, uBack);
        this.visualRoot.quaternion.setFromRotationMatrix(basisMat);
        this.visualRoot.updateMatrixWorld(true);

        // 3. Helper to orient a child joint's rotation without translating joint sockets
        const parentQuatInv = new THREE.Quaternion();
        const localTarget = new THREE.Vector3();
        const orientJoint = (joint: THREE.Group | undefined, defaultAxis: THREE.Vector3, worldDir: THREE.Vector3) => {
          if (!joint || !joint.parent) return;
          if (worldDir.lengthSq() < 1e-4) return;
          joint.parent.updateMatrixWorld(true);
          joint.parent.getWorldQuaternion(parentQuatInv).invert();
          localTarget.copy(worldDir).applyQuaternion(parentQuatInv).normalize();
          joint.quaternion.setFromUnitVectors(defaultAxis, localTarget);
          joint.updateMatrixWorld(true);
        };

        const axisY = new THREE.Vector3(0, 1, 0);
        const axisNegY = new THREE.Vector3(0, -1, 0);
        const axisX = new THREE.Vector3(1, 0, 0);
        const axisNegX = new THREE.Vector3(-1, 0, 0);

        // Spine: Pelvis -> Chest (waist remains attached)
        orientJoint(this.skierCharacter.joints.spine, axisY, new THREE.Vector3().subVectors(pts[2].pos, pts[0].pos));

        // Neck: Chest -> Head (neck remains attached)
        orientJoint(this.skierCharacter.joints.neck, axisY, new THREE.Vector3().subVectors(pts[4].pos, pts[3].pos));

        // Left Arm: Shoulders rigidly attached, bones orient towards elbow and hand
        orientJoint(this.skierCharacter.joints.leftShoulder, axisX, new THREE.Vector3().subVectors(pts[6].pos, pts[5].pos));
        orientJoint(this.skierCharacter.joints.leftElbow, axisX, new THREE.Vector3().subVectors(pts[7].pos, pts[6].pos));

        // Right Arm: Shoulders rigidly attached, bones orient towards elbow and hand
        orientJoint(this.skierCharacter.joints.rightShoulder, axisNegX, new THREE.Vector3().subVectors(pts[9].pos, pts[8].pos));
        orientJoint(this.skierCharacter.joints.rightElbow, axisNegX, new THREE.Vector3().subVectors(pts[10].pos, pts[9].pos));

        // Left Leg: Waist and Knees rigidly attached
        const lShin = new THREE.Vector3().subVectors(pts[13].pos, pts[12].pos);
        orientJoint(this.skierCharacter.joints.leftHip, axisNegY, new THREE.Vector3().subVectors(pts[12].pos, pts[11].pos));
        orientJoint(this.skierCharacter.joints.leftKnee, axisNegY, lShin);

        // Right Leg: Waist and Knees rigidly attached
        const rShin = new THREE.Vector3().subVectors(pts[16].pos, pts[15].pos);
        orientJoint(this.skierCharacter.joints.rightHip, axisNegY, new THREE.Vector3().subVectors(pts[15].pos, pts[14].pos));
        orientJoint(this.skierCharacter.joints.rightKnee, axisNegY, rShin);

        // 4. Orient Ankles so skis strictly match the physical simulated ski particles (Tip and Tail)
        const orientAnkle = (
          ankle: THREE.Group | undefined,
          kneePos: THREE.Vector3,
          footPos: THREE.Vector3,
          tipPos: THREE.Vector3,
          tailPos: THREE.Vector3
        ) => {
          if (!ankle || !ankle.parent) return;

          // Forward vector along ski from tail particle to tip particle (physical ski direction)
          const fwd = new THREE.Vector3().subVectors(tipPos, tailPos).normalize();
          if (fwd.lengthSq() < 0.5) fwd.set(0, 0, 1);

          // Leg up vector from foot to knee
          const legUp = new THREE.Vector3().subVectors(kneePos, footPos).normalize();
          if (legUp.lengthSq() < 0.5) legUp.set(0, 1, 0);

          // Strictly right-handed orthonormal basis: X = right, Y = norm, Z = fwd (det = +1.0)
          const right = new THREE.Vector3().crossVectors(legUp, fwd).normalize();
          if (right.lengthSq() < 0.5) {
            right.set(1, 0, 0);
            if (Math.abs(fwd.dot(right)) > 0.9) right.set(0, 1, 0);
            right.crossVectors(right, fwd).normalize();
          }
          const norm = new THREE.Vector3().crossVectors(fwd, right).normalize();

          const targetMat = new THREE.Matrix4().makeBasis(right, norm, fwd);
          const targetQuat = new THREE.Quaternion().setFromRotationMatrix(targetMat);

          ankle.parent.updateMatrixWorld(true);
          const parentInv = new THREE.Quaternion();
          ankle.parent.getWorldQuaternion(parentInv).invert();
          ankle.quaternion.copy(parentInv.multiply(targetQuat));
          ankle.updateMatrixWorld(true);
        };

        orientAnkle(this.skierCharacter.joints.leftAnkle, pts[12].pos, pts[13].pos, pts[17].pos, pts[18].pos);
        orientAnkle(this.skierCharacter.joints.rightAnkle, pts[15].pos, pts[16].pos, pts[19].pos, pts[20].pos);

        // Tuck poles along forearms during ragdoll tumble
        if (this.skierCharacter.joints.leftPole) this.skierCharacter.joints.leftPole.rotation.set(0.6, 0, 0);
        if (this.skierCharacter.joints.rightPole) this.skierCharacter.joints.rightPole.rotation.set(0.6, 0, 0);
      }
      this.triggerCrashSpray();
    } else {
      // 1. Build authentic slope-tangent orthonormal basis (conforms skis 100% to terrain slope)
      const fwdX = -Math.sin(this.yaw);
      const fwdZ = -Math.cos(this.yaw);
      this._forward.set(fwdX, 0, fwdZ).normalize();

      // Right vector level with terrain slope contours
      this._right.crossVectors(this._forward, this.smoothNormal).normalize();

      // Slope forward vector strictly tangent to terrain slope along travel direction
      this._slopeFwd.crossVectors(this.smoothNormal, this._right).normalize();
      this._negSlopeFwd.copy(this._slopeFwd).negate();

      // Right-handed basis for visualRoot where character faces -Z in visualRoot
      // xAxis = _right, yAxis = smoothNormal, zAxis = _negSlopeFwd
      this._basisMatrix.makeBasis(this._right, this.smoothNormal, this._negSlopeFwd);
      this._targetQuat.setFromRotationMatrix(this._basisMatrix);

      if (!this.isGrounded) {
        this._airEuler.set(this.gmaPhysics.airPitch, 0, this.gmaPhysics.airRoll);
        const airQ = new THREE.Quaternion().setFromEuler(this._airEuler);
        this._targetQuat.multiply(airQ);
      }
      this.visualRoot.quaternion.slerp(this._targetQuat, Math.min(1, dt * 24));

      // 2. Dynamic Procedural Animation Update (Idle glide vs Alpine Carving + Jump + 360 Spin Trick)
      const inAir = !this.isGrounded;
      const hasSpinInput = !!input.left || !!input.right || (input.trickSpinX !== undefined && Math.abs(input.trickSpinX) > 0.05);
      const isSpinning = inAir && (hasSpinInput || Math.abs(this.gmaPhysics.angularVelocitySpin) > 0.15 || this.gmaPhysics.accumulatedAirSpinDeg > 2.0);

      let spinDir = 1.0;
      if (input.right || (input.trickSpinX !== undefined && input.trickSpinX > 0.05) || this.gmaPhysics.angularVelocitySpin < -0.1) {
        spinDir = -1.0; // Right Spin
      } else if (input.left || (input.trickSpinX !== undefined && input.trickSpinX < -0.05) || this.gmaPhysics.angularVelocitySpin > 0.1) {
        spinDir = 1.0;  // Left Spin
      }

      const spinProgress = (this.gmaPhysics.accumulatedAirSpinDeg % 360.0) / 360.0;

      this.animator.update({
        dt,
        speed: this.speed,
        leanAngle: this.leanAngle,
        isGrounded: this.isGrounded,
        isStaking: this.gmaPhysics.isStaking,
        isDrifting: this.isDrifting,
        tuck: !!input.forward && this.speed > 8,
        inputLeft: !!input.left || (input.steerX !== undefined && input.steerX < -0.25),
        inputRight: !!input.right || (input.steerX !== undefined && input.steerX > 0.25),
        isGliding: this.gmaPhysics.isGliding,
        airTime: this.airTimer,
        jumpPressed: input.jump,
        isSpinning,
        spinProgress,
        spinDirection: spinDir,
        spinRate: this.gmaPhysics.angularVelocitySpin
      });

      // 3. Foot Grounding & Ski Elevation Clamping:
      // Skis sit inside the carved rut floor (+0.016m) nestled between raised displaced snow berms.
      // Automatically compensates for hip crouch/tuck drop so feet and skis remain physically grounded in the track.
      const crouchComp = this.animator.crouchOffset;
      const baseElev = -this.cfg.sphereRadius + 0.016 + crouchComp;
      this.skierCharacter.root.position.y = baseElev;

      // 4. Multi-Point Terrain Clearance Clamping:
      // Checks all 16 contact points of the skis (shovel tips, front edges, mid edges, tails).
      // Keep ski bases naturally planted inside the rut floor without floating or submerging.
      if (this.isGrounded && this.terrainSampler) {
        this.skierCharacter.root.updateMatrixWorld(true);
        let maxPenetration = 0.0;
        const targetClearance = 0.016; // Ski base sits directly inside carved rut channel
        const contacts = this.skierCharacter.footContacts;

        for (let i = 0; i < contacts.length; i++) {
          contacts[i].getWorldPosition(this._contactWorldPos);
          const localGroundY = this.terrainSampler(this._contactWorldPos.x, this._contactWorldPos.z);
          const penetration = (localGroundY + targetClearance) - this._contactWorldPos.y;
          if (penetration > maxPenetration) {
            maxPenetration = penetration;
          }
        }

        const normalY = Math.max(0.25, this.smoothNormal.y);
        const normPenetration = maxPenetration / normalY;

        if (normPenetration > 0) {
          // Immediately eliminate penetration along the surface normal
          this.groundClearanceOffset = Math.max(this.groundClearanceOffset, normPenetration);
        } else {
          this.groundClearanceOffset = THREE.MathUtils.damp(
            this.groundClearanceOffset,
            0.0,
            14.0,
            dt
          );
        }
        this.skierCharacter.root.position.y += this.groundClearanceOffset;
      }

      // 4. Staking Sound Trigger
      if (this.isGrounded && this.gmaPhysics.isStaking) {
        if (this.gmaPhysics.stakingPlantTriggered) {
          this.audio.playPolePlant();
          this.gmaPhysics.stakingPlantTriggered = false;
        }
      } else {
        this.gmaPhysics.stakingPlantTriggered = false;
      }
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
        this.isDrifting,
        this.leanAngle
      );
    }
    this.audio.update(this.speed, this.vLateral, this.isGrounded, this.isDrifting, this.gripUtilization);

    this.gmaPhysics.trickScoring.updateDisplay(dt);
    this.trickEngine.updateDisplayTimer(dt);
  }

  public updateTrailLighting(
    time: number,
    sunDir: THREE.Vector3,
    cameraPos: THREE.Vector3,
    nightFactor: number = 0.0,
    sunColor?: THREE.Color,
    shadowColor?: THREE.Color,
    goldenFactor: number = 0.0
  ): void {
    if (this.trailRibbon) {
      this.trailRibbon.updateUniforms(time, sunDir, cameraPos, nightFactor, sunColor, shadowColor, goldenFactor);
    }
  }

  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.terrainSampler = sampler;
    this.gmaPhysics.ragdoll.setTerrainSampler(sampler);
    if (this.trailRibbon) {
      this.trailRibbon.setTerrainSampler(sampler);
    }
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
                const skiPosOffset = side * 0.114 + (side > 0 ? 0.02 : -0.02);
                const tailPosOffset = -0.63 + (Math.random() - 0.5) * 0.16;

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

