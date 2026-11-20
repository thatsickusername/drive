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

  // Recovered parameters from verlet.yaml:
  private readonly timeStep = 0.02;      // 50 Hz
  private readonly gravityMag = 0.3 * 9.81; // 2.943 m/s^2 down
  private readonly gravityDamp = 0.99;
  private readonly groundBounce = 0.3;
  private readonly groundFriction = 0.8;
  private readonly stickIterations = 5;
  private readonly stickMul = 0.9;
  private readonly stickSlack = 0.1;

  public active: boolean = false;
  public timer: number = 0.0;

  constructor() {}

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

    const addPoint = (offset: THREE.Vector3) => {
      const p = origin.clone().add(offset);
      // Give particles initial velocity matching the crash entry speed
      const prev = p.clone().sub(initialLinvel.clone().multiplyScalar(this.timeStep));
      this.points.push({
        pos: p,
        prevPos: prev,
        acceleration: new THREE.Vector3(0, 0, 0),
        pinned: false
      });
    };

    // 0: Head, 1: Chest, 2: Hip, 3: L Hand, 4: R Hand, 5: L Foot, 6: R Foot
    addPoint(up.clone().multiplyScalar(1.65));                               // 0: Head
    addPoint(up.clone().multiplyScalar(1.35));                               // 1: Chest
    addPoint(up.clone().multiplyScalar(0.85));                               // 2: Hip
    addPoint(up.clone().multiplyScalar(1.2).sub(right.clone().multiplyScalar(0.45))); // 3: L Hand
    addPoint(up.clone().multiplyScalar(1.2).add(right.clone().multiplyScalar(0.45))); // 4: R Hand
    addPoint(up.clone().multiplyScalar(0.15).sub(right.clone().multiplyScalar(0.22)));// 5: L Foot
    addPoint(up.clone().multiplyScalar(0.15).add(right.clone().multiplyScalar(0.22)));// 6: R Foot

    const addStick = (i0: number, i1: number) => {
      const len = this.points[i0].pos.distanceTo(this.points[i1].pos);
      this.sticks.push({ p0: i0, p1: i1, length: len });
    };

    addStick(0, 1); // Head - Chest
    addStick(1, 2); // Chest - Hip
    addStick(1, 3); // Chest - L Hand
    addStick(1, 4); // Chest - R Hand
    addStick(2, 5); // Hip - L Foot
    addStick(2, 6); // Hip - R Foot
    addStick(5, 6); // L Foot - R Foot
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

  private satisfyConstraints(groundY: number): void {
    // 1. Stick distance constraint relaxation
    for (let iter = 0; iter < this.stickIterations; ++iter) {
      for (const stick of this.sticks) {
        const p0 = this.points[stick.p0];
        const p1 = this.points[stick.p1];

        const delta = p1.pos.clone().sub(p0.pos);
        const dist = delta.length();
        if (dist < 1e-6) continue;

        const diff = (dist - stick.length) / dist;
        if (Math.abs(diff) < this.stickSlack * 0.01) continue;
        const offset = delta.multiplyScalar(diff * 0.5 * this.stickMul);

        if (!p0.pinned) p0.pos.add(offset);
        if (!p1.pinned) p1.pos.sub(offset);
      }
    }

    // 2. Ground collision plane
    for (const pt of this.points) {
      if (pt.pos.y < groundY + 0.12) {
        pt.pos.y = groundY + 0.12;

        const vx = (pt.pos.x - pt.prevPos.x) * (1.0 - this.groundFriction);
        const vz = (pt.pos.z - pt.prevPos.z) * (1.0 - this.groundFriction);
        const vy = -(pt.pos.y - pt.prevPos.y) * this.groundBounce;

        pt.prevPos.x = pt.pos.x - vx;
        pt.prevPos.z = pt.pos.z - vz;
        pt.prevPos.y = pt.pos.y - vy;
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
