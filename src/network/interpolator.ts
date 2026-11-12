import * as THREE from 'three';
import { VehicleTransformState } from './protocol';

export class SnapshotInterpolator {
  private buffer: VehicleTransformState[] = [];
  private readonly bufferTimeMs = 60; // 60ms jitter buffer

  public push(snapshot: VehicleTransformState): void {
    this.buffer.push(snapshot);
    // Keep buffer trimmed
    if (this.buffer.length > 25) {
      this.buffer.shift();
    }
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

    const targetTime = renderTime - this.bufferTimeMs;

    // Ahead of newest packet -> dead reckoning extrapolation
    const latest = this.buffer[this.buffer.length - 1];
    if (targetTime >= latest.t) {
      const dtSec = Math.min((targetTime - latest.t) / 1000, 0.15);
      outPos.set(
        latest.pos[0] + latest.linvel[0] * dtSec,
        latest.pos[1] + latest.linvel[1] * dtSec,
        latest.pos[2] + latest.linvel[2] * dtSec
      );
      outQuat.set(latest.rot[0], latest.rot[1], latest.rot[2], latest.rot[3]);
      return { steer: latest.steer, susp: latest.susp, spin: latest.spin };
    }

    // Behind oldest packet -> clamp
    if (targetTime <= this.buffer[0].t) {
      const s0 = this.buffer[0];
      outPos.set(s0.pos[0], s0.pos[1], s0.pos[2]);
      outQuat.set(s0.rot[0], s0.rot[1], s0.rot[2], s0.rot[3]);
      return { steer: s0.steer, susp: s0.susp, spin: s0.spin };
    }

    // Find two bounding snapshots
    let s0 = this.buffer[0];
    let s1 = this.buffer[1];
    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (this.buffer[i].t <= targetTime && targetTime <= this.buffer[i + 1].t) {
        s0 = this.buffer[i];
        s1 = this.buffer[i + 1];
        break;
      }
    }

    const span = s1.t - s0.t;
    const alpha = span > 0 ? Math.max(0, Math.min(1, (targetTime - s0.t) / span)) : 0;

    const p0 = new THREE.Vector3(s0.pos[0], s0.pos[1], s0.pos[2]);
    const p1 = new THREE.Vector3(s1.pos[0], s1.pos[1], s1.pos[2]);
    outPos.lerpVectors(p0, p1, alpha);

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
