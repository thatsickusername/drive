import * as THREE from 'three';

export interface VerletPoint {
  pos: THREE.Vector3;
  prevPos: THREE.Vector3;
  acceleration: THREE.Vector3;
  pinned: boolean;
}

export interface VerletStick {
  p0: number;
  p1: number;
  length: number;
}

/**
 * 7-particle Verlet ragdoll solver implementing exact physics from verlet.yaml
 * Triggered during wipeouts and high-impact crashes.
 */
export class VerletRagdollSolver {
  public points: VerletPoint[] = [];
  public sticks: VerletStick[] = [];

  // Anatomical collision radii matching character geometry (jacket, beanie, boots, skis):
  public static readonly RADIUS_MAP: number[] = [
    0.22, // 0: Pelvis
    0.20, // 1: Spine / Waist
    0.24, // 2: Chest
    0.15, // 3: Neck
    0.20, // 4: Head (beanie & goggles)
    0.16, // 5: L Shoulder
    0.13, // 6: L Elbow
    0.13, // 7: L Hand
    0.16, // 8: R Shoulder
    0.13, // 9: R Elbow
    0.13, // 10: R Hand
    0.18, // 11: L Hip
    0.14, // 12: L Knee
    0.16, // 13: L Foot
    0.18, // 14: R Hip
    0.14, // 15: R Knee
    0.16, // 16: R Foot
    0.12, // 17: L Ski Tip
    0.12, // 18: L Ski Tail
    0.12, // 19: R Ski Tip
    0.12  // 20: R Ski Tail
  ];

  // Tuned parameters for realistic snow wipeouts & tumbling:
  private readonly timeStep = 0.02;         // 50 Hz
  private readonly gravityMag = 9.81;        // Authentic 9.81 m/s^2 downward gravity
  private readonly gravityDamp = 0.985;      // Tumble angular damping
  private readonly groundBounce = 0.15;      // Snow impact damping (low rebound)
  private readonly groundFriction = 0.82;    // Snow sliding friction
  private readonly stickIterations = 8;      // High stiffness so limbs cannot detach
  private readonly stickMul = 1.0;
  private readonly stickSlack = 0.01;

  public active: boolean = false;
  public timer: number = 0.0;
  private terrainSampler: ((x: number, z: number) => number) | null = null;
  private static readonly STRIDE = 24;
  private connectedSticks: Uint8Array = new Uint8Array(24 * 24);

  constructor() {}

  public setTerrainSampler(sampler: ((x: number, z: number) => number) | null): void {
    this.terrainSampler = sampler;
  }

  public initializeSkeleton(
    origin: THREE.Vector3,
    forwardDir: THREE.Vector3,
    initialLinvel: THREE.Vector3
  ): void {
    this.points = [];
    this.sticks = [];
    this.active = true;
    this.timer = 0.0;

    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forwardDir, up).normalize();

    // Random tumble angular momentum on crash entry for natural roll
    const tumbleOmega = new THREE.Vector3(
      (Math.random() - 0.5) * 4.0,
      (Math.random() - 0.5) * 2.5,
      (Math.random() - 0.5) * 4.0
    );

    const addPoint = (offset: THREE.Vector3) => {
      const p = origin.clone().add(offset);
      // Give particles initial linear velocity plus rotational tumble
      const tangVel = new THREE.Vector3().crossVectors(tumbleOmega, offset);
      const particleVel = initialLinvel.clone().add(tangVel);
      const prev = p.clone().sub(particleVel.multiplyScalar(this.timeStep));
      this.points.push({
        pos: p,
        prevPos: prev,
        acceleration: new THREE.Vector3(0, 0, 0),
        pinned: false
      });
    };

    // 17-point anatomical skeleton:
    // 0: Pelvis / Hips
    addPoint(up.clone().multiplyScalar(0.82));
    // 1: Spine / Waist
    addPoint(up.clone().multiplyScalar(1.05));
    // 2: Chest / Shoulder Center
    addPoint(up.clone().multiplyScalar(1.34));
    // 3: Neck
    addPoint(up.clone().multiplyScalar(1.48));
    // 4: Head
    addPoint(up.clone().multiplyScalar(1.68));

