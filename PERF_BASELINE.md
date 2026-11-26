# Alpine Freeride: Performance & Architecture Baseline (Phase 0)

> **Date:** November 2026  
> **Environment:** Windows, Chromium (Playwright headless WebGL/D3D11), Vite 5.4, Three.js 0.170.0, Rapier3D WASM  
> **Git Status:** Clean module graph (35 active modules in `src/`, all legacy shims purged)

---

## 1. Production Bundle Sizes (`npm run build`)

| Asset | Raw Size | Gzip Size | Notes |
| :--- | :--- | :--- | :--- |
| `dist/index.html` | 1.17 KB (1,196 B) | 0.61 KB | Main entry HTML canvas container |
| `dist/assets/index-D9uniq9P.js` | 4,945.83 KB (5,064,526 B) | 1,841.83 KB | Single bundle containing Three.js, Rapier3D WASM & Game Engine |

*Note: WASM binary is inlined/bundled via `vite-plugin-wasm`.*

---

## 2. Cold Startup Latencies (Deterministic Telemetry)

Startup phases measured via High-Resolution Performance API (`performance.mark` / `measure`):

| Phase | Metric | Duration (ms) | Description |
| :--- | :--- | :--- | :--- |
| **WASM Physics Initialization** | `wasmInitMs` | 14.20 ms | `@dimforge/rapier3d-compat` WebAssembly module compilation & init |
| **Massif & Heightfield Generation** | `massifBuildMs` | 816.10 ms | 6×6 chunk mesh generation, skirts, Rapier colliders & tree copse instances |
| **Time to First Frame (TTFF)** | `timeToFirstFrameMs` | 1353.80 ms | Cold page load through first rendered frame completion |

---

## 3. Downhill Run Pacing & Frame Budget (300-Frame Sample, Summit Drop)

Rolling 300 frames sampled over downhill descent from Summit Peak (Peak 1):

| Metric | Target (60 FPS Budget) | Measured Value | Unit | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Mean Frame Time** | $< 16.67$ ms | **1.16** ms | ms | PASS |
| **Median Frame Time (p50)** | $< 16.67$ ms | **1.10** ms | ms | PASS |
| **95th Percentile Frame Time (p95)** | $< 16.67$ ms | **1.90** ms | ms | PASS |
| **99th Percentile Frame Time (p99)** | $< 16.67$ ms | **2.60** ms | ms | PASS |
| **Maximum Frame Spike** | $< 33.33$ ms | **2.80** ms | ms | PASS |
| **Minimum Frame Time** | — | **0.60** ms | ms | PASS |

### Workload Split (Physics vs. Rendering)

| Subsystem | Mean (ms) | p95 (ms) | Max (ms) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Physics Accumulator (`PhysicsEngine.step`)** | 0.40 ms | 0.70 ms | 1.10 ms | Rapier3D step + 333Hz GMA carving updates |
| **WebGL Render Pipeline (`Renderer.render`)** | 0.70 ms | 1.20 ms | 1.90 ms | Three.js scene traversal & shadow pass |

---

## 4. GPU & Memory Profile

| Resource Metric | Value | Reference / Notes |
| :--- | :--- | :--- |
| **Draw Calls (`renderer.info.render.calls`)** | 108 | Terrain chunks, trees instanced mesh, sky dome, skier |
| **Triangle Count (`renderer.info.render.triangles`)** | 635,962 | 6×6 terrain grid + skirts + tree meshes + skier low-poly |
| **Active Geometries (`renderer.info.memory.geometries`)** | 103 | Chunks, tree buffers, skier bones/geometries |
| **Active Textures (`renderer.info.memory.textures`)** | 2 | Procedural detail normal/roughness textures |
| **Compiled Shader Programs (`renderer.info.programs`)** | 13 | Snow PBR, trail ribbon, sky gradient, shadow depth |
| **Chromium JS Heap (`performance.memory.usedJSHeapSize`)** | 10.11 MB | Initial baseline memory footprint |
| **Heap Delta over 300 Frames** | 0.00 MB | Zero significant GC bloat during steady downhill run |

---

## 5. Visual Regression Baseline

- Baseline Capture: `vision/screenshots/acceptance_criteria_1_latest.png`
- Perf Downhill Capture: `vision/screenshots/perf_baseline_latest.png`
- Reference Baseline: `vision/reference/acceptance criteria 1.png`
