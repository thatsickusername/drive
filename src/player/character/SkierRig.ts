import * as THREE from 'three';
import { SkierPalette, PALETTES } from './SkierPalette';
import {
  createMatteMaterial,
  LoftRing,
  createLoftedGeometry,
  createFlaredCollarGeometry,
  bakePartGeometry,
  mergeBakedParts,
  getMergedSkiGeometry,
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
  slots?: {
    headwear?: THREE.Mesh;
    gogglesFrame?: THREE.Mesh;
    goggleLens?: THREE.Mesh;
  };
  setPalette: (key: string) => void;
  resetPose: () => void;
  setSportVisuals?: (isSnowboard: boolean, hasTwintips: boolean) => void;
  dispose?: () => void;
}

let _sharedCommonMaterials: Record<string, THREE.Material> | null = null;
function getSharedCommonMaterials(): Record<string, THREE.Material> {
  if (!_sharedCommonMaterials) {
    _sharedCommonMaterials = {
      skin: createMatteMaterial(0xdcc3ae, 0.88, 0.0),
      innerShirt: createMatteMaterial(0x353b44, 0.92, 0.0),
      glove: createMatteMaterial(0x23272e, 0.85, 0.03),
      headwearMerged: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.94,
        metalness: 0.0,
        flatShading: true
      }),
      gogglesFrameMerged: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.72,
        metalness: 0.04,
        flatShading: true
      }),
      poleMerged: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.65,
        metalness: 0.22,
        flatShading: true
      }),
      bootMerged: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.80,
        metalness: 0.04,
        flatShading: true
      })
    };
  }
  return _sharedCommonMaterials;
}

const _paletteMaterialsCache = new Map<string, Record<string, THREE.Material>>();
function getCachedPaletteMaterials(paletteKey: string, customPal?: SkierPalette): Record<string, THREE.Material> {
  const pal = customPal || PALETTES[paletteKey] || PALETTES.coral;
  const cacheKey = PALETTES[paletteKey] === pal
    ? paletteKey
    : `custom_${pal.jacket}_${pal.jacketInner}_${pal.pants}_${pal.goggleLens}_${pal.skiAccent}`;
  let mats = _paletteMaterialsCache.get(cacheKey);
  if (!mats) {
    const jacket = createMatteMaterial(pal.jacket, 0.86, 0.01);
    const collarMat = jacket.clone();
    collarMat.side = THREE.DoubleSide;
    mats = {
      jacket,
      collarMat,
      jacketInner: createMatteMaterial(pal.jacketInner, 0.90, 0.01),
      pants: createMatteMaterial(pal.pants, 0.88, 0.01),
      goggleLens: new THREE.MeshStandardMaterial({
        color: pal.goggleLens,
        roughness: 0.42,
        metalness: 0.16,
        flatShading: true
      })
    };
    _paletteMaterialsCache.set(cacheKey, mats);
  }
  return mats;
}

