## Architectural Blast Radius & Hot-Path Risk Matrix

Optimization work across the 26 active modules in `src/` spans five distinct runtime domains with tightly coupled performance and determinism constraints:

| Subsystem | Target Modules (`src/`) | Primary Performance Risk | Blast Radius | Invariant Sensitivity |
| --- | --- | --- | --- | --- |
| **Main Loop & Timing** | `core/Game.ts`, `core/PhysicsEngine.ts`, `core/InputController.ts` | Accumulator spiral-of-death, JS↔WASM marshalling overhead, per-frame input/gamepad allocations | Global | Frame determinism & 60 Hz physics step |
| **GMA Physics & Rig** | `mechanics/*.ts`, `player/SkierController.ts`, `player/character/*.ts` | 333 Hz inner carving loop allocations, 50 Hz × 5-iter Verlet GC churn, redundant trig/IK math | High (Gameplay feel) | Exact GMA turn curves, drift boost timing, ragdoll thresholds |
| **Massif & Colliders** | `world/AlpineMassif.ts`, `world/alpineHeightfield.ts`, `world/math/prng.ts` | Startup freeze from redundant height queries across 36 chunks, static matrix recomputes, high vertex memory | High (World/Physics) | **Invariant 1** ($r \times V + c$), **Invariant 2** ($C^1/C^2$ smoothness), **Invariant 3** ($\ge 38^\circ\text{–}42^\circ$ snow) |
| **Rendering & Shaders** | `core/Renderer.ts`, `world/shaders/*.ts`, `world/trails/CarvedSnowTrail.ts`, `world/environment/*.ts` | Full-buffer GPU uploads per frame on ski trails, oversized shadow frustum, heavy fragment ALU, DPR overdraw | High (Visual parity) | **Invariant 3** (snow readability), **Invariant 4** (zero-alloc trail/pine buffers) |
| **UI, Audio & Netcode** | `ui/*.ts`, `camera/*.ts`, `audio/SnowAudio.ts`, `network/*.ts` | Per-frame DOM layout thrashing in HUD, unpooled binary packets, unshared remote skier geometries/tracks | Medium (Isolated) | Multiplayer sync accuracy, responsive controls/overlays

 |

---

## AI Agent Operating Contract & Non-Negotiable Guardrails

Hand this entire plan to the executing AI agent as its master directive. The agent must obey the following rules across every phase:

1. **Read Before Edit:** Never assume symbol names, buffer layouts, or shader uniforms. Inspect the exact files listed in a phase's scope before modifying code.
2. **Strict Behavioral Equivalence:** Gameplay feel, physics tuning constants (`mechanics/GmaConfig.ts`), visual appearance (`vision/reference/`), and all keybindings (`[1]`–`[6]`, `[V]`, `[O]`, `[C]`, `[T]`, `[Y]`, `[R]`, `[L]`/`[N]`, `[P]`, `[H]`) must remain functionally identical.
3. **Hard Architectural Invariants (Never Violate):**
* **Heightfield Indexing:** Rapier3D heightfield buffers strictly use $r \times V + c$ (row along X, column along Z). Never transpose.
* **Continuous Alpine Flow:** Never introduce 1D contour quantization or $C^0$ creases into `alpineHeightfield.ts`; slopes must remain $C^1/C^2$ smooth.
* **Snow Readability Dominance:** Preserve 80%–90% snow coverage and keep rock slope thresholds at $\ge 38^\circ\text{–}42^\circ$.
* **Zero-Allocation Trails & Foliage:** Carved snow trails and instanced pine groves must reuse persistent pre-allocated `Float32Array` buffers.


4. **Atomic Phase Commits & Mandatory Gates:** Complete one phase at a time. A phase is **not complete** until all three gates pass:
* **Compile Gate:** `npm run build` succeeds with zero TypeScript errors (`strict` mode) and zero bundler warnings.
* **Visual Gate:** `npm run vision:capture` completes cleanly and matches `vision/reference/` with zero unintended rendering regressions.
* **Telemetry Gate:** Recorded phase metrics show equal or better frame pacing, draw calls, memory usage, or startup latency without degrading any other metric.





---

## Phase 0: Telemetry Baseline, Dead-Code Audit & Determinism Lock

