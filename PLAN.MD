# Grand Mountain Adventure (GMA) Mechanics Alignment & Ski Migration Plan

## Executive Technical Premise
This document details the exact, gap-by-gap transformation of this game's mechanics into an identical replica of the extracted **Grand Mountain Adventure (GMA)** engine (`mechanics/`). The plan strictly adheres to the extracted C++ physics implementation (`PlayerPhysics.cpp`, `Controls.cpp`) and native parameter definitions (`config/player.yaml`, `config/trick_score.yaml`, `config/camera.yaml`). All snowboarding-specific code, sideways stances, and legacy prototypes are slated for immediate removal in Phase 1 to establish a pristine, dedicated Alpine Skiing simulation.

---

## GMA Extracted Specifications Reference Table

| Subsystem | Parameter / Constant | GMA Extracted Value | File Origin | Current Project State |
| :--- | :--- | :--- | :--- | :--- |
| **Physics Sub-step** | `player.deltatime` | `0.003s` (333.3 Hz) | `player.yaml:21` | Partially implemented; conflicts with Rapier |
| **Collision Capsule** | `player.radius` | `0.3m` | `player.yaml:22` | Uses Rapier 0.45m sphere |
| **Ground Adhesion** | `player.ground_pull_force`| `5.0 m/s²` | `player.yaml:61` | Partially implemented in `GmaPlayerPhysics.ts` |
| **Steering Deadzone**| `DEADZONE` | `0.08` | `Controls.cpp:20` | Implemented in `ControlsProcessor.ts` |
| **Steering Curve** | `outSteer` | Quadratic $sign \cdot ((x-0.08)/0.92)^2$ | `Controls.cpp:28` | Implemented in `ControlsProcessor.ts` |
| **Standard Turn** | `turn_cap_deg` | $30.0^\circ$ | `player.yaml:151` | Hardcoded / approximated in `src/boarder.ts` |
| **Sharp Turn** | `duration`, `turn_cap_deg`| $0.3\text{s}$, $50.0^\circ$ | `player.yaml:162` | Approximated |
| **Slide Turn Boost** | `timepoint`, `velocity` | $0.5\text{s}$, $+2.0\text{ m/s}$ burst | `player.yaml:146` | Implemented in `GmaPlayerPhysics.ts` |
| **Drift Milestones** | `durations`, `boosts` | $[0.7, 1.4, 2.1]\text{s}$, $[0.5, 1.2, 1.8]$ | `player.yaml:29` | Partially implemented |
| **Twintip Switch Penalty** | `switch_and_no_twintips` | $10.0\times$ friction, $30^\circ$ cap | `player.yaml:58` | Ski toggle exists but defaults to snowboard |
| **Staking Regular** | `inclination_regular` | $[-20.0^\circ, 0.0^\circ]$, $15\text{ m/s}^2$ ($+5$ initial)| `player.yaml:75` | Lacks pole animations and input binding |
| **Staking Damped** | `inclination_damped` | $[0.0^\circ, 20.0^\circ]$, $0.2\times$ power | `player.yaml:77` | Unused |
| **Jump Strength** | `jump_strenght` | $4.0\text{ m/s}$ vertical impulse | `player.yaml:67` | Project uses Rapier 11.5 m/s impulse |
| **Trick Hover Lift**| `trick_hover_zforce` | $+0.5\text{ m/s}^2$ | `player.yaml:65` | Implemented in `GmaPlayerPhysics.ts` |
| **Ground Impact Crash**| `crash_mag`, `penalty_mag`| $26.0\text{ m/s}$, $21.0\text{ m/s}$ ($0.3\times$ vel)| `player.yaml:94` | Partially mapped |
| **Camera View** | `player_screen_y`, `deg_range`| $0.15$ (bottom 15%), $38^\circ\text{–}80^\circ$ pitch | `camera.yaml:15` | Project uses low-angle 3rd person chase cam |

---

## Phase 1: Code Hygiene & Snowboarding Purge