let _sharedGeos: any = null;
function getSharedSkierGeometries() {
  if (!_sharedGeos) {
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

    const upperRingsL: LoftRing[] = [
      { pos: 0.020, r1: 0.088, r2: 0.094, offsetA: -0.005 },
      { pos: 0.080, r1: 0.082, r2: 0.088, offsetA: -0.004 },
      { pos: 0.150, r1: 0.078, r2: 0.084, offsetA: -0.002 },
      { pos: 0.220, r1: 0.076, r2: 0.080, offsetA: 0.000 },
      { pos: 0.288, r1: 0.080, r2: 0.084, offsetA: 0.000 }
    ];
    const upperRingsR: LoftRing[] = [
      { pos: -0.288, r1: 0.080, r2: 0.084, offsetA: 0.000 },
      { pos: -0.220, r1: 0.076, r2: 0.080, offsetA: 0.000 },
      { pos: -0.150, r1: 0.078, r2: 0.084, offsetA: -0.002 },
      { pos: -0.080, r1: 0.082, r2: 0.088, offsetA: -0.004 },
      { pos: -0.020, r1: 0.088, r2: 0.094, offsetA: -0.005 }
    ];

    const foreRingsL: LoftRing[] = [
      { pos: 0.000, r1: 0.078, r2: 0.082 },
      { pos: 0.054, r1: 0.073, r2: 0.076 },
      { pos: 0.118, r1: 0.079, r2: 0.082 },
      { pos: 0.184, r1: 0.070, r2: 0.072 },
      { pos: 0.248, r1: 0.073, r2: 0.075 },
      { pos: 0.304, r1: 0.058, r2: 0.060 }
    ];
    const foreRingsR: LoftRing[] = [
      { pos: -0.304, r1: 0.058, r2: 0.060 },
      { pos: -0.248, r1: 0.073, r2: 0.075 },
      { pos: -0.184, r1: 0.070, r2: 0.072 },
      { pos: -0.118, r1: 0.079, r2: 0.082 },
      { pos: -0.054, r1: 0.073, r2: 0.076 },
      { pos: -0.000, r1: 0.078, r2: 0.082 }
    ];

    const deltoidGeo = new THREE.SphereGeometry(0.092, 10, 8);
    deltoidGeo.scale(1.0, 0.88, 0.95);

    const elbowGeo = new THREE.SphereGeometry(0.082, 10, 8);
    elbowGeo.scale(0.94, 0.94, 0.96);

    const gloveGeo = new THREE.IcosahedronGeometry(0.050, 1);
    gloveGeo.scale(1.10, 0.84, 0.90);

    const thumbGeo = new THREE.IcosahedronGeometry(0.021, 0);
    thumbGeo.scale(1.15, 0.88, 1.25);

    const kneeGeo = new THREE.SphereGeometry(0.095, 10, 8);
    kneeGeo.scale(0.96, 1.02, 1.04);

    const noseGeo = new THREE.ConeGeometry(0.020, 0.042, 4);
    noseGeo.rotateX(Math.PI * 0.44);

    const poleTipGeo = new THREE.ConeGeometry(0.0085, 0.095, 6);
    poleTipGeo.rotateX(Math.PI);

    _sharedGeos = {
      pelvis: createLoftedGeometry(
        [
          { pos: -0.055, r1: 0.168, r2: 0.118 },
          { pos: 0.005, r1: 0.178, r2: 0.125 },
          { pos: 0.055, r1: 0.172, r2: 0.120 }
        ],
        8,
        'y',
        true,
        true
      ),
      torso: createLoftedGeometry(
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
      ),
      collar: createFlaredCollarGeometry(),
      innerNeck: new THREE.CylinderGeometry(0.084, 0.096, 0.055, 10),
      neckGaiter: new THREE.CylinderGeometry(0.080, 0.094, 0.078, 10),
      head: createLoftedGeometry(
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
      ),
      nose: noseGeo,
      beanieCuff: createLoftedGeometry(
        [
          { pos: 0.110, r1: 0.138, r2: 0.144, offsetB: -0.012 },
          { pos: 0.184, r1: 0.148, r2: 0.150, offsetB: -0.004 },
          { pos: 0.224, r1: 0.152, r2: 0.154, offsetB: -0.005 }
        ],
        10,
        'y',
        true,
        true
      ),
      beanieDome: createLoftedGeometry(
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
      ),
      pomPomBase: new THREE.IcosahedronGeometry(0.036, 1),
      pomPomTuft: new THREE.DodecahedronGeometry(0.020, 0),
      goggleStrap: new THREE.CylinderGeometry(0.153, 0.151, 0.040, 12, 1, true),
      goggleFrame: frameGeo,
      goggleLens: lensGeo,
      deltoid: deltoidGeo,
      upperArmLeft: createLoftedGeometry(upperRingsL, 8, 'x', false, false),
      upperArmRight: createLoftedGeometry(upperRingsR, 8, 'x', false, false),
      elbow: elbowGeo,
      foreArmLeft: createLoftedGeometry(foreRingsL, 8, 'x', false, true),
      foreArmRight: createLoftedGeometry(foreRingsR, 8, 'x', true, false),
      glove: gloveGeo,
      thumb: thumbGeo,
      poleGrip: new THREE.CylinderGeometry(0.017, 0.014, 0.136, 7),
      poleCap: new THREE.CylinderGeometry(0.021, 0.019, 0.020, 7),
      poleShaft: new THREE.CylinderGeometry(0.0095, 0.008, 1.03, 6),
      poleBasket: new THREE.CylinderGeometry(0.045, 0.045, 0.011, 10),
      poleTip: poleTipGeo,
      thigh: createLoftedGeometry(
        [
          { pos: -0.34, r1: 0.092, r2: 0.094, twist: Math.PI / 8 },
          { pos: -0.17, r1: 0.098, r2: 0.100, twist: Math.PI / 8 },
          { pos: 0.03, r1: 0.106, r2: 0.108, twist: Math.PI / 8 }
        ],
        8,
        'y',
        false,
        true
      ),
      knee: kneeGeo,
      shin: createLoftedGeometry(
        [
          { pos: -0.325, r1: 0.086, r2: 0.088, twist: Math.PI / 8 },
          { pos: -0.16, r1: 0.089, r2: 0.092, twist: Math.PI / 8 },
          { pos: 0.0, r1: 0.092, r2: 0.094, twist: Math.PI / 8 }
        ],
        8,
        'y',
        true,
        false
      ),
      bootUpper: new THREE.CylinderGeometry(0.070, 0.078, 0.095, 8),
      bootBody: createLoftedGeometry(
        [
          { pos: -0.100, r1: 0.080, r2: 0.136, offsetB: 0.042 },
          { pos: -0.052, r1: 0.074, r2: 0.120, offsetB: 0.032 },
          { pos: -0.012, r1: 0.066, r2: 0.090, offsetB: 0.012 }
        ],
        8,
        'y',
        true,
        true
      ),
      sole: createLoftedGeometry(
        [
          { pos: -0.130, r1: 0.084, r2: 0.142, offsetB: 0.042 },
          { pos: -0.098, r1: 0.086, r2: 0.144, offsetB: 0.042 }
        ],
        8,
        'y',
        true,
        true
      )
    };
  }
  return _sharedGeos;
}