**Objective:** Establish hard quantitative baselines before modifying runtime code so every downstream optimization is provably net-positive and regression-free.

**Target Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `src/main.ts`, `src/core/Game.ts`, `src/core/Renderer.ts`, `vision/capture.mjs`.

### Execution Steps

1. **Audit Repo & Doc Hygiene:**
* Reconcile `PROJECT.md` references (`src/boarder.ts`, `src/player/SkierCharacter.ts`, `src/camera.ts`, `src/cameraOverlay.ts`) against the actual 26 modules in `src/`.


* Verify no orphaned legacy files, unused exports, or dead imports remain in the Vite module graph.


2. **Add Non-Intrusive Dev Telemetry Hook (Gated Behind `?perf=1` or `import.meta.env.DEV`):**
* Record cold startup phases via `performance.mark`/`measure`: WASM init (`PhysicsEngine`), heightfield + 6×6 chunk build (`AlpineMassif`), shader/texture compilation, and time-to-first-frame.
* Sample rolling 300-frame metrics over a scripted or deterministic downhill run (e.g., Peak `1` Summit drop):
* Frame time (`p50`, `p95`, `p99`, max spike ms).
* Physics step time vs. render time split.
* `renderer.info.render` (`calls`, `triangles`, `lines`, `points`) and `renderer.info.memory` (`geometries`, `textures`, `programs.length`).
* JS heap allocation delta (`performance.memory` in Chromium) to measure GC pressure.




3. **Capture Baseline Artifacts:**
* Run `npm run build` and record output bundle sizes (JS, WASM, CSS, gzipped).
* Run `npm run vision:capture` and archive baseline screenshots and metrics in a local `PERF_BASELINE.md` log.



**Exit Criteria:** Reproducible baseline metrics table + clean `npm run build` + clean `vision/capture.mjs` run.

---

## Phase 1: Core Loop, Physics Hot Paths & Zero-Allocation Simulation

**Objective:** Eliminate CPU micro-stutters, GC pauses, and redundant math inside the 60 Hz main loop, the 333 Hz carving sub-stepper, and the 50 Hz Verlet ragdoll solver.

**Target Files:** `src/core/Game.ts`, `src/core/PhysicsEngine.ts`, `src/core/InputController.ts`, `src/mechanics/GmaPlayerPhysics.ts`, `src/mechanics/ControlsProcessor.ts`, `src/mechanics/PiecewiseCurve.ts`, `src/mechanics/VerletRagdoll.ts`, `src/mechanics/TrickScoring.ts`, `src/player/SkierController.ts`, `src/player/character/SkierAnimator.ts`.

### Execution Steps

1. **Harden Fixed-Timestep Loop (`Game.ts`):**
* Clamp incoming frame `dt` (e.g., `Math.min(dt, 0.1)`) and cap max physics sub-steps per frame to prevent spiral-of-death after tab switches or lag spikes.
* Pause accumulation cleanly on `document.visibilitychange` (`hidden`) and reset the last timestamp on resume.
* Ensure `requestAnimationFrame` callback is a pre-bound method (no arrow function allocated per frame).


2. **Eliminate Allocations in the 333 Hz Carving Sub-Step (`GmaPlayerPhysics.ts`, `ControlsProcessor.ts`, `PiecewiseCurve.ts`):**
* Audit every line inside the 333 Hz loop for `new THREE.Vector3()`, `new THREE.Quaternion()`, `.clone()`, object literal returns `{ x, y, z }`, or array allocations (`.map`, `.filter`, spread operators).
* Hoist all scratch vectors, quaternions, and matrices into module-scoped or class-private pre-allocated pools (`_tmpVecA`, `_tmpVecB`, `_tmpQuatA`).
* Optimize `PiecewiseCurve.ts`: replace linear segment scans or dynamic object creation with fast indexed lookup / binary search (or pre-baked flat `Float32Array` breakpoints and slopes).
* Cache trigonometric values computed multiple times per sub-step (e.g., `sin`/`cos` of edge tilt angle used in sidecut radius $R = \frac{R_{sc}}{\sin(\theta_{edge}) + 0.08}$).




