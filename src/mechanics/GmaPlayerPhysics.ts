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
    groundNormal: THREE.Vector3
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
        groundHeight
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
    _stakePressed: boolean,
    tacklePressed: boolean,
    flipInput: number,
    rollInput: number,
    groundHeight: number
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
        _stakePressed,
        tacklePressed,
        groundHeight
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
    _stakePressed: boolean,
    tacklePressed: boolean,
    groundHeight: number
  ): void {
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

    // 2. Determine Turn Type
    const absSteer = Math.abs(steerInput);
    const curSpeed = this.velocity.length();

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
        if (!this.slideTurnBoostTriggered && this.slideTurnBoostTimer >= this.config.slideturn_boost_timepoint) {
          this.velocity.addScaledVector(this.forwardDir, this.config.slideturn_boost_velocity);
          this.slideTurnBoostTriggered = true;
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
        this.slideTurnBoostTriggered = false;
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
    if (isSwitch && this.sport === SportType.Skis && !this.hasTwintips) {
      effectiveFriction = this.config.ground_friction_switch_no_twintips; // 10.0
    }

    // Calibrated snow glide drag and aerodynamic resistance
    const baseFrictionCoeff = 0.016;
    const totalLinearDrag = (effectiveFriction * baseFrictionCoeff) + (driftFriction * 3.0);
    const speed = this.velocity.length();
    const aeroCoeff = 0.0028; // Quadratic air resistance
    const aeroDamping = Math.max(0.0, 1.0 - (aeroCoeff * speed * dt));
    const damping = Math.exp(-totalLinearDrag * dt) * aeroDamping;
    this.velocity.multiplyScalar(damping);

    // Active snowplow brake
    if (brakePressed) {
      const brakeDecel = this.config.breaking_power * 4.0; // ~10 m/s^2 deceleration
      const speedDrop = brakeDecel * dt;
      if (speed > speedDrop) {
        this.velocity.multiplyScalar((speed - speedDrop) / speed);
      } else {
        this.velocity.set(0, 0, 0);
      }
    }

    // 7. Align Velocity with Forward Ski/Board Direction (Edge Bite / Carving Grip)
    if (speed > 1e-4) {
      const velDir = this.velocity.clone().divideScalar(speed);
      const grip = (this.currentTurnType === TurnType.SlideTurn) ? 0.85 : 0.98;
      const targetDir = isSwitch ? this.forwardDir.clone().negate() : this.forwardDir.clone();
      const newVelDir = velDir.multiplyScalar(1.0 - grip).add(targetDir.multiplyScalar(grip)).normalize();
      this.velocity.copy(newVelDir).multiplyScalar(speed);
    }

    // 8. Jump Execution
    if (jumpPressed) {
      this.velocity.y += this.config.jump_strength; // 4.0 m/s
      this.state = MovementState.Airborne;
      if (this.currentTurnType === TurnType.SharpTurn) {
        this.sharpTurnSpinBoostActive = true;
      }
    }

    // 9. Staking (Ski poles push - Skiing only, driven by left/right steering on flats)
    if (this.sport === SportType.Skis) {
      this.handleStaking(dt, steerInput);
    }

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

    // Calibrated aerodynamic drag in air (preserves jump momentum)
    const airSpeed = this.velocity.length();
    const aeroDamping = Math.max(0.0, 1.0 - (0.0022 * airSpeed * dt));
    this.velocity.multiplyScalar(aeroDamping);

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

  private handleStaking(dt: number, steerInput: number): void {
    const curSpeed = this.velocity.length();
    // Terrain slope angle in degrees along forward travel direction
    const slopeAngleDeg = Math.asin(THREE.MathUtils.clamp(this.forwardDir.y, -1.0, 1.0)) * RAD2DEG;

    const canStakeRegular =
      slopeAngleDeg >= this.config.staking_inclination_regular_from_deg &&
      slopeAngleDeg <= this.config.staking_inclination_regular_to_deg;
    const canStakeDamped =
      slopeAngleDeg > this.config.staking_inclination_damped_from_deg &&
      slopeAngleDeg <= this.config.staking_inclination_damped_to_deg;

    const eligible = (canStakeRegular || canStakeDamped) && curSpeed < (this.config.staking_max_vel * 15.0);

    const absSteer = Math.abs(steerInput);
    const steerSign = absSteer > 0.08 ? Math.sign(steerInput) : 0;

    // Detect left/right stick alternation or fresh steer nudge to plant the pole
    if (eligible && steerSign !== 0 && steerSign !== this.lastSteerSign) {
      this.lastSteerSign = steerSign;
      this.stakingPoleSide = steerSign;
      this.stakingPoleTimer = 0.5; // player.staking.pole_down: 0.5s from player.yaml
    } else if (steerSign === 0) {
      this.lastSteerSign = 0;
    }

    if (this.stakingPoleTimer > 0 && eligible) {
      this.stakingPoleTimer -= dt;
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
    } else {
      this.isStaking = false;
      this.isStakingDamped = false;
      if (!eligible) {
        this.stakingPoleTimer = 0.0;
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
