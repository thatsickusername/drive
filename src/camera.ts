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

  // Chase Cam Slope Stabilization Buffer (24-frame rolling filter + deadband)
  private chaseSlopeRingBuffer: number[] = new Array(24).fill(0);
  private chaseSlopeBufferIdx: number = 0;
  private filteredChaseSlopeAngle: number = 0;

  // Over The Hill / Jusant Orbital Collision System
  public settledBehindDistance: number = 12.5; // Active collision-settled orbital distance
  private easeOutDelayTimer: number = 0.0;     // Post-rotation / occlusion delay beat before easing out
  private roofGlideProgress: number = 0.0;     // Roof-glide vertical lift & steep-pitch blend [0, 1]

  // Debug Fly-Cam Mode ([C] Hotkey)
  public isFlyCam: boolean = false;
  public flyCamPos = new THREE.Vector3(0, 460, -720);
  public flyCamYaw: number = 0;
  public flyCamPitch: number = -0.38;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = this.settings.fov;
    this.camera.near = GMACameraConfig.nearFar[0]; // 5.0m
    this.camera.far = 3000.0; // Ensure entire mountain massif and sky dome remain visible
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
    if (newSettings.behindDistance) {
      this.settledBehindDistance = Math.min(this.settledBehindDistance, newSettings.behindDistance);
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

    // Reset chase slope stabilization buffer
    this.chaseSlopeRingBuffer.fill(0);
    this.chaseSlopeBufferIdx = 0;
    this.filteredChaseSlopeAngle = 0;

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
      this.settledBehindDistance = this.settings.behindDistance;
      this.easeOutDelayTimer = 0.0;
      this.roofGlideProgress = 0.0;
      const dist = this.settledBehindDistance;

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
        riderPos.y + 1.2 + eyeElevation,
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
        slopeNormal,
        hasManualLook
      );
    }

    // 5. Final Camera Transform Application & Ground Collision Protection
    if (this.terrainSampler) {
      const curGroundY = this.terrainSampler(this.currentPos.x, this.currentPos.z);
      if (this.currentPos.y < curGroundY + 1.2) {
        this.currentPos.y = curGroundY + 1.2;
      }
    }

    this.camera.position.copy(this.currentPos);
    this.camera.position.y += this.shakeYOffset;
    // [NEW - commented out for testing]
    // if (this.terrainSampler) {
    //   const finalGroundY = this.terrainSampler(this.camera.position.x, this.camera.position.z);
    //   if (this.camera.position.y < finalGroundY + 0.8) {
    //     this.camera.position.y = finalGroundY + 0.8;
    //   }
    // }
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
   * Over The Hill / Jusant Orbital Collision System:
   * 1. Multi-sample line-of-sight terrain probe (player intent vs world constraints).
   * 2. Instant tuck-in on occlusion (pulls inward immediately so geometry never clips).
   * 3. Post-rotation / post-occlusion delay ("brief beat") and smooth ease-out (eliminates wobble).
   * 4. Roof-glide fallback for tight spaces & steep downhill slopes (glides upward over roof/head).
   */
  private updateBehindMode(
    dt: number,
    riderPos: THREE.Vector3,
    heading: number,
    // [NEW - commented out for testing]
    // speedKmh: number,
    // isAirborne: boolean,
    // [OLD - reverted for testing]
    _speedKmh: number,
    _isAirborne: boolean,
    _airTime: number,
    zoomRatio: number,
    slopeNormal?: THREE.Vector3,
    hasManualLook: boolean = false
  ): void {
    const idealDist = this.settings.behindDistance * zoomRatio;

    // 1. Smooth heading follow first so forward azimuth is up-to-date
    let angleDiff = (heading - this.camYaw) % (Math.PI * 2);
    if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.camYaw += angleDiff * Math.min(1.0, this.settings.behindFollowSpeed * dt);

    // Rider forward direction: (-sin(camYaw), 0, -cos(camYaw))
    const fwdX = -Math.sin(this.camYaw);
    const fwdZ = -Math.cos(this.camYaw);

    /* [NEW - commented out for testing]
    // 2. Dynamic slope inclination tracking along travel direction
    let slopePitchRad = 0.0;
    if (!isAirborne && slopeNormal && slopeNormal.y > 0.05) {
      // Projected normal along forward motion vector
      const normalDotFwd = slopeNormal.x * fwdX + slopeNormal.z * fwdZ;
      // When skiing downhill, normalDotFwd > 0, atan2 gives negative pitch angle
      slopePitchRad = Math.atan2(-normalDotFwd, slopeNormal.y);
    }
    // Dynamic slope adjustment: when going downhill (slopePitchRad < 0), lower pitch so camera looks forward-down along the descent,
    // framing the rider from behind and opening up the view of the terrain ahead.
    const dynamicSlopePitch = THREE.MathUtils.clamp(
      slopePitchRad * 0.25,
      -THREE.MathUtils.degToRad(8.0),
      THREE.MathUtils.degToRad(2.0)
    );
    this.smoothedBehindSlopePitch = THREE.MathUtils.damp(
      this.smoothedBehindSlopePitch,
      dynamicSlopePitch,
      1.2,
      dt
    );

    // Speed-dependent pitch lowering: as rider speeds up down the mountain, lower pitch slightly to look further ahead
    const speedRatio = THREE.MathUtils.clamp((speedKmh - 15.0) / 65.0, 0.0, 1.0);
    const speedPitchDelta = -speedRatio * THREE.MathUtils.degToRad(4.0);

    // 3. Pitch bounds: resting angle is settings.behindPitch + dynamic slope offset + speed offset, clamped between min and max
    const minPitchRad = THREE.MathUtils.degToRad(this.settings.behindMinPitch);
    const maxPitchRad = THREE.MathUtils.degToRad(this.settings.behindMaxPitch);
    const basePitchRad = THREE.MathUtils.degToRad(this.settings.behindPitch);
    const targetPitch = THREE.MathUtils.clamp(
      basePitchRad + this.smoothedBehindSlopePitch + speedPitchDelta + this.manualPitchOffset,
      minPitchRad,
      maxPitchRad
    );
    this.camPitch = THREE.MathUtils.damp(this.camPitch, targetPitch, 1.5, dt);

    // 4. Line-of-sight Terrain Clearance & Collision Solver
    const minSafeDist = 3.2; // Absolute minimum radius before player mesh
    // const comfortDist = 6.5; // Threshold below which roof-glide engages
    const focusY = riderPos.y + 1.2; // Rider torso/chest focus anchor
    let safeIdealDist = idealDist;

    if (this.terrainSampler) {
      // Calculate where the camera eye naturally rests (including terrain clearance at eye)
      const testDistH = idealDist * Math.cos(this.camPitch);
      const testEyeX = riderPos.x - fwdX * testDistH;
      const testEyeZ = riderPos.z - fwdZ * testDistH;
      const groundAtTestEye = this.terrainSampler(testEyeX, testEyeZ);
      const testEyeY = Math.max(focusY + idealDist * Math.sin(this.camPitch), groundAtTestEye + 1.4);

      // Probe along the actual line of sight between rider's chest and camera eye
      const numSamples = 10;
      for (let i = 1; i <= numSamples; i++) {
        const t = i / (numSamples + 1); // Sample strictly between rider and eye (0.09 to 0.91)
        const px = THREE.MathUtils.lerp(riderPos.x, testEyeX, t);
        const pz = THREE.MathUtils.lerp(riderPos.z, testEyeZ, t);
        const py = THREE.MathUtils.lerp(focusY, testEyeY, t);

        const groundY = this.terrainSampler(px, pz);
        const clearance = THREE.MathUtils.lerp(0.3, 0.7, t);
        if (py < groundY + clearance) {
          // Convex obstacle or ridge blocks line of sight
          const hitDist = Math.max(minSafeDist, t * idealDist - 0.3);
          if (hitDist < safeIdealDist) {
            safeIdealDist = hitDist;
            break;
          }
        }
      }
    }

    // 5. Roof-Glide Fallback for Tight Spaces
    // When boxed in horizontally by terrain/obstacles behind, smoothly glide upward over the rider's roof
    let roofDemand = 0.0;
    if (safeIdealDist < comfortDist) {
      roofDemand = THREE.MathUtils.clamp((comfortDist - safeIdealDist) / (comfortDist - minSafeDist), 0.0, 1.0);
    }

    if (roofDemand > this.roofGlideProgress) {
      // Gentle responsive roof-glide ascent
      this.roofGlideProgress = THREE.MathUtils.damp(this.roofGlideProgress, roofDemand, 1.8, dt);
    } else {
      // Damped roof-glide descent after obstacle clears
      if (this.easeOutDelayTimer <= 0) {
        this.roofGlideProgress = THREE.MathUtils.damp(this.roofGlideProgress, roofDemand, 1.2, dt);
      }
    }

    // Effective pitch & vertical lift combining standard chase with roof-glide
    const roofPitchRad = THREE.MathUtils.degToRad(this.settings.behindMaxPitch); // Capped to max behind pitch
    const effectivePitch = THREE.MathUtils.lerp(this.camPitch, roofPitchRad, this.roofGlideProgress);
    const roofVerticalLift = this.roofGlideProgress * 2.2;
    const roofAnchorY = focusY + this.roofGlideProgress * 0.8;

    const desiredDist = Math.max(minSafeDist, safeIdealDist);

    // 6. Smooth Damped Distance Follow (no abrupt snaps)
    if (desiredDist < this.settledBehindDistance) {
      // Smooth damped inward pull-in so camera never snaps or jumps abruptly
      this.settledBehindDistance = THREE.MathUtils.damp(
        this.settledBehindDistance,
        desiredDist,
        6.0,
        dt
      );
      this.easeOutDelayTimer = 0.40; // 400ms hold beat
    } else {
      // If user is actively steering or rotating camera, hold beat to eliminate in-out wobble
      if (hasManualLook || Math.abs(angleDiff) > 0.35) {
        this.easeOutDelayTimer = Math.max(this.easeOutDelayTimer, 0.30);
      }

      if (this.easeOutDelayTimer > 0) {
        this.easeOutDelayTimer -= dt;
      } else {
        // Smooth damped ease-out back to optimal distance
        this.settledBehindDistance = THREE.MathUtils.damp(
          this.settledBehindDistance,
          desiredDist,
          2.8,
          dt
        );
      }
    }

    // 8. Forward look-ahead with dynamic speed lead
    const dynamicLookAheadDist = this.settings.behindLookAheadDist + speedRatio * 3.0;
    this.targetLookAt.set(
      riderPos.x + fwdX * dynamicLookAheadDist,
      riderPos.y + this.settings.behindLookAheadHeight + this.roofGlideProgress * 0.4,
      riderPos.z + fwdZ * dynamicLookAheadDist
    );
    */

    // [OLD - reverted for testing]
    // 2. Multi-Stage Slope Inclination Tracking & Bump Rejection
    const rawSlopeAngle = slopeNormal ? Math.acos(THREE.MathUtils.clamp(slopeNormal.y, 0.0, 1.0)) : 0.0;

    // Stage 1: 24-sample (~400ms) moving average rolling buffer to absorb micro-bumps and kickers
    this.chaseSlopeRingBuffer[this.chaseSlopeBufferIdx] = rawSlopeAngle;
    this.chaseSlopeBufferIdx = (this.chaseSlopeBufferIdx + 1) % this.chaseSlopeRingBuffer.length;

    let sumSlope = 0.0;
    for (let i = 0; i < this.chaseSlopeRingBuffer.length; i++) {
      sumSlope += this.chaseSlopeRingBuffer[i];
    }
    const avgSlopeAngle = sumSlope / this.chaseSlopeRingBuffer.length;

    // Stage 2: Deadband threshold filter (ignores slope chatter under 2.5 degrees)
    const deadbandRad = THREE.MathUtils.degToRad(2.5);
    if (Math.abs(avgSlopeAngle - this.filteredChaseSlopeAngle) > deadbandRad) {
      this.filteredChaseSlopeAngle = THREE.MathUtils.damp(
        this.filteredChaseSlopeAngle,
        avgSlopeAngle,
        1.8,
        dt
      );
    }

    // Stage 3: Smoothstep factor between flat (0 deg) and full alpine slope (25 deg)
    const slopeFactor = THREE.MathUtils.smoothstep(this.filteredChaseSlopeAngle, 0.0, THREE.MathUtils.degToRad(25.0));
    let slopePitchRad = 0.0;
    if (slopeNormal && slopeNormal.y > 0.05) {
      // Projected normal along forward motion vector
      const normalDotFwd = slopeNormal.x * fwdX + slopeNormal.z * fwdZ;
      // When skiing downhill, normalDotFwd < 0, atan2 gives negative pitch angle
      slopePitchRad = Math.atan2(-normalDotFwd, slopeNormal.y);
    }
    // Dynamic slope adjustment: when going downhill (slopePitchRad < 0), lower pitch slightly to follow fall-line
    // When going uphill (slopePitchRad > 0), lower pitch so camera looks up towards the crest
    const dynamicSlopePitch = THREE.MathUtils.clamp(
      -slopePitchRad * 0.15,
      -THREE.MathUtils.degToRad(8),
      THREE.MathUtils.degToRad(8)
    ) * slopeFactor;
    this.smoothedBehindSlopePitch = THREE.MathUtils.damp(
      this.smoothedBehindSlopePitch,
      dynamicSlopePitch,
      2.0,
      dt
    );

    // 3. Pitch bounds: resting angle transitions from flat ground up to settings.behindPitch on slopes
    const flatPitchRad = THREE.MathUtils.degToRad(12.0);
    const slopeBasePitchRad = THREE.MathUtils.degToRad(this.settings.behindPitch);
    const basePitchRad = THREE.MathUtils.lerp(flatPitchRad, slopeBasePitchRad, slopeFactor);

    const minPitchRad = THREE.MathUtils.degToRad(this.settings.behindMinPitch);
    const maxPitchRad = THREE.MathUtils.degToRad(this.settings.behindMaxPitch);
    const targetPitch = THREE.MathUtils.clamp(
      basePitchRad + this.smoothedBehindSlopePitch + this.manualPitchOffset,
      minPitchRad,
      maxPitchRad
    );
    this.camPitch = THREE.MathUtils.damp(this.camPitch, targetPitch, 1.2, dt);

    // 4. Over The Hill / Jusant Orbital Clearance & Collision Solver
    const minSafeDist = 3.2; // Absolute minimum radius before player mesh
    // const comfortDist = 6.5; // Threshold below which roof-glide engages
    const focusY = riderPos.y + 1.2; // Rider torso/chest focus anchor
    let safeIdealDist = idealDist;

    if (this.terrainSampler) {
      // Probe along the ideal orbital ray to test for terrain occlusion (10 samples)
      const numSamples = 10;
      for (let i = 1; i <= numSamples; i++) {
        const t = i / numSamples;
        const r = t * idealDist;
        const px = riderPos.x - fwdX * r * Math.cos(this.camPitch);
        const pz = riderPos.z - fwdZ * r * Math.cos(this.camPitch);
        const py = focusY + r * Math.sin(this.camPitch);

        const groundY = this.terrainSampler(px, pz);
        const reqClearance = THREE.MathUtils.lerp(0.5, 1.4, t);
        if (py < groundY + reqClearance) {
          // Occlusion found: limit safe distance along ideal ray
          const hitDist = Math.max(minSafeDist, r - 0.4);
          if (hitDist < safeIdealDist) {
            safeIdealDist = hitDist;
          }
        }
      }
    }

    // 5. Roof-Glide Fallback for Tight Spaces & Steep Downhill Slopes (DISABLED FOR TESTING)
    this.roofGlideProgress = 0.0;
    /*
    let roofDemand = 0.0;
    if (safeIdealDist < comfortDist) {
      roofDemand = THREE.MathUtils.clamp((comfortDist - safeIdealDist) / (comfortDist - minSafeDist), 0.0, 1.0);
    }
    // Skiing down a steep slope (>15 deg) pushes uphill terrain directly behind the camera
    if (slopePitchRad < -0.22) {
      const slopeDemand = THREE.MathUtils.clamp((-slopePitchRad - 0.22) / 0.38, 0.0, 1.0);
      roofDemand = Math.max(roofDemand, slopeDemand);
    }

    if (roofDemand > this.roofGlideProgress) {
      // Fast responsive roof-glide ascent
      this.roofGlideProgress = THREE.MathUtils.damp(this.roofGlideProgress, roofDemand, 8.0, dt);
    } else {
      // Damped roof-glide descent after obstacle clears
      if (this.easeOutDelayTimer <= 0) {
        this.roofGlideProgress = THREE.MathUtils.damp(this.roofGlideProgress, roofDemand, 2.2, dt);
      }
    }
    */

    // Effective pitch & vertical lift combining standard chase with roof-glide
    const roofPitchRad = THREE.MathUtils.degToRad(68.0); // High near-top-down angle
    const effectivePitch = THREE.MathUtils.lerp(this.camPitch, roofPitchRad, this.roofGlideProgress);
    const roofVerticalLift = this.roofGlideProgress * 2.2;
    const roofAnchorY = focusY + this.roofGlideProgress * 0.8;

    // 6. Safe Distance Evaluation along the Effective Roof-Glide Orbit
    let safeRoofDist = idealDist;
    if (this.terrainSampler) {
      const numSamples = 10;
      for (let i = 1; i <= numSamples; i++) {
        const t = i / numSamples;
        const r = t * idealDist;
        const px = riderPos.x - fwdX * r * Math.cos(effectivePitch);
        const pz = riderPos.z - fwdZ * r * Math.cos(effectivePitch);
        const py = roofAnchorY + roofVerticalLift + r * Math.sin(effectivePitch);

        const groundY = this.terrainSampler(px, pz);
        const reqClearance = THREE.MathUtils.lerp(0.5, 1.4, t);
        if (py < groundY + reqClearance) {
          const hitDist = Math.max(minSafeDist, r - 0.4);
          if (hitDist < safeRoofDist) {
            safeRoofDist = hitDist;
          }
        }
      }
    }

    const desiredDist = Math.max(minSafeDist, Math.min(idealDist, safeRoofDist));

    // 7. Asymmetric Timing: Instant Tuck-In on Occlusion vs Delayed Smooth Ease-Out
    if (desiredDist < this.settledBehindDistance) {
      // Instant inward pull-in so camera never clips geometry
      this.settledBehindDistance = desiredDist;
      this.easeOutDelayTimer = 0.40; // 400ms hold beat
    } else {
      // If user is actively steering or rotating camera, hold beat to eliminate in-out wobble
      if (hasManualLook || Math.abs(angleDiff) > 0.35) {
        this.easeOutDelayTimer = Math.max(this.easeOutDelayTimer, 0.30);
      }

      if (this.easeOutDelayTimer > 0) {
        this.easeOutDelayTimer -= dt;
      } else {
        // Smooth damped ease-out back to optimal distance
        this.settledBehindDistance = THREE.MathUtils.damp(
          this.settledBehindDistance,
          desiredDist,
          2.8,
          dt
        );
      }
    }

    // 8. Forward look-ahead
    this.targetLookAt.set(
      riderPos.x + fwdX * this.settings.behindLookAheadDist,
      riderPos.y + this.settings.behindLookAheadHeight + this.roofGlideProgress * 0.4,
      riderPos.z + fwdZ * this.settings.behindLookAheadDist
    );

    // 9. Position Camera along Settled Orbit
    const eyeHorizontalDist = this.settledBehindDistance * Math.cos(effectivePitch);
    const eyeElevation = this.settledBehindDistance * Math.sin(effectivePitch);

    this.targetPos.set(
      riderPos.x - fwdX * eyeHorizontalDist,
      roofAnchorY + roofVerticalLift + eyeElevation,
      riderPos.z - fwdZ * eyeHorizontalDist
    );

    // 10. Secondary Ground Clearance Probing at Camera Eye
    if (this.terrainSampler) {
      const groundAtEye = this.terrainSampler(this.targetPos.x, this.targetPos.z);
      const minEyeClearance = 1.4;
      if (this.targetPos.y < groundAtEye + minEyeClearance) {
        this.targetPos.y = groundAtEye + minEyeClearance;
      }
    }

    const behindLerpRate = 1.0 - Math.pow(1.0 - GMACameraConfig.behind.playerT, dt * 60.0);
    this.currentLookAt.lerp(this.targetLookAt, Math.min(1.0, behindLerpRate));
    this.currentPos.lerp(this.targetPos, Math.min(1.0, behindLerpRate));
  }
}