3. **Flatten 50 Hz Verlet Ragdoll Solver (`VerletRagdoll.ts`):**
* Ensure the 7-node ragdoll skeleton and its 5 constraint relaxation iterations operate strictly on pre-allocated structs or flat `Float32Array` arrays with zero heap allocations during wipeout frames.


* Fast-path early exit when ragdoll state is inactive so zero CPU cycles are spent during normal skiing.


4. **Minimize Rapier3D WASM Boundary Overhead (`PhysicsEngine.ts`, `SkierController.ts`):**
* Batch or minimize per-frame JS↔WASM getters (`translation()`, `rotation()`, `linvel()`). Read once per physics tick into pre-allocated JS scratch floats and share across controller, camera, and audio consumers instead of re-querying WASM across subsystems.
* Audit any Rapier temporary objects (`Ray`, `Shape`, query filters) created per frame; reuse persistent instances and explicitly call `.free()` on any disposable WASM handles to prevent linear WASM heap growth.


5. **Optimize Input & Procedural IK (`InputController.ts`, `SkierAnimator.ts`, `TrickScoring.ts`):**
* Avoid recreating input snapshot objects every frame; mutate a single reusable `InputState` struct.
* Guard gamepad polling cleanly when no gamepads are connected.
* In `SkierAnimator.ts`, hoist bone scratch `Euler`/`Quaternion`/`Vector3` instances and avoid calling `.updateMatrixWorld(true)` manually on individual bones (let Three.js perform a single scene-graph pass before render).



**Exit Criteria:** Zero per-frame heap allocations attributable to `mechanics/*` and `SkierAnimator.ts` in Chrome Performance Allocation Timeline; identical physics telemetry on deterministic runs; `npm run build` + `npm run vision:capture` pass.

---

## Phase 2: Terrain Massif Generation, Heightfield Math & Spatial Culling

**Objective:** Slash cold startup time, cut terrain/foliage memory footprint, and minimize scene-graph traversal cost across the 2.4 km × 2.4 km 6×6 chunk massif.

**Target Files:** `src/world/alpineHeightfield.ts`, `src/world/AlpineMassif.ts`, `src/world/math/prng.ts`.

### Execution Steps

1. **Single-Pass Height Evaluation per Chunk (`AlpineMassif.ts`, `alpineHeightfield.ts`):**
* Audit whether `alpineHeightfield` is evaluated multiple times for the same `(x, z)` coordinates (once for Three.js vertex positions, again for finite-difference normals, again for biome/slope colors, again for Rapier heightfield heights, and again for pine placement).
* Compute each chunk's height grid **once** into a flat `Float32Array` (respecting **Invariant 1**: $r \times V + c$) and derive vertex positions, central-difference normals, slope angles, biome colors, and the Rapier heightfield directly from that buffer.


* Keep `alpineHeightfield.ts` 100% allocation-free: replace any returned objects (`{ h, slope, biome }`) with scalar functions or an `out` scratch struct. Preserve exact mathematical equivalence of all 5 procedural layers (**Invariant 2** & **Invariant 3**).




2. **Optimize Chunk Geometry Memory & Static Transforms (`AlpineMassif.ts`):**
* Use `Uint16Array` index buffers for any chunk whose vertex count is $\le 65{,}535$ (halving index buffer VRAM).
* Evaluate normalized `Uint8Array` (`BufferAttribute(colors, 3, true)`) for vertex colors if visually indistinguishable in `vision:capture` (75% reduction in color attribute VRAM).
* Set `mesh.matrixAutoUpdate = false` and call `mesh.updateMatrix()` once at creation for all 36 static terrain chunks, skirts, frozen lake ice plane, and static instanced pine groves.
* Explicitly call `geometry.computeBoundingSphere()` and `geometry.computeBoundingBox()` on every chunk so Three.js frustum culling reliably skips off-camera chunks.


3. **Instanced Pine Groves Culling & Shadow Discipline (`AlpineMassif.ts`):**
* Verify instanced pine trees are partitioned spatially (e.g., per-chunk or quadrant `InstancedMesh` batches rather than one massif-wide `InstancedMesh` that defeats frustum culling) while balancing draw calls (target $\le 1\text{–}2$ instanced draw calls per visible chunk).
* Verify `instancedMesh.instanceMatrix.needsUpdate` is set once during initialization and never flipped per frame (**Invariant 4**).


