# Alpine Freeride — Architectural Deepening Plan

> **Purpose:** Execute 5 targeted architectural deepenings derived from the codebase review.  
> **Execution Model:** This file is written so **5 fresh agents** can each pick up **exactly one item** (`Item 1`–`Item 5`) with optimal context usage and zero wasted exploration.

---

## 0. Global Rules & Shared Contracts (All 5 Agents Must Read)

### Operating Guardrails (`AGENTS.md`)
- Never inspect `node_modules/`, `dist/`, `build/`, `.git/`, `.cache/`, logs, or binary assets.
- Never read a file `> 100` lines in full; read targeted `<= 100`-line ranges.
- Max 2 shell commands per interaction loop; pipe verbose output (`| Select-Object -First 25`).
- Do **not** run full slow suites unconditionally; verify TypeScript (`npx tsc --noEmit`), build (`npm run build`), and targeted checks after your final edit.
- Preserve **zero per-frame heap allocations** in hot loops (`Game.loop`, `fixedUpdate`, `renderUpdate`, `RemoteSkier.update`, `CarvedSnowTrail.update`, `SnowSpraySystem.update`, `VerletRagdoll.stepSimulation`).
- Preserve all invariants in `PROJECT.md` §7 (Heightfield `r * V + c` indexing, C1/C2 terrain continuity, snow coverage, pre-allocated `Float32Array` buffers).
- Preserve all runtime assertions in `tests/regression.mjs` unless explicitly noted in your item's section (notably DOM IDs `#hud`, `#lighting-toggle-container`, `#camera-tuner-toggle-btn`, `#camera-tuner-panel`, `#boot-overlay`, `#webgl-context-lost-banner`, `window.game`, `window.getPerfReport()`, `massifBuildMs < 100`, `WEBGL_lose_context` recovery, and `Game.dispose()` teardown).

### Design Vocabulary (`codebase-design` / `improve-codebase-architecture`)
Use exact terms in code comments, docstrings, and PR notes: **module**, **interface**, **implementation**, **depth**, **deep**, **shallow**, **seam**, **adapter**, **leverage**, **locality**.

### Cross-Agent Ownership & Integration Matrix

| Item | Primary Deepened Module | Files Owned / Deleted | Shared Files Touched (Respect Exact Seam!) |
| :--- | :--- | :--- | :--- |
| **Item 1** | `src/player/SkierPresentation.ts` | **Delete:** `src/player/SkierEffects.ts`, `src/player/SkierVisualHelpers.ts` | `src/player/SkierController.ts` (visual/effects sections), `src/network/RemoteSkier.ts` (rig/trail/spray/ragdoll-pose sections) |
| **Item 2** | `src/network/MultiplayerProtocol.ts`, `src/network/SnapshotInterpolator.ts`, `src/network/Transport.ts` | **Edit:** `src/network/NetworkManager.ts`, `server/index.js` | `src/network/RemoteSkier.ts` (packet decode + ring buffer interpolation), `src/core/Game.ts` (trick/respawn event hookup) |
| **Item 3** | `src/mechanics/SkierSimulation.ts` (or deepened `GmaPlayerPhysics`) | **Delete/Absorb:** `src/mechanics/ControlsProcessor.ts` into `SkierSimulation` | `src/core/InputController.ts`, `src/player/SkierController.ts` (input mapping & physics state fields), `tests/regression.mjs` (blur check if surface changes) |
| **Item 4** | `src/mechanics/TrickScoring.ts`, `src/world/MountainZones.ts`, `src/ui/ContextLostBanner.ts` | **Edit:** `src/ui/HudOverlay.ts`, `src/camera/CameraDirector.ts` | `src/player/SkierController.ts` (`trickEngine` removal, snapshot getters), `src/core/Game.ts` (camera call, HUD/banner lifecycle) |
| **Item 5** | `src/world/shaders/WorldLighting.ts` (or `Renderer`-owned uniform/texture controller) | **Edit:** `src/world/shaders/DetailTexture.ts`, `SnowTrailMaterial.ts`, `SnowMaterial.ts`, `src/world/AlpineMassif.ts`, `src/core/Renderer.ts` | `src/core/Game.ts` (remove global texture/trail calls & `_networkLightingParams`), `src/player/SkierController.ts` (`updateTrailLighting`), `src/network/NetworkManager.ts` (unused param) |

> **Parallelism Note:** If running sequentially, merge in order **Item 1 → Item 3 → Item 4 → Item 2 → Item 5**. If running in parallel branches, follow the exact seam interfaces specified inside each Item below so merges only touch non-overlapping sections of `SkierController.ts`, `RemoteSkier.ts`, and `Game.ts`.

