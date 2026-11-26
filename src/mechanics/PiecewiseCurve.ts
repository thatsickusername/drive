/**
 * Piecewise linear interpolation curve directly matching GMA Wonderlands curve evaluators.
 * Used for standard, sharp, slide, and overturn turning rates, drift velocities, and turn time modifiers.
 * Optimized with flat Float32Array storage and pre-baked segment slopes.
 */
export class PiecewiseCurve {
  public points: Float32Array;
  public values: Float32Array;
  private slopes: Float32Array;
  private count: number;

  constructor(points: number[] | Float32Array, values: number[] | Float32Array) {
    this.count = points.length;
    this.points = points instanceof Float32Array ? points : new Float32Array(points);
    this.values = values instanceof Float32Array ? values : new Float32Array(values);
    const n = Math.max(0, this.count - 1);
    this.slopes = new Float32Array(n);
    for (let i = 0; i < n; ++i) {
      const span = this.points[i + 1] - this.points[i];
      this.slopes[i] = span > 1e-9 ? (this.values[i + 1] - this.values[i]) / span : 0.0;
    }
  }

  public evaluate(t: number): number {
    const len = this.count;
    if (len === 0) return 0.0;
    const pts = this.points;
    const vals = this.values;
    if (len === 1 || t <= pts[0]) return vals[0];
    if (t >= pts[len - 1]) return vals[len - 1];

    for (let i = 0; i < len - 1; ++i) {
      if (t <= pts[i + 1]) {
        return vals[i] + (t - pts[i]) * this.slopes[i];
      }
    }
    return vals[len - 1];
  }
}
