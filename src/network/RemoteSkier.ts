import * as THREE from 'three';
import { buildSkierCharacter, SkierCharacter } from '../player/character/SkierRig';
import { SkierAnimator } from '../player/character/SkierAnimator';
import { PALETTES } from '../player/character/SkierPalette';
import { CarvedSnowTrail } from '../world/trails/CarvedSnowTrail';

export interface RemoteSkierStateSnapshot {
  time: number;
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  speed: number;
  yaw: number;
  pitch: number;
  roll: number;
  turnType: number;
  movementState: number;
  flags: number;
  trickId: number;
}

const PALETTE_KEYS = ['coral', 'ochre', 'glacier', 'pine'];

export class RemoteSkier {
  public readonly id: number;
  public readonly root = new THREE.Group();
  private skierRig: SkierCharacter;
  private animator: SkierAnimator;
  public trail: CarvedSnowTrail;

  // Snapshot Interpolation Buffer (100ms target interpolation delay)
  private snapshots: RemoteSkierStateSnapshot[] = [];
  private readonly interpDelay = 0.10; // 100ms
  private renderTime = 0;

  // Current interpolated transforms
  private currentPos = new THREE.Vector3();
  private currentQuat = new THREE.Quaternion();
  private currentSpeed = 0;
  private isGrounded = true;
  private isDrifting = false;
  private isStaking = false;

  // Overhead Nametag / Trick popup UI element
  private tagElement: HTMLElement | null = null;
  private trickPopupTimer = 0;
  private lastTrickText = '';

  constructor(
    id: number,
    paletteId: number,
    scene: THREE.Scene,
    terrainSampler?: (x: number, z: number) => number
  ) {
    this.id = id;

    const pKey = PALETTE_KEYS[paletteId % PALETTE_KEYS.length] || 'coral';
    const initialPalette = PALETTES[pKey] || PALETTES.coral;

    this.skierRig = buildSkierCharacter(initialPalette);
    this.skierRig.setPalette(pKey);
    this.animator = new SkierAnimator(this.skierRig);

    this.root.add(this.skierRig.root);
    scene.add(this.root);

    this.trail = new CarvedSnowTrail(scene);
    if (terrainSampler) {
      this.trail.setTerrainSampler(terrainSampler);
    }

    this.createNameTag(pKey);
  }

  private createNameTag(paletteName: string): void {
    this.tagElement = document.createElement('div');
    this.tagElement.className = 'remote-skier-tag';
    this.tagElement.style.cssText = `
      position: absolute;
      transform: translate(-50%, -100%);
      pointer-events: none;
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      z-index: 90;
      transition: opacity 0.2s ease;
      font-family: 'Segoe UI', Roboto, sans-serif;
    `;
    this.tagElement.innerHTML = `
      <div id="remote-trick-${this.id}" style="display:none;font-size:12px;font-weight:900;color:#facc15;text-shadow:0 1px 4px rgba(0,0,0,0.8);background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:4px;"></div>
      <div style="font-size:11px;font-weight:bold;color:#f8fafc;background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.25);border-radius:10px;padding:2px 8px;box-shadow:0 2px 6px rgba(0,0,0,0.4);">
        Skier #${this.id} <span style="color:#38bdf8;font-size:10px;">[${paletteName.toUpperCase()}]</span>
      </div>
    `;
    document.body.appendChild(this.tagElement);
  }

