# Project Architecture & Handoff Guide

## 1. Project Overview & Scope
This project is a high-performance 3D browser-based simulation platform built with **TypeScript**, **Three.js** (WebGL PBR rendering), and **Rapier3D** (WebAssembly physics). 

The platform supports two major simulation modes:
1. **Alpine Freeride (Grand Mountain Adventure Ski Resort):**
   - A single massive 2.4 km × 2.4 km tilted escarpment (Alvdalen massif) sloping from a high alpine backwall (North, $z = -1200$, 520m summit) down to a wide flat frozen river lake basin (South, $z > 850$, $y = 0$).
   - Physics-driven snowboard freeride controller with carving, edge bite, surface-dependent friction (powder, piste, rock, ice), jump pop, and dynamic slope orientation.
   - Real-time aerial Trick Engine scoring airtime, grabs (Mute, Indie, Nose, Tail), multi-axis spins (180°–720°), front/back flips, combo multipliers, and crash detection.
   - Dynamic third-person chase camera with velocity-lookahead lag and debug Fly-Cam inspection mode.
2. **Procedural Off-Road Vehicle Simulation (Legacy / Dual-Stack):**
   - 4-wheel independent multi-probe raycast suspension, dual-range transfer case (**4H** and **4L Crawl 49.5:1**), automatic transmission with slope-lock, fluid torque converter simulation, and combined tire friction ellipse.
   - Infinite multi-pass heightfield terrain streaming pipeline with continuous SDF trail networks, river ravines, structure pads, and WebSocket binary transform multiplayer sync.

---

## 2. Technical Stack & Dependencies
* **Language & Runtime:** TypeScript (strict mode enabled in `tsconfig.json`).
* **Bundler / Dev Server:** Vite 5 (`vite`, `vite-plugin-wasm`, `vite-plugin-top-level-await`).
* **Graphics:** `three` (^0.170.0) with ACESFilmic tone mapping, PCFSoftShadowMap, vertex-colored low-poly terrain, and procedural instanced vegetation.
* **Physics:** `@dimforge/rapier3d-compat` (^0.21.0) running WASM multithreaded/SIMD with fixed 60Hz timestep accumulation.
* **Procedural Math:** Seeded `cyrb128` + `mulberry32` PRNG wrapped 2D simplex noise with domain warping and smoothstep evaluators.
* **Camera & Inputs:** Unified keyboard/gamepad controller with gamepad deadzone filtering, smooth mouse-look Euler rotation, and hotkey location teleports (1–6).

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
    ├── main.ts              # Game bootstrap, main loop, HUD, hotkeys & spawn director
    ├── boarder.ts           # Grand Mountain Adventure Snowboard Controller (GMA physics)
    ├── physics.ts           # Rapier3D world initialization & 60Hz accumulator
    ├── renderer.ts          # Three.js scene, camera, lighting (sun + hemi) & fog setup
    ├── camera.ts            # Dynamic follow camera director & free-flying Fly-Cam
    ├── input.ts             # Unified keyboard and gamepad input controller
    ├── car.ts               # Off-road vehicle controller (raycast suspension & drivetrain)
    ├── map.ts               # Proving ground testing map and obstacle colliders
    ├── remote-car.ts        # Multiplayer kinematic interpolation visualization
    ├── player/
    │   ├── SnowboardController.ts # Legacy snowboard prototype
    │   └── TrickEngine.ts         # Airborne trick, grab, spin, flip & score evaluator
    ├── world/               # Procedural Alpine & Terrain Pipelines
    │   ├── alpineHeightfield.ts   # 5-Layer Alvdalen Inclined Massif Procedural Engine
    │   ├── AlpineMassif.ts        # 6x6 Chunked Meshes, Rapier Colliders, Ice & Pine Groves
    │   ├── Phase1TestSlope.ts     # Minimalist debug test ramp
    │   ├── biomes/
    │   │   └── biomeEvaluator.ts  # Legacy slope/moisture/altitude vertex coloring
    │   ├── config/
    │   │   └── terrainConfig.ts   # Infinite wasteland chunk configuration
    │   ├── generators/
    │   │   ├── terrainWorker.ts   # Web Worker for threaded chunk generation
    │   │   ├── structurePlacer.ts # POI sites & pad flattening
    │   │   └── foliageSpawner.ts  # Foliage & boulder generator
    │   ├── managers/
    │   │   ├── TerrainChunk.ts    # Streaming chunk container
    │   │   └── TerrainManager.ts  # Chunk streaming pool & LOD queue
    │   └── math/
    │       ├── prng.ts            # Deterministic cyrb128 hash + mulberry32 PRNG
    │       ├── noiseLayers.ts     # Wasteland noise layers
    │       └── splineCarver.ts    # Road & trail spline carver
    └── network/
        ├── binary-sync.ts         # Binary transform serialization
        ├── interpolator.ts        # Snapshot interpolation buffer
        ├── network-manager.ts     # WebSocket connection manager
        └── protocol.ts            # Network packet schemas
