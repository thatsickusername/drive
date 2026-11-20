import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TrickEngine } from './player/TrickEngine';
import { SurfaceType } from './world/alpineHeightfield';

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
      this.filter.frequency.value = 600;
      this.filter.Q.value = 1.2;

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
      // Deep hollow rushing scrape of snow being plowed transversely
      const targetGain = Math.min(0.32, (speed / 30) * 0.12 + (absLat / 6) * 0.18);
      const targetFreq = 380 + Math.min(650, speed * 22);
      this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.03);
    } else {
      // Crisp high-frequency slicing sound of a steel edge carving through groomed snow
      let targetGain = Math.min(0.20, (speed / 35) * 0.14);
      let targetFreq = 950 + Math.min(2200, speed * 60);

      // Edge-Bite Limit Audio Cue: subtle high-frequency board chatter between 80% and 100% grip limit
      if (gripUtilization > 0.80) {
        const chatterT = THREE.MathUtils.clamp((gripUtilization - 0.80) / 0.20, 0, 1);
        targetFreq = THREE.MathUtils.lerp(targetFreq, 3400, chatterT * 0.65);
        targetGain += chatterT * 0.07;
      }

      this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
      this.filter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
    }
  }
}

export class SnowTrailRibbon {
  private readonly maxSegments = 360;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly mesh: THREE.Mesh;
  private head = 0;
  private count = 0;
  private lastEmitPos = new THREE.Vector3(9999, 9999, 9999);
  private readonly emitDist = 0.35;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxSegments * 2 * 3);
    this.colors = new Float32Array(this.maxSegments * 2 * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const indices = new Uint32Array((this.maxSegments - 1) * 6);
    let idx = 0;
    for (let i = 0; i < this.maxSegments - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices[idx++] = a;
      indices[idx++] = c;
      indices[idx++] = b;
      indices[idx++] = b;
      indices[idx++] = c;
      indices[idx++] = d;
    }
    geo.setIndex(new THREE.BufferAttribute(indices, 1));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.60,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  public reset(): void {
    this.head = 0;
    this.count = 0;
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
    if (!isGrounded || speed < 0.8) return;

    const dist = pos.distanceTo(this.lastEmitPos);
    if (dist >= this.emitDist) {
      this.lastEmitPos.copy(pos);

      // Width: razor-thin for pure carve (0.04m), wide smeared tracks for skid/slash (0.30m)
      const slipT = THREE.MathUtils.clamp(slipAngleDeg / 48.0, 0, 1);
      const halfWidth = isDrifting ? THREE.MathUtils.lerp(0.10, 0.30, slipT) : 0.045;

      // Color/Opacity: subtle blue-grey ice trench for carve (#b2c8dc), softer bright white for smeared powder
      const baseR = isDrifting ? 0.82 : 0.68;
      const baseG = isDrifting ? 0.88 : 0.76;
      const baseB = isDrifting ? 0.94 : 0.86;

      const idx = this.head;
      const v0 = idx * 2 * 3;
      const v1 = v0 + 3;

      const liftX = normal.x * 0.04;
      const liftY = normal.y * 0.04;
      const liftZ = normal.z * 0.04;
      const groundContactY = pos.y - 0.44;

      this.positions[v0 + 0] = pos.x + right.x * halfWidth + liftX;
      this.positions[v0 + 1] = groundContactY + liftY;
      this.positions[v0 + 2] = pos.z + right.z * halfWidth + liftZ;

      this.positions[v1 + 0] = pos.x - right.x * halfWidth + liftX;
      this.positions[v1 + 1] = groundContactY + liftY;
      this.positions[v1 + 2] = pos.z - right.z * halfWidth + liftZ;

      this.colors[v0 + 0] = baseR;
      this.colors[v0 + 1] = baseG;
      this.colors[v0 + 2] = baseB;

      this.colors[v1 + 0] = baseR;
      this.colors[v1 + 1] = baseG;
      this.colors[v1 + 2] = baseB;

      this.head = (this.head + 1) % this.maxSegments;
      this.count = Math.min(this.count + 1, this.maxSegments);

      (this.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.mesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }

    // Gradual decay of trailing vertex colors
    if (this.count > 0) {
      for (let i = 0; i < this.colors.length; i++) {
        this.colors[i] *= 0.9985;
      }
      (this.mesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }
}

export interface BoarderInput {
  forward: boolean; // W / Up: slight flat push + aero tuck when moving fast
  brake: boolean;   // S / Down: dig edge to brake / hockey stop
  left: boolean;    // A / Left: carve left / air spin left
  right: boolean;   // D / Right: carve right / air spin right
  jump: boolean;    // Space: hold to crouch/charge, release to ollie
  grab?: boolean;   // Shift / J: grab board in air
}

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

export class SnowBoarder {
  public readonly rigidBody: RAPIER.RigidBody;
  public readonly collider: RAPIER.Collider;
  public readonly root: THREE.Group;
  public readonly trickEngine: TrickEngine;

  // Procedural rig hierarchy
  private readonly visualRoot = new THREE.Group();
  private readonly boardGroup = new THREE.Group();
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
  private coyoteTimer = 0;
  private jumpCharge = 0;
  private jumpBufferTimer = 0; // 140ms pre-buffer window for pop on touchdown
  private wasJumpHeld = false;
  private airPitch = 0;
  private airRoll = 0;
  private airYawVel = 0;
  private airPitchVel = 0;

  // Procedural animation springs
  private hipOffsetY = 0;
  private hipVelY = 0;
  private wasGrounded = false;

  // GMA Rhythm Carve Boost Tracking
  private lastLeanSign = 0;    // -1 (left) or +1 (right)
  private edgeCooldown = 0;    // Cooldown debouncer for edge transition impulses
  private carveHoldTime = 0;   // Duration held at deep lean (> 0.55)
  private straightTime = 0;    // Duration ridden straight (< 0.25)

  // Audio, Trail Ribbon and Particles
  private readonly audio = new SnowAudio();
  private trailRibbon!: SnowTrailRibbon;
  private sprayParticles!: THREE.Points;
  private sprayGeo!: THREE.BufferGeometry;
  private sprayPositions!: Float32Array;
  private sprayVelocities!: Float32Array;
  private sprayLifetimes!: Float32Array;
  private readonly sprayCount = 140;

  // Scratch objects (zero allocations in hot path)
  private readonly _vel = new THREE.Vector3();
  private readonly _up = new THREE.Vector3(0, 1, 0);
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _boardUp = new THREE.Vector3();
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

    // 1. Rapier Physics Body (frictionless sphere prevents triangle seam snags)
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(spawnPos.x, spawnPos.y + this.cfg.sphereRadius + 0.2, spawnPos.z)
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
      color: 0xffffff,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
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

  private buildCharacterMesh(): void {
    // Materials
    const boardMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.3, metalness: 0.1 });
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.6 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xf4a261, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x264653, roughness: 0.8 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf1faee, roughness: 0.4 });
    const goggleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });

    // Snowboard (length along -Z, width along X)
    const boardDeck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.55), boardMat);
    boardDeck.castShadow = true;
    boardDeck.receiveShadow = true;
    this.boardGroup.add(boardDeck);

    // Upturned nose & tail tips
    const tipGeo = new THREE.BoxGeometry(0.30, 0.035, 0.22);
    const nose = new THREE.Mesh(tipGeo, boardMat);
    nose.position.set(0, 0.035, -0.84);
    nose.rotation.x = 0.35;
    const tail = new THREE.Mesh(tipGeo, boardMat);
    tail.position.set(0, 0.035, 0.84);
    tail.rotation.x = -0.35;
    this.boardGroup.add(nose, tail);

    // Character Rig (Regular stance: torso rotated ~70 sideways to the board)
    this.hipsGroup.position.set(0, 0.55, 0);
    this.boardGroup.add(this.hipsGroup);

    // Legs (two boots/shins anchored to bindings)
    const legGeo = new THREE.CapsuleGeometry(0.085, 0.38, 4, 8);
    const legFront = new THREE.Mesh(legGeo, pantsMat);
    legFront.position.set(0, -0.22, -0.26);
    legFront.rotation.x = -0.15;
    legFront.castShadow = true;

    const legBack = new THREE.Mesh(legGeo, pantsMat);
    legBack.position.set(0, -0.22, 0.26);
    legBack.rotation.x = 0.15;
    legBack.castShadow = true;
    this.hipsGroup.add(legFront, legBack);

    // Torso (rotated sideways for snowboard stance)
    this.torsoGroup.position.set(0, 0.08, 0);
    this.torsoGroup.rotation.y = Math.PI * 0.42;
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

    // Head + Helmet + Goggles (looking forward along board nose)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.62, 0);
    headGroup.rotation.y = -Math.PI * 0.42; // Look down the mountain
    this.torsoGroup.add(headGroup);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), helmetMat);
    helmet.castShadow = true;
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.10), goggleMat);
    goggles.position.set(0, 0.01, -0.12);
    headGroup.add(helmet, goggles);

    // Arms (out for balance)
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

    this.torsoGroup.add(this.armL, this.armR);

    // Offset board so bottom sits right at the sphere's contact point
    this.boardGroup.position.y = -this.cfg.sphereRadius + 0.02;
    this.visualRoot.add(this.boardGroup);
  }

  /**
   * Reset boarder state and position for respawns and teleports.
   */
  public reset(x: number, y: number, z: number, yaw: number = 0): void {
    this.rigidBody.setTranslation({ x, y, z }, true);
    this.rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.yaw = yaw;
    this.speed = 0;
    this.leanAngle = 0;
    this.carveCharge = 0;
    this.pumpChain = 0;
    this.pumpFlow = 1.0;
    this.carveHoldTime = 0;
    this.straightTime = 0;
    this.stumbleTimer = 0;
    this.airTimer = 0;
    this.airYawVel = 0;
    this.airPitchVel = 0;
    this.groundDistance = 0;
    this.lastLeanSign = 0;
    this.edgeCooldown = 0;
    this.isDrifting = false;
    this.isSlashing = false;
    this.slipAngleDeg = 0;
    this.vForward = 0;
    this.vLateral = 0;
    this.gripUtilization = 0;
    this.pumpKick = 0;
    this.preWindCoil = 0;
    this.prevSlopeGrade = 0;
    this.wiggleTimer = 0;
    this.lastWiggleSign = 0;
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.jumpCharge = 0;
    this.wasJumpHeld = false;
    this.airPitch = 0;
    this.airRoll = 0;
    this.hipOffsetY = 0;
    this.hipVelY = 0;
    if (this.trailRibbon) this.trailRibbon.reset();
    this.root.position.set(x, y, z);
    this.visualRoot.quaternion.setFromAxisAngle(this._up, yaw);
    this.trickEngine.startAir();
  }

  /**
   * Call once per fixed physics step (e.g., dt = 1 / 60).
   */
  public fixedUpdate(dt: number, input: BoarderInput, surfaceType: SurfaceType = 'POWDER'): void {
    const pos = this.rigidBody.translation();
    const linvel = this.rigidBody.linvel();
    this._vel.set(linvel.x, linvel.y, linvel.z);
    this.speed = this._vel.length();

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

    // True perpendicular normal distance (invariant to slope angle)
    const normalDistCenter = hitCenter ? distCenter * Math.max(0.15, hitCenter.normal.y) : 999.0;
    const normalDistNose = hitNose ? distNose * Math.max(0.15, hitNose.normal.y) : 999.0;
    const normalDistTail = hitTail ? distTail * Math.max(0.15, hitTail.normal.y) : 999.0;
    this.groundDistance = Math.min(normalDistCenter, normalDistNose, normalDistTail);

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

    const isGroundHit = normW > 0;
    this.wasGrounded = this.isGrounded;

    if (isGroundHit) {
      this.isGrounded = true;
      this.coyoteTimer = 0.15;
      this._rawNormal.set(normX / normW, normY / normW, normZ / normW).normalize();
      this.smoothNormal.lerp(this._rawNormal, Math.min(1, dt * 25)).normalize();
      this.rigidBody.setGravityScale(0.0, true);

      // Only perform jump landing evaluation if player was in the air for a real deliberate jump (> 0.30s)
      const wasRealJump = this.airTimer > 0.30;
      if (!this.wasGrounded && wasRealJump) {
        this.airYawVel = 0;
        this.airPitchVel = 0;

        // Grand Mountain Adventure landing impact decomposition:
        // Downward normal impact velocity is absorbed by snow (NO outward bounce)
        const vDotNormal = this._vel.dot(this.smoothNormal);
        if (vDotNormal < 0) {
          this._vel.addScaledVector(this.smoothNormal, -vDotNormal);
        }

        // 1. Slope normal vs board up alignment
        this._boardUp.set(0, 1, 0).applyQuaternion(this.visualRoot.quaternion);
        const pitchAlign = THREE.MathUtils.clamp(this._boardUp.dot(this.smoothNormal), -1, 1);
        const pitchErrorDeg = THREE.MathUtils.radToDeg(Math.acos(pitchAlign));

        // 2. Horizontal travel direction vs board heading alignment
        const horizSpeed = Math.hypot(this._vel.x, this._vel.z);
        let yawErrorDeg = 0;
        if (horizSpeed > 2.0) {
          const travelYaw = Math.atan2(-this._vel.x, -this._vel.z);
          let yDiff = Math.abs((travelYaw - this.yaw) % (Math.PI * 2));
          if (yDiff > Math.PI) yDiff = Math.PI * 2 - yDiff;
          yawErrorDeg = THREE.MathUtils.radToDeg(yDiff);
        }

        const impactSpeed = Math.abs(vDotNormal);

        // 3-Tier Landing Spectrum: Stomped vs Recoverable Revert vs Wipeout
        if (impactSpeed > 18.0 || yawErrorDeg > 55.0 || pitchErrorDeg > 45.0) {
          // Tier 3: Hard Wipeout (severe speed scrub, stumble, crash spray, trick failed)
          this._vel.multiplyScalar(0.22);
          this.stumbleTimer = 0.50;
          this.hipVelY = -4.5;
          this.triggerCrashSpray();
          this.trickEngine.land('CRASH');
          this.audio.playLandThump(false);
        } else if (impactSpeed > 11.5 || yawErrorDeg > 20.0 || pitchErrorDeg > 30.0) {
          // Tier 2: Sketchy / Revert (recoverable pivot out of landing, heavy snow spray, 25-35% speed scrub, recoverable)
          this._vel.multiplyScalar(0.72);
          this.stumbleTimer = 0.25;
          this.hipVelY = -Math.min(4.5, impactSpeed * 0.35);
          if (horizSpeed > 2.0) {
            const travelYaw = Math.atan2(-this._vel.x, -this._vel.z);
            this.yaw = travelYaw; // Rider reverts & pivots out of landing in travel direction
          }
          this.triggerCrashSpray(); // Heavy snow spray on revert
          this.trickEngine.land('SKETCHY');
          this.audio.playLandThump(true);
        } else {
          // Tier 1: Stomped Clean Landing (<20 deg yaw error): 100% momentum retained + subtle landing boost + crisp audio thump
          this._vel.multiplyScalar(1.03);
          this.stumbleTimer = 0;
          this.hipVelY = -Math.min(4.0, impactSpeed * 0.25);
          this.trickEngine.land('STOMPED');
          this.audio.playLandThump(true);
        }

        // Fire pre-buffered jump pop immediately on touchdown if primed deliberately
        if (this.jumpBufferTimer > 0 && this.jumpCharge > 0.15) {
          this.triggerJumpPop(this.jumpCharge);
        }
      } else if (!this.wasGrounded) {
        // Micro-ground separation over bumps: absorb downward normal cleanly with zero bounce
        const vDotNormal = this._vel.dot(this.smoothNormal);
        if (vDotNormal < 0) {
          this._vel.addScaledVector(this.smoothNormal, -vDotNormal);
        }
      }
      this.airTimer = 0;

      // Reset air trick angles on landing
      this.airPitch = THREE.MathUtils.damp(this.airPitch, 0, 16, dt);
      this.airRoll = THREE.MathUtils.damp(this.airRoll, 0, 16, dt);
    } else {
      if (this.wasGrounded) {
        this.trickEngine.startAir();
      }
      this.isGrounded = false;
      this.airTimer += dt;
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      this.smoothNormal.lerp(this._up, Math.min(1, dt * 4)).normalize();
      this.rigidBody.setGravityScale(1.0, true);
    }

    // 2. Input Inertia (Lean-Driven Steering with Asymmetric Slewing)
    // Left input = -1 (lean left), Right input = +1 (lean right)
    // Engaging edge is fast & biting (1.35x); releasing edge is deliberate & controlled (0.75x)
    const targetLean = (input.right ? 1.0 : 0.0) - (input.left ? 1.0 : 0.0);
    const curHorizSpeedForLean = Math.hypot(this._vel.x, this._vel.z);
    const speedLeanT = THREE.MathUtils.clamp(curHorizSpeedForLean / 18.0, 0, 1);
    const baseLeanSpring = THREE.MathUtils.lerp(12.0, 4.5, speedLeanT);

    const isEngaging = Math.abs(targetLean) > Math.abs(this.leanAngle);
    const slewMultiplier = isEngaging ? 1.35 : 0.75;
    const leanSpring = (targetLean === 0 ? Math.max(baseLeanSpring, 8.0) : baseLeanSpring) * slewMultiplier;
    this.leanAngle = THREE.MathUtils.damp(this.leanAngle, targetLean, leanSpring, dt);

    // 3. Apply Grounded vs Airborne Physics
    if (this.isGrounded) {
      this.updateGroundedPhysics(dt, input, surfaceType);
    } else {
      this.updateAirPhysics(dt, input);
    }

    // 4. Ollie / Jump Handling + Ground Pre-Wind for Spins
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    const canCharge = this.isGrounded || this.coyoteTimer > 0 || this.groundDistance < 1.6;
    if (input.jump && canCharge) {
      this.jumpCharge = Math.min(1, this.jumpCharge + dt * 2.2);

      // Ground Pre-Wind: coiling upper body while crouched/charging Ollie
      const spinDir = (input.left ? 1.0 : 0.0) - (input.right ? 1.0 : 0.0);
      if (Math.abs(spinDir) > 0.1) {
        this.preWindCoil = THREE.MathUtils.clamp(this.preWindCoil + spinDir * 3.8 * dt, -1.0, 1.0);
      } else {
        this.preWindCoil = THREE.MathUtils.damp(this.preWindCoil, 0, 3.5, dt);
      }
    } else if (!input.jump && this.wasJumpHeld) {
      if (this.isGrounded || this.coyoteTimer > 0) {
        this.triggerJumpPop(this.jumpCharge);
      } else {
        // Airborne within pre-buffer window (140ms)
        this.jumpBufferTimer = 0.14;
      }
    } else if (!input.jump && this.jumpBufferTimer <= 0) {
      this.jumpCharge = THREE.MathUtils.damp(this.jumpCharge, 0, 10, dt);
      this.preWindCoil = THREE.MathUtils.damp(this.preWindCoil, 0, 8, dt);
    }
    this.wasJumpHeld = input.jump;
  }

  private triggerJumpPop(charge: number): void {
    const popRatio = Math.max(0.2, charge);
    const impulse = THREE.MathUtils.lerp(
      this.cfg.jumpImpulseMin,
      this.cfg.jumpImpulseMax,
      popRatio
    );
    // Pop mostly upward with slight slope-normal kick
    const popX = this.smoothNormal.x * impulse * 0.35;
    const popY = Math.max(impulse * 0.85, this.smoothNormal.y * impulse);
    const popZ = this.smoothNormal.z * impulse * 0.35;

    this.rigidBody.setLinvel(
      { x: this._vel.x + popX, y: Math.max(0, this._vel.y) + popY, z: this._vel.z + popZ },
      true
    );
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.jumpCharge = 0;
    this.jumpBufferTimer = 0;

    // Convert ground pre-wind coil to immediate initial angular impulse off lip
    if (Math.abs(this.preWindCoil) > 0.05) {
      this.airYawVel = this.preWindCoil * 9.2;
    }
    this.preWindCoil = 0;

    this.hipVelY += 3.5; // Visual pop extension
    this.trickEngine.startAir();
  }

  private updateGroundedPhysics(
    dt: number,
    input: BoarderInput,
    surfaceType: SurfaceType
  ): void {
    // Surface modifier hook
    let surfaceFrictionMult = 1.0;
    let surfaceGripMult = 1.0;
    if (surfaceType === 'ICE') {
      surfaceFrictionMult = 0.20; // Super slick glide on river ice
      surfaceGripMult = 0.45;
    } else if (surfaceType === 'ROCK') {
      surfaceFrictionMult = 3.6;  // Heavy drag on rock
      surfaceGripMult = 0.70;
    } else if (surfaceType === 'POWDER') {
      surfaceFrictionMult = this.cfg.powderFriction / this.cfg.baseFriction;
      surfaceGripMult = 1.08;
    }

    // Step 1: Sidecut Carving Kinematics
    const absLean = Math.abs(this.leanAngle);
    // Non-linear edge roll: responsive center, deeper max tilt at full lean (~62 deg)
    const edgeRollRad = absLean * (0.55 + 0.53 * absLean);
    const curHorizSpeed = Math.hypot(this._vel.x, this._vel.z);

    // Effective sidecut carve radius: R = R_sc / (sin(theta_edge) + epsilon)
    const sidecutR = this.cfg.sidecutRadius / (Math.sin(edgeRollRad) + 0.08);

    // Carve turn rate: omega = v / R
    const carveTurnRate = -Math.sign(this.leanAngle) * (Math.max(1.8, curHorizSpeed) / sidecutR);
    // Snappy low-speed pivot turn rate for nimble maneuvering at idle
    const pivotTurnRate = -this.leanAngle * 3.6;

    // Higher blend threshold (6 m/s): keeps nimble pivot handling active at slow speeds
    const speedBlend = THREE.MathUtils.clamp(curHorizSpeed / 6.0, 0, 1);
    let turnRate = THREE.MathUtils.lerp(pivotTurnRate, carveTurnRate, speedBlend);

    // High-speed turn authority damping: G-load and inertia resist quick direction changes
    const highSpeedDamping = THREE.MathUtils.lerp(1.0, 0.70, THREE.MathUtils.clamp((curHorizSpeed - 15.0) / 20.0, 0, 1));
    turnRate *= highSpeedDamping;

    if (this.stumbleTimer > 0) {
      this.stumbleTimer = Math.max(0, this.stumbleTimer - dt);
      turnRate *= 0.35; // Reduced steering after bad landing
    }

    this.yaw += turnRate * dt;

    // Natural momentum & fall-line self-alignment when rider is riding straight
    // Dead-zone prevents micro-oscillation snapping; speed-scaled rate for gentle drift
    if (curHorizSpeed > 1.5 && absLean < 0.12 && !input.brake) {
      const currentVelYaw = Math.atan2(-this._vel.x, -this._vel.z);
      let alignDiff = (currentVelYaw - this.yaw) % (Math.PI * 2);
      if (alignDiff > Math.PI) alignDiff -= Math.PI * 2;
      if (alignDiff < -Math.PI) alignDiff += Math.PI * 2;
      // Dead-zone: ignore alignment when heading is within ~1.7 deg of velocity
      if (Math.abs(alignDiff) > 0.03) {
        const alignRate = THREE.MathUtils.lerp(0.6, 1.2, THREE.MathUtils.clamp(curHorizSpeed / 12.0, 0, 1));
        this.yaw += THREE.MathUtils.clamp(alignDiff, -alignRate * dt, alignRate * dt);
      }
    }

    // Step 2: Slope-aligned orthonormal basis
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._forward.addScaledVector(this.smoothNormal, -this._forward.dot(this.smoothNormal)).normalize();
    this._right.crossVectors(this._forward, this.smoothNormal).normalize();

    // Cancel any outward bounce perpendicular to slope completely
    const vDotNormal = this._vel.dot(this.smoothNormal);
    if (vDotNormal > 0) {
      this._vel.addScaledVector(this.smoothNormal, -vDotNormal);
    }

    // Step 3: Slope Gravity Projection: g_slope = g - (g . n) * n
    const gMag = -this.cfg.gravity;
    const gDotN = gMag * this.smoothNormal.y;
    const gSlopeX = -gDotN * this.smoothNormal.x;
    const gSlopeY = gMag - gDotN * this.smoothNormal.y;
    const gSlopeZ = -gDotN * this.smoothNormal.z;
    this._vel.x += gSlopeX * dt;
    this._vel.y += gSlopeY * dt;
    this._vel.z += gSlopeZ * dt;

    // Step 4: Decompose velocity into forward and lateral components
    this.vForward = this._vel.dot(this._forward);
    this.vLateral = this._vel.dot(this._right);
    const planarSpeed = Math.hypot(this.vForward, this.vLateral);

    // Slip angle calculation
    let slipAngle = 0;
    if (planarSpeed > 0.2) {
      slipAngle = Math.acos(THREE.MathUtils.clamp(Math.abs(this.vForward) / planarSpeed, 0, 1));
    }
    this.slipAngleDeg = THREE.MathUtils.radToDeg(slipAngle);

    // Dynamic Edge Bite vs Skid evaluation
    const centripetalAcc = planarSpeed * Math.abs(turnRate);
    const edgeBiteLimit = (12.5 + Math.sin(edgeRollRad) * 9.5) * surfaceGripMult;
    this.gripUtilization = THREE.MathUtils.clamp(centripetalAcc / Math.max(0.1, edgeBiteLimit), 0, 1.5);
    const highGDrift = centripetalAcc > edgeBiteLimit && planarSpeed > 6.0;
    this.isDrifting = highGDrift || input.brake || slipAngle > this.cfg.driftAngleThreshold;

    // Progressive grip ratio: 1.0 = full grip, 0.0 = fully broken loose
    const gripRatio = highGDrift ? THREE.MathUtils.clamp(1.0 - (centripetalAcc - edgeBiteLimit) / 8.0, 0, 1) : (this.isDrifting ? 0.0 : 1.0);

    // Carve vs. Slash Turn Split:
    // Moderate slip angle (<65 deg) with active lean input = controlled spray slash turn instead of full hockey stop
    this.isSlashing = this.isDrifting && !input.brake && slipAngle < 1.13 && absLean > 0.30;

    let newVFwd = this.vForward;
    let newVLat = this.vLateral;

    if (!this.isDrifting) {
      // CLEAN CARVING:
      // Edge tracks along the arc; lateral slip eliminated with progressive grip falloff near limit
      const latDampRate = THREE.MathUtils.lerp(12.0, 32.0, gripRatio);
      newVFwd = Math.max(newVFwd, planarSpeed * 0.998);
      newVLat = THREE.MathUtils.damp(newVLat, 0, latDampRate, dt);
    } else if (this.isSlashing) {
      // CONTROLLED SLASH / SPRAY TURN:
      // Softened lateral drag and reduced speed scrub keeps momentum through the plume
      const latDamp = Math.min(1.0, this.cfg.edgeGrip * surfaceGripMult * 0.70 * dt);
      const latDelta = this.vLateral * latDamp;
      newVLat -= latDelta;

      if (Math.abs(latDelta) > 0.001 && planarSpeed > 0.1) {
        const sign = newVFwd >= 0 ? 1 : -1;
        newVFwd = sign * Math.min(planarSpeed, Math.sqrt(newVFwd * newVFwd + this.cfg.gripTransfer * 1.10 * latDelta * latDelta));
      }

      const skidDecel = THREE.MathUtils.clamp(this.cfg.carveSpeedBleed * dt * 1.8, 0, 0.25);
      newVFwd *= (1.0 - skidDecel);
    } else {
      // SKIDDING / DRIFTING / HOCKEY STOP:
      // Edge breaks loose: transverse friction slows both lateral slide and forward travel
      const latDamp = Math.min(1.0, this.cfg.edgeGrip * surfaceGripMult * dt);
      const latDelta = this.vLateral * latDamp;
      newVLat -= latDelta;

      if (Math.abs(latDelta) > 0.001 && planarSpeed > 0.1) {
        const sign = newVFwd >= 0 ? 1 : -1;
        newVFwd = sign * Math.min(planarSpeed, Math.sqrt(newVFwd * newVFwd + this.cfg.gripTransfer * latDelta * latDelta));
      }

      // Bleed forward speed during skid / brake
      const skidRatio = highGDrift
        ? Math.min(1.0, (centripetalAcc - edgeBiteLimit) / 8.0)
        : (slipAngle - this.cfg.driftAngleThreshold) / (Math.PI / 2 - this.cfg.driftAngleThreshold);
      const skidDecel = THREE.MathUtils.clamp(skidRatio * this.cfg.carveSpeedBleed * dt * 3.5, 0, 0.45);
      newVFwd *= (1.0 - skidDecel);
    }

    // Forward glide friction (slick on snow: 0.018 to 0.040)
    // Clean carve rail bonus: sustained carved arc reduces friction by up to 25%
    const cleanCarveBonus = (!this.isDrifting && this.carveHoldTime > 0.3 && absLean > 0.25)
      ? THREE.MathUtils.lerp(1.0, 0.75, THREE.MathUtils.clamp((this.carveHoldTime - 0.3) / 0.5, 0, 1))
      : 1.0;
    const speedFactor = THREE.MathUtils.clamp((planarSpeed - 2.5) / 3.5, 0.0, 1.0);
    const speedFriction = THREE.MathUtils.lerp(0.045, this.cfg.baseFriction, speedFactor);
    const baseFwdFriction = input.brake
      ? speedFriction + this.cfg.brakeDrag * 0.18
      : speedFriction;
    const activeFwdFriction = baseFwdFriction * surfaceFrictionMult * cleanCarveBonus;
    const fwdDamp = Math.max(0, 1.0 - activeFwdFriction * dt);
    newVFwd *= fwdDamp;

    // Step 5: Grand Mountain Adventure Momentum Pumping & Dynamic Unweighting
    this.edgeCooldown = Math.max(0, this.edgeCooldown - dt);

    // 1. Accumulate leg load from centripetal Gs during carved turn
    if (absLean > 0.22 && !this.isDrifting) {
      this.carveHoldTime += dt;
      this.straightTime = 0;
      const gStrain = 0.5 + Math.min(1.5, centripetalAcc / 9.81);
      this.carveCharge = Math.min(1.0, this.carveCharge + absLean * this.cfg.chargeRate * gStrain * 0.65 * dt);
      const currentSign = this.leanAngle > 0 ? 1 : -1;
      if (this.lastLeanSign === 0) {
        this.lastLeanSign = currentSign;
      }
    }

    // 2. Unweighting release on zero-crossing edge switch
    const isEdgeSwitch =
      (this.lastLeanSign < 0 && this.leanAngle > 0.03) ||
      (this.lastLeanSign > 0 && this.leanAngle < -0.03);

    if (isEdgeSwitch) {
      if (this.carveHoldTime >= 0.13 && this.carveCharge > 0.10 && this.edgeCooldown <= 0) {
        // Fall-line alignment check: rewarding turns that release into downhill gradient
        const fallLineMag = Math.hypot(gSlopeX, gSlopeZ);
        let fallLineAlign = 0.5;
        if (fallLineMag > 0.1) {
          fallLineAlign = Math.max(0, (this._forward.x * (gSlopeX / fallLineMag) + this._forward.z * (gSlopeZ / fallLineMag)));
        }

        this.pumpFlow = Math.min(2.2, this.pumpFlow + 0.22);
        this.pumpChain = Math.min(4, this.pumpChain + 1);

        const boostCurve = 0.3 * this.carveCharge + 0.7 * (this.carveCharge * this.carveCharge);
        const lowSpeedBonus = THREE.MathUtils.lerp(1.4, 1.0, THREE.MathUtils.clamp(planarSpeed / 8.0, 0, 1));
        const slopeSteepness = fallLineMag / Math.max(1.0, this.cfg.gravity);
        const pumpCeiling = THREE.MathUtils.lerp(8.0, this.cfg.maxPumpSpeed, slopeSteepness);
        const speedTaper = Math.max(0, 1.0 - Math.max(0, newVFwd) / pumpCeiling);

        const boostImpulse = boostCurve * this.cfg.maxPumpBoost * this.pumpFlow * lowSpeedBonus * (0.6 + 0.4 * fallLineAlign) * speedTaper;
        newVFwd += boostImpulse;
        this.hipVelY += 2.4 * boostCurve; // Visual athletic knee extension
        this.edgeCooldown = 0.14;
        this.pumpKick = 1.0; // Trigger camera micro-surge
      } else if (this.carveHoldTime < 0.10) {
        this.pumpFlow = Math.max(1.0, this.pumpFlow - 0.15);
      }
      this.carveCharge = 0.0;
      this.carveHoldTime = 0.0;
      this.lastLeanSign = this.leanAngle > 0 ? 1 : -1;
    }

    // 3. Downslope Roller Terrain Pumping
    // Pumping/tucking on the downslope of rollers converts slope curvature into tangential acceleration
    const currentSlopeGrade = -this.smoothNormal.dot(this._forward);
    const slopeCurvature = (currentSlopeGrade - this.prevSlopeGrade) / Math.max(0.001, dt);
    this.prevSlopeGrade = currentSlopeGrade;

    if (slopeCurvature > 0.22 && (input.forward || this.jumpCharge > 0.12) && currentSlopeGrade > 0.04) {
      const pumpImpulse = THREE.MathUtils.clamp(slopeCurvature * 0.45, 0, 1.8);
      newVFwd += pumpImpulse * dt * 42.0;
      this.pumpKick = Math.max(this.pumpKick, 0.6);
      this.hipVelY += 1.4 * dt * 60;
    }

    // 4. Flat-Ground Butter / Skate Recovery
    // Below 4 m/s on slopes < 5 deg, rapid left-right wiggling generates reliable forward momentum
    if (planarSpeed < 4.0 && this.smoothNormal.y > 0.996) {
      const currentWiggleSign = this.leanAngle > 0.16 ? 1 : (this.leanAngle < -0.16 ? -1 : 0);
      if (currentWiggleSign !== 0 && currentWiggleSign !== this.lastWiggleSign) {
        if (this.wiggleTimer < 0.42 && this.wiggleTimer > 0.04) {
          newVFwd = Math.min(4.5, newVFwd + 1.20);
          this.hipVelY += 1.2;
        }
        this.wiggleTimer = 0;
        this.lastWiggleSign = currentWiggleSign;
      }
      this.wiggleTimer += dt;
    } else {
      this.wiggleTimer = 0;
      this.lastWiggleSign = 0;
    }

    // 5. Straight-line decay
    if (absLean < 0.18) {
      this.straightTime += dt;
      if (this.straightTime > 1.0) {
        this.pumpFlow = THREE.MathUtils.damp(this.pumpFlow, 1.0, 2.5, dt);
        this.pumpChain = 0;
      }
      this.carveCharge = THREE.MathUtils.damp(this.carveCharge, 0, 3.5, dt);
      if (absLean < 0.05) {
        this.lastLeanSign = 0;
        this.carveHoldTime = 0;
      }
    }

    // Skate push (W) on flats and gentle slopes
    if (input.forward && newVFwd < this.cfg.maxPushSpeed) {
      const uphillGrade = Math.max(0, this._forward.y);
      const slopePenalty = Math.max(0, 1.0 - uphillGrade * 4.0);
      const speedTaper = 1.0 - Math.max(0, newVFwd) / this.cfg.maxPushSpeed;
      newVFwd += this.cfg.pushAccel * slopePenalty * speedTaper * dt;
    }

    // Active brake / hockey stop (S)
    if (input.brake && Math.abs(newVFwd) > 0.1) {
      const brakeDecel = Math.min(this.cfg.brakeDrag * Math.abs(newVFwd) * dt, Math.abs(newVFwd));
      newVFwd -= Math.sign(newVFwd) * brakeDecel;
    }

    // Reconstruct velocity from forward & lateral components + continuous ground-stick adherence
    // Gentle continuous normal downforce keeps the sphere glued to terrain contours over rollers and steep slopes with zero bounce
    const stickSpeed = THREE.MathUtils.clamp(4.0 + curHorizSpeed * 0.15, 4.0, 9.0);
    this._vel.copy(this._forward).multiplyScalar(newVFwd)
      .addScaledVector(this._right, newVLat)
      .addScaledVector(this.smoothNormal, -stickSpeed);

    // Quadratic Aerodynamic Drag
    const curSpeed = this._vel.length();
    const dragCoeff = input.forward && curSpeed > 8 ? this.cfg.tuckAirDrag : this.cfg.airDrag;
    if (curSpeed > 0.1) {
      this._vel.addScaledVector(this._vel, -dragCoeff * curSpeed * dt);
    }

    this.rigidBody.setLinvel({ x: this._vel.x, y: this._vel.y, z: this._vel.z }, true);
  }

  private updateAirPhysics(dt: number, input: BoarderInput): void {
    this.carveCharge = 0;
    this.carveHoldTime = 0;
    this.leanAngle = THREE.MathUtils.damp(this.leanAngle, 0, 5, dt);

    const rawYawInput = (input.left ? 1.0 : 0.0) - (input.right ? 1.0 : 0.0);
    const rawPitchInput = (input.forward ? 1.0 : 0.0) - (input.brake ? 1.0 : 0.0);

    // Angular momentum for tricks (yaw spins & pitch flips) with light angular damping
    this.airYawVel += rawYawInput * 16.0 * dt;
    this.airPitchVel += rawPitchInput * 14.0 * dt;
    this.airYawVel *= Math.max(0, 1.0 - 2.8 * dt);
    this.airPitchVel *= Math.max(0, 1.0 - 2.8 * dt);

    const deltaYaw = this.airYawVel * dt;
    const deltaPitch = this.airPitchVel * dt;
    this.yaw += deltaYaw;
    this.airPitch += deltaPitch;

    this.trickEngine.updateAir(
      dt,
      THREE.MathUtils.radToDeg(deltaYaw),
      THREE.MathUtils.radToDeg(deltaPitch),
      !!input.grab
    );

    // Auto-Leveling Landing Assist & Spin Spotting:
    // When player releases rotation input or is within 1.5m of ground, level pitch/roll and nudge yaw toward velocity
    const noRotInput = Math.abs(rawYawInput) < 0.1 && Math.abs(rawPitchInput) < 0.1;
    if (noRotInput || this.groundDistance < 1.5) {
      this.airPitch = THREE.MathUtils.damp(this.airPitch, 0, 7.5, dt);
      this.airRoll = THREE.MathUtils.damp(this.airRoll, 0, 7.5, dt);

      // Spin spotting assist: smoothly damp yaw toward the nearest 180 deg multiple (PI rad) when spin input is released
      if (Math.abs(rawYawInput) < 0.1) {
        const nearest180 = Math.round(this.yaw / Math.PI) * Math.PI;
        this.yaw = THREE.MathUtils.damp(this.yaw, nearest180, 4.0, dt);
      }

      const horizSpeed = Math.hypot(this._vel.x, this._vel.z);
      if (horizSpeed > 1.2) {
        const velYaw = Math.atan2(-this._vel.x, -this._vel.z);
        let yawDiff = (velYaw - this.yaw) % (Math.PI * 2);
        if (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        this.yaw += THREE.MathUtils.clamp(yawDiff, -3.2 * dt, 3.2 * dt);
      }
    }

    // Zero Air Steering: Horizontal momentum arc is locked (ballistic in position)
    this._vel.addScaledVector(this._vel, -this.cfg.airDrag * 0.5 * this.speed * dt);
    this.rigidBody.setLinvel({ x: this._vel.x, y: this._vel.y, z: this._vel.z }, true);
  }

  /**
   * Call once per render frame to sync visuals and procedural character animation.
   */
  public renderUpdate(dt: number, input: BoarderInput): void {
    const pos = this.rigidBody.translation();
    this.root.position.set(pos.x, pos.y, pos.z);

    // 1. Align visualRoot to terrain normal + boarder yaw
    this._alignQuat.setFromUnitVectors(this._up, this.smoothNormal);
    this._yawQuat.setFromAxisAngle(this._up, this.yaw);
    this._targetQuat.multiplyQuaternions(this._alignQuat, this._yawQuat);

    if (!this.isGrounded) {
      this._airEuler.set(this.airPitch, 0, this.airRoll);
      const airQ = new THREE.Quaternion().setFromEuler(this._airEuler);
      this._targetQuat.multiply(airQ);
    }
    this.visualRoot.quaternion.slerp(this._targetQuat, Math.min(1, dt * 16));

    // 2. Procedural Carving Lean & Edge Banking (stiffer at standstill, full bank once gliding)
    const speedRollScale = THREE.MathUtils.clamp(0.28 + 0.72 * (this.speed / 4.0), 0.28, 1.0);
    const targetRoll = -this.leanAngle * 0.52 * speedRollScale;
    this.boardGroup.rotation.z = THREE.MathUtils.damp(this.boardGroup.rotation.z, targetRoll, 10, dt);

    // 3. Hip Spring (landing absorption + jump charge crouch + high-speed tuck + carve crouch)
    const tuckDrop = input.forward && this.speed > 8 ? -0.14 : 0;
    const chargeDrop = -this.jumpCharge * 0.22;
    const carveCrouch = -this.carveCharge * 0.12;
    const targetHipY = 0.55 + tuckDrop + chargeDrop + carveCrouch;

    // 1D spring for weighty landing compression & carve extension
    const springK = 140;
    const damping = 16;
    const force = (targetHipY - (0.55 + this.hipOffsetY)) * springK - this.hipVelY * damping;
    this.hipVelY += force * dt;
    this.hipOffsetY += this.hipVelY * dt;
    this.hipsGroup.position.y = THREE.MathUtils.clamp(0.55 + this.hipOffsetY, 0.26, 0.70);

    // 4. Torso Counter-Rotation, Tuck & Pre-Wind Twist
    const targetTuckPitch = input.forward && this.speed > 8 ? 0.45 : 0.12;
    this.torsoGroup.rotation.x = THREE.MathUtils.damp(this.torsoGroup.rotation.x, targetTuckPitch, 8, dt);
    this.torsoGroup.rotation.y = THREE.MathUtils.damp(
      this.torsoGroup.rotation.y,
      Math.PI * 0.42 + this.preWindCoil * 0.45,
      10,
      dt
    );
    this.torsoGroup.rotation.z = THREE.MathUtils.damp(
      this.torsoGroup.rotation.z,
      -this.leanAngle * 0.36 * speedRollScale,
      10,
      dt
    );

    // 5. Arms spread wider when airborne for balance
    const armSpread = this.isGrounded ? 0.0 : 0.45;
    this.armL.rotation.z = THREE.MathUtils.damp(this.armL.rotation.z, -armSpread, 8, dt);
    this.armR.rotation.z = THREE.MathUtils.damp(this.armR.rotation.z, armSpread, 8, dt);

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

    this.trickEngine.updateDisplayTimer(dt);
  }

  private triggerCrashSpray(): void {
    if (!this.sprayPositions) return;
    const pos = this.rigidBody.translation();
    let emitted = 0;
    for (let i = 0; i < this.sprayCount && emitted < 45; i++) {
      if (this.sprayLifetimes[i] <= 0) {
        this.sprayLifetimes[i] = 0.5 + Math.random() * 0.35;
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
      const emitRate = Math.min(8, Math.floor(this.speed * 0.18 + absLat * 0.65));
      for (let e = 0; e < emitRate; e++) {
        for (let i = 0; i < this.sprayCount; i++) {
          if (this.sprayLifetimes[i] <= 0) {
            this.sprayLifetimes[i] = 0.35 + Math.random() * 0.25;
            const idx = i * 3;
            const tailOffset = -0.7 + (Math.random() - 0.5) * 0.2;
            const lateralOffset = (this.isDrifting ? (Math.random() - 0.5) * 0.5 : -Math.sign(this.leanAngle || 1) * 0.15);
            this.sprayPositions[idx] = pos.x + this._forward.x * tailOffset + this._right.x * lateralOffset;
            this.sprayPositions[idx + 1] = pos.y - this.cfg.sphereRadius + 0.06;
            this.sprayPositions[idx + 2] = pos.z + this._forward.z * tailOffset + this._right.z * lateralOffset;

            const spread = this.isDrifting ? 3.5 : 1.2;
            this.sprayVelocities[idx] = -this._vel.x * 0.25 + (Math.random() - 0.5) * spread;
            this.sprayVelocities[idx + 1] = 1.2 + Math.random() * 2.0;
            this.sprayVelocities[idx + 2] = -this._vel.z * 0.25 + (Math.random() - 0.5) * spread;
            break;
          }
        }
      }
    }

    for (let i = 0; i < this.sprayCount; i++) {
      if (this.sprayLifetimes[i] > 0) {
        this.sprayLifetimes[i] -= dt;
        const idx = i * 3;
        this.sprayPositions[idx] += this.sprayVelocities[idx] * dt;
        this.sprayPositions[idx + 1] += this.sprayVelocities[idx + 1] * dt;
        this.sprayPositions[idx + 2] += this.sprayVelocities[idx + 2] * dt;
        this.sprayVelocities[idx + 1] -= 9.81 * dt;
      } else {
        this.sprayPositions[i * 3 + 1] = -9999;
      }
    }
    this.sprayGeo.attributes.position.needsUpdate = true;
  }
}
