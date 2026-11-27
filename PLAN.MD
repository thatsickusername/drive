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

   Metric                                     │ Pre-Phase-1 Baseline                                         │ Post-Phase-1 Observed                                    │ Notes / Delta
  ────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────
   Average FPS / 1% Low FPS                   │ 60.02 FPS / 48.87 FPS                                        │ 59.97 FPS / 47.51 FPS                                    │ VSync-capped; 1% low now measured directly in Telemetry.ts
   JS CPU Frame Time                          │ avg 0.74 ms, p50 0.70 ms, p95 1.00 ms, p99 1.40 ms, max 8.00 │ avg 0.76 ms, p50 0.70 ms, p95 1.00 ms, p99 1.30 ms, max  │ p99 (-0.10 ms) & max (-0.50 ms) improved in Game.loop
                                              │ ms                                                           │ 7.50 ms                                                  │
   Physics vs. Render CPU Time                │ Physics: avg 0.24 ms (p95 0.40 ms, max 6.20 ms)Render        │ Physics: avg 0.25 ms (p95 0.40 ms, max 1.50 ms)Render    │ Physics max spike dropped 6.20 -> 1.50 ms (-75.8%)
                                              │ dispatch: avg 0.47 ms (p95 0.60 ms, max 7.60 ms)             │ dispatch: avg 0.47 ms (p95 0.60 ms, max 6.90 ms)         │
   Draw Calls (renderer.info.render.calls)    │ min 92, avg 112.9, max 124                                   │ min 85, avg 104.9, max 124                               │ -8.0 avg draw calls (-7.1%) from far=1800 culling
   Triangles (renderer.info.render.triangles) │ min 319,186, avg 529,569, max 709,330                        │ min 137,008, avg 411,831, max 709,330                    │ -117,738 avg tris/frame (-22.2%); -57.1% min tris
   GPU Memory (renderer.info.memory)          │ 83 geometries, 2 textures, 12 shader programs                │ 85 geometries, 2 textures, 13 shader programs            │ +1 shader program for soft SnowSpraySystem ShaderMaterial
   JS Heap (performance.memory)               │ 41.34 MB start → 43.71 MB end (min 41.28, max 49.74 MB)      │ 10.11 MB flat (gcDropsOver1MB: 0, maxGcDropMB: 0,        │ Headless Chromium buckets performance.memory without
                                              │ (~90 GC drops > 1 MB in 30s)                                 │ gcSpikeFrames: 0)                                        │ --enable-precise-memory-info; 0 drops > 1 MB observed
   Startup (?perf=1 marks)                    │ wasmInitMs: 16.3 ms, massifBuildMs: 567.9 ms,                │ wasmInitMs: 13.9 ms, massifBuildMs: 546.2 ms,            │ TTFF -83.7 ms (-7.7%); navDomInteractiveMs 10.9 ms,
                                              │ timeToFirstFrameMs: 1,081.6 ms                               │ timeToFirstFrameMs: 997.9 ms                             │ navLoadMs 123.8 ms (dev server)

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
   Optimization     │   5 / 10    │ Pros: Chunked InstancedMesh pines & static matrixAutoUpdate = false (AlpineMassif.ts:256,500-523), texel-snapped shadows
                    │             │ (src/core/Renderer.ts:241-262), shared skier geo/mat caches (src/player/character/SkierRig.ts:50-103).Cons: 75 draw calls per        
                    │             │ skier, 530k avg / 709k max tris with zero LODs, CarvedSnowTrail shifts 273 KB & re-uploads active buffer instead of ring buffer,     
                    │             │ duplicate SnowTrailMaterial per trail, broken sprayParticles frustum culling.
   Performance      │   6 / 10    │ Pros: Live trace hits 60.02 avg FPS (0.74 ms avg CPU frame time, 0.24 ms avg physics).Cons: 48.87 FPS 1% low, 92–124 draw calls      
                    │             │ in single-player (>100 mobile cap), 90 GC drops >1 MB in 30s (Renderer.applyLightingLerp, CarvedSnowTrail, SkierController,
                    │             │ Telemetry), 1,081.6 ms TTFF with 567.9 ms synchronous freeze.
   Code Quality     │   6 / 10    │ Pros: tsconfig.json strict: true, clean PiecewiseCurve Float32Array evaluator (src/mechanics/PiecewiseCurve.ts), clear
                    │             │ shader/physics documentation.Cons: Large commented-out dead blocks (CameraDirector.ts:507-641,735-755), duplicate
                    │             │ updateDisplay(dt) call (src/player/SkierController.ts:789-790), wrong // 5.0m near-plane comment
                    │             │ (src/camera/CameraDirector.ts:63), unused @dimforge/rapier3d dep (package.json:15).
   Refactoring Need │   5 / 10    │ Pros: Pure src/mechanics/ cleanly separated from Three.js.Cons: Massive multi-responsibility files (SkierAnimator.ts 1,389 lines,    
                    │             │ SkierController.ts 962, GmaPlayerPhysics.ts 934, SkierRig.ts 874, CameraDirector.ts 841); duplicated foot-clamping & snow-spray      
                    │             │ code between src/player/SkierController.ts:730-935 and src/network/RemoteSkier.ts:430-643; duplicate #hud HTML in
                    │             │ index.html:42-46 and src/ui/HudOverlay.ts:63-127.
   Maintainability  │   6 / 10    │ Pros: Logical folder taxonomy (core/, mechanics/, player/, world/, camera/, network/, ui/) and documented invariants in
                    │             │ Project.md.Cons: UI built via large raw innerHTML templates and global DOM IDs (src/ui/HudOverlay.ts:87-164,
                    │             │ src/camera/CameraTunerOverlay.ts:85-215); SkierController couples physics sync, Rapier, audio, spray, trail ribbon, and
                    │             │ animation.
   Robustness       │   4 / 10    │ Pros: visibilitychange resets accumulator & lastTime (src/core/Game.ts:47-54), delta clamped + maxSubSteps = 5
                    │             │ (src/core/PhysicsEngine.ts:17-33), try/catch audio fallback (src/audio/SnowAudio.ts:27-99).Cons: Zero
                    │             │ webglcontextlost/webglcontextrestored handling, no window.blur key/mouse release (stuck inputs on Alt-Tab), unguarded e.repeat /     
                    │             │ gamepad D-pad toggles (InputController.ts:88-106,227-233), leaked geometries on dispose(), no low-end WebGL fallback or quality      
                    │             │ presets.
  ──────
  3. Critical Bottlenecks & Code Smells

  1. [Severity: P0] 75-Mesh Skier Rig Draw Call Explosion
      • Location: src/player/character/SkierRig.ts:355-703, src/network/RemoteSkier.ts:113-121
      • Problem: Every skier spawns 75 separate THREE.Mesh objects (9 meshes just for the beanie pom-pom, 5 per pole, 6 visible per ski, 7 per boot), all with
      castShadow = true and receiveShadow = true. Even a single skier pushes live draw calls to 92–124 (exceeding the 100-call mobile budget); 7 visible multiplayer     
      skiers exceed the 500-call desktop budget.
      • Recommended Fix: Merge static rigid sub-parts per joint bone into single geometries using vertex colors or a 1D palette UV atlas (reducing a skier from 75       
      meshes to ~16 bone meshes: hips/torso, head+beanie+goggles, 6 arm segments with merged poles, 6 leg/boot segments with merged skis), and disable receiveShadow     
      on small character parts and castShadow on RemoteSkier beyond ~60 m.
  2. [Severity: P0] Unbounded Terrain Triangles & Missing LODs (530k Avg / 709k Max Tris/Frame)
      • Location: src/world/AlpineMassif.ts:22-24, 50-280, 500-523
      • Problem: All 36 terrain chunks (400m × 400m) use uniform 100×100 segments (20,800 tris/chunk = 748,800 total) out to 3,000 m, with no distance LODs on terrain   
      or pine trees.
      • Recommended Fix: Generate 2–3 terrain mesh LODs per chunk (100×100 near, 50×50 mid, 25×25 far, keeping skirts/shared edge stitching or THREE.LOD), add a
      simpler 1-cone + trunk LOD for distant pine InstancedMeshes (> 450 m), and tighten camera far with fog (far = 1600 matching fog.far = 1500 in
      src/core/Renderer.ts:82).
  3. [Severity: P0] Missing webglcontextlost Recovery & Input Stickiness on Window Blur
      • Location: src/core/Renderer.ts:95-140, src/core/InputController.ts:78-110, src/core/Game.ts:31-46
      • Problem: No webglcontextlost / webglcontextrestored listeners exist on #game-canvas, so GPU driver resets or mobile background eviction permanently freeze       
      rendering. InputController lacks a window.blur handler to clear keyState and isPointerActive, causing permanently stuck carving/braking if the user Alt-Tabs       
      while holding a key; keydown handlers also lack if (e.repeat) return;.
      • Recommended Fix: Add webglcontextlost (e.preventDefault(), pause rAF) and webglcontextrestored (re-upload/re-init or show clean recovery overlay) in
      Renderer/Game; add window.blur in InputController to zero keyState, mouseDeltaX/Y, isPointerActive, and keyboardSteer; guard discrete toggles with !e.repeat and   
      gamepad edge-detection.
  4. [Severity: P1] CarvedSnowTrail Shifts 273 KB & Uploads Full Buffer Instead of Ring Buffer
      • Location: src/world/trails/CarvedSnowTrail.ts:418-493, 577-584
      • Problem: Every 0.20 m of skiing allocates a 19-object nodes array, shifts ~273 KB across 4 Float32Arrays via copyWithin, rewrites up to 1,199 segments of        
      indices when gaps exist, and uploads 0..activeVerts (up to 22,800 vertices) instead of only the newly emitted slice. Multiplied per RemoteSkier, this saturates    
      CPU memory bandwidth and WebGL bufferSubData.
      • Recommended Fix: Replace linear-shift arrays with a true circular ring buffer (headIndex modulo maxSegments), pre-allocate a static flat Float32Array/typed      
      scratch layout for the 19 cross-section offsets, encode jump gaps via degenerate/NaN or zero-alpha slices instead of rebuilding the index buffer, share one        
      SnowTrailMaterial across all trails, and upload only the 19 new vertices (19 * stride) per emit.
  5. [Severity: P1] Synchronous 568 ms Startup Stall (DetailTexture + AlpineMassif)
      • Location: src/world/shaders/DetailTexture.ts:18-186, src/world/AlpineMassif.ts:79-170, src/core/Game.ts:80-174
      • Problem: Main thread freezes for 567.9 ms (massifBuildMs) generating a 1024×1024 Voronoi texture (~20M ops) and evaluating 381,924 heightfield samples + 36      
      Rapier colliders synchronously, pushing timeToFirstFrameMs to 1,081.6 ms (including synchronous first-frame shader compilation).
      • Recommended Fix: Move DetailTexture (512×512 on mobile / 1024×1024 on desktop, or pre-baked KTX2/WebP asset) and chunk heightfield generation into a Web
      Worker (transferring ArrayBuffers via postMessage), time-slice chunk/collider upload across frames or start with the spawn chunk first, and pre-compile shaders    
      with await renderer.compileAsync(scene, camera) behind a loading indicator.
  6. [Severity: P1] [FIXED IN PHASE 1] Hot-Path GC Pressure (90 Heap Drops > 1 MB in 30s)
      • Location: src/core/Renderer.ts:184-221, src/player/SkierController.ts, src/core/Game.ts, src/network/RemoteSkier.ts
      • Status: Fixed for Renderer.applyLightingLerp, SkierController/SnowSpraySystem, Game.loop network/telemetry objects, and Telemetry ring buffers (0 GC drops > 1 MB observed in post-Phase-1 30s trace). Remaining: RemoteSkier 20 Hz snapshot shift() & per-frame SkierAnimParams literal.
  7. [Severity: P1] [PARTIAL — PHASE 1] Double trickScoring.updateDisplay(dt) & Missing Physics Interpolation
      • Location: src/player/SkierController.ts:789-790, src/core/PhysicsEngine.ts:40-42, src/core/Game.ts:235-243
      • Status: Duplicate updateDisplay(dt) removed in Phase 1. PhysicsEngine.getInterpolationAlpha() render interpolation remains for Phase 2.
  8. [Severity: P1] [FIXED IN PHASE 1] Broken sprayParticles Frustum Culling & O(N²) Particle Scan
      • Location: src/world/trails/SnowSpraySystem.ts, src/player/SkierController.ts, src/network/RemoteSkier.ts
      • Status: Fixed via shared SnowSpraySystem (frustumCulled = false, DynamicDrawUsage, O(1) ring cursor, dirty-only attribute uploads, and soft powder ShaderMaterial scaled by speed & carve angle).
  9. [Severity: P2] [PARTIAL — PHASE 1] Incomplete dispose() Cleanup & Culled RemoteSkier Trail
      • Location: src/player/SkierController.ts, src/player/character/SkierRig.ts:637-653, src/network/RemoteSkier.ts, src/world/AlpineMassif.ts:549-565
      • Status: RemoteSkier.trail visibility culling (> 600 m) fixed in Phase 1 via CarvedSnowTrail.setVisible(). Strap geometry caching and full rig/massif dispose() remain for Phase 2.
  10. [Severity: P2] [PARTIAL — PHASE 1] Unconditional Multi-Tap Snow Fragment Shader, DoubleSide Alpha-Discard Trails, & 15,000:1 Depth Ratio
      • Location: src/world/shaders/SnowMaterial.ts:135-284, src/world/shaders/SnowTrailMaterial.ts:28-33, 281-283, src/camera/CameraDirector.ts, src/world/environment/SkyDome.ts
      • Status: Camera frustum tightened to near = 0.5, far = 1800 (3,600:1 depth ratio) with SkyDome radius 1600 in Phase 1 (-22.2% avg triangles). Shader LOD branching and FrontSide/depthWrite:false trail material remain for Phase 2.

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

  Phase 2 — Structural Refactors (High Impact, Medium Effort)

  1. Merge Skier Rig Meshes (75 → ~16 draw calls): Merge static geometry per bone (torso/collar, head/beanie/9-part pom-pom/goggles, upper/forearm+pole segments,        
  shin/boot/straps, ski parts) via mergeGeometries with vertex colors or palette material slots in src/player/character/SkierRig.ts and
  src/player/character/SkierGeometry.ts. Cache strap geometries and implement disposeCharacter(character).
  2. Terrain & Tree LODs + Shader Gating: Add 50×50 / 25×25 chunk LODs in src/world/AlpineMassif.ts, add distant pine LOD, and gate SnowMaterial texture2D taps by       
  distance LOD weights (src/world/shaders/SnowMaterial.ts:135-192).
  3. Ring-Buffer CarvedSnowTrail + Shared Material: Rewrite src/world/trails/CarvedSnowTrail.ts as a circular ring buffer uploading only 19 vertices per emit,
  eliminate the per-emit nodes object array, and share a single SnowTrailMaterial (FrontSide, depthWrite: false, no discard) across local and remote skiers.
  4. Render Interpolation & Shared Helpers: Wire PhysicsEngine.getInterpolationAlpha() into src/core/Game.ts and src/player/SkierController.ts; extract shared foot-     
  grounding & snow-spray modules used by both SkierController and RemoteSkier.

  • Verification / Acceptance Check: Re-run the 30s ?perf=1 trace and verify single-player drawCalls < 65 (under mobile 100 budget), triangles < 250,000 avg, 1% Low     
  FPS >= 57, and 0 leaked geometries/materials after spawning and disconnecting 10 mock RemoteSkier peers.

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