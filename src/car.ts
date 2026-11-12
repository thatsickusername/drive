import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';

export interface VehicleInputs {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  handbrake?: boolean;
  lowRange?: boolean;
  diffLock?: boolean;
  airDown?: boolean;
  winchAttachToggle?: boolean;
  winchReel?: boolean;
}

export interface WheelConfig {
  mountPoint: THREE.Vector3; // Position relative to chassis origin
  radius: number;
  width: number;
  suspensionRestLength: number;
  suspensionMaxTravel: number;
  springStiffness: number;
  dampingRate: number;
  isFront: boolean;
  isLeft: boolean;
}

export interface WheelState {
  config: WheelConfig;
  meshGroup: THREE.Group;
  wheelMesh: THREE.Mesh;
  suspensionLength: number;
  renderSuspensionLength: number; // Smoothed visual suspension length
  compression: number; // 0 to 1
  isOnGround: boolean;
  contactPoint: THREE.Vector3;
  contactNormal: THREE.Vector3;
  angularVelocity: number; // rad/s
  spinAngle: number;
  steerAngle: number;
  normalForce: number;
  slipRatio: number;
  lateralSlip: number;
  slipAngle: number;
  driveTorque: number;
}

export interface SurfaceProperties {
  type: 'ASPHALT' | 'ROCK' | 'MUD' | 'OBSTACLE';
  friction: number;
  depthDrag: number; // N of drag resistance
}

export interface DrivetrainTelemetry {
  rpm: number;
  gearName: string;
  gearIndex: number;
  engineTorque: number;
  wheelTorque: number;
  transferCaseMode: '4H' | '4L';
  speedKmh: number;
  avgSlipRatio: number;
  isHandbrake: boolean;
  isFootBraking: boolean;
  surfaceName: string;
  diffLocked: boolean;
  tirePressurePsi: number;
  winchStatus: 'DETACHED' | 'ATTACHED' | 'WINCHING';
  winchDistance: number;
}

export class Engine {
  public rpm: number = 850;
  public idleRpm: number = 850;
  public redlineRpm: number = 5400;
  public maxRpm: number = 5800;
  public peakTorque: number = 420; // Nm @ 2800 RPM
  public peakTorqueRpm: number = 2800;

  public getTorque(throttle: number): number {
    if (this.rpm >= this.maxRpm) return 0;
    const clampedRpm = Math.max(this.idleRpm, Math.min(this.rpm, this.redlineRpm));
    const normRpm = (clampedRpm - this.idleRpm) / (this.redlineRpm - this.idleRpm);
    // Smooth torque curve peaking around 2800 RPM (norm ~ 0.43)
    const curve = Math.max(0.35, 1.0 - 1.8 * Math.pow(normRpm - 0.43, 2));
    return this.peakTorque * curve * throttle;
  }

  public getEngineBrakeTorque(): number {
    // Engine compression drag on closed throttle
    return 35 + (this.rpm / 1000) * 30;
  }
}

export class AutomaticTransmission {
  // 4 Forward ratios + Reverse
  public gearRatios: number[] = [3.60, 2.10, 1.35, 1.00];
  public reverseRatio: number = -3.40;
  public finalDriveRatio: number = 4.10;
  public highTransferRatio: number = 1.0;
  public lowTransferRatio: number = 2.72; // Crawler reduction

  public currentGear: number = 1; // 1..4, or -1 for reverse
  private shiftCooldown: number = 0;

  public update(rpm: number, throttle: number, lowRange: boolean, dt: number, isBraking = false): void {
    this.shiftCooldown = Math.max(0, this.shiftCooldown - dt);

    if (this.currentGear === -1 || this.shiftCooldown > 0) return;

    // Shift points tuned for off-road: low range holds gear longer for crawl stability
    const upshiftRpm = lowRange ? 4800 : (3200 + throttle * 1500);
    const downshiftRpm = isBraking ? 2500 : (lowRange ? 1900 : 1700);

    if (rpm > upshiftRpm && this.currentGear < this.gearRatios.length) {
      this.currentGear++;
      this.shiftCooldown = 0.50;
    } else if (rpm < downshiftRpm && this.currentGear > 1) {
      this.currentGear--;
      this.shiftCooldown = isBraking ? 0.20 : 0.40;
    }
  }

  public getRatio(lowRange: boolean): number {
    const tcase = lowRange ? this.lowTransferRatio : this.highTransferRatio;
    if (this.currentGear === -1) {
      return this.reverseRatio * this.finalDriveRatio * tcase;
    }
    const idx = Math.max(1, Math.min(this.currentGear, this.gearRatios.length)) - 1;
    return this.gearRatios[idx] * this.finalDriveRatio * tcase;
  }

  public getGearName(): string {
    if (this.currentGear === -1) return 'R';
    return `D${this.currentGear}`;
  }
}

export class Car {
  public mesh: THREE.Group;
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;
  private rapier: typeof RAPIER;
  private world: RAPIER.World;

  public wheels: WheelState[] = [];

  // Drivetrain & Vehicle parameters
  public lowRange: boolean = false;
  public diffLock: boolean = true;
  public tirePressurePsi: number = 32; // 32 PSI Trail vs 14 PSI Crawl
  private currentSteer = 0;

  // Dynamic Cabin Bushing Compliance
  public cabinMesh: THREE.Group = new THREE.Group();
  private cabinPitch = 0;
  private cabinRoll = 0;
  private lastLinvel = new THREE.Vector3();

  // Recovery Winch System
  public winchAnchor: THREE.Vector3 | null = null;
  public winchCableLine: THREE.Line;
  public isWinching: boolean = false;
  private prevWinchToggle: boolean = false;

  // Drivetrain & Engine Subsystems
  public engine: Engine = new Engine();
  public transmission: AutomaticTransmission = new AutomaticTransmission();
  public wheelInertia: number = 1.8; // kg*m^2
  public brakeTorque: number = 3800; // Nm per wheel
  public peakFriction: number = 1.05; // Base dry dirt/rock friction coefficient
  public isHandbrakeActive: boolean = false;
  public isFootBrakingActive: boolean = false;
  public lastSurfaceType: string = 'ASPHALT';

