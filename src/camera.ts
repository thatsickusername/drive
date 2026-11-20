import * as THREE from 'three';

export class DynamicCameraDirector {
  public camera: THREE.PerspectiveCamera;
  private currentPos = new THREE.Vector3();
  private targetPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // Base off-road trail camera geometry
  private readonly baseFollowDist = 3.6;
  private readonly baseFollowHeight = 1.5;

  // Snowboard Camera Decoupled Heading & Pitch
  public camYaw: number = 0;
  public camPitch: number = 0.1;
  public timeSinceManualLook: number = 0;

  // Scratch objects to eliminate GC
  private scratchForward = new THREE.Vector3();
  private shakeTime: number = 0;

  // Debug Fly-Cam Mode
  public isFlyCam: boolean = false;
  public flyCamPos = new THREE.Vector3(0, 460, -720);
  public flyCamYaw: number = 0; // In radians (0 = looking +Z towards base)
  public flyCamPitch: number = -0.38; // Looking down at massif

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = 56;
    this.camera.updateProjectionMatrix();
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
      this.camera.fov = 60;
      this.camera.updateProjectionMatrix();
    }
    return this.isFlyCam;
  }

  public updateFlyCam(
    dt: number,
    moveForward: number, // -1 to +1
    moveRight: number,   // -1 to +1
    moveUp: number,      // -1 to +1
    yawDelta: number,
    pitchDelta: number
  ): void {
    const flySpeed = 160.0; // Fast flight across 1.5km mountain

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
    this.camYaw = heading;
    this.camPitch = 0.1;
    this.timeSinceManualLook = 999;
    const forwardX = -Math.sin(this.camYaw);
    const forwardZ = -Math.cos(this.camYaw);

    this.currentPos.set(
      riderPos.x - forwardX * this.baseFollowDist,
      riderPos.y + this.baseFollowHeight,
      riderPos.z - forwardZ * this.baseFollowDist
    );
    this.camera.position.copy(this.currentPos);

    this.currentLookAt.set(
      riderPos.x + forwardX * 1.5,
      riderPos.y + 0.6,
      riderPos.z + forwardZ * 1.5
    );
    this.camera.lookAt(this.currentLookAt);
  }

  public updateSnowboard(
    dt: number,
    riderPos: THREE.Vector3,
    heading: number,
    speedKmh: number,
    yawDelta: number = 0,
    pitchDelta: number = 0,
    lateralSlip: number = 0
  ): void {
    const hasManualLook = Math.abs(yawDelta) > 0.0001 || Math.abs(pitchDelta) > 0.0001;

    if (hasManualLook) {
      this.camYaw += yawDelta;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + pitchDelta, -0.65, 0.75);
      this.timeSinceManualLook = 0;
    } else {
      this.timeSinceManualLook += dt;

      // Only catch up if player made a drastic U-turn / 180° and user hasn't moved camera
      let angleDiff = (heading - this.camYaw) % (Math.PI * 2);
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // If rider is facing backwards (> 115° deviation) and untouched for 1.2s, slowly catch up
      if (Math.abs(angleDiff) > 2.0 && this.timeSinceManualLook > 1.2) {
        const catchUpSpeed = 1.2; // Slow, smooth re-alignment
        this.camYaw += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), catchUpSpeed * dt);
      }
    }

    const forwardX = -Math.sin(this.camYaw);
    const forwardZ = -Math.cos(this.camYaw);
    const rightX = forwardZ;
    const rightZ = -forwardX;

    // Step 1: Normalize speed intensity factor early (20 km/h to 58 km/h)
    const speedT = THREE.MathUtils.smoothstep(speedKmh, 20.0, 58.0);

    // Step 3: Dynamic FOV (55° idle -> 80° at speed)
    const targetFov = 55.0 + speedT * 25.0;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1.0, dt * 6.0));
    this.camera.updateProjectionMatrix();

    // Step 3: Ground rush camera height (drops closer to snow at high speed: 3.2m down to 2.1m)
    const heightOffset = THREE.MathUtils.lerp(3.2, 2.1, speedT);
    const dynamicFollowDist = (this.baseFollowDist + speedT * 0.6) * Math.cos(this.camPitch);
    const dynamicFollowHeight = heightOffset + Math.sin(this.camPitch) * 2.2;

    this.targetPos.set(
      riderPos.x - forwardX * dynamicFollowDist,
      riderPos.y + dynamicFollowHeight,
      riderPos.z - forwardZ * dynamicFollowDist
    );

    this.targetLookAt.set(
      riderPos.x + forwardX * 1.8,
      riderPos.y + 0.6 - this.camPitch * 0.5,
      riderPos.z + forwardZ * 1.8
    );

    // Step 2: Asymmetric Elastic Lag (Forward tight: 8.0 - 2.5*speedT; Lateral loose: 2.8)
    const deltaX = this.targetPos.x - this.currentPos.x;
    const deltaZ = this.targetPos.z - this.currentPos.z;
    const deltaFwd = deltaX * forwardX + deltaZ * forwardZ;
    const deltaLat = deltaX * rightX + deltaZ * rightZ;

    const lerpRateFwd = 8.0 - speedT * 2.5;
    const lerpRateLat = 2.8;
    const lerpRateY = 8.0;

    const fwdDamp = 1.0 - Math.exp(-lerpRateFwd * dt);
    const latDamp = 1.0 - Math.exp(-lerpRateLat * dt);
    const yDamp = 1.0 - Math.exp(-lerpRateY * dt);

    this.currentPos.x += forwardX * deltaFwd * fwdDamp + rightX * deltaLat * latDamp;
    this.currentPos.z += forwardZ * deltaFwd * fwdDamp + rightZ * deltaLat * latDamp;
    this.currentPos.y += (this.targetPos.y - this.currentPos.y) * yDamp;

    this.currentLookAt.lerp(this.targetLookAt, 1.0 - Math.exp(-12.0 * dt));

    // Step 3: Snow chatter micro-shake scaled by speedT * (0.3 + lateralSlip * 0.7)
    this.shakeTime += dt * 36.0;
    const slipFactor = Math.min(1.0, lateralSlip / 8.0);
    const shakeAmp = speedT * (0.3 + slipFactor * 0.7) * 0.035;
    const shakeY = Math.sin(this.shakeTime) * Math.cos(this.shakeTime * 1.25) * shakeAmp;
    const shakeRoll = Math.sin(this.shakeTime * 1.6) * shakeAmp * 0.35;

    this.camera.position.copy(this.currentPos);
    this.camera.position.y += shakeY;
    this.camera.lookAt(this.currentLookAt);
    this.camera.rotation.z += shakeRoll;
  }

  public initPosition(carPos: THREE.Vector3, carQuat: THREE.Quaternion): void {
    this.scratchForward.set(0, 0, 1).applyQuaternion(carQuat);

    this.currentPos.set(
      carPos.x - this.scratchForward.x * this.baseFollowDist,
      carPos.y + this.baseFollowHeight,
      carPos.z - this.scratchForward.z * this.baseFollowDist
    );
    this.camera.position.copy(this.currentPos);

    this.currentLookAt.set(
      carPos.x + this.scratchForward.x * 1.5,
      carPos.y + 0.5,
      carPos.z + this.scratchForward.z * 1.5
    );
    this.camera.lookAt(this.currentLookAt);
  }

  public update(
    dt: number,
    carPos: THREE.Vector3,
    carQuat: THREE.Quaternion,
    carLinvel?: THREE.Vector3
  ): void {
    const speed = carLinvel ? Math.hypot(carLinvel.x, carLinvel.z) : 0;

    // 1. Direct chassis forward orientation
    this.scratchForward.set(0, 0, 1).applyQuaternion(carQuat);

    // 2. Subtle speed illusion: gently lags back by at most 0.65m at high speed
    const speedLag = Math.min(0.65, speed * 0.035);
    const dynamicFollowDist = this.baseFollowDist + speedLag;
    const dynamicFollowHeight = this.baseFollowHeight + speedLag * 0.22;

    this.targetPos.set(
      carPos.x - this.scratchForward.x * dynamicFollowDist,
      carPos.y + dynamicFollowHeight,
      carPos.z - this.scratchForward.z * dynamicFollowDist
    );

    // Look-at point centered across hood and trail ahead
    this.targetLookAt.set(
      carPos.x + this.scratchForward.x * 1.5,
      carPos.y + 0.5,
      carPos.z + this.scratchForward.z * 1.5
    );

    // 3. Smooth exponential follow: slightly softer at high speed for subtle speed sensation
    const followTightness = Math.max(10.5, 13.5 - speed * 0.09);
    const lerpFactor = 1.0 - Math.exp(-followTightness * dt);

    this.currentPos.lerp(this.targetPos, lerpFactor);
    this.currentLookAt.lerp(this.targetLookAt, lerpFactor);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
