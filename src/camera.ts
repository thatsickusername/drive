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

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();
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

    // Speed stretch & FOV kick
    const speedRatio = Math.min(1.0, speedKmh / 100.0);
    const targetFov = 60 + speedRatio * 14.0;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
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
