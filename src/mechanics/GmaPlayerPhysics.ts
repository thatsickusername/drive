import * as THREE from 'three';
import {
  PlayerConfig,
  createDefaultPlayerConfig,
  SportType,
  TurnType,
  MovementState
} from './GmaConfig';
import { TrickScoringSystem, LandingQuality } from './TrickScoring';
import { VerletRagdollSolver } from './VerletRagdoll';
import { ControlsProcessor, InputState } from './ControlsProcessor';
import { SurfaceType } from '../world/alpineHeightfield';

const RAD2DEG = 180.0 / Math.PI;
const GRAVITY = 9.81;

export class GmaPlayerPhysics {
  public config: PlayerConfig;
  public sport: SportType = SportType.Skis;
  public hasTwintips: boolean = true; // Default to Twin-tip Skis

  // Spatial State
  public position = new THREE.Vector3();
  public velocity = new THREE.Vector3();
  public forwardDir = new THREE.Vector3(0, 0, -1);
  public upDir = new THREE.Vector3(0, 1, 0);
  public groundNormal = new THREE.Vector3(0, 1, 0);
  public currentHeadingAngle: number = 0; // Radians

  // Rotation / Aerial Trick State
  public angularVelocitySpin: number = 0;
  public angularVelocityFlip: number = 0;
  public angularVelocityRoll: number = 0;
  public accumulatedAirSpinDeg: number = 0;
  public accumulatedAirFlipDeg: number = 0;
  public accumulatedAirRollDeg: number = 0;
  public airPitch: number = 0;
  public airRoll: number = 0;

  // Dynamics State
  public state: MovementState = MovementState.Standing;
  public currentTurnType: TurnType = TurnType.None;
  public turnTimer: number = 0;
  public sharpTurnTimer: number = 0;
  public currentDriftTime: number = 0;
  public airTime: number = 0;
  public slideTurnBoostTimer: number = 0;
  public slideTurnBoostTriggered: boolean = false;
  public driftMilestoneIndex: number = 0;
  public sharpTurnSpinBoostActive: boolean = false;
  public isStaking: boolean = false;
  public isStakingDamped: boolean = false;
  public stakingPoleTimer: number = 0;
  public stakingPoleSide: number = 0; // -1 = Left pole plant, +1 = Right pole plant
  public stakingPlantTriggered: boolean = false;
  public snowslidePumpTimer: number = 0; // Snowboard edge carve unweighting pump timer
  public roughGroundTimer: number = 0; // Riding on rough terrain/rocks exceeding 3.0s triggers crash

  // Alternating steer skate/wiggle state (GMA snowslide_push: Left <-> Right cadence)
  public lastSteerSign: number = 0;
  public steerWiggleTimer: number = 0.0;
  public skateCadenceCount: number = 0;

  // Sub-step time accumulator for 333.3 Hz loop
  private subStepAccumulator: number = 0;

  // Snowdepth suspension internal state
  public snowDepthPos: number = 0;
  public snowDepthVel: number = 0;

  // Scratch vectors for zero-allocation 333.3 Hz physics hot loop
  private readonly _gVec = new THREE.Vector3(0, -GRAVITY, 0);
  private readonly _gNormal = new THREE.Vector3();
  private readonly _gParallel = new THREE.Vector3();
  private readonly _fPull = new THREE.Vector3();
  private readonly _velDir = new THREE.Vector3();
  private readonly _targetDir = new THREE.Vector3();

  // Systems
  public controls = new ControlsProcessor();
  public trickScoring = new TrickScoringSystem();
  public ragdoll = new VerletRagdollSolver();

  // Ragdoll recovery timer
  public crashRecoveryTimer: number = 0;
  private prevJumpPressed: boolean = false;
  private prevStakePressed: boolean = false;

  constructor(sport: SportType = SportType.Skis, hasTwintips: boolean = true) {
    this.sport = sport;
    this.hasTwintips = hasTwintips;
    this.config = createDefaultPlayerConfig();
  }

  public reset(pos: THREE.Vector3, headingRad: number = 0): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.currentHeadingAngle = headingRad;
    this.forwardDir.set(-Math.sin(headingRad), 0, -Math.cos(headingRad)).normalize();
    this.upDir.set(0, 1, 0);
    this.groundNormal.set(0, 1, 0);

