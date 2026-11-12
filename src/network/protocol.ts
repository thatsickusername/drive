export interface VehicleTransformState {
  t: number;
  pos: [number, number, number];
  rot: [number, number, number, number];
  linvel: [number, number, number];
  angvel: [number, number, number];
  steer: number;
  susp: [number, number, number, number];
  spin: [number, number, number, number];
}

export interface PlayerSlotInfo {
  id: string;
  slotIndex: number; // 0 = Player 1 (Green), 1 = Player 2 (Orange), 2 = Player 3 (Tan), 3 = Player 4 (Blue)
  spawnPos: [number, number, number];
  spawnYaw: number;
  colorHex: number;
  colorName: string;
}

export type ClientMessage =
  | { type: 'join'; room: string }
  | { type: 'state'; state: VehicleTransformState }
  | { type: 'respawn'; pos: [number, number, number]; yaw: number }
  | { type: 'ping'; t: number };

export type ServerMessage =
  | {
      type: 'init';
      self: PlayerSlotInfo;
      peers: PlayerSlotInfo[];
      room: string;
    }
  | {
      type: 'peer_joined';
      peer: PlayerSlotInfo;
    }
  | {
      type: 'peer_state';
      id: string;
      state: VehicleTransformState;
    }
  | {
      type: 'peer_respawn';
      id: string;
      pos: [number, number, number];
      yaw: number;
    }
  | {
      type: 'peer_left';
      id: string;
    }
  | {
      type: 'pong';
      t: number;
    }
  | {
      type: 'room_full';
      room: string;
    };
