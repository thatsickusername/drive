# Grand Mountain Adventure (GMA) Master Alignment & Realignment Plan

## Core Technical Premise
This document details the exact, gap-free plan to align this simulation with the extracted **Grand Mountain Adventure Wonderlands** engine (`mechanics/`). All equations, piecewise curves, constants, and control pipelines strictly reflect the extracted C++ physics implementation (`PlayerPhysics.cpp`, `Controls.cpp`) and configuration files (`player.yaml`, `camera.yaml`, `trick_score.yaml`, `posture_ski.yaml`).

---

## GMA Extracted Core Reference Specifications

| Subsystem | Parameter / Constant | GMA Extracted Value | Source Origin |
| :--- | :--- | :--- | :--- |
| **Physics Sub-step** | `player.deltatime` | `0.003s` (333.3 Hz fixed) | `player.yaml:21` |
| **Collision Capsule** | `player.radius` | `0.3m` | `player.yaml:22` |
| **Forward Throttle** | **None** | `Controls.cpp:18` | No forward gas pedal; L/R steering only |
| **Steering Deadzone**| `DEADZONE` | `0.08` | `Controls.cpp:20` |
| **Steering Curve** | Quadratic | $\operatorname{sign}(x) \cdot ((|x|-0.08)/0.92)^2$ | `Controls.cpp:28` |
| **Flat Staking Trigger**| L/R Alternation | $|x| > 0.08$ on $[-20^\circ, 20^\circ]$ | `player.yaml:80` |
| **Pole Down Duration**| `player.staking.pole_down` | `0.5s` | `player.yaml:80` |
| **Staking Power** | Base / Initial Kick | $15.0\text{ m/s}^2$ ($+5.0\text{ m/s}^2$ standstill) | `player.yaml:82-83` |
| **Staking Velocity Cap**| `staking.max_vel` | $0.7 \times 15.0 = 10.5\text{ m/s}$ ($37.8\text{ km/h}$) | `player.yaml:79` |
| **Steep Slope Boost** | `speedboost.steep_slope` | $2.0\times$ fall-line acceleration | `player.yaml:31` |
| **Slide Turn Boost** | Impulse at 0.5s | $+2.0\text{ m/s}$ burst | `player.yaml:146-147` |
| **Drift Milestones** | Durations / Boosts | $[0.7, 1.4, 2.1]\text{s} \to [0.5, 1.2, 1.8]\times$ | `player.yaml:29-30` |
| **Standard Turn Cap**| `turn_cap_deg.standardturn` | $30.0^\circ$ cap, $98\%$ edge bite grip | `player.yaml:151` |
| **Sharp Turn Gate** | `duration.sharpturn` | $0.3\text{s}$ gate, $50.0^\circ$ cap | `player.yaml:162-163` |
| **Sharp Jump Boost** | `rotationboost.sharp_turn_boost` | $2.0\times$ airborne spin acceleration | `player.yaml:41` |
| **Switch Ski Penalty**| `switch_and_no_twintips` | $10.0\times$ friction drag, $30^\circ$ cap | `player.yaml:58` |
| **Snowplow Brake** | `player.breaking.power` | $2.5$ deceleration | `player.yaml:73` |
| **Jump Strength** | `player.jump_strenght` | $+4.0\text{ m/s}$ vertical impulse | `player.yaml:67` |
| **Trick Hover Lift** | `player.trick_hover_zforce` | $+0.5\text{ m/s}^2$ continuous upward lift | `player.yaml:65` |
| **Camera View** | Screen Y / Degree Range | $0.15$ (bottom 15%), $38^\circ\text{–}80^\circ$ pitch | `camera.yaml:14-17` |

---

## Phase 1: Pure GMA Movement, Momentum & Carving Realignment

Ensure the physics loop strictly replicates GMA downhill acceleration, skate wiggling on flats, sidecut carving, and high-speed momentum.

- [x] **1.1 Steep Slope Acceleration Multiplier (`speedboost.steep_slope: 2.0`)**
  - [x] On downhill slopes steeper than $20^\circ$, scale fall-line gravitational acceleration smoothly up to $2.0\times$ (`player.speedboost.steep_slope: 2`).
  - [x] Allow downhill skiers to accelerate organically from $40\rightarrow 70\rightarrow 100+\text{ km/h}$ down alpine chutes without artificial ceilings.
- [x] **1.2 Authentic Flat Snow Skate & Wiggle Dynamics**
  - [x] Enforce pure left/right stick waggle propulsion on flat snow ($|x| > 0.08$ alternation).
  - [x] Pole down duration: $0.5\text{s}$ per plant (`player.staking.pole_down: 0.5`).
  - [x] Standstill push kick: $+20.0\text{ m/s}^2$ ($15.0 + 5.0$) when $v < 1.0\text{ m/s}$.
  - [x] Curve gently around the planted pole while pushing, transitioning into fluid skate stride.