* Confirm pine geometry uses merged low-poly trunk/foliage buffers with vertex colors (single material, single draw call per batch) and dispose all intermediate `BufferGeometry` instances after merging.
* Ensure `castShadow` on distant pine groves or off-frustum chunks is bounded cleanly so the shadow pass does not rasterize thousands of off-camera trees.


4. **PRNG & Noise Hot-Loop Micro-Optimization (`prng.ts`, `alpineHeightfield.ts`):**
* Verify simplex noise permutation tables are stored in `Uint8Array` (not generic JS `Array`), avoid modulo `%` in inner loops where bitmasks `& 255` apply, and hoist invariant constants outside octave loops.



**Exit Criteria:** Significant reduction in startup massif-build ms (measure against Phase 0); verified Rapier collider alignment on all 6 peak teleports (`[1]`–`[6]`) with zero fall-through or offset; pixel-identical `vision:capture` output.

---

## Phase 3: GPU Rendering Pipeline, Shadows, Shaders & Trail Buffer Uploads

**Objective:** Maximize GPU headroom, stabilize 60–120+ FPS across integrated and discrete GPUs, and eliminate full-buffer uploads on carved snow tracks.

**Target Files:** `src/core/Renderer.ts`, `src/world/shaders/SnowMaterial.ts`, `src/world/shaders/SnowTrailMaterial.ts`, `src/world/shaders/DetailTexture.ts`, `src/world/trails/CarvedSnowTrail.ts`, `src/world/environment/SkyDome.ts`, `src/world/environment/DayNightCycle.ts`, `src/world/environment/AirborneSparkles.ts`.

### Execution Steps

1. **Renderer & Shadow Frustum Optimization (`Renderer.ts`, `DayNightCycle.ts`):**
* Cap pixel ratio cleanly (`Math.min(window.devicePixelRatio, 2)`) and verify `powerPreference: 'high-performance'` on `WebGLRenderer`.
* Audit directional sun shadow camera: ensure the shadow frustum tightly follows the skier (rather than covering the whole 2.4 km mountain) and snap the shadow camera center to world-space shadow-map texel increments to prevent edge shimmering.
* Audit `castShadow` and `receiveShadow` flags across the scene:
* `SkyDome`: `castShadow = false`, `receiveShadow = false`, `depthWrite = false`.
* `AirborneSparkles`: `castShadow = false`, `receiveShadow = false`.
* `CarvedSnowTrail`: `castShadow = false`.
* Terrain skirts & distant frozen lake bed: `castShadow = false`.


* Verify `DayNightCycle.ts` skips lighting/fog/sky uniform updates when paused (`[P]`) or when solar elevation delta is below epsilon.




2. **Partial GPU Uploads for Carved Snow Trails (`CarvedSnowTrail.ts`):**
* Verify ring-buffer `Float32Array` reuse (**Invariant 4**) with zero `new Float32Array` or `BufferGeometry` rebuilds during gameplay.


* Replace full-buffer uploads (`attr.needsUpdate = true` uploading the entire array every frame) with Three.js 0.170's `attr.clearUpdateRanges(); attr.addUpdateRange(startOffset, count); attr.needsUpdate = true` (handling wrap-around with two ranges when the ring wraps) so WebGL only runs `bufferSubData` on newly carved vertices.
* Set `DynamicDrawUsage` (`THREE.DynamicDrawUsage`) on mutable trail `BufferAttribute`s.
* Avoid calling `computeBoundingSphere()` every frame on the trail mesh; either disable frustum culling (`frustumCulled = false`) or update bounds only on chunk/teleport resets.


3. **Shader & Procedural Texture Efficiency (`SnowMaterial.ts`, `SnowTrailMaterial.ts`, `DetailTexture.ts`):**
* Inspect GLSL fragment shaders for redundant `normalize()`, `pow()`, `sin()`/`cos()`, or dynamic branching per pixel. Replace `pow(x, 2.0)` / `pow(x, 4.0)` with explicit multiplies; hoist view-independent terms to the vertex shader where visually identical.
* Verify `DetailTexture.ts` generates procedural normal/roughness `DataTexture`s once at boot, sets `generateMipmaps = true`, uses `LinearMipmapLinearFilter`, clamps anisotropy to `Math.min(4, renderer.capabilities.getMaxAnisotropy())`, and never rebuilds textures during Day/Golden/Night transitions.