  public onBinaryPacket(view: DataView): void {
    if (view.byteLength < 28) return;

    const posX = view.getFloat32(1, true);
    const posY = view.getFloat32(5, true);
    const posZ = view.getFloat32(9, true);

    const yawRaw = view.getInt16(13, true);
    const pitchRaw = view.getInt16(15, true);
    const rollRaw = view.getInt16(17, true);
    const speedRaw = view.getUint16(19, true);

    const turnType = view.getUint8(21);
    const movementState = view.getUint8(22);
    view.getUint8(23); // paletteId
    const trickId = view.getUint8(24);
    const flags = view.getUint8(25);

    const yaw = (yawRaw / 32767) * Math.PI;
    const pitch = (pitchRaw / 32767) * Math.PI;
    const roll = (rollRaw / 32767) * Math.PI;
    const speed = speedRaw / 100;

    const euler = new THREE.Euler(pitch, yaw, roll, 'YXZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);

    const now = performance.now() * 0.001;
    this.snapshots.push({
      time: now,
      pos: new THREE.Vector3(posX, posY, posZ),
      quat,
      speed,
      yaw,
      pitch,
      roll,
      turnType,
      movementState,
      flags,
      trickId
    });

    // Keep buffer around 1.0 second max to avoid memory bloat
    while (this.snapshots.length > 30) {
      this.snapshots.shift();
    }
  }

  public showTrick(trickName: string, points: number): void {
    this.trickPopupTimer = 2.5;
    this.lastTrickText = points > 0 ? `${trickName} +${points}` : trickName;
    const el = document.getElementById(`remote-trick-${this.id}`);
    if (el) {
      el.textContent = this.lastTrickText;
      el.style.display = 'block';
    }
  }

  public update(
    dt: number,
    _scene: THREE.Scene,
    camera: THREE.Camera,
    terrainSampler?: (x: number, z: number) => number
  ): void {
    const now = performance.now() * 0.001;
    if (this.renderTime === 0) {
      this.renderTime = now - this.interpDelay;
    } else {
      this.renderTime += dt;
    }

    const targetTime = this.renderTime;

    // Snapshot interpolation
    if (this.snapshots.length > 0) {
      if (this.snapshots.length === 1 || targetTime <= this.snapshots[0].time) {
        const s = this.snapshots[0];
        this.currentPos.copy(s.pos);
        this.currentQuat.copy(s.quat);
        this.currentSpeed = s.speed;
        this.applyFlags(s.flags, s.movementState, s.turnType);
      } else if (targetTime >= this.snapshots[this.snapshots.length - 1].time) {
        const s = this.snapshots[this.snapshots.length - 1];
        this.currentPos.copy(s.pos);
        this.currentQuat.copy(s.quat);
        this.currentSpeed = s.speed;
        this.applyFlags(s.flags, s.movementState, s.turnType);
      } else {
        // Find surrounding snapshots
        let s0 = this.snapshots[0];
        let s1 = this.snapshots[1];
        for (let i = 0; i < this.snapshots.length - 1; i++) {
          if (this.snapshots[i].time <= targetTime && targetTime <= this.snapshots[i + 1].time) {
            s0 = this.snapshots[i];
            s1 = this.snapshots[i + 1];
            break;
          }
        }
        const span = s1.time - s0.time;
        const alpha = span > 0.0001 ? THREE.MathUtils.clamp((targetTime - s0.time) / span, 0, 1) : 0;

        // Hermite / Lerp position & Slerp quaternion
        this.currentPos.lerpVectors(s0.pos, s1.pos, alpha);
        this.currentQuat.slerpQuaternions(s0.quat, s1.quat, alpha);
        this.currentSpeed = THREE.MathUtils.lerp(s0.speed, s1.speed, alpha);
        this.applyFlags(s1.flags, s1.movementState, s1.turnType);
      }
    }

    // Apply interpolated transform to root
    this.root.position.copy(this.currentPos);
    this.root.quaternion.copy(this.currentQuat);

    // Update remote animator
    this.animator.update({
      dt,
      speed: this.currentSpeed,
      leanAngle: 0,
      isGrounded: this.isGrounded,
      isStaking: this.isStaking,
      isDrifting: this.isDrifting
    });

    // Update dedicated Carved Snow Trail for remote skier
    if (this.trail) {
      if (terrainSampler) {
        this.trail.setTerrainSampler(terrainSampler);
      }
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.currentQuat);
      const normal = new THREE.Vector3(0, 1, 0);
      this.trail.update(
        this.currentPos,
        right,
        normal,
        this.isGrounded,
        this.isDrifting ? 40 : 0,
        this.currentSpeed,
        this.isDrifting,
        0
      );
    }

    // Update screen-space name tag & trick banner position
    if (this.tagElement) {
      if (this.trickPopupTimer > 0) {
        this.trickPopupTimer -= dt;
        if (this.trickPopupTimer <= 0) {
          const el = document.getElementById(`remote-trick-${this.id}`);
          if (el) el.style.display = 'none';
        }
      }

      const worldPos = this.currentPos.clone().add(new THREE.Vector3(0, 1.85, 0));
      const projected = worldPos.project(camera);

      // Check if behind camera
      if (projected.z > 1.0) {
        this.tagElement.style.display = 'none';
      } else {
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(projected.y * 0.5) + 0.5) * window.innerHeight;
        this.tagElement.style.display = 'flex';
        this.tagElement.style.left = `${x.toFixed(1)}px`;
        this.tagElement.style.top = `${y.toFixed(1)}px`;
      }
    }
  }

  private applyFlags(flags: number, _movementState: number, turnType: number): void {
    this.isGrounded = (flags & 0x01) !== 0;
    this.isStaking = (flags & 0x04) !== 0;
    this.isDrifting = turnType === 2; // Slide
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.root);
    if (this.tagElement && this.tagElement.parentNode) {
      this.tagElement.parentNode.removeChild(this.tagElement);
    }
  }
}