  public getSurfaceAtPoint(x: number, z: number): SurfaceProperties {
    // Mud Bog zone: X between -65 and -35, Z between -52 and 12
    if (x >= -65 && x <= -35 && z >= -52 && z <= 12) {
      this.lastSurfaceType = 'MUD';
      return { type: 'MUD', friction: 0.38, depthDrag: 1600 };
    }
    // Rock Crawl zone: X between 36 and 62, Z between 18 and 72
    if (x >= 36 && x <= 62 && z >= 18 && z <= 72) {
      this.lastSurfaceType = 'ROCK';
      return { type: 'ROCK', friction: 1.25, depthDrag: 60 };
    }
    // Obstacle Lane / Articulation mounds: X between -8 and 8, Z between 10 and 130
    if (Math.abs(x) <= 8.0 && z >= 10 && z <= 130) {
      this.lastSurfaceType = 'OBSTACLE';
      return { type: 'OBSTACLE', friction: 1.15, depthDrag: 80 };
    }
    this.lastSurfaceType = 'ASPHALT';
    return { type: 'ASPHALT', friction: 1.05, depthDrag: 25 };
  }

  constructor(scene: THREE.Scene, rapier: typeof RAPIER, world: RAPIER.World) {
    this.rapier = rapier;
    this.world = world;
    this.mesh = new THREE.Group();

    // 1. Build Visual Chassis with rubber-bushing mounted cabin
    this.buildChassisMesh();

    // 2. Setup Recovery Winch Cable Line
    const cableMat = new THREE.LineBasicMaterial({ color: 0xf39c12, linewidth: 2 });
    const cableGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.winchCableLine = new THREE.Line(cableGeo, cableMat);
    this.winchCableLine.visible = false;
    scene.add(this.winchCableLine);

    // 3. Setup Rapier Chassis Body
    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(0, 1.8, 0)
      .setCanSleep(false)
      .setLinearDamping(0.2)
      .setAngularDamping(2.8);

    this.body = world.createRigidBody(bodyDesc);

    // Chassis collider centered low with wider base for stability
    const colliderDesc = rapier.ColliderDesc.cuboid(0.88, 0.35, 1.95)
      .setTranslation(0, 0.32, 0)
      .setDensity(320.0)
      .setFriction(0.2)
      .setRestitution(0.01);

    this.collider = world.createCollider(colliderDesc, this.body);

    // Center of Mass lowered significantly to prevent rolls on hard turns
    this.body.setAdditionalMassProperties(
      350,
      new rapier.Vector3(0, -0.35, 0),
      new rapier.Vector3(1200, 1600, 700),
      new rapier.Quaternion(0, 0, 0, 1),
      true
    );

    // 4. Setup Wheels & Suspension geometry
    this.setupWheels(scene);

    scene.add(this.mesh);
  }

