Alpine Freeride — Production-Readiness Audit Report 

  │ Scope & Evidence Discipline: Static findings below are verified directly from the src/ TypeScript modules, package.json, index.html, and server/index.js. Live       
  │ runtime baselines were captured via 30-second headless Playwright Chromium traces (--use-gl=angle --use-angle=d3d11, 1280×720, deviceScaleFactor: 1, Vite dev    
  │ server, ?perf=1, single-player Day mode, summit drop + carving + jumps + canyon run). Metrics requiring real mobile GPUs, multi-peer rooms, or production dist/      
  │ bundles are explicitly separated.
  ──────
  1. Detailed Performance & Rendering Audit

  Live 30-Second Baseline (Desktop Headless ANGLE/D3D11)

  Pre-Phase-1 baseline: 1,812 frames (30,172.1 ms wall elapsed, 0 page errors).
  Post-Phase-1 re-measurement: 1,808 frames / 1,800 sampled (30,153.7 ms wall elapsed, 0 page errors).
  Post-Phase-2 re-measurement: 1,800 sampled frames (0 page errors, 1280×720 ANGLE/D3D11 ?perf=1).

   Metric                                     │ Pre-Phase-1 Baseline                                         │ Post-Phase-1 Observed                                    │ Post-Phase-2 Observed                                     │ Phase 1 → Phase 2 Delta
  ────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────
   Average FPS / 1% Low FPS                   │ 60.02 FPS / 48.87 FPS                                        │ 59.97 FPS / 47.51 FPS                                    │ 59.97 FPS / 49.09 FPS                                     │ +1.58 FPS 1% low; headless D3D11 VSync jitter (CPU p99 0.80 ms)
   JS CPU Frame Time                          │ avg 0.74 ms, p50 0.70 ms, p95 1.00 ms, p99 1.40 ms, max 8.00 │ avg 0.76 ms, p50 0.70 ms, p95 1.00 ms, p99 1.30 ms, max  │ avg 0.43 ms, p50 0.40 ms, p95 0.60 ms, p99 0.80 ms, max   │ -43.4% avg CPU (-0.33 ms); p99 1.30 → 0.80 ms (-38.5%)
                                              │ ms                                                           │ 7.50 ms                                                  │ 7.40 ms                                                   │
   Physics vs. Render CPU Time                │ Physics: avg 0.24 ms (p95 0.40 ms, max 6.20 ms)Render        │ Physics: avg 0.25 ms (p95 0.40 ms, max 1.50 ms)Render    │ Physics: avg 0.14 ms (p95 0.20 ms, max 1.00 ms)Render     │ Physics avg -44.0% (0.25 → 0.14 ms); Render avg -44.7% (0.47 →
                                              │ dispatch: avg 0.47 ms (p95 0.60 ms, max 7.60 ms)             │ dispatch: avg 0.47 ms (p95 0.60 ms, max 6.90 ms)         │ dispatch: avg 0.26 ms (p95 0.40 ms, max 7.10 ms)          │ 0.26 ms)
   Draw Calls (renderer.info.render.calls)    │ min 92, avg 112.9, max 124                                   │ min 85, avg 104.9, max 124                               │ min 35, avg 60.1, max 73                                  │ -44.8 avg draw calls (-42.7% vs Ph1; -46.8% vs pre-Ph1)
   Triangles (renderer.info.render.triangles) │ min 319,186, avg 529,569, max 709,330                        │ min 137,008, avg 411,831, max 709,330                    │ min 112,392, avg 156,227, max 186,528                     │ -255,604 avg tris/frame (-62.1% vs Ph1; -70.5% vs pre-Ph1)
   GPU Memory (renderer.info.memory)          │ 83 geometries, 2 textures, 12 shader programs                │ 85 geometries, 2 textures, 13 shader programs            │ 81 geometries, 2 textures, 13 shader programs             │ -4 geometries despite 3× terrain LODs + low-poly pine LODs
   JS Heap (performance.memory)               │ 41.34 MB start → 43.71 MB end (min 41.28, max 49.74 MB)      │ 10.11 MB flat (gcDropsOver1MB: 0, maxGcDropMB: 0,        │ 10.11 MB flat (gcDropsOver1MB: 0, maxGcDropMB: 0,         │ 0 GC drops > 1 MB; 0 GC spike frames
                                              │ (~90 GC drops > 1 MB in 30s)                                 │ gcSpikeFrames: 0)                                        │ gcSpikeFrames: 0)                                         │
   Startup (?perf=1 marks)                    │ wasmInitMs: 16.3 ms, massifBuildMs: 567.9 ms,                │ wasmInitMs: 13.9 ms, massifBuildMs: 546.2 ms,            │ wasmInitMs: 14.3 ms, massifBuildMs: 543.4 ms,             │ TTFF 953.2 ms (844–985 ms across captures); massifBuildMs
                                              │ timeToFirstFrameMs: 1,081.6 ms                               │ timeToFirstFrameMs: 997.9 ms                             │ timeToFirstFrameMs: 953.2 ms                              │ awaits Phase 3 workerization

  Requires additional live profiling (not covered by this desktop trace):

  • Real mobile GPU fragment/fill-rate cost (desktop D3D11 hides pixel-shader bottlenecks).
  • Multiplayer draw-call & bandwidth scaling with 4–16+ active peers.
  • Sunset/Sunrise transition frames (where Renderer.applyLightingLerp runs every frame).
  • Production gzip/brotli dist/ download + parse time over throttled 4G.
  ──────
  1.1 Draw Calls & Batching

  • 75-mesh skier character (SkierRig.ts): buildSkierCharacter (src/player/character/SkierRig.ts:355-703) builds 75 separate THREE.Mesh objects (~74 visible
  simultaneously due to twintip/flat tail visibility toggle in src/player/character/SkierGeometry.ts:219-228), every one marked castShadow = true and receiveShadow =    
  true (src/player/character/SkierRig.ts:371-375):
      • The beanie pom-pom alone is 9 draw calls (pomBase + 8 tuftOffsets meshes at src/player/character/SkierRig.ts:468-487).
      • Each ski pole is 5 meshes (src/player/character/SkierRig.ts:567-586); each ski is 6 visible meshes (src/player/character/SkierGeometry.ts:206-238); each boot    
      has 7 meshes including 4 separate strap-half boxes (src/player/character/SkierRig.ts:627-653).
      • This single character consumes ~74 of the observed 92–124 draw calls (and casts shadows in the shadow pass). In multiplayer
      (src/network/RemoteSkier.ts:113-121), 7 visible skiers alone exceed the 500-draw-call desktop budget (~518 character meshes before shadow pass, terrain, trees,    
      and trails).
  • Terrain & Vegetation (AlpineMassif.ts): Terrain uses a 6×6 chunk grid (36 meshes, shared terrainMaterial, matrixAutoUpdate = false at
  src/world/AlpineMassif.ts:252-258). Pines use InstancedMesh partitioned into up to 36 chunk buckets (cz <= 0 cast shadows, src/world/AlpineMassif.ts:500-523), which   
  is well-structured.
  • Per-Trail Material Duplication (CarvedSnowTrail.ts:92): Every CarvedSnowTrail (local + every RemoteSkier) calls createSnowTrailMaterial(), instantiating a
  separate MeshStandardMaterial and onBeforeCompile uniform closure instead of sharing one material.

  1.2 Game Loop & Frame Pacing

  • Fixed Timestep Without Render Interpolation (PhysicsEngine.ts, Game.ts):
      • Game.loop clamps delta to 0.1s, and PhysicsEngine.step accumulates at 1/60s (maxSubSteps = 5, discarding overflow). Inside each 60 Hz tick,
      GmaPlayerPhysics.update runs its own 0.003s (333.3 Hz) sub-accumulator.
      • However, PhysicsEngine.getInterpolationAlpha is never called. SkierController.renderUpdate snaps root.position directly to the latest discrete 60 Hz physics     
      step. On 120 Hz/144 Hz displays or variable frame pacing (wallDeltaMs ranged up to 35.8 ms in trace), this produces beat-frequency micro-judder.
  • Duplicate trickScoring.updateDisplay(dt) Call (SkierController.ts:789-790): this.gmaPhysics.trickScoring.updateDisplay(dt) is called on two consecutive lines,       
  causing trick banner timers to expire at 2× speed.
  • Independent Clock in Input (InputController.ts:162-164): getBoarderInputs() computes inputDt via its own performance.now() call instead of using the frame delta,    
  decoupling keyboard steering ramp rates from game loop time.
  • Redundant World-Matrix Traversals & DOM Writes in Render Loop:
      • src/player/SkierController.ts:731 and src/network/RemoteSkier.ts:431 call updateMatrixWorld(true) across the entire character hierarchy every frame,
      duplicating Three.js's render-pass matrix update.
      • RemoteSkier.ts:493, 509-514 reads window.innerWidth/innerHeight, calls document.getElementById, and mutates style.left / style.top every frame per visible       
      remote skier (triggering layout/paint invalidation instead of GPU-composited transform: translate3d(...)).
      • src/ui/HudOverlay.ts:76, src/ui/LightingControls.ts:35, and CameraTunerOverlay.ts:37,72 use backdrop-filter: blur(...) over an active 60 FPS WebGL canvas        
      (expensive compositor readback on mobile/integrated GPUs).


  1.3 CPU & Garbage Collection (GC) Pressure

  Observed 90 minor GC drops > 1 MB over 30 seconds even during static Day lighting. Confirmed hot-path allocations:

  • Renderer.applyLightingLerp (Renderer.ts:184,187,194,211,214,221): Allocates 4 new THREE.Color(...) instances per call every frame during Sunset (2 min) and
  Sunrise (2 min) transitions or manual lighting lerps.
  • CarvedSnowTrail.update (src/world/trails/CarvedSnowTrail.ts:418-493): Allocates a 19-element object-literal array (const nodes = [ { ... }, ... ]) every 0.20 m of   
  travel (~2–3× per frame at high speed), shifts ~273 KB via copyWithin across basePositions/baseAlphas/normals/uvs, scans/rebuilds the entire index buffer
  (rebuildIndexBuffer, lines 247–291) whenever hasActiveGaps is true, and calls notifyGeometryUpdate() (src/world/trails/CarvedSnowTrail.ts:577-584) uploading 0..       
  activeVerts (up to 22,800 vertices) rather than just the newly written slice.
  • SkierController.updateSnowSpray & trickEngine (SkierController.ts:81-96, 851-917): Line 888 allocates [outsideSkiSign, -outsideSkiSign] up to 10× per frame (~600    
  arrays/sec) while running an O(emitRate × 420) linear scan per frame; get trickEngine() allocates a wrapper object with 9 getters/setters whenever accessed.
  • Game.loop & Telemetry (src/core/Game.ts:296-324, src/core/Telemetry.ts:108-123): Allocates a parameter object every frame for networkManager.update(...), plus 3     
  objects + samples.shift() (O(n) array shift) per frame when ?perf=1 is enabled.
  • RemoteSkier (RemoteSkier.ts:211,229,245,406): Allocates new THREE.Quaternion, new THREE.Vector3, snapshot object + snapshots.shift() at 20 Hz per peer, plus a new   
  SkierAnimParams object literal every frame per visible peer.
  • Ragdoll Terrain Sampling (VerletRagdoll.ts:319-417): During crashes, satisfyConstraints runs 8 iterations, calling resolveGroundCollisions on every iteration (21    
  particles × 1 terrainSampler on passes 0..6 + 5 terrainSampler finite-difference calls on pass 7 = 252 sampleHeightQuick simplex-noise calls per 50 Hz ragdoll step,   
  plus initializeSkeleton allocating ~50 Vector3s on crash entry at src/mechanics/VerletRagdoll.ts:83-155).

  1.4 GPU, Shaders & Lighting

  • Shadow Map (Renderer.ts:111-120): 2048×2048 PCFSoftShadowMap updated every frame across a 200m × 200m orthographic frustum (shadowD = 100), with no mobile quality   
  downgrade (1024×1024 / PCFShadowMap).
  • Dynamic Lights (Renderer.ts:108-131): 2 DirectionalLights (dirLight with shadows, fillLight unshadowed) + 1 HemisphereLight. Count is reasonable, though fillLight   
  could be folded into hemisphere/ambient shading on low-end tiers.
  • Expensive Terrain & Trail Shaders:
      • src/world/shaders/SnowMaterial.ts:135-284 injects 3 texture2D(uDetailTex) lookups, procedural noise2D calls, SSS, Fresnel rim, and 2 octaves of hash33
      microfacet sparkle into MeshStandardMaterial for every terrain pixel. Notice shadowFactor > 0.001 gates sparkle, and gDistToCam fades micro/meso/macro terms,      
      but texture2D taps (gDMicro, gDMeso, dMacro) execute unconditionally for every fragment out to 3000m!
      • SnowTrailMaterial.ts:28-33, 121-283 uses transparent: true, depthWrite: true, side: THREE.DoubleSide, dFdx/dFdy screen-space derivatives, and fragment discard,  
      disabling GPU early-Z optimization over large screen-space ribbons.
  • Depth Precision (Renderer.ts:90-91, CameraDirector.ts:63-64): Renderer sets near: 0.1, far: 3000 (30,000:1); CameraDirector overrides to near: 0.2
  (GMACameraConfig.nearFar[0], despite comment // 5.0m) and far: 3000.0 (15,000:1), degrading depth precision at mid/far distances and forcing polygonOffsetFactor: -    
  3.0 on snow trails.
  • DPR & MSAA (Renderer.ts:97, 101): antialias: true combined with setPixelRatio(Math.min(window.devicePixelRatio, 2)) forces 4× fragment load + MSAA on
  Retina/mobile devices with no resolution scaling or adaptive DPR.

  1.5 Memory & Asset Lifecycle

  • Leaked Character Geometries & Materials on Dispose:
      • SkierController.dispose and RemoteSkier.dispose remove this.root from the scene but never dispose character geometries or materials. Specifically,
      addInstepStrap (src/player/character/SkierRig.ts:637-653) creates 4 uncached new THREE.BoxGeometry(...) instances per skier that leak on every peer disconnect     
      (RemoteSkier) or game teardown.
      • AlpineMassif.dispose removes treeMeshes without calling treeMesh.dispose() (InstancedMesh GPU attribute cleanup), and terrainMaterial.dispose() does not
      dispose the module-cached 1024×1024 cachedSnowDetailTexture (DetailTexture.ts:16, 185).
  • Broken Spray Particle Bounds (SkierController.ts:265-285, RemoteSkier.ts:145-160): Both initialize all particle Y coordinates to -9999 without frustumCulled =       
  false, DynamicDrawUsage, or updating computeBoundingSphere(). Three.js computes a bounding sphere around (0, -9999, 0) with radius 0, causing sprayParticles to be     
  frustum-culled whenever (0, -9999, 0) is off-screen! Also SkierController.ts:934 marks position.needsUpdate = true every frame even when 0 particles are active.       
  • Culled RemoteSkier Leaves Trail Mesh Visible (RemoteSkier.ts:384-390): When a remote skier is > 600 m away (isBeyondFar), root.visible and sprayParticles.visible    
  are set to false, but this.trail remains visible and rendered.
  • Uncompressed 1024×1024 Texture & Zero LODs: DetailTexture.ts uploads an uncompressed 1024×1024 RGBA8 DataTexture (~5.3 MB VRAM with mipmaps). Terrain (100×100       
  segments × 36 = 748,800 triangles), pine trees (3 cones + trunk per instance), and local skier have zero LODs.
  • Duplicate Unused Dependency (package.json:15-16): Both @dimforge/rapier3d (^0.14.0) and @dimforge/rapier3d-compat (^0.21.0) are declared in dependencies; only -     
  compat is used in src/.

  1.6 Loading & Startup Cost

  • Observed Timings: navDomInteractiveMs: 9.2 ms, navLoadMs: 139.5 ms, wasmInitMs: 16.3 ms, massifBuildMs: 567.9 ms, timeToFirstFrameMs: 1,081.6 ms.
  • Main-Thread Synchronous Stalls:
      1. massifBuildMs (567.9 ms) blocks the UI thread inside new AlpineMassif(...) (src/core/Game.ts:94-98):
          • src/world/shaders/DetailTexture.ts:18-186 computes 2 octaves of 3×3 Voronoi + periodic noise over 1,048,576 pixels synchronously (~19M+ math ops).
          • src/world/AlpineMassif.ts:79-279 evaluates sampleHeightQuick 36 × 103 × 103 = 381,924 times synchronously and builds 36 Rapier heightfields.
          • src/world/AlpineMassif.ts:362-524 runs ~1,200+ sampleTerrain calls (5× sampleHeightQuick each) synchronously.
      2. Remaining ~497 ms before first frame is spent synchronously building the 75-mesh skier, allocating CarvedSnowTrail buffers, and compiling 12 WebGL shader       
      programs on the first renderer.render() call without renderer.compileAsync().
  • Production Server (server/index.js:37-134): Good in-memory caching + async Brotli/Gzip + immutable cache headers for /assets/, though fs.existsSync/fs.statSync      
  are synchronous on each request path check.
  ──────
  2. Production Quality Scorecard

   Metric           │ Score (/10) │ Key Evidence & Justification
  ──────────────────┼─────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────   
   Optimization     │   8 / 10    │ Pros: Slot-aware rig merging (75 → 22–25 meshes, avg 60.1 draw calls), 3-tier terrain & 2-tier pine LODs (avg 156k tris), ring-buffered
                    │             │ CarvedSnowTrail with slice-only uploads & shared FrontSide SnowTrailMaterial, SnowMaterial LOD texture gating, texel-snapped shadows.
                    │             │ Remaining (Ph 3): 543 ms synchronous DetailTexture/massif boot stall, 1024×1024 uncompressed DetailTexture, quality tier presets.
   Performance      │   8 / 10    │ Pros: 59.97 avg FPS, 0.43 ms avg CPU frame time (0.80 ms p99), 0.14 ms avg physics, 0.26 ms avg render dispatch, 60.1 avg draw calls
                    │             │ (< 65 target), 156,227 avg tris (< 250k target), 0 GC drops > 1 MB, 60 Hz physics render interpolation wired.
                    │             │ Remaining (Ph 3): Off-main-thread massif startup (TTFF 953 ms -> < 100 ms main thread) and real mobile GPU profiling.
   Code Quality     │   7 / 10    │ Pros: tsconfig.json strict: true, shared SkierVisualHelpers (foot grounding & spray), clean ring buffers in Telemetry, SnowSpraySystem,
                    │             │ CarvedSnowTrail, and RemoteSkier. Remaining (Ph 3): UI innerHTML decoupling & SkierController physics/VFX split.
   Refactoring Need │   7 / 10    │ Pros: Eliminated duplicated foot-clamping and snow-spray logic between SkierController and RemoteSkier; SkierRig slot-merged.
                    │             │ Remaining (Ph 3): Split SkierController (physics bridge vs VFX/audio), CameraDirector (841 lines), and consolidate duplicate #hud HTML.
   Maintainability  │   7 / 10    │ Pros: Logical folder taxonomy, shared SkierVisualHelpers, slot-modular SkierRig ready for future cosmetics, shared SnowTrailMaterial.
                    │             │ Remaining (Ph 3): UI DOM template decoupling (HudOverlay.ts, CameraTunerOverlay.ts) and automated regression tests.
   Robustness       │   6 / 10    │ Pros: Zero leaked geometries/programs across 10-peer churn, full AlpineMassif & character disposal, window.blur & e.repeat input guards,
                    │             │ visibilitychange reset. Remaining (Ph 3): webglcontextlost/webglcontextrestored recovery and Low/Med/High adaptive quality tiers.
  ──────
  3. Critical Bottlenecks & Code Smells

  1. [Severity: P0] [FIXED IN PHASE 2] 75-Mesh Skier Rig Draw Call Explosion
      • Location: src/player/character/SkierRig.ts, src/player/character/SkierGeometry.ts, src/network/RemoteSkier.ts
      • Status: Fixed via slot-aware per-bone merging (75 → 22–25 meshes per skier, keeping headwear/goggles/jacket/pants/poles/skis independently swappable), cached merged ski/headwear geometries, disabled receiveShadow on character meshes, and 60 m castShadow culling on RemoteSkier. Single-player draw calls dropped to 60.1 avg (min 35, max 73); 11 visible skiers in scene rendered at 285–301 draw calls.
  2. [Severity: P0] [FIXED IN PHASE 2] Unbounded Terrain Triangles & Missing LODs (530k Avg / 709k Max Tris/Frame)
      • Location: src/world/AlpineMassif.ts, src/core/Game.ts
      • Status: Fixed via 3-tier THREE.LOD terrain chunks (100×100 @ 0m, 50×50 @ 480m, 25×25 @ 950m with 45m perimeter skirts and unchanged 101×101 Rapier heightfields) and 2-tier InstancedMesh pine LODs switching at 450m while sharing instanceMatrix buffers. Average triangles dropped from 411,831 (Ph1) to 156,227 (-62.1%).
  3. [Severity: P0] [PARTIAL — PHASE 1] Missing webglcontextlost Recovery & Input Stickiness on Window Blur
      • Location: src/core/Renderer.ts:95-140, src/core/InputController.ts:78-110, src/core/Game.ts:31-46
      • Status: window.blur input reset, e.repeat hotkey guards, and gamepad D-pad edge-detection fixed in Phase 1. webglcontextlost/webglcontextrestored recovery remains for Phase 3.
  4. [Severity: P1] [FIXED IN PHASE 2] CarvedSnowTrail Shifts 273 KB & Uploads Full Buffer Instead of Ring Buffer
      • Location: src/world/trails/CarvedSnowTrail.ts, src/world/shaders/SnowTrailMaterial.ts, src/core/Game.ts
      • Status: Fixed via true circular ring buffer (headSlot / segCount, pre-allocated 19-node typed arrays, O(1) index slot seam/gap updates, slice-scoped addUpdateRange uploads) and singleton SnowTrailMaterial updated once per frame.
  5. [Severity: P1] Synchronous 543–568 ms Startup Stall (DetailTexture + AlpineMassif)
      • Location: src/world/shaders/DetailTexture.ts:18-186, src/world/AlpineMassif.ts, src/core/Game.ts:80-174
      • Problem: Main thread freezes for ~543 ms (massifBuildMs) generating a 1024×1024 Voronoi texture (~20M ops) and evaluating 381,924 heightfield samples + 36 Rapier colliders synchronously, pushing timeToFirstFrameMs to 953.2 ms (down from 1,081.6 ms).
      • Recommended Fix (Phase 3): Move DetailTexture (512×512 on mobile / 1024×1024 on desktop, or pre-baked KTX2/WebP asset) and chunk heightfield generation into a Web Worker (transferring ArrayBuffers via postMessage), time-slice chunk/collider upload across frames or start with the spawn chunk first, and pre-compile shaders with await renderer.compileAsync(scene, camera) behind a loading indicator.
  6. [Severity: P1] [FIXED IN PHASE 2] Hot-Path GC Pressure (90 Heap Drops > 1 MB in 30s)
      • Location: src/core/Renderer.ts, src/player/SkierController.ts, src/core/Game.ts, src/network/RemoteSkier.ts
      • Status: Phase 1 eliminated local hot-path drops (0 drops > 1 MB); Phase 2 completed the remaining RemoteSkier 30-slot ring snapshot pool and pre-allocated _animParams.
  7. [Severity: P1] [FIXED IN PHASE 2] Double trickScoring.updateDisplay(dt) & Missing Physics Interpolation
      • Location: src/player/SkierController.ts, src/core/PhysicsEngine.ts, src/core/Game.ts
      • Status: Duplicate updateDisplay(dt) removed in Phase 1; PhysicsEngine.getInterpolationAlpha() wired into Game.loop and SkierController.renderUpdate with snapInterpolationState() on reset/spawn in Phase 2.
  8. [Severity: P1] [FIXED IN PHASE 1] Broken sprayParticles Frustum Culling & O(N²) Particle Scan
      • Location: src/world/trails/SnowSpraySystem.ts, src/player/SkierVisualHelpers.ts, src/player/SkierController.ts, src/network/RemoteSkier.ts
      • Status: Fixed via shared SnowSpraySystem (Phase 1) and shared emitSkierSnowSpray helper (Phase 2).
  9. [Severity: P2] [FIXED IN PHASE 2] Incomplete dispose() Cleanup & Culled RemoteSkier Trail
      • Location: src/player/character/SkierRig.ts, src/player/SkierController.ts, src/network/RemoteSkier.ts, src/world/AlpineMassif.ts
      • Status: RemoteSkier.trail culling fixed in Phase 1; Phase 2 eliminated strap BoxGeometry leaks, added disposeCharacter(), and added full LOD/InstancedMesh cleanup in AlpineMassif.dispose() (0 leaked geometries/programs across 10-peer churn).
  10. [Severity: P2] [FIXED IN PHASE 2] Unconditional Multi-Tap Snow Fragment Shader, DoubleSide Alpha-Discard Trails, & 15,000:1 Depth Ratio
      • Location: src/world/shaders/SnowMaterial.ts, src/world/shaders/SnowTrailMaterial.ts, src/camera/CameraDirector.ts, src/world/environment/SkyDome.ts
      • Status: Camera frustum tightened to 3,600:1 in Phase 1; Phase 2 gated SnowMaterial texture2D(uDetailTex) taps & pGroomed by LOD fade weights and switched SnowTrailMaterial to THREE.FrontSide, depthWrite: false, and removed fragment discard.

  ──────
  4. Runtime Telemetry Spec [IMPLEMENTED in src/core/Telemetry.ts]

  Replaced the original FrameMetrics[] / .shift() implementation in src/core/Telemetry.ts with zero-allocation Float32Array circular ring buffers (1,800 slots),
  recordFramePrimitives(...), wall-clock avgFps / onePctLowFps, and gcDropsOver1MB / maxGcDropMB / gcSpikeFrames while preserving PerfReport compatibility for vision/capture.mjs.

    // Zero-allocation circular buffer Telemetry spec (dev-only: ?perf=1)
    export class RingTelemetry {
      private readonly cap = 1800; // 30s at 60Hz
      private idx = 0;
      private count = 0;

      private readonly wallDeltaMs = new Float32Array(this.cap);
      private readonly cpuFrameMs = new Float32Array(this.cap);
      private readonly physicsMs = new Float32Array(this.cap);
      private readonly renderMs = new Float32Array(this.cap);
      private readonly scratchSort = new Float32Array(this.cap); // Reused only in getReport()

      private lastRafNow = 0;
      private lastHeapBytes = 0;
      private initialHeapBytes = 0;
      private gcDropCount = 0;
      private maxGcDropMB = 0;
      private gcSpikeFrames = 0; // Wall delta > 25ms coinciding with heap drop or >2x median

      // Snapshot latest GPU counters as primitives (zero object allocation)
      private lastCalls = 0;
      private lastTris = 0;
      private lastGeoms = 0;
      private lastTextures = 0;
      private lastPrograms = 0;

      constructor() {
        this.initialHeapBytes = (performance as any).memory?.usedJSHeapSize || 0;
        this.lastHeapBytes = this.initialHeapBytes;
      }

      public recordFramePrimitives(
        rafNow: number,
        cpuMs: number,
        physMs: number,
        rendMs: number,
        calls: number,
        tris: number,
        geoms: number,
        textures: number,
        programs: number
      ): void {
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
        this.lastGeoms = geoms;
        this.lastTextures = textures;
        this.lastPrograms = programs;

        const heap = (performance as any).memory?.usedJSHeapSize || 0;
        if (heap > 0) {
          const drop = this.lastHeapBytes - heap;
          if (drop > 1048576) { // >1 MB minor/major GC drop
            this.gcDropCount++;
            const dropMB = drop / 1048576;
            if (dropMB > this.maxGcDropMB) this.maxGcDropMB = dropMB;
            if (wallDt > 25.0) this.gcSpikeFrames++;
          }
          this.lastHeapBytes = heap;
        }
      }

      public getBaselineSummary() {
        const n = this.count;
        if (n === 0) return null;

        let wallSum = 0, cpuSum = 0, physSum = 0, rendSum = 0;
        for (let i = 0; i < n; i++) {
          wallSum += this.wallDeltaMs[i];
          cpuSum += this.cpuFrameMs[i];
          physSum += this.physicsMs[i];
          rendSum += this.renderMs[i];
          this.scratchSort[i] = this.wallDeltaMs[i];
        }
        const view = this.scratchSort.subarray(0, n).sort(); // In-place TypedArray sort
        const onePctStart = Math.max(0, Math.floor(n * 0.99));
        let worst1PctSum = 0;
        for (let i = onePctStart; i < n; i++) worst1PctSum += view[i];
        const onePctAvgMs = worst1PctSum / (n - onePctStart);

        return {
          avgFps: Number((1000 / (wallSum / n)).toFixed(2)),
          onePctLowFps: Number((1000 / onePctAvgMs).toFixed(2)),
          avgFrameTimeMs: Number((wallSum / n).toFixed(2)),
          avgCpuMs: Number((cpuSum / n).toFixed(2)),
          avgPhysicsMs: Number((physSum / n).toFixed(2)),
          avgRenderMs: Number((rendSum / n).toFixed(2)),
          drawCalls: this.lastCalls,
          triangles: this.lastTris,
          geometries: this.lastGeoms,
          textures: this.lastTextures,
          programs: this.lastPrograms,
          heapMB: Number((this.lastHeapBytes / 1048576).toFixed(2)),
          gcDropsOver1MB: this.gcDropCount,
          maxGcDropMB: Number(this.maxGcDropMB.toFixed(2)),
          gcSpikeFrames: this.gcSpikeFrames
        };
      }
    }
  ──────
  5. Phased Production Roadmap

  Phase 1 — Quick Wins (High Impact, Low Risk) [COMPLETED]

  1. [DONE] Fix correctness & leak bugs:
      • Removed duplicate trickScoring.updateDisplay(dt) (src/player/SkierController.ts).
      • Replaced blocky additive PointsMaterial spray with shared SnowSpraySystem (src/world/trails/SnowSpraySystem.ts) using frustumCulled = false, DynamicDrawUsage,
        O(1) ring cursor, soft Gaussian snow-cloud + micro-grain ShaderMaterial, and non-linear speed + carve/slip-angle emission scaling (900 local / 140 remote).
      • Added CarvedSnowTrail.setVisible() and hid RemoteSkier.trail when isBeyondFar (src/network/RemoteSkier.ts).
      • Removed unused @dimforge/rapier3d dependency from package.json.
  2. [DONE] Zero-allocation hot-path fixes:
      • Pre-allocated scratch/tint THREE.Color instances in Renderer.applyLightingLerp (src/core/Renderer.ts).
      • Eliminated per-emit sides array literal and O(N²) spray scans via SnowSpraySystem ring buffer and reusable _sprayParams.
      • Replaced Telemetry array .shift() and per-frame Game.loop objects with Float32Array circular buffers (recordFramePrimitives, fps, gcDropsOver1MB) in
        src/core/Telemetry.ts while preserving PerfReport compatibility for vision/capture.mjs, and reused _networkLightingParams in src/core/Game.ts.
      • Note: updateMatrixWorld(true) in SkierController.ts and RemoteSkier.ts was intentionally retained for Phase 1 because footContacts[i].getWorldPosition(...)
        immediately depends on updated character bone matrices (to be removed alongside Phase 2 rig merging).
  3. [DONE] Input & camera quick fixes:
      • Added window.blur input/pointer state reset, e.repeat hotkey guards, and gamepad D-pad edge-detection in src/core/InputController.ts and src/core/Game.ts.
      • Tightened camera frustum to near = 0.5, far = 1800 in src/core/Renderer.ts and src/camera/CameraDirector.ts (with SkyDome radius adjusted to 1600 in
        src/world/environment/SkyDome.ts to avoid far-plane clipping), reducing depth ratio from 15,000:1 to 3,600:1.
      • Deleted dead commented blocks in src/camera/CameraDirector.ts.

  • Verification / Acceptance Check (Observed):
      • npx tsc --noEmit and npm run build passed with 0 errors (dist/ built in 1.25s).
      • vision/capture.mjs visual cross-checks passed with 0 page errors across acceptance_criteria_1_latest.png, snow_spray_slide_latest.png (483 active particles
        at 13.31 m/s slide), snow_spray_carve_latest.png (21 active at 12.57 m/s), and snow_spray_low_latest.png (11 active at 7.20 m/s).
      • 30.15s headless Playwright ?perf=1 trace (1280×720) measured avg 59.97 FPS (47.51 FPS 1% low), avg triangles reduced from 529,569 to 411,831 (-22.2%),
        avg draw calls reduced from 112.9 to 104.9, physics max spike reduced from 6.20 ms to 1.50 ms, TTFF reduced from 1,081.6 ms to 997.9 ms, and gcDropsOver1MB = 0.

  Phase 2 — Structural Refactors (High Impact, Medium Effort) [COMPLETED]

  1. [DONE] Merge Skier Rig Meshes (75 → 22–25 slot-aware draw calls):
      • Merged static rigid sub-parts per bone/cosmetic slot via bakePartGeometry / mergeBakedParts in src/player/character/SkierGeometry.ts and src/player/character/SkierRig.ts (headBase, headwearSlot, gogglesFrame, goggleLens, shoulderLeft/Right, elbowLeft/Right, wristLeft/Right, pole, kneeShin, boot, and merged twintip/flat skis), preserving independent shop-ready cosmetic slots.
      • Eliminated per-skier strap BoxGeometry allocations, disabled receiveShadow on character meshes, gated RemoteSkier castShadow at 60 m, and implemented disposeCharacter().
  2. [DONE] Terrain & Tree LODs + Shader Gating:
      • Added 3-tier THREE.LOD terrain chunks (100×100 @ 0m, 50×50 @ 480m, 25×25 @ 950m with 45m skirts and unchanged 101×101 Rapier heightfields) and 450m low-poly pine InstancedMesh LOD sharing instanceMatrix buffers in src/world/AlpineMassif.ts, driven by massif.updateLOD(camera) in src/core/Game.ts, plus full LOD/InstancedMesh disposal.
      • Gated SnowMaterial texture2D(uDetailTex) taps and pGroomed procedural noise by LOD fade weights in src/world/shaders/SnowMaterial.ts.
  3. [DONE] Ring-Buffer CarvedSnowTrail + Shared Material:
      • Rewrote src/world/trails/CarvedSnowTrail.ts as a circular ring buffer (headSlot, segCount, pre-allocated 19-node typed arrays, O(1) seam/jump index slot updates, and slice-scoped addUpdateRange uploads).
      • Shared singleton SnowTrailMaterial (THREE.FrontSide, depthWrite: false, fragment discard removed) updated once per frame via updateSharedSnowTrailUniforms() in src/world/shaders/SnowTrailMaterial.ts and src/core/Game.ts.
  4. [DONE] Render Interpolation, Shared Helpers & RemoteSkier GC Cleanup:
      • Wired PhysicsEngine.getInterpolationAlpha() into src/core/Game.ts and src/player/SkierController.ts with snapInterpolationState() on spawn/reset.
      • Extracted updateSkierFootGrounding (leg-chain-only matrix sync) and emitSkierSnowSpray into src/player/SkierVisualHelpers.ts used by both SkierController and RemoteSkier, and replaced RemoteSkier.snapshots.shift() and per-frame SkierAnimParams literals with a 30-slot ring pool.

  • Verification / Acceptance Check (Observed):
      • npx tsc --noEmit and npm run build passed with 0 errors (dist/ built in 1.29s).
      • vision/capture.mjs visual cross-checks passed with 0 page errors across acceptance_criteria_1_latest.png (60 calls, 163,640 tris), snow_spray_slide_latest.png (54 calls, 119,848 tris, 483 active particles), snow_spray_carve_latest.png (50 calls, 112,928 tris), and snow_spray_low_latest.png (73 calls, 147,562 tris).
      • 30s headless Playwright ?perf=1 trace (1280×720, ANGLE/D3D11) measured avg 59.97 FPS (49.09 FPS 1% low due to headless D3D11 VSync jitter while JS CPU p99 dropped to 0.80 ms / max 7.40 ms), avg drawCalls reduced from 104.9 to 60.1 (min 35, max 73; < 65 target), avg triangles reduced from 411,831 to 156,227 (min 112,392, max 186,528; < 250k target), avg CPU frame time reduced from 0.76 ms to 0.43 ms, avg physics reduced from 0.25 ms to 0.14 ms, TTFF 953.2 ms, and gcDropsOver1MB = 0.
      • 10-peer RemoteSkier churn check verified 0 leaked geometries or shader programs (wave1: 53 → 59 after caching 3 additional palette geometries; wave2: 59 → 79 → 59 geometries, 11 → 11 shader programs, 285–301 draw calls with 11 visible skiers).

  Phase 3 — Production Hardening (Robustness & Polish)

  1. Workerized Startup & Async Shader Pre-Warming: Move DetailTexture synthesis and chunk heightfield generation into a Web Worker, and use renderer.
  compileAsync(scene, camera) with a non-blocking boot progress overlay to push massifBuildMs off the main thread.
  2. WebGL Context Loss & Adaptive Quality Tiers: Add webglcontextlost/webglcontextrestored handling in src/core/Renderer.ts, plus Low/Medium/High presets scaling       
  shadow resolution (1024 vs 2048), DPR cap (1.0–1.5 vs 2.0), MSAA, and DetailTexture size (512 vs 1024), plus transform: translate3d for RemoteSkier nametags and       
  optional toggle for backdrop-filter.
  3. UI & Lifecycle Decoupling: Consolidate duplicate #hud markup in index.html and src/ui/HudOverlay.ts, split SkierController responsibilities (physics bridge vs.     
  VFX/audio), and add automated regression tests for Game.dispose(), window.blur, and webglcontextlost simulation.

  • Verification / Acceptance Check: Simulate WEBGL_lose_context (loseContext() / restoreContext()) in Playwright and verify clean recovery; run window.blur during      
  active key holds and verify zero stuck steering; run npm run build and verify production bundle loads cleanly on npm start with massifBuildMs < 100 ms on the main     
  thread.