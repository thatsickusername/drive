import * as THREE from 'three';
import { SkierController } from '../player/SkierController';
import { RemoteSkier } from './RemoteSkier';
import { TurnType } from '../mechanics/GmaConfig';

export interface LocalSessionInfo {
  id: number;
  slotIndex: number;
  paletteId: number;
  paletteName: string;
}

const JUMP_VARIATION_MAP: Record<string, number> = {
  jump: 0,
  grab: 1,
  shifty: 2,
  daffy: 3,
  mutegrab: 4,
  ironcross: 5,
  nordic: 6
};

export class NetworkManager {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: number | null = null;
  private localSession: LocalSessionInfo | null = null;

  private scene: THREE.Scene;
  private player: SkierController;
  private terrainSampler?: (x: number, z: number) => number;

  public readonly remoteSkiers = new Map<number, RemoteSkier>();

  // 20Hz transmission timer (50ms interval)
  private sendTimer = 0;
  private readonly sendInterval = 0.05; // 50ms

  // Persistent 28-byte packet buffer for zero allocations
  private packetBuffer = new ArrayBuffer(28);
  private packetView = new DataView(this.packetBuffer);

  private lastTrickFinalizedName = '';

  constructor(
    scene: THREE.Scene,
    player: SkierController,
    terrainSampler?: (x: number, z: number) => number
  ) {
    this.scene = scene;
    this.player = player;
    this.terrainSampler = terrainSampler;
  }

