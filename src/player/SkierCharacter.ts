import * as THREE from 'three';

/**
 * ============================================================================
 * COLOR PALETTES
 * ============================================================================
 */
export interface SkierPalette {
  jacket: number;
  jacketInner: number;
  beanie: number;
  beanieCuff: number;
  pomPom: number;
  goggleLens: number;
  pants: number;
  skiAccent: number;
}

export const PALETTES: Record<string, SkierPalette> = {
  coral: {
    jacket: 0xe65632,
    jacketInner: 0xc44120,
    beanie: 0x8d959e,
    beanieCuff: 0x767f89,
    pomPom: 0x878f98,
    goggleLens: 0x1c3e66,
    pants: 0x526477,
    skiAccent: 0xe65632
  },
  ochre: {
    jacket: 0xe6a938,
    jacketInner: 0xc48a20,
    beanie: 0x67717d,
    beanieCuff: 0x545d68,
    pomPom: 0x626b76,
    goggleLens: 0x1e3a5f,
    pants: 0x455464,
    skiAccent: 0xe6a938
  },
  glacier: {
    jacket: 0x3b8ea5,
    jacketInner: 0x2a6d80,
    beanie: 0xd95d39,
    beanieCuff: 0xbf4d2c,
    pomPom: 0xcf5634,
    goggleLens: 0x182e4a,
    pants: 0x465566,
    skiAccent: 0x3b8ea5
  },
  pine: {
    jacket: 0x3f7d58,
    jacketInner: 0x2d5e41,
    beanie: 0x8d959e,
    beanieCuff: 0x767f89,
    pomPom: 0x848c96,
    goggleLens: 0x1c3e66,
    pants: 0x495867,
    skiAccent: 0x3f7d58
  }
};

/**
 * Procedural low-poly matte material helper
 */
export function createMatteMaterial(color: number, roughness = 0.88, metalness = 0.02): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: true
  });
}

export interface LoftRing {
  pos: number;
  r1: number;
  r2: number;
  offsetA?: number;
  offsetB?: number;
  twist?: number;
}

/**
 * Creates faceted lofted buffer geometry across a sequence of cross-sectional rings
 */
