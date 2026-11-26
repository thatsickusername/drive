import * as THREE from 'three';
import { buildSkierCharacter, SkierCharacter, applyRagdollPose } from '../player/character/SkierRig';
import { SkierAnimator } from '../player/character/SkierAnimator';
import { PALETTES } from '../player/character/SkierPalette';
import { CarvedSnowTrail } from '../world/trails/CarvedSnowTrail';
import { VerletRagdollSolver } from '../mechanics/VerletRagdoll';

export type RemoteJumpVariation = 'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' | 'ironcross' | 'nordic';

export interface RemoteSkierStateSnapshot {
  time: number;
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  speed: number;
  leanAngle: number;
  turnType: number;
  movementState: number;
  paletteId: number;
  jumpVariation: RemoteJumpVariation;
  flags: number;
}

const PALETTE_KEYS = ['coral', 'ochre', 'glacier', 'pine'];
const JUMP_VARIATIONS: RemoteJumpVariation[] = [
  'jump',
  'grab',
  'shifty',
  'daffy',
  'mutegrab',
  'ironcross',
  'nordic'
];

// Pre-allocated scratch vectors to eliminate per-frame allocations in RemoteSkier
const _scratchRight = new THREE.Vector3();
const _scratchNormal = new THREE.Vector3();
const _scratchWorldPos = new THREE.Vector3();
const _scratchProjected = new THREE.Vector3();
const _scratchFwd = new THREE.Vector3();
const _scratchLinvel = new THREE.Vector3();
const _scratchCamFwd = new THREE.Vector3();
const _scratchToCam = new THREE.Vector3();

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

  // Current interpolated transforms & animation parameters
  private currentPos = new THREE.Vector3();
  private currentQuat = new THREE.Quaternion();
  private currentSpeed = 0;
  private currentLeanAngle = 0;
  private isGrounded = true;
  private wasGrounded = true;
  private isDrifting = false;
  private isStaking = false;
  private isSlideTurn = false;
  private isSharpTurn = false;
  private isTucking = false;
  private isSpinning = false;
  private isFrontFlipping = false;
  private isBackFlipping = false;
  private grabPressed = false;
  private movementState = 1;
  private currentJumpVariation: RemoteJumpVariation = 'jump';
  private wasCrashing = false;
  private wasTrailCulled = false;
  private lastSnapshotTime = -1;
  private lastSnapshotPos = new THREE.Vector3();
  private hasLastSnapshot = false;

  // 50Hz Verlet Ragdoll Physics for authentic crash tumbles
  private ragdoll = new VerletRagdollSolver();
  private terrainSampler: ((x: number, z: number) => number) | null = null;

  // Snow Spray Particle System (glistening plumes during carving, drifting, and braking)
  private sprayParticles: THREE.Points | null = null;
  private readonly sprayCount = 90;
  private sprayPositions = new Float32Array(90 * 3);
  private sprayVelocities = new Float32Array(90 * 3);
  private sprayLifetimes = new Float32Array(90);

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
      this.setTerrainSampler(terrainSampler);
    }

    this.initSnowSpray(scene);
    this.createNameTag(pKey);
  }

  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.terrainSampler = sampler;
    this.ragdoll.setTerrainSampler(sampler);
    if (this.trail) {
      this.trail.setTerrainSampler(sampler);
    }
  }

  private initSnowSpray(scene: THREE.Scene): void {
    for (let i = 0; i < this.sprayCount; i++) {
      this.sprayPositions[i * 3 + 1] = -9999;
      this.sprayLifetimes[i] = 0;
    }
    const sprayGeo = new THREE.BufferGeometry();
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(this.sprayPositions, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0xf5f8fc,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.sprayParticles = new THREE.Points(sprayGeo, sprayMat);
    scene.add(this.sprayParticles);
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

    const qxRaw = view.getInt16(13, true);
    const qyRaw = view.getInt16(15, true);
    const qzRaw = view.getInt16(17, true);
    const qwRaw = view.getInt16(19, true);
    const speedRaw = view.getUint16(21, true);

    const leanRaw = view.getInt8(23);
    const turnType = view.getUint8(24);
    const movementState = view.getUint8(25);
    const stylePacked = view.getUint8(26);
    const flags = view.getUint8(27);

    const qx = qxRaw / 32767;
    const qy = qyRaw / 32767;
    const qz = qzRaw / 32767;
    const qw = qwRaw / 32767;
    const quat = new THREE.Quaternion(qx, qy, qz, qw);
    if (quat.lengthSq() > 0.0001) {
      quat.normalize();
    } else {
      quat.set(0, 0, 0, 1);
    }

    const speed = speedRaw / 100;
    const leanAngle = THREE.MathUtils.clamp(leanRaw / 127.0, -1.0, 1.0);

    const paletteId = stylePacked & 0x0f;
    const jumpVarIdx = (stylePacked >> 4) & 0x0f;
    const jumpVariation = JUMP_VARIATIONS[jumpVarIdx] || 'jump';

    const prevSnap = this.snapshots[this.snapshots.length - 1];
    const rawNow = performance.now() * 0.001;
    const now = prevSnap ? Math.max(rawNow, prevSnap.time + 0.001) : rawNow;
    this.snapshots.push({
      time: now,
      pos: new THREE.Vector3(posX, posY, posZ),
      quat,
      speed,
      leanAngle,
      turnType,
      movementState,
      paletteId,
      jumpVariation,
      flags
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
    if (terrainSampler && !this.terrainSampler) {
      this.setTerrainSampler(terrainSampler);
    }
    const now = performance.now() * 0.001;
    if (this.renderTime === 0) {
      this.renderTime = now - this.interpDelay;
    } else {
      this.renderTime += dt;
    }

    // Adaptive clock resync to prevent jitter or drift
    if (this.snapshots.length > 0) {
      const minTime = this.snapshots[0].time;
      const maxTime = this.snapshots[this.snapshots.length - 1].time;
      if (this.renderTime < minTime - 0.25 || this.renderTime > maxTime + 0.25) {
        this.renderTime = now - this.interpDelay;
      }
    }

    const targetTime = this.renderTime;

    // Snapshot interpolation
    if (this.snapshots.length > 0) {
      let activeSnap: RemoteSkierStateSnapshot;
      if (this.snapshots.length === 1 || targetTime <= this.snapshots[0].time) {
        activeSnap = this.snapshots[0];
        this.currentPos.copy(activeSnap.pos);
        this.currentQuat.copy(activeSnap.quat);
        this.currentSpeed = activeSnap.speed;
        this.currentLeanAngle = activeSnap.leanAngle;
      } else if (targetTime >= this.snapshots[this.snapshots.length - 1].time) {
        activeSnap = this.snapshots[this.snapshots.length - 1];
        this.currentPos.copy(activeSnap.pos);
        this.currentQuat.copy(activeSnap.quat);
        this.currentSpeed = activeSnap.speed;
        this.currentLeanAngle = activeSnap.leanAngle;
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
        activeSnap = s0;
        const isTeleport = s0.pos.distanceToSquared(s1.pos) > 225; // >15m between 50ms packets
        if (isTeleport) {
          this.currentPos.copy(s0.pos);
          this.currentQuat.copy(s0.quat);
          this.currentSpeed = s0.speed;
          this.currentLeanAngle = s0.leanAngle;
        } else {
          const span = s1.time - s0.time;
          const alpha = span > 0.0001 ? THREE.MathUtils.clamp((targetTime - s0.time) / span, 0, 1) : 0;

          // Hermite / Lerp position & Slerp quaternion
          this.currentPos.lerpVectors(s0.pos, s1.pos, alpha);
          this.currentQuat.slerpQuaternions(s0.quat, s1.quat, alpha);
          this.currentSpeed = THREE.MathUtils.lerp(s0.speed, s1.speed, alpha);
          this.currentLeanAngle = THREE.MathUtils.lerp(s0.leanAngle, s1.leanAngle, alpha);
        }
      }

      this.processSnapshotTransitions(activeSnap);
      this.applyFlags(activeSnap.flags, activeSnap.movementState, activeSnap.turnType, activeSnap.jumpVariation);
    }

    // Apply interpolated transform to root
    this.root.position.copy(this.currentPos);
    this.root.quaternion.copy(this.currentQuat);

    // Crash state transitions
    const isCrashing = this.movementState === 3;
    if (isCrashing && (!this.wasCrashing || !this.ragdoll.active)) {
      if (this.trail) this.trail.onCrash();
      const fwd = _scratchFwd.set(0, 0, -1).applyQuaternion(this.currentQuat);
      const linvel = _scratchLinvel.copy(fwd).multiplyScalar(Math.max(4.0, this.currentSpeed));
      if (this.terrainSampler) {
        this.ragdoll.setTerrainSampler(this.terrainSampler);
      }
      this.ragdoll.initializeSkeleton(this.currentPos, fwd, linvel);
      if (this.ragdoll.points.length > 0) {
        this.ragdoll.points[0].pinned = true;
      }
    } else if (!isCrashing && this.wasCrashing) {
      this.ragdoll.active = false;
      this.skierRig.resetPose();
      if (this.trail) this.trail.onRespawn();
    }
    this.wasCrashing = isCrashing;

    // Airborne / jump transition for snow trail gap
    const isAirborne = !this.isGrounded || this.movementState === 2;
    if (isAirborne && this.wasGrounded && !isCrashing && this.trail) {
      this.trail.onJumpStart();
    }
    this.wasGrounded = !isAirborne && !isCrashing;

    // LOD & Distance Culling against camera
    const distSq = this.currentPos.distanceToSquared(camera.position);
    const isBeyondFar = distSq > 600 * 600; // > 600m
    const isBeyondLOD = distSq > 280 * 280; // > 280m

    // Check if in front of camera
    _scratchToCam.subVectors(this.currentPos, camera.position);
    camera.getWorldDirection(_scratchCamFwd);
    const inFront = _scratchToCam.dot(_scratchCamFwd) > -15.0;

    if (isBeyondFar) {
      this.root.visible = false;
      this.wasTrailCulled = true;
      if (this.tagElement) this.tagElement.style.display = 'none';
      return;
    }
    this.root.visible = true;

    if (isCrashing) {
      if (this.ragdoll.points.length >= 21) {
        this.ragdoll.points[0].pos.copy(this.currentPos);
        const groundY = this.terrainSampler ? this.terrainSampler(this.currentPos.x, this.currentPos.z) : this.currentPos.y;
        this.ragdoll.stepSimulation(groundY);

        this.root.position.copy(this.ragdoll.points[0].pos);
        applyRagdollPose(this.skierRig, this.root, this.ragdoll.points);
      }
    } else if (!isBeyondLOD) {
      // Dynamic procedural animation update within LOD range
      this.animator.update({
        dt,
        speed: this.currentSpeed,
        leanAngle: this.currentLeanAngle,
        isGrounded: this.isGrounded,
        isStaking: this.isStaking,
        isDrifting: this.isDrifting,
        isSlideTurn: this.isSlideTurn,
        isSharpTurn: this.isSharpTurn,
        tuck: this.isTucking,
        jumpVariation: this.currentJumpVariation,
        isSpinning: this.isSpinning,
        spinDirection: this.currentLeanAngle < 0 ? -1.0 : 1.0,
        isFrontFlipping: this.isFrontFlipping,
        isBackFlipping: this.isBackFlipping,
        grabPressed: this.grabPressed
      });
    }

    // Update dedicated Carved Snow Trail for remote skier (cull if beyond LOD or behind camera)
    if (this.trail && !isBeyondLOD && inFront) {
      if (this.wasTrailCulled) {
        this.trail.onRespawn();
        this.wasTrailCulled = false;
      }
      if (terrainSampler) {
        this.trail.setTerrainSampler(terrainSampler);
      }
      _scratchRight.set(1, 0, 0).applyQuaternion(this.currentQuat);
      _scratchNormal.set(0, 1, 0).applyQuaternion(this.currentQuat);
      const slipAngle = this.isDrifting ? 40 : Math.abs(this.currentLeanAngle) * 20;
      this.trail.update(
        this.currentPos,
        _scratchRight,
        _scratchNormal,
        this.isGrounded && !isCrashing && this.movementState !== 2,
        slipAngle,
        this.currentSpeed,
        this.isDrifting,
        this.currentLeanAngle
      );
    } else {
      this.wasTrailCulled = true;
    }

    // Snow spray particles for remote skier (cull if beyond LOD or behind camera)
    if (!isBeyondLOD && inFront) {
      this.updateSnowSpray(dt, isCrashing);
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

      if (!inFront || isBeyondLOD) {
        this.tagElement.style.display = 'none';
      } else {
        _scratchWorldPos.copy(this.currentPos);
        _scratchWorldPos.y += 1.85;
        _scratchProjected.copy(_scratchWorldPos).project(camera);

        // Check if behind camera clipping plane
        if (_scratchProjected.z > 1.0) {
          this.tagElement.style.display = 'none';
        } else {
          const x = (_scratchProjected.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-(_scratchProjected.y * 0.5) + 0.5) * window.innerHeight;
          this.tagElement.style.display = 'flex';
          this.tagElement.style.left = `${x.toFixed(1)}px`;
          this.tagElement.style.top = `${y.toFixed(1)}px`;
        }
      }
    }
  }

  private processSnapshotTransitions(activeSnap: RemoteSkierStateSnapshot): void {
    if (this.trail && this.hasLastSnapshot && activeSnap.time > this.lastSnapshotTime) {
      // Catch any skipped intermediate airborne/crash/teleport snapshots between frames
      for (let i = 0; i < this.snapshots.length; i++) {
        const snap = this.snapshots[i];
        if (snap.time <= this.lastSnapshotTime) continue;
        if (snap.time > activeSnap.time) break;

        if (this.lastSnapshotPos.distanceToSquared(snap.pos) > 225) {
          this.trail.onRespawn();
        } else if (snap.time < activeSnap.time) {
          const snapGrounded = (snap.flags & 0x01) !== 0;
          if (snap.movementState === 3) {
            this.trail.onCrash();
          } else if (!snapGrounded || snap.movementState === 2) {
            this.trail.onJumpStart();
          }
        }
        this.lastSnapshotPos.copy(snap.pos);
        this.lastSnapshotTime = snap.time;
      }
    } else if (!this.hasLastSnapshot) {
      this.lastSnapshotPos.copy(activeSnap.pos);
      this.lastSnapshotTime = activeSnap.time;
      this.hasLastSnapshot = true;
    }
  }

  private applyFlags(
    flags: number,
    movementState: number,
    turnType: number,
    jumpVariation: RemoteJumpVariation
  ): void {
    this.isGrounded = (flags & 0x01) !== 0;
    this.isStaking = (flags & 0x04) !== 0;
    this.isTucking = (flags & 0x08) !== 0;
    this.isSpinning = (flags & 0x10) !== 0;
    this.isFrontFlipping = (flags & 0x20) !== 0;
    this.isBackFlipping = (flags & 0x40) !== 0;
    this.grabPressed = (flags & 0x80) !== 0;
    this.isSlideTurn = turnType === 2;
    this.isSharpTurn = turnType === 1;
    this.isDrifting = turnType === 2 || turnType === 3;
    this.movementState = movementState;
    this.currentJumpVariation = jumpVariation;
  }

  private updateSnowSpray(dt: number, isCrashing: boolean): void {
    if (!this.sprayParticles) return;

    const isEmitting =
      this.isGrounded &&
      this.currentSpeed > 1.5 &&
      (Math.abs(this.currentLeanAngle) > 0.15 || this.isDrifting || isCrashing);

    if (isEmitting) {
      const emitCount = isCrashing ? 4 : (this.isDrifting ? 3 : 1);
      _scratchRight.set(1, 0, 0).applyQuaternion(this.currentQuat);
      const leanSign = this.currentLeanAngle >= 0 ? 1 : -1;
      let emitted = 0;

      for (let i = 0; i < this.sprayCount && emitted < emitCount; i++) {
        if (this.sprayLifetimes[i] <= 0) {
          this.sprayLifetimes[i] = 0.35 + Math.random() * 0.2;
          const idx = i * 3;
          this.sprayPositions[idx] = this.currentPos.x + (Math.random() - 0.5) * 0.3;
          this.sprayPositions[idx + 1] = this.currentPos.y + 0.05;
          this.sprayPositions[idx + 2] = this.currentPos.z + (Math.random() - 0.5) * 0.3;

          const sprayDirX = _scratchRight.x * leanSign * 2.5 + (Math.random() - 0.5) * 1.5;
          const sprayDirZ = _scratchRight.z * leanSign * 2.5 + (Math.random() - 0.5) * 1.5;
          this.sprayVelocities[idx] = sprayDirX;
          this.sprayVelocities[idx + 1] = 1.8 + Math.random() * 1.8;
          this.sprayVelocities[idx + 2] = sprayDirZ;
          emitted++;
        }
      }
    }

    let active = false;
    for (let i = 0; i < this.sprayCount; i++) {
      if (this.sprayLifetimes[i] > 0) {
        this.sprayLifetimes[i] -= dt;
        const idx = i * 3;
        this.sprayPositions[idx] += this.sprayVelocities[idx] * dt;
        this.sprayPositions[idx + 1] += this.sprayVelocities[idx + 1] * dt;
        this.sprayPositions[idx + 2] += this.sprayVelocities[idx + 2] * dt;
        this.sprayVelocities[idx + 1] -= 9.81 * dt;
        active = true;
      } else {
        this.sprayPositions[i * 3 + 1] = -9999;
      }
    }

    if (active) {
      (this.sprayParticles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  public dispose(scene: THREE.Scene): void {
    scene.remove(this.root);
    if (this.trail) {
      this.trail.dispose(scene);
    }
    if (this.sprayParticles) {
      scene.remove(this.sprayParticles);
      this.sprayParticles.geometry.dispose();
      (this.sprayParticles.material as THREE.Material).dispose();
      this.sprayParticles = null;
    }
    if (this.tagElement && this.tagElement.parentNode) {
      this.tagElement.parentNode.removeChild(this.tagElement);
      this.tagElement = null;
    }
  }
}