- [x] **1.3 Sidecut Edge Bite & Momentum Preservation**
  - [x] Carving across the fall line aligns velocity to ski heading with $98\%$ edge grip without loss of tangential kinetic energy.
  - [x] Slide Turn (Key E / Gamepad B) drops grip to $85\%$ to permit transverse snow sliding and sprays, injecting $+2.0\text{ m/s}$ at $0.5\text{s}$ and milestone boosts.
- [x] **1.4 Snowplow Wedge Braking**
  - [x] Holding Key S / Gamepad Left Trigger applies active $2.5\times$ deceleration, bringing skis to a halt within 1–2s.

---

## Phase 2: Dynamic Third-Person Chase Camera (Race-Car Style)

Dynamic third-person chase camera trailing closely behind the skier with speed-based dynamic FOV, carve lead-in offset, asymmetric elastic lag, and airborne touchdown pitch.

- [x] **2.1 Close Third-Person Follow Geometry**
  - [x] Base follow distance: 5.2m to 4.2m with responsive tight tracking.
- [x] **2.2 High-Velocity Dynamic FOV Expansion**
  - [x] 55° idle widening to 80° at speed + carve pump kick surges.
- [x] **2.3 Carve Apex Lead-In & Asymmetric Elastic Lag**
  - [x] Lookahead target biases into turn apex with asymmetric forward/lateral lag dampening.

---

## Phase 3: Aerial Trick Engine & Freestyle Ski Grabs (`trick_score.yaml`)

Implement GMA's aerial hangtime, 3-axis rotation dynamics, safety grabs, and scoring multiplier engine.

- [ ] **3.1 Airborne Dynamics & Hover Lift (`player.trick_hover_zforce: 0.5`)**
  - [ ] Jump pop: instant $+4.0\text{ m/s}$ vertical impulse (`player.jump_strenght: 4.0`).
  - [ ] Trick Hover Z-Force: $+0.5\text{ m/s}^2$ continuous upward lift while executing spins, flips, or rolls.
  - [ ] Air forward aerodynamic tuck: rotate skier $13.7^\circ$ forward (`player.air_bend_down_rad: 0.24`).
- [ ] **3.2 Three-Axis Aerial Rotations (Spins, Flips, Rolls)**
  - [ ] Right stick X / Keys: Spin (Yaw) at $10.0\text{ rad/s}^2$ accel, $15.0\text{ rad/s}^2$ decel.
  - [ ] Right stick Y / Keys: Flip (Frontflip/Backflip) at $8.0\text{ rad/s}^2$ accel, $8.0\text{ rad/s}^2$ decel.
  - [ ] Lincoln Loop / Cork: Roll at $8.0\text{ rad/s}^2$ accel (`cork.speed: 2.0`, `cork.max_offset: 1.0`).
- [ ] **3.3 Freestyle Ski Grabs & Scoring System**
  - [ ] Authentic grabs: Safety Grab, Mute, Japan, Tail Grab.
  - [ ] Combo multiplier calculation, airtime points, and touchdown alignment evaluation (`trick_score.yaml`).

---

## Phase 4: Verlet Ragdoll Crash Solver & Recovery (`verlet.yaml`)

Replicate GMA's 50 Hz particle Verlet ragdoll solver during high-impact wipeouts and cliff drops.

- [ ] **4.1 Crash Impact Thresholds**
  - [ ] Ground crash threshold: $26.0\text{ m/s}$ normal impact (`player.collissions.ground.crash_mag: 26.0`).
  - [ ] Obstacle crash threshold: $40.0\text{ m/s}$ impact (`player.collissions.object.crash_mag: 40.0`).
  - [ ] Touchdown misalignment wipeouts (landing sideways $> 45^\circ$).
- [ ] **4.2 50 Hz Verlet Particle Skeleton Solver**
  - [ ] 7-node articulated ragdoll skeleton running 5 relaxation iterations per step.
  - [ ] Ground bounce restitution $0.3$, friction $0.8$, gravity $29.43\text{ m/s}^2$, and 2.5s recovery.

---

## Phase 5: Audio, Visual FX & Environmental Polish

Replicate GMA's signature audio feedback, dual ski trail ribbons, and instanced pine grove rendering.

- [ ] **5.1 Procedural Snow Audio Synthesis**
  - [ ] Slicing high-frequency edge sound during clean high-speed carves.
  - [ ] Deep hollow snowplow roar during slide turns and snowplow braking.
  - [ ] Wind rush noise dynamically mapped to airspeed ($0\text{–}120\text{ km/h}$).
- [ ] **5.2 Dual Ski Trail Ribbons & Snow Spray Particles**
  - [ ] Dual independent ski track ribbons on snow surface.
  - [ ] Directional snow spray plumes bursting laterally from carved edges.