export function createLoftedGeometry(
  rings: LoftRing[],
  radialSegments = 8,
  axis: 'x' | 'y' = 'y',
  capStart = true,
  capEnd = true
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const ringCount = rings.length;

  for (let i = 0; i < ringCount; i++) {
    const { pos, r1, r2, offsetA = 0, offsetB = 0, twist = 0 } = rings[i];
    for (let j = 0; j < radialSegments; j++) {
      const theta = (j / radialSegments) * Math.PI * 2 + twist;
      if (axis === 'y') {
        const x = offsetA + Math.cos(theta) * r1;
        const z = offsetB + Math.sin(theta) * r2;
        positions.push(x, pos, z);
      } else {
        const y = offsetA + Math.sin(theta) * r1;
        const z = offsetB + Math.cos(theta) * r2;
        positions.push(pos, y, z);
      }
    }
  }

  for (let i = 0; i < ringCount - 1; i++) {
    const rowA = i * radialSegments;
    const rowB = (i + 1) * radialSegments;
    for (let j = 0; j < radialSegments; j++) {
      const nextJ = (j + 1) % radialSegments;
      const a = rowA + j;
      const b = rowB + j;
      const c = rowB + nextJ;
      const d = rowA + nextJ;
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  if (capStart) {
    const r0 = rings[0];
    const centerIdx = positions.length / 3;
    if (axis === 'y') {
      positions.push(r0.offsetA || 0, r0.pos, r0.offsetB || 0);
    } else {
      positions.push(r0.pos, r0.offsetA || 0, r0.offsetB || 0);
    }
    for (let j = 0; j < radialSegments; j++) {
      const nextJ = (j + 1) % radialSegments;
      indices.push(centerIdx, j, nextJ);
    }
  }

  if (capEnd) {
    const rLast = rings[ringCount - 1];
    const lastRow = (ringCount - 1) * radialSegments;
    const centerIdx = positions.length / 3;
    if (axis === 'y') {
      positions.push(rLast.offsetA || 0, rLast.pos, rLast.offsetB || 0);
    } else {
      positions.push(rLast.pos, rLast.offsetA || 0, rLast.offsetB || 0);
    }
    for (let j = 0; j < radialSegments; j++) {
      const nextJ = (j + 1) % radialSegments;
      indices.push(centerIdx, lastRow + nextJ, lastRow + j);
    }
  }

  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates high-neck flared jacket collar geometry
 */
export function createFlaredCollarGeometry(): THREE.BufferGeometry {
  const segs = 12;
  const startBot = -Math.PI * 0.485;
  const endBot = Math.PI * 1.485;
  const startTop = -Math.PI * 0.35;
  const endTop = Math.PI * 1.35;

  const rBottomIn = 0.088;
  const rBottomOut = 0.126;
  const rTopIn = 0.126;
  const rTopOut = 0.162;

  const positions: number[] = [];
  const indices: number[] = [];

  const rings: Array<{
    bo: [number, number, number];
    to: [number, number, number];
    ti: [number, number, number];
    bi: [number, number, number];
  }> = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const aBot = startBot + t * (endBot - startBot);
    const aTop = startTop + t * (endTop - startTop);

    const xb = Math.cos(aBot);
    const zb = -Math.sin(aBot);
    const xt = Math.cos(aTop);
    const zt = -Math.sin(aTop);

    const distFromFront = Math.sin(t * Math.PI);
    const hTop = 0.065 + 0.085 * Math.pow(distFromFront, 0.55);
    const hBot = -0.022 + 0.014 * distFromFront;

    rings.push({
      bo: [xb * rBottomOut, hBot, zb * rBottomOut * 0.94],
      to: [xt * rTopOut, hTop, zt * rTopOut * 0.95],
      ti: [xt * rTopIn, hTop - 0.005, zt * rTopIn * 0.95],
      bi: [xb * rBottomIn, hBot, zb * rBottomIn * 0.94]
    });
  }

  for (let i = 0; i <= segs; i++) {
    positions.push(...rings[i].bo, ...rings[i].to, ...rings[i].ti, ...rings[i].bi);
  }

  const addQuad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, c, a, c, d);
  };

  for (let i = 0; i < segs; i++) {
    const b0 = i * 4;
    const b1 = (i + 1) * 4;
    addQuad(b0 + 0, b1 + 0, b1 + 1, b0 + 1);
    addQuad(b0 + 1, b1 + 1, b1 + 2, b0 + 2);
    addQuad(b0 + 2, b1 + 2, b1 + 3, b0 + 3);
    addQuad(b0 + 3, b1 + 3, b1 + 0, b0 + 0);
  }

  addQuad(0, 1, 2, 3);
  const last = segs * 4;
  addQuad(last + 3, last + 2, last + 1, last + 0);

  let geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds an authentic alpine carving ski matching reference criteria
 * Wider powder sidecut, high-contrast racing sidewalls, prominent upturned shovel tips and twin tails
 */
export function createAlpineSki(
  skiBaseMat: THREE.Material,
  skiAccentMat: THREE.Material,
  bindingMat: THREE.Material,
  enableShadows: (m: THREE.Mesh) => THREE.Mesh
): THREE.Group {
  const skiGroup = new THREE.Group();

  // 1. Main ski plank (length ~1.56m, width 0.142m, thickness 0.034m)
  const mainGeo = new THREE.BoxGeometry(0.142, 0.034, 1.42);
  const mainMesh = enableShadows(new THREE.Mesh(mainGeo, skiBaseMat));
  mainMesh.position.set(0, -0.130, 0.06);
  skiGroup.add(mainMesh);

  // 2. High-visibility top racing cap / graphics layer
  const stripeGeo = new THREE.BoxGeometry(0.106, 0.010, 1.30);
  const stripeMesh = enableShadows(new THREE.Mesh(stripeGeo, skiAccentMat));
  stripeMesh.position.set(0, -0.111, 0.06);
  skiGroup.add(stripeMesh);

  // 3. Upturned front shovel tip (curves gracefully above powder layer to +0.06m)
  const tipGeo = new THREE.BoxGeometry(0.136, 0.028, 0.28);
  const tipMesh = enableShadows(new THREE.Mesh(tipGeo, skiAccentMat));
  tipMesh.position.set(0, -0.092, 0.88);
  tipMesh.rotation.x = -0.32;
  skiGroup.add(tipMesh);

  // 4. Twin-tip tail (slight upturn above trail surface)
  const tailGeo = new THREE.BoxGeometry(0.132, 0.026, 0.22);
  const tailMesh = enableShadows(new THREE.Mesh(tailGeo, skiBaseMat));
  tailMesh.position.set(0, -0.112, -0.73);
  tailMesh.rotation.x = 0.22;
  skiGroup.add(tailMesh);

  // 5. Alpine DIN toe & heel binding blocks mounted atop plank
  const toeBindGeo = new THREE.BoxGeometry(0.102, 0.032, 0.088);
  const toeBind = enableShadows(new THREE.Mesh(toeBindGeo, bindingMat));
  toeBind.position.set(0, -0.097, 0.22);

  const heelBindGeo = new THREE.BoxGeometry(0.102, 0.032, 0.096);
  const heelBind = enableShadows(new THREE.Mesh(heelBindGeo, bindingMat));
  heelBind.position.set(0, -0.097, -0.14);
  skiGroup.add(toeBind, heelBind);

  return skiGroup;
}

export interface SkierJoints {
  hips: THREE.Group;
  spine: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftElbow: THREE.Group;
  leftWrist: THREE.Group;
  rightShoulder: THREE.Group;
  rightElbow: THREE.Group;
  rightWrist: THREE.Group;
  leftHip: THREE.Group;
  leftKnee: THREE.Group;
  leftAnkle: THREE.Group;
  rightHip: THREE.Group;
  rightKnee: THREE.Group;
  rightAnkle: THREE.Group;
  leftPole?: THREE.Group;
  rightPole?: THREE.Group;
  [key: string]: THREE.Group | undefined;
}

export interface SkierCharacter {
  root: THREE.Group;
  joints: SkierJoints;
  materials: Record<string, THREE.Material>;
  footContacts: THREE.Object3D[];
  skis: THREE.Group[];
  setPalette: (key: string) => void;
  resetPose: () => void;
}

/**
 * Builds the articulated low-poly skier character rig
 */
export function buildSkierCharacter(initialPalette: SkierPalette = PALETTES.coral): SkierCharacter {
  const root = new THREE.Group();
  root.name = 'skierRoot';

  const materials: Record<string, THREE.MeshStandardMaterial> = {
    jacket: createMatteMaterial(initialPalette.jacket, 0.86, 0.01),
    jacketInner: createMatteMaterial(initialPalette.jacketInner, 0.90, 0.01),
    pants: createMatteMaterial(initialPalette.pants, 0.88, 0.01),
    beanie: createMatteMaterial(initialPalette.beanie, 0.94, 0.0),
    beanieCuff: createMatteMaterial(initialPalette.beanieCuff, 0.94, 0.0),
    pomPom: createMatteMaterial(initialPalette.pomPom, 0.96, 0.0),
    skin: createMatteMaterial(0xdcc3ae, 0.88, 0.0),
    innerShirt: createMatteMaterial(0x353b44, 0.92, 0.0),
    goggleFrame: createMatteMaterial(0x1f242c, 0.65, 0.05),
    goggleStrap: createMatteMaterial(0x222730, 0.88, 0.0),
    goggleLens: new THREE.MeshStandardMaterial({
      color: initialPalette.goggleLens,
      roughness: 0.42,
      metalness: 0.16,
      flatShading: true
    }),
    glove: createMatteMaterial(0x23272e, 0.85, 0.03),
    boot: createMatteMaterial(0x2b3038, 0.78, 0.04),
    bootSole: createMatteMaterial(0x4c5460, 0.84, 0.03),
    bootAccent: createMatteMaterial(0x8c95a3, 0.80, 0.03),
    skiBase: createMatteMaterial(0x262c36, 0.62, 0.12),
    skiAccent: createMatteMaterial(initialPalette.skiAccent, 0.55, 0.08),
    poleShaft: new THREE.MeshStandardMaterial({
      color: 0x69727e,
      roughness: 0.52,
      metalness: 0.32,
      flatShading: true
    }),
    poleGrip: createMatteMaterial(0x2d333c, 0.86, 0.04),
    poleBasket: createMatteMaterial(0x4a525e, 0.80, 0.04)
  };

  const collarMat = materials.jacket.clone();
  collarMat.side = THREE.DoubleSide;

  const enableShadows = (mesh: THREE.Mesh): THREE.Mesh => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const joints: SkierJoints = {} as SkierJoints;
  const skis: THREE.Group[] = [];
  const footContacts: THREE.Object3D[] = [];

  // 1. Hips (Pelvis pivot at y = 0.82)
  const hips = new THREE.Group();
  hips.name = 'hips';
  hips.position.set(0, 0.82, 0);
  root.add(hips);
  joints.hips = hips;

  const pelvisGeo = createLoftedGeometry(
    [
      { pos: -0.055, r1: 0.168, r2: 0.118 },
      { pos: 0.005, r1: 0.178, r2: 0.125 },
      { pos: 0.055, r1: 0.172, r2: 0.120 }
    ],
    8,
    'y',
    true,
    true
  );
  hips.add(enableShadows(new THREE.Mesh(pelvisGeo, materials.pants)));

  // 2. Spine & Lofted Puffer Jacket Torso
  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.02, 0);
  hips.add(spine);
  joints.spine = spine;

  const torsoGeo = createLoftedGeometry(
    [
      { pos: -0.095, r1: 0.236, r2: 0.162, twist: 0.0 },
      { pos: -0.045, r1: 0.268, r2: 0.184, twist: 0.0 },
      { pos: 0.065, r1: 0.258, r2: 0.178, twist: 0.08 },
      { pos: 0.185, r1: 0.248, r2: 0.174, twist: 0.0 },
      { pos: 0.310, r1: 0.272, r2: 0.186, twist: 0.08 },
      { pos: 0.435, r1: 0.282, r2: 0.184, twist: 0.0 },
      { pos: 0.515, r1: 0.232, r2: 0.158, twist: 0.08 },
      { pos: 0.555, r1: 0.140, r2: 0.124, twist: 0.0 }
    ],
    10,
    'y',
    true,
    true
  );
  spine.add(enableShadows(new THREE.Mesh(torsoGeo, materials.jacket)));

  const collarGeo = createFlaredCollarGeometry();
  const collarMesh = enableShadows(new THREE.Mesh(collarGeo, collarMat));
  collarMesh.position.set(0, 0.538, 0.004);
  spine.add(collarMesh);

  const innerNeckGeo = new THREE.CylinderGeometry(0.084, 0.096, 0.055, 10);
  const innerNeckMesh = enableShadows(new THREE.Mesh(innerNeckGeo, materials.innerShirt));
  innerNeckMesh.position.set(0, 0.542, 0.004);
  spine.add(innerNeckMesh);

  // 3. Neck & Head
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 0.535, 0);
  spine.add(neck);
  joints.neck = neck;

  // Athletic thermal neck gaiter base layer covering neck & base of skull
  const neckGaiterGeo = new THREE.CylinderGeometry(0.080, 0.094, 0.078, 10);
  const neckGaiterMesh = enableShadows(new THREE.Mesh(neckGaiterGeo, materials.innerShirt));
  neckGaiterMesh.position.set(0, 0.034, -0.004);
  neck.add(neckGaiterMesh);

  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.036, 0);
  neck.add(head);
  joints.head = head;

  const headGeo = createLoftedGeometry(
    [
      { pos: 0.0, r1: 0.062, r2: 0.060 },
      { pos: 0.038, r1: 0.106, r2: 0.108, offsetB: 0.008 },
      { pos: 0.102, r1: 0.132, r2: 0.134, offsetB: 0.006 },
      { pos: 0.172, r1: 0.136, r2: 0.138, offsetB: 0.0 },
      { pos: 0.232, r1: 0.120, r2: 0.122, offsetB: -0.004 },
      { pos: 0.270, r1: 0.068, r2: 0.070, offsetB: -0.006 }
    ],
    10,
    'y',
    true,
    true
  );
  head.add(enableShadows(new THREE.Mesh(headGeo, materials.skin)));

  const noseGeo = new THREE.ConeGeometry(0.020, 0.042, 4);
  noseGeo.rotateX(Math.PI * 0.44);
  const noseMesh = enableShadows(new THREE.Mesh(noseGeo, materials.skin));
  noseMesh.position.set(0, 0.114, 0.139);
  head.add(noseMesh);

  const beanieCuffGeo = createLoftedGeometry(
    [
      { pos: 0.110, r1: 0.138, r2: 0.144, offsetB: -0.012 },
      { pos: 0.184, r1: 0.148, r2: 0.150, offsetB: -0.004 },
      { pos: 0.224, r1: 0.152, r2: 0.154, offsetB: -0.005 }
    ],
    10,
    'y',
    true,
    true
  );
  head.add(enableShadows(new THREE.Mesh(beanieCuffGeo, materials.beanieCuff)));

  const beanieDomeGeo = createLoftedGeometry(
    [
      { pos: 0.220, r1: 0.145, r2: 0.147, offsetB: -0.005 },
      { pos: 0.270, r1: 0.136, r2: 0.138, offsetB: -0.006 },
      { pos: 0.318, r1: 0.104, r2: 0.106, offsetB: -0.007 },
      { pos: 0.348, r1: 0.048, r2: 0.049, offsetB: -0.007 }
    ],
    10,
    'y',
    true,
    true
  );
  head.add(enableShadows(new THREE.Mesh(beanieDomeGeo, materials.beanie)));

  const pomGroup = new THREE.Group();
  pomGroup.position.set(0, 0.376, -0.008);
  pomGroup.add(enableShadows(new THREE.Mesh(new THREE.IcosahedronGeometry(0.036, 1), materials.pomPom)));
  const tuftGeo = new THREE.DodecahedronGeometry(0.020, 0);
  const tuftOffsets = [
    [0.022, 0.010, 0.010],
    [-0.022, 0.010, 0.010],
    [0.010, 0.022, -0.012],
    [-0.014, 0.020, -0.012],
    [0, 0.010, 0.022],
    [0, -0.006, -0.022],
    [0.016, -0.008, 0.014],
    [-0.016, -0.008, 0.014]
  ];
  tuftOffsets.forEach(([x, y, z]) => {
    const tuft = enableShadows(new THREE.Mesh(tuftGeo, materials.pomPom));
    tuft.position.set(x, y, z);
    pomGroup.add(tuft);
  });
  head.add(pomGroup);

  // Ski Goggles
  const gogglesGroup = new THREE.Group();
  gogglesGroup.name = 'skiGoggles';
  gogglesGroup.position.set(0, 0.168, 0.004);
  head.add(gogglesGroup);

  const strapGeo = new THREE.CylinderGeometry(0.153, 0.151, 0.040, 12, 1, true);
  const strapMesh = enableShadows(new THREE.Mesh(strapGeo, materials.goggleStrap));
  strapMesh.position.set(0, 0.0, -0.008);
  gogglesGroup.add(strapMesh);

  function createGoggleShape(w: number, hTop: number, hBot: number, notchW: number, notchH: number): THREE.Shape {
    const s = new THREE.Shape();
    s.moveTo(-w * 0.72, hTop);
    s.quadraticCurveTo(0, hTop + 0.006, w * 0.72, hTop);
    s.quadraticCurveTo(w, hTop, w, hTop * 0.35);
    s.lineTo(w * 0.94, -hBot * 0.45);
    s.quadraticCurveTo(w * 0.88, -hBot, w * 0.48, -hBot);
    s.lineTo(notchW, -hBot);
    s.quadraticCurveTo(notchW * 0.55, -hBot + notchH * 0.25, 0, -hBot + notchH);
    s.quadraticCurveTo(-notchW * 0.55, -hBot + notchH * 0.25, -notchW, -hBot);
    s.lineTo(-w * 0.48, -hBot);
    s.quadraticCurveTo(-w * 0.88, -hBot, -w * 0.94, -hBot * 0.45);
    s.lineTo(-w, hTop * 0.35);
    s.quadraticCurveTo(-w, hTop, -w * 0.72, hTop);
    return s;
  }

  const bendGeometry = (geo: THREE.BufferGeometry, radius = 0.24) => {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const curveZ = -(x * x) / (2 * radius);
      pos.setZ(i, z + curveZ);
    }
    geo.computeVertexNormals();
  };

  const frameShape = createGoggleShape(0.140, 0.048, 0.056, 0.042, 0.034);
  let frameGeo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.048,
    bevelEnabled: true,
    bevelThickness: 0.009,
    bevelSize: 0.008,
    bevelSegments: 1,
    curveSegments: 3
  });
  frameGeo.center();
  if (frameGeo.index) frameGeo = frameGeo.toNonIndexed();
  bendGeometry(frameGeo, 0.25);

  const frameMesh = enableShadows(new THREE.Mesh(frameGeo, materials.goggleFrame));
  frameMesh.position.set(0, -0.004, 0.130);
  gogglesGroup.add(frameMesh);

  const lensShape = createGoggleShape(0.124, 0.036, 0.044, 0.036, 0.030);
  let lensGeo: THREE.BufferGeometry = new THREE.ExtrudeGeometry(lensShape, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 1,
    curveSegments: 3
  });
  lensGeo.center();
  if (lensGeo.index) lensGeo = lensGeo.toNonIndexed();
  bendGeometry(lensGeo, 0.24);

  const lensMesh = enableShadows(new THREE.Mesh(lensGeo, materials.goggleLens));
  lensMesh.position.set(0, -0.004, 0.153);
  gogglesGroup.add(lensMesh);

  // 4. Arms, Gloves & Ski Poles
  function buildArm(side: number) {
    const prefix = side > 0 ? 'left' : 'right';

    const shoulder = new THREE.Group();
    shoulder.name = `${prefix}Shoulder`;
    shoulder.position.set(side * 0.236, 0.440, 0);
    spine.add(shoulder);
    joints[`${prefix}Shoulder`] = shoulder;

    // Smooth rounded low-poly deltoid puff to create natural athletic shoulders without sharp points
    const deltoidGeo = new THREE.SphereGeometry(0.092, 10, 8);
    deltoidGeo.scale(1.0, 0.88, 0.95);
    const deltoidMesh = enableShadows(new THREE.Mesh(deltoidGeo, materials.jacket));
    deltoidMesh.position.set(side * 0.015, -0.010, 0);
    shoulder.add(deltoidMesh);

    const upperRings: LoftRing[] = [
      { pos: side * 0.020, r1: 0.088, r2: 0.094, offsetA: -0.005 },
      { pos: side * 0.080, r1: 0.082, r2: 0.088, offsetA: -0.004 },
      { pos: side * 0.150, r1: 0.078, r2: 0.084, offsetA: -0.002 },
      { pos: side * 0.220, r1: 0.076, r2: 0.080, offsetA: 0.000 },
      { pos: side * 0.288, r1: 0.080, r2: 0.084, offsetA: 0.000 }
    ];
    if (side < 0) upperRings.reverse();
    const upperArmGeo = createLoftedGeometry(upperRings, 8, 'x', false, false);
    shoulder.add(enableShadows(new THREE.Mesh(upperArmGeo, materials.jacket)));

    const elbow = new THREE.Group();
    elbow.name = `${prefix}Elbow`;
    elbow.position.set(side * 0.288, 0, 0);
    shoulder.add(elbow);
    joints[`${prefix}Elbow`] = elbow;

    // Smooth rounded low-poly elbow joint to eliminate sharp creases and gaps during arm flexion
    const elbowGeo = new THREE.SphereGeometry(0.082, 10, 8);
    elbowGeo.scale(0.94, 0.94, 0.96);
    const elbowMesh = enableShadows(new THREE.Mesh(elbowGeo, materials.jacket));
    elbowMesh.position.set(0, 0, 0);
    elbow.add(elbowMesh);

    const foreRings: LoftRing[] = [
      { pos: side * 0.000, r1: 0.078, r2: 0.082 },
      { pos: side * 0.054, r1: 0.073, r2: 0.076 },
      { pos: side * 0.118, r1: 0.079, r2: 0.082 },
      { pos: side * 0.184, r1: 0.070, r2: 0.072 },
      { pos: side * 0.248, r1: 0.073, r2: 0.075 },
      { pos: side * 0.304, r1: 0.058, r2: 0.060 }
    ];
    if (side < 0) foreRings.reverse();
    const capStart = side < 0;
    const capEnd = side > 0;
    const foreArmGeo = createLoftedGeometry(foreRings, 8, 'x', capStart, capEnd);
    elbow.add(enableShadows(new THREE.Mesh(foreArmGeo, materials.jacket)));

    const wrist = new THREE.Group();
    wrist.name = `${prefix}Wrist`;
    wrist.position.set(side * 0.304, 0, 0);
    elbow.add(wrist);
    joints[`${prefix}Wrist`] = wrist;

    const gloveGeo = new THREE.IcosahedronGeometry(0.050, 1);
    gloveGeo.scale(1.10, 0.84, 0.90);
    const gloveMesh = enableShadows(new THREE.Mesh(gloveGeo, materials.glove));
    gloveMesh.position.set(side * 0.042, -0.004, 0.004);
    wrist.add(gloveMesh);

    const thumbGeo = new THREE.IcosahedronGeometry(0.021, 0);
    thumbGeo.scale(1.15, 0.88, 1.25);
    const thumbMesh = enableShadows(new THREE.Mesh(thumbGeo, materials.glove));
    thumbMesh.position.set(side * 0.034, -0.020, 0.034);
    wrist.add(thumbMesh);

    // Ski Pole Attached to Hand
    const poleGroup = new THREE.Group();
    poleGroup.name = `${prefix}Pole`;
    poleGroup.position.set(side * 0.046, -0.005, 0.010);
    poleGroup.rotation.z = side * 0.006;
    wrist.add(poleGroup);
    joints[`${prefix}Pole`] = poleGroup;

    const gripGeo = new THREE.CylinderGeometry(0.017, 0.014, 0.136, 7);
    const gripMesh = enableShadows(new THREE.Mesh(gripGeo, materials.poleGrip));
    gripMesh.position.set(0, -0.008, 0);
    poleGroup.add(gripMesh);

    const capGeo = new THREE.CylinderGeometry(0.021, 0.019, 0.020, 7);
    const capMesh = enableShadows(new THREE.Mesh(capGeo, materials.poleGrip));
    capMesh.position.set(0, 0.064, 0);
    poleGroup.add(capMesh);

    const shaftLength = 1.03;
    const shaftGeo = new THREE.CylinderGeometry(0.0095, 0.008, shaftLength, 6);
    const shaftMesh = enableShadows(new THREE.Mesh(shaftGeo, materials.poleShaft));
    shaftMesh.position.set(0, -0.072 - shaftLength / 2, 0);
    poleGroup.add(shaftMesh);

    const basketGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.011, 10);
    const basketMesh = enableShadows(new THREE.Mesh(basketGeo, materials.poleBasket));
    basketMesh.position.set(0, -0.072 - shaftLength + 0.045, 0);
    poleGroup.add(basketMesh);

    const tipGeo = new THREE.ConeGeometry(0.0085, 0.095, 6);
    tipGeo.rotateX(Math.PI);
    const tipMesh = enableShadows(new THREE.Mesh(tipGeo, materials.poleShaft));
    tipMesh.position.set(0, -0.072 - shaftLength - 0.012, 0);
    poleGroup.add(tipMesh);
  }

  buildArm(1);
  buildArm(-1);

  // 5. Legs, Ski Pants, Boots & Dual Alpine Skis
  function buildLeg(side: number) {
    const prefix = side > 0 ? 'left' : 'right';

    const hip = new THREE.Group();
    hip.name = `${prefix}Hip`;
    hip.position.set(side * 0.114, -0.025, 0);
    hips.add(hip);
    joints[`${prefix}Hip`] = hip;

    const thighGeo = createLoftedGeometry(
      [
        { pos: -0.34, r1: 0.092, r2: 0.094, twist: Math.PI / 8 },
        { pos: -0.17, r1: 0.098, r2: 0.100, twist: Math.PI / 8 },
        { pos: 0.03, r1: 0.106, r2: 0.108, twist: Math.PI / 8 }
      ],
      8,
      'y',
      false,
      true
    );
    hip.add(enableShadows(new THREE.Mesh(thighGeo, materials.pants)));

    const knee = new THREE.Group();
    knee.name = `${prefix}Knee`;
    knee.position.set(0, -0.34, 0);
    hip.add(knee);
    joints[`${prefix}Knee`] = knee;

    // Smooth rounded low-poly knee joint to create natural articulated ski pants without sharp points
    const kneeGeo = new THREE.SphereGeometry(0.095, 10, 8);
    kneeGeo.scale(0.96, 1.02, 1.04);
    const kneeMesh = enableShadows(new THREE.Mesh(kneeGeo, materials.pants));
    kneeMesh.position.set(0, 0, 0.006);
    knee.add(kneeMesh);

    const shinGeo = createLoftedGeometry(
      [
        { pos: -0.325, r1: 0.086, r2: 0.088, twist: Math.PI / 8 },
        { pos: -0.16, r1: 0.089, r2: 0.092, twist: Math.PI / 8 },
        { pos: 0.0, r1: 0.092, r2: 0.094, twist: Math.PI / 8 }
      ],
      8,
      'y',
      true,
      false
    );
    knee.add(enableShadows(new THREE.Mesh(shinGeo, materials.pants)));

    const ankle = new THREE.Group();
    ankle.name = `${prefix}Ankle`;
    ankle.position.set(0, -0.325, 0);
    knee.add(ankle);
    joints[`${prefix}Ankle`] = ankle;

    const bootUpperGeo = new THREE.CylinderGeometry(0.070, 0.078, 0.095, 8);
    const bootUpper = enableShadows(new THREE.Mesh(bootUpperGeo, materials.boot));
    bootUpper.position.set(0, -0.025, -0.004);
    ankle.add(bootUpper);

    const bootBodyGeo = createLoftedGeometry(
      [
        { pos: -0.100, r1: 0.080, r2: 0.136, offsetB: 0.042 },
        { pos: -0.052, r1: 0.074, r2: 0.120, offsetB: 0.032 },
        { pos: -0.012, r1: 0.066, r2: 0.090, offsetB: 0.012 }
      ],
      8,
      'y',
      true,
      true
    );
    ankle.add(enableShadows(new THREE.Mesh(bootBodyGeo, materials.boot)));

    const soleGeo = createLoftedGeometry(
      [
        { pos: -0.130, r1: 0.084, r2: 0.142, offsetB: 0.042 },
        { pos: -0.098, r1: 0.086, r2: 0.144, offsetB: 0.042 }
      ],
      8,
      'y',
      true,
      true
    );
    ankle.add(enableShadows(new THREE.Mesh(soleGeo, materials.bootSole)));

    function addInstepStrap(yPos: number, zPos: number, width: number) {
      const strapGroup = new THREE.Group();
      strapGroup.position.set(0, yPos, zPos);
      strapGroup.rotation.x = 0.52;
      const halfGeo = new THREE.BoxGeometry(width * 0.54, 0.016, 0.018);
      const leftHalf = enableShadows(new THREE.Mesh(halfGeo, materials.bootAccent));
      leftHalf.position.set(-width * 0.23, -0.004, 0);
      leftHalf.rotation.z = 0.18;
      const rightHalf = enableShadows(new THREE.Mesh(halfGeo, materials.bootAccent));
      rightHalf.position.set(width * 0.23, -0.004, 0);
      rightHalf.rotation.z = -0.18;
      strapGroup.add(leftHalf, rightHalf);
      ankle.add(strapGroup);
    }

    addInstepStrap(-0.022, 0.106, 0.094);
    addInstepStrap(-0.048, 0.136, 0.106);

    // Alpine Carving Ski Attached to Boot
    const ski = createAlpineSki(materials.skiBase, materials.skiAccent, materials.bootAccent, enableShadows);
    ankle.add(ski);
    skis.push(ski);

    // Grounding Contact Probes (Tip shovel, Forward edge, Center, Back edge, Tail)
    const probeTip = new THREE.Object3D();
    probeTip.position.set(0, -0.147, 0.78);
    const probeFrontIn = new THREE.Object3D();
    probeFrontIn.position.set(-0.065, -0.147, 0.42);
    const probeFrontOut = new THREE.Object3D();
    probeFrontOut.position.set(0.065, -0.147, 0.42);
    const probeInner = new THREE.Object3D();
    probeInner.position.set(-0.065, -0.147, 0.02);
    const probeOuter = new THREE.Object3D();
    probeOuter.position.set(0.065, -0.147, 0.02);
    const probeBackIn = new THREE.Object3D();
    probeBackIn.position.set(-0.065, -0.147, -0.38);
    const probeBackOut = new THREE.Object3D();
    probeBackOut.position.set(0.065, -0.147, -0.38);
    const probeTail = new THREE.Object3D();
    probeTail.position.set(0, -0.147, -0.68);

    ankle.add(
      probeTip,
      probeFrontIn,
      probeFrontOut,
      probeInner,
      probeOuter,
      probeBackIn,
      probeBackOut,
      probeTail
    );
    footContacts.push(
      probeTip,
      probeFrontIn,
      probeFrontOut,
      probeInner,
      probeOuter,
      probeBackIn,
      probeBackOut,
      probeTail
    );
  }

  buildLeg(1);
  buildLeg(-1);

  function setPalette(paletteKey: string) {
    const p = PALETTES[paletteKey];
    if (!p) return;
    materials.jacket.color.setHex(p.jacket);
    collarMat.color.setHex(p.jacket);
    materials.jacketInner.color.setHex(p.jacketInner);
    materials.beanie.color.setHex(p.beanie);
    materials.beanieCuff.color.setHex(p.beanieCuff);
    materials.pomPom.color.setHex(p.pomPom);
    materials.goggleLens.color.setHex(p.goggleLens);
    materials.pants.color.setHex(p.pants);
    materials.skiAccent.color.setHex(p.skiAccent);
  }

  function resetPose() {
    hips.position.set(0, 0.82, 0);
    Object.values(joints).forEach((joint) => {
      if (!joint || joint.name.endsWith('Pole')) return;
      joint.rotation.set(0, 0, 0);
    });
  }

  // Rotate root 180 deg around Y so character faces -Z in the game coordinate system
  root.rotation.y = Math.PI;

  return { root, joints, materials, footContacts, skis, setPalette, resetPose };
}

