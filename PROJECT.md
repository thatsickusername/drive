# Alpine Freeride: Project Architecture & Technical Specification

> **Platform:** 3D Browser-Based Alpine Freeride & Ski Simulation  
> **Core Stack:** TypeScript, Three.js (WebGL PBR), Rapier3D (WASM Physics), Vite 5  
> **Status:** Active Production Specification (Post-Legacy Cleanup)  

---

## 1. Project Overview & Scope

**Alpine Freeride** is a high-performance 3D ski and snowboard simulation inspired by *Grand Mountain Adventure* (GMA). The game simulates freeride skiing down a massive 2.4 km × 2.4 km inclined alpine massif (*Alvdalen*), dropping 520 vertical meters from high glacial peaks down into a frozen valley basin.

### Key Capabilities
* **Alpine Freeride Simulation:**
  * Procedural low-poly skier rig with real-time inverse kinematics (poling strides, carving body lean, tucking, jump pops, aerial 3-axis spins and flips).
  * High-fidelity physics running authentic GMA mechanics: sidecut carving, dynamic edge bite grip, transverse slide drift boosts, hockey stop braking, switch riding, and a 50 Hz Verlet particle ragdoll crash solver.
  * Realtime aerial trick scoring system tracking airtime, grabs (Safety, Mute, Japan, Tail), spins (180°–720°), flips, combo multipliers, and landing stomps.
* **Procedural Alpine Massif:**
  * 2.4 km × 2.4 km inclined continuous escarpment ($x \in [-1200, 1200]$, $z \in [-1200, 1200]$) generated via a 5-layer mathematical model.
  * 6×6 chunked Three.js meshes with Rapier3D WebAssembly heightfield colliders, skirts, vertex-colored slope biomes, and instanced pine groves.
* **Atmospheric PBR Shading & Snow Trails:**
  * Micro-sparkle snow surface PBR shader with leeward shadow coloring and procedural normal perturbation.
  * Dynamic carved ski ruts generated as continuous ribbon meshes with normal-mapped rut indentation.
  * Atmospheric sky dome, diurnal Day/Golden/Night cycle, and glistening airborne sun glint crystals.
* **Presentation & Inspection Suite:**
  * Dynamic third-person trailing follow camera with speed lag, asymmetric elastic damping, and FOV expansion.
  * GMA Isometric Tilt-Shift perspective mode (`[V]` key).
  * In-game runtime Camera Tuner Overlay (`[O]` key) and 6DOF debug Fly-Cam (`[C]` key).
  * Instant mountain teleport hub across 6 mountain peaks (`[1]`–`[6]` hotkeys).

---

## 2. Technical Stack & Dependencies

* **Language & Runtime:** TypeScript 5 (Strict mode enabled in `tsconfig.json`).
* **Bundler & Tooling:** Vite 5 with `vite-plugin-wasm` and `vite-plugin-top-level-await`.
* **Graphics Engine:** Three.js (^0.170.0) with ACESFilmic tone mapping, PCFSoftShadowMap, custom GLSL shader materials, and buffer geometry merging.
* **Physics Engine:** `@dimforge/rapier3d-compat` (^0.21.0) running WebAssembly with 60Hz fixed timestep accumulation.
* **Procedural Math:** Seeded `cyrb128` + `mulberry32` PRNG with continuous 2D simplex noise and domain warping.
* **Visual Regression Harness:** Playwright automated screenshot testing suite in `vision/`.

---

## 3. Directory & File Structure

The `src/` tree contains exactly 35 active, reachable modules:

