# Project Architecture & Handoff Guide

## 1. Project Overview & Scope
This project is a high-performance 3D browser-based off-road vehicle simulation built with **TypeScript**, **Three.js** (WebGL PBR rendering), and **Rapier3D** (WebAssembly physics).

The simulation features:
1. **Proving Ground (Testing Map):** Flat asphalt proving grounds with engineered obstacles (speed bumps, articulation mounds, multi-angle incline ramps, mud bogs, and rock-crawling boulder zones) for tuning vehicle kinematics and suspension compliance.
2. **Procedural Wasteland:** Infinite, deterministic, multi-pass heightfield terrain streaming pipeline driven by world seeds. Features continuous SDF trail networks, river ravines with water planes, terraced rock-crawling steps, mountain spines, slope/altitude/moisture vertex-colored biomes, deterministic POI structures with flattened pads, and instanced foliage/boulders with physical Rapier colliders (including winch anchors).
3. **Map Switcher & Seed Picker:** Real-time in-game UI to switch seamlessly between maps with custom seed input, randomizer, URL parameter synchronization, and kinematic spawn safety locks.
4. **Vehicle Dynamics & Drivetrain:** 4-wheel independent multi-probe raycast suspension, dual-range transfer case (**4H** and **4L Crawl 49.5:1**), automatic transmission with slope-lock, fluid torque converter simulation, and combined tire friction ellipse.
5. **Multiplayer Subsystems:** Real-time room-based co-op with binary transform broadcasting, kinematic interpolation, and teammate telemetry HUD.

---

## 2. Technical Stack & Dependencies
* **Language & Runtime:** TypeScript (strict mode enabled in `tsconfig.json`).
* **Bundler / Dev Server:** Vite 5 (`vite`, `vite-plugin-wasm`, `vite-plugin-top-level-await`).
* **Graphics:** `three` (^0.170.0) with ACESFilmic tone mapping, PCFSoftShadowMap, and vertex-colored low-poly materials.
* **Physics:** `@dimforge/rapier3d-compat` (^0.21.0) running WASM multithreaded/SIMD with fixed 60Hz timestep accumulation.
* **Procedural Math:** `simplex-noise` (^4.0.3) wrapped with seeded `cyrb128` + `mulberry32` PRNG.
* **Multi-threading:** Native Vite module Web Workers (`new Worker(new URL(...), { type: 'module' })`) for chunk heightfield calculation with zero-copy `ArrayBuffer` transfer.
* **Multiplayer Server:** Node.js with `ws` (^8.22.2) binary WebSocket protocol.

---

## 3. Directory & File Structure
```text
drive/
├── .gitignore               # Tracks sources, ignores node_modules/ and dist/
├── AGENTS.md                # Operating context guardrails & command safety rules
├── PROJECT.md               # This project architecture & handoff specification
├── index.html               # Main HTML entry point containing #game-canvas
├── package.json             # NPM dependencies & build scripts
├── tsconfig.json            # TypeScript compiler configuration
├── vite.config.ts           # Vite bundler plugins (WASM + Top-Level Await)
├── server/
│   └── index.js             # WebSocket multiplayer relay server
└── src/
    ├── main.ts              # Game bootstrap, main loop, map switching, HUD & inputs
    ├── physics.ts           # Rapier3D world initialization & 60Hz accumulator
    ├── renderer.ts          # Three.js scene, camera, lighting & shadow setup
    ├── car.ts               # Vehicle controller: raycast suspension, engine & drivetrain
    ├── map.ts               # Testing proving ground mesh and trimesh physics colliders
    ├── camera.ts            # Dynamic follow camera director with speed-lag
    ├── input.ts             # Unified keyboard and gamepad input controller
    ├── remote-car.ts        # Teammate remote car visual & kinematic interpolation
    ├── data/
    │   ├── vehicle-registry.ts # Vehicle config loader
    │   └── vehicles.json       # Chassis, wheel, suspension, engine & gearbox specs
    ├── network/
    │   ├── binary-sync.ts      # Binary transform serialization/deserialization
    │   ├── interpolator.ts     # Snapshot interpolation buffer
    │   ├── network-manager.ts  # WebSocket client connection & event handler
    │   └── protocol.ts         # Network message types and interfaces
    ├── types/
    │   └── vehicle.ts          # TypeScript interfaces for vehicle specs
    └── world/                  # Procedural Terrain Pipeline
        ├── config/
        │   └── terrainConfig.ts    # Seed, chunk dimensions, trail width & noise params
        ├── math/
        │   ├── prng.ts             # Deterministic cyrb128 hash + mulberry32 PRNG
        │   ├── noiseLayers.ts      # Macro massifs, spines, hummocks & bedrock ledges
        │   └── splineCarver.ts     # Bench-cut switchbacks, summit spurs & ruts
        ├── biomes/
        │   └── biomeEvaluator.ts   # Slope/moisture/altitude vertex colors & river carve
        ├── generators/
        │   ├── terrainWorker.ts    # Web Worker: computes heights, positions, colors
        │   ├── structurePlacer.ts  # Deterministic POI sites & radial pad flattening
        │   └── foliageSpawner.ts   # Jittered grid prop generator (trees & boulders)
        └── managers/
            ├── TerrainChunk.ts     # Chunk Mesh + Rapier Heightfield + Colliders
            └── TerrainManager.ts   # Dynamic chunk streaming, worker pool & LOD queue
```

