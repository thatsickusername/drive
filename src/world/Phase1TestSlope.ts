import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export class Phase1TestSlope {
  public group: THREE.Group;
  private colliders: RAPIER.Collider[] = [];

  constructor(
    private scene: THREE.Scene,
    private rapier: typeof RAPIER,
    private world: RAPIER.World
  ) {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildSlope();
    this.buildKickerRamps();
  }

  private buildSlope(): void {
    // Curving downhill slope with berms and halfpipe sides
    // Z from +50 to -350 (400m long), X from -60 to +60 (120m wide)
    const segsX = 60;
    const segsZ = 120;
    const width = 120;
    const length = 400;

    const geom = new THREE.PlaneGeometry(width, length, segsX, segsZ);
    geom.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Downhill profile: starts high at z = +50 (Y = 80m), drops to z = -350 (Y = 0m)
      // Progress from 0 (top) to 1 (bottom)
      const u = (50 - z) / length;

      // S-curve descent with steep mid-section and flat bottom basin
      let y = 0;
      if (u < 0.8) {
        const t = u / 0.8;
        y = 80 * Math.pow(1 - t, 1.8);
      } else {
        y = 0;
      }

      // Halfpipe / bowl curvature on edges (raising sides so player stays on slope)
      const edgeFactor = Math.pow(Math.abs(x) / (width * 0.5), 3);
      y += edgeFactor * 16.0;

      // Natural undulating snow dunes/rolls (Sword of the Sea feel)
      y += Math.sin(z * 0.08) * Math.cos(x * 0.08) * 1.5;

      pos.setY(i, y);
    }

    geom.computeVertexNormals();

    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf0f6ff,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: false
    });

    const mesh = new THREE.Mesh(geom, snowMat);
    mesh.receiveShadow = true;
    this.group.add(mesh);

    // Build Rapier Trimesh collider for exact surface physics
    const vertices = pos.array as Float32Array;
    const indices = geom.index ? new Uint32Array(geom.index.array) : new Uint32Array();

    const colliderDesc = this.rapier.ColliderDesc.trimesh(vertices, indices)
      .setFriction(0.01)
      .setRestitution(0.02);

    const collider = this.world.createCollider(colliderDesc);
    this.colliders.push(collider);
  }

  private buildKickerRamps(): void {
    // Kicker 1: Mid-slope big air jump at (X = -8, Z = -110, Y ~ 32)
    this.createKicker(-8, 30.5, -110, 6, 2.5, 12, 0.35);

    // Kicker 2: Lower-slope hip jump at (X = 12, Z = -210, Y ~ 10)
    this.createKicker(12, 8.5, -210, 7, 3.2, 14, 0.45);
  }

  private createKicker(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    length: number,
    angleRad: number
  ): void {
    const kickerGroup = new THREE.Group();
    kickerGroup.position.set(x, y, z);

    // Wedge geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(0, height);
    shape.closePath();

    const extrudeSettings = {
      depth: width,
      bevelEnabled: false
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Align ramp facing downhill (-Z)
    geom.center();
    geom.rotateY(Math.PI * 0.5);

    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xff6600, // Safety orange lip marker
      roughness: 0.3
    });

    const mesh = new THREE.Mesh(geom, rampMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    kickerGroup.add(mesh);
    this.group.add(kickerGroup);

    // Collider
    const colliderDesc = this.rapier.ColliderDesc.cuboid(width * 0.5, height * 0.5, length * 0.5)
      .setTranslation(x, y + height * 0.5, z)
      .setRotation(new this.rapier.Quaternion(0, Math.sin(angleRad * 0.5), 0, Math.cos(angleRad * 0.5)))
      .setFriction(0.01);

    const collider = this.world.createCollider(colliderDesc);
    this.colliders.push(collider);
  }

  public dispose(): void {
    for (const c of this.colliders) {
      this.world.removeCollider(c, false);
    }
    this.colliders = [];
    this.scene.remove(this.group);
  }
}