---

## Item 1: Collapse Skier Presentation into One Deep Module

- **Target Depth:** Turn duplicated local/remote visual wiring plus two shallow helpers (`SkierEffects`, `SkierVisualHelpers`) into one deep **`SkierPresentation`** module.
- **Dependency Category:** `in-process` (Three.js scene graph + terrain sampler callback) with optional `SnowAudio` adapter for the local player only.
- **Files to Read (Targeted Ranges Only):**
  - `src/player/SkierEffects.ts` (lines 1–167)
  - `src/player/SkierVisualHelpers.ts` (lines 1–116)
  - `src/player/SkierController.ts` (lines 143–171, 231–316, 480–499, 580–789)
  - `src/network/RemoteSkier.ts` (lines 62–198, 391–534, 619–662)

### Problem
`SkierController` and `RemoteSkier` duplicate the entire visual presentation stack (`buildSkierCharacter`, `SkierAnimator`, `CarvedSnowTrail`, `SnowSpraySystem`, `updateSkierFootGrounding`, `applyRagdollPose`, crash/jump/respawn trail gaps, and LOD shadow toggling). Meanwhile, `SkierEffects` (167 lines, 19-field `SkierEffectsFrameInput`) and `SkierVisualHelpers` (`updateSkierFootGrounding` with 10 positional args, `emitSkierSnowSpray` with 15 positional args) are shallow pass-through modules used inconsistently (`SkierController.ts:312` sets rig Y to `-sphereRadius + 0.02` vs `RemoteSkier.ts:172` `-0.45 + 0.016`; `RemoteSkier.ts:639` hardcodes `34.0` slip angle).

### Required Changes
1. **Create `src/player/SkierPresentation.ts`:**
   - Define `SkierPresentationOptions`:
     ```ts
     export interface SkierPresentationOptions {
       scene: THREE.Scene;
       paletteKey: string;
       sphereRadius: number;
       sprayParticleCount: number; // 900 local, 140 remote
       enableAudio?: boolean;      // true for local player, false for remote
       castShadow?: boolean;
       terrainSampler?: ((x: number, z: number) => number) | null;
     }
     ```
   - Define a single reusable, zero-allocation `SkierPresentationFrame` input object populated by callers (`dt`, `position`, `visualQuaternion` or `yaw`+`normal`+`airPitch`+`airRoll`, `speed`, `vLateral`, `leanAngle`, `steerX`, `slipAngleDeg`, `gripUtilization`, `isGrounded`, `isCrashing`, `isDrifting`, `isSlashing`, `isSlideTurn`, `isSharpTurn`, `isStaking`, `isTucking`, `isGliding`, `airTime`, `inputLeft`, `inputRight`, `jumpPressed`, `grabPressed`, `jumpVariation`, `isSpinning`, `spinProgress`, `spinDirection`, `spinRate`, `isFrontFlipping`, `isBackFlipping`, `flipProgress`, `flipRate`, `ragdollPoints`, `snowDepthPos`).
   - Move **inside** `SkierPresentation` (private implementation details, never exposed):
     - `rig: SkierCharacter` (`buildSkierCharacter`, normalized vertical offset `-sphereRadius + 0.016`, `setPalette`, `setSportVisuals`, `resetPose`).
     - `animator: SkierAnimator` (including `pickRandomJumpVariation`, `setJumpVariation`, `activeJumpVariation`, `isFrontFlippingActive`, `isBackFlippingActive`, and wiring `animator.onPolePlantAudio` directly to `SnowAudio` when `enableAudio` is true).
     - `trail: CarvedSnowTrail` and `snowSpray: SnowSpraySystem` (including `emitCrashBurst`, `setVisible` / `wasTrailCulled` LOD handling, and unified `sprayLean` math currently in `SkierEffects.ts:107-113`).
     - `SnowAudio` (instantiated and listener-bound only when `enableAudio === true`; never created for remote peers).
     - Internal helper functions absorbed from `SkierVisualHelpers.ts` (`syncLocalMatrixWorld`, foot grounding clearance damping, and populating internal `_sprayParams` directly without 15-arg forwarding).
     - Internal state-edge handling for `isCrashing` (`onCrash` / `onRespawn` / `resetPose` / `applyRagdollPose`), `jumpTriggered` (`onJumpStart`), and `setShadowsEnabled(enabled: boolean)` (replacing `RemoteSkier.ts:428-436` traversal).
   - Expose a small public interface on `SkierPresentation`:
     - `readonly root: THREE.Group` (actor root in scene, or attached under `SkierController.root` / `RemoteSkier.root`)
     - `readonly visualRoot: THREE.Group` (for `SkierController.visualQuaternion` / `visualMesh`)
     - `setPalette(key: string)`, `setSportVisuals(isSnowboard: boolean, hasTwintips: boolean)`
     - `setTerrainSampler(sampler)`, `setVisible(visible: boolean)`, `setShadowsEnabled(enabled: boolean)`
     - `triggerJump(grabHeld: boolean)` / `triggerCrash()` / `triggerRespawn()` / `playLandThump(clean: boolean)` / `updateLighting(sunColor?: THREE.Color)`
     - `update(frame: SkierPresentationFrame, renderAnim?: boolean)` — updates orientation/ragdoll pose, animator, foot grounding, snow spray, trail ribbon, and audio.
     - `reset(position: THREE.Vector3, yaw: number)` and `dispose()`.