  private buildChassisMesh(): void {
    this.mesh.add(this.cabinMesh);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1b4332,
      roughness: 0.5,
      metalness: 0.3
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.8,
      metalness: 0.1
    });

    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 3.9), bodyMat);
    mainBody.position.y = 0.35;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    this.cabinMesh.add(mainBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.1), bodyMat);
    cabin.position.set(0, 0.88, -0.2);
    cabin.castShadow = true;
    this.cabinMesh.add(cabin);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.35), trimMat);
    bumper.position.set(0, 0.3, 2.05);
    bumper.castShadow = true;
    this.cabinMesh.add(bumper);

    // Front Bumper Winch Housing & Drum
    const winchDrumGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.42, 14);
    winchDrumGeo.rotateZ(Math.PI / 2);
    const winchDrumMat = new THREE.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.7, roughness: 0.3 });
    const winchDrum = new THREE.Mesh(winchDrumGeo, winchDrumMat);
    winchDrum.position.set(0, 0.42, 2.15);
    this.cabinMesh.add(winchDrum);

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), hlMat);
    hlLeft.rotation.x = Math.PI / 2;
    hlLeft.position.set(-0.65, 0.4, 2.0);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    this.cabinMesh.add(hlLeft);
    this.cabinMesh.add(hlRight);

    const tlMat = new THREE.MeshBasicMaterial({ color: 0xdd1111 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tlMat);
    tlLeft.position.set(-0.65, 0.45, -1.98);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    this.cabinMesh.add(tlLeft);
    this.cabinMesh.add(tlRight);
  }

  private setupWheels(scene: THREE.Scene): void {
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.9,
      metalness: 0.05
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.4,
      metalness: 0.7
    });

    const wheelRadius = 0.48;
    const wheelWidth = 0.36;

    const wheelConfigs: WheelConfig[] = [
      {
        mountPoint: new THREE.Vector3(-1.05, 0.28, 1.35),
        radius: wheelRadius,
        width: wheelWidth,
        suspensionRestLength: 0.55,
        suspensionMaxTravel: 0.4,
        springStiffness: 30000,
        dampingRate: 3500,
        isFront: true,
        isLeft: true
      },
      {
        mountPoint: new THREE.Vector3(1.05, 0.28, 1.35),
        radius: wheelRadius,
        width: wheelWidth,
        suspensionRestLength: 0.55,
        suspensionMaxTravel: 0.4,
        springStiffness: 30000,
        dampingRate: 3500,
        isFront: true,
        isLeft: false
      },
      {
        mountPoint: new THREE.Vector3(-1.05, 0.28, -1.35),
        radius: wheelRadius,
        width: wheelWidth,
        suspensionRestLength: 0.55,
        suspensionMaxTravel: 0.4,
        springStiffness: 29000,
        dampingRate: 3300,
        isFront: false,
        isLeft: true
      },
      {
        mountPoint: new THREE.Vector3(1.05, 0.28, -1.35),
        radius: wheelRadius,
        width: wheelWidth,
        suspensionRestLength: 0.55,
        suspensionMaxTravel: 0.4,
        springStiffness: 29000,
        dampingRate: 3300,
        isFront: false,
        isLeft: false
      }
    ];

    for (const conf of wheelConfigs) {
      const meshGroup = new THREE.Group();

      const tireGeo = new THREE.CylinderGeometry(conf.radius, conf.radius, conf.width, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const wheelMesh = new THREE.Mesh(tireGeo, tireMat);
      wheelMesh.castShadow = true;
      wheelMesh.receiveShadow = true;

      const rimGeo = new THREE.CylinderGeometry(conf.radius * 0.55, conf.radius * 0.55, conf.width * 1.02, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      wheelMesh.add(rimMesh);

      const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, conf.width * 1.08, 8);
      hubGeo.rotateZ(Math.PI / 2);
      const hubMesh = new THREE.Mesh(hubGeo, rimMat);
      wheelMesh.add(hubMesh);

      meshGroup.add(wheelMesh);
      scene.add(meshGroup);

      this.wheels.push({
        config: conf,
        meshGroup,
        wheelMesh,
        suspensionLength: conf.suspensionRestLength,
        renderSuspensionLength: conf.suspensionRestLength,
        compression: 0,
        isOnGround: false,
        contactPoint: new THREE.Vector3(),
        contactNormal: new THREE.Vector3(0, 1, 0),
        angularVelocity: 0,
        spinAngle: 0,
        steerAngle: 0,
        normalForce: 0,
        slipRatio: 0,
        lateralSlip: 0,
        slipAngle: 0,
        driveTorque: 0
      });
    }
  }

  public updateFixed(inputs: VehicleInputs, dt: number): void {
    if (inputs.lowRange !== undefined) this.lowRange = inputs.lowRange;
    if (inputs.diffLock !== undefined) this.diffLock = inputs.diffLock;
    if (inputs.airDown !== undefined) this.tirePressurePsi = inputs.airDown ? 14 : 32;

    const rot = this.body.rotation();
    const chassisQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    const chassisPosRapier = this.body.translation();
    const chassisPos = new THREE.Vector3(chassisPosRapier.x, chassisPosRapier.y, chassisPosRapier.z);

    const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQuat);
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(chassisQuat);
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);

    // Bumper point for recovery winch
    const bumperPos = chassisPos.clone().add(forwardDir.clone().multiplyScalar(2.05)).add(upDir.clone().multiplyScalar(0.38));

    if (inputs.winchAttachToggle && !this.prevWinchToggle) {
      if (this.winchAnchor) {
        this.winchAnchor = null;
        this.isWinching = false;
      } else {
        // Cast winch cable ray forward to attach to rocks/obstacles/terrain
        const winchRay = new this.rapier.Ray(
          new this.rapier.Vector3(bumperPos.x, bumperPos.y, bumperPos.z),
          new this.rapier.Vector3(forwardDir.x, forwardDir.y, forwardDir.z)
        );
        const hit = this.world.castRay(winchRay, 25.0, true, undefined, undefined, this.collider);
        if (hit && hit.timeOfImpact < 25.0) {
          const pt = winchRay.pointAt(hit.timeOfImpact);
          this.winchAnchor = new THREE.Vector3(pt.x, pt.y, pt.z);
        } else {
          // Cast ground anchor point 18m ahead
          const groundRay = new this.rapier.Ray(
            new this.rapier.Vector3(bumperPos.x + forwardDir.x * 18.0, bumperPos.y + 4.0, bumperPos.z + forwardDir.z * 18.0),
            new this.rapier.Vector3(0, -1, 0)
          );
          const gHit = this.world.castRay(groundRay, 8.0, true, undefined, undefined, this.collider);
          if (gHit) {
            const pt = groundRay.pointAt(gHit.timeOfImpact);
            this.winchAnchor = new THREE.Vector3(pt.x, pt.y, pt.z);
          }
        }
      }
    }
    this.prevWinchToggle = !!inputs.winchAttachToggle;

    if (this.winchAnchor && inputs.winchReel) {
      this.isWinching = true;
      const cableVec = this.winchAnchor.clone().sub(bumperPos);
      const dist = cableVec.length();
      if (dist > 1.2) {
        const pullDir = cableVec.normalize();
        const winchForce = 24000; // 24 kN heavy duty recovery pull
        const impulse = pullDir.multiplyScalar(winchForce * dt);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(impulse.x, impulse.y, impulse.z),
          new this.rapier.Vector3(bumperPos.x, bumperPos.y, bumperPos.z),
          true
        );
      }
    } else {
      this.isWinching = false;
    }

    const linvel = this.body.linvel();
    const forwardSpeed = new THREE.Vector3(linvel.x, linvel.y, linvel.z).dot(forwardDir);
    const linearSpeed = Math.hypot(linvel.x, linvel.z);

    // Phase 4: Dynamic Speed-Sensitive Steering Lock & Caster Self-Centering
    // Crawler low-speed (<10km/h): full ~32° angle for tight obstacle maneuvering
    // Higher trail speed (>50km/h): clamped to ~13° to prevent snap rollovers
    const steerSpeedRatio = Math.min(1.0, linearSpeed / 18.0);
    const dynamicMaxSteer = THREE.MathUtils.lerp(0.56, 0.22, steerSpeedRatio);
    const dynamicSteerSpeed = THREE.MathUtils.lerp(5.2, 3.2, steerSpeedRatio);

    let targetSteer = 0;
    if (inputs.left) targetSteer += dynamicMaxSteer;
    if (inputs.right) targetSteer -= dynamicMaxSteer;

    // Pneumatic caster trail return: wheels naturally pull straight when steering is released
    const casterReturnBoost = (!inputs.left && !inputs.right)
      ? (1.0 + Math.min(2.5, Math.abs(forwardSpeed) * 0.18))
      : 1.0;
    const steerStep = dynamicSteerSpeed * casterReturnBoost * dt;

    if (this.currentSteer < targetSteer) {
      this.currentSteer = Math.min(this.currentSteer + steerStep, targetSteer);
    } else if (this.currentSteer > targetSteer) {
      this.currentSteer = Math.max(this.currentSteer - steerStep, targetSteer);
    }

    // Geometric Ackermann steering angle calculation for front axle
    const { leftAngle: ackermannLeft, rightAngle: ackermannRight } = this.computeAckermannAngles(this.currentSteer);

    const isHandbrake = !!(inputs.handbrake || inputs.brake);

    // Direction & Pedals:
    // Determine whether W/S acts as throttle or service foot brake based on forward velocity
    let driverThrottle = 0;
    let serviceBrakeIntensity = 0;

    const stoppedThreshold = 0.35; // m/s (~1.2 km/h) transition threshold

    if (inputs.forward && inputs.backward) {
      // Both pedals pressed: Brake override
      serviceBrakeIntensity = 1.0;
      driverThrottle = 0;
    } else if (inputs.forward) {
      if (forwardSpeed < -stoppedThreshold) {
        // Moving backward, user presses W -> Brake to stop
        serviceBrakeIntensity = 1.0;
        driverThrottle = 0;
      } else {
        // Stopped or moving forward -> Accelerate forward in Drive
        if (this.transmission.currentGear === -1) {
          this.transmission.currentGear = 1;
        }
        driverThrottle = 1.0;
        serviceBrakeIntensity = 0;
      }
    } else if (inputs.backward) {
      if (forwardSpeed > stoppedThreshold) {
        // Moving forward, user presses S -> Brake to stop
        serviceBrakeIntensity = 1.0;
        driverThrottle = 0;
      } else {
        // Stopped or moving backward -> Accelerate backward in Reverse
        this.transmission.currentGear = -1;
        driverThrottle = 1.0;
        serviceBrakeIntensity = 0;
      }
    } else {
      // Neither pedal pressed: Engine drag / Coasting
      driverThrottle = 0;
      serviceBrakeIntensity = 0;
      // When vehicle comes to complete standstill in reverse with no input, reset to D1
      if (Math.abs(forwardSpeed) < stoppedThreshold && this.transmission.currentGear === -1) {
        this.transmission.currentGear = 1;
      }
    }

    // Active brake state flags for telemetry HUD
    this.isHandbrakeActive = isHandbrake;
    this.isFootBrakingActive = serviceBrakeIntensity > 0;

    // Automatic transmission shift logic update (upshifting/downshifting within 1..4)
    this.transmission.update(
      this.engine.rpm,
      driverThrottle,
      this.lowRange,
      dt,
      this.isFootBrakingActive
    );

    const totalRatio = this.transmission.getRatio(this.lowRange);

    // Compute input shaft RPM via fluid torque converter
    let avgGroundedOmega = 0;
    let groundedCountForOmega = 0;
    for (const w of this.wheels) {
      if (w.isOnGround) {
        avgGroundedOmega += Math.abs(w.angularVelocity);
        groundedCountForOmega++;
      }
    }
    const refWheelOmega = groundedCountForOmega > 0 ? (avgGroundedOmega / groundedCountForOmega) : (linearSpeed / 0.48);
    const transInputOmega = refWheelOmega * Math.abs(totalRatio);
    const transInputRpm = transInputOmega * (60 / (2 * Math.PI));

    // Torque converter stall RPM & fluid coupling
    const stallRpm = 2400;
    let targetRpm: number;
    if (driverThrottle > 0) {
      targetRpm = Math.max(
        this.engine.idleRpm,
        this.engine.idleRpm + driverThrottle * (stallRpm - this.engine.idleRpm),
        transInputRpm * 0.98
      );
    } else {
      targetRpm = Math.max(this.engine.idleRpm, transInputRpm * 0.92);
    }

    const revSpeed = driverThrottle > 0 ? 16.0 : 10.0;
    this.engine.rpm += (targetRpm - this.engine.rpm) * Math.min(1.0, dt * revSpeed);
    this.engine.rpm = Math.max(this.engine.idleRpm, Math.min(this.engine.rpm, this.engine.maxRpm));

    // Fluid torque converter multiplication (stall ratio up to 2.1x)
    const speedRatio = transInputRpm / Math.max(100, this.engine.rpm);
    const torqueMultiplier = Math.max(1.0, 2.1 - 1.1 * Math.min(1.0, speedRatio / 0.85));

    // Driveline shaft torque calculation
    let drivelineTorque = 0;
    const engineBrakeTorque = this.engine.getEngineBrakeTorque();

    if (driverThrottle > 0) {
      const engTorque = this.engine.getTorque(driverThrottle) * torqueMultiplier;
      const gearSign = this.transmission.currentGear === -1 ? -1 : 1;
      drivelineTorque = engTorque * Math.abs(totalRatio) * 0.92 * gearSign;
    }

    // Standstill damping to prevent rolling creep when stopping or stopped
    if (serviceBrakeIntensity > 0 && Math.abs(forwardSpeed) < 0.25) {
      const lv = this.body.linvel();
      this.body.setLinvel(new this.rapier.Vector3(lv.x * 0.65, lv.y, lv.z * 0.65), true);
    } else if (!inputs.forward && !inputs.backward && Math.abs(forwardSpeed) < 0.15) {
      const lv = this.body.linvel();
      this.body.setLinvel(new this.rapier.Vector3(lv.x * 0.85, lv.y, lv.z * 0.85), true);
    }

    let wheelsGroundedCount = 0;

    // Multi-probe offsets across tire contact patch to simulate physical tire envelope & edge climbing
    // Probes: Center, Front edge, Rear edge, Outer edge
    const probeOffsets = [
      { fwd: 0, lat: 0, weight: 0.4 },
      { fwd: 0.28, lat: 0, weight: 0.25 },
      { fwd: -0.28, lat: 0, weight: 0.2 },
      { fwd: 0, lat: 0.12, weight: 0.15 }
    ];

    for (let i = 0; i < this.wheels.length; i++) {
      const w = this.wheels[i];
      const conf = w.config;

      if (conf.isFront) {
        w.steerAngle = conf.isLeft ? ackermannLeft : ackermannRight;
      } else {
        w.steerAngle = 0;
      }

      const wheelSteerQuat = new THREE.Quaternion().setFromAxisAngle(upDir, w.steerAngle);
      const wheelForward = forwardDir.clone().applyQuaternion(wheelSteerQuat).normalize();
      const wheelRight = rightDir.clone().applyQuaternion(wheelSteerQuat).normalize();

      const mountWorld = conf.mountPoint.clone().applyQuaternion(chassisQuat).add(chassisPos);
      const rayCastDir = upDir.clone().multiplyScalar(-1);
      const maxRayDist = conf.suspensionRestLength + conf.radius;

      // Sample multi-probe rays across the tire curvature
      let minHitDist = Infinity;
      let primaryHitPoint: THREE.Vector3 | null = null;
      let blendedNormal = new THREE.Vector3();
      let hitCount = 0;

      for (const probe of probeOffsets) {
        const probeOrigin = mountWorld
          .clone()
          .add(wheelForward.clone().multiplyScalar(probe.fwd))
          .add(wheelRight.clone().multiplyScalar(conf.isLeft ? -probe.lat : probe.lat));

        const ray = new this.rapier.Ray(
          new this.rapier.Vector3(probeOrigin.x, probeOrigin.y, probeOrigin.z),
          new this.rapier.Vector3(rayCastDir.x, rayCastDir.y, rayCastDir.z)
        );

        const hit = this.world.castRayAndGetNormal(
          ray,
          maxRayDist,
          true,
          undefined,
          undefined,
          this.collider
        );

        if (hit && hit.timeOfImpact < maxRayDist) {
          hitCount++;
          // Account for tire circular profile on front/rear probes
          const profileSagitta = conf.radius - Math.sqrt(Math.max(0, conf.radius * conf.radius - probe.fwd * probe.fwd));
          const effectiveDist = hit.timeOfImpact - profileSagitta;

          if (effectiveDist < minHitDist) {
            minHitDist = effectiveDist;
            const pt = ray.pointAt(hit.timeOfImpact);
            primaryHitPoint = new THREE.Vector3(pt.x, pt.y, pt.z);
          }
          blendedNormal.add(new THREE.Vector3(hit.normal.x, hit.normal.y, hit.normal.z).multiplyScalar(probe.weight));
        }
      }

      if (hitCount > 0 && minHitDist < maxRayDist && primaryHitPoint) {
        w.isOnGround = true;
        wheelsGroundedCount++;

        const targetSuspensionLength = Math.max(0, minHitDist - conf.radius);
        // Physical suspension displacement with natural compliance
        w.suspensionLength = targetSuspensionLength;
        w.contactPoint.copy(primaryHitPoint);
        w.contactNormal.copy(blendedNormal.normalize());

        const compression = Math.max(0, conf.suspensionRestLength - w.suspensionLength);
        w.compression = compression / conf.suspensionMaxTravel;

        // Relative velocity at suspension mount
        const linvel = this.body.linvel();
        const angvel = this.body.angvel();
        const rPos = mountWorld.clone().sub(chassisPos);
        const rotVel = new THREE.Vector3(angvel.x, angvel.y, angvel.z).cross(rPos);
        const pointVel = new THREE.Vector3(linvel.x, linvel.y, linvel.z).add(rotVel);

        const suspensionVel = pointVel.dot(rayCastDir);

        // Phase 3: Progressive rising-rate spring + Asymmetric off-road damping
        const normComp = Math.min(1.0, compression / conf.suspensionMaxTravel);
        // Soft compliance near rest, rising sharply near bottom-out
        const progressiveMultiplier = 1.0 + normComp * normComp * 2.2;
        const springForce = compression * conf.springStiffness * progressiveMultiplier;

        // Asymmetric damping: softer compression (bump) absorbs hits without harshness, stiffer rebound prevents pogo oscillation
        const isCompressing = suspensionVel > 0;
        const effectiveDampingRate = isCompressing ? conf.dampingRate * 0.72 : conf.dampingRate * 1.55;
        const damperForce = suspensionVel * effectiveDampingRate;

        const totalSuspensionForce = Math.max(0, springForce + damperForce);
        w.normalForce = totalSuspensionForce;

        // Apply suspension upward impulse at wheel mount
        const impulseVector = upDir.clone().multiplyScalar(totalSuspensionForce * dt);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(impulseVector.x, impulseVector.y, impulseVector.z),
          new this.rapier.Vector3(mountWorld.x, mountWorld.y, mountWorld.z),
          true
        );

        // Edge climbing impulse: if the surface has an incline against forward motion, assist tire rolling over ledge
        const slopeDot = w.contactNormal.dot(wheelForward);
        if (slopeDot < -0.1 && inputs.forward) {
          const ledgeClimbAssist = upDir.clone().multiplyScalar(-slopeDot * totalSuspensionForce * 0.35 * dt);
          this.body.applyImpulseAtPoint(
            new this.rapier.Vector3(ledgeClimbAssist.x, ledgeClimbAssist.y, ledgeClimbAssist.z),
            new this.rapier.Vector3(mountWorld.x, mountWorld.y, mountWorld.z),
            true
          );
        }

        // 2. Wheel Contact Patch Drivetrain & Combined Friction Ellipse
        const forwardVelocity = pointVel.dot(wheelForward);
        const lateralVelocity = pointVel.dot(wheelRight);
        const wheelRadius = conf.radius;
        const wheelTangentialSpeed = w.angularVelocity * wheelRadius;

        // A. Slip calculations
        // Longitudinal slip ratio s: (v_wheel - v_ground) / max(|v_ground|, |v_wheel|, v_min)
        const slipRefSpeed = Math.max(Math.abs(forwardVelocity), Math.abs(wheelTangentialSpeed), 0.35);
        const slipRatio = (wheelTangentialSpeed - forwardVelocity) / slipRefSpeed;
        w.slipRatio = slipRatio;

        // Lateral slip angle alpha: -atan(v_lat / (|v_long| + v_min))
        const slipAngle = -Math.atan2(lateralVelocity, Math.abs(forwardVelocity) + 0.35);
        w.slipAngle = slipAngle;
        w.lateralSlip = lateralVelocity;

        // B. Pacejka-derived combined slip friction ellipse
        const sPeak = 0.16;
        const alphaPeak = 0.20; // ~11.5 deg

        const normS = slipRatio / sPeak;
        const normAlpha = slipAngle / alphaPeak;
        const totalSlipMag = Math.sqrt(normS * normS + normAlpha * normAlpha);

        // Realistic traction response curve: smooth progressive grip rising to peak, and retaining 78% sliding grip on skid
        let tractionResponse = 1.0;
        if (totalSlipMag <= 1.0) {
          tractionResponse = totalSlipMag * (2.0 - totalSlipMag);
        } else {
          const slideFloor = 0.78;
          tractionResponse = slideFloor + (1.0 - slideFloor) / (1.0 + 0.45 * (totalSlipMag - 1.0));
        }

        // Phase 5: Surface-dependent friction coefficient & depth resistance
        const surface = this.getSurfaceAtPoint(primaryHitPoint.x, primaryHitPoint.z);
        // Airing down (14 PSI) broadens tire contact patch, providing +24% grip on terrain
        const psiGripMultiplier = this.tirePressurePsi < 20 ? 1.24 : 1.0;
        const maxFrictionForce = totalSuspensionForce * surface.friction * psiGripMultiplier;

        // Depth resistance drag (e.g. mud displacement drag)
        if (surface.depthDrag > 0 && Math.abs(forwardVelocity) > 0.05) {
          const mudDragForce = -Math.sign(forwardVelocity) * Math.min(surface.depthDrag, totalSuspensionForce * 0.35);
          const mudDragImpulse = wheelForward.clone().multiplyScalar(mudDragForce * dt);
          this.body.applyImpulseAtPoint(
            new this.rapier.Vector3(mudDragImpulse.x, mudDragImpulse.y, mudDragImpulse.z),
            new this.rapier.Vector3(primaryHitPoint.x, primaryHitPoint.y, primaryHitPoint.z),
            true
          );
        }

        // Drive torque distribution: 4WD with selectable differential lock
        const axleTotalTorque = conf.isFront
          ? (isHandbrake ? drivelineTorque : drivelineTorque * 0.5)
          : (isHandbrake ? 0 : drivelineTorque * 0.5);

        let wheelDriveTorque = 0;
        const partnerIdx = i % 2 === 0 ? i + 1 : i - 1;
        const partner = this.wheels[partnerIdx];

        if (this.diffLock) {
          // Locked Spool Differential: Rigid 50/50 torque split + cross-wheel angular coupling
          wheelDriveTorque = axleTotalTorque * 0.5;
          if (partner) {
            const speedDiff = w.angularVelocity - partner.angularVelocity;
            w.angularVelocity -= speedDiff * 0.25 * Math.min(1.0, dt * 10.0);
          }
        } else {
          // Open Differential: Torque is limited by the wheel with least normal force / traction
          const thisLoad = w.isOnGround ? Math.max(80, w.normalForce) : 40;
          const partnerLoad = (partner && partner.isOnGround) ? Math.max(80, partner.normalForce) : 40;
          const openDiffTractionRatio = Math.min(1.0, Math.min(thisLoad, partnerLoad) / Math.max(thisLoad, partnerLoad));
          wheelDriveTorque = (axleTotalTorque * 0.5) * Math.max(0.18, openDiffTractionRatio);
        }

        // Dynamic handbrake drift: rear wheels have reduced lateral holding floor when handbrake is pulled
        let handbrakeLateralScale = 1.0;
        if (isHandbrake && !conf.isFront) {
          handbrakeLateralScale = 0.32;
        }

        // Combined friction ellipse partitioning
        const safeSlipMag = Math.max(0.0001, totalSlipMag);
        const fxLongitudinal = maxFrictionForce * tractionResponse * (normS / safeSlipMag);
        const fyLateral = maxFrictionForce * tractionResponse * (normAlpha / safeSlipMag) * handbrakeLateralScale;

        // C. Wheel Rotational Dynamics & Inertia Integration
        // 1. Service foot brake (front-biased: 60% front, 40% rear)
        const serviceBrakePerWheel = serviceBrakeIntensity * (conf.isFront ? 3400 : 2200);
        // 2. Handbrake (emergency brake): ONLY on rear wheels! Clamps 8500 Nm to lock solid
        const handbrakePerWheel = (isHandbrake && !conf.isFront) ? 8500 : 0;
        const totalMechanicalBrake = serviceBrakePerWheel + handbrakePerWheel;

        let engDragTorque = 0;
        if (driverThrottle === 0 && Math.abs(forwardVelocity) > 0.05) {
          engDragTorque = (engineBrakeTorque * Math.abs(totalRatio) * 0.9) / 4;
        }

        const totalResistingTorque = totalMechanicalBrake + engDragTorque;
        const groundTorque = fxLongitudinal * wheelRadius;

        // Net driving torque including ground reaction
        const drivingNetTorque = wheelDriveTorque - groundTorque;

        if (totalResistingTorque > 0) {
          // Torque required to bring wheel angular velocity to zero this timestep
          const torqueToHalt = (w.angularVelocity * this.wheelInertia) / dt + drivingNetTorque;

          if (Math.abs(torqueToHalt) <= totalResistingTorque) {
            // Available brake capacity completely arrests wheel rotation
            w.angularVelocity = 0;
          } else {
            // Apply maximum resisting brake torque opposing current wheel rotation
            const brakeDir = Math.abs(w.angularVelocity) > 0.01 ? Math.sign(w.angularVelocity) : Math.sign(drivingNetTorque);
            const netTorque = drivingNetTorque - brakeDir * totalResistingTorque;
            const angAccel = netTorque / this.wheelInertia;
            w.angularVelocity += angAccel * dt;
          }
        } else {
          // No active braking
          const angAccel = drivingNetTorque / this.wheelInertia;
          w.angularVelocity += angAccel * dt;
        }

        // Clamp runaway wheelspin in high-reduction crawl
        const maxWheelOmega = this.lowRange ? 42.0 : 110.0;
        w.angularVelocity = Math.max(-maxWheelOmega, Math.min(maxWheelOmega, w.angularVelocity));

        // Advance wheel visual spin angle
        w.spinAngle += w.angularVelocity * dt;
        w.driveTorque = wheelDriveTorque;

        // D. Apply Ground Reaction & Cornering Impulses to Chassis
        const driveImpulse = wheelForward.clone().multiplyScalar(fxLongitudinal * dt);
        const lateralImpulse = wheelRight.clone().multiplyScalar(fyLateral * dt);

        const contactRapier = new this.rapier.Vector3(w.contactPoint.x, w.contactPoint.y, w.contactPoint.z);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(driveImpulse.x, driveImpulse.y, driveImpulse.z),
          contactRapier,
          true
        );

        const mountRapier = new this.rapier.Vector3(mountWorld.x, mountWorld.y, mountWorld.z);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(lateralImpulse.x, lateralImpulse.y, lateralImpulse.z),
          mountRapier,
          true
        );
      } else {
        w.isOnGround = false;
        w.suspensionLength = conf.suspensionRestLength;
        w.compression = 0;
        w.normalForce = 0;
        w.lateralSlip = 0;
        w.slipRatio = 0;
        w.slipAngle = 0;

        // Airborne wheel dynamics: spins with driveline torque or slows down via air/bearing resistance
        let wheelDriveTorque = isHandbrake ? (conf.isFront ? drivelineTorque / 2 : 0) : drivelineTorque / 4;
        const serviceBrakePerWheel = serviceBrakeIntensity * (conf.isFront ? 3400 : 2200);
        const handbrakePerWheel = (isHandbrake && !conf.isFront) ? 8500 : 0;
        const totalMechanicalBrake = serviceBrakePerWheel + handbrakePerWheel;

        let airBearingDrag = 3.5 * w.angularVelocity;
        let netAirTorque = wheelDriveTorque - airBearingDrag;

        if (totalMechanicalBrake > 0) {
          const torqueToHalt = (w.angularVelocity * this.wheelInertia) / dt + netAirTorque;
          if (Math.abs(torqueToHalt) <= totalMechanicalBrake) {
            w.angularVelocity = 0;
          } else {
            const brakeDir = Math.abs(w.angularVelocity) > 0.01 ? Math.sign(w.angularVelocity) : Math.sign(netAirTorque);
            netAirTorque -= brakeDir * totalMechanicalBrake;
            const angAccel = netAirTorque / this.wheelInertia;
            w.angularVelocity += angAccel * dt;
          }
        } else {
          const angAccel = netAirTorque / this.wheelInertia;
          w.angularVelocity += angAccel * dt;
        }

        const maxAirOmega = this.lowRange ? 45.0 : 120.0;
        w.angularVelocity = Math.max(-maxAirOmega, Math.min(maxAirOmega, w.angularVelocity));

        w.spinAngle += w.angularVelocity * dt;
        w.driveTorque = wheelDriveTorque;
      }
    }

    // 3. Mid-Air Stabilization
    if (wheelsGroundedCount === 0) {
      const currentUp = upDir.dot(new THREE.Vector3(0, 1, 0));
      if (currentUp > 0.1) {
        const uprightCorrection = new THREE.Vector3(0, 1, 0).cross(upDir).multiplyScalar(-1800 * dt);
        this.body.applyTorqueImpulse(
          new this.rapier.Vector3(uprightCorrection.x, uprightCorrection.y, uprightCorrection.z),
          true
        );
      }
      const extraAirGravity = new this.rapier.Vector3(0, -9.81 * this.body.mass() * dt * 0.4, 0);
      this.body.applyImpulse(extraAirGravity, true);
    } else {
      // 4. Live Solid Axle Articulation (Front & Rear beam axle cross-coupling)
      this.applyLiveAxleArticulation(0, 1, dt);
      this.applyLiveAxleArticulation(2, 3, dt);

      // 5. Undercarriage Skid-Plate & Belly Clearance
      this.updateBellySkidPlate(dt, chassisQuat, chassisPos, forwardDir, upDir);

      const currentUp = upDir.dot(new THREE.Vector3(0, 1, 0));
      if (currentUp < 0.75 && currentUp > 0.1) {
        const rollStabilize = new THREE.Vector3(0, 1, 0).cross(upDir).multiplyScalar(-2400 * dt);
        this.body.applyTorqueImpulse(
          new this.rapier.Vector3(rollStabilize.x, rollStabilize.y, rollStabilize.z),
          true
        );
      }
    }
  }

  private computeAckermannAngles(steerInput: number): { leftAngle: number; rightAngle: number } {
    if (Math.abs(steerInput) < 0.001) {
      return { leftAngle: 0, rightAngle: 0 };
    }

    const wheelbase = 2.70;
    const trackWidth = 2.10;
    const sign = Math.sign(steerInput);
    const absSteer = Math.abs(steerInput);

    const radius = wheelbase / Math.tan(absSteer);
    const insideAngle = Math.atan(wheelbase / (radius - trackWidth * 0.5));
    const outsideAngle = Math.atan(wheelbase / (radius + trackWidth * 0.5));

    if (sign > 0) {
      // Steering left: Left wheel is inside, Right wheel is outside
      return { leftAngle: insideAngle, rightAngle: outsideAngle };
    } else {
      // Steering right: Right wheel is inside, Left wheel is outside
      return { leftAngle: -outsideAngle, rightAngle: -insideAngle };
    }
  }

  private applyLiveAxleArticulation(leftIdx: number, rightIdx: number, dt: number): void {
    const left = this.wheels[leftIdx];
    const right = this.wheels[rightIdx];

    const leftComp = Math.max(0, left.config.suspensionRestLength - left.suspensionLength);
    const rightComp = Math.max(0, right.config.suspensionRestLength - right.suspensionLength);
    const compDelta = leftComp - rightComp;

    // Solid live beam axle: upward displacement of one wheel pivots the axle, forcing the opposing wheel downward
    if (Math.abs(compDelta) > 0.005) {
      const rot = this.body.rotation();
      const chassisQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
      const chassisPosRapier = this.body.translation();
      const chassisPos = new THREE.Vector3(chassisPosRapier.x, chassisPosRapier.y, chassisPosRapier.z);
      const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);

      const axleTransferStiffness = 4200;
      const transferForce = compDelta * axleTransferStiffness;

      const leftMount = left.config.mountPoint.clone().applyQuaternion(chassisQuat).add(chassisPos);
      const rightMount = right.config.mountPoint.clone().applyQuaternion(chassisQuat).add(chassisPos);

      // Compressed side receives upward balancing impulse, extended side is driven downward into the terrain
      const leftImpulse = upDir.clone().multiplyScalar(transferForce * 0.38 * dt);
      this.body.applyImpulseAtPoint(
        new this.rapier.Vector3(leftImpulse.x, leftImpulse.y, leftImpulse.z),
        new this.rapier.Vector3(leftMount.x, leftMount.y, leftMount.z),
        true
      );

      const rightImpulse = upDir.clone().multiplyScalar(-transferForce * 0.38 * dt);
      this.body.applyImpulseAtPoint(
        new this.rapier.Vector3(rightImpulse.x, rightImpulse.y, rightImpulse.z),
        new this.rapier.Vector3(rightMount.x, rightMount.y, rightMount.z),
        true
      );
    }
  }

  private updateBellySkidPlate(
    dt: number,
    chassisQuat: THREE.Quaternion,
    chassisPos: THREE.Vector3,
    forwardDir: THREE.Vector3,
    upDir: THREE.Vector3
  ): void {
    const skidProbes = [
      new THREE.Vector3(0, 0.12, 0.45),  // Transfer case / front belly skid
      new THREE.Vector3(0, 0.12, -0.65)  // Rear differential pumpkin skid
    ];

    const rayDown = upDir.clone().multiplyScalar(-1);
    const maxBellyDist = 0.38;

    for (const offset of skidProbes) {
      const probeWorld = offset.clone().applyQuaternion(chassisQuat).add(chassisPos);
      const ray = new this.rapier.Ray(
        new this.rapier.Vector3(probeWorld.x, probeWorld.y, probeWorld.z),
        new this.rapier.Vector3(rayDown.x, rayDown.y, rayDown.z)
      );

      const hit = this.world.castRayAndGetNormal(
        ray,
        maxBellyDist,
        true,
        undefined,
        undefined,
        this.collider
      );

      if (hit && hit.timeOfImpact < maxBellyDist) {
        const penetration = maxBellyDist - hit.timeOfImpact;
        const linvel = this.body.linvel();
        const velVec = new THREE.Vector3(linvel.x, linvel.y, linvel.z);

        // Upward support force preventing clipping through boulders/ridges
        const normalForce = penetration * 42000;
        const upImpulse = upDir.clone().multiplyScalar(normalForce * dt);

        // Skid plate sliding drag friction (mu ~ 0.32)
        const forwardVel = velVec.dot(forwardDir);
        const dragForce = -Math.sign(forwardVel) * Math.min(Math.abs(forwardVel) * 1500, normalForce * 0.32);
        const dragImpulse = forwardDir.clone().multiplyScalar(dragForce * dt);

        const totalImpulse = upImpulse.add(dragImpulse);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(totalImpulse.x, totalImpulse.y, totalImpulse.z),
          new this.rapier.Vector3(probeWorld.x, probeWorld.y, probeWorld.z),
          true
        );
      }
    }
  }

  public reset(x = 0, y = 2.0, z = 0): void {
    this.body.setTranslation(new RAPIER.Vector3(x, y, z), true);
    this.body.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
    this.body.setLinvel(new RAPIER.Vector3(0, 0, 0), true);
    this.body.setAngvel(new RAPIER.Vector3(0, 0, 0), true);
    this.currentSteer = 0;
    this.engine.rpm = this.engine.idleRpm;
    this.transmission.currentGear = 1;
    this.isHandbrakeActive = false;
    this.isFootBrakingActive = false;
    this.winchAnchor = null;
    this.isWinching = false;
    this.winchCableLine.visible = false;
    this.cabinPitch = 0;
    this.cabinRoll = 0;
    this.cabinMesh.rotation.set(0, 0, 0);
    this.lastLinvel.set(0, 0, 0);
    for (const w of this.wheels) {
      w.renderSuspensionLength = w.config.suspensionRestLength;
      w.suspensionLength = w.config.suspensionRestLength;
      w.angularVelocity = 0;
      w.spinAngle = 0;
      w.slipRatio = 0;
      w.lateralSlip = 0;
      w.slipAngle = 0;
      w.driveTorque = 0;
      w.wheelMesh.scale.set(1, 1, 1);
    }
  }

  public getDrivetrainTelemetry(): DrivetrainTelemetry {
    const linvel = this.body.linvel();
    const speedKmh = Math.hypot(linvel.x, linvel.z) * 3.6;
    let sumSlip = 0;
    for (const w of this.wheels) {
      sumSlip += Math.abs(w.slipRatio);
    }
    const distToWinch = this.winchAnchor
      ? Number(this.mesh.position.distanceTo(this.winchAnchor).toFixed(1))
      : 0;

    return {
      rpm: Math.round(this.engine.rpm),
      gearName: this.transmission.getGearName(),
      gearIndex: this.transmission.currentGear,
      engineTorque: Math.round(this.engine.getTorque(1.0)),
      wheelTorque: Math.round(this.wheels[0]?.driveTorque ?? 0),
      transferCaseMode: this.lowRange ? '4L' : '4H',
      speedKmh: Number(speedKmh.toFixed(1)),
      avgSlipRatio: Number((sumSlip / 4).toFixed(2)),
      isHandbrake: this.isHandbrakeActive,
      isFootBraking: this.isFootBrakingActive,
      surfaceName: this.lastSurfaceType,
      diffLocked: this.diffLock,
      tirePressurePsi: this.tirePressurePsi,
      winchStatus: this.isWinching ? 'WINCHING' : (this.winchAnchor ? 'ATTACHED' : 'DETACHED'),
      winchDistance: distToWinch
    };
  }

  public syncRender(): void {
    // 1. Sync Chassis body
    const t = this.body.translation();
    const r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);

    const chassisQuat = this.mesh.quaternion;
    const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQuat);
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(chassisQuat);
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);

    // 2. Dynamic Sprung Cabin Mount Pitch & Roll Compliance
    const linvel = this.body.linvel();
    const currVel = new THREE.Vector3(linvel.x, linvel.y, linvel.z);
    const accelVec = currVel.clone().sub(this.lastLinvel).divideScalar(1 / 60);
    this.lastLinvel.copy(currVel);

    const targetPitch = Math.max(-0.055, Math.min(0.055, -accelVec.dot(forwardDir) * 0.0035));
    const targetRoll = Math.max(-0.065, Math.min(0.065, accelVec.dot(rightDir) * 0.0045));
    this.cabinPitch += (targetPitch - this.cabinPitch) * 0.22;
    this.cabinRoll += (targetRoll - this.cabinRoll) * 0.22;
    this.cabinMesh.rotation.set(this.cabinPitch, 0, this.cabinRoll);

    // 3. Sync Wheels independent position, orientation, and dynamic tire deformation squish
    for (let i = 0; i < this.wheels.length; i++) {
      const w = this.wheels[i];
      const conf = w.config;

      // Smooth visual suspension travel to avoid visual popping over sharp step edges
      const smoothFactor = 0.35;
      w.renderSuspensionLength += (w.suspensionLength - w.renderSuspensionLength) * smoothFactor;

      const mountWorld = conf.mountPoint.clone().applyQuaternion(chassisQuat).add(this.mesh.position);
      const wheelWorldPos = mountWorld.clone().sub(upDir.clone().multiplyScalar(w.renderSuspensionLength));

      w.meshGroup.position.copy(wheelWorldPos);

      const steerQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), w.steerAngle);
      const combinedQuat = chassisQuat.clone().multiply(steerQuat);
      w.meshGroup.quaternion.copy(combinedQuat);

      w.wheelMesh.rotation.x = w.spinAngle;

      // Dynamic visual tire squish against rocks/ground
      const squish = Math.min(0.22, (w.normalForce / 12000) * (this.tirePressurePsi < 20 ? 1.45 : 0.85));
      w.wheelMesh.scale.set(1.0 + squish * 0.35, 1.0 - squish * 0.42, 1.0 + squish * 0.35);
    }

    // 4. Update Recovery Winch Cable Visual Line
    if (this.winchAnchor) {
      this.winchCableLine.visible = true;
      const bumperWorld = this.mesh.position.clone()
        .add(forwardDir.clone().multiplyScalar(2.05))
        .add(upDir.clone().multiplyScalar(0.38));
      this.winchCableLine.geometry.setFromPoints([bumperWorld, this.winchAnchor]);
    } else {
      this.winchCableLine.visible = false;
    }
  }
}
