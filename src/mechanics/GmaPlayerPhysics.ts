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
  public snowslidePumpTimer: number = 0; // Snowboard edge carve unweighting pump timer
  public roughGroundTimer: number = 0; // Riding on rough terrain/rocks exceeding 3.0s triggers crash
  private lastSteerSign: number = 0;

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

  // Systems
  public controls = new ControlsProcessor();
  public trickScoring = new TrickScoringSystem();
  public ragdoll = new VerletRagdollSolver();

  // Ragdoll recovery timer
  public crashRecoveryTimer: number = 0;

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
    this.snowslidePumpTimer = 0;
    this.roughGroundTimer = 0;
    this.lastSteerSign = 0;
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
    isRoughGround: boolean = false
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
        rawInput.trickFlipY,
        rawInput.trickRoll,
        groundHeight,
        isRoughGround
      );
      this.subStepAccumulator -= subDt;
    }

    // Maintain ground contact elevation with snowdepth spring absorption when not airborne
    if (this.state !== MovementState.Airborne) {
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
    flipInput: number,
    rollInput: number,
    groundHeight: number,
    isRoughGround: boolean = false
  ): void {
    const groundedTolerance = (this.state === MovementState.Airborne) ? 0.12 : 0.40;
    const onGround = this.position.y <= groundHeight + groundedTolerance;

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
        isRoughGround
      );
    } else {
      this.state = MovementState.Airborne;
      this.airTime += dt;
      this.updateAirbornePhysics(dt, steerInput, flipInput, rollInput);
    }
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
    isRoughGround: boolean = false
  ): void {
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

    // 1. Snowdepth spring suspension model
    // Spring constant: k = 20.0, Spring pull: 1.0, Velocity damping: 0.99, Position damping: 0.95
    const targetElevation = groundHeight;
    const compression = targetElevation - (this.position.y - this.snowDepthPos);
    this.snowDepthVel += compression * this.config.snowdepth_vel_transfer * dt;
    const springForce = -this.config.snowdepth_spring_constant * this.snowDepthPos * this.config.snowdepth_spring_pull;
    this.snowDepthVel += springForce * dt;
    this.snowDepthVel *= Math.pow(this.config.snowdepth_vel_damp, dt / 0.003);
    this.snowDepthPos += this.snowDepthVel * dt;
    this.snowDepthPos *= Math.pow(this.config.snowdepth_pos_damp, dt / 0.003);
    this.snowDepthPos = THREE.MathUtils.clamp(this.snowDepthPos, -0.35, 0.35);

    // Apply ground contact elevation with snowdepth absorption
    this.position.y = groundHeight + this.snowDepthPos;

    // 2. Standing to Skiing / Riding Kick-Push Transition:
    // player.maxStandingVelocity: 1.0, player.standingToSkiingPushVelocity: 3.0
    const absSteer = Math.abs(steerInput);
    const curSpeed = this.velocity.length();

    if (this.state === MovementState.Standing || curSpeed < this.config.maxStandingVelocity) {
      if (absSteer > 0.05 || jumpPressed || stakePressed) {
        this.state = MovementState.Skiing;
        // Pushes player forward with standingToSkiingPushVelocity (3.0 m/s = 10.8 km/h)
        this.velocity.addScaledVector(this.forwardDir, this.config.standingToSkiingPushVelocity);
      } else {
        this.state = MovementState.Standing;
      }
    } else if (curSpeed < 0.2 && absSteer <= 0.05 && !jumpPressed && !stakePressed) {
      this.state = MovementState.Standing;
    }

    // 3. Determine Turn Type
    if (absSteer > 0.85 && curSpeed > 14.0) {
      this.currentTurnType = TurnType.OverTurn;
      this.sharpTurnTimer = 0.0;
    } else if (slideTurn && absSteer > 0.05) {
      this.currentTurnType = TurnType.SlideTurn;
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
        driftFriction = this.config.drift_velocity_sharpturn.evaluate(normalizedSpeed) * this.config.drift_penalty_sharpturn;
        break;
      }
      case TurnType.SlideTurn: {
        turnCapRad = this.config.turn_cap_deg_slideturn * (Math.PI / 180.0);
        const vFactor = this.config.turn_velocity_slideturn.evaluate(normalizedSpeed);
        const tFactor = this.config.turn_turntime_slideturn.evaluate(Math.min(this.turnTimer, 1.0));
        turnRate = vFactor * (1.0 + tFactor);
        driftFriction = this.config.drift_velocity_slideturn.evaluate(normalizedSpeed) * this.config.drift_penalty_slideturn;
        this.currentDriftTime += dt;

        // Slide turn boost at 0.5s mark (+2.0 m/s burst)
        this.slideTurnBoostTimer += dt;
        if (this.slideTurnBoostTimer >= this.config.slideturn_boost_timepoint) {
          this.velocity.addScaledVector(this.forwardDir, this.config.slideturn_boost_velocity);
          this.slideTurnBoostTimer = 0.0;
        }

        // Drift duration milestone bonuses
        const milestones = this.config.speedboost_drift_durations;
        if (
          this.driftMilestoneIndex < milestones.length &&
          this.currentDriftTime >= milestones[this.driftMilestoneIndex]
        ) {
          const boostAdd = this.config.speedboost_drift_boosts[this.driftMilestoneIndex];
          this.velocity.multiplyScalar(1.0 + boostAdd * 0.25);
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
      default:
        this.slideTurnBoostTimer = 0.0;
        this.currentDriftTime = 0.0;
        this.driftMilestoneIndex = 0;
        break;
    }

    // 4. Update Heading with Heading Cap
    if (absSteer > 0.01) {
      const deltaAngle = -steerInput * turnRate * dt;
      this.currentHeadingAngle += deltaAngle;
    }

    // Heading Cap enforcement relative to trajectory heading
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (horizSpeed > 1.0) {
      const travelHeading = Math.atan2(-this.velocity.x, -this.velocity.z);
      const isSwitchHeading = this.velocity.dot(this.forwardDir) < -0.1;
      const baseHeading = isSwitchHeading ? travelHeading + Math.PI : travelHeading;

      let headingDiff = (this.currentHeadingAngle - baseHeading) % (Math.PI * 2);
      if (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      if (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

      // Maximum Turn Angle Crash: Steering or deflecting beyond 120 causes a crash
      const maxTurnAngleRad = this.config.max_turn_angle_deg * (Math.PI / 180.0);
      if (Math.abs(headingDiff) > maxTurnAngleRad) {
        this.triggerCrash('Turn deflection angle exceeded max limit (120°)');
        return;
      }

      if (Math.abs(headingDiff) > turnCapRad) {
        this.currentHeadingAngle = baseHeading + Math.sign(headingDiff) * turnCapRad;
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

    // Steep slope acceleration multiplier (player.speedboost.steep_slope: 2.0)
    // On slopes > 20 deg, smoothly scale fall-line gravity acceleration up to 2.0x
    const slopeAngleDeg = Math.acos(THREE.MathUtils.clamp(this.groundNormal.y, -1.0, 1.0)) * RAD2DEG;
    let slopeMultiplier = 1.0;
    if (slopeAngleDeg > 20.0) {
      const t = Math.min((slopeAngleDeg - 20.0) / 25.0, 1.0); // 20 deg -> 1.0x, 45+ deg -> 2.0x
      slopeMultiplier = 1.0 + (this.config.speedboost_steep_slope - 1.0) * t;
    }
    this.velocity.addScaledVector(this._gParallel, slopeMultiplier * dt);

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

    // Backward Riding Cap: Maximum backward speed is capped at 12 m/s with a friction of 15.0
    if (isSwitch) {
      effectiveFriction += this.config.backward_friction; // 15.0
    }

    // 1. Exponential Velocity Damping
    // Physical calibration: ground_friction.base (1.0) maps to slick groomed snow glide (0.018 s^-1).
    // Braking, switch on non-twintips, and drift add physically calibrated drag.
    const baseFrictionRate = 0.018; // Base snow glide drag
    const brakeFriction = brakePressed ? this.config.breaking_power * 0.8 : 0.0;
    const switchFriction = (isSwitch && this.sport === SportType.Skis && !this.hasTwintips) ? 0.35 : 0.0;
    const backwardFriction = isSwitch ? 0.30 : 0.0;
    const totalFriction = (effectiveFriction * baseFrictionRate) + (driftFriction * 3.0) + brakeFriction + switchFriction + backwardFriction;
    const damping = Math.exp(-totalFriction * dt);
    this.velocity.multiplyScalar(damping);

    // Hard backward speed clamp
    if (isSwitch && this.velocity.length() > this.config.backward_max_velocity) {
      this.velocity.setLength(this.config.backward_max_velocity); // 12 m/s
    }

    // 7. Align Velocity with Forward Ski/Board Direction (Edge Bite / Carving Grip)
    const alignSpeed = this.velocity.length();
    if (alignSpeed > 1e-4) {
      const velDir = this.velocity.clone().divideScalar(alignSpeed);
      const grip = (this.currentTurnType === TurnType.SlideTurn) ? 0.85 : 0.98;
      const targetDir = isSwitch ? this.forwardDir.clone().negate() : this.forwardDir.clone();
      const newVelDir = velDir.multiplyScalar(1.0 - grip).add(targetDir.multiplyScalar(grip)).normalize();
      this.velocity.copy(newVelDir).multiplyScalar(alignSpeed);
    }

    // 8. Jump Execution
    if (jumpPressed) {
      this.velocity.y += this.config.jump_strength; // 4.0 m/s
      this.state = MovementState.Airborne;
      if (this.currentTurnType === TurnType.SharpTurn) {
        this.sharpTurnSpinBoostActive = true;
      }
    }

    // 9. Propulsion: Ski poles staking (Skis) & Snowslide carve-pump (Snowboard)
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
    flipInput: number,
    rollInput: number
  ): void {
    // 1. Gravity and Hover Lift
    this.velocity.addScaledVector(this._gVec, dt);

    // Trick hover lift (+0.5 m/s^2 continuous upward force during aerial rotations)
    const isTricking = Math.abs(steerInput) > 0.05 || Math.abs(flipInput) > 0.05 || Math.abs(rollInput) > 0.05;
    if (isTricking) {
      this.velocity.y += this.config.trick_hover_zforce * dt;
    }

    // Air Drag: During airborne phases (mechanics/PlayerPhysics.cpp:259):
    // velocity_ *= (1.0 - config_.air_friction); // air_friction: 0.006
    this.velocity.multiplyScalar(1.0 - this.config.air_friction);

    // 2. Aerial Rotations (Spins, Flips, Rolls)
    if (Math.abs(steerInput) > 0.05) {
      const spinMultiplier = this.sharpTurnSpinBoostActive ? this.config.rotationboost_sharp_turn_boost : 1.0;
      this.angularVelocitySpin += steerInput * this.config.spin_acceleration * spinMultiplier * dt;
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
    const curSpeed = this.velocity.length();
    // Terrain pitch angle along forward travel direction
    const slopePitchDeg = Math.asin(THREE.MathUtils.clamp(this.forwardDir.y, -1.0, 1.0)) * RAD2DEG;

    const canStakeRegular =
      slopePitchDeg >= this.config.staking_inclination_regular_from_deg &&
      slopePitchDeg <= this.config.staking_inclination_regular_to_deg;
    const canStakeDamped =
      slopePitchDeg > this.config.staking_inclination_damped_from_deg &&
      slopePitchDeg <= this.config.staking_inclination_damped_to_deg;

    const eligible = (canStakeRegular || canStakeDamped) && (curSpeed < this.config.staking_max_vel * 15.0);

    const absSteer = Math.abs(steerInput);
    const steerSign = absSteer > 0.08 ? Math.sign(steerInput) : 0;

    // Detect left/right stick alternation (carving / slalom stride)
    const isAlternating = steerSign !== 0 && steerSign !== this.lastSteerSign;
    if (eligible && isAlternating) {
      this.lastSteerSign = steerSign;
      this.stakingPoleSide = steerSign;
      this.stakingPoleTimer = 0.5; // player.staking.pole_down: 0.5s from player.yaml
      this.snowslidePumpTimer = 0.4; // player.snowslide_push duration
    } else if (steerSign === 0) {
      this.lastSteerSign = 0;
    }

    if (this.sport === SportType.Skis) {
      const shouldThrust = (stakePressed || this.stakingPoleTimer > 0) && eligible;

      if (shouldThrust) {
        if (this.stakingPoleTimer > 0) {
          this.stakingPoleTimer -= dt;
        }
        this.isStaking = true;
        this.isStakingDamped = canStakeDamped;

        let power = this.config.staking_power;
        if (curSpeed < 1.0) {
          power += this.config.staking_initial_power; // Standstill kick
        }
        if (canStakeDamped) {
          power *= this.config.staking_damped_mul; // 0.2
        }
        this.velocity.addScaledVector(this.forwardDir, power * dt);

        // Curve gently around planted pole while pushing (GMA slalom skate stride)
        if (curSpeed < 8.0 && this.stakingPoleSide !== 0) {
          const carveCurveRate = 0.75 * this.stakingPoleSide;
          this.currentHeadingAngle += carveCurveRate * dt;
        }
      } else {
        this.isStaking = false;
        this.isStakingDamped = false;
        if (!eligible) {
          this.stakingPoleTimer = 0.0;
        }
      }
    } else {
      // Snowboard: Snowslide carve-pump on edge alternation (player.snowslide_push.push_mul: 3.0)
      this.isStaking = false;
      this.isStakingDamped = false;
      if (this.snowslidePumpTimer > 0 && eligible) {
        this.snowslidePumpTimer -= dt;
        let pumpPower = this.config.snowslide_push_mul * 4.0; // ~12 m/s^2 forward thrust
        if (curSpeed < 1.0) {
          pumpPower += 6.0; // Standstill carve kick
        }
        if (canStakeDamped) {
          pumpPower *= 0.3;
        }
        this.velocity.addScaledVector(this.forwardDir, pumpPower * dt);
      } else if (!eligible) {
        this.snowslidePumpTimer = 0.0;
      }
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
}