2. **Refactor `src/player/SkierController.ts`:**
   - Replace `skierCharacter`, `animator`, `effects`, `groundClearanceOffset`, `wasCrashing`, `wasCrashingPhysics`, and lines `580-725` + `769-778` with a single `private readonly presentation: SkierPresentation` (or `public readonly presentation`).
   - Preserve `SkierController` public getters needed by other modules (`mesh`, `visualMesh`, `visualQuaternion`, `skierCharacter` / `animator` delegates only if needed until Item 4 lands, `setTerrainSampler`, `updateSportVisuals`, `updateTrailLighting`, `dispose`).
3. **Refactor `src/network/RemoteSkier.ts`:**
   - Replace `skierRig`, `animator`, `trail`, `snowSpray`, `_sprayParams`, `_animParams`, `groundClearanceOffset`, `wasCrashing`, `shadowsEnabled`, and lines `396-533` + `619-646` with `private readonly presentation: SkierPresentation` (`sprayParticleCount: 140`, `enableAudio: false`).
   - Keep snapshot interpolation, LOD distance checks (`600m` / `280m` / `60m`), and name/trick DOM tag projection inside `RemoteSkier` (note: Item 2 will extract snapshot interpolation separately).
4. **Delete Shallow Modules:**
   - Delete `src/player/SkierEffects.ts` and `src/player/SkierVisualHelpers.ts` (verify zero remaining imports across `src/`).

### Verification
- Run `npx tsc --noEmit && npm run build` (must pass with 0 errors).
- Run `node tests/regression.mjs` (or verify startup + teardown with 0 page errors).
- Add a focused Node test (`tests/presentation.test.mjs` using `node:test`) verifying `SkierPresentation` with a mock/headless `THREE.Scene` handles `triggerCrash` -> `reset` -> `triggerJump` -> `dispose` without throwing or leaving trail/mesh orphans.

---

## Item 2: Unify Binary Protocol and Snapshot Sync Behind a Transport Seam

- **Target Depth:** Consolidate the 28-byte binary protocol, enum tables, and 30-slot snapshot interpolation into deep **in-process** modules, and isolate WebSocket transport behind a two-adapter seam (`WebSocketTransport` in prod, `InMemoryTransport` in tests).
- **Dependency Category:** `ports & adapters` (transport) + `in-process` (binary codec & snapshot ring buffer).
- **Files to Read (Targeted Ranges Only):**
  - `src/network/NetworkManager.ts` (lines 1–314, in <=100-line chunks)
  - `src/network/RemoteSkier.ts` (lines 10–95, 228–390, 564–617)
  - `server/index.js` (lines 14–16, 151–327)

### Problem
The 28-byte packet layout and bitpacking leak across three files (`NetworkManager.ts`, `RemoteSkier.ts`, `server/index.js`), already exhibiting bitmask drift (`NetworkManager.ts:265` writes `paletteId & 0x03`, `NetworkManager.ts:172` reads `view.getUint8(26) & 0x0f`, `RemoteSkier.ts:255` reads `stylePacked & 0x03`). `PALETTE_KEYS`/`PALETTE_NAMES` and `JUMP_VARIATIONS`/`JUMP_VARIATION_MAP` are duplicated 3×. `NetworkManager.update()` (`lines 208-220`) polls `scoring.displayTimer > 2.0` to infer trick landings, and `server/index.js:288-299` relays `'respawn'` messages that the client ignores. Direct `new WebSocket(...)` usage makes multiplayer untestable without a live server and browser.