let _mergedStaticRigGeos: {
  headBase: THREE.BufferGeometry;
  gogglesFrame: THREE.BufferGeometry;
  shoulderLeft: THREE.BufferGeometry;
  shoulderRight: THREE.BufferGeometry;
  elbowLeft: THREE.BufferGeometry;
  elbowRight: THREE.BufferGeometry;
  wristLeft: THREE.BufferGeometry;
  wristRight: THREE.BufferGeometry;
  pole: THREE.BufferGeometry;
  kneeShin: THREE.BufferGeometry;
  boot: THREE.BufferGeometry;
} | null = null;

function bakeInstepStrapHalf(
  halfGeo: THREE.BufferGeometry,
  yPos: number,
  zPos: number,
  width: number,
  sideSign: number,
  colorHex: number
): THREE.BufferGeometry {
  const baked = bakePartGeometry(halfGeo, undefined, undefined, colorHex);
  const groupMat = new THREE.Matrix4().makeRotationX(0.52).setPosition(0, yPos, zPos);
  const halfMat = new THREE.Matrix4()
    .makeRotationZ(sideSign * -0.18)
    .setPosition(sideSign * width * 0.23, -0.004, 0);
  baked.applyMatrix4(groupMat.multiply(halfMat));
  return baked;
}

function getSharedMergedStaticRigGeometries() {
  if (!_mergedStaticRigGeos) {
    const geos = getSharedSkierGeometries();
    const shaftLength = 1.03;

    const strapUpperGeo = new THREE.BoxGeometry(0.094 * 0.54, 0.016, 0.018);
    const strapLowerGeo = new THREE.BoxGeometry(0.106 * 0.54, 0.016, 0.018);
    const bootGeo = mergeBakedParts([
      bakePartGeometry(geos.bootUpper, [0, -0.025, -0.004], undefined, 0x2b3038),
      bakePartGeometry(geos.bootBody, undefined, undefined, 0x2b3038),
      bakePartGeometry(geos.sole, undefined, undefined, 0x4c5460),
      bakeInstepStrapHalf(strapUpperGeo, -0.022, 0.106, 0.094, -1, 0x8c95a3),
      bakeInstepStrapHalf(strapUpperGeo, -0.022, 0.106, 0.094, 1, 0x8c95a3),
      bakeInstepStrapHalf(strapLowerGeo, -0.048, 0.136, 0.106, -1, 0x8c95a3),
      bakeInstepStrapHalf(strapLowerGeo, -0.048, 0.136, 0.106, 1, 0x8c95a3)
    ]);
    strapUpperGeo.dispose();
    strapLowerGeo.dispose();

    _mergedStaticRigGeos = {
      headBase: mergeBakedParts([
        bakePartGeometry(geos.head),
        bakePartGeometry(geos.nose, [0, 0.114, 0.139])
      ]),
      gogglesFrame: mergeBakedParts([
        bakePartGeometry(geos.goggleStrap, [0, 0.0, -0.008], undefined, 0x222730),
        bakePartGeometry(geos.goggleFrame, [0, -0.004, 0.130], undefined, 0x1f242c)
      ]),
      shoulderLeft: mergeBakedParts([
        bakePartGeometry(geos.deltoid, [0.015, -0.010, 0]),
        bakePartGeometry(geos.upperArmLeft)
      ]),
      shoulderRight: mergeBakedParts([
        bakePartGeometry(geos.deltoid, [-0.015, -0.010, 0]),
        bakePartGeometry(geos.upperArmRight)
      ]),
      elbowLeft: mergeBakedParts([
        bakePartGeometry(geos.elbow),
        bakePartGeometry(geos.foreArmLeft)
      ]),
      elbowRight: mergeBakedParts([
        bakePartGeometry(geos.elbow),
        bakePartGeometry(geos.foreArmRight)
      ]),
      wristLeft: mergeBakedParts([
        bakePartGeometry(geos.glove, [0.042, -0.004, 0.004]),
        bakePartGeometry(geos.thumb, [0.034, -0.020, 0.034])
      ]),
      wristRight: mergeBakedParts([
        bakePartGeometry(geos.glove, [-0.042, -0.004, 0.004]),
        bakePartGeometry(geos.thumb, [-0.034, -0.020, 0.034])
      ]),
      pole: mergeBakedParts([
        bakePartGeometry(geos.poleGrip, [0, -0.008, 0], undefined, 0x2d333c),
        bakePartGeometry(geos.poleCap, [0, 0.064, 0], undefined, 0x2d333c),
        bakePartGeometry(geos.poleShaft, [0, -0.072 - shaftLength / 2, 0], undefined, 0x69727e),
        bakePartGeometry(geos.poleBasket, [0, -0.072 - shaftLength + 0.045, 0], undefined, 0x4a525e),
        bakePartGeometry(geos.poleTip, [0, -0.072 - shaftLength - 0.012, 0], undefined, 0x69727e)
      ]),
      kneeShin: mergeBakedParts([
        bakePartGeometry(geos.knee, [0, 0, 0.006]),
        bakePartGeometry(geos.shin)
      ]),
      boot: bootGeo
    };
  }
  return _mergedStaticRigGeos;
}

