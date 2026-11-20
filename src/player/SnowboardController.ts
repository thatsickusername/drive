import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TrickEngine } from './TrickEngine';

export interface SnowboardInputState {
  steer: number;         // -1 (left) to +1 (right)
  tuck: boolean;          // W / Up: speed stance
  brake: boolean;         // S / Down: snowplow / slide brake
  jump: boolean;          // Space: pop ollie
  pitch: number;          // Air pitch: -1 (backflip) to +1 (frontflip)
  yaw: number;            // Air yaw: -1 (spin left) to +1 (spin right)
  grab: boolean;          // Shift / J: grab board
}

export class SnowboardController {
  public mesh: THREE.Group;
  public body: RAPIER.RigidBody;
  public collider: RAPIER.Collider;
  public trickEngine: TrickEngine;

  // Visual sub-meshes for procedural animation
  private boardMesh: THREE.Group;
  private riderMesh: THREE.Group;
  private riderTorso!: THREE.Mesh;
  private riderLegLeft!: THREE.Mesh;
  private riderLegRight!: THREE.Mesh;

  // Kinematic state
  public isGrounded: boolean = false;
  public groundNormal = new THREE.Vector3(0, 1, 0);
  public groundDistance: number = 0;
  public speedKmh: number = 0;
  public heading: number = 0; // In radians (0 = -Z forward)
  public leanAngle: number = 0; // Lateral lean in turns
  public pitchAngle: number = 0; // Pitch in air
  public rollAngle: number = 0;

  // Physics tuning constants (Sword of the Sea feel)
  private readonly hoverHeight = 0.42;
  private readonly maxForwardSpeed = 38.0;   // ~136 km/h terminal velocity
  private readonly turnSpeed = 3.6;          // Heading rotation speed (rad/s)
  private readonly lateralGrip = 7.5;        // How fast lateral drift converges to forward line
  private readonly jumpForce = 11.5;         // Ollie vertical impulse (m/s)
  private readonly airRotationSpeed = 4.2;   // Rad/s in air for flips and spins

  // Internal vectors to prevent GC
  private scratchRay = new RAPIER.Ray(
    new RAPIER.Vector3(0, 0, 0),
    new RAPIER.Vector3(0, -1, 0)
  );
  private scratchForward = new THREE.Vector3();
  private scratchRight = new THREE.Vector3();
  private scratchUp = new THREE.Vector3(0, 1, 0);
  private prevGrounded: boolean = false;

  constructor(
    private scene: THREE.Scene,
    private rapier: typeof RAPIER,
    private world: RAPIER.World,
    spawnX: number = 0,
    spawnY: number = 10,
    spawnZ: number = 0
  ) {
    this.trickEngine = new TrickEngine();

    // 1. Build Visual Model
    this.mesh = new THREE.Group();
    this.boardMesh = this.createBoardMesh();
    this.riderMesh = this.createRiderMesh();
    this.mesh.add(this.boardMesh);
    this.mesh.add(this.riderMesh);
    this.scene.add(this.mesh);

    // 2. Build Rapier Physics Body (Dynamic with locked rotations for stability)
    const bodyDesc = this.rapier.RigidBodyDesc.dynamic()
      .setTranslation(spawnX, spawnY, spawnZ)
      .setCanSleep(false)
      .setLinearDamping(0.25)
      .setAngularDamping(2.0)
      .lockRotations();

    this.body = this.world.createRigidBody(bodyDesc);

    // Capsule collider centered at rider's center of mass
    const colliderDesc = this.rapier.ColliderDesc.capsule(0.25, 0.38)
      .setFriction(0.02)
      .setRestitution(0.05)
      .setDensity(1.2);

    this.collider = this.world.createCollider(colliderDesc, this.body);
  }