### Required Changes
1. **Create `src/network/MultiplayerProtocol.ts` (shared pure codec + message schema):**
   - Canonical constants: `PACKET_BYTE_LENGTH = 28`, `PALETTE_KEYS = ['coral', 'ochre', 'glacier', 'pine'] as const`, `JUMP_VARIATIONS = ['jump', 'grab', 'shifty', 'daffy', 'mutegrab', 'ironcross', 'nordic'] as const`, and `NET_MOVEMENT_STATE` / `NET_TURN_TYPE` mappings.
   - Define `LocalPlayerPacketInput` (flat primitive/vector snapshot—no `SkierController` or `GmaPlayerPhysics` dependency) and `DecodedPlayerPacket`.
   - Implement `encodePlayerPacket(input: LocalPlayerPacketInput, outView: DataView): void` and `decodePlayerPacket(view: DataView, out: DecodedPlayerPacket): boolean` (zero heap allocation; consistently mask `paletteId` with `0x03` everywhere, validate `byteLength >= 28` and finite numbers).
   - Define typed discriminated union `ServerControlMessage` / `ClientControlMessage` (`init`, `peer_joined`, `peer_left`, `trick` / `peer_trick`, `respawn` / `peer_respawn`, `room_full`) and `parseControlMessage(raw: string): ServerControlMessage | null`.
2. **Create `src/network/SnapshotInterpolator.ts` (pure in-process ring buffer):**
   - Move the 30-slot `snapshotPool`, `pushSnapshot`, adaptive clock resync, teleport threshold (`> 225` m²), lerp/slerp interpolation, and `processSnapshotTransitions` (crash / jump / teleport edge events) out of `RemoteSkier.ts` into `SnapshotInterpolator`.
   - Zero heap allocations on `push()` and `sample(dt)` (writes into caller-owned/internal reusable `InterpolatedState` + transition flags `{ teleported, crashed, jumped }`).
   - Completely independent of Three.js DOM/Scene/WebGL (can import `THREE.Vector3` / `THREE.Quaternion` math or pure math structs so it runs directly in Node tests!).
3. **Create `src/network/Transport.ts` (Ports & Adapters seam):**
   - Define `MultiplayerTransport` interface:
     - `connect(url: string): void`, `disconnect(): void`, `sendBinary(buf: ArrayBuffer): void`, `sendText(text: string): void`, `isOpen(): boolean`
     - Callbacks: `onOpen`, `onClose`, `onBinary(data: ArrayBuffer)`, `onText(data: string)`.
   - Implement `WebSocketTransport` (wraps browser `WebSocket`, `binaryType = 'arraybuffer'`).
   - Implement `InMemoryTransport` (connects two or more peers or a test relay in-process for deterministic multi-peer testing).
4. **Refactor `src/network/NetworkManager.ts` & `src/network/RemoteSkier.ts`:**
   - `NetworkManager` accepts an optional `MultiplayerTransport` (defaulting to `new WebSocketTransport()`) and a narrow `LocalSkierNetSource` interface (providing position, visual quaternion, speed, leanAngle, turnType, movementState, jumpVariation, sport, hasTwintips, action flags, `setPalette`, plus a discrete trick-landed / respawn signal—**stop polling `displayTimer`**!).
   - Wire `peer_respawn` handling (`NetworkManager` sends `'respawn'` on `player` respawn if desired and snaps remote peer on `peer_respawn`).
   - `RemoteSkier` delegates binary decoding to `decodePlayerPacket` and ring-buffer math to `SnapshotInterpolator`, keeping only scene presentation + overhead nametag DOM.
5. **Sync `server/index.js`:**
   - Ensure `PALETTE_NAMES` / `MAX_SLOTS` / byte `0` client ID stamping match `MultiplayerProtocol.ts` (document shared 28B contract or import a shared JS/JSON constants module if compatible with `node server/index.js` without build step).

### Verification
- Write `tests/multiplayer.test.mjs` (`node:test`) testing:
  1. `encodePlayerPacket` <-> `decodePlayerPacket` roundtrip across all 4 palettes, 7 jump variations, snowboard toggle, and all 8 action bitflags.
  2. `SnapshotInterpolator` interpolation, teleport discontinuity (`> 15m`), and crash/jump edge detection across skipped snapshots.
  3. Two `NetworkManager` / session instances communicating over `InMemoryTransport` (join, binary broadcast, trick event, peer leave) with zero browser/WebGL dependencies.
