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

  // Scratch objects to eliminate GC
  private scratchForward = new THREE.Vector3();

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
    const forwardX = -Math.sin(heading);
    const forwardZ = -Math.cos(heading);

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
    speedKmh: number
  ): void {
    const forwardX = -Math.sin(heading);
    const forwardZ = -Math.cos(heading);

    // Disciplined FOV: 56° base, scales to 70° only at terminal tuck speeds (>100 km/h)
    const speedRatio = Math.max(0, Math.min(1.0, (speedKmh - 60.0) / 60.0));
    const targetFov = 56.0 + speedRatio * 14.0;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.08);
    this.camera.updateProjectionMatrix();

    const dynamicFollowDist = this.baseFollowDist + speedRatio * 0.8;
    const dynamicFollowHeight = this.baseFollowHeight + speedRatio * 0.2;

    this.targetPos.set(
      riderPos.x - forwardX * dynamicFollowDist,
      riderPos.y + dynamicFollowHeight,
      riderPos.z - forwardZ * dynamicFollowDist
    );

    this.targetLookAt.set(
      riderPos.x + forwardX * 1.8,
      riderPos.y + 0.6,
      riderPos.z + forwardZ * 1.8
    );

    const lerpFactor = 1.0 - Math.exp(-12.0 * dt);
    this.currentPos.lerp(this.targetPos, lerpFactor);
    this.currentLookAt.lerp(this.targetLookAt, lerpFactor);

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentLookAt);
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