const _pomTuftOffsets: readonly [number, number, number][] = [
  [0.022, 0.010, 0.010],
  [-0.022, 0.010, 0.010],
  [0.010, 0.022, -0.012],
  [-0.014, 0.020, -0.012],
  [0, 0.010, 0.022],
  [0, -0.006, -0.022],
  [0.016, -0.008, 0.014],
  [-0.016, -0.008, 0.014]
];

const _headwearGeoCache = new Map<string, THREE.BufferGeometry>();
function getCachedHeadwearGeometry(pal: SkierPalette): THREE.BufferGeometry {
  const key = `${pal.beanie}_${pal.beanieCuff}_${pal.pomPom}`;
  let cached = _headwearGeoCache.get(key);
  if (!cached) {
    const geos = getSharedSkierGeometries();
    const parts: THREE.BufferGeometry[] = [
      bakePartGeometry(geos.beanieCuff, undefined, undefined, pal.beanieCuff),
      bakePartGeometry(geos.beanieDome, undefined, undefined, pal.beanie),
      bakePartGeometry(geos.pomPomBase, [0, 0.376, -0.008], undefined, pal.pomPom)
    ];
    for (let i = 0; i < _pomTuftOffsets.length; i++) {
      const [x, y, z] = _pomTuftOffsets[i];
      parts.push(bakePartGeometry(geos.pomPomTuft, [x, 0.376 + y, -0.008 + z], undefined, pal.pomPom));
    }
    cached = mergeBakedParts(parts);
    _headwearGeoCache.set(key, cached);
  }
  return cached;
}

