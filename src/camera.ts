import * as THREE from 'three';
import { GMACameraConfig, CameraSettings, defaultCameraSettings } from './config/gmaCameraConfig';

export type CameraPerspectiveMode = 'TOPDOWN' | 'BEHIND';

export class DynamicCameraDirector {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraPerspectiveMode = 'BEHIND';
  public settings: CameraSettings = { ...defaultCameraSettings };

  // Smooth interpolated vectors
  private currentPos = new THREE.Vector3();
  private targetPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // Camera Orientation
  public camYaw: number = 0; // 0 = looking down +Z (downhill fall-line)
  public camPitch: number = THREE.MathUtils.degToRad(20.0); // Resting low chase pitch
  public timeSinceManualLook: number = 999;

  // 10-Sample Terrain Inclination Rolling Buffer
  private inclinationRingBuffer: number[] = new Array(GMACameraConfig.inclination.windowSize).fill(0);
  private inclinationBufferIdx: number = 0;
  private smoothedIncline: number = 0;

  // Touchdown Landing Impact Shake Generator (k=0.9, speed=8, power=0.7)
  private shakeTimer: number = 999.0;
  private shakeAmplitude: number = 0.0;
  private shakeYOffset: number = 0.0;
  private wasAirborne: boolean = false;

  // Flying Dynamics Progress (fade time 2.0s)
  private flyingProgress: number = 0.0;

  // Manual look deflections
  private manualYawOffset: number = 0.0;
  private manualPitchOffset: number = 0.0;

  // Dynamic Chase Slope Pitch & Terrain Sampler
  private smoothedBehindSlopePitch: number = 0.0;
  public terrainSampler?: (x: number, z: number) => number;

