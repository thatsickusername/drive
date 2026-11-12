import { VehicleTransformState } from './protocol';

export const BINARY_FLOAT_COUNT = 24;

export class BinaryVehicleSync {
  // Pre-allocated array buffer to avoid garbage collection pressure at 60Hz
  private static sendBuffer = new Float32Array(BINARY_FLOAT_COUNT);

  public static encode(slotIndex: number, seq: number, state: VehicleTransformState): ArrayBuffer {
    const b = this.sendBuffer;
    b[0] = slotIndex;
    b[1] = seq;
    b[2] = state.pos[0];
    b[3] = state.pos[1];
    b[4] = state.pos[2];
    b[5] = state.rot[0];
    b[6] = state.rot[1];
    b[7] = state.rot[2];
    b[8] = state.rot[3];
    b[9] = state.linvel[0];
    b[10] = state.linvel[1];
    b[11] = state.linvel[2];
    b[12] = state.angvel[0];
    b[13] = state.angvel[1];
    b[14] = state.angvel[2];
    b[15] = state.steer;
    b[16] = state.susp[0];
    b[17] = state.susp[1];
    b[18] = state.susp[2];
    b[19] = state.susp[3];
    b[20] = state.spin[0];
    b[21] = state.spin[1];
    b[22] = state.spin[2];
    b[23] = state.spin[3];
    return b.buffer;
  }

  public static decode(buffer: ArrayBuffer): { slotIndex: number; seq: number; state: VehicleTransformState } | null {
    if (buffer.byteLength < BINARY_FLOAT_COUNT * 4) return null;
    const b = new Float32Array(buffer);
    return {
      slotIndex: Math.round(b[0]),
      seq: b[1],
      state: {
        t: performance.now(), // Synchronized to receiver's local clock epoch!
        pos: [b[2], b[3], b[4]],
        rot: [b[5], b[6], b[7], b[8]],
        linvel: [b[9], b[10], b[11]],
        angvel: [b[12], b[13], b[14]],
        steer: b[15],
        susp: [b[16], b[17], b[18], b[19]],
        spin: [b[20], b[21], b[22], b[23]]
      }
    };
  }
}
