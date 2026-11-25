import * as THREE from 'three';

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

export function createAlpineSki(
  skiBaseMat: THREE.Material,
  skiAccentMat: THREE.Material,
  bindingMat: THREE.Material,
  enableShadows: (m: THREE.Mesh) => THREE.Mesh
): THREE.Group {
  const skiGroup = new THREE.Group();

  const mainGeo = new THREE.BoxGeometry(0.142, 0.034, 1.42);
  const mainMesh = enableShadows(new THREE.Mesh(mainGeo, skiBaseMat));
  mainMesh.position.set(0, -0.130, 0.06);
  skiGroup.add(mainMesh);

  const stripeGeo = new THREE.BoxGeometry(0.106, 0.010, 1.30);
  const stripeMesh = enableShadows(new THREE.Mesh(stripeGeo, skiAccentMat));
  stripeMesh.position.set(0, -0.111, 0.06);
  skiGroup.add(stripeMesh);

  const tipGeo = new THREE.BoxGeometry(0.136, 0.028, 0.28);
  const tipMesh = enableShadows(new THREE.Mesh(tipGeo, skiAccentMat));
  tipMesh.position.set(0, -0.092, 0.88);
  tipMesh.rotation.x = -0.32;
  skiGroup.add(tipMesh);

  const tailGeo = new THREE.BoxGeometry(0.132, 0.026, 0.22);
  const tailMesh = enableShadows(new THREE.Mesh(tailGeo, skiBaseMat));
  tailMesh.position.set(0, -0.112, -0.73);
  tailMesh.rotation.x = 0.22;
  skiGroup.add(tailMesh);

  const toeBindGeo = new THREE.BoxGeometry(0.102, 0.032, 0.088);
  const toeBind = enableShadows(new THREE.Mesh(toeBindGeo, bindingMat));
  toeBind.position.set(0, -0.097, 0.22);

  const heelBindGeo = new THREE.BoxGeometry(0.102, 0.032, 0.096);
  const heelBind = enableShadows(new THREE.Mesh(heelBindGeo, bindingMat));
  heelBind.position.set(0, -0.097, -0.14);
  skiGroup.add(toeBind, heelBind);

  return skiGroup;
}