  public connect(url?: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const host = window.location.host || 'localhost:3001';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const targetUrl = url || `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(targetUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.isConnected = true;
        const searchParams = new URLSearchParams(window.location.search);
        const roomCode = searchParams.get('room') || 'default-resort';
        this.sendJson({ type: 'join', room: roomCode });
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.handleBinaryPacket(event.data);
        } else {
          try {
            const msg = JSON.parse(event.data);
            this.handleJsonMessage(msg);
          } catch {
            // Malformed packet
          }
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private cleanup(): void {
    this.isConnected = false;
    for (const remote of this.remoteSkiers.values()) {
      remote.dispose(this.scene);
    }
    this.remoteSkiers.clear();
  }

  private handleJsonMessage(msg: any): void {
    if (msg.type === 'init') {
      this.localSession = msg.self;
      if (this.localSession && this.player) {
        // Set local player's outfit palette to match assigned slot
        const paletteKeys = ['coral', 'ochre', 'glacier', 'pine'];
        const pKey = paletteKeys[this.localSession.paletteId % paletteKeys.length] || 'coral';
        this.player.skierCharacter.setPalette(pKey);
      }
      // Instantiate existing peers
      if (Array.isArray(msg.peers)) {
        for (const peer of msg.peers) {
          this.addRemoteSkier(peer.id, peer.paletteId);
        }
      }
    } else if (msg.type === 'peer_joined') {
      const peer = msg.peer;
      if (peer && peer.id !== this.localSession?.id) {
        this.addRemoteSkier(peer.id, peer.paletteId);
      }
    } else if (msg.type === 'peer_left') {
      this.removeRemoteSkier(msg.id);
    } else if (msg.type === 'peer_trick') {
      const remote = this.remoteSkiers.get(msg.id);
      if (remote) {
        remote.showTrick(msg.name, msg.points);
      }
    }
  }

  private addRemoteSkier(id: number, paletteId: number): void {
    if (this.remoteSkiers.has(id)) return;
    const remote = new RemoteSkier(id, paletteId, this.scene, this.terrainSampler);
    this.remoteSkiers.set(id, remote);
  }

  private removeRemoteSkier(id: number): void {
    const remote = this.remoteSkiers.get(id);
    if (remote) {
      remote.dispose(this.scene);
      this.remoteSkiers.delete(id);
    }
  }

  private handleBinaryPacket(buffer: ArrayBuffer): void {
    if (buffer.byteLength < 28) return;
    const view = new DataView(buffer);
    const peerId = view.getUint8(0);

    // If packet belongs to local player or unknown, ignore
    if (this.localSession && peerId === this.localSession.id) return;

    let remote = this.remoteSkiers.get(peerId);
    if (!remote) {
      // Auto-register peer if not already present
      const paletteId = view.getUint8(26) & 0x0f;
      this.addRemoteSkier(peerId, paletteId);
      remote = this.remoteSkiers.get(peerId);
    }

    if (remote) {
      remote.onBinaryPacket(view);
    }
  }

  public update(
    dt: number,
    camera: THREE.Camera,
    lightingParams?: {
      time: number;
      sunDir: THREE.Vector3;
      cameraPos: THREE.Vector3;
      nightFactor: number;
      sunColor: THREE.Color;
      shadowColor: THREE.Color;
      goldenFactor: number;
    }
  ): void {
    // 1. Update Remote Skiers
    for (const remote of this.remoteSkiers.values()) {
      remote.update(dt, this.scene, camera, this.terrainSampler);
      if (lightingParams && remote.trail) {
        remote.trail.updateUniforms(
          lightingParams.time,
          lightingParams.sunDir,
          lightingParams.cameraPos,
          lightingParams.nightFactor,
          lightingParams.sunColor,
          lightingParams.shadowColor,
          lightingParams.goldenFactor
        );
      }
    }

    // 2. Transmit Local State @ 20Hz (every 50ms)
    this.sendTimer += dt;
    if (this.sendTimer >= this.sendInterval) {
      this.sendTimer = 0;
      this.broadcastLocalState();
    }

    // 3. Check for finalized trick landing broadcast
    const scoring = this.player.trickScoring;
    if (
      scoring.lastFinalizedTrickName &&
      scoring.lastFinalizedTrickName !== this.lastTrickFinalizedName &&
      scoring.displayTimer > 2.0
    ) {
      this.lastTrickFinalizedName = scoring.lastFinalizedTrickName;
      this.sendJson({
        type: 'trick',
        name: scoring.lastFinalizedTrickName,
        points: scoring.lastFinalizedPoints
      });
    }
  }

  private broadcastLocalState(): void {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const v = this.packetView;
    const pos = this.player.root.position;
    const quat = this.player.visualQuaternion;

    v.setUint8(0, this.localSession ? this.localSession.id : 0);
    v.setFloat32(1, pos.x, true);
    v.setFloat32(5, pos.y, true);
    v.setFloat32(9, pos.z, true);

    // Full 3D rotation unit quaternion (offsets 13..20: 8 bytes)
    v.setInt16(13, Math.round(quat.x * 32767), true);
    v.setInt16(15, Math.round(quat.y * 32767), true);
    v.setInt16(17, Math.round(quat.z * 32767), true);
    v.setInt16(19, Math.round(quat.w * 32767), true);

    // Forward speed in 0.01 m/s (offsets 21..22: 2 bytes)
    const speedMps = this.player.speed;
    const speedRaw = Math.round(Math.min(655.35, Math.max(0, speedMps)) * 100);
    v.setUint16(21, speedRaw, true);

    // Continuous carving body lean: -1.0 to +1.0 mapped to int8 -127..127 (offset 23: 1 byte)
    const clampedLean = Math.max(-1.0, Math.min(1.0, this.player.leanAngle));
    v.setInt8(23, Math.round(clampedLean * 127));

    // Turn type: 0 Standard, 1 Sharp, 2 Slide, 3 Overturn (offset 24: 1 byte)
    let turnType = 0;
    if (this.player.gmaPhysics.currentTurnType === TurnType.SharpTurn) turnType = 1;
    else if (this.player.isDrifting || this.player.gmaPhysics.currentTurnType === TurnType.SlideTurn) turnType = 2;
    else if (this.player.gmaPhysics.currentTurnType === TurnType.OverTurn) turnType = 3;
    v.setUint8(24, turnType);

    // Movement state: 0 Standing, 1 Gliding, 2 Airborne, 3 Crashing (offset 25: 1 byte)
    let movementState = 1;
    if (this.player.gmaPhysics.state === 'Crashing') movementState = 3;
    else if (!this.player.isGrounded) movementState = 2;
    else if (speedMps < 0.2) movementState = 0;
    v.setUint8(25, movementState);

    // Style packed: low 4 bits = paletteId (0..3), high 4 bits = jumpVariation index (0..6) (offset 26: 1 byte)
    const paletteId = (this.localSession ? this.localSession.paletteId : 0) & 0x0f;
    const jumpVarName = this.player.animator.activeJumpVariation || 'jump';
    const jumpVarIdx = (JUMP_VARIATION_MAP[jumpVarName] ?? 0) & 0x0f;
    v.setUint8(26, paletteId | (jumpVarIdx << 4));

    // Animated action flags (offset 27: 1 byte)
    let flags = 0;
    if (this.player.isGrounded) flags |= 0x01;
    if (this.player.gmaPhysics.hasTwintips) flags |= 0x02;
    if (this.player.gmaPhysics.isStaking) flags |= 0x04;
    if (this.player.isTucking) flags |= 0x08;
    if (this.player.isSpinning) flags |= 0x10;
    if (this.player.isFrontFlipping) flags |= 0x20;
    if (this.player.isBackFlipping) flags |= 0x40;
    if (this.player.isGrabActive) flags |= 0x80;
    v.setUint8(27, flags);

    this.ws.send(this.packetBuffer);
  }

  private sendJson(payload: any): void {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.terrainSampler = sampler;
    for (const remote of this.remoteSkiers.values()) {
      if (remote.trail) {
        remote.trail.setTerrainSampler(sampler);
      }
    }
  }
}
