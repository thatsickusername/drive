import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';

export interface VehicleInputs {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  lowRange?: boolean;
  diffLock?: boolean;
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
  spinAngle: number;
  steerAngle: number;
  normalForce: number;
  slipRatio: number;
  lateralSlip: number;
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
  private maxSteerAngle = 0.52; // ~30 degrees
  private steerSpeed = 4.2;
  private currentSteer = 0;

  // Drivetrain tuning
  private highDriveTorque = 4200;
  private lowDriveTorque = 9000;
  private brakeTorque = 12000;
  private antiRollBarStiffness = 5500;

  constructor(scene: THREE.Scene, rapier: typeof RAPIER, world: RAPIER.World) {
    this.rapier = rapier;
    this.world = world;
    this.mesh = new THREE.Group();

    // 1. Build Visual Chassis
    this.buildChassisMesh();

    // 2. Setup Rapier Chassis Body
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

    // 3. Setup Wheels & Suspension geometry
    this.setupWheels(scene);

    scene.add(this.mesh);
  }

  private buildChassisMesh(): void {
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
    this.mesh.add(mainBody);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.1), bodyMat);
    cabin.position.set(0, 0.88, -0.2);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 0.35), trimMat);
    bumper.position.set(0, 0.3, 2.05);
    bumper.castShadow = true;
    this.mesh.add(bumper);

    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16), hlMat);
    hlLeft.rotation.x = Math.PI / 2;
    hlLeft.position.set(-0.65, 0.4, 2.0);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    this.mesh.add(hlLeft);
    this.mesh.add(hlRight);

    const tlMat = new THREE.MeshBasicMaterial({ color: 0xdd1111 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tlMat);
    tlLeft.position.set(-0.65, 0.45, -1.98);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    this.mesh.add(tlLeft);
    this.mesh.add(tlRight);
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
        spinAngle: 0,
        steerAngle: 0,
        normalForce: 0,
        slipRatio: 0,
        lateralSlip: 0
      });
    }
  }

  public updateFixed(inputs: VehicleInputs, dt: number): void {
    if (inputs.lowRange !== undefined) this.lowRange = inputs.lowRange;
    if (inputs.diffLock !== undefined) this.diffLock = inputs.diffLock;

    const rot = this.body.rotation();
    const chassisQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    const chassisPosRapier = this.body.translation();
    const chassisPos = new THREE.Vector3(chassisPosRapier.x, chassisPosRapier.y, chassisPosRapier.z);

    const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(chassisQuat);
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(chassisQuat);
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);

    // Smooth steering calculation
    let targetSteer = 0;
    if (inputs.left) targetSteer += this.maxSteerAngle;
    if (inputs.right) targetSteer -= this.maxSteerAngle;

    const steerStep = this.steerSpeed * dt;
    if (this.currentSteer < targetSteer) {
      this.currentSteer = Math.min(this.currentSteer + steerStep, targetSteer);
    } else if (this.currentSteer > targetSteer) {
      this.currentSteer = Math.max(this.currentSteer - steerStep, targetSteer);
    }

    const currentDriveTorque = this.lowRange ? this.lowDriveTorque : this.highDriveTorque;
    const maxWheelSpinSpeed = this.lowRange ? 16.0 : 42.0;

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
        w.steerAngle = this.currentSteer;
      } else {
        w.steerAngle = 0;
      }

      const wheelSteerQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), w.steerAngle);
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

        // Progressive spring rate: soft near rest, firmly resisting bottom-out
        const progressiveFactor = 1.0 + (w.compression * w.compression * 1.5);
        const springForce = compression * conf.springStiffness * progressiveFactor;
        const damperForce = suspensionVel * conf.dampingRate;
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

        // 2. Wheel Contact Patch Drivetrain & Friction
        const forwardVelocity = pointVel.dot(wheelForward);
        const lateralVelocity = pointVel.dot(wheelRight);
        w.lateralSlip = lateralVelocity;

        w.spinAngle += (forwardVelocity / conf.radius) * dt;

        const tireFrictionLimit = totalSuspensionForce * 1.15;

        // A. Longitudinal Force (Drive & Braking)
        let longitudinalForce = 0;
        if (inputs.forward) {
          if (forwardVelocity < maxWheelSpinSpeed) {
            longitudinalForce += currentDriveTorque;
          }
        } else if (inputs.backward) {
          if (forwardVelocity > -maxWheelSpinSpeed * 0.5) {
            longitudinalForce -= currentDriveTorque * 0.7;
          }
        }

        if (inputs.brake) {
          const brakeForce = Math.min(Math.abs(forwardVelocity) * 3500, this.brakeTorque);
          longitudinalForce -= Math.sign(forwardVelocity) * brakeForce;
        }

        longitudinalForce = Math.max(-tireFrictionLimit, Math.min(tireFrictionLimit, longitudinalForce));
        const driveImpulse = wheelForward.clone().multiplyScalar(longitudinalForce * dt);

        // B. Lateral Grip Force
        let lateralGripRatio = inputs.brake && !conf.isFront ? 0.35 : 0.95;
        const lateralForce = -lateralVelocity * (this.body.mass() / 4) * (lateralGripRatio / dt);
        const clampedLateralForce = Math.max(-tireFrictionLimit, Math.min(tireFrictionLimit, lateralForce));
        const lateralImpulse = wheelRight.clone().multiplyScalar(clampedLateralForce * dt);

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

        if (inputs.forward) w.spinAngle += 20 * dt;
        if (inputs.backward) w.spinAngle -= 12 * dt;
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
      // 4. Anti-Roll Sway Bars
      this.applyAntiRollBar(0, 1, dt);
      this.applyAntiRollBar(2, 3, dt);

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

  private applyAntiRollBar(leftIdx: number, rightIdx: number, dt: number): void {
    const left = this.wheels[leftIdx];
    const right = this.wheels[rightIdx];

    const leftTravel = left.config.suspensionRestLength - left.suspensionLength;
    const rightTravel = right.config.suspensionRestLength - right.suspensionLength;
    const diff = leftTravel - rightTravel;

    if (Math.abs(diff) > 0.001) {
      const antiRollForce = diff * this.antiRollBarStiffness;
      const rot = this.body.rotation();
      const chassisQuat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
      const chassisPosRapier = this.body.translation();
      const chassisPos = new THREE.Vector3(chassisPosRapier.x, chassisPosRapier.y, chassisPosRapier.z);
      const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);

      if (left.isOnGround) {
        const leftMount = left.config.mountPoint.clone().applyQuaternion(chassisQuat).add(chassisPos);
        const force = upDir.clone().multiplyScalar(-antiRollForce * dt);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(force.x, force.y, force.z),
          new this.rapier.Vector3(leftMount.x, leftMount.y, leftMount.z),
          true
        );
      }

      if (right.isOnGround) {
        const rightMount = right.config.mountPoint.clone().applyQuaternion(chassisQuat).add(chassisPos);
        const force = upDir.clone().multiplyScalar(antiRollForce * dt);
        this.body.applyImpulseAtPoint(
          new this.rapier.Vector3(force.x, force.y, force.z),
          new this.rapier.Vector3(rightMount.x, rightMount.y, rightMount.z),
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
    for (const w of this.wheels) {
      w.renderSuspensionLength = w.config.suspensionRestLength;
      w.suspensionLength = w.config.suspensionRestLength;
    }
  }

  public syncRender(): void {
    // 1. Sync Chassis body
    const t = this.body.translation();
    const r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);

    const chassisQuat = this.mesh.quaternion;
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(chassisQuat);

    // 2. Sync Wheels independent position and orientation with smooth sub-frame interpolation
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
    }
  }
}