---

## 4. Subsystem Breakdown & Implementation Details

### 4.1 Procedural Terrain Pipeline (`src/world/`)

#### Coordinate Alignment & Heightfield Indexing (CRITICAL RULE)
Rapier3D and Three.js synchronize on a common local origin `(cx * chunkSize, 0, cz * chunkSize)`.
* **Rapier Heightfield:** `ColliderDesc.heightfield(segments, segments, rapierHeights, scale)`
  * `segments = 128` per axis, grid is `129 x 129` vertices (`V = 129`).
  * Indexing: `const rapierIndex = r * V + c;` where `r` corresponds to the row along local **X** and `c` corresponds to the column along local **Z**.
  * Scale: `new RAPIER.Vector3(chunkSize, 1.0, chunkSize)`.
* **Three.js BufferGeometry:**
  * Positions: `vertIndex = r * V + c; positions[vertIndex * 3 + 0] = localX; positions[vertIndex * 3 + 1] = wy; positions[vertIndex * 3 + 2] = localZ;`
  * Winding: Counter-clockwise triangles `(a, d, b)` and `(b, d, e)` facing `+Y`.
* **Watertight Seams:** Vertices evaluate continuous world coordinates `(cx * chunkSize + localX, cz * chunkSize + localZ)`. The eastern edge of chunk $(cx, cz)$ strictly evaluates to the exact same $(worldX, worldZ)$ as the western edge of chunk $(cx+1, cz)$ ($0.0\text{m}$ seam delta).

