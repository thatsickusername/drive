/**
 * Piecewise linear interpolation curve directly matching GMA Wonderlands curve evaluators.
 * Used for standard, sharp, slide, and overturn turning rates, drift velocities, and turn time modifiers.
 */
export class PiecewiseCurve {
  public points: number[];
  public values: number[];

  constructor(points: number[], values: number[]) {
    this.points = points;
    this.values = values;
  }

  public evaluate(t: number): number {
    if (this.points.length === 0) return 0.0;
    if (this.points.length === 1 || t <= this.points[0]) return this.values[0];
    if (t >= this.points[this.points.length - 1]) return this.values[this.values.length - 1];

    for (let i = 0; i < this.points.length - 1; ++i) {
      if (t >= this.points[i] && t <= this.points[i + 1]) {
        const span = this.points[i + 1] - this.points[i];
        if (span < 1e-9) return this.values[i];
        const factor = (t - this.points[i]) / span;
        return this.values[i] + factor * (this.values[i + 1] - this.values[i]);
      }
    }
    return this.values[this.values.length - 1];
  }
}
