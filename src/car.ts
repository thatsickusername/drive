import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d';

export interface VehicleInputs {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}

export class Car {
  public mesh: THREE.Group;
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;

  private accelerationForce = 50000;
  private reverseForce = 25000;
  private turnTorque = 45000;
  private maxVelocity = 45;
  private lateralFriction = 0.95;

  constructor(scene: THREE.Scene, rapier: typeof RAPIER, world: RAPIER.World) {
    this.mesh = new THREE.Group();

    // Car Body visual
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xef233c,
      metalness: 0.6,
      roughness: 0.3
    });
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 4.2), bodyMat);
    mainBody.position.y = 0.5;
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    this.mesh.add(mainBody);

    // Cabin
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.8,
      roughness: 0.2
    });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.2), cabinMat);
    cabin.position.set(0, 1.0, -0.2);
    cabin.castShadow = true;
    this.mesh.add(cabin);

    // Headlights
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const hlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), lightMat);
    hlLeft.position.set(-0.65, 0.5, 2.11);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    this.mesh.add(hlLeft);
    this.mesh.add(hlRight);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.1), tailMat);
    tlLeft.position.set(-0.65, 0.5, -2.11);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    this.mesh.add(tlLeft);
    this.mesh.add(tlRight);

    // Wheels visuals
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
    wheelGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      [-1.0, 0.3, 1.3],
      [1.0, 0.3, 1.3],
      [-1.0, 0.3, -1.3],
      [1.0, 0.3, -1.3]
    ];

    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      this.mesh.add(wheel);
    }

    scene.add(this.mesh);

    // Rapier Physics Setup
    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(0, 2.0, 0)
      .setCanSleep(false)
      .setLinearDamping(0.4)
      .setAngularDamping(2.5);

    this.body = world.createRigidBody(bodyDesc);

    // Low-friction collider so the car glides smoothly across terrain
    const colliderDesc = rapier.ColliderDesc.cuboid(1.0, 0.45, 2.1)
      .setDensity(250.0)
      .setFriction(0.05)
      .setRestitution(0.05);

    this.collider = world.createCollider(colliderDesc, this.body);

    // Set center of mass slightly lower to prevent flipping
    this.body.setAdditionalMass(200, true);
  }

  public updateFixed(inputs: VehicleInputs, dt: number): void {
    const rot = this.body.rotation();
    const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    const forwardDir = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(q);

    const linVelRapier = this.body.linvel();
    const velocity = new THREE.Vector3(linVelRapier.x, linVelRapier.y, linVelRapier.z);
    const speed = velocity.dot(forwardDir);

    const currentUp = upDir.dot(new THREE.Vector3(0, 1, 0));
    if (currentUp > 0.25) {
      // Forward / Backward driving forces
      if (inputs.forward) {
        if (speed < this.maxVelocity) {
          const force = forwardDir.clone().multiplyScalar(this.accelerationForce);
          this.body.applyImpulse(new RAPIER.Vector3(force.x * dt, force.y * dt, force.z * dt), true);
        }
      } else if (inputs.backward) {
        if (speed > -this.maxVelocity * 0.4) {
          const force = forwardDir.clone().multiplyScalar(-this.reverseForce);
          this.body.applyImpulse(new RAPIER.Vector3(force.x * dt, force.y * dt, force.z * dt), true);
        }
      }

      // Steering torque
      let steer = 0;
      if (inputs.left) steer += 1;
      if (inputs.right) steer -= 1;

      if (steer !== 0) {
        // Allow turning in place as well as when moving
        const steerDir = speed < -0.5 ? -1 : 1;
        const torqueMagnitude = steer * this.turnTorque * steerDir;
        const torque = new THREE.Vector3(0, torqueMagnitude * dt, 0);
        this.body.applyTorqueImpulse(new RAPIER.Vector3(torque.x, torque.y, torque.z), true);
      }

      // Lateral drift & grip simulation
      const lateralVel = velocity.dot(rightDir);
      let frictionCoeff = this.lateralFriction;
      if (inputs.brake) {
        frictionCoeff = 0.35; // Handbrake drift mode
      }

      const lateralCancelImpulse = rightDir
        .clone()
        .multiplyScalar(-lateralVel * this.body.mass() * frictionCoeff * 0.2);
      this.body.applyImpulse(
        new RAPIER.Vector3(
          lateralCancelImpulse.x,
          lateralCancelImpulse.y * 0.1,
          lateralCancelImpulse.z
        ),
        true
      );

      // Braking force
      if (inputs.brake && Math.abs(speed) > 0.1) {
        const brakeImpulse = forwardDir
          .clone()
          .multiplyScalar(-Math.sign(speed) * 35000 * dt);
        this.body.applyImpulse(
          new RAPIER.Vector3(brakeImpulse.x, brakeImpulse.y, brakeImpulse.z),
          true
        );
      }

      // Natural drag when no forward/backward input
      if (!inputs.forward && !inputs.backward && Math.abs(speed) > 0.05) {
        const naturalDrag = forwardDir
          .clone()
          .multiplyScalar(-Math.sign(speed) * 8000 * dt);
        this.body.applyImpulse(
          new RAPIER.Vector3(naturalDrag.x, naturalDrag.y, naturalDrag.z),
          true
        );
      }

      // Upright stabilization
      const uprightCorrection = new THREE.Vector3(0, 1, 0).cross(upDir).multiplyScalar(-2500);
      this.body.applyTorqueImpulse(
        new RAPIER.Vector3(
          uprightCorrection.x * dt,
          uprightCorrection.y * dt,
          uprightCorrection.z * dt
        ),
        true
      );
    }
  }

  public reset(x = 0, y = 2.0, z = 0): void {
    this.body.setTranslation(new RAPIER.Vector3(x, y, z), true);
    this.body.setRotation(new RAPIER.Quaternion(0, 0, 0, 1), true);
    this.body.setLinvel(new RAPIER.Vector3(0, 0, 0), true);
    this.body.setAngvel(new RAPIER.Vector3(0, 0, 0), true);
  }

  public syncRender(): void {
    const t = this.body.translation();
    const r = this.body.rotation();
    this.mesh.position.set(t.x, t.y, t.z);
    this.mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
}