/**
 * Detaches a character rig from the scene without disposing shared module-level caches.
 */
export function disposeCharacter(character: SkierCharacter): void {
  if (character.root.parent) {
    character.root.parent.remove(character.root);
  }
  character.footContacts.length = 0;
  character.skis.length = 0;
}

/**
 * Builds the articulated low-poly skier character rig
 */
export function buildSkierCharacter(
  initialPalette: SkierPalette = PALETTES.coral,
  initialPaletteKey = 'coral'
): SkierCharacter {
  const root = new THREE.Group();
  root.name = 'skierRoot';

  const geos = getSharedSkierGeometries();
  const mergedStatic = getSharedMergedStaticRigGeometries();
  const commonMats = getSharedCommonMaterials();
  let currentPalette = initialPalette;
  let currentHasTwintips = true;
  const palMats = getCachedPaletteMaterials(initialPaletteKey, initialPalette);

  const materials: Record<string, THREE.Material> = {
    ...commonMats,
    ...palMats
  };

  const enableShadows = (mesh: THREE.Mesh): THREE.Mesh => {
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    return mesh;
  };

  const joints: SkierJoints = {} as SkierJoints;
  const skis: THREE.Group[] = [];
  const skiMeshes: THREE.Mesh[] = [];
  const footContacts: THREE.Object3D[] = [];

  // Track meshes whose materials belong to the palette
  const paletteMeshes: {
    jacket: THREE.Mesh[];
    collar: THREE.Mesh[];
    pants: THREE.Mesh[];
    goggleLens: THREE.Mesh[];
  } = {
    jacket: [],
    collar: [],
    pants: [],
    goggleLens: []
  };

  // 1. Hips (Pelvis pivot at y = 0.82)
  const hips = new THREE.Group();
  hips.name = 'hips';
  hips.position.set(0, 0.82, 0);
  root.add(hips);
  joints.hips = hips;

  const pelvisMesh = enableShadows(new THREE.Mesh(geos.pelvis, materials.pants));
  hips.add(pelvisMesh);
  paletteMeshes.pants.push(pelvisMesh);

  // 2. Spine & Lofted Puffer Jacket Torso
  const spine = new THREE.Group();
  spine.name = 'spine';
  spine.position.set(0, 0.02, 0);
  hips.add(spine);
  joints.spine = spine;

  const torsoMesh = enableShadows(new THREE.Mesh(geos.torso, materials.jacket));
  spine.add(torsoMesh);
  paletteMeshes.jacket.push(torsoMesh);

  const collarMesh = enableShadows(new THREE.Mesh(geos.collar, materials.collarMat));
  collarMesh.position.set(0, 0.538, 0.004);
  spine.add(collarMesh);
  paletteMeshes.collar.push(collarMesh);

  const innerNeckMesh = enableShadows(new THREE.Mesh(geos.innerNeck, materials.innerShirt));
  innerNeckMesh.position.set(0, 0.542, 0.004);
  spine.add(innerNeckMesh);

  // 3. Neck & Head (merged headBase + swappable headwear & goggles slots)
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 0.535, 0);
  spine.add(neck);
  joints.neck = neck;

  const neckGaiterMesh = enableShadows(new THREE.Mesh(geos.neckGaiter, materials.innerShirt));
  neckGaiterMesh.position.set(0, 0.034, -0.004);
  neck.add(neckGaiterMesh);

  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.036, 0);
  neck.add(head);
  joints.head = head;

  const headBaseMesh = enableShadows(new THREE.Mesh(mergedStatic.headBase, materials.skin));
  head.add(headBaseMesh);

  const headwearMesh = enableShadows(
    new THREE.Mesh(getCachedHeadwearGeometry(currentPalette), materials.headwearMerged)
  );
  headwearMesh.name = 'headwearSlot';
  head.add(headwearMesh);

  // Ski Goggles Slot
  const gogglesGroup = new THREE.Group();
  gogglesGroup.name = 'skiGoggles';
  gogglesGroup.position.set(0, 0.168, 0.004);
  head.add(gogglesGroup);

  const gogglesFrameMesh = enableShadows(
    new THREE.Mesh(mergedStatic.gogglesFrame, materials.gogglesFrameMerged)
  );
  gogglesGroup.add(gogglesFrameMesh);

  const lensMesh = enableShadows(new THREE.Mesh(geos.goggleLens, materials.goggleLens));
  lensMesh.position.set(0, -0.004, 0.153);
  gogglesGroup.add(lensMesh);
  paletteMeshes.goggleLens.push(lensMesh);

  // 4. Arms, Gloves & Merged Ski Poles
  function buildArm(side: number) {
    const isLeft = side > 0;
    const prefix = isLeft ? 'left' : 'right';

    const shoulder = new THREE.Group();
    shoulder.name = `${prefix}Shoulder`;
    shoulder.position.set(side * 0.236, 0.440, 0);
    spine.add(shoulder);
    joints[`${prefix}Shoulder`] = shoulder;

    const upperArmMesh = enableShadows(
      new THREE.Mesh(isLeft ? mergedStatic.shoulderLeft : mergedStatic.shoulderRight, materials.jacket)
    );
    shoulder.add(upperArmMesh);
    paletteMeshes.jacket.push(upperArmMesh);

    const elbow = new THREE.Group();
    elbow.name = `${prefix}Elbow`;
    elbow.position.set(side * 0.288, 0, 0);
    shoulder.add(elbow);
    joints[`${prefix}Elbow`] = elbow;

    const foreArmMesh = enableShadows(
      new THREE.Mesh(isLeft ? mergedStatic.elbowLeft : mergedStatic.elbowRight, materials.jacket)
    );
    elbow.add(foreArmMesh);
    paletteMeshes.jacket.push(foreArmMesh);

    const wrist = new THREE.Group();
    wrist.name = `${prefix}Wrist`;
    wrist.position.set(side * 0.304, 0, 0);
    elbow.add(wrist);
    joints[`${prefix}Wrist`] = wrist;

    const gloveMesh = enableShadows(
      new THREE.Mesh(isLeft ? mergedStatic.wristLeft : mergedStatic.wristRight, materials.glove)
    );
    wrist.add(gloveMesh);

    // Merged Ski Pole Attached to Hand
    const poleGroup = new THREE.Group();
    poleGroup.name = `${prefix}Pole`;
    poleGroup.position.set(side * 0.046, -0.005, 0.010);
    poleGroup.rotation.z = side * 0.006;
    wrist.add(poleGroup);
    joints[`${prefix}Pole`] = poleGroup;

    const poleMesh = enableShadows(new THREE.Mesh(mergedStatic.pole, materials.poleMerged));
    poleGroup.add(poleMesh);
  }

  buildArm(1);
  buildArm(-1);

  // 5. Legs, Ski Pants, Merged Boots & Merged Alpine Skis
  function buildLeg(side: number) {
    const prefix = side > 0 ? 'left' : 'right';

    const hip = new THREE.Group();
    hip.name = `${prefix}Hip`;
    hip.position.set(side * 0.114, -0.025, 0);
    hips.add(hip);
    joints[`${prefix}Hip`] = hip;

    const thighMesh = enableShadows(new THREE.Mesh(geos.thigh, materials.pants));
    hip.add(thighMesh);
    paletteMeshes.pants.push(thighMesh);

    const knee = new THREE.Group();
    knee.name = `${prefix}Knee`;
    knee.position.set(0, -0.34, 0);
    hip.add(knee);
    joints[`${prefix}Knee`] = knee;

    const shinMesh = enableShadows(new THREE.Mesh(mergedStatic.kneeShin, materials.pants));
    knee.add(shinMesh);
    paletteMeshes.pants.push(shinMesh);

    const ankle = new THREE.Group();
    ankle.name = `${prefix}Ankle`;
    ankle.position.set(0, -0.325, 0);
    knee.add(ankle);
    joints[`${prefix}Ankle`] = ankle;

    const bootMesh = enableShadows(new THREE.Mesh(mergedStatic.boot, materials.bootMerged));
    ankle.add(bootMesh);

    // Merged Alpine Carving Ski Attached to Boot
    const ski = createAlpineSki(currentPalette.skiAccent, enableShadows, currentHasTwintips);
    if (ski.userData.skiMesh) skiMeshes.push(ski.userData.skiMesh);
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
    currentPalette = PALETTES[paletteKey] || PALETTES.coral;
    const newMats = getCachedPaletteMaterials(paletteKey, currentPalette);
    Object.assign(materials, newMats);

    paletteMeshes.jacket.forEach((m) => (m.material = newMats.jacket));
    paletteMeshes.collar.forEach((m) => (m.material = newMats.collarMat));
    paletteMeshes.pants.forEach((m) => (m.material = newMats.pants));
    paletteMeshes.goggleLens.forEach((m) => (m.material = newMats.goggleLens));

    headwearMesh.geometry = getCachedHeadwearGeometry(currentPalette);
    const skiGeo = getMergedSkiGeometry(currentPalette.skiAccent, currentHasTwintips);
    for (let i = 0; i < skiMeshes.length; i++) {
      skiMeshes[i].geometry = skiGeo;
    }
  }

  function setSportVisuals(isSnowboard: boolean, hasTwintips: boolean) {
    currentHasTwintips = hasTwintips;
    if (joints.leftPole) joints.leftPole.visible = !isSnowboard;
    if (joints.rightPole) joints.rightPole.visible = !isSnowboard;
    const skiGeo = getMergedSkiGeometry(currentPalette.skiAccent, hasTwintips);
    for (let i = 0; i < skiMeshes.length; i++) {
      skiMeshes[i].geometry = skiGeo;
    }
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

  const character: SkierCharacter = {
    root,
    joints,
    materials,
    footContacts,
    skis,
    slots: {
      headwear: headwearMesh,
      gogglesFrame: gogglesFrameMesh,
      goggleLens: lensMesh
    },
    setPalette,
    resetPose,
    setSportVisuals
  };
  character.dispose = () => disposeCharacter(character);
  return character;
}