```text
drive/
├── .gitignore                          # Git tracking exclusions
├── AGENTS.md                           # Operating guardrails & command safety rules
├── DEPLOYMENT.md                       # Production deployment guide
├── Dockerfile                          # Multi-stage production container build
├── index.html                          # Main HTML entry point containing #game-canvas
├── package.json                        # Dependencies, scripts & build pipelines
├── PLAN.MD                             # Refactoring roadmap & multiplayer blueprint
├── PROJECT.md                          # This architecture specification
├── render.yaml                         # Cloud web service deployment config
├── tsconfig.json                       # TypeScript compiler options
├── vite.config.ts                      # Vite WASM and top-level await plugins
├── server/
│   └── index.js                        # HTTP production asset server & WebSocket relay
├── vision/                             # Automated screenshot visual regression suite
│   ├── capture.mjs                     # Playwright capture automation harness
│   ├── reference/                      # Acceptance criteria baseline screenshots
│   └── screenshots/                    # Generated test runs
├── mechanics/                          # GMA C++ & YAML Reference Specifications
│   ├── Controls.cpp / .hpp             # Extracted steering curve implementation
│   ├── PlayerPhysics.cpp / .hpp        # Extracted 333Hz carving & fall-line physics
│   ├── VerletRagdoll.cpp / .hpp        # Extracted 50Hz particle ragdoll solver
│   ├── TrickScoring.cpp / .hpp         # Extracted trick scoring equations
│   └── config/*.yaml                   # 34 decrypted GMA parameter files
├── terrain_and_rendering/              # GMA Shader & Environment Reference Specs
│   ├── shaders/Ground/*.glsl           # Decrypted ground snow & ski mark shaders
│   ├── shaders/Items/*.glsl            # Decrypted particle & foliage shaders
│   └── lighting_and_seasons/           # 20 environmental lighting & atmosphere presets
└── src/
    ├── main.ts                         # Lightweight application bootstrap (<20 lines)
    ├── core/
    │   ├── Game.ts                     # Game loop coordinator & 60Hz physics accumulator
    │   ├── Renderer.ts                 # Three.js scene, lighting, ACES tonemapping & fog
    │   ├── PhysicsEngine.ts            # Rapier3D WASM initialization & step driver
    │   ├── InputController.ts          # Unified keyboard & gamepad polling
    │   └── Telemetry.ts                # Dev performance metrics, cold-start marks & frame pacer
    ├── player/
    │   ├── SkierController.ts          # Kinematic/dynamic actor
    │   └── character/
    │       ├── SkierPalette.ts         # Outfit color palettes (coral, ochre, glacier, pine)
    │       ├── SkierGeometry.ts        # Procedural lofted jacket, collar, skis & boots
    │       ├── SkierRig.ts             # Hierarchical bone rig assembly & joint anchoring
    │       └── SkierAnimator.ts        # Procedural IK, poling gait, carving lean & ragdoll blend
    ├── mechanics/                      # Pure GMA Physics & Kinematics Subsystem
    │   ├── ControlsProcessor.ts        # Input deadzones, quadratic steering curves
    │   ├── GmaConfig.ts                # Physics constants, thresholds & enums
    │   ├── GmaPlayerPhysics.ts         # 333Hz carving, fall-line gravity & momentum
    │   ├── PiecewiseCurve.ts           # Spline evaluations for speed-dependent turns
    │   ├── TrickScoring.ts             # Aerial scoring, combos & landing evaluator
    │   └── VerletRagdoll.ts            # 50Hz particle crash & recovery solver
    ├── camera/
    │   ├── CameraDirector.ts           # Dynamic chase cam & GMA isometric tilt-shift
    │   ├── CameraTunerOverlay.ts       # Runtime interactive parameter tuning GUI
    │   └── CameraConfig.ts             # Camera offsets, FOV widening & smoothing
    ├── world/                          # Alpine Massif & Environmental Systems
    │   ├── AlpineMassif.ts             # 6x6 chunked mesh generator & Rapier colliders
    │   ├── alpineHeightfield.ts        # 5-layer procedural slope math
    │   ├── shaders/
    │   │   ├── SnowMaterial.ts         # Micro-sparkle PBR snow terrain shader
    │   │   ├── SnowTrailMaterial.ts    # Normal-perturbed carved rut shader
    │   │   └── DetailTexture.ts        # Procedural snow normal and roughness maps
    │   ├── trails/
    │   │   └── CarvedSnowTrail.ts      # Dynamic ribbon mesh painter for carved tracks
    │   ├── environment/
    │   │   ├── SkyDome.ts              # Atmospheric gradient sky dome
    │   │   ├── DayNightCycle.ts        # Diurnal solar pathing & color grading
    │   │   └── AirborneSparkles.ts     # Ambient glistening sun crystal particles
    │   └── math/
    │       └── prng.ts                 # Deterministic cyrb128 hash + mulberry32 PRNG
    ├── audio/
    │   └── SnowAudio.ts                # Procedural Web Audio wind, carve & thump synth
    ├── ui/
    │   ├── HudOverlay.ts               # Speedometer, altitude, carve charge & trick HUD
    │   └── LightingControls.ts         # Day / Golden Hour / Night mode toggle widget
    └── network/
        ├── NetworkManager.ts           # WebSocket connection, 20Hz binary serialization
        └── RemoteSkier.ts              # Remote skier interpolation, rig, animator, tracks
```

