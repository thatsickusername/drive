import { ClientMessage, ServerMessage, VehicleTransformState, PlayerSlotInfo } from './protocol';
import { BinaryVehicleSync } from './binary-sync';

export interface NetworkCallbacks {
  onInit: (self: PlayerSlotInfo, peers: PlayerSlotInfo[], room: string) => void;
  onPeerJoined: (peer: PlayerSlotInfo) => void;
  onPeerBinaryState: (slotIndex: number, state: VehicleTransformState) => void;
  onPeerState: (peerId: string, state: VehicleTransformState) => void;
  onPeerRespawn: (peerId: string, pos: [number, number, number], yaw: number) => void;
  onPeerLeft: (peerId: string) => void;
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error', pingMs: number) => void;
}

export class NetworkManager {
  private ws: WebSocket | null = null;
  private roomCode: string;
  private callbacks: NetworkCallbacks;
  private pingInterval: number | null = null;
  private lastPingSent = 0;
  private pingMs = 0;
  private isConnected = false;
  private reconnectTimer: number | null = null;
  private seq = 0;

  constructor(roomCode: string, callbacks: NetworkCallbacks) {
    this.roomCode = roomCode;
    this.callbacks = callbacks;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.callbacks.onStatusChange('connecting', this.pingMs);

    const wsUrl = this.getWebSocketUrl();
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';
    } catch {
      this.callbacks.onStatusChange('error', this.pingMs);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.callbacks.onStatusChange('connected', this.pingMs);
      this.send({ type: 'join', room: this.roomCode });
      this.startPingLoop();
    };

    this.ws.onmessage = (event) => {
      // 1. High-Performance Binary Transform Frame
      if (event.data instanceof ArrayBuffer) {
        const decoded = BinaryVehicleSync.decode(event.data);
        if (decoded) {
          this.callbacks.onPeerBinaryState(decoded.slotIndex, decoded.state);
        }
        return;
      }

      // 2. Control Messages (JSON)
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        this.handleMessage(msg);
      } catch (err) {
        console.warn('[Network] Invalid packet received:', err);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopPingLoop();
      this.callbacks.onStatusChange('disconnected', this.pingMs);
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.callbacks.onStatusChange('error', this.pingMs);
    };
  }

  private getWebSocketUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const wsProto = isHttps ? 'wss:' : 'ws:';
    const hostname = window.location.hostname || 'localhost';

    // If running in Vite dev server (port 5173) connect to relay server port 3001
    if (window.location.port === '5173') {
      return `${wsProto}//${hostname}:3001`;
    }

    // Otherwise connect to same origin host
    return `${wsProto}//${window.location.host}`;
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'init':
        this.callbacks.onInit(msg.self, msg.peers, msg.room);
        break;
      case 'peer_joined':
        this.callbacks.onPeerJoined(msg.peer);
        break;
      case 'peer_state':
        this.callbacks.onPeerState(msg.id, msg.state);
        break;
      case 'peer_respawn':
        this.callbacks.onPeerRespawn(msg.id, msg.pos, msg.yaw);
        break;
      case 'peer_left':
        this.callbacks.onPeerLeft(msg.id);
        break;
      case 'pong':
        this.pingMs = Math.max(1, Math.round(performance.now() - this.lastPingSent));
        this.callbacks.onStatusChange('connected', this.pingMs);
        break;
      case 'room_full':
        alert(`Room ${msg.room} is currently full (max 4 players).`);
        break;
    }
  }

  public sendState(slotIndex: number, state: VehicleTransformState): void {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      const buffer = BinaryVehicleSync.encode(slotIndex, ++this.seq, state);
      this.ws.send(buffer);
    }
  }

  public sendRespawn(pos: [number, number, number], yaw: number): void {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'respawn', pos, yaw });
    }
  }

  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startPingLoop(): void {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingSent = performance.now();
        this.send({ type: 'ping', t: this.lastPingSent });
      }
    }, 4000);
  }

  private stopPingLoop(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  public disconnect(): void {
    this.stopPingLoop();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
