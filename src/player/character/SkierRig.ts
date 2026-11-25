import * as THREE from 'three';
import { SkierPalette, PALETTES } from './SkierPalette';
import {
  createMatteMaterial,
  LoftRing,
  createLoftedGeometry,
  createFlaredCollarGeometry,
  createAlpineSki
} from './SkierGeometry';

export * from './SkierPalette';
export * from './SkierGeometry';
export * from './SkierAnimator';

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
    spine.position.set(0, 0.02, 0);
    neck.position.set(0, 0.535, 0);
    head.position.set(0, 0.036, 0);
    if (joints.leftShoulder) joints.leftShoulder.position.set(0.18, 0.49, 0);
    if (joints.rightShoulder) joints.rightShoulder.position.set(-0.18, 0.49, 0);
    if (joints.leftHip) joints.leftHip.position.set(0.114, -0.025, 0);
    if (joints.rightHip) joints.rightHip.position.set(-0.114, -0.025, 0);
    if (joints.leftKnee) joints.leftKnee.position.set(0, -0.34, 0);
    if (joints.rightKnee) joints.rightKnee.position.set(0, -0.34, 0);
    if (joints.leftAnkle) joints.leftAnkle.position.set(0, -0.325, 0);
    if (joints.rightAnkle) joints.rightAnkle.position.set(0, -0.325, 0);
    Object.values(joints).forEach((joint) => {
      if (!joint || joint.name.endsWith('Pole')) return;
      joint.rotation.set(0, 0, 0);
    });
  }

  // Rotate root 180 deg around Y so character faces -Z in the game coordinate system
  root.rotation.y = Math.PI;

  return { root, joints, materials, footContacts, skis, setPalette, resetPose };
}
