// CatmullRomCurve3 implementation compatible with Three.js
// Used by Slow Roads to subdivide 10m anchor road nodes into 1m fine driving nodes

import { Vector3 } from './vector3.js';

export class CatmullRomCurve3 {
  constructor(points = [], closed = false, curveType = 'centripetal', tension = 0.5) {
    this.points = points;
    this.closed = closed;
    this.curveType = curveType;
    this.tension = tension;
  }

  getPoint(t, optionalTarget = new Vector3()) {
    const points = this.points;
    const l = points.length;

    const p = (l - (this.closed ? 0 : 1)) * t;
    let intPoint = Math.floor(p);
    let weight = p - intPoint;

    if (this.closed) {
      intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;
    } else if (weight === 0 && intPoint === l - 1) {
      intPoint = l - 2;
      weight = 1;
    }

    let p0, p1, p2, p3;
    if (this.closed || intPoint > 0) {
      p0 = points[(intPoint - 1) % l];
    } else {
      p0 = points[0];
    }

    p1 = points[intPoint % l];
    p2 = points[(intPoint + 1) % l];

    if (this.closed || intPoint + 2 < l) {
      p3 = points[(intPoint + 2) % l];
    } else {
      p3 = points[l - 1];
    }

    const t2 = weight * weight;
    const t3 = t2 * weight;

    // Standard uniform Catmull-Rom formula
    optionalTarget.x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * weight +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );
    optionalTarget.y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * weight +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );
    optionalTarget.z = 0.5 * (
      (2 * p1.z) +
      (-p0.z + p2.z) * weight +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
    );

    return optionalTarget;
  }
}

export default CatmullRomCurve3;