---

## 4. Subsystem Breakdown & Architecture

### 4.1 Alvdalen Alpine Massif (`src/world/alpineHeightfield.ts` & `AlpineMassif.ts`)

The mountain is modeled as a 2.4 km × 2.4 km single inclined massif ($x \in [-1200, 1200]$, $z \in [-1200, 1200]$) constructed via 5 mathematical procedural layers:

1. **Layer 1: The Tilted Wedge (Macro Slope):**
   $$t = \text{clamp}\left(\frac{850 - z}{2050}, 0, 1\right)$$
   $$h_{\text{wedge}} = 520 \cdot t^{1.45}$$
   * Creates a steep summit backwall at $z = -1200$ (520m elevation) easing continuously into a flat frozen lake shoreline at $z = 850$.
   * Drops into a lake bed at $-8\text{m}$ for $z > 850$, with island crests rising above $y = 0$.
2. **Layer 2: The Central Dividing Gorge:**
   * Centerline: $x_{\text{center}} = \sin(z \cdot 0.0025) \cdot 90.0$.
   * Inverted Gaussian trench flaring from 180m wide at summit to 280m at river basin, carving 45% of $h_{\text{wedge}}$ down to a skiable canyon floor that separates the West Flank from the East Bowl.
3. **Layer 3: Alpine Relief & Concave Powder Bowls:**
   * Multi-octave FBM harmonic relief ($\lambda \approx 400\text{m}\text{–}600\text{m}$, 75m amplitude) creating natural concave powder bowls and convex spur ridges with natural downhill flow ($18^\circ\text{–}28^\circ$).
4. **Layer 4: Smooth Ski Chutes & Wind Lips:**
   * Domain-warped longitudinal drainage chutes along the fall line.
   * Gentle undulating snow hummocks and wind lips ($\pm 2\text{m}\text{–}4\text{m}$) providing natural kicker jumps without sharp creases.
5. **Layer 5: Surface Biomes & Readability Masking:**
   * **Snow (85%+ Dominance):** Crisp white snow (`#eef3f8`) covering all slopes up to $38^\circ$.
   * **Exposed Alpine Rock:** Rugged granite rock (`#443a34`) blended smoothly on steep cliffs $> 38^\circ$.
   * **Groomed Piste Network:** Central, West Flank, and East Bowl groomed white tracks (`#ffffff`).
   * **Frozen River Ice:** Blue-grey ice (`#729ab8`) for $y \le 0.5\text{m}$ with dedicated ice plane mesh at $y = 0$.
   * **Vegetation:** Instanced evergreen pine trees distributed via deterministic golden-angle copse clustering.

### 4.2 GMA Ski Physics & Kinematics (`src/player/SkierController.ts` & `src/mechanics/`)

Replicates the physics implementation of *Grand Mountain Adventure*:
* **Fall-Line Gravity:** Projected downhill acceleration $\vec{g}_\parallel = \vec{g} - (\vec{g} \cdot \vec{n})\vec{n}$ accelerates skiers down the slope.
* **Sidecut Carving & Edge Grip:**
  * Turning radius governed by edge tilt: $R = \frac{R_{sc}}{\sin(\theta_{edge}) + 0.08}$.
  * Standard Turn ($30^\circ$ cap, $98\%$ edge bite grip).
  * Slide Turn ($30^\circ$ cap, $85\%$ grip, $+2.0\text{ m/s}$ burst at 0.5s milestone).
  * Sharp Turn ($50^\circ$ cap, high rotational speed).
  * Overturn ($60^\circ$ cap, $10\times$ friction drag penalty).
* **Flat Ground Pole Staking:**
  * Auto pole-plant skate wiggling on flat terrain ($|x| > 0.08$ alternation).
  * Pole down duration: $0.5\text{s}$; standstill impulse: $+20.0\text{ m/s}^2$; maximum skate velocity: $10.5\text{ m/s}$.
* **Snowplow Wedge Braking:**
  * Active $2.5\times$ deceleration bringing skis to a halt within 1–2 seconds.
* **50 Hz Verlet Ragdoll Crash Solver:**
  * 7-node articulated ragdoll skeleton running 5 relaxation iterations per step during high-impact wipeouts ($> 26\text{ m/s}$ ground impact or sideways touchdown $> 45^\circ$).

### 4.3 Procedural Skier Character & Animator (`src/player/character/SkierRig.ts` & `SkierAnimator.ts`)