/**
 * ============================================================================
 * PROCEDURAL DYNAMIC ANIMATOR
 * Blends between Athletic Idle Skiing and Alpine Carving with pole plants
 * ============================================================================
 */
export interface SkierAnimParams {
  dt: number;
  speed: number;
  leanAngle: number;       // -1.0 (left) to +1.0 (right)
  isGrounded: boolean;
  isStaking: boolean;
  isDrifting?: boolean;
  tuck?: boolean;
  inputLeft?: boolean;
  inputRight?: boolean;
  isGliding?: boolean;
}

export class SkierAnimator {
  private skier: SkierCharacter;
  private animTime = 0;
  private carveBlend = 0; // 0 = idle, 1 = carve
  private glideSpread = 0.0; // 0 = normal, 1 = glide legs separated

  // Dedicated deterministic instant pole plant state
  private activePlantSide: 'left' | 'right' | 'none' = 'none';
  private plantTimer = 0.0;
  private prevTurnKey: 'left' | 'right' | 'none' = 'none';
  private audioPlayedForCurrentStroke = false;
  public onPolePlantAudio?: () => void;

  private jointNames = [
    'hips', 'spine', 'neck', 'head',
    'leftShoulder', 'leftElbow', 'leftWrist',
    'rightShoulder', 'rightElbow', 'rightWrist',
    'leftHip', 'leftKnee', 'leftAnkle',
    'rightHip', 'rightKnee', 'rightAnkle'
  ];