// Persistent pre-allocated scratch objects for zero-allocation ragdoll posing
const _uUp = new THREE.Vector3();
const _uHipLat = new THREE.Vector3();
const _uBack = new THREE.Vector3();
const _uRight = new THREE.Vector3();
const _basisMat = new THREE.Matrix4();
const _parentQuatInv = new THREE.Quaternion();
const _localTarget = new THREE.Vector3();
const _axisY = new THREE.Vector3(0, 1, 0);
const _axisNegY = new THREE.Vector3(0, -1, 0);
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisNegX = new THREE.Vector3(-1, 0, 0);
const _worldDir = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _legUp = new THREE.Vector3();
const _ankleRight = new THREE.Vector3();
const _ankleNorm = new THREE.Vector3();
const _targetMat = new THREE.Matrix4();
const _targetQuat = new THREE.Quaternion();

function orientJoint(
  joint: THREE.Group | undefined,
  defaultAxis: THREE.Vector3,
  worldDir: THREE.Vector3
): void {
  if (!joint || !joint.parent) return;
  if (worldDir.lengthSq() < 1e-4) return;
  joint.parent.updateMatrixWorld(true);
  joint.parent.getWorldQuaternion(_parentQuatInv).invert();
  _localTarget.copy(worldDir).applyQuaternion(_parentQuatInv).normalize();
  joint.quaternion.setFromUnitVectors(defaultAxis, _localTarget);
  joint.updateMatrixWorld(true);
}

