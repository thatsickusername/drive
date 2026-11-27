import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { SkierCharacter, SkierAnimator, SkierAnimParams, buildSkierCharacter, PALETTES, applyRagdollPose } from './character/SkierRig';
import { SurfaceType, TerrainSample } from '../world/alpineHeightfield';
import { GmaPlayerPhysics } from '../mechanics/GmaPlayerPhysics';
import { TrickScoringSystem } from '../mechanics/TrickScoring';
import { SportType, TurnType, MovementState } from '../mechanics/GmaConfig';
import { InputState } from '../mechanics/ControlsProcessor';
import { CarvedSnowTrail } from '../world/trails/CarvedSnowTrail';
import { SnowSpraySystem, SnowSprayParams } from '../world/trails/SnowSpraySystem';
import { SnowAudio } from '../audio/SnowAudio';
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

export class SkierController {
  public readonly rigidBody: RAPIER.RigidBody;
  public readonly collider: RAPIER.Collider;
  public readonly root: THREE.Group;
  public get trickScoring(): TrickScoringSystem { return this.gmaPhysics.trickScoring; }
  public get trickEngine() {
    const ts = this.gmaPhysics.trickScoring;
    const self = this;
    return {
      get totalScore() { return ts.totalGameScore; },
      set totalScore(v: number) { ts.totalGameScore = v; },
      get currentMultiplier() { return ts.comboMultiplier; },
      get lastTrickName() { return ts.lastFinalizedTrickName; },
      set lastTrickName(v: string) { ts.lastFinalizedTrickName = v; },
      get lastTrickPoints() { return ts.lastFinalizedPoints; },
      set lastTrickPoints(v: number) { ts.lastFinalizedPoints = v; },
      get displayTimer() { return ts.displayTimer; },
      set displayTimer(v: number) { ts.displayTimer = v; },
      get currentAirTime() { return self.airTimer; },
      updateDisplayTimer(dt: number) { ts.updateDisplay(dt); }
    };
  }  public readonly gmaPhysics: GmaPlayerPhysics;

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
  public isTucking = false;
  public isSpinning = false;
  public isFrontFlipping = false;
  public isBackFlipping = false;
  public isGrabActive = false;
  public spinDir = 1.0;

  public smoothNormal = new THREE.Vector3(0, 1, 0);

  private wasGrounded = false;
  private wasCrashing = false;
  private wasCrashingPhysics = false;
  private prevJumpInput = false;

  // Audio, Trail Ribbon and Particles
  private readonly audio = new SnowAudio();
  private trailRibbon!: CarvedSnowTrail;
  private snowSpray!: SnowSpraySystem;
  private readonly _sprayParams: SnowSprayParams = {
    posX: 0,
    posY: 0,
    posZ: 0,
    fwdX: 0,
    fwdY: 0,
    fwdZ: 0,
    rightX: 1,
    rightY: 0,
    rightZ: 0,
    normalX: 0,
    normalY: 1,
    normalZ: 0,
    speed: 0,
    leanAngle: 0,
    slipAngleDeg: 0,
    vLateral: 0,
    isGrounded: false,
    isDrifting: false,
    isSharpTurn: false,
    sphereRadius: 0.45
  };

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
  private scene: THREE.Scene;
  private audioInitHandler: (() => void) | null = null;

  // Persistent Rapier & simulation scratch objects (zero per-frame allocations)
  private readonly _rayCenter: RAPIER.Ray;
  private readonly _rayNose: RAPIER.Ray;
  private readonly _rayTail: RAPIER.Ray;
  private readonly _airQuat = new THREE.Quaternion();
  private readonly _rbTranslation = { x: 0, y: 0, z: 0 };
  private readonly _nextTranslation = { x: 0, y: 0, z: 0 };
  private readonly _inputState: InputState = {
    steerX: 0,
    steerY: 0,
    trickSpinX: 0,
    trickFlipY: 0,
    trickRoll: 0,
    jump: false,
    sharpTurn: false,
    slideTurn: false,
    brake: false,
    slapTackle: false,
    stakePole: false,
    reverseTurnEnabled: false
  };
  private readonly _animParams: SkierAnimParams = {
    dt: 0,
    speed: 0,
    leanAngle: 0,
    isGrounded: false,
    isStaking: false
  };