  private targets: Record<string, { rx: number; ry: number; rz: number }> = {};
  private hipPosTarget = { x: 0, y: 0.82, z: 0 };
  private hipY = 0.82;

  public get crouchOffset(): number {
    return Math.max(0, 0.82 - this.hipY);
  }

  constructor(skier: SkierCharacter) {
    this.skier = skier;
    this.jointNames.forEach((name) => {
      this.targets[name] = { rx: 0, ry: 0, rz: 0 };
    });
  }

  private clearTargets() {
    this.jointNames.forEach((name) => {
      this.targets[name].rx = 0;
      this.targets[name].ry = 0;
      this.targets[name].rz = 0;
    });
    this.hipPosTarget.x = 0;
    this.hipPosTarget.y = 0.82;
    this.hipPosTarget.z = 0;
  }

  public groundCharacter() {
    // Stable analytical grounding: hips are already positioned stably so skis sit flush on snow
  }

  public update(params: SkierAnimParams): void {
    const clampedDt = Math.min(params.dt, 0.05);
    this.animTime += clampedDt;

    // Detect instantaneous key/stick turn direction
    let currentKey: 'left' | 'right' | 'none' = 'none';
    if (params.inputLeft || -params.leanAngle > 0.15) {
      currentKey = 'left';
    } else if (params.inputRight || -params.leanAngle < -0.15) {
      currentKey = 'right';
    }

    // Trigger instant 0th-frame carving & pole plant when A or D is pressed
    if (currentKey === 'left' && this.prevTurnKey !== 'left') {
      this.activePlantSide = 'left';
      this.plantTimer = 0.0;
      this.audioPlayedForCurrentStroke = false;
      this.carveBlend = Math.max(this.carveBlend, 0.85); // Instant 0th frame carve engagement
    } else if (currentKey === 'right' && this.prevTurnKey !== 'right') {
      this.activePlantSide = 'right';
      this.plantTimer = 0.0;
      this.audioPlayedForCurrentStroke = false;
      this.carveBlend = Math.max(this.carveBlend, 0.85); // Instant 0th frame carve engagement
    } else if (currentKey === 'none') {
      if (this.plantTimer > 0.65) {
        this.activePlantSide = 'none';
      }
    }
    this.prevTurnKey = currentKey;

    // Calculate effective turn signal: +1 = Left Carve, -1 = Right Carve
    const targetTurnDir = currentKey === 'left' ? 1.0 : (currentKey === 'right' ? -1.0 : -params.leanAngle);
    const turnDir = THREE.MathUtils.clamp(targetTurnDir, -1.0, 1.0);
    const steerEffort = Math.abs(turnDir);

    const isCarving = (currentKey !== 'none' || steerEffort > 0.08) && params.isGrounded;
    const targetBlend = isCarving ? 1.0 : 0.0;
    this.carveBlend = THREE.MathUtils.damp(this.carveBlend, targetBlend, currentKey !== 'none' ? 24.0 : 8.0, clampedDt);

    this.clearTargets();

    // 1. Evaluate Idle Stance (Cruising & Breathing) - gentle, smooth
    const breath = Math.sin(this.animTime * 1.45);
    const sway = Math.sin(this.animTime * 0.85);
    const scan = Math.sin(this.animTime * 0.65) + 0.35 * Math.sin(this.animTime * 1.3 + 0.5);

    const idleHipX = 0.025 * sway;
    const idleHipZ = 0.0;
    const idleHipsRx = 0.06;
    const idleHipsRy = 0.025 * sway;
    const idleHipsRz = -0.032 * sway;

    const idleSpineRx = 0.17 + 0.024 * breath + (params.tuck ? 0.18 : 0);
    const idleSpineRy = -0.02 * sway + 0.025 * Math.sin(this.animTime * 0.85 + 0.7);
    const idleSpineRz = 0.024 * sway;

    const idleNeckRx = -0.07 - 0.01 * breath;
    const idleNeckRy = 0.06 * scan;
    const idleNeckRz = 0.01 * sway;

    const idleHeadRx = -0.08 - 0.01 * breath;
    const idleHeadRy = 0.08 * scan;
    const idleHeadRz = -0.015 * Math.sin(this.animTime * 0.65);

    const idleLThigh = -0.28 - 0.02 * sway - (params.tuck ? 0.12 : 0);
    const idleLShin = 0.24 + 0.015 * sway + (params.tuck ? 0.10 : 0);
    const idleRThigh = -0.28 + 0.02 * sway - (params.tuck ? 0.12 : 0);
    const idleRShin = 0.24 - 0.015 * sway + (params.tuck ? 0.10 : 0);

    // 2. Evaluate Dynamic Alpine Carving Targets
    const s = turnDir;
    const p = s * s;
    const leftTurn = Math.max(0, s);
    const rightTurn = Math.max(0, -s);

    // Instant deterministic pole plant progression from 0th frame
    let leftReach = 0;
    let leftPush = 0;
    let rightReach = 0;
    let rightPush = 0;

    if (this.activePlantSide !== 'none') {
      this.plantTimer += clampedDt;
      const t = this.plantTimer;

      // Stroke phase 1: Instant Forward Reach & Plant (0.0s to 0.32s)
      let reachVal = 0;
      if (t <= 0.32) {
        reachVal = Math.sin((t / 0.32) * Math.PI);
        if (t >= 0.12 && !this.audioPlayedForCurrentStroke) {
          if (this.onPolePlantAudio) this.onPolePlantAudio();
          this.audioPlayedForCurrentStroke = true;
        }
      }

      // Stroke phase 2: Push-Through Past Hip (0.22s to 0.64s)
      let pushVal = 0;
      if (t >= 0.22 && t <= 0.64) {
        pushVal = Math.sin(((t - 0.22) / 0.42) * Math.PI);
      }

      if (this.activePlantSide === 'left') {
        leftReach = reachVal;
        leftPush = pushVal;
      } else if (this.activePlantSide === 'right') {
        rightReach = reachVal;
        rightPush = pushVal;
      }

      // Sustained turn: rhythmic re-plant after 1.5s
      if (t > 1.5 && currentKey === this.activePlantSide) {
        this.plantTimer = 0.0;
        this.audioPlayedForCurrentStroke = false;
      }
    }

    const carveHipX = 0.16 * s;
    const carveHipZ = 0.03 * p;
    const carveHipsRx = 0.08 + 0.06 * p;
    const carveHipsRy = 0.26 * s;
    const carveHipsRz = -0.32 * s;

    const carveSpineRx = 0.24 + 0.10 * p + (params.tuck ? 0.15 : 0);
    const carveSpineRy = -0.22 * s;
    const carveSpineRz = 0.25 * s;

    const carveNeckRx = -0.10 - 0.04 * p;
    const carveNeckRy = -0.05 * s;
    const carveNeckRz = 0.04 * s;

    const carveHeadRx = -0.12 - 0.03 * p;
    const carveHeadRy = -0.04 * s;
    const carveHeadRz = 0.05 * s;

    const baseThigh = -0.34 - 0.12 * p;
    const baseShin = 0.26 + 0.10 * p;
    const carveLThigh = baseThigh - 0.22 * leftTurn + 0.06 * rightTurn;
    const carveLShin = baseShin + 0.12 * leftTurn - 0.04 * rightTurn;
    const carveRThigh = baseThigh - 0.22 * rightTurn + 0.06 * leftTurn;
    const carveRShin = baseShin + 0.12 * rightTurn - 0.04 * leftTurn;

    // 3. Blend Idle vs Carving
    const cb = this.carveBlend;
    this.hipPosTarget.x = THREE.MathUtils.lerp(idleHipX, carveHipX, cb);
    this.hipPosTarget.z = THREE.MathUtils.lerp(idleHipZ, carveHipZ, cb);

    // Stable analytical hip height: smooth crouch with knee flexion, zero vertical jitter
    const crouchDrop = 0.035 * p + (params.tuck ? 0.08 : 0);
    this.hipPosTarget.y = 0.82 - crouchDrop;
    this.hipY = THREE.MathUtils.damp(this.hipY, this.hipPosTarget.y, 14.0, clampedDt);

    this.targets.hips.rx = THREE.MathUtils.lerp(idleHipsRx, carveHipsRx, cb);
    this.targets.hips.ry = THREE.MathUtils.lerp(idleHipsRy, carveHipsRy, cb);
    this.targets.hips.rz = THREE.MathUtils.lerp(idleHipsRz, carveHipsRz, cb);

    this.targets.spine.rx = THREE.MathUtils.lerp(idleSpineRx, carveSpineRx, cb);
    this.targets.spine.ry = THREE.MathUtils.lerp(idleSpineRy, carveSpineRy, cb);
    this.targets.spine.rz = THREE.MathUtils.lerp(idleSpineRz, carveSpineRz, cb);

    this.targets.neck.rx = THREE.MathUtils.lerp(idleNeckRx, carveNeckRx, cb);
    this.targets.neck.ry = THREE.MathUtils.lerp(idleNeckRy, carveNeckRy, cb);
    this.targets.neck.rz = THREE.MathUtils.lerp(idleNeckRz, carveNeckRz, cb);

    this.targets.head.rx = THREE.MathUtils.lerp(idleHeadRx, carveHeadRx, cb);
    this.targets.head.ry = THREE.MathUtils.lerp(idleHeadRy, carveHeadRy, cb);
    this.targets.head.rz = THREE.MathUtils.lerp(idleHeadRz, carveHeadRz, cb);

    const lThigh = THREE.MathUtils.lerp(idleLThigh, carveLThigh, cb);
    const lShin = THREE.MathUtils.lerp(idleLShin, carveLShin, cb);
    this.targets.leftHip.rx = lThigh - this.targets.hips.rx;
    this.targets.leftHip.rz = THREE.MathUtils.lerp(-0.018 * sway, -0.14 * s, cb);
    this.targets.leftKnee.rx = lShin - lThigh;
    this.targets.leftAnkle.rx = -lShin;
    this.targets.leftAnkle.rz = THREE.MathUtils.lerp(0, 0.04 * s, cb);

    const rThigh = THREE.MathUtils.lerp(idleRThigh, carveRThigh, cb);
    const rShin = THREE.MathUtils.lerp(idleRShin, carveRShin, cb);
    this.targets.rightHip.rx = rThigh - this.targets.hips.rx;
    this.targets.rightHip.rz = THREE.MathUtils.lerp(-0.018 * sway, -0.14 * s, cb);
    this.targets.rightKnee.rx = rShin - rThigh;
    this.targets.rightAnkle.rx = -rShin;
    this.targets.rightAnkle.rz = THREE.MathUtils.lerp(0, 0.04 * s, cb);

    // 4. Arms & Pole Plants (Idle trailing tuck vs Carving asymmetric plant & balance)
    const idleLShoulderRz = -1.22 + 0.022 * breath;
    const idleLShoulderRx = -0.10;
    const idleLShoulderRy = 0.08 + 0.015 * sway;
    const idleLElbowRy = -0.82;
    const idleLElbowRz = 0.15;
    const idleLWristRx = 1.60 + 0.035 * breath;
    const idleLWristRz = -0.45;

    const idleRShoulderRz = 1.22 - 0.022 * breath;
    const idleRShoulderRx = -0.10;
    const idleRShoulderRy = -0.08 + 0.015 * sway;
    const idleRElbowRy = 0.82;
    const idleRElbowRz = -0.15;
    const idleRWristRx = 1.60 + 0.035 * breath;
    const idleRWristRz = 0.45;

    let carveLShoulderRz: number;
    let carveLShoulderRx: number;
    let carveLShoulderRy: number;
    let carveLElbowRy: number;
    let carveLElbowRz: number;
    let carveLWristRx: number;
    let carveLWristRz: number;

    let carveRShoulderRz: number;
    let carveRShoulderRx: number;
    let carveRShoulderRy: number;
    let carveRElbowRy: number;
    let carveRElbowRz: number;
    let carveRWristRx: number;
    let carveRWristRz: number;

    if (s >= 0) {
      // LEFT TURN: Left arm is active plant; Right arm remains strictly in idle animation
      carveLShoulderRz = -1.16 + 0.18 * leftReach - 0.08 * leftPush;
      carveLShoulderRx = -0.10 - 0.55 * leftReach + 0.58 * leftPush;
      carveLShoulderRy = 0.08 - 0.16 * leftReach + 0.12 * leftPush;
      carveLElbowRy = -0.78 - 0.20 * leftReach + 0.50 * leftPush;
      carveLElbowRz = 0.14 + 0.05 * p;
      carveLWristRx = 1.56 - 0.95 * leftReach + 0.18 * leftPush;
      carveLWristRz = -0.45 + 0.62 * leftReach - 0.12 * leftPush;

      // Right arm stays in idle animation (no new carve animation applied)
      carveRShoulderRz = idleRShoulderRz;
      carveRShoulderRx = idleRShoulderRx;
      carveRShoulderRy = idleRShoulderRy;
      carveRElbowRy = idleRElbowRy;
      carveRElbowRz = idleRElbowRz;
      carveRWristRx = idleRWristRx;
      carveRWristRz = idleRWristRz;
    } else {
      // RIGHT TURN: Right arm is active plant; Left arm remains strictly in idle animation
      carveRShoulderRz = 1.16 - 0.18 * rightReach + 0.08 * rightPush;
      carveRShoulderRx = -0.10 - 0.55 * rightReach + 0.58 * rightPush;
      carveRShoulderRy = -0.08 + 0.16 * rightReach - 0.12 * rightPush;
      carveRElbowRy = 0.78 + 0.20 * rightReach - 0.50 * rightPush;
      carveRElbowRz = -0.14 - 0.05 * p;
      carveRWristRx = 1.56 - 0.95 * rightReach + 0.18 * rightPush;
      carveRWristRz = 0.45 - 0.62 * rightReach + 0.12 * rightPush;

      // Left arm stays in idle animation (no new carve animation applied)
      carveLShoulderRz = idleLShoulderRz;
      carveLShoulderRx = idleLShoulderRx;
      carveLShoulderRy = idleLShoulderRy;
      carveLElbowRy = idleLElbowRy;
      carveLElbowRz = idleLElbowRz;
      carveLWristRx = idleLWristRx;
      carveLWristRz = idleLWristRz;
    }

    this.targets.leftShoulder.rz = THREE.MathUtils.lerp(idleLShoulderRz, carveLShoulderRz, cb);
    this.targets.leftShoulder.rx = THREE.MathUtils.lerp(idleLShoulderRx, carveLShoulderRx, cb);
    this.targets.leftShoulder.ry = THREE.MathUtils.lerp(idleLShoulderRy, carveLShoulderRy, cb);
    this.targets.leftElbow.ry = THREE.MathUtils.lerp(idleLElbowRy, carveLElbowRy, cb);
    this.targets.leftElbow.rz = THREE.MathUtils.lerp(idleLElbowRz, carveLElbowRz, cb);
    this.targets.leftWrist.rx = THREE.MathUtils.lerp(idleLWristRx, carveLWristRx, cb);
    this.targets.leftWrist.rz = THREE.MathUtils.lerp(idleLWristRz, carveLWristRz, cb);

    this.targets.rightShoulder.rz = THREE.MathUtils.lerp(idleRShoulderRz, carveRShoulderRz, cb);
    this.targets.rightShoulder.rx = THREE.MathUtils.lerp(idleRShoulderRx, carveRShoulderRx, cb);
    this.targets.rightShoulder.ry = THREE.MathUtils.lerp(idleRShoulderRy, carveRShoulderRy, cb);
    this.targets.rightElbow.ry = THREE.MathUtils.lerp(idleRElbowRy, carveRElbowRy, cb);
    this.targets.rightElbow.rz = THREE.MathUtils.lerp(idleRElbowRz, carveRElbowRz, cb);
    this.targets.rightWrist.rx = THREE.MathUtils.lerp(idleRWristRx, carveRWristRx, cb);
    this.targets.rightWrist.rz = THREE.MathUtils.lerp(idleRWristRz, carveRWristRz, cb);

    // 5. Special Overrides: Pole Staking on Flat Ground
    if (params.isStaking && params.isGrounded) {
      const stakeSwing = Math.sin(this.animTime * 6.0);
      const isPower = stakeSwing > 0;
      this.targets.leftShoulder.rx = isPower ? -0.45 : 0.40;
      this.targets.rightShoulder.rx = isPower ? -0.45 : 0.40;
      this.targets.leftElbow.ry = isPower ? -0.35 : -0.75;
      this.targets.rightElbow.ry = isPower ? 0.35 : 0.75;
      this.targets.spine.rx += isPower ? 0.12 : -0.04;
    }

    // Glide spread animation blend
    const targetGlideSpread = (!params.isGrounded && params.isGliding) ? 1.0 : 0.0;
    this.glideSpread = THREE.MathUtils.damp(this.glideSpread, targetGlideSpread, 12.0, clampedDt);

    // 6. Special Overrides: Airborne Flight Stance & Glide Fall
    if (!params.isGrounded) {
      if (params.isGliding || this.glideSpread > 0.01) {
        // Glide fall stance: Use idle ski animation with legs separated slightly more to see a visual difference
        const spreadAngle = 0.26 * this.glideSpread;
        this.targets.leftHip.rz = spreadAngle;
        this.targets.rightHip.rz = -spreadAngle;
        this.targets.leftAnkle.rz = -spreadAngle * 0.75;
        this.targets.rightAnkle.rz = spreadAngle * 0.75;
      } else {
        // Standard ballistic jump flight stance
        this.targets.leftShoulder.rz = -1.42;
        this.targets.rightShoulder.rz = 1.42;
        this.targets.leftShoulder.rx = -0.22;
        this.targets.rightShoulder.rx = -0.22;
        this.targets.leftKnee.rx = 0.55;
        this.targets.rightKnee.rx = 0.55;
        this.targets.leftHip.rx = -0.42;
        this.targets.rightHip.rx = -0.42;
      }
    }

    // 7. Special Overrides: Drift Hockey Stop
    if (params.isDrifting && params.isGrounded) {
      this.targets.spine.rx += 0.08;
      this.targets.leftKnee.rx += 0.12;
      this.targets.rightKnee.rx += 0.12;
    }

    // 8. Exponential Damping towards targets
    const blendRate = 1 - Math.exp(-12.0 * clampedDt);

    this.jointNames.forEach((name) => {
      const j = this.skier.joints[name];
      const tgt = this.targets[name];
      if (j && tgt) {
        j.rotation.x += (tgt.rx - j.rotation.x) * blendRate;
        j.rotation.y += (tgt.ry - j.rotation.y) * blendRate;
        j.rotation.z += (tgt.rz - j.rotation.z) * blendRate;
      }
    });

    // Apply stable damped hips (zero vertical 60Hz matrix oscillation)
    this.skier.joints.hips.position.y = this.hipY;
    this.skier.joints.hips.position.x += (this.hipPosTarget.x - this.skier.joints.hips.position.x) * blendRate;
    this.skier.joints.hips.position.z += (this.hipPosTarget.z - this.skier.joints.hips.position.z) * blendRate;

    // Distinct visual separation of legs during glide fall
    const hipSpreadOffset = 0.075 * this.glideSpread;
    if (this.skier.joints.leftHip) {
      this.skier.joints.leftHip.position.x = 0.114 + hipSpreadOffset;
    }
    if (this.skier.joints.rightHip) {
      this.skier.joints.rightHip.position.x = -0.114 - hipSpreadOffset;
    }
  }
}