- Run `npx tsc --noEmit && npm run build` and `node --test tests/multiplayer.test.mjs`.

---

## Item 3: Consolidate Controls, Gestures, and Physics into One Simulation Module

- **Target Depth:** Collapse the 4-stop input-to-physics pipeline (`UnifiedInputController` -> `SkierController` translation -> `ControlsProcessor` -> `GmaPlayerPhysics`) into a thin hardware `InputAdapter` + one deep **`SkierSimulation`** module.
- **Dependency Category:** `in-process` (pure simulation math & state machine).
- **Files to Read (Targeted Ranges Only):**
  - `src/core/InputController.ts` (lines 1–384, in <=100-line chunks)
  - `src/mechanics/ControlsProcessor.ts` (lines 1–129)
  - `src/mechanics/GmaPlayerPhysics.ts` (lines 17–241, 370–510, 720–934)
  - `src/player/SkierController.ts` (lines 11–75, 108–194, 448–565, 645–699)
  - `tests/regression.mjs` (lines 89–117)

### Problem
Understanding a single steering or jump input requires bouncing across 4 modules with 3 competing edge trackers (`prevStakeKey`/`prevLeftKey`/`prevRightKey` in `InputController.ts`, `wasLeftPressed`/`wasRightPressed`/`wasStakePressed` in `ControlsProcessor.ts`, `prevJumpPressed`/`prevStakePressed` in `GmaPlayerPhysics.ts`, plus `prevJumpInput` in `SkierController.ts`). `InputController.getBoarderInputs()` uses an independent `performance.now()` clock (`lines 185-187`) and pre-converts `A+D` into `brake`, silently defeating `ControlsProcessor`'s simultaneous `A+D` emergent jump (`lines 89-92`). `SkierController` translates `BoarderInput` into a second 13-field `InputState`, carries **19 dead fields** in `BoarderConfig`/`DEFAULT_CONFIG` (`lines 28-74`, only `mass` and `sphereRadius` are used) and 5 dead fields (`stumbleTimer`, `preWindCoil`, `prevSlopeGrade`, `wiggleTimer`, `lastWiggleSign`), and `renderUpdate()` re-interprets raw input flags for spin/flip/tuck (`lines 646-673`).

### Required Changes
1. **Simplify `src/core/InputController.ts` into a pure hardware adapter:**
   - Replace `getBoarderInputs()`'s gesture synthesis and `performance.now()` steering ramp with `getRawControls(): RawControlInput` returning pure device intent:
     - `rawLeft: boolean`, `rawRight: boolean`, `rawForward: boolean`, `rawBrake: boolean`
     - `jump: boolean`, `grab: boolean`, `sharpTurn: boolean`, `slideTurn: boolean`, `tackle: boolean`
     - `analogSteerX?: number`, `analogSpinX?: number`, `analogFlipY?: number`, `analogRoll?: number`
     - Keep `getCameraLookInputs(dt)` and `getFlyCamInputs()`.
   - **Regression Note:** `tests/regression.mjs:93-116` checks `window.game.inputController` after `KeyA`+`KeyW` and after `window.blur` (`keyState` cleared and steering reset). Either keep a lightweight `keyboardSteer` mirror / `getBoarderInputs()` alias or update `tests/regression.mjs:93-116` cleanly alongside `InputController` (prefer updating `tests/regression.mjs` if `keyboardSteer` moves into `SkierSimulation`, OR expose `player.simulation.steer` and check `ic.keyState` + `ic.getRawControls()`—be explicit and verify `node tests/regression.mjs` passes!).
