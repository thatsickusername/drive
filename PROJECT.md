# Project Architecture & Handoff Guide

## 1. Project Overview & Scope
This project is a 3D web-based vehicle simulation built with **TypeScript**, **Three.js** (WebGL rendering), and **Rapier 3D** (WebAssembly physics). 

The physics engine is transitioning from an arcade sliding model to an **off-road survival trial simulator** featuring a custom 4-wheel raycast suspension model, decoupled tire dynamics, transfer case gears, and an obstacle testing ground.

---

## 2. Technical Stack & Dependencies
* **Language & Runtime:** TypeScript (strict mode enabled in `tsconfig.json`).
* **Bundler / Dev Server:** Vite 5 (`vite`, `vite-plugin-wasm`, `vite-plugin-top-level-await`).
* **Graphics:** `three` (^0.170.0) with standard shadow mapping.
* **Physics:** `@dimforge/rapier3d` (^0.14.0) running WASM multithreaded/SIMD with fixed timestep accumulation.

---

## 3. Directory & File Structure
```
drive/
├── .gitignore               # Tracks sources, ignores node_modules/ and dist/
├── AGENTS.md                # Operating context guardrails & command safety rules
├── PROJECT.md               # This project architecture & handoff specification
├── index.html               # Main HTML entry point containing #game-canvas
├── package.json             # NPM dependencies & build scripts
├── tsconfig.json            # TypeScript compiler configuration
├── vite.config.ts           # Vite bundler plugins (WASM + Top-Level Await support)
└── src/
    ├── main.ts              # Game bootstrap, event listeners, main loop & telemetry HUD
    ├── physics.ts           # Rapier 3D world initialization & fixed timestep accumulator
    ├── renderer.ts          # Three.js scene, lighting, shadow maps & window resize handlers
    ├── car.ts               # Vehicle physics, raycast suspension, wheels & drivetrain
    └── map.ts               # Flat testing ground, obstacles (speed bumps, ramps, mounds)
```

---

## 4. File-by-File Breakdown & Implementation Details

### `src/physics.ts`
* **Purpose:** Wraps `@dimforge/rapier3d` World and manages deterministic fixed stepping.
* **Key Members:**
  * `world: RAPIER.World`: Rapier physics world with downward gravity `(0, -15.81, 0)`.
  * `fixedTimeStep: number = 1 / 60`: 60Hz physics clock.
  * `step(deltaSeconds, onFixedStep)`: Clamps delta time to prevent spiral of death (`Math.min(delta, 0.1)`) and runs a fixed accumulator loop calling `onFixedStep(dt)` before stepping `world.step()`.

### `src/renderer.ts`
* **Purpose:** Encapsulates Three.js rendering infrastructure.
* **Key Members:**
  * `scene: THREE.Scene`: Scene graph with subtle fog.
  * `camera: THREE.PerspectiveCamera`: 60-degree FOV camera.
  * `renderer: THREE.WebGLRenderer`: WebGL renderer with PCFSoftShadowMap enabled.
  * Directional and hemispheric ambient lights tuned for vehicle shadows.

### `src/car.ts`
* **Purpose:** Core vehicle controller containing physics body setup, raycast suspension, drivetrain, and visual synchronization.
* **Chassis Physics:**
  * Dynamic Rapier `RigidBody` (`linearDamping = 0.2`, `angularDamping = 2.8`).
  * Cuboid collider (`0.9 x 0.35 x 1.95`) representing undercarriage clearance.
  * Additional mass: `350kg` with center of mass shifted downwards to `(0, -0.35, 0)` via `setAdditionalMassProperties()` to prevent rollover on hard corners.
* **Raycast Suspension (`updateFixed`):**
  * 4 wheels defined by `WheelConfig` (`mountPoint`, `radius: 0.48`, `restLength: 0.55`, `springStiffness: 32000`, `dampingRate: 3800`).
  * In every physics tick, downward rays are cast via `world.castRayAndGetNormal()`.
  * Ground contact computes compression distance ($x$) and relative suspension velocity ($v_s$).
  * Hooke's Law + viscous damping ($F = k \cdot x + c \cdot v_s$) applies upward impulse to the chassis mount.
  * Anti-roll sway bars connect left and right wheel pairs to balance compression delta.
* **Drivetrain & Friction:**
  * Dual-range transfer case: **4H** (`highDriveTorque = 4200`) and **4L Crawl** (`lowDriveTorque = 9000`).
  * Normal force is derived per wheel from spring compression. If a wheel is airborne, traction force is zero.
  * Lateral friction is applied at the axle mount height rather than ground contact to prevent artificial rollover torque moments.
* **Mid-Air Handling Guardrail:**
  * When `wheelsGroundedCount === 0`, steering torque and drive forces are disabled to prevent the car from rolling or floating in mid-air off jump ramps. Level flight stabilization and downward gravity assistance are applied instead.
* **Visual Sync (`syncRender`):**
  * Decouples the 4 visual wheel meshes from the chassis: positions reflect suspension compression travel, Y-rotation reflects steering angle, and X-rotation reflects rolling axle spin.

### `src/map.ts`
* **Purpose:** Constructs static trimesh physics colliders and visual obstacles for testing vehicle articulation.
* **Obstacles Included:**
  * **Speed Breakers (Z: 15–55):** Half-cylinder speed bumps with incremental heights (0.22m to 0.38m).
  * **Staggered Articulation Mounds (Z: 80–125):** Alternating left/right raised domes for testing independent wheel travel.
  * **Wedge Jumps & Ramps:** Launch ramp ($Z=140$), high-speed launch ramp (West lane), side-bank wedge (East lane), and stepped curbs (South lane).
  * **Perimeter Walls:** Enclosing boundaries at $\pm 150\text{m}$.

### `src/main.ts`
* **Purpose:** Wires inputs, orchestrates loop updates, follows camera, and displays real-time telemetry HUD.
* **Controls:**
  * `[W] / [ArrowUp]`: Forward drive.
  * `[S] / [ArrowDown]`: Reverse drive.
  * `[A] / [ArrowLeft]`: Steer Left.
  * `[D] / [ArrowRight]`: Steer Right.
  * `[Space]`: Service brake / handbrake.
  * `[L]`: Toggle 4H (High) / 4L (Low Crawl) transfer case gear.
  * `[R]`: Reset car position to origin.
* **HUD Telemetry:**
  * Transfer case mode indicator.
  * Vehicle speed (km/h).
  * Real-time pitch and roll inclinometer (degrees).
  * Individual per-wheel suspension compression percentages (`FL`, `FR`, `RL`, `RR`).

---

## 5. Development & Build Workflow
* **Start Dev Server:** `npm run dev`
* **Typecheck & Production Build:** `npm run build`
* **Preview Production Build:** `npm run preview`

---

## 6. Rules for Incoming Agents
1. **Scope Boundary:** Work exclusively in `src/car.ts`, `src/map.ts`, `src/physics.ts`, or `src/main.ts` according to the requested feature. Do **not** modify configuration or build files (`vite.config.ts`, `tsconfig.json`, `package.json`) unless adding a vetted dependency.
2. **Never Edit Auto-Generated Folders:** Strict zero-read/write rule on `node_modules/` and `dist/`.
3. **Execution Safety:** When running terminal commands, always follow the output filtering rules in `AGENTS.md` (e.g. pipe through `Select-Object -First 25`).
4. **Preserve Decoupled Suspension:** Never bind visual wheels directly into the chassis physics collider. Maintain the raycast-to-mesh transform decoupling in `Car.syncRender()`.
