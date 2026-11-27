export interface PerfReport {
  startup: {
    wasmInitMs: number;
    massifBuildMs: number;
    timeToFirstFrameMs: number;
  };
  framesSampled: number;
  fps: {
    avg: number;
    onePctLow: number;
  };
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
    gcDropsOver1MB: number;
    maxGcDropMB: number;
    gcSpikeFrames: number;
  };
}

export class Telemetry {
  public enabled: boolean = true;
  private readonly cap: number = 1800; // 30s at 60Hz
  private idx: number = 0;
  private count: number = 0;

  private readonly wallDeltaMs = new Float32Array(this.cap);
  private readonly cpuFrameMs = new Float32Array(this.cap);
  private readonly physicsMs = new Float32Array(this.cap);
  private readonly renderMs = new Float32Array(this.cap);
  private readonly scratchSort = new Float32Array(this.cap);

  private startupMeasures: Record<string, number> = {};
  private initialHeapBytes: number = 0;
  private lastHeapBytes: number = 0;
  private lastRafNow: number = 0;
  private isFirstFrame: boolean = true;

  private gcDropCount: number = 0;
  private maxGcDropMB: number = 0;
  private gcSpikeFrames: number = 0;

  private lastCalls: number = 0;
  private lastTris: number = 0;
  private lastLines: number = 0;
  private lastPoints: number = 0;
  private lastGeoms: number = 0;
  private lastTextures: number = 0;
  private lastPrograms: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__PERF_METRICS__ = this;
      (window as any).getPerfReport = () => this.getReport();
      const mem = (performance as any).memory?.usedJSHeapSize;
      if (mem) {
        this.initialHeapBytes = mem;
        this.lastHeapBytes = mem;
      }
    }
  }

  public mark(name: string): void {
    try {
      performance.mark(name);
    } catch {
      // no-op if performance marks unsupported
    }
  }

  public setStartupMeasure(name: string, durationMs: number): void {
    this.startupMeasures[name] = durationMs;
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

  public recordFramePrimitives(
    rafNow: number,
    cpuMs: number,
    physMs: number,
    rendMs: number,
    calls: number,
    tris: number,
    lines: number,
    points: number,
    geoms: number,
    textures: number,
    programs: number
  ): void {
    if (this.isFirstFrame) {
      this.isFirstFrame = false;
      this.measure('time-to-first-frame', 'startup-start');
    }

    const wallDt = this.lastRafNow > 0 ? rafNow - this.lastRafNow : 16.67;
    this.lastRafNow = rafNow;

    this.wallDeltaMs[this.idx] = wallDt;
    this.cpuFrameMs[this.idx] = cpuMs;
    this.physicsMs[this.idx] = physMs;
    this.renderMs[this.idx] = rendMs;

    this.idx = (this.idx + 1) % this.cap;
    if (this.count < this.cap) this.count++;

    this.lastCalls = calls;
    this.lastTris = tris;
    this.lastLines = lines;
    this.lastPoints = points;
    this.lastGeoms = geoms;
    this.lastTextures = textures;
    this.lastPrograms = programs;

    const heap = (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) || 0;
    if (heap > 0) {
      if (this.lastHeapBytes > 0) {
        const drop = this.lastHeapBytes - heap;
        if (drop > 1048576) {
          this.gcDropCount++;
          const dropMB = drop / 1048576;
          if (dropMB > this.maxGcDropMB) this.maxGcDropMB = dropMB;
          if (wallDt > 25.0) this.gcSpikeFrames++;
        }
      }
      this.lastHeapBytes = heap;
    }
  }

  private summarizeBuffer(buf: Float32Array, n: number): {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  } {
    if (n === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0, max: 0, min: 0 };
    }
    let sum = 0;
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < n; i++) {
      const v = buf[i];
      sum += v;
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
      this.scratchSort[i] = v;
    }
    const sorted = this.scratchSort.subarray(0, n).sort();
    return {
      avg: Number((sum / n).toFixed(2)),
      p50: Number(sorted[Math.min(Math.floor(n * 0.50), n - 1)].toFixed(2)),
      p95: Number(sorted[Math.min(Math.floor(n * 0.95), n - 1)].toFixed(2)),
      p99: Number(sorted[Math.min(Math.floor(n * 0.99), n - 1)].toFixed(2)),
      max: Number(maxVal.toFixed(2)),
      min: Number(minVal.toFixed(2))
    };
  }

  public getReport(): PerfReport {
    const n = this.count;
    let avgFps = 0;
    let onePctLowFps = 0;

    if (n > 0) {
      let wallSum = 0;
      for (let i = 0; i < n; i++) {
        wallSum += this.wallDeltaMs[i];
        this.scratchSort[i] = this.wallDeltaMs[i];
      }
      const wallSorted = this.scratchSort.subarray(0, n).sort();
      const onePctStart = Math.max(0, Math.floor(n * 0.99));
      let worst1PctSum = 0;
      for (let i = onePctStart; i < n; i++) worst1PctSum += wallSorted[i];
      const onePctAvgMs = worst1PctSum / (n - onePctStart);
      avgFps = wallSum > 0 ? Number((1000 / (wallSum / n)).toFixed(2)) : 0;
      onePctLowFps = onePctAvgMs > 0 ? Number((1000 / onePctAvgMs).toFixed(2)) : 0;
    }

    const frameStats = this.summarizeBuffer(this.cpuFrameMs, n);
    const physStats = this.summarizeBuffer(this.physicsMs, n);
    const renderStats = this.summarizeBuffer(this.renderMs, n);
    const currentHeap = this.lastHeapBytes || (typeof performance !== 'undefined' && (performance as any).memory?.usedJSHeapSize) || 0;

    return {
      startup: {
        wasmInitMs: Number((this.startupMeasures['wasm-init'] || 0).toFixed(2)),
        massifBuildMs: Number((this.startupMeasures['massif-init'] || 0).toFixed(2)),
        timeToFirstFrameMs: Number((this.startupMeasures['time-to-first-frame'] || 0).toFixed(2))
      },
      framesSampled: n,
      fps: {
        avg: avgFps,
        onePctLow: onePctLowFps
      },
      frameTime: frameStats,
      physicsStepTime: {
        avg: physStats.avg,
        p95: physStats.p95,
        max: physStats.max
      },
      renderTime: {
        avg: renderStats.avg,
        p95: renderStats.p95,
        max: renderStats.max
      },
      gpuInfo: {
        drawCalls: this.lastCalls,
        triangles: this.lastTris,
        lines: this.lastLines,
        points: this.lastPoints,
        geometries: this.lastGeoms,
        textures: this.lastTextures,
        shaderPrograms: this.lastPrograms
      },
      memory: {
        initialHeapMB: Number((this.initialHeapBytes / (1024 * 1024)).toFixed(2)),
        latestHeapMB: Number((currentHeap / (1024 * 1024)).toFixed(2)),
        heapDeltaMB: Number(((currentHeap - this.initialHeapBytes) / (1024 * 1024)).toFixed(2)),
        gcDropsOver1MB: this.gcDropCount,
        maxGcDropMB: Number(this.maxGcDropMB.toFixed(2)),
        gcSpikeFrames: this.gcSpikeFrames
      }
    };
  }
}