2. **Create `src/mechanics/SkierSimulation.ts` (absorbing `ControlsProcessor` + `GmaPlayerPhysics` + physics-derived motion state):**
   - Move `ControlsProcessor` logic (deadzones, quadratic curve, keyboard digital-to-analog steering ramp driven by the loop's `dt` instead of `performance.now()`, single authoritative edge-detection for `A+D` brake vs emergent jump vs staking double-tap, reverse turn) directly into `SkierSimulation` (deleting `src/mechanics/ControlsProcessor.ts`).
   - Move physics-derived state computation currently in `SkierController.fixedUpdate` (`lines 490-528`) and `SkierController.renderUpdate` (`lines 646-673`)—`leanAngle`, `carveCharge`, `pumpChain`, `pumpFlow`, `pumpKick`, `isDrifting`, `isSlashing`, `vForward`, `vLateral`, `slipAngleDeg`, `gripUtilization`, `isTucking`, `isSpinning`, `spinDir`, `isFrontFlipping`, `isBackFlipping`, `isGrabActive`—into `SkierSimulation`.
   - Keep `GmaPlayerPhysics` either merged into `SkierSimulation` or kept strictly as a private internal sub-module behind `SkierSimulation`'s interface (do not expose `GmaPlayerPhysics` internals through `SkierController`).
   - Expose a clean, zero-allocation `step(dt, rawInput, groundHeight, groundNormal, surfaceType)` and `getMotionSnapshot(): Readonly<SkierMotionSnapshot>` (plus `reset`, `toggleSport`, `toggleTwintips`, `toggleReverseTurn`, `handleObstacleCollision`, `applyRocketJump`).
3. **Clean up `src/player/SkierController.ts`:**
   - Replace `BoarderConfig` / `DEFAULT_CONFIG` with `SkierColliderConfig { mass: number; sphereRadius: number }` (delete the 19 unused physics fields).
   - Delete dead fields: `stumbleTimer`, `preWindCoil`, `prevSlopeGrade`, `wiggleTimer`, `lastWiggleSign`, `prevJumpInput`, `_inputState`, and the `BoarderInput` <-> `InputState` translation block (`lines 449-466`).
   - `SkierController` owns only: Rapier kinematic body + 3-ray terrain probe -> feeds `SkierSimulation.step(...)` -> interpolates previous/current `SkierMotionSnapshot` -> drives `SkierPresentation` (or `SkierEffects`/animator until merged with Item 1).

### Verification
- Write `tests/simulation.test.mjs` (`node:test`) testing `SkierSimulation` headlessly (zero Rapier/WebGL):
  1. Digital `rawLeft` steering ramp is deterministic with fixed `dt` (no wall-clock dependency).
  2. Simultaneous `rawLeft && rawRight` behavior vs `rawBrake`.
  3. Standing -> flat-ground pole staking -> uphill damped staking -> airborne spin/flip accumulation -> clean landing vs crash state transitions.
- Run `npx tsc --noEmit && npm run build` and `node --test tests/simulation.test.mjs`.

---

## Item 4: Shrink Cross-Seam Reads Between Skier, Trick Scoring, Camera, and HUD

- **Target Depth:** Give `TrickScoringSystem` full ownership of jump-style titles and landing events, eliminate `SkierController`'s `trickEngine` compatibility proxy and 14-arg camera push, and replace deep `gmaPhysics` reads with narrow read-only snapshots.
- **Dependency Category:** `in-process` (scoring, snapshots, shared zones) + `local-substitutable` (DOM overlays).
- **Files to Read (Targeted Ranges Only):**
  - `src/mechanics/TrickScoring.ts` (lines 1–287, in <=100-line chunks)
  - `src/player/SkierController.ts` (lines 76–98, 529–561)
  - `src/ui/HudOverlay.ts` (lines 1–100, 194–391)
  - `src/camera/CameraDirector.ts` (lines 233–260)
  - `src/core/Game.ts` (lines 73–84, 262–389)

### Problem
`TrickScoringSystem` lacks jump-variation awareness, so `SkierController.fixedUpdate` (`lines 535-557`) patches `lastFinalizedTrickName`, `lastFinalizedPoints`, `totalGameScore`, and `displayTimer` from outside, with a hardcoded `+150` fallback. `SkierController` exposes a shallow 9-getter `trickEngine` proxy (`lines 81-96`) alongside `public readonly gmaPhysics`. `HudOverlay` reaches 3 modules deep (`player.gmaPhysics.*`, `player.animator.activeJumpVariation`), duplicates a partial `varMap` (`lines 363-370`, missing `ironcross`/`nordic`), and hardcodes mountain zone bounds (`lines 284-289`) disconnected from `Game.locations` (`Game.ts:74-81`). `Game.loop` calls `cameraDirector.updateSnowboard` with 14 positional arguments (`3` completely ignored in `CameraDirector.ts:240, 244, 245`) and manually mutates `this.player.pumpKick = 0` (`Game.ts:380`). `Game.ts` also builds `#webgl-context-lost-banner` inline (`lines 262-290`).

### Required Changes
1. **Deepen `src/mechanics/TrickScoring.ts`:**
   - Move active jump variation state (`'jump' | 'grab' | 'shifty' | 'daffy' | 'mutegrab' | 'ironcross' | 'nordic'`) and canonical display-name lookup (`JUMP_VARIATION_LABELS`) into `TrickScoringSystem`.
   - Move the landing fallback (`+150` air-pop score when `title` is empty after air time > `0.25s`, plus frontflip/backflip variation titles) inside `TrickScoringSystem.finalizeScore(...)` so `SkierController` never mutates `totalGameScore` or `lastFinalizedTrickName` externally.
   - Add an explicit finalized-trick event counter/monotone ID (`finalizedSeq: number`) or `consumeFinalizedTrick()` so callers (`NetworkManager` in Item 2) never infer landings from `displayTimer` heuristics.
   - Delete `SkierController.trickEngine` (`lines 81-96`) and the post-landing patch block (`lines 535-557`).
2. **Create `src/world/MountainZones.ts` (Single source of truth):**
   - Export `MOUNTAIN_LOCATIONS` (`summit`, `west`, `east`, `canyon`, `mid`, `halfpipe` from `Game.ts:74-81`) and `getMountainZoneName(x: number, y: number, z: number): string` (migrated from `HudOverlay.ts:284-289`).
   - Use it in both `Game.ts` and `HudOverlay.ts`.
3. **Define Narrow Read-Only Snapshot Interfaces (`HudSnapshot`, `CameraTarget`):**
   - Add `getHudSnapshot(out?: HudSnapshot): HudSnapshot` and `getCameraTarget(out?: CameraTarget): CameraTarget` on `SkierController` (pre-allocated zero-allocation scratch objects returned by reference or filled into `out`), **and** consume/reset `pumpKick` inside `SkierController` after `getCameraTarget()` rather than letting `Game.ts:380` write `this.player.pumpKick = 0`.
   - Refactor `DynamicCameraDirector.updateSnowboard(dt, target: CameraTarget, yawDelta, pitchDelta)` in `src/camera/CameraDirector.ts`: drop the 3 unused parameters (`_lateralSlip`, `_groundDistance`, `_pumpKick`) and accept the compact `CameraTarget` struct (`position`, `heading`, `speedKmh`, `isAirborne`, `leanAngle`, `airTime`, `slopeNormal`, `velocity`).
   - Refactor `HudOverlay` constructor and `update()` to read only `HudSnapshot` + `cameraDirector.mode` / `isFlyCam` / `camera.position`, removing all imports/access to `TurnType`, `gmaPhysics`, `animator`, and the duplicate `varMap`.
4. **Extract `src/ui/ContextLostBanner.ts` out of `Game.ts`:**
   - Move `#webgl-context-lost-banner` creation, `setVisible(visible: boolean)`, and `dispose()` out of `Game.ts:262-290, 478-481` into `ContextLostBanner` (preserving exact ID `webgl-context-lost-banner` and `display` style contract checked by `tests/regression.mjs:160-164, 187, 196`).

### Verification
- Write `tests/trickScoring.test.mjs` (`node:test`) covering jump variation titles, fallback air-pop scoring, landing quality thresholds (`Perfect`, `Good`, `Sketchy`, `Crash`), `finalizedSeq` increment on every landing, and `MountainZones` lookup.
- Run `npx tsc --noEmit && npm run build`.
- Run `node tests/regression.mjs` to confirm `#hud`, `#webgl-context-lost-banner`, and `Game.dispose()` pass with 0 page errors.

---

## Item 5: Consolidate Snow Shader Uniforms and Detail-Texture Lifecycle

- **Target Depth:** Eliminate module-level shader/texture singletons, untyped `material.userData` callbacks, and 7-argument per-frame lighting fan-out across `Game`, `AlpineMassif`, `DetailTexture`, `SnowMaterial`, `SnowTrailMaterial`, and `SkierController`.
- **Dependency Category:** `in-process` (uniform state & texture ownership; WebGL mocks or headless verification).
- **Important Seam Rule:** **Do NOT collapse** `src/world/massifBuilder.ts`, `src/world/massifWorker.ts`, or `src/world/shaders/detailTextureData.ts` — the Web Worker seam is real and preserves `massifBuildMs < 100ms`.
- **Files to Read (Targeted Ranges Only):**
  - `src/world/shaders/DetailTexture.ts` (lines 1–69)
  - `src/world/shaders/SnowTrailMaterial.ts` (lines 1–45, 285–332)
  - `src/world/shaders/SnowMaterial.ts` (lines 1–55, 295–322)
  - `src/world/AlpineMassif.ts` (lines 46–145, 420–508)
  - `src/core/Renderer.ts` (lines 18–76, 263–305)
  - `src/core/Game.ts` (lines 37–45, 247–260, 391–437)
  - `src/player/SkierController.ts` (lines 751–761)
  - `src/network/NetworkManager.ts` (lines 182–198)

### Problem
`DetailTexture.ts` and `SnowTrailMaterial.ts` store module-global singletons (`cachedSnowDetailTexture`, `_sharedSnowTrailMaterial`), forcing `Game.handleContextRestored` (`lines 249-252`) to import `getCachedSnowDetailTexture` directly. `SnowMaterial.ts` and `SnowTrailMaterial.ts` attach untyped `material.userData = { uniforms, update(...) }` closures called by `AlpineMassif` and `SnowTrailMaterial`. `Game.loop` (`lines 392-437`) fans the same 7 lighting values out across 4 separate calls, allocates `_networkLightingParams` for `NetworkManager.update` (which ignores `_lightingParams` at `line 185`), and calls `player.updateTrailLighting` with 7 parameters where 6 are ignored (`SkierController.ts:751-761`).

### Required Changes
1. **Create `src/world/shaders/WorldLighting.ts` (shared typed uniform + texture owner):**
   - Define `SnowLightingUniforms` holding the shared Three.js uniform `{ value: ... }` objects (`uTime`, `uSunDir`, `uSunColor`, `uShadowColor`, `uCameraPos`, `uPlayerPos`, `uGoldenFactor`, `uNightFactor`).
   - Implement a `WorldLightingController` class (instantiated once per `Renderer` / `Game` session—no module-level globals!) with:
     - `readonly uniforms: SnowLightingUniforms`
     - `update(time, sunDir, cameraPos, playerPos, nightFactor, sunColor, shadowColor, goldenFactor)`
     - `getOrCreateTrailMaterial(): THREE.MeshStandardMaterial` and `getOrCreateDetailTexture(dataOrSize, anisotropy)` + `onContextRestored()` (marks active `DataTexture.needsUpdate = true`) + `dispose()`.
2. **Remove untyped `userData` callbacks & module globals:**
   - Update `SnowMaterial.ts` (`createSnowMaterial`) and `SnowTrailMaterial.ts` (`createSnowTrailMaterial`) to accept `sharedUniforms?: SnowLightingUniforms` directly so `onBeforeCompile` binds to the shared uniform references cleanly—no `material.userData.update(...)` or `(material as any).customUniforms` hacks!
   - Remove `_sharedSnowTrailMaterial` and `updateSharedSnowTrailUniforms` from `SnowTrailMaterial.ts` (trail meshes receive the `WorldLightingController`-owned material or `SnowTrailMaterial` factory accepts `WorldLightingController`).
   - Remove module-level `cachedSnowDetailTexture` singleton from `DetailTexture.ts` (keep `DetailTexture.ts` as a pure stateless `THREE.DataTexture` builder/updater helper, or fold into `WorldLightingController`).
3. **Wire through `Renderer` & `AlpineMassif`:**
   - `Renderer` owns `public readonly worldLighting = new WorldLightingController()` and updates it inside `Renderer.updateLighting(...)`, plus calls `this.worldLighting.onContextRestored()` inside `boundContextRestored` (or `compileAsync`) and `this.worldLighting.dispose()` in `Renderer.dispose()`.
   - `AlpineMassif` receives `worldLighting` (or `terrainMaterial` bound to `worldLighting.uniforms`), removing `AlpineMassif.update(...)` entirely and simplifying `setDetailQuality(size, anisotropy)` to use typed `uDetailTex` uniform assignment instead of `material.userData.setDetailTexture`.
4. **Clean up `Game.ts`, `SkierController.ts`, and `NetworkManager.ts`:**
   - In `Game.ts`: delete `_networkLightingParams`, remove `getCachedSnowDetailTexture` import and lines `249-252`, remove `this.massif.update(...)` and `updateSharedSnowTrailUniforms(...)` from `Game.loop` (since `Renderer.updateLighting` updates the shared uniforms once!).
   - Simplify `SkierController.updateTrailLighting(sunColor?: THREE.Color)` (and `SkierEffects` / `SkierPresentation.updateLighting(sunColor)`) to accept only `sunColor?: THREE.Color`—delete the 6 unused parameters.
   - Remove the unused `_lightingParams` parameter from `NetworkManager.update(dt: number, camera: THREE.Camera)`.

### Verification
- Run `npx tsc --noEmit && npm run build` (verify `noUnusedLocals` / `noUnusedParameters` strict pass).
- Run `node tests/regression.mjs` to verify `WEBGL_lose_context` recovery (`DetailTexture` refresh), quality tier switching (`setDetailQuality`), and `Game.dispose()` teardown with 0 page errors.