    // Left Arm (5: L Shoulder, 6: L Elbow, 7: L Hand)
    addPoint(up.clone().multiplyScalar(1.34).sub(right.clone().multiplyScalar(0.22)));
    addPoint(up.clone().multiplyScalar(1.05).sub(right.clone().multiplyScalar(0.32)));
    addPoint(up.clone().multiplyScalar(0.75).sub(right.clone().multiplyScalar(0.35)));

    // Right Arm (8: R Shoulder, 9: R Elbow, 10: R Hand)
    addPoint(up.clone().multiplyScalar(1.34).add(right.clone().multiplyScalar(0.22)));
    addPoint(up.clone().multiplyScalar(1.05).add(right.clone().multiplyScalar(0.32)));
    addPoint(up.clone().multiplyScalar(0.75).add(right.clone().multiplyScalar(0.35)));

    // Left Leg (11: L Hip, 12: L Knee, 13: L Foot)
    const lHipPos = up.clone().multiplyScalar(0.80).sub(right.clone().multiplyScalar(0.14));
    const lFootPos = up.clone().multiplyScalar(0.12).sub(right.clone().multiplyScalar(0.14));
    addPoint(lHipPos);
    addPoint(up.clone().multiplyScalar(0.46).sub(right.clone().multiplyScalar(0.14)));
    addPoint(lFootPos);

    // Right Leg (14: R Hip, 15: R Knee, 16: R Foot)
    const rHipPos = up.clone().multiplyScalar(0.80).add(right.clone().multiplyScalar(0.14));
    const rFootPos = up.clone().multiplyScalar(0.12).add(right.clone().multiplyScalar(0.14));
    addPoint(rHipPos);
    addPoint(up.clone().multiplyScalar(0.46).add(right.clone().multiplyScalar(0.14)));
    addPoint(rFootPos);

    // Alpine Skis: 1.46m rigid planks locked to boots & shins
    // 17: Left Ski Tip (+0.78m forward), 18: Left Ski Tail (-0.68m back)
    addPoint(lFootPos.clone().add(forwardDir.clone().multiplyScalar(0.78)).sub(up.clone().multiplyScalar(0.08)));
    addPoint(lFootPos.clone().sub(forwardDir.clone().multiplyScalar(0.68)).sub(up.clone().multiplyScalar(0.08)));

    // 19: Right Ski Tip (+0.78m forward), 20: Right Ski Tail (-0.68m back)
    addPoint(rFootPos.clone().add(forwardDir.clone().multiplyScalar(0.78)).sub(up.clone().multiplyScalar(0.08)));
    addPoint(rFootPos.clone().sub(forwardDir.clone().multiplyScalar(0.68)).sub(up.clone().multiplyScalar(0.08)));

    const addStick = (i0: number, i1: number) => {
      const len = this.points[i0].pos.distanceTo(this.points[i1].pos);
      this.sticks.push({ p0: i0, p1: i1, length: len });
    };

    // Core Spine & Neck (limbs cannot detach at neck / waist)
    addStick(0, 1);  // Pelvis - Spine (Waist)
    addStick(1, 2);  // Spine - Chest
    addStick(2, 3);  // Chest - Neck
    addStick(3, 4);  // Neck - Head
    addStick(0, 2);  // Pelvis - Chest (spine brace)

    // Left Arm (limbs cannot detach at shoulder)
    addStick(2, 5);  // Chest - L Shoulder
    addStick(5, 6);  // L Shoulder - L Elbow
    addStick(6, 7);  // L Elbow - L Hand

    // Right Arm (limbs cannot detach at shoulder)
    addStick(2, 8);  // Chest - R Shoulder
    addStick(8, 9);  // R Shoulder - R Elbow
    addStick(9, 10); // R Elbow - R Hand

    // Collarbone and Torso Cross-Bracing
    addStick(5, 8);  // L Shoulder - R Shoulder
    addStick(5, 0);  // L Shoulder - Pelvis
    addStick(8, 0);  // R Shoulder - Pelvis

    // Left Leg (limbs cannot detach at hip / knee)
    addStick(0, 11); // Pelvis - L Hip
    addStick(11, 12);// L Hip - L Knee
    addStick(12, 13);// L Knee - L Foot

    // Right Leg (limbs cannot detach at hip / knee)
    addStick(0, 14); // Pelvis - R Hip
    addStick(14, 15);// R Hip - R Knee
    addStick(15, 16);// R Knee - R Foot

    // Pelvis and Leg Cross-Bracing
    addStick(11, 14);// L Hip - R Hip
    addStick(1, 11); // Spine - L Hip
    addStick(1, 14); // Spine - R Hip