    this.state = MovementState.Standing;
    this.currentTurnType = TurnType.None;
    this.turnTimer = 0;
    this.sharpTurnTimer = 0;
    this.currentDriftTime = 0;
    this.airTime = 0;
    this.slideTurnBoostTimer = 0;
    this.slideTurnBoostTriggered = false;
    this.driftMilestoneIndex = 0;
    this.sharpTurnSpinBoostActive = false;
    this.isStaking = false;
    this.isStakingDamped = false;
    this.stakingPoleTimer = 0;
    this.stakingPoleSide = 0;
    this.stakingPlantTriggered = false;
    this.prevStakePressed = false;
    this.snowslidePumpTimer = 0;
    this.roughGroundTimer = 0;
    this.subStepAccumulator = 0;
    this.snowDepthPos = 0;
    this.snowDepthVel = 0;

    this.angularVelocitySpin = 0;
    this.angularVelocityFlip = 0;
    this.angularVelocityRoll = 0;
    this.accumulatedAirSpinDeg = 0;
    this.accumulatedAirFlipDeg = 0;
    this.accumulatedAirRollDeg = 0;
    this.airPitch = 0;
    this.airRoll = 0;

    this.crashRecoveryTimer = 0;
    this.ragdoll.active = false;
    this.trickScoring.reset();
  }

  public applyRocketJump(): void {
    this.velocity.x *= this.config.speedboost_rocket_jump_dir;
    this.velocity.z *= this.config.speedboost_rocket_jump_dir;
    this.velocity.y *= this.config.speedboost_rocket_jump_vertical;
  }

  public handleObstacleCollision(impactVelocity: number): void {
    if (impactVelocity > this.config.crash_magnitude_object) {
      this.triggerCrash(`Obstacle collision exceeding crash magnitude (${impactVelocity.toFixed(1)} > 40.0 m/s)`);
    }
  }

  public get speed(): number {
    return this.velocity.length();
  }

  public get speedKmh(): number {
    return this.speed * 3.6;
  }

  public isSwitchRiding(): boolean {
    return this.velocity.dot(this.forwardDir) < -0.1;
  }

  public triggerCrash(_reason: string): void {
    if (this.state === MovementState.Crashing) return;
    this.state = MovementState.Crashing;
    this.crashRecoveryTimer = 2.5; // 2.5s ragdoll before respawn/recovery
    this.ragdoll.initializeSkeleton(this.position, this.forwardDir, this.velocity);
    this.trickScoring.finalizeScore(LandingQuality.Crash);
  }

  /**
   * Main step entrypoint: accumulates dt and executes 333.3 Hz sub-steps (player.deltatime: 0.003s)
   */
  public update(
    dt: number,
    rawInput: InputState,
    groundHeight: number,
    groundNormal: THREE.Vector3,
    surfaceType: SurfaceType = 'POWDER'
  ): void {
    this.groundNormal.copy(groundNormal).normalize();

    // If crashing, run Verlet ragdoll solver at 50 Hz
    if (this.state === MovementState.Crashing) {
      this.crashRecoveryTimer -= dt;
      this.ragdoll.stepSimulation(groundHeight);
      const com = this.ragdoll.getCenterOfMass();
      if (com.lengthSq() > 0.01) {
        this.position.copy(com);
      }
      if (this.crashRecoveryTimer <= 0) {
        // Recover from crash
        this.state = MovementState.Standing;
        this.ragdoll.active = false;
        this.velocity.set(0, 0, 0);
        this.airPitch = 0;
        this.airRoll = 0;
      }
      return;
    }

    // Process raw inputs with deadzones and response curves
    const isSwitch = this.isSwitchRiding();
    const processed = this.controls.processInputs(dt, rawInput, isSwitch);

    // 333.3 Hz Physics Sub-Stepping Loop (player.deltatime: 0.003s)
    const subDt = this.config.deltatime;
    this.subStepAccumulator += Math.min(dt, 0.1);

    while (this.subStepAccumulator >= subDt) {
      this.iterateSubStep(
        subDt,
        processed.steer,
        processed.sharp,
        processed.slide,
        processed.jump,
        processed.brake,
        processed.stake,
        processed.slapTackle,
        rawInput.trickSpinX,
        rawInput.trickFlipY,
        rawInput.trickRoll,
        groundHeight,
        surfaceType
      );
      this.subStepAccumulator -= subDt;
    }

    // Maintain ground contact elevation with snowdepth spring absorption when not airborne
    if (this.state !== MovementState.Airborne && this.state !== MovementState.WaterSkiing) {
      this.position.y = groundHeight + this.snowDepthPos;
    }
  }

  private iterateSubStep(
    dt: number,
    steerInput: number,
    sharpTurn: boolean,
    slideTurn: boolean,
    jumpPressed: boolean,
    brakePressed: boolean,
    stakePressed: boolean,
    tacklePressed: boolean,
    spinInput: number,
    flipInput: number,
    rollInput: number,
    groundHeight: number,
    surfaceType: SurfaceType = 'POWDER'
  ): void {
    // Water skiing check (GMA: when player enters water surface at y <= 0.0)
    if (this.position.y <= 0.0 && groundHeight <= 0.0) {
      this.updateWaterPhysics(dt, 0.0);
      return;
    }

    // Authentic GMA Ground Contact: Elevation proximity without erroneous vertical ascent cancellation
    const isTakeoffLockout = this.state === MovementState.Airborne && this.airTime < 0.08;
    const groundedTolerance = (this.state === MovementState.Airborne) ? 0.12 : 0.40;
    const onGround = !isTakeoffLockout && (this.position.y <= groundHeight + groundedTolerance);

    if (onGround) {
      if (this.state === MovementState.Airborne) {
        // Touchdown landing evaluation
        const impactSpeed = -this.velocity.dot(this.groundNormal);

        if (impactSpeed > this.config.crash_magnitude_ground) {
          this.triggerCrash('Ground impact exceeded crash threshold (26.0 m/s)');
          return;
        }

        // Absorb downward normal velocity (snow damping with zero outward bounce)
        const vDotNormal = this.velocity.dot(this.groundNormal);
        if (vDotNormal < 0) {
          this.velocity.addScaledVector(this.groundNormal, -vDotNormal);
        }

        if (impactSpeed > this.config.penalty_magnitude_ground) {
          this.velocity.multiplyScalar(this.config.velocity_penalty_ground);
        }

        // Landing quality evaluation
        const boardUp = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), this.airPitch);
        const tiltDeg = Math.acos(THREE.MathUtils.clamp(boardUp.dot(this.groundNormal), -1, 1)) * RAD2DEG;

        let yawDevDeg = 0;
        const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (horizSpeed > 1.5) {
          const travelHeading = Math.atan2(-this.velocity.x, -this.velocity.z);
          let diff = Math.abs((travelHeading - this.currentHeadingAngle) % (Math.PI * 2));
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          yawDevDeg = diff * RAD2DEG;
        }

        const landingQuality = this.trickScoring.evaluateLanding(
          this.airTime,
          THREE.MathUtils.clamp(impactSpeed / 26.0, 0, 1),
          tiltDeg,
          yawDevDeg
        );

        if (landingQuality === LandingQuality.Crash) {
          this.triggerCrash('Landing angle or alignment exceeded crash tolerance');
          return;
        }

        // Finalize score and apply speed boost multiplier
        const scoreResult = this.trickScoring.finalizeScore(landingQuality);
        if (scoreResult.speedBoostMultiplier > 1.0) {
          this.velocity.multiplyScalar(scoreResult.speedBoostMultiplier);
        }

        this.state = MovementState.Skiing;
        this.airTime = 0;
        this.accumulatedAirSpinDeg = 0;
        this.accumulatedAirFlipDeg = 0;
        this.accumulatedAirRollDeg = 0;
        this.airPitch = 0;
        this.airRoll = 0;
        this.sharpTurnSpinBoostActive = false;
      }

      this.updateGroundPhysics(
        dt,
        steerInput,
        sharpTurn,
        slideTurn,
        jumpPressed,
        brakePressed,
        stakePressed,
        tacklePressed,
        groundHeight,
        surfaceType
      );
    } else {
      this.state = MovementState.Airborne;
      this.airTime += dt;
      this.updateAirbornePhysics(dt, steerInput, spinInput, flipInput, rollInput);
    }
    this.prevJumpPressed = jumpPressed;
    this.prevStakePressed = stakePressed;
  }

  private updateGroundPhysics(
    dt: number,
    steerInput: number,
    sharpTurn: boolean,
    slideTurn: boolean,
    jumpPressed: boolean,
    brakePressed: boolean,
    stakePressed: boolean,
    tacklePressed: boolean,
    groundHeight: number,
    surfaceType: SurfaceType = 'POWDER'
  ): void {
    const isRoughGround = surfaceType === 'ROCK';
    // 0. Rough Ground Crash Timer
    if (isRoughGround) {
      this.roughGroundTimer += dt;
      if (this.roughGroundTimer >= this.config.time_on_rough_ground_before_crash) {
        this.triggerCrash('Riding on rough terrain/rocks exceeded 3.0s limit');
        return;
      }
    } else {
      this.roughGroundTimer = 0.0;
    }

    // Material-dependent properties (materials.yaml)
    let materialFriction = 0.2; // Default Snow_Any_Normal
    let depthOffset = 0.0;
    if (surfaceType === 'PISTE') {
      materialFriction = 0.1; // Snow_Any_Pist_Fast: 0.1
      depthOffset = 0.0;
    } else if (surfaceType === 'POWDER') {
      materialFriction = 0.3; // Snow_Any_Powder: 0.3
      depthOffset = 0.0;
    } else if (surfaceType === 'ICE') {
      materialFriction = 0.1; // Soft_Ice: 0.1
      depthOffset = 0.0;
    } else if (surfaceType === 'ROCK') {
      materialFriction = 10.0; // Soft_Stone: 10.0
      depthOffset = 0.0;
    }

    // 1. Snowdepth spring suspension model
    // Spring constant: k = 20.0, Spring pull: 1.0, Velocity damping: 0.99, Position damping: 0.95
    const targetElevation = groundHeight + depthOffset;
    const compression = targetElevation - (this.position.y - this.snowDepthPos);
    this.snowDepthVel += compression * this.config.snowdepth_vel_transfer * dt;
    const springForce = -this.config.snowdepth_spring_constant * this.snowDepthPos * this.config.snowdepth_spring_pull;
    this.snowDepthVel += springForce * dt;
    this.snowDepthVel *= Math.pow(this.config.snowdepth_vel_damp, dt / 0.003);
    this.snowDepthPos += this.snowDepthVel * dt;
    this.snowDepthPos *= Math.pow(this.config.snowdepth_pos_damp, dt / 0.003);
    this.snowDepthPos = THREE.MathUtils.clamp(this.snowDepthPos, -0.45, 0.35);

    // Apply ground contact elevation with snowdepth absorption
    this.position.y = groundHeight + this.snowDepthPos;

    // 2. Standing to Skiing / Riding Kick-Push Transition:
    // player.maxStandingVelocity: 1.0, player.standingToSkiingPushVelocity: 3.0
    const absSteer = Math.abs(steerInput);
    const curSpeed = this.velocity.length();

    // 2a. Alternating Steer Wiggle / Skate Mechanic (GMA player.snowslide_push.push_mul: 3.0)
    // Moving stick completely left and then completely right rhythmically builds forward speed
    const currentSteerSign = absSteer > 0.35 ? Math.sign(steerInput) : 0;
    this.steerWiggleTimer += dt;

    if (currentSteerSign !== 0 && this.lastSteerSign !== 0 && currentSteerSign !== this.lastSteerSign) {
      // Alternated steering edge: e.g. Left -> Right or Right -> Left
      if (this.steerWiggleTimer >= 0.10 && this.steerWiggleTimer <= 0.70) {
        // Valid rhythmic skate alternation!
        const maxSkateSpeed = 10.0; // 36 km/h cap for wiggle acceleration
        if (curSpeed < maxSkateSpeed) {
          const speedFactor = Math.max(0.15, 1.0 - (curSpeed / maxSkateSpeed));
          const skateImpulse = (this.config.snowslide_push_mul * 0.5) * speedFactor;
          this.velocity.addScaledVector(this.forwardDir, skateImpulse);
          this.state = MovementState.Skiing;
          this.skateCadenceCount++;
        }
      }
      this.lastSteerSign = currentSteerSign;
      this.steerWiggleTimer = 0.0;
    } else if (currentSteerSign !== 0 && this.lastSteerSign === 0) {
      this.lastSteerSign = currentSteerSign;
      this.steerWiggleTimer = 0.0;
    }

    if (this.state === MovementState.Standing || curSpeed < this.config.maxStandingVelocity) {
      if (stakePressed || (currentSteerSign !== 0 && curSpeed < 0.2)) {
        this.state = MovementState.Skiing;
        // Pushes player forward with standingToSkiingPushVelocity (3.0 m/s = 10.8 km/h)
        const pushPower = stakePressed ? this.config.standingToSkiingPushVelocity : 1.5;
        this.velocity.addScaledVector(this.forwardDir, pushPower);
      } else if (absSteer > 0.05) {
        this.state = MovementState.Skiing;
      } else {
        this.state = MovementState.Standing;
      }
    } else if (curSpeed < 0.2 && absSteer <= 0.05 && !stakePressed) {
      this.state = MovementState.Standing;
    }

    // 3. Determine Turn Type (Explicit Slide Turn via Shift takes precedence over passive OverTurn)
    if (slideTurn && absSteer > 0.05) {
      this.currentTurnType = TurnType.SlideTurn;
      this.sharpTurnTimer = 0.0;
    } else if (absSteer > 0.85 && curSpeed > 14.0) {
      this.currentTurnType = TurnType.OverTurn;
      this.sharpTurnTimer = 0.0;
    } else if (sharpTurn && absSteer > 0.05) {
      if (this.sharpTurnTimer < this.config.duration_sharpturn) {
        this.currentTurnType = TurnType.SharpTurn;
        this.sharpTurnTimer += dt;
      } else {
        // Duration gate (0.3s) exceeded: downgrade to standard turn
        this.currentTurnType = TurnType.StandardTurn;
      }
    } else if (absSteer > 0.05) {
      this.currentTurnType = TurnType.StandardTurn;
      this.sharpTurnTimer = 0.0;
    } else {
      this.currentTurnType = TurnType.None;
      this.turnTimer = 0.0;
      this.sharpTurnTimer = 0.0;
    }

    if (this.currentTurnType !== TurnType.None) {
      this.turnTimer += dt;
    }

    // 3. Evaluate Turning Parameters from Piecewise Curves
    let turnRate = 0.0;
    let driftFriction = 0.0;
    let turnCapRad = this.config.turn_cap_deg_standard * (Math.PI / 180.0);
    const normalizedSpeed = THREE.MathUtils.clamp(curSpeed / 30.0, 0.0, 1.0);

    switch (this.currentTurnType) {
      case TurnType.StandardTurn: {
        turnCapRad = this.config.turn_cap_deg_standard * (Math.PI / 180.0);
        const vFactor = this.config.turn_velocity_standard.evaluate(normalizedSpeed);
        const tFactor = this.config.turn_turntime_standard.evaluate(Math.min(this.turnTimer, 1.0));
        turnRate = vFactor * (1.0 + tFactor * 0.5);
        driftFriction = this.config.drift_velocity_standard.evaluate(normalizedSpeed) * this.config.drift_penalty_standard;
        break;
      }
      case TurnType.SharpTurn: {
        turnCapRad = this.config.turn_cap_deg_sharpturn * (Math.PI / 180.0);
        const vFactor = this.config.turn_velocity_sharpturn.evaluate(normalizedSpeed);
        turnRate = vFactor;
        const vDrift = this.config.drift_velocity_sharpturn.evaluate(normalizedSpeed);
        const tDrift = this.config.drift_turntime_sharpturn.evaluate(Math.min(this.sharpTurnTimer, 1.0));
        driftFriction = (vDrift + tDrift) * this.config.drift_penalty_sharpturn;
        break;
      }
      case TurnType.SlideTurn: {
        turnCapRad = this.config.turn_cap_deg_slideturn * (Math.PI / 180.0);
        const vFactor = this.config.turn_velocity_slideturn.evaluate(normalizedSpeed);
        const tFactor = this.config.turn_turntime_slideturn.evaluate(Math.min(this.turnTimer, 1.0));
        turnRate = vFactor * (1.0 + tFactor);
        const vDrift = this.config.drift_velocity_slideturn.evaluate(normalizedSpeed);
        const tDrift = this.config.drift_turntime_slideturn.evaluate(Math.min(this.currentDriftTime, 1.0));
        driftFriction = vDrift + tDrift;
        this.currentDriftTime += dt;

        // Authentic GMA slide turn boost at 0.5s mark (+2.0 m/s forward burst - one-shot per slide turn)
        this.slideTurnBoostTimer += dt;
        if (this.slideTurnBoostTimer >= this.config.slideturn_boost_timepoint && !this.slideTurnBoostTriggered) {
          this.velocity.addScaledVector(this.forwardDir, this.config.slideturn_boost_velocity);
          this.slideTurnBoostTriggered = true;
        }

        // Track drift duration milestones
        const milestones = this.config.speedboost_drift_durations;
        if (
          this.driftMilestoneIndex < milestones.length &&
          this.currentDriftTime >= milestones[this.driftMilestoneIndex]
        ) {
          this.driftMilestoneIndex++;
        }
        break;
      }
      case TurnType.OverTurn: {
        // Non-twintip traditional skis capped at 30 deg; twintip skis capped at 60 deg
        turnCapRad = (this.hasTwintips ? this.config.turn_cap_deg_overturn : this.config.turn_cap_deg_overturn_no_twintip) * (Math.PI / 180.0);
        const vFactor = this.config.turn_velocity_overturn.evaluate(normalizedSpeed);
        turnRate = vFactor;
        driftFriction = this.config.drift_velocity_overturn.evaluate(normalizedSpeed) * this.config.drift_penalty_overturn;
        break;
      }
      default: {
        this.slideTurnBoostTimer = 0.0;
        this.slideTurnBoostTriggered = false;
        this.currentDriftTime = 0.0;
        this.driftMilestoneIndex = 0;
        break;
      }
    }

    // 4. Update Heading with GMA Turn Angle Clamping relative to horizontal momentum
    if (absSteer > 0.01) {
      const deltaAngle = -steerInput * turnRate * dt;
      this.currentHeadingAngle += deltaAngle;
    }

    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (horizSpeed > 1.5 && this.currentTurnType !== TurnType.None) {
      const isSwitch = this.isSwitchRiding();
      const travelAngle = Math.atan2(isSwitch ? this.velocity.x : -this.velocity.x, isSwitch ? this.velocity.z : -this.velocity.z);
      let diff = this.currentHeadingAngle - travelAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      if (Math.abs(diff) > turnCapRad) {
        this.currentHeadingAngle = travelAngle + Math.sign(diff) * turnCapRad;
        if (Math.abs(diff) > turnCapRad * 1.15 && this.currentTurnType !== TurnType.SlideTurn) {
          this.currentTurnType = TurnType.OverTurn;
        }
      }
    }

    this.forwardDir.set(
      -Math.sin(this.currentHeadingAngle),
      0,
      -Math.cos(this.currentHeadingAngle)
    );
    // Project forward along terrain tangent
    this.forwardDir.addScaledVector(this.groundNormal, -this.forwardDir.dot(this.groundNormal)).normalize();

    // 5. Slope Gravitational Decomposition & Contour Adhesion Pull
    // g = (0, -9.81, 0)
    // g_normal = (g . n) * n
    // g_parallel = g - g_normal
    // Apply tangential gravity: v += g_parallel * dt
    const normalComp = this._gVec.dot(this.groundNormal);
    this._gNormal.copy(this.groundNormal).multiplyScalar(normalComp);
    this._gParallel.subVectors(this._gVec, this._gNormal);

    // Tangential fall-line gravity acceleration (pure GMA 9.81 m/s^2 slope projection)
    this.velocity.addScaledVector(this._gParallel, dt);

    // Continuous adhesive normal pull: F_pull = -n * 5.0 m/s^2 (GMA contour adhesion)
    // Eliminates unnatural airborne bouncing when skiing over small crests, wind lips, and undulating rollers
    this._fPull.copy(this.groundNormal).multiplyScalar(-this.config.ground_pull_force);
    this.velocity.addScaledVector(this._fPull, dt);

    // Cancel downward velocity into ground so normal force doesn't pollute tangential speed
    const vDotNormal = this.velocity.dot(this.groundNormal);
    if (vDotNormal < 0) {
      this.velocity.addScaledVector(this.groundNormal, -vDotNormal);
    }

    // 6. Ground Friction & Twintip Switch Handling
    let effectiveFriction = this.config.ground_friction_base;

    const alignment = this.velocity.dot(this.forwardDir);
    const isSwitch = alignment < -0.1;

    // Traditional skis suffer 10x penalty when riding backward without twintips.
    // Snowboards have built-in twin-tip symmetry and suffer no switch friction penalty
    if (isSwitch && this.sport === SportType.Skis && !this.hasTwintips) {
      effectiveFriction = this.config.ground_friction_switch_no_twintips; // 10.0
    }

    // Braking adds direct friction (player.breaking.power: 2.5)
    if (brakePressed) {
      effectiveFriction += this.config.breaking_power; // 2.5
    }

    // Backward Riding: Maximum backward speed is capped at 12 m/s with a friction of 15.0
    if (isSwitch) {
      effectiveFriction += this.config.backward_friction; // 15.0
    }

    // Authentic GMA ground friction + aerodynamic drag (player.air_friction: 0.006)
    // Quadratic aero drag ensures gradual speed buildup and caps terminal speeds realistically around 30 m/s (108 km/h)
    const groundSpeed = this.velocity.length();
    const speedRatio = groundSpeed / 30.0;
    const aeroDrag = this.config.air_friction * (speedRatio * speedRatio) * 3.5;
    const totalFriction = (effectiveFriction + driftFriction) * materialFriction + aeroDrag;
    const damping = Math.exp(-totalFriction * dt);
    this.velocity.multiplyScalar(damping);

    // Hard backward speed clamp (player.collissions.backward.max_velocity: 12.0 m/s)
    if (isSwitch && this.velocity.length() > this.config.backward_max_velocity) {
      this.velocity.setLength(this.config.backward_max_velocity);
    }

    // 7. Align Velocity with Forward Ski/Board Direction (Edge Bite / Carving Grip - Zero Allocation)
    const alignSpeed = this.velocity.length();
    if (alignSpeed > 1e-4) {
      this._velDir.copy(this.velocity).divideScalar(alignSpeed);
      const grip = (this.currentTurnType === TurnType.SlideTurn) ? 0.85 : 0.98;
      this._targetDir.copy(this.forwardDir);
      if (isSwitch) this._targetDir.negate();
      this._velDir.multiplyScalar(1.0 - grip).addScaledVector(this._targetDir, grip).normalize();
      this.velocity.copy(this._velDir).multiplyScalar(alignSpeed);
    }

    // 8. Jump Execution (strictly edge-triggered one-shot impulse)
    const isJumpTriggered = jumpPressed && !this.prevJumpPressed;
    if (isJumpTriggered) {
      this.velocity.y = Math.max(this.velocity.y, 0.0) + this.config.jump_strength; // +4.0 m/s
      this.state = MovementState.Airborne;
      this.airTime = 0.0;
      if (this.currentTurnType === TurnType.SharpTurn) {
        this.sharpTurnSpinBoostActive = true;
      }
    }

    // 9. Propulsion: Ski poles staking (Skis)
    this.handlePropulsion(dt, stakePressed, steerInput);

    // 10. Shoulder Tackle / Pole Slap
    if (tacklePressed) {
      this.handleTackle(dt);
    }

    // 11. Integrate Position
    this.position.addScaledVector(this.velocity, dt);
  }

  private updateAirbornePhysics(
    dt: number,
    steerInput: number,
    spinInput: number,
    flipInput: number,
    rollInput: number
  ): void {
    // 1. Gravity and Hover Lift
    this.velocity.addScaledVector(this._gVec, dt);

    const spinCmd = Math.abs(spinInput) > 0.05 ? spinInput : steerInput;
    const isTricking = Math.abs(spinCmd) > 0.05 || Math.abs(flipInput) > 0.05 || Math.abs(rollInput) > 0.05;
    if (isTricking) {
      this.velocity.y += this.config.trick_hover_zforce * dt;
    }

    // Air Drag: During airborne phases (mechanics/PlayerPhysics.cpp:259):
    // velocity_ *= (1.0 - config_.air_friction); // air_friction: 0.006
    this.velocity.multiplyScalar(1.0 - this.config.air_friction);

    // 2. Aerial Rotations (Spins, Flips, Rolls)
    // Invert spinCmd sign so air rotation aligns 1:1 with ground steering convention
    if (Math.abs(spinCmd) > 0.05) {
      const spinMultiplier = this.sharpTurnSpinBoostActive ? this.config.rotationboost_sharp_turn_boost : 1.0;
      this.angularVelocitySpin -= spinCmd * this.config.spin_acceleration * spinMultiplier * dt;
    } else {
      this.angularVelocitySpin *= Math.exp(-this.config.spin_deceleration * dt);
    }

    const deltaSpin = this.angularVelocitySpin * dt;
    this.currentHeadingAngle += deltaSpin;
    const spinDeg = Math.abs(deltaSpin) * RAD2DEG;
    this.accumulatedAirSpinDeg += spinDeg;
    this.trickScoring.addSpin(this.accumulatedAirSpinDeg);

    if (Math.abs(flipInput) > 0.05) {
      this.angularVelocityFlip += flipInput * this.config.flip_acceleration * dt;
    } else {
      this.angularVelocityFlip *= Math.exp(-this.config.flip_deceleration * dt);
    }
    const deltaFlip = this.angularVelocityFlip * dt;
    this.airPitch += deltaFlip;
    const flipDeg = Math.abs(deltaFlip) * RAD2DEG;
    this.accumulatedAirFlipDeg += flipDeg;
    this.trickScoring.addFlip(this.accumulatedAirFlipDeg, flipInput > 0);

    if (Math.abs(rollInput) > 0.05) {
      this.angularVelocityRoll += rollInput * this.config.roll_acceleration * dt;
    } else {
      this.angularVelocityRoll *= Math.exp(-this.config.roll_deceleration * dt);
    }
    const deltaRoll = this.angularVelocityRoll * dt;
    this.airRoll += deltaRoll;
    this.accumulatedAirRollDeg += Math.abs(deltaRoll) * RAD2DEG;
    this.trickScoring.addRoll(this.accumulatedAirRollDeg);

    this.forwardDir.set(
      -Math.sin(this.currentHeadingAngle),
      0,
      -Math.cos(this.currentHeadingAngle)
    ).normalize();

    // 3. Position Integration
    this.position.addScaledVector(this.velocity, dt);
  }

  private handlePropulsion(dt: number, stakePressed: boolean, steerInput: number): void {
    if (this.sport === SportType.Snowboard) {
      // GMA Snowboard: No poles, cannot stake on flats
      this.isStaking = false;
      this.isStakingDamped = false;
      this.stakingPoleTimer = 0.0;
      this.stakingPlantTriggered = false;
      return;
    }

    const curSpeed = this.velocity.length();
    // Terrain pitch angle along forward travel direction
    const slopePitchDeg = Math.asin(THREE.MathUtils.clamp(this.forwardDir.y, -1.0, 1.0)) * RAD2DEG;

    const canStakeRegular =
      slopePitchDeg >= this.config.staking_inclination_regular_from_deg &&
      slopePitchDeg <= this.config.staking_inclination_regular_to_deg;
    const canStakeDamped =
      slopePitchDeg > this.config.staking_inclination_damped_from_deg &&
      slopePitchDeg <= this.config.staking_inclination_damped_to_deg;

    // Hard speed cutoff limit: beyond this speed, forward pole propulsion stops completely and only gravity provides force
    const maxSpeedLimit = this.config.staking_max_vel * 15.0; // 10.5 m/s (~38 km/h)
    const eligible = (canStakeRegular || canStakeDamped) && (curSpeed < maxSpeedLimit);

    // Staking is an edge-triggered single pole-plant impulse per key press, not a continuous engine throttle
    const isStakeTriggered = stakePressed && !this.prevStakePressed;
    if (isStakeTriggered && eligible && this.stakingPoleTimer <= 0.0) {
      this.isStaking = true;
      this.isStakingDamped = canStakeDamped;
      this.stakingPoleTimer = 0.40;
      this.stakingPlantTriggered = true;

      // Assign pole plant side based on steering direction: Left turn -> Left pole (-1), Right turn -> Right pole (+1)
      if (steerInput < -0.05) {
        this.stakingPoleSide = -1;
      } else if (steerInput > 0.05) {
        this.stakingPoleSide = 1;
      } else {
        this.stakingPoleSide = this.stakingPoleSide === -1 ? 1 : -1;
      }

      let power = this.config.staking_power;
      if (curSpeed < 1.0) {
        power += this.config.staking_initial_power; // Standstill kick
      }
      if (canStakeDamped) {
        power *= this.config.staking_damped_mul; // 0.2
      }
      this.velocity.addScaledVector(this.forwardDir, power * 0.12);
    } else if (this.stakingPoleTimer > 0.0 && eligible) {
      this.stakingPoleTimer -= dt;
      this.isStaking = true;
    } else {
      this.isStaking = false;
      this.isStakingDamped = false;
      this.stakingPoleTimer = 0.0;
    }
  }

  private handleTackle(_dt: number): void {
    const curSpeed = this.velocity.length();
    if (this.sport === SportType.Snowboard) {
      // Snowboard shoulder tackle requires charging speed >= 10.0 m/s
      if (curSpeed >= this.config.tackle_min_velocity) {
        this.velocity.multiplyScalar(this.config.speedboost_npc_slapped);
      }
    } else {
      // Skis pole slap has reach and works at any speed
      this.velocity.multiplyScalar(this.config.speedboost_npc_slapped);
    }
  }

  /**
   * Water skiing & hydroplaning dynamics (GMA player.yaml:120-123 & PlayerPhysics.cpp:281-303)
   */
  private updateWaterPhysics(dt: number, waterLevel: number = 0.0): void {
    this.state = MovementState.WaterSkiing;

    const depth = waterLevel - this.position.y;
    if (depth > Math.abs(this.config.water_max_depth)) {
      this.triggerCrash('Sank beneath water skiing limit (-2.0m)');
      return;
    }

    // Buoyancy spring force
    const buoyancy = depth * this.config.water_spring_k * 100.0;
    this.velocity.y += (buoyancy - GRAVITY) * dt;

    // Water surface friction drag
    this.velocity.x *= (1.0 - this.config.water_velocity_friction_x * dt);
    this.velocity.z *= (1.0 - this.config.water_velocity_friction_z * dt);

    this.position.addScaledVector(this.velocity, dt);

    if (this.velocity.length() < this.config.water_min_velocity && depth > 0.5) {
      this.triggerCrash('Loss of hydroplaning velocity in water');
    }
  }
}