```

---

## 4. Subsystem Breakdown & Implementation Details

### 4.1 Alvdalen Alpine Massif (`src/world/alpineHeightfield.ts` & `AlpineMassif.ts`)

The mountain is modeled as a 2.4 km × 2.4 km single inclined massif ($x \in [-1200, 1200]$, $z \in [-1200, 1200]$) structured into 5 procedural mathematical layers:

1. **Layer 1: The Tilted Wedge (Macro Slope):**
   $$t = \text{clamp}\left(\frac{850 - z}{2050}, 0, 1\right)$$
   $$h_{\text{wedge}} = 520 \cdot t^{1.45}$$
   - Generates a steep summit backwall at $z = -1200$ (520m high) that eases continuously into a flat shoreline at $z = 850$.
   - For $z > 850$, drops terrain to $-8\text{m}$ with low-frequency island crests above $y = 0$.
   - High alpine backwall and side containment ridges prevent riders from flying off the map boundaries.
2. **Layer 2: The Central Dividing Gorge:**
   - Meandering centerline: $x_{\text{center}} = \sin(z \cdot 0.0025) \cdot 90.0$.
   - Inverted Gaussian trench flaring from 180m wide at summit to 280m at river, carving 45% of $h_{\text{wedge}}$ down to a smooth valley floor that splits the massif into West Flank and East Bowl.
3. **Layer 3: Continuous Alpine Relief & Skiable Bowls:**
   - Wide multi-octave FBM harmonic relief ($\lambda \approx 400\text{m}\text{–}600\text{m}$, 75m amplitude) creating natural concave powder bowls and convex spur ridges.
   - Replaced artificial 1D global contour terracing with natural continuous downhill gradients ($18^\circ\text{–}28^\circ$) to preserve downhill momentum.
4. **Layer 4: Smooth Ski Chutes & Wind Lips:**
   - Domain-warped longitudinal drainage chutes along the fall line.
   - Undulating snow hummocks and wind lips ($\pm 2\text{m}\text{–}4\text{m}$) providing natural kicker pop without $C^0$ absolute-value crease cuts or jagged sawtooth artifacts.
5. **Layer 5: Surface Biomes & Readability Masking:**
   - **Snow (85%+ Dominance):** Crisp white snow (`#eef3f8`) covering all slopes up to $42^\circ$.
   - **Exposed Alpine Rock:** Warm brown-grey rock (`#6e5c52`) smoothly blended on steep precipices between $42^\circ$ and $50^\circ$, reaching full rock strata on cliffs $> 50^\circ$.
   - **Frozen River Ice:** Blue-grey ice (`#7da3b8`) for $y \le 0.5\text{m}$, coupled with a dedicated flat ice plane mesh at $y = 0$ for $z \in [800, 1220]$.
   - **Vegetation:** Instanced evergreen pine trees distributed via deterministic golden-angle copse clustering (groves) rather than uniform grid sampling to eliminate artificial tree rows.

### 4.2 Grand Mountain Adventure Snowboard Controller & Trick Engine (`src/boarder.ts` & `src/player/TrickEngine.ts`)

