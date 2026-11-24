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
    addPoint(up.clone().multiplyScalar(0.80).sub(right.clone().multiplyScalar(0.14)));
    addPoint(up.clone().multiplyScalar(0.46).sub(right.clone().multiplyScalar(0.14)));
    addPoint(up.clone().multiplyScalar(0.12).sub(right.clone().multiplyScalar(0.14)));

    // Right Leg (14: R Hip, 15: R Knee, 16: R Foot)
    addPoint(up.clone().multiplyScalar(0.80).add(right.clone().multiplyScalar(0.14)));
    addPoint(up.clone().multiplyScalar(0.46).add(right.clone().multiplyScalar(0.14)));
    addPoint(up.clone().multiplyScalar(0.12).add(right.clone().multiplyScalar(0.14)));

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

  private satisfyConstraints(fallbackGroundY: number): void {
    // 1. Stick distance constraint relaxation (multi-pass for anatomical integrity)
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
    }

    // 2. Full 3D Continuous Snow Terrain Heightfield Collision:
    // Samples true undulating mountain elevation and slope normal at every particle's exact (x, z)
    const particleRadius = 0.14;

    for (const pt of this.points) {
      const floorY = this.terrainSampler ? this.terrainSampler(pt.pos.x, pt.pos.z) : fallbackGroundY;

      if (pt.pos.y < floorY + particleRadius) {
        pt.pos.y = floorY + particleRadius;

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

  public getCenterOfMass(): THREE.Vector3 {
    if (this.points.length === 0) return new THREE.Vector3();
    const com = new THREE.Vector3();
    for (const pt of this.points) {
      com.add(pt.pos);
    }
    return com.divideScalar(this.points.length);
  }
}