#### Math Layers (`src/world/math/`):
1. **Macro Mountain Massifs & Spine Ridges (`getMacroTopography`):** Wide-wavelength continuous mountain bodies ($\lambda \ge 150\text{m}$, elevation up to $240\text{m}+$, slopes $15^\circ\text{–}38^\circ$) using domain-warped regional mountain masks ($\lambda \approx 2.5\text{km}$), hyperbolic smooth-abs rounded spines without $C^0$ needle creases, and secondary spurs/foothills.
2. **Drivable Off-Trail Surface Detail (`getOffRoadSurfaceDetail`):** Separates macro relief from surface roughness so off-trail hillslopes remain drivable under 4L crawling. Uses medium-scale hummocks ($\lambda \approx 45\text{m}, \pm 2.2\text{m}$), localized bedrock ledges in alpine rock zones (flat shelves with $40^\circ$ climbable ramps), and micro soil/root undulations ($\lambda \approx 8\text{m}, 0.28\text{m}$).
3. **Bench-Cut Mountain Switchbacks (`splineCarver.ts`):** Normalizes lateral Euclidean distance via arc-length derivative $\Delta z / \sqrt{1 + (Z'(x))^2}$ to prevent hairpin pinching. Climbs dynamically with the mountain's centerline macro height, carving a level $7.0\text{m}$ bench shelf with a $15\text{m}$ graded mountain bank, dual wheel ruts ($-0.12\text{m}$), and center road crown ($+0.08\text{m}$).
4. **Secondary Summit Spur Trails:** Narrower single-track $4.8\text{m}$ ridge climbs ($X(z)$ running perpendicular to the arterial route) climbing to radio towers, fire lookouts, and alpine summits.

#### Biomes & Riverbeds (`src/world/biomes/`):
* **3-Tier Altitude & Slope Biomes (`biomeEvaluator.ts`):**
  1. **Valley Floor & Boreal Forest ($0\text{m}\text{–}65\text{m}$):** Dense pine forest, rich olive moss/earth modulated by Laplacian curvature, deep brown mud washouts (friction 0.35), compacted dirt trail (friction 0.82), forest floor (friction 0.78).
  2. **Sub-Alpine Timberline & Scree ($65\text{m}\text{–}145\text{m}$):** Trees thin out by 70%, golden-brown alpine tundra grass (friction 0.85), exposed slate rock outcrops with horizontal sedimentary strata banding $\sin(\text{worldY} \cdot 1.8) \cdot 0.06$ (friction 0.95).
  3. **High Alpine Peaks & Snow Slopes ($145\text{m}+$):** Crisp alpine snow on slopes under $38^\circ$ (`slope <= 0.65`, friction 0.42), dark basalt cliff rock strata where `slope > 0.65` (friction 0.95).
* Rivers carve channels where $|noise(x, z)| < 0.045$ down to `riverLevel - 2.5m` strictly in low valley/lake basins ($y < 35\text{m}$), never carving trenches through alpine mountain peaks.

#### Structures & Props (`src/world/generators/`):
* **Structure Placer (`structurePlacer.ts`):** Evaluates deterministic POIs (Fuel Depots, Outposts, Cabins, Watchtowers) and applies radial pad flattening with blend skirts before heightfield creation.
* **Foliage Spawner (`foliageSpawner.ts`):** Emits transformation matrices for `THREE.InstancedMesh` (pine trees and dodecahedron boulders) and fixed Rapier colliders:
  * **Timberline Transition:** Dense forest below $65\text{m}$, 70% tree thinning between $65\text{m}\text{–}135\text{m}$, and complete tree cut-off above $135\text{m}$.
  * **Winch Anchors:** Trees located along trail shoulders or on steep hillsides ($>0.32$ slope) are flagged with `{ type: 'winch_anchor' }`.
  * **Ridge Boulders:** Clustered physical boulder colliders placed along technical rock crawls, steep switchback shoulders, and alpine scree slopes.

#### Worker Offloading & Streaming (`src/world/managers/`):
* **`terrainWorker.ts`:** Computes chunk geometry off the main thread and transfers typed arrays (`rapierHeights`, `positions`, `normals`, `colors`, `indices`, instance matrices) via zero-copy transferable buffers.
* **`TerrainChunk.ts`:** Assembles Three.js mesh, Rapier heightfield collider, instanced meshes, and structure colliders. Exposes `dispose()` for leak-free unmounting.
* **`TerrainManager.ts`:** Pools Web Workers, coordinates distance-sorted chunk generation centered on the car, unloads chunks beyond `viewRadiusChunks + 1` (Chebyshev distance), caches shared materials to prevent shader compilation hitches, and provides `waitForChunk(cx, cz)` promises.

---

### 4.2 Map Switching & Spawn Safety (`src/main.ts`)
* **Interactive UI:** Floating glassmorphism HUD panel (`#map-select`, `#seed-input`, random seed button 🎲, and `#apply-map-btn`).
* **URL Synchronization:** Automatically updates `?map=procedural&seed=...` or `?map=training` without reloading.
* **Spawn Safety Lock:** When switching maps, vehicle rigid bodies are frozen as `KinematicPositionBased`. The manager queues chunks centered on `(spawnX, spawnZ)` and awaits `waitForChunk(spawnCx, spawnCz)`.
* **BVH Broadphase Step:** `physics.world.step()` is invoked once before dynamic activation to ensure Rapier builds its broadphase BVH index for new heightfield colliders.
* **Spawn Elevation:** Vehicle chassis center is placed at `groundY + 0.85m` (calibrated so tire bottoms softly contact the surface at `groundY` with rest suspension length).

---

### 4.3 Vehicle Kinematics & Physics (`src/car.ts`)
* **Chassis Body:** Dynamic Rapier body with lower center of mass `(0, -0.35, 0)` and cuboid collision volume.
* **Multi-Probe Raycast Suspension:** Each wheel casts multi-probe rays across the tire curvature up to `maxRayDist = suspensionRestLength + radius (1.03m)`.
* **Asymmetric Damping:** Progressive rising-rate spring + softer compression damping (bump) to absorb hits without harshness, stiffer rebound damping to prevent pogo oscillation.
* **Drivetrain & Transfer Case:**
  * **4H (High Range):** Fast trail cruising (14.8:1 overall reduction).
  * **4L (Low Range):** Rock crawling (49.5:1 crawl ratio) with automatic slope-hold gear locks.
  * Friction ellipse combines longitudinal slip ratio and lateral slip angle.

---

### 4.4 Multiplayer Co-op Network (`src/network/`)
* **Topology:** Central Node.js WebSocket server (`server/index.js`) managing 1–4 player rooms (`TRAIL-1`, etc.).
* **Binary State Sync:** Active drivers broadcast packed binary transform packets (position, quaternion, linear/angular velocity, suspension compression, wheel steer) at 60Hz moving / 12Hz idle.
* **Remote Interpolation:** `RemoteCar` uses buffer interpolation (`src/network/interpolator.ts`) to render smooth motion under packet jitter.

---

## 5. Development & Verification Workflow

### Useful Commands
* **Start Dev Server:** `npm run dev` (starts Vite dev server)
* **Start Multiplayer Server:** `npm run server` (starts WebSocket server on port 8080)
* **Typecheck & Production Build:** `npm run build` (`tsc && vite build`)
* **Preview Production Bundle:** `npm run preview`

---

## 6. Crucial Rules for Incoming Agents

1. **Heightfield Indexing Rule:** Rapier3D's heightfield array indexing is strictly `r * V + c` (where $r$ is along X and $c$ is along Z). Never transpose to `c * V + r`, as that rotates/mirrors physics 90 degrees across the diagonal, causing vehicles to fall through the visual mesh.
2. **Spawn Await Rule:** When moving, resetting, or spawning vehicles, always query `terrainManager.waitForChunk(cx, cz)` and invoke `physics.world.step()` before switching rigid body type to `Dynamic`.
3. **Raycast Suspension Decoupling:** Never bind visual wheels directly into the chassis collision shape. Wheels must remain dynamically positioned in `Car.syncRender()` based on suspension compression and steer angles.
4. **Terminal & Safety Guardrails:** Follow the operating context rules in [AGENTS.md](file:///C:/Users/manis/Development/drive/AGENTS.md) (silent filtered command execution, turn caps, surgical diff patches, no eager reads of excluded paths).