    // Left Ski Rigid Tetrahedron Structure (Foot + Knee + Tip + Tail)
    addStick(13, 17);// L Foot - L Ski Tip
    addStick(13, 18);// L Foot - L Ski Tail
    addStick(17, 18);// L Ski Tip - L Ski Tail (rigid ski plank spine)
    addStick(12, 17);// L Knee - L Ski Tip (boot binding pitch lock)
    addStick(12, 18);// L Knee - L Ski Tail (boot binding pitch lock)

    // Right Ski Rigid Tetrahedron Structure (Foot + Knee + Tip + Tail)
    addStick(16, 19);// R Foot - R Ski Tip
    addStick(16, 20);// R Foot - R Ski Tail
    addStick(19, 20);// R Ski Tip - R Ski Tail (rigid ski plank spine)
    addStick(15, 19);// R Knee - R Ski Tip (boot binding pitch lock)
    addStick(15, 20);// R Knee - R Ski Tail (boot binding pitch lock)

    // Cache direct stick connection lookup table for fast O(1) self-collision filtering
    this.connectedSticks.fill(0);
    for (const stick of this.sticks) {
      this.connectedSticks[stick.p0 * VerletRagdollSolver.STRIDE + stick.p1] = 1;
      this.connectedSticks[stick.p1 * VerletRagdollSolver.STRIDE + stick.p0] = 1;
    }
  }

  public stepSimulation(groundY: number): void {
    if (!this.active) return;
    this.timer += this.timeStep;

    this.applyForces();
    this.verletIntegrate();
    this.satisfyConstraints(groundY);
  }

  private applyForces(): void {
    const grav = new THREE.Vector3(0, -this.gravityMag, 0);
    for (const pt of this.points) {
      if (!pt.pinned) {
        pt.acceleration.copy(grav);
      }
    }
  }

  private verletIntegrate(): void {
    for (const pt of this.points) {
      if (pt.pinned) continue;

      const vel = pt.pos.clone().sub(pt.prevPos).multiplyScalar(this.gravityDamp);
      pt.prevPos.copy(pt.pos);
      pt.pos.add(vel).addScaledVector(pt.acceleration, this.timeStep * this.timeStep);
      pt.acceleration.set(0, 0, 0);
    }
  }

  /**
   * Resolves particle-particle self-collisions so hands, feet, head, torso and skis
   * cannot pass through each other.
   */
  private resolveSelfCollisions(): void {
    const pts = this.points;
    const radii = VerletRagdollSolver.RADIUS_MAP;
    const count = pts.length;
    const stride = VerletRagdollSolver.STRIDE;

    for (let i = 0; i < count; i++) {
      const pA = pts[i];
      const rA = radii[i] || 0.15;

      for (let j = i + 1; j < count; j++) {
        // Skip pairs directly connected by rigid sticks (bones/binding rods)
        if (this.connectedSticks[i * stride + j] === 1) continue;

        const pB = pts[j];
        const rB = radii[j] || 0.15;

        // Anatomical hinge thresholds:
        let minDist = rA + rB;
        if ((i === 2 && j === 4) || (i === 4 && j === 2)) {
          // Chest (2) vs Head (4): Head stops when chin contacts chest (0.28m), preventing head penetration
          minDist = 0.28;
        } else if ((i === 5 && j === 7) || (i === 7 && j === 5) || (i === 8 && j === 10) || (i === 10 && j === 8)) {
          // Shoulder vs Hand: full natural elbow flexion limit
          minDist = 0.14;
        } else if ((i === 11 && j === 13) || (i === 13 && j === 11) || (i === 14 && j === 16) || (i === 16 && j === 14)) {
          // Hip vs Foot: full natural knee flexion limit
          minDist = 0.18;
        }

        const dx = pB.pos.x - pA.pos.x;
        const dy = pB.pos.y - pA.pos.y;
        const dz = pB.pos.z - pA.pos.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < minDist * minDist && distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          const push = overlap * 0.5;

          if (!pA.pinned) {
            pA.pos.x -= nx * push;
            pA.pos.y -= ny * push;
            pA.pos.z -= nz * push;
          }
          if (!pB.pinned) {
            pB.pos.x += nx * push;
            pB.pos.y += ny * push;
            pB.pos.z += nz * push;
          }
        }
      }
    }
  }

  /**
   * Resolves terrain heightfield collision for all particles.
   * Clamps particle above snow elevation and optionally reflects normal momentum.
   */
  private resolveGroundCollisions(fallbackGroundY: number, applyDynamics: boolean): void {
    const radii = VerletRagdollSolver.RADIUS_MAP;

    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      const floorY = this.terrainSampler ? this.terrainSampler(pt.pos.x, pt.pos.z) : fallbackGroundY;
      const radius = radii[i] || 0.16;

      if (pt.pos.y < floorY + radius) {
        pt.pos.y = floorY + radius;

        if (applyDynamics) {
          // Local slope normal via finite differences
          let nx = 0, ny = 1, nz = 0;
          if (this.terrainSampler) {
            const eps = 0.25;
            const hL = this.terrainSampler(pt.pos.x - eps, pt.pos.z);
            const hR = this.terrainSampler(pt.pos.x + eps, pt.pos.z);
            const hD = this.terrainSampler(pt.pos.x, pt.pos.z - eps);
            const hU = this.terrainSampler(pt.pos.x, pt.pos.z + eps);
            const gx = (hR - hL) / (2 * eps);
            const gz = (hU - hD) / (2 * eps);
            const invLen = 1.0 / Math.sqrt(gx * gx + 1.0 + gz * gz);
            nx = -gx * invLen;
            ny = invLen;
            nz = -gz * invLen;
          }

          const vx = pt.pos.x - pt.prevPos.x;
          const vy = pt.pos.y - pt.prevPos.y;
          const vz = pt.pos.z - pt.prevPos.z;

          const vDotN = vx * nx + vy * ny + vz * nz;
          if (vDotN < 0) {
            // Decompose normal and tangential velocity
            const vNormX = nx * vDotN;
            const vNormY = ny * vDotN;
            const vNormZ = nz * vDotN;

            const vTanX = vx - vNormX;
            const vTanY = vy - vNormY;
            const vTanZ = vz - vNormZ;

            // Snow damping on normal bounce, high friction on tangent slide
            const frictionFactor = Math.max(0.0, 1.0 - this.groundFriction);
            const newVx = vTanX * frictionFactor - vNormX * this.groundBounce;
            const newVy = vTanY * frictionFactor - vNormY * this.groundBounce;
            const newVz = vTanZ * frictionFactor - vNormZ * this.groundBounce;

            pt.prevPos.x = pt.pos.x - newVx;
            pt.prevPos.y = pt.pos.y - newVy;
            pt.prevPos.z = pt.pos.z - newVz;
          }
        }
      }
    }
  }

  private satisfyConstraints(fallbackGroundY: number): void {
    // Coupled multi-pass relaxation:
    // Ground collision and self-collision are evaluated on EVERY relaxation pass
    // so sticks can NEVER pull a particle below the snow surface.
    for (let iter = 0; iter < this.stickIterations; ++iter) {
      for (const stick of this.sticks) {
        const p0 = this.points[stick.p0];
        const p1 = this.points[stick.p1];

        const dx = p1.pos.x - p0.pos.x;
        const dy = p1.pos.y - p0.pos.y;
        const dz = p1.pos.z - p0.pos.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 1e-6) continue;

        const diff = (dist - stick.length) / dist;
        if (Math.abs(diff) < this.stickSlack) continue;

        const offX = dx * diff * 0.5 * this.stickMul;
        const offY = dy * diff * 0.5 * this.stickMul;
        const offZ = dz * diff * 0.5 * this.stickMul;

        if (!p0.pinned) {
          p0.pos.x += offX;
          p0.pos.y += offY;
          p0.pos.z += offZ;
        }
        if (!p1.pinned) {
          p1.pos.x -= offX;
          p1.pos.y -= offY;
          p1.pos.z -= offZ;
        }
      }

      // Self-collision (hands vs head, torso, knees)
      this.resolveSelfCollisions();

      // Ground collision on every pass to prevent stick-induced snow penetration
      const isFinal = (iter === this.stickIterations - 1);
      this.resolveGroundCollisions(fallbackGroundY, isFinal);
    }
  }

  public getCenterOfMass(): THREE.Vector3 {
    if (this.points.length === 0) return new THREE.Vector3();
    const com = new THREE.Vector3();
    for (const pt of this.points) {
      com.add(pt.pos);
    }
    return com.divideScalar(this.points.length);
  }
}
