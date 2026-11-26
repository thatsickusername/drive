export interface FrameMetrics {
  frameTimeMs: number;
  physicsTimeMs: number;
  renderTimeMs: number;
  renderInfo: {
    calls: number;
    triangles: number;
    lines: number;
    points: number;
  };
  memoryInfo: {
    geometries: number;
    textures: number;
    programs: number;
  };
  heapUsedBytes: number;
}

export interface PerfReport {
  startup: {
    wasmInitMs: number;
    massifBuildMs: number;
    timeToFirstFrameMs: number;
  };
  framesSampled: number;
  frameTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  };
  physicsStepTime: {
    avg: number;
    p95: number;
    max: number;
  };
  renderTime: {
    avg: number;
    p95: number;
    max: number;
  };
  gpuInfo: {
    drawCalls: number;
    triangles: number;
    lines: number;
    points: number;
    geometries: number;
    textures: number;
    shaderPrograms: number;
  };
  memory: {
    initialHeapMB: number;
    latestHeapMB: number;
    heapDeltaMB: number;
  };
}

export class Telemetry {
  public enabled: boolean = true;
  private readonly maxSamples: number = 300;
  private samples: FrameMetrics[] = [];
  private startupMeasures: Record<string, number> = {};
  private initialHeapBytes: number = 0;
  private isFirstFrame: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__PERF_METRICS__ = this;
      (window as any).getPerfReport = () => this.getReport();
      const mem = (performance as any).memory?.usedJSHeapSize;
      if (mem) this.initialHeapBytes = mem;
    }
  }

  public mark(name: string): void {
    try {
      performance.mark(name);
    } catch {
      // no-op if performance marks unsupported
    }
  }

  public measure(name: string, startMark: string, endMark?: string): number {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      const entries = performance.getEntriesByName(name, 'measure');
      const duration = entries.length > 0 ? entries[entries.length - 1].duration : 0;
      this.startupMeasures[name] = duration;
      return duration;
    } catch {
      return 0;
    }
  }

  public recordFrame(metrics: FrameMetrics): void {
    if (this.isFirstFrame) {
      this.isFirstFrame = false;
      this.measure('time-to-first-frame', 'startup-start');
    }

    if (this.samples.length >= this.maxSamples) {
      this.samples.shift();
    }
    this.samples.push(metrics);
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(Math.floor(sorted.length * p), sorted.length - 1);
    return sorted[idx];
  }

  public getReport(): PerfReport {
    const frameTimes = this.samples.map(s => s.frameTimeMs);
    const physTimes = this.samples.map(s => s.physicsTimeMs);
    const renderTimes = this.samples.map(s => s.renderTimeMs);

    const avg = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    const max = (nums: number[]) => nums.length ? Math.max(...nums) : 0;
    const min = (nums: number[]) => nums.length ? Math.min(...nums) : 0;

    const last = this.samples.length ? this.samples[this.samples.length - 1] : null;
    const currentHeap = (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) || 0;

    return {
      startup: {
        wasmInitMs: Number((this.startupMeasures['wasm-init'] || 0).toFixed(2)),
        massifBuildMs: Number((this.startupMeasures['massif-init'] || 0).toFixed(2)),
        timeToFirstFrameMs: Number((this.startupMeasures['time-to-first-frame'] || 0).toFixed(2))
      },
      framesSampled: this.samples.length,
      frameTime: {
        avg: Number(avg(frameTimes).toFixed(2)),
        p50: Number(this.percentile(frameTimes, 0.50).toFixed(2)),
        p95: Number(this.percentile(frameTimes, 0.95).toFixed(2)),
        p99: Number(this.percentile(frameTimes, 0.99).toFixed(2)),
        max: Number(max(frameTimes).toFixed(2)),
        min: Number(min(frameTimes).toFixed(2))
      },
      physicsStepTime: {
        avg: Number(avg(physTimes).toFixed(2)),
        p95: Number(this.percentile(physTimes, 0.95).toFixed(2)),
        max: Number(max(physTimes).toFixed(2))
      },
      renderTime: {
        avg: Number(avg(renderTimes).toFixed(2)),
        p95: Number(this.percentile(renderTimes, 0.95).toFixed(2)),
        max: Number(max(renderTimes).toFixed(2))
      },
      gpuInfo: {
        drawCalls: last ? last.renderInfo.calls : 0,
        triangles: last ? last.renderInfo.triangles : 0,
        lines: last ? last.renderInfo.lines : 0,
        points: last ? last.renderInfo.points : 0,
        geometries: last ? last.memoryInfo.geometries : 0,
        textures: last ? last.memoryInfo.textures : 0,
        shaderPrograms: last ? last.memoryInfo.programs : 0
      },
      memory: {
        initialHeapMB: Number((this.initialHeapBytes / (1024 * 1024)).toFixed(2)),
        latestHeapMB: Number((currentHeap / (1024 * 1024)).toFixed(2)),
        heapDeltaMB: Number(((currentHeap - this.initialHeapBytes) / (1024 * 1024)).toFixed(2))
      }
    };
  }
}