  // Debug Fly-Cam Mode ([C] Hotkey)
  public isFlyCam: boolean = false;
  public flyCamPos = new THREE.Vector3(0, 460, -720);
  public flyCamYaw: number = 0;
  public flyCamPitch: number = -0.38;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = this.settings.fov;
    this.camera.near = GMACameraConfig.nearFar[0]; // 5.0m
    this.camera.far = 1200.0; // Ensure entire mountain massif remains visible
    this.camera.updateProjectionMatrix();
  }

  public getSettings(): CameraSettings {
    return this.settings;
  }

  public applySettings(newSettings: Partial<CameraSettings>): void {
    Object.assign(this.settings, newSettings);
    if (newSettings.mode) {
      this.mode = newSettings.mode;
    }
    if (newSettings.fov && !this.isFlyCam) {
      this.camera.fov = newSettings.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.terrainSampler = sampler;
  }

  public setMode(mode: CameraPerspectiveMode): void {
    this.mode = mode;
    this.settings.mode = mode;
  }

  public togglePerspectiveMode(): CameraPerspectiveMode {
    this.mode = this.mode === 'TOPDOWN' ? 'BEHIND' : 'TOPDOWN';
    this.settings.mode = this.mode;
    return this.mode;
  }

  public toggleFlyCam(startPos?: THREE.Vector3): boolean {
    this.isFlyCam = !this.isFlyCam;
    if (this.isFlyCam) {
      if (startPos) {
        this.flyCamPos.set(startPos.x, startPos.y + 60, startPos.z - 80);
      } else {
        this.flyCamPos.set(0, 460, -720);
      }
      this.flyCamYaw = 0;
      this.flyCamPitch = -0.38;
      this.camera.fov = 65;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.fov = GMACameraConfig.baseFov;
      this.camera.updateProjectionMatrix();
    }
    return this.isFlyCam;
  }

  public updateFlyCam(
    dt: number,
    moveForward: number,
    moveRight: number,
    moveUp: number,
    yawDelta: number,
    pitchDelta: number
  ): void {
    const flySpeed = 160.0;

    this.flyCamYaw += yawDelta * 1.8 * dt;
    this.flyCamPitch = Math.max(-1.45, Math.min(1.45, this.flyCamPitch + pitchDelta * 1.8 * dt));

    const forwardX = Math.sin(this.flyCamYaw) * Math.cos(this.flyCamPitch);
    const forwardY = -Math.sin(this.flyCamPitch);
    const forwardZ = Math.cos(this.flyCamYaw) * Math.cos(this.flyCamPitch);

    const rightX = Math.cos(this.flyCamYaw);
    const rightZ = -Math.sin(this.flyCamYaw);

    this.flyCamPos.x += (forwardX * moveForward + rightX * moveRight) * flySpeed * dt;
    this.flyCamPos.y += (forwardY * moveForward + moveUp) * flySpeed * dt;
    this.flyCamPos.z += (forwardZ * moveForward + rightZ * moveRight) * flySpeed * dt;

    this.camera.position.copy(this.flyCamPos);
    this.camera.rotation.set(this.flyCamPitch, this.flyCamYaw, 0, 'YXZ');
  }

  public initSnowboard(riderPos: THREE.Vector3, heading: number): void {
    this.timeSinceManualLook = 999;
    this.manualYawOffset = 0;
    this.manualPitchOffset = 0;
    this.shakeTimer = 999;
    this.shakeAmplitude = 0;
    this.wasAirborne = false;
    this.flyingProgress = 0;

    // Reset 10-sample inclination buffer
    this.inclinationRingBuffer.fill(0);
    this.inclinationBufferIdx = 0;
    this.smoothedIncline = 0;

    if (this.mode === 'TOPDOWN') {
      // In GMA top-down isometric view, yaw aligns with the downhill fall line (0)
      this.camYaw = 0;
      this.camPitch = THREE.MathUtils.degToRad(this.settings.topdownPitch);

      const baseDist = this.settings.topdownDistance;
      const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(this.settings.fov / 2));
      // Focus look-ahead offset placing rider at 15% from bottom of viewport
      const ndcY = 2.0 * GMACameraConfig.playerScreenY - 1.0; // -0.70
      const forwardLeadDist = -ndcY * baseDist * tanHalfFov * GMACameraConfig.topdownOffsetT;

      this.currentLookAt.set(
        riderPos.x,
        riderPos.y,
        riderPos.z + forwardLeadDist
      );

      const eyeElevation = baseDist * Math.sin(this.camPitch);
      const eyeHorizontalDist = baseDist * Math.cos(this.camPitch);

      this.currentPos.set(
        this.currentLookAt.x,
        this.currentLookAt.y + eyeElevation,
        this.currentLookAt.z - eyeHorizontalDist
      );
    } else {
      // GMA Chase (cam.behind) mode
      this.camYaw = heading;
      this.camPitch = THREE.MathUtils.degToRad(this.settings.behindPitch);
      const dist = this.settings.behindDistance;

      const fwdX = -Math.sin(this.camYaw);
      const fwdZ = -Math.cos(this.camYaw);
      const eyeElevation = dist * Math.sin(this.camPitch);
      const eyeHorizontalDist = dist * Math.cos(this.camPitch);

      this.currentLookAt.set(
        riderPos.x + fwdX * this.settings.behindLookAheadDist,
        riderPos.y + this.settings.behindLookAheadHeight,
        riderPos.z + fwdZ * this.settings.behindLookAheadDist
      );

      this.currentPos.set(
        riderPos.x - fwdX * eyeHorizontalDist,
        riderPos.y + eyeElevation,
        riderPos.z - fwdZ * eyeHorizontalDist
      );

      if (this.terrainSampler) {
        const groundAtEye = this.terrainSampler(this.currentPos.x, this.currentPos.z);
        if (this.currentPos.y < groundAtEye + 1.6) {
          this.currentPos.y = groundAtEye + 1.6;
        }
      }
    }

    this.targetPos.copy(this.currentPos);
    this.targetLookAt.copy(this.currentLookAt);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }

  public updateSnowboard(
    dt: number,
    riderPos: THREE.Vector3,
    heading: number,
    speedKmh: number,
    yawDelta: number = 0,
    pitchDelta: number = 0,
    _lateralSlip: number = 0,
    isAirborne: boolean = false,
    leanAngle: number = 0,
    airTime: number = 0,
    _groundDistance: number = 0,
    _pumpKick: number = 0,
    slopeNormal?: THREE.Vector3,
    velocity?: THREE.Vector3
  ): void {
    if (this.isFlyCam) return;

    // 1. Aspect Ratio Zoom Compensation per camera.screen_ratio_zoom: 0.45 0.55 0.95 1
    const aspect = this.camera.aspect || (window.innerWidth / window.innerHeight);
    const zoomRatio = aspect < 1.0 
      ? THREE.MathUtils.lerp(GMACameraConfig.portraitDistanceMul, 1.0, aspect) 
      : 1.0;

    // 2. Manual Look Input Handling
    const hasManualLook = Math.abs(yawDelta) > 0.0001 || Math.abs(pitchDelta) > 0.0001;
    if (hasManualLook) {
      this.manualYawOffset += yawDelta * this.settings.mouseSensitivity;
      this.manualPitchOffset = THREE.MathUtils.clamp(
        this.manualPitchOffset + pitchDelta * this.settings.mouseSensitivity,
        -THREE.MathUtils.degToRad(35),
        THREE.MathUtils.degToRad(35)
      );
      this.timeSinceManualLook = 0;
    } else {
      this.timeSinceManualLook += dt;
      if (this.timeSinceManualLook > 1.2) {
        this.manualYawOffset = THREE.MathUtils.damp(this.manualYawOffset, 0, 3.0, dt);
        this.manualPitchOffset = THREE.MathUtils.damp(this.manualPitchOffset, 0, 3.0, dt);
      }
    }

    // 3. Touchdown Landing Impact Shake Generator (k=0.9, speed=8, power=0.7)
    if (this.wasAirborne && !isAirborne) {
      // Touchdown event: calculate landing impact velocity
      const impactSpeed = velocity ? Math.abs(velocity.y) : airTime * 9.81;
      if (impactSpeed >= GMACameraConfig.shake.start) {
        const excess = impactSpeed - GMACameraConfig.shake.start;
        this.shakeAmplitude = Math.min(1.2, Math.pow(excess, GMACameraConfig.shake.power) * 0.28);
        this.shakeTimer = 0.0;
      }
    }
    this.wasAirborne = isAirborne;

    // Evaluate active shake displacement
    if (this.shakeTimer < 1.5) {
      this.shakeTimer += dt;
      const decay = Math.exp(-GMACameraConfig.shake.k * GMACameraConfig.shake.speed * this.shakeTimer);
      const osc = Math.sin(GMACameraConfig.shake.speed * Math.PI * 2.0 * this.shakeTimer);
      this.shakeYOffset = -this.shakeAmplitude * decay * osc;
    } else {
      this.shakeYOffset = 0.0;
    }

    // 4. Mode Execution
    if (this.mode === 'TOPDOWN') {
      this.updateTopDownMode(
        dt,
        riderPos,
        heading,
        speedKmh,
        isAirborne,
        airTime,
        leanAngle,
        zoomRatio,
        slopeNormal,
        velocity
      );
    } else {
      this.updateBehindMode(
        dt,
        riderPos,
        heading,
        speedKmh,
        isAirborne,
        airTime,
        zoomRatio,
        slopeNormal
      );
    }

    // 5. Final Camera Transform Application & Ground Collision Protection
    if (this.terrainSampler) {
      const curGroundY = this.terrainSampler(this.currentPos.x, this.currentPos.z);
      if (this.currentPos.y < curGroundY + 1.4) {
        this.currentPos.y = curGroundY + 1.4;
      }
    }

    this.camera.position.copy(this.currentPos);
    this.camera.position.y += this.shakeYOffset;
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Authentic GMA Isometric Top-Down Camera Mode
   * Driven by camera.yaml top-down parameters:
   * - camera.degree_range: 38 80
   * - camera.player_screen_y: 0.15
   * - camera.topdown_focus_playerpos_t: 0.99
   * - camera.topdown_offset_t: 0.6
   * - camera.rot_speed_mul: 2.0
   * - camera.inclination_*: 10-sample window, smoothener 0.03, offset 0.01, min -0.2, max 0.4
   * - camera.flying_*: fade time 2.0s, camera dist mul -0.3, offset dist mul -0.15
   */
  private updateTopDownMode(
    dt: number,
    riderPos: THREE.Vector3,
    heading: number,
    _speedKmh: number,
    isAirborne: boolean,
    _airTime: number,
    _leanAngle: number,
    zoomRatio: number,
    slopeNormal?: THREE.Vector3,
    _velocity?: THREE.Vector3
  ): void {
    // 1. Terrain Inclination 10-Sample Rolling Window Filter
    // In GMA, downhill is +Z. Forward terrain tilt: positive when skiing downhill, negative when going up
    let rawIncline = 0.0;
    if (slopeNormal && slopeNormal.y > 0.1) {
      // Angle between ground normal and vertical, projected along downhill fall-line
      rawIncline = Math.asin(THREE.MathUtils.clamp(slopeNormal.z, -0.9, 0.9));
    }
    this.inclinationRingBuffer[this.inclinationBufferIdx] = rawIncline;
    this.inclinationBufferIdx = (this.inclinationBufferIdx + 1) % GMACameraConfig.inclination.windowSize;

    let sumIncline = 0.0;
    for (let i = 0; i < GMACameraConfig.inclination.windowSize; i++) {
      sumIncline += this.inclinationRingBuffer[i];
    }
    const avgIncline = sumIncline / GMACameraConfig.inclination.windowSize;
    const clampedIncline = THREE.MathUtils.clamp(
      avgIncline * GMACameraConfig.inclination.offset * 100.0,
      GMACameraConfig.inclination.min,
      GMACameraConfig.inclination.max
    );
    this.smoothedIncline = THREE.MathUtils.damp(
      this.smoothedIncline,
      clampedIncline,
      1.0 / GMACameraConfig.inclination.smoothener,
      dt
    );

    // 2. Pitch Angle clamped to [38 deg, 80 deg]
    const minPitchRad = THREE.MathUtils.degToRad(GMACameraConfig.degreeRange[0]); // 38 deg = 0.663 rad
    const maxPitchRad = THREE.MathUtils.degToRad(GMACameraConfig.degreeRange[1]); // 80 deg = 1.396 rad
    const neutralPitchRad = THREE.MathUtils.degToRad(50.0); // 50 deg standard isometric tilt
    const targetPitch = THREE.MathUtils.clamp(
      neutralPitchRad + this.smoothedIncline + this.manualPitchOffset,
      minPitchRad,
      maxPitchRad
    );
    this.camPitch = THREE.MathUtils.damp(this.camPitch, targetPitch, 4.0, dt);

    // 3. Fall-Line Heading Alignment with Smooth Course Follow
    // Fall-line in Alvdalen Massif is 0 radians (downhill along +Z)
    //rotSpeedMul = 2.0 allows responsive slight yaw swivel during turns while preserving mountain orientation
    let targetYaw = 0.0;
    const riderYawFromFallLine = heading % (Math.PI * 2);
    // Swivel slightly with rider heading (capped at +/- 25 degrees) so isometric orientation is never flipped
    const maxSwivel = THREE.MathUtils.degToRad(25.0);
    const clampedRiderYaw = THREE.MathUtils.clamp(riderYawFromFallLine, -maxSwivel, maxSwivel);
    targetYaw = clampedRiderYaw * 0.45 * (GMACameraConfig.rotSpeedMul / 2.0) + this.manualYawOffset;
    this.camYaw = THREE.MathUtils.damp(this.camYaw, targetYaw, 3.5, dt);

    // 4. Airborne / Flying Dynamics Progress (fadeTime = 2.0s)
    if (isAirborne) {
      this.flyingProgress = Math.min(GMACameraConfig.flying.fadeTime, this.flyingProgress + dt);
    } else {
      this.flyingProgress = Math.max(0.0, this.flyingProgress - dt * 2.5);
    }
    const flyingT = this.flyingProgress / GMACameraConfig.flying.fadeTime;
    const flyingDistMul = 1.0 + flyingT * GMACameraConfig.flying.cameraDistMul; // down by up to -30%
    const flyingOffsetMul = 1.0 + flyingT * GMACameraConfig.flying.offsetDistMul; // down by up to -15%

    // 5. Distance & Framing (camera.player_screen_y = 0.15)
    const baseDist = this.settings.topdownDistance * zoomRatio * flyingDistMul;
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(this.settings.fov / 2.0));

    // Rider pinned at Y = 15% from bottom of viewport: NDC y = 2 * 0.15 - 1 = -0.70
    // To achieve this, the focus look target is advanced forward along the downhill view vector
    const ndcY = 2.0 * GMACameraConfig.playerScreenY - 1.0; // -0.70
    const forwardLeadDist = -ndcY * baseDist * tanHalfFov * GMACameraConfig.topdownOffsetT * flyingOffsetMul;

    // Look-ahead lead vector along camera forward azimuth
    const fwdX = Math.sin(this.camYaw);
    const fwdZ = Math.cos(this.camYaw);

    this.targetLookAt.set(
      riderPos.x + fwdX * forwardLeadDist,
      riderPos.y + 0.4,
      riderPos.z + fwdZ * forwardLeadDist
    );

    // Camera Eye position placed up and behind the target lookAt
    const eyeElevation = baseDist * Math.sin(this.camPitch);
    const eyeHorizontalDist = baseDist * Math.cos(this.camPitch);

    this.targetPos.set(
      this.targetLookAt.x - fwdX * eyeHorizontalDist,
      this.targetLookAt.y + eyeElevation,
      this.targetLookAt.z - fwdZ * eyeHorizontalDist
    );

    // 6. Top-down Smoothing Filter per camera.yaml (topdown_focus_playerpos_t: 0.99, topdown_offset_t: 0.60)
    const focusLerpRate = 1.0 - Math.pow(1.0 - GMACameraConfig.topdownFocusPlayerPosT, dt * 60.0);
    const posLerpRate = 1.0 - Math.pow(1.0 - GMACameraConfig.topdownOffsetT, dt * 60.0);

    this.currentLookAt.lerp(this.targetLookAt, Math.min(1.0, focusLerpRate));
    this.currentPos.lerp(this.targetPos, Math.min(1.0, posLerpRate));
  }

  /**
   * GMA Chase (cam.behind) Mode
   * Follows rider heading down the slope with dynamic terrain inclination adaptation,
   * forward look-ahead, and active terrain collision avoidance.
   */
  private updateBehindMode(
    dt: number,
    riderPos: THREE.Vector3,
    heading: number,
    _speedKmh: number,
    _isAirborne: boolean,
    _airTime: number,
    zoomRatio: number,
    slopeNormal?: THREE.Vector3
  ): void {
    const behindDist = this.settings.behindDistance * zoomRatio;

    // 1. Smooth heading follow first so forward azimuth is up-to-date
    let angleDiff = (heading - this.camYaw) % (Math.PI * 2);
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.camYaw += angleDiff * Math.min(1.0, this.settings.behindFollowSpeed * dt);

    // Rider forward direction: (-sin(camYaw), 0, -cos(camYaw))
    const fwdX = -Math.sin(this.camYaw);
    const fwdZ = -Math.cos(this.camYaw);

    // 2. Dynamic slope inclination tracking along travel direction
    let slopePitchRad = 0.0;
    if (slopeNormal && slopeNormal.y > 0.05) {
      // Projected normal along forward motion vector
      const normalDotFwd = slopeNormal.x * fwdX + slopeNormal.z * fwdZ;
      // When skiing downhill, normalDotFwd < 0, atan2 gives negative pitch angle
      slopePitchRad = Math.atan2(-normalDotFwd, slopeNormal.y);
    }
    // Dynamic slope adjustment: when going downhill (slopePitchRad < 0), elevate pitch to stay clear above uphill slope
    // When going uphill (slopePitchRad > 0), lower pitch so camera looks up towards the crest
    const dynamicSlopePitch = THREE.MathUtils.clamp(
      -slopePitchRad * 0.70,
      -THREE.MathUtils.degToRad(18),
      THREE.MathUtils.degToRad(28)
    );
    this.smoothedBehindSlopePitch = THREE.MathUtils.damp(
      this.smoothedBehindSlopePitch,
      dynamicSlopePitch,
      3.5,
      dt
    );

    // 3. Pitch bounds: resting angle is settings.behindPitch + dynamic slope offset, clamped between min and max
    const minPitchRad = THREE.MathUtils.degToRad(this.settings.behindMinPitch);
    const maxPitchRad = THREE.MathUtils.degToRad(this.settings.behindMaxPitch + 15.0); // allow dynamic elevation on steep downhills
    const basePitchRad = THREE.MathUtils.degToRad(this.settings.behindPitch);
    const targetPitch = THREE.MathUtils.clamp(
      basePitchRad + this.smoothedBehindSlopePitch + this.manualPitchOffset,
      minPitchRad,
      maxPitchRad
    );
    this.camPitch = THREE.MathUtils.damp(this.camPitch, targetPitch, 4.5, dt);

    // 4. Forward look-ahead: looks ahead down the slope so rider sees upcoming terrain
    this.targetLookAt.set(
      riderPos.x + fwdX * this.settings.behindLookAheadDist,
      riderPos.y + this.settings.behindLookAheadHeight,
      riderPos.z + fwdZ * this.settings.behindLookAheadDist
    );

    const eyeHorizontalDist = behindDist * Math.cos(this.camPitch);
    const eyeElevation = behindDist * Math.sin(this.camPitch);

    this.targetPos.set(
      riderPos.x - fwdX * eyeHorizontalDist,
      riderPos.y + eyeElevation,
      riderPos.z - fwdZ * eyeHorizontalDist
    );

    // 5. Dynamic ground collision avoidance / clearance probing
    if (this.terrainSampler) {
      const groundAtEye = this.terrainSampler(this.targetPos.x, this.targetPos.z);
      const minEyeClearance = 1.6;
      if (this.targetPos.y < groundAtEye + minEyeClearance) {
        this.targetPos.y = groundAtEye + minEyeClearance;
      }
      // Probe halfway between rider and eye to prevent crest clipping
      const midX = (riderPos.x + this.targetPos.x) * 0.5;
      const midZ = (riderPos.z + this.targetPos.z) * 0.5;
      const groundAtMid = this.terrainSampler(midX, midZ);
      if (this.targetPos.y < groundAtMid + 1.3) {
        this.targetPos.y = groundAtMid + 1.3;
      }
    }

    const behindLerpRate = 1.0 - Math.pow(1.0 - GMACameraConfig.behind.playerT, dt * 60.0);
    this.currentLookAt.lerp(this.targetLookAt, Math.min(1.0, behindLerpRate));
    this.currentPos.lerp(this.targetPos, Math.min(1.0, behindLerpRate));
  }
}