* **Grand Mountain Adventure (GMA) Physics Engine (`src/boarder.ts`):**
  - **Sidecut Carving Kinematics ($R_{sc} = 8.2\text{m}$):** Turning radius is dictated by the physical sidecut radius and edge roll tilt: $R = \frac{R_{sc}}{\sin(\theta_{edge}) + 0.08}$. Implements speed-dependent blending between low-speed ground pivot turning ($< 3.8\text{ m/s}$) and high-speed carved arc centripetal rotation ($\omega = \frac{v}{R}$).
  - **Edge Bite vs. Skidded Drift:** Evaluates centripetal G-demand ($a_c = v \cdot |\omega|$) against edge grip capacity ($a_{bite} = (12.5 + 9.5\sin(\theta_{edge})) \cdot \mu_{surface}$).
    - *Clean Carve:* Lateral slip is eliminated ($32\text{ s}^{-1}$ damp), forward speed is preserved ($> 99.8\%$), and procedural audio emits crisp high-frequency slicing.
    - *Skid / Hockey Stop:* Transverse Coulomb drag scrubs velocity, spraying wide snow plumes and triggering deep hollow snow plowing audio.
  - **Fall-Line Gravity & Pumping Momentum:** Projected downhill gravity $\vec{g}_\parallel = \vec{g} - (\vec{g} \cdot \vec{n})\vec{n}$ accelerates riders naturally down the fall line. Deep carving accumulates centrifugal leg strain loads; zero-crossing edge switches convert this unweighting energy into forward acceleration impulses scaled by alignment with the downhill fall-line gradient.
  - **Multi-Point Ground Sampling:** 3-point longitudinal probe array (Center, Nose $+0.65\text{m}$, Tail $-0.65\text{m}$) prevents clipping or snagging over convex crests, rollers, and kicker transitions.
  - **Rigorous Landing Impact Decomposition:** Completely eliminates outward bounce and spurious speed additions. Downward normal impact velocity ($\vec{v} \cdot \vec{n}$) is absorbed by snow deformation and 2nd-order hip spring compression, retaining 100% of tangential downhill momentum on transitions. Evaluates dual-axis touchdown alignment (pitch to slope normal and yaw to horizontal velocity vector), triggering severe speed scrubbing and crash wipeouts on flat drops $> 18\text{ m/s}$ or sideways touchdowns $> 46^\circ$.
* **Trick Engine (`src/player/TrickEngine.ts`):**
  - Monitors airborne state, tracking total airtime, rotation around all three Euler axes, and grab inputs.
  - Recognizes classic grabs (`Indie`, `Mute`, `Nosegrab`, `Tailgrab`), spins (180°, 360°, 540°, 720°), and front/back flips.
  - Multiplies trick points based on combo variety and cleanly detects crash landings when alignment exceeds tolerance or impact is severe.

### 4.3 Camera Director & Fly-Cam (`src/camera.ts`)

* **Snowboard Follow Camera:** Third-person trailing camera with speed-lag, orientation damping, dynamic pitch alignment, and FOV speed expansion.
* **Fly-Cam Mode (`[C]` Key):** Free-flight debug camera with WASD strafing, Space/Shift vertical translation, mouse-look Euler navigation, coordinate HUD, and drop-rider spawn feature.
* **Quick Teleport Hub (Hotkeys 1–6):**
  - `1`: Main Summit Peak (Glacier Chute) `(-100, -880)`
  - `2`: West Peak (Powder Highway) `(-680, -310)`
  - `3`: East Park Ridge (Slopestyle Run) `(650, -250)`
  - `4`: Mid-Mountain Hub Plateau `(0, 130)`
  - `5`: Base Village Lodge `(0, 900)`
  - `6`: Glacial Halfpipe Gully `(310, -60)`

---

## 5. Development & Verification Workflow

### Useful Commands
* **Start Dev Server:** `npm run dev` (starts Vite dev server at `http://localhost:5173`)
* **Start Multiplayer Server:** `npm run server` (starts WebSocket server on port 8080)
* **Typecheck & Production Build:** `npm run build` (`tsc && vite build`)
* **Preview Production Bundle:** `npm run preview`

---

## 6. Crucial Rules for Incoming Agents

1. **Heightfield Indexing Rule:** Rapier3D's heightfield array indexing is strictly `r * V + c` (where $r$ is along X and $c$ is along Z). Never transpose to `c * V + r`.
2. **Continuous Mountain Flow Rule:** Never apply 1D global contour quantizers (`smoothTerrace(h)`) or $C^0$ ridged noise (`1 - abs(noise)`) directly to mountain relief. Alpine freeride requires $C^1/C^2$ smooth differentiable slopes so riders maintain continuous downhill flow and snow meshes remain free of sawtooth normal creases.
3. **Snow Dominance Rule:** Ski resort visual readability requires 80%–90% snow coverage. Keep rock slope transition thresholds at $> 42^\circ\text{–}50^\circ$ so skiable surfaces stay white.
4. **Terminal & Safety Guardrails:** Follow the operating context rules in [AGENTS.md](file:///C:/Users/manis/Development/drive/AGENTS.md) (silent filtered command execution, turn caps, surgical patches, no reads of excluded paths).