  private createBoardMesh(): THREE.Group {
    const group = new THREE.Group();

    // Stylized Hoversword / Snowboard deck
    // Length: 1.6m, Width: 0.32m, Thickness: 0.04m
    const deckShape = new THREE.Shape();
    const l = 0.8; // half length
    const w = 0.16; // half width
    deckShape.moveTo(-w * 0.8, -l);
    deckShape.quadraticCurveTo(-w * 1.1, 0, -w * 0.8, l * 0.85);
    deckShape.quadraticCurveTo(0, l * 1.05, w * 0.8, l * 0.85);
    deckShape.quadraticCurveTo(w * 1.1, 0, w * 0.8, -l);
    deckShape.quadraticCurveTo(0, -l * 1.05, -w * 0.8, -l);

    const extrudeSettings = {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015
    };

    const deckGeom = new THREE.ExtrudeGeometry(deckShape, extrudeSettings);
    deckGeom.rotateX(Math.PI * 0.5); // Lay flat on XZ plane

    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x182028,
      roughness: 0.25,
      metalness: 0.65
    });

    const deck = new THREE.Mesh(deckGeom, deckMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Glowing Neon Cyan Edge Trim (Sword of the Sea aesthetic)
    const edgeGeom = new THREE.BoxGeometry(0.33, 0.02, 1.62);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff
    });
    const edgeTrim = new THREE.Mesh(edgeGeom, edgeMat);
    edgeTrim.position.y = -0.01;
    group.add(edgeTrim);

    // Two Foot Bindings
    const bindingMat = new THREE.MeshStandardMaterial({
      color: 0x334455,
      roughness: 0.5
    });

    const frontBinding = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.12), bindingMat);
    frontBinding.position.set(0, 0.035, -0.32);
    frontBinding.rotation.y = -0.25; // Duck stance angle
    group.add(frontBinding);

    const backBinding = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.12), bindingMat);
    backBinding.position.set(0, 0.035, 0.32);
    backBinding.rotation.y = 0.15;
    group.add(backBinding);

    return group;
  }

  private createRiderMesh(): THREE.Group {
    const group = new THREE.Group();

    // Stylized low-poly winter freerider
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0xff3355, // High-visibility bright alpine red/crimson jacket
      roughness: 0.4
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x222a35, // Charcoal snowboard pants
      roughness: 0.6
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5, // Matte white helmet
      roughness: 0.2,
      metalness: 0.2
    });

    const goggleMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, // Gold mirror visor
      roughness: 0.1,
      metalness: 0.9
    });

    // Torso (slight forward athletic crouch)
    const torsoGeom = new THREE.BoxGeometry(0.35, 0.45, 0.25);
    this.riderTorso = new THREE.Mesh(torsoGeom, suitMat);
    this.riderTorso.position.set(0, 0.85, 0);
    this.riderTorso.castShadow = true;
    group.add(this.riderTorso);

    // Head + Helmet
    const headGeom = new THREE.SphereGeometry(0.13, 8, 8);
    const head = new THREE.Mesh(headGeom, helmetMat);
    head.position.set(0, 1.18, -0.04);
    head.castShadow = true;
    group.add(head);

    // Goggles
    const goggleGeom = new THREE.BoxGeometry(0.16, 0.06, 0.08);
    const goggles = new THREE.Mesh(goggleGeom, goggleMat);
    goggles.position.set(0, 1.18, -0.14);
    group.add(goggles);

    // Legs (athletic bent knees)
    const legGeom = new THREE.BoxGeometry(0.12, 0.4, 0.14);
    this.riderLegLeft = new THREE.Mesh(legGeom, pantsMat);
    this.riderLegLeft.position.set(-0.02, 0.42, -0.28);
    this.riderLegLeft.rotation.x = -0.2;
    group.add(this.riderLegLeft);

    this.riderLegRight = new THREE.Mesh(legGeom, pantsMat);
    this.riderLegRight.position.set(0.02, 0.42, 0.28);
    this.riderLegRight.rotation.x = 0.2;
    group.add(this.riderLegRight);

    // Arms extended for balance
    const armGeom = new THREE.BoxGeometry(0.09, 0.38, 0.1);
    const leftArm = new THREE.Mesh(armGeom, suitMat);
    leftArm.position.set(-0.25, 0.82, -0.1);
    leftArm.rotation.z = 0.45;
    leftArm.rotation.x = -0.3;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, suitMat);
    rightArm.position.set(0.25, 0.82, 0.1);
    rightArm.rotation.z = -0.45;
    rightArm.rotation.x = 0.3;
    group.add(rightArm);

    return group;
  }

  public update(dt: number, inputs: SnowboardInputState): void {
    const t = this.body.translation();
    const linvel = this.body.linvel();
    let vx = linvel.x;
    let vy = linvel.y;
    let vz = linvel.z;

    this.speedKmh = Math.hypot(vx, vz) * 3.6;

    // 1. Raycast downward to probe snow surface
    this.scratchRay.origin.x = t.x;
    this.scratchRay.origin.y = t.y + 0.1;
    this.scratchRay.origin.z = t.z;
    this.scratchRay.dir.x = 0;
    this.scratchRay.dir.y = -1;
    this.scratchRay.dir.z = 0;

    const maxRayDist = 1.8;
    const hit = this.world.castRayAndGetNormal(
      this.scratchRay,
      maxRayDist,
      true,
      undefined,
      undefined,
      this.collider
    );

    if (hit && hit.timeOfImpact <= this.hoverHeight + 0.25) {
      this.isGrounded = true;
      this.groundDistance = hit.timeOfImpact;
      this.groundNormal.set(hit.normal.x, hit.normal.y, hit.normal.z).normalize();
    } else {
      this.isGrounded = false;
      this.groundDistance = hit ? hit.timeOfImpact : 999.0;
      this.groundNormal.set(0, 1, 0);
    }

    // 2. Air vs Grounded Transitions & Trick Engine
    if (!this.prevGrounded && this.isGrounded) {
      // Just landed!
      const isUpright = this.scratchUp.dot(this.groundNormal) > 0.65;
      const trickResult = this.trickEngine.land(isUpright);
      if (trickResult && isUpright) {
        // Stomped landing boost (Sword of the Sea reward)
        const boostMultiplier = 1.0 + Math.min(0.35, trickResult.multiplier * 0.08);
        vx *= boostMultiplier;
        vz *= boostMultiplier;
      }
      this.pitchAngle = 0;
    } else if (this.prevGrounded && !this.isGrounded) {
      // Just launched into air!
      this.trickEngine.startAir();
    }
    this.prevGrounded = this.isGrounded;

    // 3. Grounded Carving Dynamics
    if (this.isGrounded) {
      // Heading steering (Carving)
      this.heading -= inputs.steer * this.turnSpeed * dt;

      // Calculate forward direction along XZ plane
      this.scratchForward.set(-Math.sin(this.heading), 0, -Math.cos(this.heading)).normalize();
      this.scratchRight.set(this.scratchForward.z, 0, -this.scratchForward.x).normalize();

      // Project downhill gravity along snow surface normal:
      // g_tangent = g_vec - (g_vec . n) * n
      const gn = this.groundNormal;
      const gravityY = -18.0; // Snappy downward pull
      const gDotN = gravityY * gn.y;
      const slopeForceX = -(gDotN * gn.x);
      const slopeForceY = gravityY - (gDotN * gn.y);
      const slopeForceZ = -(gDotN * gn.z);

      vx += slopeForceX * dt;
      vy += slopeForceY * dt;
      vz += slopeForceZ * dt;

      // Tuck (W) reduces drag & adds carving pump
      if (inputs.tuck) {
        vx += this.scratchForward.x * 6.0 * dt;
        vz += this.scratchForward.z * 6.0 * dt;
      }

      // Brake / Power slide (S)
      if (inputs.brake) {
        const brakeDecel = Math.max(0, 1.0 - 4.5 * dt);
        vx *= brakeDecel;
        vz *= brakeDecel;
      }

      // Lateral Grip: Blends horizontal velocity into forward line (no loose drifting unless sliding)
      const currentHorizSpeed = Math.hypot(vx, vz);
      if (currentHorizSpeed > 0.1) {
        const forwardSpeed = vx * this.scratchForward.x + vz * this.scratchForward.z;
        const grip = inputs.brake ? 1.5 : this.lateralGrip;
        const blend = Math.min(1.0, grip * dt);

        vx = THREE.MathUtils.lerp(vx, this.scratchForward.x * forwardSpeed, blend);
        vz = THREE.MathUtils.lerp(vz, this.scratchForward.z * forwardSpeed, blend);
      }

      // Speed Clamping
      const clampedHoriz = Math.min(this.maxForwardSpeed, Math.hypot(vx, vz));
      const horizAngle = Math.atan2(vx, vz);
      vx = Math.sin(horizAngle) * clampedHoriz;
      vz = Math.cos(horizAngle) * clampedHoriz;

      // Surface hover spring (smooth riding over micro bumps)
      const targetY = (t.y + 0.1) - hit!.timeOfImpact + this.hoverHeight;
      const springVelY = (targetY - t.y) * 18.0;
      vy = THREE.MathUtils.lerp(vy, springVelY, 0.45);

      // Ollie / Jump
      if (inputs.jump) {
        vy = this.jumpForce + Math.max(0, this.groundNormal.y * 2.0);
        vx += this.scratchForward.x * 3.0;
        vz += this.scratchForward.z * 3.0;
        this.isGrounded = false;
      }

      // Target lean angle based on steering input & speed
      const targetLean = -inputs.steer * Math.min(0.65, currentHorizSpeed / 18.0);
      this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, targetLean, 0.18);

    } else {
      // 4. Airborne Dynamics & Tricks
      // Standard gravity
      vy -= 22.0 * dt;

      // Airborne trick rotations
      const deltaYawDeg = inputs.yaw * this.airRotationSpeed * (180 / Math.PI) * dt;
      const deltaPitchDeg = inputs.pitch * this.airRotationSpeed * (180 / Math.PI) * dt;

      this.heading -= inputs.yaw * this.airRotationSpeed * dt;
      this.pitchAngle += inputs.pitch * this.airRotationSpeed * dt;

      this.trickEngine.updateAir(dt, deltaYawDeg, deltaPitchDeg, inputs.grab);

      // Landing assist (Sword of the Sea auto-leveling near ground)
      if (this.groundDistance < 2.0 && vy < 0) {
        this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, 0, 0.15);
        this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, 0, 0.15);
      }
    }

    // Apply linear velocity to physics body
    this.body.setLinvel(new this.rapier.Vector3(vx, vy, vz), true);

    // 5. Synchronize 3D Visual Mesh
    const newPos = this.body.translation();
    this.mesh.position.set(newPos.x, newPos.y - 0.25, newPos.z);

    // Orientation: combine heading (yaw), lean (roll), and slope/trick (pitch)
    this.scratchForward.set(-Math.sin(this.heading), 0, -Math.cos(this.heading)).normalize();

    if (this.isGrounded) {
      // Align board to ground surface normal
      this.scratchUp.copy(this.groundNormal);
      this.scratchRight.crossVectors(this.scratchForward, this.scratchUp).normalize();
      this.scratchForward.crossVectors(this.scratchUp, this.scratchRight).normalize();

      const rotMatrix = new THREE.Matrix4().makeBasis(
        this.scratchRight,
        this.scratchUp,
        this.scratchForward.clone().negate()
      );
      this.mesh.quaternion.setFromRotationMatrix(rotMatrix);

      // Apply banking/carving lean
      this.boardMesh.rotation.z = this.leanAngle;
      this.riderMesh.rotation.z = this.leanAngle * 1.3;
    } else {
      // Air orientation
      this.mesh.rotation.set(this.pitchAngle, this.heading, this.leanAngle, 'YXZ');
      this.boardMesh.rotation.z = 0;
      this.riderMesh.rotation.z = 0;

      // Grab posture
      if (inputs.grab) {
        this.riderTorso.position.y = 0.55; // Deep tuck grab
      } else {
        this.riderTorso.position.y = 0.85;
      }
    }

    this.trickEngine.updateDisplayTimer(dt);
  }

  public reset(x: number, y: number, z: number, heading: number = 0): void {
    this.body.setTranslation(new this.rapier.Vector3(x, y, z), true);
    this.body.setLinvel(new this.rapier.Vector3(0, 0, 0), true);
    this.body.setAngvel(new this.rapier.Vector3(0, 0, 0), true);
    this.heading = heading;
    this.pitchAngle = 0;
    this.leanAngle = 0;
    this.isGrounded = false;
    this.mesh.position.set(x, y - 0.25, z);
    this.mesh.rotation.set(0, heading, 0);
  }
}