  constructor(
    world: RAPIER.World,
    scene: THREE.Scene,
    spawnPos: THREE.Vector3,
    config: Partial<BoarderConfig> = {}
  ) {
    this.world = world;
    this.scene = scene;
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this._rayCenter = new RAPIER.Ray(this._rayOrigin, this._rayDir);
    this._rayNose = new RAPIER.Ray(this._rayOriginNose, this._rayDir);
    this._rayTail = new RAPIER.Ray(this._rayOriginTail, this._rayDir);
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
      this.audioInitHandler = null;
    };
    this.audioInitHandler = initAudio;
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('pointerdown', initAudio, { once: true });
  }

  private initSnowSpray(scene: THREE.Scene): void {
    this.snowSpray = new SnowSpraySystem(scene, 900);
  }

  public get mesh(): THREE.Group {
    return this.root;
  }

  public get visualMesh(): THREE.Group {
    return this.visualRoot;
  }

  public get visualQuaternion(): THREE.Quaternion {
    return this.visualRoot.quaternion;
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
    const isSnowboard = this.gmaPhysics.sport === SportType.Snowboard;
    this.skierCharacter.setSportVisuals?.(isSnowboard, this.gmaPhysics.hasTwintips);
  }

  public toggleTwintips(): boolean {
    this.gmaPhysics.hasTwintips = !this.gmaPhysics.hasTwintips;
    this.updateSportVisuals();
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
    this.updateSportVisuals();
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
    this.wasCrashingPhysics = false;
    if (this.trailRibbon) this.trailRibbon.onRespawn();
    this.root.position.set(x, bodyY, z);
    this.visualRoot.quaternion.setFromAxisAngle(this._up, yaw);
    this.skierCharacter.resetPose();
    this.gmaPhysics.trickScoring.reset();
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
    const t = this.rigidBody.translation();
    this._rbTranslation.x = t.x;
    this._rbTranslation.y = t.y;
    this._rbTranslation.z = t.z;
    const pos = this._rbTranslation;

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

    const hitCenter = this.world.castRayAndGetNormal(this._rayCenter, maxRayDist, true, undefined, undefined, this.collider);
    const hitNose = this.world.castRayAndGetNormal(this._rayNose, maxRayDist, true, undefined, undefined, this.collider);
    const hitTail = this.world.castRayAndGetNormal(this._rayTail, maxRayDist, true, undefined, undefined, this.collider);

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

    this._inputState.steerX = steerVal;
    this._inputState.steerY = input.brake ? -1.0 : 0.0;
    this._inputState.trickSpinX = input.trickSpinX !== undefined ? input.trickSpinX : (input.left ? 1.0 : (input.right ? -1.0 : 0.0));
    this._inputState.trickFlipY = input.trickFlipY !== undefined ? input.trickFlipY : 0.0;
    this._inputState.trickRoll = input.trickRoll !== undefined ? input.trickRoll : 0.0;
    this._inputState.jump = input.jump;
    this._inputState.sharpTurn = !!input.sharpTurn;
    this._inputState.slideTurn = !!input.slideTurn;
    this._inputState.brake = input.brake;
    this._inputState.slapTackle = !!input.tackle;
    this._inputState.stakePole = !!input.forward;
    this._inputState.reverseTurnEnabled = this.gmaPhysics.controls.reverseTurn;

    // 3. Step 333.3 Hz GMA Player Physics
    const surfaceType = terrainSample ? terrainSample.surfaceType : 'POWDER';
    this.gmaPhysics.update(dt, this._inputState, groundElevation, this.smoothNormal, surfaceType);

    // 4. Sync Rapier Kinematic Collider Translation (zero double-integration jitter)
    this._nextTranslation.x = this.gmaPhysics.position.x;
    this._nextTranslation.y = this.gmaPhysics.position.y + this.cfg.sphereRadius;
    this._nextTranslation.z = this.gmaPhysics.position.z;
    this.rigidBody.setNextKinematicTranslation(this._nextTranslation);

    // Handle player jump trigger for snow trail interruption and variation selection
    const jumpTriggered = this.gmaPhysics.jumpActionTriggered || (input.jump && !this.prevJumpInput && this.wasGrounded);
    this.gmaPhysics.jumpActionTriggered = false;
    if (jumpTriggered) {
      if (input.grab) {
        this.animator.setJumpVariation('grab');
      } else {
        this.animator.pickRandomJumpVariation();
      }
      if (this.trailRibbon) {
        this.trailRibbon.onJumpStart();
      }
    }
    this.prevJumpInput = !!input.jump;

    // 5. Update Cached State
    this.yaw = this.gmaPhysics.currentHeadingAngle;
    this.speed = this.gmaPhysics.speed;
    const isCrashing = this.gmaPhysics.state === MovementState.Crashing;
    this.isGrounded = this.gmaPhysics.state !== MovementState.Airborne && !isCrashing;
    if (this.trailRibbon) {
      if (isCrashing && !this.wasCrashingPhysics) {
        this.trailRibbon.onCrash();
      } else if (!isCrashing && this.wasCrashingPhysics) {
        this.trailRibbon.onRespawn();
      }
    }
    this.wasCrashingPhysics = isCrashing;
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

    // GMA Trick scoring system is accessed directly via this.gmaPhysics.trickScoring

    // Land audio thump & trick notification
    if (this.wasGrounded !== this.isGrounded) {
      if (this.isGrounded && this.airTimer > 0.25) {
        this.audio.playLandThump(this.gmaPhysics.state !== MovementState.Crashing);
        if ((!this.gmaPhysics.trickScoring.lastFinalizedTrickName || this.gmaPhysics.trickScoring.lastFinalizedTrickName === 'BIG AIR') && this.gmaPhysics.state !== MovementState.Crashing) {
          const varNames: Record<string, string> = {
            grab: 'SAFETY GRAB',
            shifty: 'MID-AIR SHIFTY',
            daffy: 'CLASSIC DAFFY',
            mutegrab: 'MUTE GRAB',
            ironcross: 'IRON CROSS',
            nordic: 'NORDIC FLIGHT',
            jump: 'SPREAD EAGLE'
          };
          let trickTitle = varNames[this.animator.activeJumpVariation] || 'AIR POP';
          if (this.animator.isFrontFlippingActive) {
            trickTitle = 'NORDIC FRONT FLIP';
          } else if (this.animator.isBackFlippingActive) {
            trickTitle = 'IRON CROSS BACK FLIP';
          }
          this.gmaPhysics.trickScoring.lastFinalizedTrickName = trickTitle;
          if (this.gmaPhysics.trickScoring.lastFinalizedPoints === 0) {
            this.gmaPhysics.trickScoring.lastFinalizedPoints = 150;
            this.gmaPhysics.trickScoring.totalGameScore += 150;
          }
          this.gmaPhysics.trickScoring.displayTimer = 2.5;
        }
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
      this.isTucking = false;
      this.isSpinning = false;
      this.isFrontFlipping = false;
      this.isBackFlipping = false;
      this.isGrabActive = false;
      const pts = this.gmaPhysics.ragdoll.points;
      if (pts.length >= 21) {
        this.root.position.copy(pts[0].pos);
        applyRagdollPose(this.skierCharacter, this.visualRoot, pts);
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
        this._airQuat.setFromEuler(this._airEuler);
        this._targetQuat.multiply(this._airQuat);
      }
      this.visualRoot.quaternion.slerp(this._targetQuat, Math.min(1, dt * 24));

      // 2. Dynamic Procedural Animation Update (Idle glide vs Alpine Carving + Jump + 360 Spin Trick + Front/Back Flip Tricks)
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
      const flipProgress = (this.gmaPhysics.accumulatedAirFlipDeg % 360.0) / 360.0;
      const flipRate = Math.abs(this.gmaPhysics.angularVelocityFlip);

      // Front flip (Nordic V-Style) vs Back flip (Iron Cross)
      const hasFrontFlipInput = (!!input.forward && !input.brake) || (input.trickFlipY !== undefined && input.trickFlipY > 0.05);
      const isFrontFlipping = inAir && (hasFrontFlipInput || this.gmaPhysics.angularVelocityFlip > 0.15);

      const hasBackFlipInput = (!!input.brake && !input.forward) || (input.trickFlipY !== undefined && input.trickFlipY < -0.05);
      const isBackFlipping = inAir && (hasBackFlipInput || this.gmaPhysics.angularVelocityFlip < -0.15);

      this.isTucking = !!input.forward && this.speed > 8;
      this.isSpinning = isSpinning;
      this.spinDir = spinDir;
      this.isFrontFlipping = isFrontFlipping;
      this.isBackFlipping = isBackFlipping;
      this.isGrabActive = !!input.grab;

      this._animParams.dt = dt;
      this._animParams.speed = this.speed;
      this._animParams.leanAngle = this.leanAngle;
      this._animParams.isGrounded = this.isGrounded;
      this._animParams.isStaking = this.gmaPhysics.isStaking;
      this._animParams.isDrifting = this.isDrifting;
      this._animParams.isSlideTurn = !!input.slideTurn || this.gmaPhysics.currentTurnType === TurnType.SlideTurn;
      this._animParams.isSharpTurn = !!input.sharpTurn || this.gmaPhysics.currentTurnType === TurnType.SharpTurn;
      this._animParams.tuck = !!input.forward && this.speed > 8;
      this._animParams.inputLeft = !!input.left || (input.steerX !== undefined && input.steerX < -0.25);
      this._animParams.inputRight = !!input.right || (input.steerX !== undefined && input.steerX > 0.25);
      this._animParams.isGliding = this.gmaPhysics.isGliding;
      this._animParams.airTime = this.airTimer;
      this._animParams.jumpPressed = input.jump;
      this._animParams.grabPressed = !!input.grab;
      this._animParams.isSpinning = isSpinning;
      this._animParams.spinProgress = spinProgress;
      this._animParams.spinDirection = spinDir;
      this._animParams.spinRate = this.gmaPhysics.angularVelocitySpin;
      this._animParams.isFrontFlipping = isFrontFlipping;
      this._animParams.isBackFlipping = isBackFlipping;
      this._animParams.flipProgress = flipProgress;
      this._animParams.flipRate = flipRate;

      this.animator.update(this._animParams);

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
    if (this.snowSpray) {
      this.snowSpray.setLightingColor(sunColor);
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
    if (!this.snowSpray) return;
    const pos = this._rbTranslation;
    this.snowSpray.emitCrashBurst(pos.x, pos.y, pos.z, this.cfg.sphereRadius);
  }

  private updateSnowSpray(dt: number): void {
    if (!this.snowSpray) return;
    const pos = this.root.position;
    const sp = this._sprayParams;
    sp.posX = pos.x;
    sp.posY = pos.y;
    sp.posZ = pos.z;
    sp.fwdX = this._forward.x;
    sp.fwdY = this._forward.y;
    sp.fwdZ = this._forward.z;
    sp.rightX = this._right.x;
    sp.rightY = this._right.y;
    sp.rightZ = this._right.z;
    sp.normalX = this.smoothNormal.x;
    sp.normalY = this.smoothNormal.y;
    sp.normalZ = this.smoothNormal.z;
    sp.speed = this.speed;
    sp.leanAngle = Math.sign(this.leanAngle || this._inputState.steerX) * Math.min(
      1.0,
      Math.max(
        Math.abs(this._inputState.steerX),
        Math.abs(this.leanAngle) * (this.isDrifting || this.isSlashing ? 1.0 : 0.65)
      )
    );
    sp.slipAngleDeg = this.slipAngleDeg;
    sp.vLateral = this.vLateral;
    sp.isGrounded = this.isGrounded;
    sp.isDrifting = this.isDrifting || this.gmaPhysics.currentTurnType === TurnType.SlideTurn;
    sp.isSharpTurn = this.isSlashing || this.gmaPhysics.currentTurnType === TurnType.SharpTurn;
    sp.sphereRadius = this.cfg.sphereRadius;
    this.snowSpray.update(dt, sp);
  }

  public dispose(): void {
    if (this.audioInitHandler) {
      window.removeEventListener('keydown', this.audioInitHandler);
      window.removeEventListener('pointerdown', this.audioInitHandler);
      this.audioInitHandler = null;
    }
    this.audio.dispose();
    this.trailRibbon.dispose(this.scene);
    if (this.snowSpray) {
      this.snowSpray.dispose(this.scene);
    }
    if (this.root) {
      this.scene.remove(this.root);
    }
    if (this.collider && this.world) {
      this.world.removeCollider(this.collider, false);
    }
    if (this.rigidBody && this.world) {
      this.world.removeRigidBody(this.rigidBody);
    }
  }
}

export { SkierController as Skier, SkierController as SnowBoarder };