* Avoid recompiling materials (`material.needsUpdate = true`) at runtime; drive diurnal color grading strictly via uniforms.


4. **Ambient Sparkles (`AirborneSparkles.ts`):**
* Confirm zero CPU per-frame loop allocations. If particles wrap around the camera in a bounding box, prefer doing the modulo box-wrap inside the vertex shader using `uCameraPos` and `uTime` uniforms so CPU cost per frame drops to ~0.00 ms.



**Exit Criteria:** Lower `renderer.info.render.calls` and GPU frame time; zero `bufferData` full-reallocation spikes in WebGL capture; identical lighting across Day, Golden Hour, and Night in `vision:capture`.

---

## Phase 4: Character Sharing, Camera, Audio, UI DOM & Multiplayer Scaling

**Objective:** Eliminate DOM layout thrashing, reduce Web Audio overhead, and ensure multiplayer scales smoothly with multiple remote skiers without duplicating GPU assets.

**Target Files:** `src/player/character/SkierGeometry.ts`, `src/player/character/SkierRig.ts`, `src/camera/CameraDirector.ts`, `src/camera/CameraTunerOverlay.ts`, `src/camera/CameraConfig.ts`, `src/audio/SnowAudio.ts`, `src/ui/HudOverlay.ts`, `src/ui/LightingControls.ts`, `src/network/NetworkManager.ts`, `src/network/RemoteSkier.ts`.

### Execution Steps

1. **Shared Procedural Skier Assets (`SkierGeometry.ts`, `SkierRig.ts`, `SkierPalette.ts`):**
* Cache and share procedural `BufferGeometry` instances (jacket, collar, beanie, goggles, skis, boots, poles) and palette `Material` instances across the local skier and all `RemoteSkier` instances.


* Never regenerate procedural geometry on respawn, teleport, or remote player join.
* When toggling Ski/Board (`[T]`) or Twintip (`[Y]`), toggle `visible` flags on pre-built cached sub-meshes instead of destroying and rebuilding geometry on the fly.




2. **Eliminate HUD & Overlay DOM Thrashing (`HudOverlay.ts`, `LightingControls.ts`, `CameraTunerOverlay.ts`):**
* Cache DOM element references at construction; never call `document.querySelector` or `getElementById` inside the animation loop.
* Dirty-check all formatted values (rounded speed, altitude, trick score, combo multiplier, carve charge) before mutating `textContent` or `style`—skip DOM writes whenever the displayed string/percentage has not changed.
* Throttle non-essential numeric HUD refreshes to ~15–20 Hz (every 3–4 frames) while keeping smooth meters on GPU-composited `transform: scaleX(...)` / `translate3d(...)` instead of layout-reflowing `width`/`left`/`top` properties.
* Ensure `CameraTunerOverlay` performs zero DOM updates when hidden (`[O]` closed) and `HudOverlay` completely short-circuits its `update()` when toggled off (`[H]`).




3. **Zero-Allocation Camera & Smooth Audio (`CameraDirector.ts`, `SnowAudio.ts`):**
* Hoist all scratch `Vector3` / `Quaternion` instances in `CameraDirector.ts` across Chase, GMA Isometric (`[V]`), and 6DOF Fly-Cam (`[C]`) modes.


* In `SnowAudio.ts`, pre-allocate the Web Audio graph once on first user gesture and modulate gain/filter frequencies via `AudioParam.setTargetAtTime()` (avoiding per-frame node creation, audio glitches, or redundant param calls when deltas are negligible).


4. **Multiplayer Binary Serialization & Remote LOD (`NetworkManager.ts`, `RemoteSkier.ts`):**
* Reuse a single pre-allocated `ArrayBuffer` + `DataView` for outbound 20 Hz binary packets (zero per-packet allocations).


