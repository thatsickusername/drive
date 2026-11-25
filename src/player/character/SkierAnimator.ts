import * as THREE from 'three';
import { SkierCharacter } from './SkierRig';
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function bell(u: number, start: number, peak: number, end: number): number {
  if (u <= start || u >= end) return 0;
  return u < peak
    ? smoothstep(start, peak, u)
    : 1 - smoothstep(peak, end, u);
}

function shortestAngleDelta(target: number, current: number): number {
  let d = (target - current) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * ============================================================================
 * PROCEDURAL DYNAMIC ANIMATOR
 * Blends between Athletic Idle Skiing, Alpine Carving, Jump in Place,
 * and Freestyle 360° Vertical Spin Trick.
 * ============================================================================
 */
export interface SkierAnimParams {
  dt: number;
  speed: number;
  leanAngle: number;       // -1.0 (left) to +1.0 (right)
  isGrounded: boolean;
  isStaking: boolean;
  isDrifting?: boolean;
  isSlideTurn?: boolean;
  isSharpTurn?: boolean;
  tuck?: boolean;
  inputLeft?: boolean;
  inputRight?: boolean;
  isGliding?: boolean;
  // Jump (Animation 3, 3B Grab, 3C Shifty, 3D Daffy) and Spin Trick (Animation 4) parameters
  airTime?: number;
  jumpPressed?: boolean;
  grabPressed?: boolean;
  jumpVariation?: 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' | 'ironcross' | 'nordic';
  isSpinning?: boolean;
  spinProgress?: number;   // 0.0 to 1.0 (phase through 360° spin)
  spinDirection?: number;  // +1.0 for left spin, -1.0 for right spin
  spinRate?: number;       // Angular velocity of spin in rad/s
  isFrontFlipping?: boolean;
  isBackFlipping?: boolean;
  flipProgress?: number;
  flipRate?: number;
}

export class SkierAnimator {
  private skier: SkierCharacter;
  private animTime = 0;
  private carveBlend = 0; // 0 = idle, 1 = carve
  private driftCarveBlend = 0; // 0 = standard carve, 1 = drift carve (Animation 1B)

  // Jump, Spin Trick, Front Flip (Nordic), and Back Flip (Iron Cross) states
  private airTime = 0.0;
  private wasAirborne = false;
  private landAbsorbTimer = 0.0;
  private spinTrickBlend = 0.0;
  private spinAnimTime = 0.0;
  private frontFlipBlend = 0.0;
  private frontFlipAnimTime = 0.0;
  private backFlipBlend = 0.0;
  private backFlipAnimTime = 0.0;
  private currentJumpVariation: 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' | 'ironcross' | 'nordic' = 'jump';

  public pickRandomJumpVariation(): 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' {
    const variations: Array<'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab'> = [
      'jump',
      'grab',
      'shifty',
      'daffy',
      'mutegrab'
    ];
    const pool = variations.filter((v) => v !== this.currentJumpVariation);
    this.currentJumpVariation = pool[Math.floor(Math.random() * pool.length)] || 'jump';
    return this.currentJumpVariation as 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab';
  }

  public get activeJumpVariation(): 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' | 'ironcross' | 'nordic' {
    return this.currentJumpVariation;
  }

  public setJumpVariation(variation: 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' | 'ironcross' | 'nordic'): void {
    this.currentJumpVariation = variation;
  }

  public get isFrontFlippingActive(): boolean {
    return this.frontFlipBlend > 0.4;
  }

  public get isBackFlippingActive(): boolean {
    return this.backFlipBlend > 0.4;
  }

  // Dedicated deterministic instant pole plant state
  private activePlantSide: 'left' | 'right' | 'none' = 'none';
  private plantTimer = 0.0;
  private prevTurnKey: 'left' | 'right' | 'none' = 'none';
  private audioPlayedForCurrentStroke = false;
  public onPolePlantAudio?: () => void;

  private jointNames = [
    'hips', 'spine', 'neck', 'head',
    'leftShoulder', 'leftElbow', 'leftWrist',
    'rightShoulder', 'rightElbow', 'rightWrist',
    'leftHip', 'leftKnee', 'leftAnkle',
    'rightHip', 'rightKnee', 'rightAnkle'
  ];

  private targets: Record<string, { rx: number; ry: number; rz: number }> = {};
  private hipPosTarget = { x: 0, y: 0.82, z: 0 };
  private hipY = 0.82;

  public get crouchOffset(): number {
    return Math.max(0, 0.82 - this.hipY);
  }

  constructor(skier: SkierCharacter) {
    this.skier = skier;
    this.jointNames.forEach((name) => {
      this.targets[name] = { rx: 0, ry: 0, rz: 0 };
    });
  }

  private clearTargets() {
    this.jointNames.forEach((name) => {
      this.targets[name].rx = 0;
      this.targets[name].ry = 0;
      this.targets[name].rz = 0;
    });
    this.hipPosTarget.x = 0;
    this.hipPosTarget.y = 0.82;
    this.hipPosTarget.z = 0;
  }

  public groundCharacter() {
    // Stable analytical grounding: hips are already positioned stably so skis sit flush on snow
  }

  public update(params: SkierAnimParams): void {
    const clampedDt = Math.min(params.dt, 0.05);
    this.animTime += clampedDt;

    // Airborne and landing impact tracking
    if (params.isGrounded) {
      if (this.wasAirborne) {
        if (this.airTime > 0.12) {
          this.landAbsorbTimer = 0.32; // Trigger bent-knee landing impact absorption
        }
        this.airTime = 0.0;
        this.wasAirborne = false;
      }
      if (this.landAbsorbTimer > 0) {
        this.landAbsorbTimer = Math.max(0, this.landAbsorbTimer - clampedDt);
      }
    } else {
      if (!this.wasAirborne) {
        // Fresh takeoff: select random jump trick variation or explicit override
        if (params.jumpVariation) {
          this.currentJumpVariation = params.jumpVariation;
        } else if (params.grabPressed) {
          this.currentJumpVariation = 'grab';
        } else {
          this.pickRandomJumpVariation();
        }
      } else if (params.grabPressed && this.currentJumpVariation !== 'grab') {
        this.currentJumpVariation = 'grab';
      }
      this.wasAirborne = true;
      this.airTime = params.airTime !== undefined ? params.airTime : (this.airTime + clampedDt);
      this.landAbsorbTimer = 0.0;
    }

    // Detect instantaneous key/stick turn direction
    let currentKey: 'left' | 'right' | 'none' = 'none';
    if (params.inputLeft || -params.leanAngle > 0.15) {
      currentKey = 'left';
    } else if (params.inputRight || -params.leanAngle < -0.15) {
      currentKey = 'right';
    }

    // Trigger instant 0th-frame carving & pole plant when A or D is pressed
    if (currentKey === 'left' && this.prevTurnKey !== 'left') {
      this.activePlantSide = 'left';
      this.plantTimer = 0.0;
      this.audioPlayedForCurrentStroke = false;
      this.carveBlend = Math.max(this.carveBlend, 0.85); // Instant 0th frame carve engagement
      if (params.isSlideTurn || params.isSharpTurn) {
        this.driftCarveBlend = Math.max(this.driftCarveBlend, 0.85);
      }
    } else if (currentKey === 'right' && this.prevTurnKey !== 'right') {
      this.activePlantSide = 'right';
      this.plantTimer = 0.0;
      this.audioPlayedForCurrentStroke = false;
      this.carveBlend = Math.max(this.carveBlend, 0.85); // Instant 0th frame carve engagement
      if (params.isSlideTurn || params.isSharpTurn) {
        this.driftCarveBlend = Math.max(this.driftCarveBlend, 0.85);
      }
    } else if (currentKey === 'none') {
      if (this.plantTimer > 0.65) {
        this.activePlantSide = 'none';
      }
    }
    this.prevTurnKey = currentKey;

    // Calculate effective turn signal: +1 = Left Carve, -1 = Right Carve
    const targetTurnDir = currentKey === 'left' ? 1.0 : (currentKey === 'right' ? -1.0 : -params.leanAngle);
    const turnDir = THREE.MathUtils.clamp(targetTurnDir, -1.0, 1.0);
    const steerEffort = Math.abs(turnDir);

    const isCarving = (currentKey !== 'none' || steerEffort > 0.08) && params.isGrounded;
    const targetBlend = isCarving ? 1.0 : 0.0;
    this.carveBlend = THREE.MathUtils.damp(this.carveBlend, targetBlend, currentKey !== 'none' ? 24.0 : 8.0, clampedDt);

    // Slide turn (Shift + Left/Right) or Sharp turn (Ctrl + Left/Right) activates Drift Carving animation (Animation 1B)
    const isDriftingTurn = isCarving && (!!params.isSlideTurn || !!params.isSharpTurn);
    const targetDriftBlend = isDriftingTurn ? 1.0 : 0.0;
    this.driftCarveBlend = THREE.MathUtils.damp(this.driftCarveBlend, targetDriftBlend, 16.0, clampedDt);

    this.clearTargets();

    // 1. Evaluate Idle Stance (Cruising & Breathing) - gentle, smooth
    const breath = Math.sin(this.animTime * 1.45);
    const sway = Math.sin(this.animTime * 0.85);
    const scan = Math.sin(this.animTime * 0.65) + 0.35 * Math.sin(this.animTime * 1.3 + 0.5);

    const idleHipX = 0.025 * sway;
    const idleHipZ = 0.0;
    const idleHipsRx = 0.06;
    const idleHipsRy = 0.025 * sway;
    const idleHipsRz = -0.032 * sway;

    const idleSpineRx = 0.17 + 0.024 * breath + (params.tuck ? 0.18 : 0);
    const idleSpineRy = -0.02 * sway + 0.025 * Math.sin(this.animTime * 0.85 + 0.7);
    const idleSpineRz = 0.024 * sway;

    const idleNeckRx = -0.07 - 0.01 * breath;
    const idleNeckRy = 0.06 * scan;
    const idleNeckRz = 0.01 * sway;

    const idleHeadRx = -0.08 - 0.01 * breath;
    const idleHeadRy = 0.08 * scan;
    const idleHeadRz = -0.015 * Math.sin(this.animTime * 0.65);

    const idleLThigh = -0.28 - 0.02 * sway - (params.tuck ? 0.12 : 0);
    const idleLShin = 0.24 + 0.015 * sway + (params.tuck ? 0.10 : 0);
    const idleRThigh = -0.28 + 0.02 * sway - (params.tuck ? 0.12 : 0);
    const idleRShin = 0.24 - 0.015 * sway + (params.tuck ? 0.10 : 0);

    // 2. Evaluate Dynamic Alpine Carving & Drift Carving Targets
    const s = turnDir;
    const p = s * s;
    const leftTurn = Math.max(0, s);
    const rightTurn = Math.max(0, -s);

    // Instant deterministic pole plant progression from 0th frame
    let leftReach = 0;
    let leftPush = 0;
    let rightReach = 0;
    let rightPush = 0;

    if (this.activePlantSide !== 'none') {
      this.plantTimer += clampedDt;
      const t = this.plantTimer;

      // Stroke phase 1: Instant Forward Reach & Plant (0.0s to 0.32s)
      let reachVal = 0;
      if (t <= 0.32) {
        reachVal = Math.sin((t / 0.32) * Math.PI);
        if (t >= 0.12 && !this.audioPlayedForCurrentStroke) {
          if (this.onPolePlantAudio) this.onPolePlantAudio();
          this.audioPlayedForCurrentStroke = true;
        }
      }

      // Stroke phase 2: Push-Through Past Hip (0.22s to 0.64s)
      let pushVal = 0;
      if (t >= 0.22 && t <= 0.64) {
        pushVal = Math.sin(((t - 0.22) / 0.42) * Math.PI);
      }

      if (this.activePlantSide === 'left') {
        leftReach = reachVal;
        leftPush = pushVal;
      } else if (this.activePlantSide === 'right') {
        rightReach = reachVal;
        rightPush = pushVal;
      }

      // Sustained turn: rhythmic re-plant after 1.5s
      if (t > 1.5 && currentKey === this.activePlantSide) {
        this.plantTimer = 0.0;
        this.audioPlayedForCurrentStroke = false;
      }
    }

    const db = this.driftCarveBlend;

    // Standard Carve (Animation 1) vs Drift Carve (Animation 1B)
    const stdCarveHipX = 0.16 * s;
    const stdCarveHipZ = 0.03 * p;
    const stdCarveHipsRx = 0.08 + 0.06 * p;
    const stdCarveHipsRy = 0.26 * s;
    const stdCarveHipsRz = -0.32 * s;
    const stdCrouchDrop = 0.035 * p;

    // Drift Carve: lower pelvis, sit slightly back/down, stronger yaw across fall line & deeper lean
    const driftCarveHipX = 0.20 * s;
    const driftCarveHipZ = -0.02 * p;
    const driftCarveHipsRx = 0.14 + 0.09 * p;
    const driftCarveHipsRy = 0.46 * s;
    const driftCarveHipsRz = -0.36 * s;
    const driftCrouchDrop = 0.14 * p;

    const carveHipX = THREE.MathUtils.lerp(stdCarveHipX, driftCarveHipX, db);
    const carveHipZ = THREE.MathUtils.lerp(stdCarveHipZ, driftCarveHipZ, db);
    const carveHipsRx = THREE.MathUtils.lerp(stdCarveHipsRx, driftCarveHipsRx, db);
    const carveHipsRy = THREE.MathUtils.lerp(stdCarveHipsRy, driftCarveHipsRy, db);
    const carveHipsRz = THREE.MathUtils.lerp(stdCarveHipsRz, driftCarveHipsRz, db);
    const crouchDrop = THREE.MathUtils.lerp(stdCrouchDrop, driftCrouchDrop, db) + (params.tuck ? 0.08 : 0);

    // Spine: standard carve tuck vs drift carve deeper crouch & stronger counter-rotation
    const stdCarveSpineRx = 0.24 + 0.10 * p + (params.tuck ? 0.15 : 0);
    const stdCarveSpineRy = -0.22 * s;
    const stdCarveSpineRz = 0.25 * s;

    const driftCarveSpineRx = 0.28 + 0.12 * p + (params.tuck ? 0.15 : 0);
    const driftCarveSpineRy = -0.38 * s;
    const driftCarveSpineRz = 0.30 * s;

    const carveSpineRx = THREE.MathUtils.lerp(stdCarveSpineRx, driftCarveSpineRx, db);
    const carveSpineRy = THREE.MathUtils.lerp(stdCarveSpineRy, driftCarveSpineRy, db);
    const carveSpineRz = THREE.MathUtils.lerp(stdCarveSpineRz, driftCarveSpineRz, db);

    // Neck & Head: downhill gaze lock
    const stdCarveNeckRx = -0.10 - 0.04 * p;
    const stdCarveNeckRy = -0.05 * s;
    const stdCarveNeckRz = 0.04 * s;

    const stdCarveHeadRx = -0.12 - 0.03 * p;
    const stdCarveHeadRy = -0.04 * s;
    const stdCarveHeadRz = 0.05 * s;

    const driftCarveNeckRx = -0.13 - 0.05 * p;
    const driftCarveNeckRy = -0.06 * s;
    const driftCarveNeckRz = 0.05 * s;

    const driftCarveHeadRx = -0.14 - 0.04 * p;
    const driftCarveHeadRy = -0.05 * s;
    const driftCarveHeadRz = 0.06 * s;

    const carveNeckRx = THREE.MathUtils.lerp(stdCarveNeckRx, driftCarveNeckRx, db);
    const carveNeckRy = THREE.MathUtils.lerp(stdCarveNeckRy, driftCarveNeckRy, db);
    const carveNeckRz = THREE.MathUtils.lerp(stdCarveNeckRz, driftCarveNeckRz, db);

    const carveHeadRx = THREE.MathUtils.lerp(stdCarveHeadRx, driftCarveHeadRx, db);
    const carveHeadRy = THREE.MathUtils.lerp(stdCarveHeadRy, driftCarveHeadRy, db);
    const carveHeadRz = THREE.MathUtils.lerp(stdCarveHeadRz, driftCarveHeadRz, db);

    // Legs: standard carve vs drift carve (deeper knee bend + non-carving outside leg pushed outward + tail-drift flare)
    const stdBaseThigh = -0.34 - 0.12 * p;
    const stdBaseShin = 0.26 + 0.10 * p;
    const stdCarveLThigh = stdBaseThigh - 0.22 * leftTurn + 0.06 * rightTurn;
    const stdCarveLShin = stdBaseShin + 0.12 * leftTurn - 0.04 * rightTurn;
    const stdCarveRThigh = stdBaseThigh - 0.22 * rightTurn + 0.06 * leftTurn;
    const stdCarveRShin = stdBaseShin + 0.12 * rightTurn - 0.04 * leftTurn;

    const driftBaseThigh = -0.62 - 0.20 * p; // deeper knee bend
    const driftBaseShin = 0.52 + 0.16 * p;
    const driftCarveLThigh = driftBaseThigh - 0.22 * leftTurn + 0.08 * rightTurn;
    const driftCarveLShin = driftBaseShin + 0.12 * leftTurn - 0.04 * rightTurn;
    const driftCarveRThigh = driftBaseThigh - 0.22 * rightTurn + 0.08 * leftTurn;
    const driftCarveRShin = driftBaseShin + 0.12 * rightTurn - 0.04 * leftTurn;

    const carveLThigh = THREE.MathUtils.lerp(stdCarveLThigh, driftCarveLThigh, db);
    const carveLShin = THREE.MathUtils.lerp(stdCarveLShin, driftCarveLShin, db);
    const carveRThigh = THREE.MathUtils.lerp(stdCarveRThigh, driftCarveRThigh, db);
    const carveRShin = THREE.MathUtils.lerp(stdCarveRShin, driftCarveRShin, db);

    // Non-carving outside leg pushed further outward (+0.34 / -0.34) with tail-drift flare and aligned ankle canting
    const carveLeftHipRz = THREE.MathUtils.lerp(-0.14 * s, -0.14 * s + 0.34 * rightTurn, db);
    const carveLeftHipRy = THREE.MathUtils.lerp(0, -0.09 * rightTurn, db);
    const carveLeftAnkleRz = THREE.MathUtils.lerp(0.04 * s, 0.04 * s - 0.18 * rightTurn, db);

    const carveRightHipRz = THREE.MathUtils.lerp(-0.14 * s, -0.14 * s - 0.34 * leftTurn, db);
    const carveRightHipRy = THREE.MathUtils.lerp(0, 0.09 * leftTurn, db);
    const carveRightAnkleRz = THREE.MathUtils.lerp(0.04 * s, 0.04 * s + 0.18 * leftTurn, db);

    // 3. Blend Idle vs Carving
    const cb = this.carveBlend;
    this.hipPosTarget.x = THREE.MathUtils.lerp(idleHipX, carveHipX, cb);
    this.hipPosTarget.z = THREE.MathUtils.lerp(idleHipZ, carveHipZ, cb);

    // Stable analytical hip height: smooth crouch with knee flexion, zero vertical jitter
    this.hipPosTarget.y = 0.82 - crouchDrop;
    this.hipY = THREE.MathUtils.damp(this.hipY, this.hipPosTarget.y, 14.0, clampedDt);

    this.targets.hips.rx = THREE.MathUtils.lerp(idleHipsRx, carveHipsRx, cb);
    this.targets.hips.ry = THREE.MathUtils.lerp(idleHipsRy, carveHipsRy, cb);
    this.targets.hips.rz = THREE.MathUtils.lerp(idleHipsRz, carveHipsRz, cb);

    this.targets.spine.rx = THREE.MathUtils.lerp(idleSpineRx, carveSpineRx, cb);
    this.targets.spine.ry = THREE.MathUtils.lerp(idleSpineRy, carveSpineRy, cb);
    this.targets.spine.rz = THREE.MathUtils.lerp(idleSpineRz, carveSpineRz, cb);

    this.targets.neck.rx = THREE.MathUtils.lerp(idleNeckRx, carveNeckRx, cb);
    this.targets.neck.ry = THREE.MathUtils.lerp(idleNeckRy, carveNeckRy, cb);
    this.targets.neck.rz = THREE.MathUtils.lerp(idleNeckRz, carveNeckRz, cb);

    this.targets.head.rx = THREE.MathUtils.lerp(idleHeadRx, carveHeadRx, cb);
    this.targets.head.ry = THREE.MathUtils.lerp(idleHeadRy, carveHeadRy, cb);
    this.targets.head.rz = THREE.MathUtils.lerp(idleHeadRz, carveHeadRz, cb);

    const lThigh = THREE.MathUtils.lerp(idleLThigh, carveLThigh, cb);
    const lShin = THREE.MathUtils.lerp(idleLShin, carveLShin, cb);
    this.targets.leftHip.rx = lThigh - this.targets.hips.rx;
    this.targets.leftHip.rz = THREE.MathUtils.lerp(-0.018 * sway, carveLeftHipRz, cb);
    this.targets.leftHip.ry = THREE.MathUtils.lerp(0, carveLeftHipRy, cb);
    this.targets.leftKnee.rx = lShin - lThigh;
    this.targets.leftAnkle.rx = -lShin;
    this.targets.leftAnkle.rz = THREE.MathUtils.lerp(0, carveLeftAnkleRz, cb);

    const rThigh = THREE.MathUtils.lerp(idleRThigh, carveRThigh, cb);
    const rShin = THREE.MathUtils.lerp(idleRShin, carveRShin, cb);
    this.targets.rightHip.rx = rThigh - this.targets.hips.rx;
    this.targets.rightHip.rz = THREE.MathUtils.lerp(-0.018 * sway, carveRightHipRz, cb);
    this.targets.rightHip.ry = THREE.MathUtils.lerp(0, carveRightHipRy, cb);
    this.targets.rightKnee.rx = rShin - rThigh;
    this.targets.rightAnkle.rx = -rShin;
    this.targets.rightAnkle.rz = THREE.MathUtils.lerp(0, carveRightAnkleRz, cb);

    // 4. Arms & Pole Plants (Idle trailing tuck vs Carving asymmetric plant & balance)
    const idleLShoulderRz = -1.22 + 0.022 * breath;
    const idleLShoulderRx = -0.10;
    const idleLShoulderRy = 0.08 + 0.015 * sway;
    const idleLElbowRy = -0.82;
    const idleLElbowRz = 0.15;
    const idleLWristRx = 1.60 + 0.035 * breath;
    const idleLWristRz = -0.45;

    const idleRShoulderRz = 1.22 - 0.022 * breath;
    const idleRShoulderRx = -0.10;
    const idleRShoulderRy = -0.08 + 0.015 * sway;
    const idleRElbowRy = 0.82;
    const idleRElbowRz = -0.15;
    const idleRWristRx = 1.60 + 0.035 * breath;
    const idleRWristRz = 0.45;

    let stdCarveLShoulderRz: number, stdCarveLShoulderRx: number, stdCarveLShoulderRy: number;
    let stdCarveLElbowRy: number, stdCarveLElbowRz: number, stdCarveLWristRx: number, stdCarveLWristRz: number;
    let stdCarveRShoulderRz: number, stdCarveRShoulderRx: number, stdCarveRShoulderRy: number;
    let stdCarveRElbowRy: number, stdCarveRElbowRz: number, stdCarveRWristRx: number, stdCarveRWristRz: number;

    let driftCarveLShoulderRz: number, driftCarveLShoulderRx: number, driftCarveLShoulderRy: number;
    let driftCarveLElbowRy: number, driftCarveLElbowRz: number, driftCarveLWristRx: number, driftCarveLWristRz: number;
    let driftCarveRShoulderRz: number, driftCarveRShoulderRx: number, driftCarveRShoulderRy: number;
    let driftCarveRElbowRy: number, driftCarveRElbowRz: number, driftCarveRWristRx: number, driftCarveRWristRz: number;

    if (s >= 0) {
      // LEFT TURN: Left arm is active plant
      stdCarveLShoulderRz = -1.16 + 0.18 * leftReach - 0.08 * leftPush;
      stdCarveLShoulderRx = -0.10 - 0.55 * leftReach + 0.58 * leftPush;
      stdCarveLShoulderRy = 0.08 - 0.16 * leftReach + 0.12 * leftPush;
      stdCarveLElbowRy = -0.78 - 0.20 * leftReach + 0.50 * leftPush;
      stdCarveLElbowRz = 0.14 + 0.05 * p;
      stdCarveLWristRx = 1.56 - 0.95 * leftReach + 0.18 * leftPush;
      stdCarveLWristRz = -0.45 + 0.62 * leftReach - 0.12 * leftPush;

      stdCarveRShoulderRz = idleRShoulderRz;
      stdCarveRShoulderRx = idleRShoulderRx;
      stdCarveRShoulderRy = idleRShoulderRy;
      stdCarveRElbowRy = idleRElbowRy;
      stdCarveRElbowRz = idleRElbowRz;
      stdCarveRWristRx = idleRWristRx;
      stdCarveRWristRz = idleRWristRz;

      // Drift Carve Left Turn: active left plant + wider balance right arm
      driftCarveLShoulderRz = -1.10 + 0.18 * leftReach - 0.08 * leftPush;
      driftCarveLShoulderRx = -0.12 - 0.52 * leftReach + 0.56 * leftPush;
      driftCarveLShoulderRy = 0.08 - 0.14 * leftReach + 0.12 * leftPush;
      driftCarveLElbowRy = -0.78 - 0.18 * leftReach + 0.52 * leftPush;
      driftCarveLElbowRz = 0.14 + 0.05 * p;
      driftCarveLWristRx = 1.56 - 0.95 * leftReach + 0.18 * leftPush;
      driftCarveLWristRz = -0.45 + 0.62 * leftReach - 0.12 * leftPush;

      driftCarveRShoulderRz = 1.10 + 0.04 * leftTurn;
      driftCarveRShoulderRx = -0.12;
      driftCarveRShoulderRy = -0.08;
      driftCarveRElbowRy = 0.78;
      driftCarveRElbowRz = -0.14 - 0.05 * p;
      driftCarveRWristRx = 1.56;
      driftCarveRWristRz = 0.45;
    } else {
      // RIGHT TURN: Right arm is active plant
      stdCarveRShoulderRz = 1.16 - 0.18 * rightReach + 0.08 * rightPush;
      stdCarveRShoulderRx = -0.10 - 0.55 * rightReach + 0.58 * rightPush;
      stdCarveRShoulderRy = -0.08 + 0.16 * rightReach - 0.12 * rightPush;
      stdCarveRElbowRy = 0.78 + 0.20 * rightReach - 0.50 * rightPush;
      stdCarveRElbowRz = -0.14 - 0.05 * p;
      stdCarveRWristRx = 1.56 - 0.95 * rightReach + 0.18 * rightPush;
      stdCarveRWristRz = 0.45 - 0.62 * rightReach + 0.12 * rightPush;

      stdCarveLShoulderRz = idleLShoulderRz;
      stdCarveLShoulderRx = idleLShoulderRx;
      stdCarveLShoulderRy = idleLShoulderRy;
      stdCarveLElbowRy = idleLElbowRy;
      stdCarveLElbowRz = idleLElbowRz;
      stdCarveLWristRx = idleLWristRx;
      stdCarveLWristRz = idleLWristRz;

      // Drift Carve Right Turn: active right plant + wider balance left arm
      driftCarveRShoulderRz = 1.10 - 0.18 * rightReach + 0.08 * rightPush;
      driftCarveRShoulderRx = -0.12 - 0.52 * rightReach + 0.56 * rightPush;
      driftCarveRShoulderRy = -0.08 + 0.14 * rightReach - 0.12 * rightPush;
      driftCarveRElbowRy = 0.78 + 0.18 * rightReach - 0.52 * rightPush;
      driftCarveRElbowRz = -0.14 - 0.05 * p;
      driftCarveRWristRx = 1.56 - 0.95 * rightReach + 0.18 * rightPush;
      driftCarveRWristRz = 0.45 - 0.62 * rightReach + 0.12 * rightPush;

      driftCarveLShoulderRz = -1.10 - 0.04 * rightTurn;
      driftCarveLShoulderRx = -0.12;
      driftCarveLShoulderRy = 0.08;
      driftCarveLElbowRy = -0.78;
      driftCarveLElbowRz = 0.14 + 0.05 * p;
      driftCarveLWristRx = 1.56;
      driftCarveLWristRz = -0.45;
    }

    const carveLShoulderRz = THREE.MathUtils.lerp(stdCarveLShoulderRz, driftCarveLShoulderRz, db);
    const carveLShoulderRx = THREE.MathUtils.lerp(stdCarveLShoulderRx, driftCarveLShoulderRx, db);
    const carveLShoulderRy = THREE.MathUtils.lerp(stdCarveLShoulderRy, driftCarveLShoulderRy, db);
    const carveLElbowRy = THREE.MathUtils.lerp(stdCarveLElbowRy, driftCarveLElbowRy, db);
    const carveLElbowRz = THREE.MathUtils.lerp(stdCarveLElbowRz, driftCarveLElbowRz, db);
    const carveLWristRx = THREE.MathUtils.lerp(stdCarveLWristRx, driftCarveLWristRx, db);
    const carveLWristRz = THREE.MathUtils.lerp(stdCarveLWristRz, driftCarveLWristRz, db);

    const carveRShoulderRz = THREE.MathUtils.lerp(stdCarveRShoulderRz, driftCarveRShoulderRz, db);
    const carveRShoulderRx = THREE.MathUtils.lerp(stdCarveRShoulderRx, driftCarveRShoulderRx, db);
    const carveRShoulderRy = THREE.MathUtils.lerp(stdCarveRShoulderRy, driftCarveRShoulderRy, db);
    const carveRElbowRy = THREE.MathUtils.lerp(stdCarveRElbowRy, driftCarveRElbowRy, db);
    const carveRElbowRz = THREE.MathUtils.lerp(stdCarveRElbowRz, driftCarveRElbowRz, db);
    const carveRWristRx = THREE.MathUtils.lerp(stdCarveRWristRx, driftCarveRWristRx, db);
    const carveRWristRz = THREE.MathUtils.lerp(stdCarveRWristRz, driftCarveRWristRz, db);

    this.targets.leftShoulder.rz = THREE.MathUtils.lerp(idleLShoulderRz, carveLShoulderRz, cb);
    this.targets.leftShoulder.rx = THREE.MathUtils.lerp(idleLShoulderRx, carveLShoulderRx, cb);
    this.targets.leftShoulder.ry = THREE.MathUtils.lerp(idleLShoulderRy, carveLShoulderRy, cb);
    this.targets.leftElbow.ry = THREE.MathUtils.lerp(idleLElbowRy, carveLElbowRy, cb);
    this.targets.leftElbow.rz = THREE.MathUtils.lerp(idleLElbowRz, carveLElbowRz, cb);
    this.targets.leftWrist.rx = THREE.MathUtils.lerp(idleLWristRx, carveLWristRx, cb);
    this.targets.leftWrist.rz = THREE.MathUtils.lerp(idleLWristRz, carveLWristRz, cb);

    this.targets.rightShoulder.rz = THREE.MathUtils.lerp(idleRShoulderRz, carveRShoulderRz, cb);
    this.targets.rightShoulder.rx = THREE.MathUtils.lerp(idleRShoulderRx, carveRShoulderRx, cb);
    this.targets.rightShoulder.ry = THREE.MathUtils.lerp(idleRShoulderRy, carveRShoulderRy, cb);
    this.targets.rightElbow.ry = THREE.MathUtils.lerp(idleRElbowRy, carveRElbowRy, cb);
    this.targets.rightElbow.rz = THREE.MathUtils.lerp(idleRElbowRz, carveRElbowRz, cb);
    this.targets.rightWrist.rx = THREE.MathUtils.lerp(idleRWristRx, carveRWristRx, cb);
    this.targets.rightWrist.rz = THREE.MathUtils.lerp(idleRWristRz, carveRWristRz, cb);

    // 5. Special Overrides: Pole Staking on Flat Ground
    if (params.isStaking && params.isGrounded) {
      const stakeSwing = Math.sin(this.animTime * 6.0);
      const isPower = stakeSwing > 0;
      this.targets.leftShoulder.rx = isPower ? -0.45 : 0.40;
      this.targets.rightShoulder.rx = isPower ? -0.45 : 0.40;
      this.targets.leftElbow.ry = isPower ? -0.35 : -0.75;
      this.targets.rightElbow.ry = isPower ? 0.35 : 0.75;
      this.targets.spine.rx += isPower ? 0.12 : -0.04;
    }

    // 6. Overrides: Airborne Flight (Animation 3: Jump in Place & Animation 4: 360° Vertical Spin)
    if (!params.isGrounded) {
      // --- ANIMATION 3 / 3B / 3C / 3D: PROCEDURAL JUMP VARIATIONS ---
      const airT = this.airTime;
      const takeoff = bell(airT, 0.0, 0.08, 0.22);
      const airEase = Math.sin(Math.min(1.0, airT / 0.8) * Math.PI);
      const skiTipLift = -0.18 * airEase;
      const baseThigh = -0.28;
      const baseShin = 0.24;

      let jumpHipsRx = 0, jumpHipsRy = 0, jumpHipsRz = 0;
      let jumpSpineRx = 0.17, jumpSpineRy = 0, jumpSpineRz = 0;
      let jumpNeckRx = -0.07, jumpNeckRy = 0;
      let jumpHeadRx = -0.08, jumpHeadRy = 0;

      let jumpLHipRx = 0, jumpLHipRy = 0, jumpLHipRz = 0;
      let jumpLKneeRx = 0, jumpLAnkleRx = 0, jumpLAnkleRz = 0;
      let jumpRHipRx = 0, jumpRHipRy = 0, jumpRHipRz = 0;
      let jumpRKneeRx = 0, jumpRAnkleRx = 0, jumpRAnkleRz = 0;

      let jumpLShoulderRx = -0.10, jumpLShoulderRy = 0.08, jumpLShoulderRz = -1.22;
      let jumpLElbowRy = -0.82, jumpLElbowRz = 0.15;
      let jumpLWristRx = 1.60, jumpLWristRz = -0.45;

      let jumpRShoulderRx = -0.10, jumpRShoulderRy = -0.08, jumpRShoulderRz = 1.22;
      let jumpRElbowRy = 0.82, jumpRElbowRz = -0.15;
      let jumpRWristRx = 1.60, jumpRWristRz = 0.45;

      if (this.currentJumpVariation === 'grab') {
        // Animation 3B: Tuck & Ski Grab (Safety Grab)
        const grabPhase = smoothstep(0.04, 0.22, airT);
        jumpHipsRx = 0.06 + 0.12 * grabPhase;
        jumpHipsRy = 0.16 * grabPhase;
        jumpHipsRz = -0.14 * grabPhase;

        jumpSpineRx = 0.17 + 0.42 * grabPhase;
        jumpSpineRy = -0.22 * grabPhase;
        jumpSpineRz = 0.20 * grabPhase;

        jumpNeckRx = -0.07 - 0.16 * grabPhase;
        jumpNeckRy = 0.08 * grabPhase;
        jumpHeadRx = -0.08 - 0.18 * grabPhase;
        jumpHeadRy = 0.10 * grabPhase;

        const lThigh = baseThigh + 0.22 * takeoff - 0.88 * grabPhase;
        const lShin = baseShin - 0.18 * takeoff + 0.72 * grabPhase;
        jumpLHipRx = lThigh - jumpHipsRx;
        jumpLHipRz = 0.12 * grabPhase;
        jumpLHipRy = 0.08 * grabPhase;
        jumpLKneeRx = lShin - lThigh;
        jumpLAnkleRx = -lShin - 0.22 * grabPhase + skiTipLift;

        const rThigh = baseThigh + 0.22 * takeoff - 0.96 * grabPhase;
        const rShin = baseShin - 0.18 * takeoff + 0.78 * grabPhase;
        jumpRHipRx = rThigh - jumpHipsRx;
        jumpRHipRz = 0.10 * grabPhase;
        jumpRHipRy = 0.08 * grabPhase;
        jumpRKneeRx = rShin - rThigh;
        jumpRAnkleRx = -rShin - 0.26 * grabPhase + skiTipLift;

        jumpLShoulderRz = -1.22 + 0.86 * grabPhase + 0.18 * takeoff;
        jumpLShoulderRx = -0.10 + 0.34 * grabPhase - 0.20 * takeoff;
        jumpLShoulderRy = 0.08 - 0.26 * grabPhase;
        jumpLElbowRy = -0.82 + 0.48 * grabPhase;
        jumpLElbowRz = 0.15 - 0.12 * grabPhase;
        jumpLWristRx = 1.60 - 0.35 * grabPhase;
        jumpLWristRz = -0.45 + 0.22 * grabPhase;

        jumpRShoulderRz = 1.22 + 0.22 * grabPhase - 0.14 * takeoff;
        jumpRShoulderRx = -0.10 - 0.62 * grabPhase - 0.22 * takeoff;
        jumpRShoulderRy = -0.08 - 0.18 * grabPhase;
        jumpRElbowRy = 0.82 - 0.56 * grabPhase;
        jumpRElbowRz = -0.15 + 0.12 * grabPhase;
        jumpRWristRx = 1.60 - 0.42 * grabPhase;
        jumpRWristRz = 0.45 - 0.28 * grabPhase;
      } else if (this.currentJumpVariation === 'shifty') {
        // Animation 3C: Mid-Air Shifty (Counter-Rotation)
        const shiftyPhase = smoothstep(0.04, 0.22, airT);
        jumpHipsRx = 0.06 - 0.06 * shiftyPhase;
        jumpHipsRy = 1.05 * shiftyPhase;
        jumpHipsRz = -0.18 * shiftyPhase;

        jumpSpineRx = 0.17 + 0.06 * shiftyPhase;
        jumpSpineRy = -0.92 * shiftyPhase;
        jumpSpineRz = 0.16 * shiftyPhase;

        jumpNeckRx = -0.07 - 0.04 * shiftyPhase;
        jumpNeckRy = -0.08 * shiftyPhase;
        jumpHeadRx = -0.08 - 0.04 * shiftyPhase;
        jumpHeadRy = -0.08 * shiftyPhase;

        const thigh = baseThigh + 0.22 * takeoff - 0.50 * shiftyPhase;
        const shin = baseShin - 0.18 * takeoff + 0.44 * shiftyPhase;

        jumpLHipRx = thigh - jumpHipsRx;
        jumpLHipRz = -0.10 * shiftyPhase;
        jumpLKneeRx = shin - thigh;
        jumpLAnkleRx = -shin - 0.16 * shiftyPhase + skiTipLift;

        jumpRHipRx = thigh - jumpHipsRx;
        jumpRHipRz = -0.10 * shiftyPhase;
        jumpRKneeRx = shin - thigh;
        jumpRAnkleRx = -shin - 0.16 * shiftyPhase + skiTipLift;

        jumpLShoulderRz = -1.22 + 0.68 * shiftyPhase + 0.18 * takeoff;
        jumpLShoulderRx = -0.10 + 0.28 * shiftyPhase - 0.20 * takeoff;
        jumpLShoulderRy = 0.08 - 0.24 * shiftyPhase;
        jumpLElbowRy = -0.82 + 0.42 * shiftyPhase;
        jumpLElbowRz = 0.15 - 0.10 * shiftyPhase;
        jumpLWristRx = 1.60 - 0.28 * shiftyPhase;
        jumpLWristRz = -0.45 + 0.18 * shiftyPhase;

        jumpRShoulderRz = 1.22 - 0.68 * shiftyPhase - 0.18 * takeoff;
        jumpRShoulderRx = -0.10 - 0.34 * shiftyPhase - 0.20 * takeoff;
        jumpRShoulderRy = -0.08 - 0.24 * shiftyPhase;
        jumpRElbowRy = 0.82 - 0.42 * shiftyPhase;
        jumpRElbowRz = -0.15 + 0.10 * shiftyPhase;
        jumpRWristRx = 1.60 - 0.28 * shiftyPhase;
        jumpRWristRz = 0.45 - 0.18 * shiftyPhase;
      } else if (this.currentJumpVariation === 'daffy') {
        // Animation 3D: Classic Daffy (Scissor Split)
        const daffyPhase = smoothstep(0.04, 0.22, airT);
        jumpHipsRx = 0.06 - 0.08 * daffyPhase;
        jumpHipsRy = 0.12 * daffyPhase;
        jumpHipsRz = 0;

        jumpSpineRx = 0.17 - 0.10 * daffyPhase;
        jumpSpineRy = -0.22 * daffyPhase;
        jumpSpineRz = 0;

        jumpNeckRx = -0.07 + 0.04 * daffyPhase;
        jumpNeckRy = 0.06 * daffyPhase;
        jumpHeadRx = -0.08 + 0.05 * daffyPhase;
        jumpHeadRy = 0.06 * daffyPhase;

        const lThigh = baseThigh + 0.22 * takeoff - 0.78 * daffyPhase;
        const lShin = baseShin - 0.18 * takeoff - 0.88 * daffyPhase;
        jumpLHipRx = lThigh - jumpHipsRx;
        jumpLHipRz = 0.06 * daffyPhase;
        jumpLKneeRx = Math.max(0.08, lShin - lThigh);
        jumpLAnkleRx = -lShin - 0.28 * daffyPhase + skiTipLift;

        const rThigh = baseThigh + 0.22 * takeoff + 0.96 * daffyPhase;
        const rShin = baseShin - 0.18 * takeoff + 0.86 * daffyPhase;
        jumpRHipRx = rThigh - jumpHipsRx;
        jumpRHipRz = -0.06 * daffyPhase;
        jumpRKneeRx = Math.max(0.08, rShin - rThigh);
        jumpRAnkleRx = -rShin + 0.30 * daffyPhase + skiTipLift;

        jumpLShoulderRz = -1.22 + 0.62 * daffyPhase + 0.18 * takeoff;
        jumpLShoulderRx = -0.10 + 0.34 * daffyPhase - 0.20 * takeoff;
        jumpLShoulderRy = 0.08 - 0.18 * daffyPhase;
        jumpLElbowRy = -0.82 + 0.44 * daffyPhase;
        jumpLElbowRz = 0.15 - 0.10 * daffyPhase;
        jumpLWristRx = 1.60 - 0.32 * daffyPhase;
        jumpLWristRz = -0.45 + 0.18 * daffyPhase;

        jumpRShoulderRz = 1.22 - 0.58 * daffyPhase - 0.18 * takeoff;
        jumpRShoulderRx = -0.10 - 0.48 * daffyPhase - 0.20 * takeoff;
        jumpRShoulderRy = -0.08 + 0.16 * daffyPhase;
        jumpRElbowRy = 0.82 - 0.36 * daffyPhase;
        jumpRElbowRz = -0.15 + 0.10 * daffyPhase;
        jumpRWristRx = 1.60 - 0.32 * daffyPhase;
        jumpRWristRz = 0.45 - 0.18 * daffyPhase;
      } else if (this.currentJumpVariation === 'mutegrab') {
        // Animation 3E: Modern Freeski Tweaked Mute Grab
        const mutePhase = smoothstep(0.04, 0.22, airT);
        jumpHipsRx = 0.06 + 0.14 * mutePhase;
        jumpHipsRy = -0.28 * mutePhase;
        jumpHipsRz = 0.16 * mutePhase;

        jumpSpineRx = 0.17 + 0.46 * mutePhase;
        jumpSpineRy = 0.34 * mutePhase;
        jumpSpineRz = -0.20 * mutePhase;

        jumpNeckRx = -0.07 - 0.18 * mutePhase;
        jumpNeckRy = -0.12 * mutePhase;
        jumpHeadRx = -0.08 - 0.20 * mutePhase;
        jumpHeadRy = -0.14 * mutePhase;

        const lThigh = baseThigh + 0.22 * takeoff - 0.92 * mutePhase;
        const lShin = baseShin - 0.18 * takeoff + 0.76 * mutePhase;
        jumpLHipRx = lThigh - jumpHipsRx;
        jumpLHipRy = -0.20 * mutePhase;
        jumpLHipRz = 0.08 * mutePhase;
        jumpLKneeRx = lShin - lThigh;
        jumpLAnkleRx = -lShin - 0.22 * mutePhase + skiTipLift;
        jumpLAnkleRz = -0.14 * mutePhase;

        const rThigh = baseThigh + 0.22 * takeoff - 1.04 * mutePhase;
        const rShin = baseShin - 0.18 * takeoff + 0.84 * mutePhase;
        jumpRHipRx = rThigh - jumpHipsRx;
        jumpRHipRy = -0.14 * mutePhase;
        jumpRHipRz = -0.12 * mutePhase;
        jumpRKneeRx = rShin - rThigh;
        jumpRAnkleRx = -rShin - 0.26 * mutePhase + skiTipLift;
        jumpRAnkleRz = 0.22 * mutePhase;

        jumpLShoulderRz = -1.22 + 0.42 * mutePhase + 0.18 * takeoff;
        jumpLShoulderRx = -0.10 - 0.82 * mutePhase - 0.20 * takeoff;
        jumpLShoulderRy = 0.08 - 0.64 * mutePhase;
        jumpLElbowRy = -0.82 - 0.46 * mutePhase;
        jumpLElbowRz = 0.15 + 0.26 * mutePhase;
        jumpLWristRx = 1.60 - 0.58 * mutePhase;
        jumpLWristRz = -0.45 + 0.38 * mutePhase;

        jumpRShoulderRz = 1.22 - 0.80 * mutePhase - 0.16 * takeoff;
        jumpRShoulderRx = -0.10 + 0.48 * mutePhase - 0.20 * takeoff;
        jumpRShoulderRy = -0.08 + 0.28 * mutePhase;
        jumpRElbowRy = 0.82 + 0.42 * mutePhase;
        jumpRElbowRz = -0.15 - 0.12 * mutePhase;
        jumpRWristRx = 1.60 - 0.26 * mutePhase;
        jumpRWristRz = 0.45 - 0.20 * mutePhase;
      } else {
        // Animation 3: Standard Jump (Spread Eagle)
        const spread = smoothstep(0.04, 0.20, airT);
        const legSpreadAngle = 0.42 * spread;

        jumpHipsRx = 0.06 - 0.10 * spread;
        jumpHipsRy = 0;
        jumpHipsRz = 0;

        jumpSpineRx = 0.17 - 0.14 * spread;
        jumpSpineRy = 0;
        jumpSpineRz = 0;

        jumpNeckRx = -0.07 + 0.05 * spread;
        jumpHeadRx = -0.08 + 0.06 * spread;

        const jumpThigh = baseThigh + 0.24 * takeoff - 0.06 * spread;
        const jumpShin = baseShin - 0.20 * takeoff + 0.08 * spread;

        jumpLHipRx = jumpThigh - jumpHipsRx;
        jumpLHipRz = legSpreadAngle;
        jumpLHipRy = 0.08 * spread;
        jumpLKneeRx = jumpShin - jumpThigh;
        jumpLAnkleRx = -jumpShin + skiTipLift;
        jumpLAnkleRz = -0.14 * spread;

        jumpRHipRx = jumpThigh - jumpHipsRx;
        jumpRHipRz = -legSpreadAngle;
        jumpRHipRy = -0.08 * spread;
        jumpRKneeRx = jumpShin - jumpThigh;
        jumpRAnkleRx = -jumpShin + skiTipLift;
        jumpRAnkleRz = 0.14 * spread;

        const armLift = 0.52 * spread + 0.18 * takeoff;
        jumpLShoulderRz = -1.22 + armLift;
        jumpLShoulderRx = -0.10 - 0.18 * spread - 0.22 * takeoff;
        jumpLShoulderRy = 0.08 - 0.18 * spread;
        jumpLElbowRy = -0.82 + 0.42 * spread;
        jumpLElbowRz = 0.15 - 0.10 * spread;
        jumpLWristRx = 1.60 - 0.32 * spread;
        jumpLWristRz = -0.45 + 0.18 * spread;

        jumpRShoulderRz = 1.22 - armLift;
        jumpRShoulderRx = -0.10 - 0.18 * spread - 0.22 * takeoff;
        jumpRShoulderRy = -0.08 + 0.18 * spread;
        jumpRElbowRy = 0.82 - 0.42 * spread;
        jumpRElbowRz = -0.15 + 0.10 * spread;
        jumpRWristRx = 1.60 - 0.32 * spread;
        jumpRWristRz = 0.45 - 0.18 * spread;
      }

      // --- ANIMATION 4: 360° VERTICAL SPIN TRICK ---
      const isSpinning = !!params.isSpinning;
      if (isSpinning) {
        this.spinAnimTime += clampedDt;
        this.spinTrickBlend = THREE.MathUtils.damp(this.spinTrickBlend, 1.0, 24.0, clampedDt);
      } else {
        this.spinTrickBlend = THREE.MathUtils.damp(this.spinTrickBlend, 0.0, 16.0, clampedDt);
      }

      // --- ANIMATION 5: FRONT FLIP — OLYMPIC NORDIC V-STYLE FLIGHT ---
      const isFrontFlipping = !!params.isFrontFlipping;
      if (isFrontFlipping) {
        this.frontFlipAnimTime += clampedDt;
        this.frontFlipBlend = THREE.MathUtils.damp(this.frontFlipBlend, 1.0, 24.0, clampedDt);
      } else {
        this.frontFlipAnimTime = 0.0;
        this.frontFlipBlend = THREE.MathUtils.damp(this.frontFlipBlend, 0.0, 16.0, clampedDt);
      }

      // --- ANIMATION 6: BACK FLIP — VINTAGE FREESTYLE IRON CROSS ---
      const isBackFlipping = !!params.isBackFlipping;
      if (isBackFlipping) {
        this.backFlipAnimTime += clampedDt;
        this.backFlipBlend = THREE.MathUtils.damp(this.backFlipBlend, 1.0, 24.0, clampedDt);
      } else {
        this.backFlipAnimTime = 0.0;
        this.backFlipBlend = THREE.MathUtils.damp(this.backFlipBlend, 0.0, 16.0, clampedDt);
      }

      // Base Aerial Pose (Neutral Jump Variation)
      let curHipsRx = jumpHipsRx, curHipsRy = jumpHipsRy, curHipsRz = jumpHipsRz;
      let curSpineRx = jumpSpineRx, curSpineRy = jumpSpineRy, curSpineRz = jumpSpineRz;
      let curNeckRx = jumpNeckRx, curNeckRy = jumpNeckRy, curNeckRz = 0;
      let curHeadRx = jumpHeadRx, curHeadRy = jumpHeadRy, curHeadRz = 0;
      let curLHipRx = jumpLHipRx, curLHipRy = jumpLHipRy, curLHipRz = jumpLHipRz;
      let curLKneeRx = jumpLKneeRx, curLAnkleRx = jumpLAnkleRx, curLAnkleRz = jumpLAnkleRz;
      let curRHipRx = jumpRHipRx, curRHipRy = jumpRHipRy, curRHipRz = jumpRHipRz;
      let curRKneeRx = jumpRKneeRx, curRAnkleRx = jumpRAnkleRx, curRAnkleRz = jumpRAnkleRz;
      let curLShoulderRz = jumpLShoulderRz, curLShoulderRx = jumpLShoulderRx, curLShoulderRy = jumpLShoulderRy;
      let curLElbowRy = jumpLElbowRy, curLElbowRz = jumpLElbowRz, curLWristRx = jumpLWristRx, curLWristRz = jumpLWristRz;
      let curRShoulderRz = jumpRShoulderRz, curRShoulderRx = jumpRShoulderRx, curRShoulderRy = jumpRShoulderRy;
      let curRElbowRy = jumpRElbowRy, curRElbowRz = jumpRElbowRz, curRWristRx = jumpRWristRx, curRWristRz = jumpRWristRz;

      // Front Flip (Olympic Nordic V-Style Flight)
      if (this.frontFlipBlend > 0.005) {
        const fb = this.frontFlipBlend;
        const flipSpeed = Math.abs(params.flipRate ?? 5.2);
        const flipPeriod = (Math.PI * 2) / Math.max(2.5, flipSpeed);
        const u = (params.flipProgress !== undefined && params.flipProgress > 0)
          ? (params.flipProgress % 1.0)
          : ((this.frontFlipAnimTime % flipPeriod) / flipPeriod);

        // STAGGERED FRONT FLIP PHASES:
        // 1. Leg Whip & Early Ski V-Spread: legs kick up and forward violently; torso lags behind
        const legWhip = bell(u, 0.00, 0.14, 0.32);
        const torsoLag = bell(u, 0.00, 0.12, 0.28);
        // 2. Torso Catch-Up & Aerodynamic Lock: torso accelerates to fold over skis into full V-flight
        const torsoCatchUp = bell(u, 0.20, 0.44, 0.68);
        // 3. Telemark Split Extension & Unfolding: body uncurls, right leg reaches forward, left knee drops
        const spotTelemark = bell(u, 0.58, 0.72, 0.86);
        // 4. Telemark Stomp & Runout: deep shock absorption with arms held in Olympic salute
        const telemarkLand = bell(u, 0.78, 0.88, 1.00);

        // Hips: lags slightly on takeoff, pitches forward strongly as torso folds, levels upright for Telemark
        const nordicHipsRx = 0.06 - 0.08 * torsoLag + 0.36 * torsoCatchUp - 0.10 * spotTelemark + 0.12 * telemarkLand;
        const nordicHipsRy = 0;
        const nordicHipsRz = 0.02 * torsoCatchUp;

        // Spine: lags behind rotating legs initially, then snaps forward over skis, then rises proud for Telemark
        const nordicSpineRx = 0.17 - 0.14 * torsoLag + 0.54 * torsoCatchUp - 0.20 * spotTelemark + 0.18 * telemarkLand;
        const nordicSpineRy = 0;
        const nordicSpineRz = 0;

        // Head & Neck: eyes track forward-down the slope in flight, spot landing, then head held proud
        const nordicNeckRx = -0.07 + 0.06 * torsoLag - 0.34 * torsoCatchUp + 0.12 * spotTelemark - 0.08 * telemarkLand;
        const nordicHeadRx = -0.08 + 0.08 * torsoLag - 0.36 * torsoCatchUp + 0.14 * spotTelemark - 0.10 * telemarkLand;

        // Legs: whip forward-upward early into V-formation (tips out, tails together), then split into Telemark lunge
        const fThigh = baseThigh + 0.46 * legWhip + 0.28 * torsoCatchUp;
        const fShin = baseShin - 0.22 * legWhip - 0.16 * torsoCatchUp;

        // Left Leg (+X: in flight, left half of 'V'; in Telemark, trailing dropped knee)
        const lThigh = fThigh + 0.38 * spotTelemark - 0.25 * telemarkLand;
        const lShin = fShin + 0.62 * spotTelemark + 0.38 * telemarkLand;
        const vSpreadL = 0.36 * legWhip + 0.44 * torsoCatchUp;
        const nordicLHipRx = lThigh - nordicHipsRx;
        const nordicLHipRy = -0.44 * vSpreadL; // Outward rotation
        const nordicLHipRz = 0.38 * vSpreadL;  // Abduction
        const nordicLKneeRx = Math.max(0.04, lShin - lThigh);
        const nordicLAnkleRx = -lShin - 0.26 * vSpreadL + 0.24 * spotTelemark + skiTipLift;
        const nordicLAnkleRz = 0.12 * vSpreadL;

        // Right Leg (-X: in flight, right half of 'V'; in Telemark, forward flexed lunge)
        const rThigh = fThigh - 0.52 * spotTelemark - 0.42 * telemarkLand;
        const rShin = fShin + 0.46 * spotTelemark + 0.40 * telemarkLand;
        const vSpreadR = 0.36 * legWhip + 0.44 * torsoCatchUp;
        const nordicRHipRx = rThigh - nordicHipsRx;
        const nordicRHipRy = 0.44 * vSpreadR;  // Outward rotation
        const nordicRHipRz = -0.38 * vSpreadR; // Abduction
        const nordicRKneeRx = Math.max(0.04, rShin - rThigh);
        const nordicRAnkleRx = -rShin - 0.26 * vSpreadR + skiTipLift;
        const nordicRAnkleRz = -0.12 * vSpreadR;

        // Arms & Poles: lag slightly on pop, streamline back along flanks in flight, flare wide for Telemark salute
        const armWing = 0.76 * torsoCatchUp;
        const armSalute = 0.95 * spotTelemark + 0.85 * telemarkLand;

        const nordicLShoulderRz = -1.22 + 0.32 * armWing + armSalute;
        const nordicLShoulderRx = -0.10 - 0.18 * torsoLag + 0.74 * armWing - 0.18 * spotTelemark;
        const nordicLShoulderRy = 0.08 - 0.28 * armWing;
        const nordicLElbowRy = -0.82 + 0.65 * armWing + 0.38 * spotTelemark;
        const nordicLElbowRz = 0.15 - 0.12 * armWing;
        const nordicLWristRx = 1.60 - 0.76 * armWing - 0.24 * spotTelemark;
        const nordicLWristRz = -0.45 + 0.35 * spotTelemark;

        const nordicRShoulderRz = 1.22 - 0.32 * armWing - armSalute;
        const nordicRShoulderRx = -0.10 - 0.18 * torsoLag + 0.74 * armWing - 0.18 * spotTelemark;
        const nordicRShoulderRy = -0.08 + 0.28 * armWing;
        const nordicRElbowRy = 0.82 - 0.65 * armWing - 0.38 * spotTelemark;
        const nordicRElbowRz = -0.15 + 0.12 * armWing;
        const nordicRWristRx = 1.60 - 0.76 * armWing - 0.24 * spotTelemark;
        const nordicRWristRz = 0.45 - 0.35 * spotTelemark;

        curHipsRx = THREE.MathUtils.lerp(curHipsRx, nordicHipsRx, fb);
        curHipsRy = THREE.MathUtils.lerp(curHipsRy, nordicHipsRy, fb);
        curHipsRz = THREE.MathUtils.lerp(curHipsRz, nordicHipsRz, fb);
        curSpineRx = THREE.MathUtils.lerp(curSpineRx, nordicSpineRx, fb);
        curSpineRy = THREE.MathUtils.lerp(curSpineRy, nordicSpineRy, fb);
        curSpineRz = THREE.MathUtils.lerp(curSpineRz, nordicSpineRz, fb);
        curNeckRx = THREE.MathUtils.lerp(curNeckRx, nordicNeckRx, fb);
        curHeadRx = THREE.MathUtils.lerp(curHeadRx, nordicHeadRx, fb);
        curLHipRx = THREE.MathUtils.lerp(curLHipRx, nordicLHipRx, fb);
        curLHipRy = THREE.MathUtils.lerp(curLHipRy, nordicLHipRy, fb);
        curLHipRz = THREE.MathUtils.lerp(curLHipRz, nordicLHipRz, fb);
        curLKneeRx = THREE.MathUtils.lerp(curLKneeRx, nordicLKneeRx, fb);
        curLAnkleRx = THREE.MathUtils.lerp(curLAnkleRx, nordicLAnkleRx, fb);
        curLAnkleRz = THREE.MathUtils.lerp(curLAnkleRz, nordicLAnkleRz, fb);
        curRHipRx = THREE.MathUtils.lerp(curRHipRx, nordicRHipRx, fb);
        curRHipRy = THREE.MathUtils.lerp(curRHipRy, nordicRHipRy, fb);
        curRHipRz = THREE.MathUtils.lerp(curRHipRz, nordicRHipRz, fb);
        curRKneeRx = THREE.MathUtils.lerp(curRKneeRx, nordicRKneeRx, fb);
        curRAnkleRx = THREE.MathUtils.lerp(curRAnkleRx, nordicRAnkleRx, fb);
        curRAnkleRz = THREE.MathUtils.lerp(curRAnkleRz, nordicRAnkleRz, fb);
        curLShoulderRz = THREE.MathUtils.lerp(curLShoulderRz, nordicLShoulderRz, fb);
        curLShoulderRx = THREE.MathUtils.lerp(curLShoulderRx, nordicLShoulderRx, fb);
        curLShoulderRy = THREE.MathUtils.lerp(curLShoulderRy, nordicLShoulderRy, fb);
        curLElbowRy = THREE.MathUtils.lerp(curLElbowRy, nordicLElbowRy, fb);
        curLElbowRz = THREE.MathUtils.lerp(curLElbowRz, nordicLElbowRz, fb);
        curLWristRx = THREE.MathUtils.lerp(curLWristRx, nordicLWristRx, fb);
        curLWristRz = THREE.MathUtils.lerp(curLWristRz, nordicLWristRz, fb);
        curRShoulderRz = THREE.MathUtils.lerp(curRShoulderRz, nordicRShoulderRz, fb);
        curRShoulderRx = THREE.MathUtils.lerp(curRShoulderRx, nordicRShoulderRx, fb);
        curRShoulderRy = THREE.MathUtils.lerp(curRShoulderRy, nordicRShoulderRy, fb);
        curRElbowRy = THREE.MathUtils.lerp(curRElbowRy, nordicRElbowRy, fb);
        curRElbowRz = THREE.MathUtils.lerp(curRElbowRz, nordicRElbowRz, fb);
        curRWristRx = THREE.MathUtils.lerp(curRWristRx, nordicRWristRx, fb);
        curRWristRz = THREE.MathUtils.lerp(curRWristRz, nordicRWristRz, fb);
      }

      // Back Flip (Vintage Freestyle Iron Cross)
      if (this.backFlipBlend > 0.005) {
        const bb = this.backFlipBlend;
        const flipSpeed = Math.abs(params.flipRate ?? 5.2);
        const flipPeriod = (Math.PI * 2) / Math.max(2.5, flipSpeed);
        const u = (params.flipProgress !== undefined && params.flipProgress > 0)
          ? (params.flipProgress % 1.0)
          : ((this.backFlipAnimTime % flipPeriod) / flipPeriod);

        // STAGGERED BACK FLIP PHASES:
        // 1. Takeoff & Upper Body Lead / Leg Lag: head, chest, and hips throw backward first; lower legs & heavy skis trail/lag behind
        const throwLead = bell(u, 0.00, 0.14, 0.30);
        const legLag = bell(u, 0.00, 0.15, 0.32);
        // 2. Delayed Staggered Knee Snap & Iron Cross Lock: knees snap sharply into deep 100° flexion, ski tails cross into sharp 'X'
        const snapTuck = bell(u, 0.22, 0.44, 0.68);
        // 3. Uncross & Spotting: skis uncross back to parallel, head tilts forward to spot the snow
        const spotSnow = bell(u, 0.58, 0.72, 0.86);
        // 4. Stomp Landing Absorption: knees absorb the landing impact
        const stompAbsorb = bell(u, 0.78, 0.88, 1.00);

        // Hips: pitches back aggressively during throw, holds proud in mid-air, levels for stomp
        const crossHipsRx = 0.06 - 0.18 * throwLead - 0.10 * snapTuck + 0.12 * stompAbsorb;
        const crossHipsRy = 0;
        const crossHipsRz = 0;

        // Spine: arches backward with chest open to the sky, leads the rotation, crunches slightly forward on landing
        const crossSpineRx = 0.17 - 0.38 * throwLead - 0.22 * snapTuck + 0.10 * spotSnow + 0.26 * stompAbsorb;
        const crossSpineRy = 0;
        const crossSpineRz = 0;

        // Head & Neck: tilts back with upper body lead, spots snow as body clears 270°
        const crossNeckRx = -0.07 + 0.24 * throwLead + 0.12 * snapTuck - 0.18 * spotSnow - 0.08 * stompAbsorb;
        const crossHeadRx = -0.08 + 0.26 * throwLead + 0.14 * snapTuck - 0.20 * spotSnow - 0.10 * stompAbsorb;

        // Legs: thighs rotate with hips, but knees lag behind initially (staying straight), then snap explosively into Iron Cross
        const cThigh = baseThigh + 0.25 * throwLead + 0.32 * snapTuck - 0.40 * stompAbsorb;
        // Notice legLag: shins stay extended (-0.14) during takeoff whip, then surge (+1.15) on snapTuck!
        const cShin = baseShin - 0.14 * legLag + 1.15 * snapTuck + 0.36 * stompAbsorb;

        // Left Leg (+X, crosses over)
        const crossLHipRx = cThigh - crossHipsRx;
        const crossLHipRy = 0.42 * snapTuck;
        const crossLHipRz = 0.20 * snapTuck;
        const crossLKneeRx = Math.max(0.08, cShin - cThigh);
        const crossLAnkleRx = -cShin - 0.18 * snapTuck + skiTipLift;
        const crossLAnkleRz = -0.25 * snapTuck;

        // Right Leg (-X, crosses under)
        const crossRHipRx = cThigh - crossHipsRx;
        const crossRHipRy = -0.42 * snapTuck;
        const crossRHipRz = -0.20 * snapTuck;
        const crossRKneeRx = Math.max(0.08, cShin - cThigh);
        const crossRAnkleRx = -cShin - 0.18 * snapTuck + skiTipLift;
        const crossRAnkleRz = 0.25 * snapTuck;

        // Arms & Poles: throw back and up on launch, flare in wide majestic hawk wings during cross, check on landing
        const armWing = 0.78 * snapTuck + 0.45 * throwLead;
        const crossLShoulderRz = -1.22 + armWing + 0.18 * stompAbsorb;
        const crossLShoulderRx = -0.10 + 0.58 * throwLead + 0.44 * snapTuck - 0.22 * stompAbsorb;
        const crossLShoulderRy = 0.08 - 0.32 * snapTuck;
        const crossLElbowRy = -0.82 + 0.55 * snapTuck;
        const crossLElbowRz = 0.15 - 0.12 * snapTuck;
        const crossLWristRx = 1.60 - 0.52 * snapTuck;
        const crossLWristRz = -0.45 + 0.34 * snapTuck;

        const crossRShoulderRz = 1.22 - armWing - 0.18 * stompAbsorb;
        const crossRShoulderRx = -0.10 + 0.58 * throwLead + 0.44 * snapTuck - 0.22 * stompAbsorb;
        const crossRShoulderRy = -0.08 + 0.32 * snapTuck;
        const crossRElbowRy = 0.82 - 0.55 * snapTuck;
        const crossRElbowRz = -0.15 + 0.12 * snapTuck;
        const crossRWristRx = 1.60 - 0.52 * snapTuck;
        const crossRWristRz = 0.45 - 0.34 * snapTuck;

        curHipsRx = THREE.MathUtils.lerp(curHipsRx, crossHipsRx, bb);
        curHipsRy = THREE.MathUtils.lerp(curHipsRy, crossHipsRy, bb);
        curHipsRz = THREE.MathUtils.lerp(curHipsRz, crossHipsRz, bb);
        curSpineRx = THREE.MathUtils.lerp(curSpineRx, crossSpineRx, bb);
        curSpineRy = THREE.MathUtils.lerp(curSpineRy, crossSpineRy, bb);
        curSpineRz = THREE.MathUtils.lerp(curSpineRz, crossSpineRz, bb);
        curNeckRx = THREE.MathUtils.lerp(curNeckRx, crossNeckRx, bb);
        curHeadRx = THREE.MathUtils.lerp(curHeadRx, crossHeadRx, bb);
        curLHipRx = THREE.MathUtils.lerp(curLHipRx, crossLHipRx, bb);
        curLHipRy = THREE.MathUtils.lerp(curLHipRy, crossLHipRy, bb);
        curLHipRz = THREE.MathUtils.lerp(curLHipRz, crossLHipRz, bb);
        curLKneeRx = THREE.MathUtils.lerp(curLKneeRx, crossLKneeRx, bb);
        curLAnkleRx = THREE.MathUtils.lerp(curLAnkleRx, crossLAnkleRx, bb);
        curLAnkleRz = THREE.MathUtils.lerp(curLAnkleRz, crossLAnkleRz, bb);
        curRHipRx = THREE.MathUtils.lerp(curRHipRx, crossRHipRx, bb);
        curRHipRy = THREE.MathUtils.lerp(curRHipRy, crossRHipRy, bb);
        curRHipRz = THREE.MathUtils.lerp(curRHipRz, crossRHipRz, bb);
        curRKneeRx = THREE.MathUtils.lerp(curRKneeRx, crossRKneeRx, bb);
        curRAnkleRx = THREE.MathUtils.lerp(curRAnkleRx, crossRAnkleRx, bb);
        curRAnkleRz = THREE.MathUtils.lerp(curRAnkleRz, crossRAnkleRz, bb);
        curLShoulderRz = THREE.MathUtils.lerp(curLShoulderRz, crossLShoulderRz, bb);
        curLShoulderRx = THREE.MathUtils.lerp(curLShoulderRx, crossLShoulderRx, bb);
        curLShoulderRy = THREE.MathUtils.lerp(curLShoulderRy, crossLShoulderRy, bb);
        curLElbowRy = THREE.MathUtils.lerp(curLElbowRy, crossLElbowRy, bb);
        curLElbowRz = THREE.MathUtils.lerp(curLElbowRz, crossLElbowRz, bb);
        curLWristRx = THREE.MathUtils.lerp(curLWristRx, crossLWristRx, bb);
        curLWristRz = THREE.MathUtils.lerp(curLWristRz, crossLWristRz, bb);
        curRShoulderRz = THREE.MathUtils.lerp(curRShoulderRz, crossRShoulderRz, bb);
        curRShoulderRx = THREE.MathUtils.lerp(curRShoulderRx, crossRShoulderRx, bb);
        curRShoulderRy = THREE.MathUtils.lerp(curRShoulderRy, crossRShoulderRy, bb);
        curRElbowRy = THREE.MathUtils.lerp(curRElbowRy, crossRElbowRy, bb);
        curRElbowRz = THREE.MathUtils.lerp(curRElbowRz, crossRElbowRz, bb);
        curRWristRx = THREE.MathUtils.lerp(curRWristRx, crossRWristRx, bb);
        curRWristRz = THREE.MathUtils.lerp(curRWristRz, crossRWristRz, bb);
      }

      if (this.spinTrickBlend > 0.005) {
        const spinSpeed = Math.abs(params.spinRate ?? 7.0);
        const period = (Math.PI * 2) / Math.max(3.0, spinSpeed);
        const u = (params.spinProgress !== undefined && params.spinProgress > 0)
          ? (params.spinProgress % 1.0)
          : ((this.spinAnimTime % period) / period);
        const sDir = params.spinDirection !== undefined && params.spinDirection < 0 ? -1.0 : 1.0;

        const spinWindup = bell(u, 0.0, 0.12, 0.26);
        const spinSnapLead = bell(u, 0.16, 0.28, 0.44);
        const spinMidTuck = bell(u, 0.32, 0.50, 0.70);
        const spinSpotCheck = bell(u, 0.58, 0.72, 0.85);
        const spinStompLand = bell(u, 0.75, 0.88, 1.0);

        // 1. Hips targets (Relative counter-twist, snap lead, and stomp absorption)
        const spinHipsRx = 0.06 + 0.10 * spinWindup - 0.08 * spinMidTuck + 0.12 * spinStompLand;
        const spinHipsRy = sDir * (-0.25 * spinWindup + 0.32 * spinSnapLead - 0.15 * spinSpotCheck + 0.06 * spinStompLand);
        const spinHipsRz = sDir * (0.08 * spinWindup - 0.12 * spinSnapLead - 0.08 * spinMidTuck + 0.06 * spinSpotCheck);

        // 2. Spine targets (Upper-body lead coil & braking check)
        const spinSpineRy = sDir * (-0.58 * spinWindup + 0.62 * spinSnapLead + 0.16 * spinMidTuck - 0.34 * spinSpotCheck - 0.10 * spinStompLand);
        const spinSpineRx = 0.17 + 0.24 * spinWindup - 0.08 * spinSnapLead + 0.16 * spinMidTuck - 0.06 * spinSpotCheck + 0.26 * spinStompLand;
        const spinSpineRz = sDir * (0.14 * spinWindup - 0.14 * spinSnapLead - 0.08 * spinMidTuck + 0.10 * spinSpotCheck);

        // 3. Head & Neck (Spots landing early)
        const spinNeckRy = sDir * (-0.18 * spinWindup + 0.28 * spinSnapLead + 0.24 * spinSpotCheck - 0.06 * spinStompLand);
        const spinNeckRx = -0.07 - 0.08 * spinWindup + 0.05 * spinMidTuck - 0.12 * spinSpotCheck - 0.08 * spinStompLand;
        const spinNeckRz = sDir * (0.05 * spinWindup - 0.08 * spinSnapLead + 0.06 * spinSpotCheck);

        const spinHeadRy = sDir * (-0.22 * spinWindup + 0.36 * spinSnapLead + 0.32 * spinSpotCheck - 0.08 * spinStompLand);
        const spinHeadRx = -0.08 - 0.08 * spinWindup + 0.04 * spinMidTuck - 0.14 * spinSpotCheck - 0.10 * spinStompLand;
        const spinHeadRz = sDir * (0.06 * spinWindup - 0.10 * spinSnapLead + 0.08 * spinSpotCheck);

        // 4. Legs (Asymmetric freestyle tuck)
        const leadThigh = baseThigh - 0.36 * spinWindup + 0.22 * spinSnapLead - 0.56 * spinMidTuck + 0.12 * spinSpotCheck - 0.42 * spinStompLand;
        const leadShin = baseShin + 0.32 * spinWindup - 0.18 * spinSnapLead + 0.52 * spinMidTuck - 0.10 * spinSpotCheck + 0.38 * spinStompLand;
        const trailThigh = baseThigh - 0.36 * spinWindup + 0.24 * spinSnapLead - 0.42 * spinMidTuck + 0.10 * spinSpotCheck - 0.40 * spinStompLand;
        const trailShin = baseShin + 0.32 * spinWindup - 0.20 * spinSnapLead + 0.40 * spinMidTuck - 0.08 * spinSpotCheck + 0.36 * spinStompLand;

        let spinLHipRx: number, spinLHipRy: number, spinLHipRz: number;
        let spinLKneeRx: number, spinLAnkleRx: number;
        let spinRHipRx: number, spinRHipRy: number, spinRHipRz: number;
        let spinRKneeRx: number, spinRAnkleRx: number;

        if (sDir >= 0) {
          spinLHipRx = leadThigh - spinHipsRx;
          spinLHipRy = -0.18 * spinSnapLead + 0.10 * spinMidTuck;
          spinLHipRz = 0.06 * spinMidTuck;
          spinLKneeRx = leadShin - leadThigh;
          spinLAnkleRx = -leadShin - 0.16 * spinMidTuck;

          spinRHipRx = trailThigh - spinHipsRx;
          spinRHipRy = -0.18 * spinSnapLead + 0.10 * spinMidTuck;
          spinRHipRz = -0.08 * spinMidTuck;
          spinRKneeRx = trailShin - trailThigh;
          spinRAnkleRx = -trailShin - 0.14 * spinMidTuck;
        } else {
          spinRHipRx = leadThigh - spinHipsRx;
          spinRHipRy = 0.18 * spinSnapLead - 0.10 * spinMidTuck;
          spinRHipRz = -0.06 * spinMidTuck;
          spinRKneeRx = leadShin - leadThigh;
          spinRAnkleRx = -leadShin - 0.16 * spinMidTuck;

          spinLHipRx = trailThigh - spinHipsRx;
          spinLHipRy = 0.18 * spinSnapLead - 0.10 * spinMidTuck;
          spinLHipRz = 0.08 * spinMidTuck;
          spinLKneeRx = trailShin - trailThigh;
          spinLAnkleRx = -trailShin - 0.14 * spinMidTuck;
        }

        // 5. Arms & Poles (Drive into spin -> compact mid-tuck -> wide flare check)
        const leadShoulderRz = -1.22 - 0.10 * spinWindup + 0.55 * spinSnapLead + 0.12 * spinMidTuck + 0.85 * spinSpotCheck + 0.18 * spinStompLand;
        const leadShoulderRx = -0.10 + 0.32 * spinWindup - 0.42 * spinSnapLead - 0.24 * spinMidTuck - 0.12 * spinSpotCheck - 0.18 * spinStompLand;
        const leadShoulderRy = 0.08 + 0.38 * spinWindup - 0.45 * spinSnapLead + 0.22 * spinMidTuck - 0.32 * spinSpotCheck;
        const leadElbowRy = -0.82 - 0.15 * spinWindup + 0.28 * spinSnapLead - 0.42 * spinMidTuck + 0.52 * spinSpotCheck;
        const leadElbowRz = 0.15 + 0.12 * spinMidTuck - 0.14 * spinSpotCheck;
        const leadWristRx = 1.60 + 0.15 * spinWindup - 0.35 * spinMidTuck - 0.28 * spinSpotCheck;
        const leadWristRz = -0.45 + 0.18 * spinMidTuck + 0.22 * spinSpotCheck;

        const trailShoulderRz = 1.22 + 0.16 * spinWindup - 0.38 * spinSnapLead - 0.10 * spinMidTuck - 0.85 * spinSpotCheck - 0.18 * spinStompLand;
        const trailShoulderRx = -0.10 + 0.36 * spinWindup - 0.58 * spinSnapLead - 0.28 * spinMidTuck - 0.12 * spinSpotCheck - 0.18 * spinStompLand;
        const trailShoulderRy = -0.08 + 0.42 * spinWindup - 0.52 * spinSnapLead - 0.26 * spinMidTuck + 0.32 * spinSpotCheck;
        const trailElbowRy = 0.82 + 0.18 * spinWindup + 0.36 * spinSnapLead + 0.46 * spinMidTuck - 0.52 * spinSpotCheck;
        const trailElbowRz = -0.15 - 0.12 * spinMidTuck + 0.14 * spinSpotCheck;
        const trailWristRx = 1.60 + 0.15 * spinWindup - 0.35 * spinMidTuck - 0.28 * spinSpotCheck;
        const trailWristRz = 0.45 - 0.18 * spinMidTuck - 0.22 * spinSpotCheck;

        let spinLShoulderRz: number, spinLShoulderRx: number, spinLShoulderRy: number;
        let spinLElbowRy: number, spinLElbowRz: number, spinLWristRx: number, spinLWristRz: number;
        let spinRShoulderRz: number, spinRShoulderRx: number, spinRShoulderRy: number;
        let spinRElbowRy: number, spinRElbowRz: number, spinRWristRx: number, spinRWristRz: number;

        if (sDir >= 0) {
          spinLShoulderRz = leadShoulderRz; spinLShoulderRx = leadShoulderRx; spinLShoulderRy = leadShoulderRy;
          spinLElbowRy = leadElbowRy; spinLElbowRz = leadElbowRz; spinLWristRx = leadWristRx; spinLWristRz = leadWristRz;

          spinRShoulderRz = trailShoulderRz; spinRShoulderRx = trailShoulderRx; spinRShoulderRy = trailShoulderRy;
          spinRElbowRy = trailElbowRy; spinRElbowRz = trailElbowRz; spinRWristRx = trailWristRx; spinRWristRz = trailWristRz;
        } else {
          spinRShoulderRz = -leadShoulderRz; spinRShoulderRx = leadShoulderRx; spinRShoulderRy = -leadShoulderRy;
          spinRElbowRy = -leadElbowRy; spinRElbowRz = -leadElbowRz; spinRWristRx = leadWristRx; spinRWristRz = -leadWristRz;

          spinLShoulderRz = -trailShoulderRz; spinLShoulderRx = trailShoulderRx; spinLShoulderRy = -trailShoulderRy;
          spinLElbowRy = -trailElbowRy; spinLElbowRz = -trailElbowRz; spinLWristRx = trailWristRx; spinLWristRz = -trailWristRz;
        }

        // Blend Aerial Targets with 360 Spin Trick
        const sb = this.spinTrickBlend;
        this.targets.hips.rx = THREE.MathUtils.lerp(curHipsRx, spinHipsRx, sb);
        this.targets.hips.ry = THREE.MathUtils.lerp(curHipsRy, spinHipsRy, sb);
        this.targets.hips.rz = THREE.MathUtils.lerp(curHipsRz, spinHipsRz, sb);

        this.targets.spine.rx = THREE.MathUtils.lerp(curSpineRx, spinSpineRx, sb);
        this.targets.spine.ry = THREE.MathUtils.lerp(curSpineRy, spinSpineRy, sb);
        this.targets.spine.rz = THREE.MathUtils.lerp(curSpineRz, spinSpineRz, sb);

        this.targets.neck.rx = THREE.MathUtils.lerp(curNeckRx, spinNeckRx, sb);
        this.targets.neck.ry = THREE.MathUtils.lerp(curNeckRy, spinNeckRy, sb);
        this.targets.neck.rz = THREE.MathUtils.lerp(curNeckRz, spinNeckRz, sb);

        this.targets.head.rx = THREE.MathUtils.lerp(curHeadRx, spinHeadRx, sb);
        this.targets.head.ry = THREE.MathUtils.lerp(curHeadRy, spinHeadRy, sb);
        this.targets.head.rz = THREE.MathUtils.lerp(curHeadRz, spinHeadRz, sb);

        this.targets.leftHip.rx = THREE.MathUtils.lerp(curLHipRx, spinLHipRx, sb);
        this.targets.leftHip.ry = THREE.MathUtils.lerp(curLHipRy, spinLHipRy, sb);
        this.targets.leftHip.rz = THREE.MathUtils.lerp(curLHipRz, spinLHipRz, sb);
        this.targets.leftKnee.rx = THREE.MathUtils.lerp(curLKneeRx, spinLKneeRx, sb);
        this.targets.leftAnkle.rx = THREE.MathUtils.lerp(curLAnkleRx, spinLAnkleRx, sb);
        this.targets.leftAnkle.rz = THREE.MathUtils.lerp(curLAnkleRz, 0, sb);

        this.targets.rightHip.rx = THREE.MathUtils.lerp(curRHipRx, spinRHipRx, sb);
        this.targets.rightHip.ry = THREE.MathUtils.lerp(curRHipRy, spinRHipRy, sb);
        this.targets.rightHip.rz = THREE.MathUtils.lerp(curRHipRz, spinRHipRz, sb);
        this.targets.rightKnee.rx = THREE.MathUtils.lerp(curRKneeRx, spinRKneeRx, sb);
        this.targets.rightAnkle.rx = THREE.MathUtils.lerp(curRAnkleRx, spinRAnkleRx, sb);
        this.targets.rightAnkle.rz = THREE.MathUtils.lerp(curRAnkleRz, 0, sb);

        this.targets.leftShoulder.rz = THREE.MathUtils.lerp(curLShoulderRz, spinLShoulderRz, sb);
        this.targets.leftShoulder.rx = THREE.MathUtils.lerp(curLShoulderRx, spinLShoulderRx, sb);
        this.targets.leftShoulder.ry = THREE.MathUtils.lerp(curLShoulderRy, spinLShoulderRy, sb);
        this.targets.leftElbow.ry = THREE.MathUtils.lerp(curLElbowRy, spinLElbowRy, sb);
        this.targets.leftElbow.rz = THREE.MathUtils.lerp(curLElbowRz, spinLElbowRz, sb);
        this.targets.leftWrist.rx = THREE.MathUtils.lerp(curLWristRx, spinLWristRx, sb);
        this.targets.leftWrist.rz = THREE.MathUtils.lerp(curLWristRz, spinLWristRz, sb);

        this.targets.rightShoulder.rz = THREE.MathUtils.lerp(curRShoulderRz, spinRShoulderRz, sb);
        this.targets.rightShoulder.rx = THREE.MathUtils.lerp(curRShoulderRx, spinRShoulderRx, sb);
        this.targets.rightShoulder.ry = THREE.MathUtils.lerp(curRShoulderRy, spinRShoulderRy, sb);
        this.targets.rightElbow.ry = THREE.MathUtils.lerp(curRElbowRy, spinRElbowRy, sb);
        this.targets.rightElbow.rz = THREE.MathUtils.lerp(curRElbowRz, spinRElbowRz, sb);
        this.targets.rightWrist.rx = THREE.MathUtils.lerp(curRWristRx, spinRWristRx, sb);
        this.targets.rightWrist.rz = THREE.MathUtils.lerp(curRWristRz, spinRWristRz, sb);
      } else {
        this.targets.hips.rx = curHipsRx;
        this.targets.hips.ry = curHipsRy;
        this.targets.hips.rz = curHipsRz;

        this.targets.spine.rx = curSpineRx;
        this.targets.spine.ry = curSpineRy;
        this.targets.spine.rz = curSpineRz;

        this.targets.neck.rx = curNeckRx;
        this.targets.neck.ry = curNeckRy;
        this.targets.neck.rz = curNeckRz;
        this.targets.head.rx = curHeadRx;
        this.targets.head.ry = curHeadRy;
        this.targets.head.rz = curHeadRz;

        this.targets.leftHip.rx = curLHipRx;
        this.targets.leftHip.ry = curLHipRy;
        this.targets.leftHip.rz = curLHipRz;
        this.targets.leftKnee.rx = curLKneeRx;
        this.targets.leftAnkle.rx = curLAnkleRx;
        this.targets.leftAnkle.rz = curLAnkleRz;

        this.targets.rightHip.rx = curRHipRx;
        this.targets.rightHip.ry = curRHipRy;
        this.targets.rightHip.rz = curRHipRz;
        this.targets.rightKnee.rx = curRKneeRx;
        this.targets.rightAnkle.rx = curRAnkleRx;
        this.targets.rightAnkle.rz = curRAnkleRz;

        this.targets.leftShoulder.rz = curLShoulderRz;
        this.targets.leftShoulder.rx = curLShoulderRx;
        this.targets.leftShoulder.ry = curLShoulderRy;
        this.targets.leftElbow.ry = curLElbowRy;
        this.targets.leftElbow.rz = curLElbowRz;
        this.targets.leftWrist.rx = curLWristRx;
        this.targets.leftWrist.rz = curLWristRz;

        this.targets.rightShoulder.rz = curRShoulderRz;
        this.targets.rightShoulder.rx = curRShoulderRx;
        this.targets.rightShoulder.ry = curRShoulderRy;
        this.targets.rightElbow.ry = curRElbowRy;
        this.targets.rightElbow.rz = curRElbowRz;
        this.targets.rightWrist.rx = curRWristRx;
        this.targets.rightWrist.rz = curRWristRz;
      }
    } else if (this.landAbsorbTimer > 0) {
      // --- ANIMATION 3: BENT-KNEE LANDING IMPACT ABSORPTION ---
      const landAbsorb = Math.sin((this.landAbsorbTimer / 0.32) * Math.PI * 0.5);
      this.targets.hips.rx += 0.12 * landAbsorb;
      this.targets.spine.rx += 0.24 * landAbsorb;
      this.targets.neck.rx -= 0.10 * landAbsorb;
      this.targets.head.rx -= 0.11 * landAbsorb;

      this.targets.leftHip.rx -= 0.38 * landAbsorb;
      this.targets.rightHip.rx -= 0.38 * landAbsorb;
      this.targets.leftKnee.rx += 0.36 * landAbsorb;
      this.targets.rightKnee.rx += 0.36 * landAbsorb;

      this.targets.leftShoulder.rz += 0.18 * landAbsorb;
      this.targets.rightShoulder.rz -= 0.18 * landAbsorb;
      this.targets.leftShoulder.rx -= 0.20 * landAbsorb;
      this.targets.rightShoulder.rx -= 0.20 * landAbsorb;

      this.hipPosTarget.y -= 0.08 * landAbsorb;
      this.hipY = THREE.MathUtils.damp(this.hipY, this.hipPosTarget.y, 18.0, clampedDt);
    }

    // 7. Special Overrides: Drift Hockey Stop (when not in full drift carving stance)
    if (params.isDrifting && params.isGrounded && this.driftCarveBlend < 0.2) {
      this.targets.spine.rx += 0.08;
      this.targets.leftKnee.rx += 0.12;
      this.targets.rightKnee.rx += 0.12;
    }

    // 8. Exponential Damping towards targets
    const blendRate = 1 - Math.exp(-12.0 * clampedDt);

    this.jointNames.forEach((name) => {
      const j = this.skier.joints[name];
      const tgt = this.targets[name];
      if (j && tgt) {
        j.rotation.x += (tgt.rx - j.rotation.x) * blendRate;
        if (name === 'hips') {
          j.rotation.y += shortestAngleDelta(tgt.ry, j.rotation.y) * blendRate;
          j.rotation.z += shortestAngleDelta(tgt.rz, j.rotation.z) * blendRate;
        } else {
          j.rotation.y += (tgt.ry - j.rotation.y) * blendRate;
          j.rotation.z += (tgt.rz - j.rotation.z) * blendRate;
        }
      }
    });

    // Apply stable damped hips (zero vertical 60Hz matrix oscillation)
    this.skier.joints.hips.position.y = this.hipY;
    this.skier.joints.hips.position.x += (this.hipPosTarget.x - this.skier.joints.hips.position.x) * blendRate;
    this.skier.joints.hips.position.z += (this.hipPosTarget.z - this.skier.joints.hips.position.z) * blendRate;

    // Distinct visual separation of legs during jump flight
    const hipSpreadOffset = !params.isGrounded ? (0.05 * Math.min(1.0, this.airTime / 0.20)) : 0.0;
    if (this.skier.joints.leftHip) {
      this.skier.joints.leftHip.position.x = 0.114 + hipSpreadOffset;
    }
    if (this.skier.joints.rightHip) {
      this.skier.joints.rightHip.position.x = -0.114 - hipSpreadOffset;
    }
  }
}