Eliminate all snowboarding baggage, sideways orientations, board geometries, and legacy prototypes. Establish a clean, ski-only architecture.

- [x] **1.1 Deprecate & Delete Legacy Snowboard Controller**
  - [x] Delete or archive [SnowboardController.ts](file:///C:/Users/manis/Development/drive/src/player/SnowboardController.ts) (legacy prototype superseded by GMA core).
  - [x] Remove unused snowboard types and interfaces (`SnowboardInputState`) from [input.ts](file:///C:/Users/manis/Development/drive/src/input.ts).
- [x] **1.2 Refactor `SnowBoarder` to Dedicated `Skier`**
  - [x] Rename [boarder.ts](file:///C:/Users/manis/Development/drive/src/boarder.ts) to `skier.ts` and class `SnowBoarder` to `Skier`.
  - [x] Remove `SportType.Snowboard` as the active or selectable sport; enforce `SportType.Skis` as the sole operational mode.
  - [x] Delete `boardGroup`, snowboard deck meshes, tip geometry, and board materials (`boardMat`).
  - [x] Remove the $75^\circ$ ($0.42\pi$) sideways torso rotation; align rider hips, torso, boots, and head directly forward ($0^\circ$).
- [x] **1.3 Purge Snowboard Grabs from Trick Engine**
  - [x] Strip out snowboard-specific grabs (`Indie`, `Mute`, `Nosegrab`, `Tailgrab`, `Stalefish`) from [TrickEngine.ts](file:///C:/Users/manis/Development/drive/src/player/TrickEngine.ts).
  - [x] Retain and standardize freestyle ski rotations: Spins (180, 360, 540, 720, 900, 1080), Flips (Frontflip, Backflip), Lincoln Loops (Rolls), and Cork/Rodeo/Misty rotations matching GMA's `trick_score.yaml`.
- [x] **1.4 Purge Legacy Drivetrain & Vehicle UI Remnants from Ski Path**
  - [x] Verify that [main.ts](file:///C:/Users/manis/Development/drive/src/main.ts) initializes only the Alpine Ski simulation and does not link vehicle controls into the ski HUD.

---

## Phase 2: GMA Controls Architecture & Input Pipeline

Replicate the exact control processing pipeline recovered from `Controls.cpp` and `Controls.hpp`.

- [x] **2.1 Implement GMA Quadratic Steering Curve & Deadzone**
  - [x] Enforce deadzone filter:
    $$\text{DEADZONE} = 0.08$$
  - [x] Enforce quadratic steering response for inputs $|x| \ge 0.08$:
    $$\text{normalized} = \frac{|x| - 0.08}{1.0 - 0.08}$$
    $$\text{outSteer} = \operatorname{sign}(x) \cdot \text{normalized}^2$$
  - [x] Verify zero steering drift within $[-0.08, 0.08]$ and smooth micro-carving precision near center.
- [x] **2.2 Implement Double-Tap Staking Gesture Detector**
  - [x] In [ControlsProcessor.ts](file:///C:/Users/manis/Development/drive/src/mechanics/ControlsProcessor.ts), implement the double-tap timing window:
    - Tap threshold: `staking.gap_time = 0.35s`
    - First press duration: `staking.first_press_time = 1.0s`
    - Second tap duration: `staking.second_press_time = 0.1s`
  - [x] Support both explicit stake button (gamepad button / key `W` / `Up`) and double-tap forward gesture.
- [x] **2.3 Dual-Stick & Touch Action Binding**
  - [x] Left stick / A-D / Arrow Keys: Steering ($x$) and Forward/Brake ($y$).
  - [x] Right stick: Aerial Trick Stick (Spin $X$, Flip $Y$, Roll $Z$).
  - [x] Action Triggers:
    - `Sharp Turn`: Left Shift / Gamepad X / Left Trigger.
    - `Slide Turn / Drift`: Key E / Gamepad B / Right Trigger.
    - `Snowplow Brake`: Key S / Down / Gamepad Left Trigger hold.
    - `Jump / Ollie`: Space / Gamepad A (instant 4.0 m/s vertical pop).
    - `Pole Slap / Tackle`: Key F / Gamepad Y (NPC interaction & speed recovery).
- [x] **2.4 Reverse Turn Toggle (Switch Riding Mode)**
  - [x] Maintain `reverseTurnEnabled` state: when skiing switch (backward), automatically invert steering direction if enabled by user preferences (`outSteer = -outSteer`).

---

## Phase 3: 333.3 Hz Fixed Sub-stepping Core Physics & Slope Kinematics

Decouple kinematic integration from Rapier velocity fighting. The 333.3 Hz GMA sub-step loop (`player.deltatime: 0.003s`) must be the master authority, synchronizing to Rapier purely as a kinematic collider.

- [ ] **3.1 Exact 333.3 Hz Sub-Stepping Loop Accumulator**
  - [ ] Accumulator step: `dt_sub = 0.003s` (333.3 Hz).
  - [ ] Clamp frame delta to $0.1\text{s}$ max to prevent spiral-of-death on frame hitches.
  - [ ] Run fixed internal iterations until accumulator $< 0.003\text{s}$.
- [ ] **3.2 Slope Gravitational Decomposition**
  - [ ] For each sub-step on ground:
    $$\vec{g} = (0, -9.81, 0)$$
    $$\vec{g}_{\text{normal}} = (\vec{g} \cdot \vec{n})\vec{n}$$
    $$\vec{g}_{\parallel} = \vec{g} - \vec{g}_{\text{normal}}$$
  - [ ] Apply tangential gravity: $\vec{v} \mathrel{+}= \vec{g}_{\parallel} \cdot dt$.
- [ ] **3.3 Ground Pull Force (Contour Adhesion)**
  - [ ] Apply GMA continuous adhesive normal pull:
    $$\vec{F}_{\text{pull}} = -\vec{n} \cdot 5.0\text{ m/s}^2$$
    $$\vec{v} \mathrel{+}= \vec{F}_{\text{pull}} \cdot dt$$
  - [ ] Eliminates unnatural airborne bouncing when skiing over small crests, wind lips, and undulating rollers.
- [ ] **3.4 Multi-Point Longitudinal Ground Sampling**
  - [ ] Triple probe raycast configuration along ski centerline:
    - Center probe: $\vec{p}$
    - Tip/Nose probe: $\vec{p} + \vec{f}_{\text{ski}} \cdot 0.65\text{m}$
    - Tail probe: $\vec{p} - \vec{f}_{\text{ski}} \cdot 0.65\text{m}$
  - [ ] Weight normals (Center: 2.0, Nose: 1.0, Tail: 1.0) and smoothly interpolate normal $\vec{n}$.
- [ ] **3.5 Snowdepth Spring Model**
  - [ ] Implement GMA snowdepth suspension equations:
    - Spring constant: $k = 20.0$
    - Spring pull: $1.0$
    - Velocity damping: $0.99$
    - Position damping: $0.95$
  - [ ] Smoothly absorb micro-terrains into ski flex without jerking the camera or rigid body.

---

## Phase 4: GMA 4-Mode Ground Handling & Piecewise Carving Curves

Implement the exact four turning regimes and piecewise curve evaluators from `PlayerPhysics.cpp` and `player.yaml`.

- [ ] **4.1 Standard Turn Regime**
  - [ ] Maximum heading cap: $30.0^\circ$ (`player.turn_cap_deg.standardturn: 30`).
  - [ ] Turn velocity curve evaluation based on normalized speed $v_{\text{norm}} = \operatorname{clamp}(v / 30.0, 0, 1)$:
    - Points: `[0.0, 0.4, 1.0]`
    - Values: `[5.0, 1.8, 1.2] rad/s`
  - [ ] Turn duration factor:
    - Points: `[0.0, 0.3, 1.0]`
    - Values: `[0.0, 0.0, 1.0]`
    - Turn rate formula: $\omega = v_{\text{factor}} \cdot (1.0 + t_{\text{factor}} \cdot 0.5)$.
  - [ ] Drift velocity penalty curve:
    - Points: `[0.0, 0.2, 1.0]`, values: `[0.018, 0.006, 0.006]`.
    - Penalty multiplier: `1.0`.
  - [ ] Edge bite velocity alignment: blend velocity vector toward forward ski heading with $98\%$ grip factor.
- [ ] **4.2 Sharp Turn Regime (Active Carving Bite)**
  - [ ] Activated when `sharpTurn` trigger is held and steering input $|x| > 0.05$.
  - [ ] Duration gate: $0.3\text{s}$ (`player.duration.sharpturn: 0.3`).
  - [ ] Heading cap: $50.0^\circ$ (`player.turn_cap_deg.sharpturn: 50`).
  - [ ] Turn velocity curve:
    - Points: `[0.0, 0.3, 1.0]`
    - Values: `[10.0, 10.0, 4.0] rad/s`
  - [ ] Drift velocity curve:
    - Points: `[0.0, 0.3, 1.0]`, values: `[0.001, 0.005, 0.007]`.
  - [ ] Sharp Turn Rotation Boost: if the player jumps during a sharp turn, apply extra spin acceleration multiplier of $2.0\times$ (`player.rotationboost.sharp_turn_boost: 2.0`).
- [ ] **4.3 Slide Turn Regime (Hockey Stop & Power Drift)**
  - [ ] Activated when `slideTurn` trigger is held and steering input $|x| > 0.05$.
  - [ ] Heading cap: $30.0^\circ$. Drift penalty: $0.0$.
  - [ ] Turn velocity curve: points `[0.0, 0.4, 1.0]`, values `[5.0, 5.0, 5.0] rad/s`.
  - [ ] Drift velocity curve: points `[0.0, 0.99, 1.0]`, values `[0.001, 0.001, 0.001]`.
  - [ ] Drift duration curve: points `[0.0, 0.7, 1.0]`, values `[0.0, 0.0005, 0.001]`.
  - [ ] Grip relaxation: drop forward velocity alignment grip to $85\%$ to permit transverse snow sliding.
  - [ ] **Slide Turn Speed Boost**:
    - Accumulate slide turn time: `slideTurnBoostTimer += dt`.
    - At `slideturn_boost_timepoint = 0.5s`, inject impulse: $\vec{v} \mathrel{+}= \vec{f}_{\text{ski}} \cdot 2.0\text{ m/s}$.
  - [ ] **Drift Duration Milestone Boosts**:
    - Milestone 1 ($0.7\text{s}$): $+0.5$ speed boost factor ($1.125\times$).
    - Milestone 2 ($1.4\text{s}$): $+1.2$ speed boost factor ($1.30\times$).
    - Milestone 3 ($2.1\text{s}$): $+1.8$ speed boost factor ($1.45\times$).
- [ ] **4.4 OverTurn Regime & Twintip Constraints**
  - [ ] Activated when steering exceeds $0.85$ and speed $> 14.0\text{ m/s}$.
  - [ ] Non-twintip traditional skis: strictly capped at $30.0^\circ$ (`turn_cap_deg.overturn_no_twintip: 30`).
  - [ ] Twintip skis: capped at $60.0^\circ$ (`turn_cap_deg.overturn: 60`).
  - [ ] Drift penalty: massive $10.0\times$ friction drag (`drift_penalty.overturn: 10`).
- [ ] **4.5 Switch Skiing (Riding Backward) Penalty**
  - [ ] Alignment check: $\vec{v} \cdot \vec{f}_{\text{ski}} < -0.1$.
  - [ ] Traditional non-twintip skis: apply severe $10.0\times$ base friction penalty (`ground_friction.switch_and_no_twintips: 10.0`), immediately scrubbing speed if skied backward.
  - [ ] Twintip skis: regular $1.0\times$ base friction (`ground_friction.base: 1.0`).

---

## Phase 5: Ski Poles Staking & Propulsion Engine

Implement GMA's dedicated ski pole propulsion mechanics on flat terrain and uphills (`PlayerPhysics.cpp:305-328`).

- [ ] **5.1 Terrain Slope Inclination Gating**
  - [ ] Calculate terrain slope angle from ground normal:
    $$\theta_{\text{slope}} = \arcsin(\operatorname{clamp}(-\vec{n}_y, -1.0, 1.0)) \cdot \frac{180^\circ}{\pi}$$
  - [ ] Regular Staking Gate:
    $$\theta_{\text{slope}} \in [-20.0^\circ, 0.0^\circ]$$
  - [ ] Damped Staking Gate:
    $$\theta_{\text{slope}} \in (0.0^\circ, 20.0^\circ]$$
  - [ ] If $\theta_{\text{slope}} > 20.0^\circ$ (steep downhill), staking is disabled.
- [ ] **5.2 Velocity Gate & Staking Propulsion Calculation**
  - [ ] Velocity threshold:
    $$v_{\text{current}} < \text{staking.max\_vel} \times 15.0 = 0.7 \times 15.0 = 10.5\text{ m/s}$$
  - [ ] Base Staking Power:
    $$P_{\text{stake}} = 15.0\text{ m/s}^2$$
  - [ ] Standstill Push Kick: if $v_{\text{current}} < 1.0\text{ m/s}$, add initial kick:
    $$P_{\text{stake}} \mathrel{+}= 5.0\text{ m/s}^2 \quad (\text{Total } 20.0\text{ m/s}^2)$$
  - [ ] Damped multiplier: if on damped slope ($0^\circ\text{–}20^\circ$), scale power:
    $$P_{\text{stake}} \mathrel{*}= 0.20 \quad (\text{Reduced to } 3.0\text{–}4.0\text{ m/s}^2)$$
  - [ ] Apply forward impulse: $\vec{v} \mathrel{+}= \vec{f}_{\text{ski}} \cdot (P_{\text{stake}} \cdot dt)$.
- [ ] **5.3 Procedural Dual-Pole Plant Animation**
  - [ ] Synchronize Left and Right pole plant cadence at `staking_animation_speed: 9.0`.
  - [ ] Alternate arms: left arm plants forward, driving torso push, followed by right arm plant.
  - [ ] Pole tips touch ground at $-0.42\text{m}$ relative to hips, angling backward at $+25^\circ$ to deliver thrust.

---

## Phase 6: Aerial Trick Engine, Freestyle Ski Grabs & Scoring System

Replicate GMA's aerial dynamics (`PlayerPhysics.cpp:250-280`) and scoring engine (`trick_score.yaml`).

- [ ] **6.1 Airborne Dynamics & Trick Hover Force**
  - [ ] Vertical Jump: instantaneous $+4.0\text{ m/s}$ impulse along normal/vertical axis (`jump_strenght: 4.0`).
  - [ ] Air drag factor: $0.006$ per sub-step (`air_friction: 0.006`).
  - [ ] Air forward lean: rotate skier $13.7^\circ$ forward (`air_bend_down_rad: 0.24`).
  - [ ] **Trick Hover Z-Force**: when any trick rotation is active (spin, flip, or roll input $> 0.05$), inject continuous upward lift:
    $$\vec{v}_y \mathrel{+}= 0.5\text{ m/s}^2 \cdot dt$$
    (Provides the signature floaty hangtime of GMA during trick combos).
- [ ] **6.2 Three-Axis Freestyle Ski Rotations**
  - [ ] Spin (Yaw around vertical):
    - Acceleration: $10.0\text{ rad/s}^2$ (`spin.acceleration: 10`)
    - Deceleration: $15.0\text{ rad/s}^2$ (`spin.deceleration: 15`)
  - [ ] Flip (Pitch around transverse):
    - Acceleration: $8.0\text{ rad/s}^2$ (`flip.acceleration: 8`)
    - Deceleration: $8.0\text{ rad/s}^2$ (`flip.deceleration: 8`)
    - Landing dampening: $8.0$ (`flip.land_damp: 8`)
  - [ ] Roll / Lincoln Loop (Roll around longitudinal):
    - Acceleration: $8.0\text{ rad/s}^2$, Deceleration: $8.0\text{ rad/s}^2$
- [ ] **6.3 Freestyle Ski Grabs & Trick Point Values (`trick_score.yaml`)**
  - [ ] Replace snowboard grabs with classic freestyle ski grabs:
    - `Safety Grab`: Skier reaches down to grab outside ski under binding.
    - `Mute Grab`: Skier crosses ski tips in an X and grabs opposite ski edge.
    - `Japan Grab`: Reaching behind leg to grab inside edge of opposite ski.
    - `Iron Maiden`: Crossed tails grab.
  - [ ] Point Evaluation Rates:
    - Spin: $100$ base $+ 1.6\text{ pts/deg}$
    - Flip: $200$ base $+ 2.0\text{ pts/deg}$
    - Roll: $150$ base $+ 2.0\text{ pts/deg}$
    - Rodeo / Misty: $150$ base $+ 2.4\text{ pts/deg}$
    - Rail slide: $400$ base $+ 16.0\text{ pts/meter}$
    - Tail/Nose Press: $200$ base $+ 8.0\text{ pts/meter}$
    - Bonk: $400$ pts
- [ ] **6.4 Touchdown Landing Evaluation**
  - [ ] Measure airtime ($t_{\text{air}}$), normal impact velocity ($v_{\text{impact}} = -\vec{v} \cdot \vec{n}$), slope tilt angle error ($\theta_{\text{tilt}}$), and velocity-to-ski yaw deviation ($\theta_{\text{yaw}}$).
  - [ ] **Perfect Landing**:
    - Criteria: $t_{\text{air}} \ge 1.5\text{s}$, $v_{\text{impact}} \le 13.0\text{ m/s}$ ($50\%$), $\theta_{\text{tilt}} \le 20.0^\circ$, $\theta_{\text{yaw}} \le 20.0^\circ$.
    - Reward: Apply score-dependent speed boost multiplier:
      - $\ge 800$ pts: $1.7\times$ speed boost
      - $\ge 1600$ pts: $3.2\times$ speed boost
      - $\ge 3000$ pts: $6.0\times$ speed boost
  - [ ] **Good Landing**:
    - Criteria: $t_{\text{air}} \ge 1.5\text{s}$, $v_{\text{impact}} \le 19.5\text{ m/s}$ ($75\%$), $\theta_{\text{tilt}} \le 30.0^\circ$, $\theta_{\text{yaw}} \le 30.0^\circ$.
    - Reward: $1.2\times$ speed boost.
  - [ ] **Sketchy Landing**:
    - Deviations between $30^\circ$ and $45^\circ$, or impact between $21.0$ and $26.0\text{ m/s}$.
    - Penalty: velocity multiplied by $0.30$ (`velocity_penalty: 0.3`).
  - [ ] **Crash Wipeout**:
    - Impact $> 26.0\text{ m/s}$ or orientation deviation $> 45^\circ$. Triggers ragdoll.

---

## Phase 7: Landing Impacts, Verlet Ragdoll Crash & Skis Detachment

Port GMA's crash sequence and physics boundaries (`player.yaml:90-114`).

- [ ] **7.1 Collision Magnitude Thresholds**
  - [ ] Ground Waggle Threshold: $15.0\text{ m/s}$ (`player.collissions.ground.waggle_mag: 15`). Triggers visual ski shudder.
  - [ ] Ground Penalty Threshold: $21.0\text{ m/s}$ (`player.collissions.ground.penalty_mag: 21`). Velocity penalized to $30\%$.
  - [ ] Ground Crash Threshold: $26.0\text{ m/s}$ (`player.collissions.ground.crash_mag: 26`). Instant wipeout.
  - [ ] Object Impact Crash: $40.0\text{ m/s}$ (`player.collissions.object.crash_mag: 40`).
  - [ ] Rough Ground Exposure: If player rides on unskiable cliff rocks ($> 50^\circ$) for $> 3.0\text{s}$ (`time_on_rough_ground_before_crash: 3`), trigger stumble crash.
- [ ] **7.2 Verlet Ragdoll & Detachable Ski Physics**
  - [ ] On crash, activate 7-node Verlet particle skeleton:
    - Node 0: Head
    - Node 1: Torso / Chest
    - Node 2: Pelvis / Hips
    - Nodes 3-4: Left / Right Hands
    - Nodes 5-6: Left / Right Feet
  - [ ] **Independent Skis & Poles Detachment**:
    - Spawn independent physics props for Left Ski, Right Ski, Left Pole, and Right Pole.
    - Eject them with tangential release velocity $\vec{v}_{\text{skier}} + \text{random dispersion}$.
    - Props tumble and slide along terrain using Rapier rigid body contacts until coming to rest.
  - [ ] Recovery: Skier ragdoll slides to rest ($2.5\text{s}$ timer), auto-stands, and skis snap back onto boots.
- [ ] **7.3 Water Skiing (Hydroplaning on Lake)**
  - [ ] For elevations $y < 0.0$ (frozen river/lake crossing at mountain base):
    - Submersion limit: if depth exceeds $2.0\text{m}$ (`water_max_depth: -2`), trigger sink crash.
    - Hydroplaning speed threshold: if speed drops $< 2.0\text{ m/s}$ while submerged $> 0.5\text{m}$, trigger sinking crash.
    - Buoyancy spring: $k = 0.035$, damping $[2.0, 4.0, 0.0]$.
    - Friction: drag $[0.57, 0.6, 2.0]$.

---

## Phase 8: GMA Signature Overhead / Isometric Camera Director

Transform the camera director from a low third-person chase cam into GMA's iconic isometric / high-angle mountain view (`config/camera.yaml`).

- [ ] **8.1 Perspective Geometry & Screen Placement**
  - [ ] Base FOV: $60^\circ$ (`camera.base.fov: 60`).
  - [ ] Skier Screen Position: anchor skier at $15\%$ from bottom of the screen (`camera.player_screen_y: 0.15`), providing $85\%$ forward vision down the mountain.
  - [ ] Degree Range: pitch angle strictly maintained between $38.0^\circ$ and $80.0^\circ$ (`camera.degree_range: 38 80`).
  - [ ] Top-down focus player position factor: $0.99$ (`camera.topdown_focus_playerpos_t: 0.99`).
  - [ ] Top-down offset factor: $0.6$ (`camera.topdown_offset_t: 0.6`).
- [ ] **8.2 Downslope Lookahead & Dynamic Inclination Offset**
  - [ ] Implement `camera.inclination_offset: 0.01` and window smoothener `0.03`.
  - [ ] When skiing down steep fall lines, elevate camera pitch toward $75^\circ$ for an isometric vantage.
  - [ ] When skiing flat or uphill (staking), pitch camera lower ($40^\circ$) and lead ahead of rider by up to $19.1\text{m}$ (`camera.recording.offsetxy: 19.1`).
- [ ] **8.3 Flying Dynamics & Landing Camera Shake**
  - [ ] Airborne camera distance offset multiplier: $-0.15$ (`camera.flying_offset_dist_mul: -0.15`).
  - [ ] Airborne distance multiplier: $-0.30$ (`camera.flying_camera_dist_mul: -0.3`).
  - [ ] Touchdown Landing Camera Shake (`camera.yaml:39-42`):
    - Shake spring $k$: $0.9$
    - Shake trigger threshold: impact $> 0.4$
    - Shake frequency: $8\text{ Hz}$
    - Shake power: $0.7$

---

## Phase 9: Visuals, Dual-Ski Trail Ribbons, Snow Particles & Carving Audio

Ensure all sensory output matches GMA's crisp alpine aesthetic.

- [ ] **9.1 Dual Parallel Carve Trails**
  - [ ] Upgrade [SnowTrailRibbon](file:///C:/Users/manis/Development/drive/src/boarder.ts#L117) to emit **two distinct parallel track ribbons**:
    - Left ski track: offset $-0.20\text{m}$ along right vector.
    - Right ski track: offset $+0.20\text{m}$ along right vector.
  - [ ] Razor-thin ribbon width ($0.03\text{m}$) during pure carving.
  - [ ] Smeared wide plume tracks ($0.35\text{m}$) during slide turns and snowplow braking.
  - [ ] Persistent trail mesh vertex decay rate ($0.9985$).
- [ ] **9.2 Directional Snow Spray Particles**
  - [ ] Carving: twin thin rooster tails peeling outward from the outside ski edge.
  - [ ] Slide Turn / Hockey Stop: massive fan plume spraying in the direction of lateral velocity scrub.
  - [ ] Particle lifetime: $0.35\text{s}\text{–}0.60\text{s}$, affected by gravity ($9.81\text{ m/s}^2$).
- [ ] **9.3 Procedural Audio Slicing vs Scraping**
  - [ ] Clean Carve: high-frequency bandpass slicing sound ($950\text{ Hz}\text{–}3150\text{ Hz}$) proportional to edge bite and speed.
  - [ ] Skid / Drift / Snowplow: deep hollow rushing white noise plowing sound ($380\text{ Hz}\text{–}1030\text{ Hz}$).
  - [ ] Land Thump: lowpass oscillator thuds on touchdown ($180\text{ Hz}$ clean, $120\text{ Hz}$ heavy impact).
  - [ ] Staking Sound: rhythmic crisp pole jab clicks into hardpack snow.

---

## Phase 10: Verification, Test Matrix & Benchmark Metrics

Verify full mechanical equivalence with the extracted GMA engine.

- [ ] **10.1 Physics Frequency & Accumulator Verification**
  - [ ] Verify exactly 333.3 Hz fixed sub-steps executing with no delta drift.
  - [ ] Verify zero clipping through terrain mesh across $1.5\text{ km}$ massif.
- [ ] **10.2 Steering Curve Verification**
  - [ ] Verify exact deadzone threshold at $0.08$.
  - [ ] Verify quadratic progression: $0.5$ raw input yields $0.209$ effective steer; $1.0$ yields $1.0$.
- [ ] **10.3 Turn Regime & Boost Timers**
  - [ ] Test StandardTurn angle clamp at $30.0^\circ$.
  - [ ] Test SharpTurn angle clamp at $50.0^\circ$ and expiration at $0.3\text{s}$.
  - [ ] Test SlideTurn boost firing at exactly $0.5\text{s}$ ($+2.0\text{ m/s}$ forward impulse).
  - [ ] Test Drift duration milestones at $0.7\text{s}$, $1.4\text{s}$, and $2.1\text{s}$.
- [ ] **10.4 Twintip vs Traditional Ski Equivalence**
  - [ ] Verify traditional skis backward skiing friction is $10.0\times$ base ($10.0$ vs $1.0$).
  - [ ] Verify traditional skis overturn limit is $30.0^\circ$ vs twintip $60.0^\circ$.
- [ ] **10.5 Staking Gate Verification**
  - [ ] Verify staking grants full $15\text{ m/s}^2$ ($+5$ kick) on slopes between $-20^\circ$ and $0^\circ$.
  - [ ] Verify damped $0.2\times$ scaling on slopes between $0^\circ$ and $+20^\circ$.
  - [ ] Verify staking disables on slopes $> 20^\circ$ or speeds $> 10.5\text{ m/s}$.
- [ ] **10.6 Camera Director Alignment**
  - [ ] Verify skier remains anchored in bottom $15\%$ of screen.
  - [ ] Verify camera pitch smoothly transitions within $38^\circ\text{–}80^\circ$.