* In `RemoteSkier.ts`, distance-cull expensive updates: skip carved snow trail emission and full procedural IK limb updates when a remote skier is beyond a safe visibility/detail distance or outside the camera frustum.
* Ensure clean disposal of remote skier rigs and trail buffers on disconnect without disposing shared cached geometries/materials.



**Exit Criteria:** Zero Layout/Recalculate Style spikes in Chrome DevTools Performance trace during active skiing; stable memory across repeated `[T]`/`[Y]` toggles and simulated remote skier join/leave cycles.

---

## Phase 5: Resource Lifecycle, Static Type Hardening & Build/Server Optimization

**Objective:** Eliminate memory leaks, tighten TypeScript strictness and code maintainability, and optimize production delivery.

**Target Files:** `src/core/Game.ts`, `src/core/Renderer.ts`, `vite.config.ts`, `tsconfig.json`, `package.json`, `server/index.js`.

### Execution Steps

1. **Resource Disposal & Teardown Audit:**
* Implement or verify deterministic `dispose()` methods on `Game`, `Renderer`, `AlpineMassif`, `CarvedSnowTrail`, `AirborneSparkles`, `RemoteSkier`, `SnowAudio`, `InputController`, and UI overlays (removing `window`/`document` event listeners, freeing Rapier world/bodies, closing WebSockets, and disposing GPU geometries/materials/textures).


2. **TypeScript Code Quality Pass (`tsconfig.json`, `src/**/*.ts`):**
* Audit for implicit `any`, unsafe non-null assertions (`!`), unused locals/parameters, and duplicated math helpers across `mechanics/` and `world/`.
* Ensure all Three.js imports use tree-shakeable named imports (avoid `import * as THREE` only if bundle analysis shows dead exports retained; measure with Vite rollup stats before changing import style).
* Confirm zero console logging (`console.log`) in hot loops.


3. **Production Build & Asset Server (`vite.config.ts`, `server/index.js`):**
* Inspect `vite.config.ts` chunk splitting (`manualChunks` separating `three` and `@dimforge/rapier3d-compat` from app code for better browser caching) and verify `target` matches modern WebGL2/WASM browsers (e.g., `es2022`) so Vite does not emit slow legacy transpiled helpers.
* Verify `server/index.js` serves compressed static assets (gzip/brotli) with `Cache-Control: public, max-age=31536000, immutable` for hashed `dist/assets/*` files and proper `application/wasm` MIME headers so browsers stream-compile Rapier WASM (`WebAssembly.instantiateStreaming`).





**Exit Criteria:** Clean heap snapshot diff across repeated scene/player resets; smaller or better-cached production chunks in `dist/`; clean `npm run build`.

---

## Phase 6: Final Verification Matrix & Regression Sign-Off

**Objective:** Prove zero behavioral or visual regressions and document net optimization gains.

### Verification Checklist (Must All Pass)

1. **Automated Visual Regression:** Run `npm run vision:capture` and diff against `vision/reference/` across all camera views and Day/Golden/Night presets.


2. **Full Gameplay Parity Smoke Test:**
* Carve (`A`/`D`), Slide Drift Boost (`Shift` + `A`/`D`, verifying 0.5 s burst), Sharp Turn (`Ctrl`), Snowplow Brake (`S` / `A`+`D`), Flat-ground Pole Staking, Jump Pop & Glide (`Space`), Aerial Spins/Flips & Trick Combo scoring.
* High-impact Verlet ragdoll wipeout ($> 26\text{ m/s}$ or $> 45^\circ$ sideways touchdown) and clean recovery.


* Sport toggle (`[T]`), Twintip (`[Y]`), Switch (`[R]`), Camera Modes (`[V]`, `[O]`, `[C]`), Lighting (`[L]`/`[N]`, `[P]`), HUD toggle (`[H]`), Respawn (`Backspace`/`Enter`), and all 6 Peak Teleports (`[1]`–`[6]`).




3. **Final Benchmark Report:** Produce a side-by-side comparison table against Phase 0 (`PERF_BASELINE.md`):
* Cold startup / time-to-first-frame (ms)
* Frame time `p50` / `p95` / `p99` (ms)
* Physics tick time (ms) vs. Render time (ms)
* Draw calls & triangle count
* GC pauses / MB allocated per minute during continuous downhill run
* Production bundle size (raw & gzipped)



---