function orientAnkle(
  ankle: THREE.Group | undefined,
  kneePos: THREE.Vector3,
  footPos: THREE.Vector3,
  tipPos: THREE.Vector3,
  tailPos: THREE.Vector3
): void {
  if (!ankle || !ankle.parent) return;

  _fwd.subVectors(tipPos, tailPos).normalize();
  if (_fwd.lengthSq() < 0.5) _fwd.set(0, 0, 1);

  _legUp.subVectors(kneePos, footPos).normalize();
  if (_legUp.lengthSq() < 0.5) _legUp.set(0, 1, 0);

  _ankleRight.crossVectors(_legUp, _fwd).normalize();
  if (_ankleRight.lengthSq() < 0.5) {
    _ankleRight.set(1, 0, 0);
    if (Math.abs(_fwd.dot(_ankleRight)) > 0.9) _ankleRight.set(0, 1, 0);
    _ankleRight.crossVectors(_ankleRight, _fwd).normalize();
  }
  _ankleNorm.crossVectors(_fwd, _ankleRight).normalize();

  _targetMat.makeBasis(_ankleRight, _ankleNorm, _fwd);
  _targetQuat.setFromRotationMatrix(_targetMat);

  ankle.parent.updateMatrixWorld(true);
  ankle.parent.getWorldQuaternion(_parentQuatInv).invert();
  ankle.quaternion.copy(_parentQuatInv.multiply(_targetQuat));
  ankle.updateMatrixWorld(true);
}

