import * as THREE from 'three';
import { VehicleTransformState } from './protocol';

export class SnapshotInterpolator {
  private buffer: VehicleTransformState[] = [];
  // 25ms interpolation delay: tightly tuned for ~1.5 frame buffer at 60Hz
  private readonly interpDelayMs = 25;

  public push(snapshot: VehicleTransformState): void {
    this.buffer.push(snapshot);

    // Keep buffer strictly trimmed to last 16 frames (~260ms of history)
    while (this.buffer.length > 16) {
      this.buffer.shift();
    }
  }

  public clear(): void {
    this.buffer.length = 0;
  }

  public interpolate(
    renderTime: number,
    outPos: THREE.Vector3,
    outQuat: THREE.Quaternion
  ): {
    steer: number;
    susp: [number, number, number, number];
    spin: [number, number, number, number];
  } | null {
    if (this.buffer.length === 0) return null;

    const targetTime = renderTime - this.interpDelayMs;

    // Single snapshot: return direct values
    if (this.buffer.length === 1) {
      const s = this.buffer[0];
      outPos.set(s.pos[0], s.pos[1], s.pos[2]);
      outQuat.set(s.rot[0], s.rot[1], s.rot[2], s.rot[3]);
      return { steer: s.steer, susp: s.susp, spin: s.spin };
    }

    const latest = this.buffer[this.buffer.length - 1];

    // If render target is ahead of latest snapshot (temporary packet delay) -> Hermite Dead Reckoning
    if (targetTime >= latest.t) {
      const dt = Math.min((targetTime - latest.t) / 1000, 0.12); // Max 120ms dead reckoning
      outPos.set(
        latest.pos[0] + latest.linvel[0] * dt,
        latest.pos[1] + latest.linvel[1] * dt,
        latest.pos[2] + latest.linvel[2] * dt
      );

      // Rotate quaternion by angular velocity
      const q = new THREE.Quaternion(latest.rot[0], latest.rot[1], latest.rot[2], latest.rot[3]);
      const wx = latest.angvel[0], wy = latest.angvel[1], wz = latest.angvel[2];
      const omegaMag = Math.hypot(wx, wy, wz);
      if (omegaMag > 0.001) {
        const deltaRot = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(wx / omegaMag, wy / omegaMag, wz / omegaMag),
          omegaMag * dt
        );
        q.multiply(deltaRot);
      }
      outQuat.copy(q);

      return {
        steer: latest.steer,
        susp: latest.susp,
        spin: [
          latest.spin[0] + (latest.linvel[2] / 0.48) * dt,
          latest.spin[1] + (latest.linvel[2] / 0.48) * dt,
          latest.spin[2] + (latest.linvel[2] / 0.48) * dt,
          latest.spin[3] + (latest.linvel[2] / 0.48) * dt
        ]
      };
    }

    // If targetTime is behind the oldest snapshot -> clamp
    if (targetTime <= this.buffer[0].t) {
      const s0 = this.buffer[0];
      outPos.set(s0.pos[0], s0.pos[1], s0.pos[2]);
      outQuat.set(s0.rot[0], s0.rot[1], s0.rot[2], s0.rot[3]);
      return { steer: s0.steer, susp: s0.susp, spin: s0.spin };
    }

    // Find the two surrounding snapshots [s0, s1]
    let s0 = this.buffer[0];
    let s1 = this.buffer[1];
    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i].t <= targetTime && targetTime <= this.buffer[i + 1].t) {
        s0 = this.buffer[i];
        s1 = this.buffer[i + 1];
        break;
      }
    }

    const timeSpanMs = s1.t - s0.t;
    if (timeSpanMs <= 0.001) {
      outPos.set(s1.pos[0], s1.pos[1], s1.pos[2]);
      outQuat.set(s1.rot[0], s1.rot[1], s1.rot[2], s1.rot[3]);
      return { steer: s1.steer, susp: s1.susp, spin: s1.spin };
    }

    const h = timeSpanMs / 1000; // time interval in seconds
    const alpha = Math.max(0, Math.min(1, (targetTime - s0.t) / timeSpanMs));

    // Teleport / Respawn detection: if position delta > 5m, snap without interpolating
    const dx = s1.pos[0] - s0.pos[0];
    const dy = s1.pos[1] - s0.pos[1];
    const dz = s1.pos[2] - s0.pos[2];
    if (dx * dx + dy * dy + dz * dz > 25.0) {
      outPos.set(s1.pos[0], s1.pos[1], s1.pos[2]);
      outQuat.set(s1.rot[0], s1.rot[1], s1.rot[2], s1.rot[3]);
      return { steer: s1.steer, susp: s1.susp, spin: s1.spin };
    }

    // Hermite Cubic Spline Basis Functions (Position + Velocity Continuity)
    const a2 = alpha * alpha;
    const a3 = a2 * alpha;
    const h00 = 2 * a3 - 3 * a2 + 1;
    const h10 = a3 - 2 * a2 + alpha;
    const h01 = -2 * a3 + 3 * a2;
    const h11 = a3 - a2;

    outPos.set(
      h00 * s0.pos[0] + h10 * (s0.linvel[0] * h) + h01 * s1.pos[0] + h11 * (s1.linvel[0] * h),
      h00 * s0.pos[1] + h10 * (s0.linvel[1] * h) + h01 * s1.pos[1] + h11 * (s1.linvel[1] * h),
      h00 * s0.pos[2] + h10 * (s0.linvel[2] * h) + h01 * s1.pos[2] + h11 * (s1.linvel[2] * h)
    );

    // Orientation Slerp
    const q0 = new THREE.Quaternion(s0.rot[0], s0.rot[1], s0.rot[2], s0.rot[3]);
    const q1 = new THREE.Quaternion(s1.rot[0], s1.rot[1], s1.rot[2], s1.rot[3]);
    outQuat.slerpQuaternions(q0, q1, alpha);

    return {
      steer: s0.steer + (s1.steer - s0.steer) * alpha,
      susp: [
        s0.susp[0] + (s1.susp[0] - s0.susp[0]) * alpha,
        s0.susp[1] + (s1.susp[1] - s0.susp[1]) * alpha,
        s0.susp[2] + (s1.susp[2] - s0.susp[2]) * alpha,
        s0.susp[3] + (s1.susp[3] - s0.susp[3]) * alpha
      ],
      spin: [
        s0.spin[0] + (s1.spin[0] - s0.spin[0]) * alpha,
        s0.spin[1] + (s1.spin[1] - s0.spin[1]) * alpha,
        s0.spin[2] + (s1.spin[2] - s0.spin[2]) * alpha,
        s0.spin[3] + (s1.spin[3] - s0.spin[3]) * alpha
      ]
    };
  }
}