* **Procedural Low-Poly Mesh:** Fully procedural geometries (lofted jacket rings, flared collar, beanie with pom-pom, tinted goggles, alpine skis with curved tips, ski boots, poles).
* **Color Palettes:** Coral, Ochre, Glacier, and Pine outerwear presets.
* **Procedural Animator:** Real-time kinematic blend trees for gliding, carving lean, poling arm/leg strides, aerodynamic tucks, aerial spins, flips, and ragdoll recovery.

### 4.4 Camera Director & Presentation (`src/camera/CameraDirector.ts` & `src/camera/CameraTunerOverlay.ts`)

* **Dynamic Chase Camera:** Third-person trailing follow with velocity lookahead, asymmetric elastic lag, dynamic slope pitch alignment, and high-velocity FOV expansion.
* **GMA Isometric Tilt-Shift Mode:** Top-down orthographic/isometric perspective replicating classic mountain views.
* **Camera Tuner Overlay:** In-game visual editor (`[O]` key) with live slider controls for follow distance, height, pitch, lag, and FOV.
* **Fly-Cam Mode:** 6DOF free-flight camera (`[C]` key) with WASD strafe, Space/Shift vertical motion, mouse look, and drop-rider spawn feature.

---

## 5. Controls & Keybindings Reference

| Action | Keyboard | Gamepad |
| :--- | :--- | :--- |
| **Carve Left / Right** | `A` / `D` or `←` / `→` | Left Stick (X-Axis) |
| **Slide Turn (Drift)** | `Shift` + `A` / `D` | `B` Button + Left Stick |
| **Sharp Carve** | `Ctrl` + `A` / `D` | `Right Trigger` + Left Stick |
| **Snowplow Brake** | Hold `S` or `A` + `D` | Left Trigger |
| **Jump Pop** | `Space` (Tap) | `A` Button |
| **Glide Fall** | `Space` (Hold in air) | `A` Button (Hold) |
| **Airborne Spins** | `A` / `D` (in air) | Right Stick (X-Axis) |
| **Airborne Flips** | `W` / `S` (in air) | Right Stick (Y-Axis) |
| **Toggle Sport (Ski/Board)** | `T` | `Y` Button |
| **Toggle Twintip Skis** | `Y` | Right Stick Click |
| **Switch Riding Invert** | `R` | Left Stick Click |
| **Toggle Camera Mode** | `V` | Back / Select |
| **Camera Tuner GUI** | `O` | — |
| **Fly-Cam Mode** | `C` | — |
| **Toggle Day/Night/Golden**| `L` or `N` | — |
| **Pause Day/Night Cycle** | `P` | — |
| **Toggle HUD** | `H` | — |
| **Respawn at Peak** | `Backspace` or `Enter` | `Start` Button |
| **Peak Teleports (1–6)** | `1`: Summit (Glacier Chute)<br>`2`: West Peak (Powder Highway)<br>`3`: East Park Ridge (Slopestyle)<br>`4`: Central Canyon Rim<br>`5`: Mid-Mountain Hub<br>`6`: Halfpipe Gully | D-Pad Hotkeys |

---

## 6. Development & Verification Workflow

```bash
# 1. Start Vite development server (localhost:5173)
npm run dev

# 2. Typecheck and compile production bundle into dist/
npm run build

# 3. Preview local production bundle (localhost:4173)
npm run preview

# 4. Start production HTTP asset server (localhost:3001)
npm start

# 5. Execute automated Playwright visual regression capture
npm run vision:capture
```

---

## 7. Architectural Invariants & Rules

1. **Heightfield Indexing Invariant:** Rapier3D heightfield row/col indexing is strictly $r \times V + c$ (where $r$ is along X and $c$ is along Z). Never transpose to $c \times V + r$.
2. **Continuous Alpine Flow Invariant:** Never apply 1D global contour quantizers or $C^0$ absolute-value crease cuts to mountain relief. Slopes must remain $C^1/C^2$ smooth and differentiable so skiers maintain continuous downhill momentum.
3. **Snow Readability Dominance:** Ski resort visual readability requires 80%–90% snow coverage. Rock slope transition thresholds must remain at $\ge 38^\circ\text{–}42^\circ$ so skiable surfaces stay white.
4. **Zero-Allocation Particle & Trail Geometry:** Carved snow trail ribbons and instanced pine meshes must reuse persistent pre-allocated `Float32Array` buffers to prevent garbage collection pauses during high-speed runs.