/**
 * Maps 21 Verlet ragdoll simulation particles directly to character joints and skis.
 */
export function applyRagdollPose(
  character: SkierCharacter,
  visualNode: THREE.Group,
  pts: { pos: THREE.Vector3 }[]
): void {
  if (pts.length < 21) return;

  // Root joints seated at pelvis particle
  character.root.position.set(0, 0, 0);
  character.joints.hips.position.set(0, 0, 0);

  // 1. Torso / Pelvis orientation basis
  _uUp.subVectors(pts[2].pos, pts[0].pos).normalize();
  if (_uUp.lengthSq() < 0.5) _uUp.set(0, 1, 0);

  _uHipLat.subVectors(pts[14].pos, pts[11].pos).normalize();
  if (_uHipLat.lengthSq() < 0.5) _uHipLat.set(1, 0, 0);

  _uBack.crossVectors(_uHipLat, _uUp).normalize();
  if (_uBack.lengthSq() < 0.5) {
    _uBack.set(0, 0, 1);
    if (Math.abs(_uUp.dot(_uBack)) > 0.9) _uBack.set(1, 0, 0);
    _uBack.crossVectors(_uBack, _uUp).normalize();
  }

  _uRight.crossVectors(_uUp, _uBack).normalize();

  _basisMat.makeBasis(_uRight, _uUp, _uBack);
  visualNode.quaternion.setFromRotationMatrix(_basisMat);
  visualNode.updateMatrixWorld(true);

  // 2. Spine & Neck
  orientJoint(character.joints.spine, _axisY, _worldDir.subVectors(pts[2].pos, pts[0].pos));
  orientJoint(character.joints.neck, _axisY, _worldDir.subVectors(pts[4].pos, pts[3].pos));

  // 3. Arms
  orientJoint(character.joints.leftShoulder, _axisX, _worldDir.subVectors(pts[6].pos, pts[5].pos));
  orientJoint(character.joints.leftElbow, _axisX, _worldDir.subVectors(pts[7].pos, pts[6].pos));
  orientJoint(character.joints.rightShoulder, _axisNegX, _worldDir.subVectors(pts[9].pos, pts[8].pos));
  orientJoint(character.joints.rightElbow, _axisNegX, _worldDir.subVectors(pts[10].pos, pts[9].pos));

  // 4. Legs
  orientJoint(character.joints.leftHip, _axisNegY, _worldDir.subVectors(pts[12].pos, pts[11].pos));
  orientJoint(character.joints.leftKnee, _axisNegY, _worldDir.subVectors(pts[13].pos, pts[12].pos));
  orientJoint(character.joints.rightHip, _axisNegY, _worldDir.subVectors(pts[15].pos, pts[14].pos));
  orientJoint(character.joints.rightKnee, _axisNegY, _worldDir.subVectors(pts[16].pos, pts[15].pos));

  // 5. Ankles / Skis
  orientAnkle(character.joints.leftAnkle, pts[12].pos, pts[13].pos, pts[17].pos, pts[18].pos);
  orientAnkle(character.joints.rightAnkle, pts[15].pos, pts[16].pos, pts[19].pos, pts[20].pos);

  // 6. Tuck poles along forearms during ragdoll tumble
  if (character.joints.leftPole) character.joints.leftPole.rotation.set(0.6, 0, 0);
  if (character.joints.rightPole) character.joints.rightPole.rotation.set(0.6, 0, 0);
}
