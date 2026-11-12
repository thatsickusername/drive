import * as THREE from 'three';

export class DynamicCameraDirector {
  public camera: THREE.PerspectiveCamera;
  private currentPos = new THREE.Vector3();
  private targetPos = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();
  private targetLookAt = new THREE.Vector3();

  // Base off-road trail camera geometry
  private readonly baseFollowDist = 5.2;
  private readonly baseFollowHeight = 2.3;

  // Scratch objects to eliminate GC
  private scratchForward = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();
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
