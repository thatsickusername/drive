# STEEZY Ski Tracks, Snow Deformation & Particle VFX Specification

This document details the functional and technical architecture of ski marks, dynamic snow deformation, snow spray particle systems, and the swept surf wake in **STEEZY**. It explains how tracks, carved berms, hockey-stop pushed snow ridges, landing impact craters, and airborne powder plumes are created, simulated, and rendered for 1:1 recreation.

---

## 1. Architectural Philosophy: Why STEEZY Tracks Look Physical

In most video games, ski tracks are rendered as flat 2D decal ribbons or alpha-blended textures projected on top of static terrain. This approach creates visual floating, fails to cast or receive realistic shadows, and cannot alter the actual geometry or material firmness of the snow.

STEEZY rejects decals in favor of a **unified real-time simulation and displacement pipeline**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Contact Event Sources                           │
│  - Ski Edges & Carving (controller.js / snowContact.js)                │
│  - Touchdown & Landings (impact crater + landBurst.js)                 │
│  - Hockey-Stop Braking (scraped swath + downhill ridge)                │
│  - Boot Footfalls on Foot (elliptical prints with rim roughness)       │
│  - Multiplayer Remote Riders & Village NPCs                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ brush(x, z, r, depth, berm, ...)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               GPU Staging Texture (96 x 3 Float Attributes)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ deformSim.fragment.wgsl (Ping-Pong)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 2D Toroidal Deformation Field (RGBA16F)                │
│   R: Depression depth (m)        G: Displaced berm height (m)          │
│   B: Snow compression (0..1)     A: Ice sheen & burnish (0..1)         │
│   Follows player across 80m window at 3.9cm resolution                 │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
       Terrain Vertex Displacement                  Terrain Fragment Shading
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  snow.vertex.wgsl                    │  │  snow.fragment.wgsl          │
│  - Displaces lattice vertices down   │  │  - Compaction albedo darkening│
│    in trench and UP on berms         │  │  - Specular ice sheen        │
│  - Displaces shadow map casters      │  │  - Normal recalculation      │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

Everything that touches the snow writes to the same state buffer through a single unified `brush()` entry point.

---

## 2. The 2D Toroidal Deformation Simulation Field (`deformation.js`)

The deformation field is a continuous, additive, persistent GPU simulation running in a ping-pong render target.

### 2.1 Target Geometry & Resolution
- **Resolution**: $2048 \times 2048$ texels (`res`).
- **Physical Coverage**: $80\text{ m} \times 80\text{ m}$ (`COVERAGE = 80`).
- **Texel Size**: $80 / 2048 = 0.039\text{ m}$ ($3.9\text{ cm}$ per texel).
  - *Design Tradeoff*: $80\text{ m}$ keeps an entire 4-second high-speed carve visible behind the player. Halving texel size to $2\text{ cm}$ would require a 4096² target—$4\times$ the VRAM bandwidth per frame—to resolve detail that the fragment shader's grain layer already synthesizes.
- **Pixel Format**: `Constants.TEXTURETYPE_HALF_FLOAT`, `Constants.TEXTUREFORMAT_RGBA`.
  - Half-float resolves well under $0.1\text{ mm}$ over a $\pm 1.0\text{ m}$ displacement range. Full float would double memory bandwidth with zero perceptual gain.
- **Addressing Mode**: `wrapU = wrapV = TEXTURE_WRAP_ADDRESSMODE` (Toroidal addressing).

### 2.2 Texel-Grid Snapping & Toroidal Scrolling
As the player moves across the mountain, the $80\text{ m}$ window must follow them. If the window moved continuously by floating-point offsets, the simulation texture would resample with sub-pixel interpolation every frame, causing the entire field to blur and crawl.

STEEZY solves this by **snapping window center coordinates to exact texel multiples**:
```javascript
const t = this.texel; // 0.0390625 m
this.center.x = Math.round(focus.x / t) * t;
this.center.y = Math.round(focus.z / t) * t;
```
Because addressing is toroidal (wrapping), scrolling the window costs **zero copies, zero blits, and zero memory reallocation**.

### 2.3 The 4 Simulation State Channels

| Channel | Physical Meaning | Range | Effect in Vertex Shader | Effect in Fragment Shader |
| :--- | :--- | :--- | :--- | :--- |
| **R (Red)** | **Depression Depth** | $0.0 - 0.55\text{ m}$ | Displaces vertex **downward** along slope normal | Perturbs surface normal into trench |
| **G (Green)**| **Berm Height** | $0.0 - 0.34\text{ m}$ | Displaces vertex **upward** along slope normal | Casts contact self-shadowing |
| **B (Blue)** | **Compression** | $0.0 - 1.0$ | None (stiffness) | Darkens albedo (dense packed corduroy) |
| **A (Alpha)**| **Ice / Burnish** | $0.0 - 1.0$ | None | Increases specular gloss & sharp glint sheen |

---

## 3. The GPU Brush System & Staging Pipeline

Contact events queue brushes during the frame. At the start of the render pass, queued brushes are uploaded to a lightweight data texture and applied to the simulation field in a single full-screen pass (`deformSim.fragment.wgsl`).

### 3.1 Data Staging Texture (`brushTex`)
- **Capacity**: `MAX_BRUSHES = 96` brushes per frame.
- **Dimensions**: $96 \times 3$ floats (`RawTexture` RGBA float).
  - **Row 0**: `(worldX, worldZ, radius, elongation)`
  - **Row 1**: `(cos(yaw), sin(yaw), depth, berm)`
  - **Row 2**: `(compression, ice, edgeRoughness, seed)`

### 3.2 Calling the Brush Interface
```javascript
field.brush(
    x, z,             // World meters center
    radius,           // Short-axis radius in meters
    depth,            // Center depression depth in meters
    berm,             // Displaced rim mass in meters
    compression,      // 0..1 added to compression channel
    ice,              // 0..1 max-blended into ice channel
    yaw,              // Orientation of long axis in radians
    elongation,       // Long-axis ratio (1.0 = round, >1.0 = elliptical)
    edgeRoughness     // 0.0 = clean bevel, 1.0 = jagged rim tear
);
```

### 3.3 Zero-Allocation Upload
The staging array `_brushData = new Float32Array(96 * 3 * 4)` is allocated once at startup. Brushes write directly into this buffer. Only the active brush count is processed by the GPU.

---

## 4. Contact Mechanics: How the Skier Deforms Snow

The `SnowContact` class (`src/character/snowContact.js`) monitors character state every frame and issues physical deformation brushes.

### 4.1 Carving & Continuous Ski Grooves (`_tracks`)
Skis cut two parallel continuous trenches into the snowpack:

```
               ◄── Outer Ski ──►                 ◄── Inner Ski ──►
              (Throws Berm Wall)                 (Cuts Deeper Rut)
              ┌─────────────────┐               ┌─────────────────┐
              │                 │   Snow Mound  │                 │
──────────────┘                 └───────▲───────┘                 └──────────────
                                        │
                         Displaced Mass Berm Pushed Outward
```

1. **Dual Ski Geometry**:
   - Skis sit at half-stance offset: $\text{STANCE} = 0.15\text{ m}$ ($30\text{ cm}$ stance width). Snowboard uses a single centered brush.
   - Base ski radius: $\text{SKI\_RADIUS} = 0.05\text{ m}$ ($10\text{ cm}$ trench width).
2. **Inter-Frame Anti-Dotted Line Elongation**:
   At $25\text{ m/s}$ ($90\text{ km/h}$), a skier moves $0.42\text{ m}$ in a single $60\text{ fps}$ frame. Stamping round discs would leave a disconnected chain of dots. STEEZY stretches the brush along travel velocity:
   $$\text{elongation} = \max\left(\text{SKI\_ELONG}, \frac{\text{moved} \cdot 1.5}{\text{width}}\right)$$
3. **Weight Transfer in Carving**:
   When carving, the ski on the inside of the turn carries more body weight:
   $$w = 0.75 + 0.25 \cdot \text{side} \cdot \text{carve}$$
   The inside ski cuts a significantly deeper groove ($S.\text{trackDepth} \cdot w$).
4. **Thrown Berm Wall**:
   Carving forces snow laterally outward. Snow mass is thrown to the outside of the turn ($side_L = 0.5 + c \cdot 0.5, side_R = 0.5 - c \cdot 0.5$), piling up an asymmetric berm wall alongside the track.

### 4.2 Landing Impact Craters (`_landing`)
Touchdown after an air triggers an explosive compression crater:
- Scaled by vertical impact velocity `landImpact`:
  $$\text{radius} = 0.45 + 0.15 \cdot \text{impact}$$
  $$\text{depth} = 2.2 \cdot S.\text{trackDepth} \cdot \min(1, \text{impact})$$
  $$\text{berm} = 0.20 \cdot \text{impact}$$
- Instantly packs the snow under the skis (`compression = 0.9`) with a heavy displaced rim wall visible from chairlifts.

### 4.3 Hockey-Stop Braking Swaths & Downhill Ridges (`_skid`, `_endStop`)
Braking sideways ("hockey stop") executes a two-phase physical deformation:
1. **Scraping Phase (`_skid`)**:
   - The skis turn perpendicular to velocity.
   - A wide elliptical scraping swath is carved across the travel line ($16\text{ cm}$ wide, elongation $5.5$).
   - The snow volume pushed by the edges is accumulated into `_push += P * k`.
2. **Pushed Ridge Phase (`_endStop`)**:
   - When the stop completes and forward speed drops to zero, the banked snow volume `_push` is dumped as a **continuous sculptured ridge along the downhill edge**:
     - Main ridge brush: $34\text{ cm}$ berm height.
     - Secondary shoulder brush: $22\text{ cm}$ berm height.
     - Tip & tail spill mounds: $16\text{ cm}$ berm mounds where snow spilled around the ends of the skis.

### 4.4 Walking Footprints on Foot (`_prints`)
When hiking without skis (`G` key):
- Triggers on the exact frame the character rig plants a boot (`touchdown[i]`).
- Print dimensions: $20\text{ cm} \times 34\text{ cm}$ (`BOOT_WIDTH = 0.10`, `BOOT_ELONG = 1.7`).
- Depth: $17\text{ cm} - 31\text{ cm}$ based on walking speed.
- Full rim roughness (`edge = 1.0`): boot lugs tear the rim edges irregularly.
- Suppressed on hard village stone and wooden decks.

---

## 5. Track Settling, Wind Refill & Relaxation

Snow tracks must persist long enough to ride back through them, but eventually soften and fill in like real fresh snowfall.

### 5.1 The Half-Float Precision Problem
A decay term meant to last $400\text{ seconds}$ requires a per-frame change of less than $1 \times 10^{-5}$. In 16-bit half-float arithmetic, the smallest representable step (Unit in the Last Place / ULP) at values around $1.0$ is $4.9 \times 10^{-4}$. Applying decay every frame causes rounding to zero (the track never decays) or truncation to ten seconds.

### 5.2 Banked Time Relaxation (`RELAX_STEP = 0.4s`)
STEEZY banks elapsed frame time in `_relaxOwed`:
```javascript
this._relaxOwed += dt;
let relaxDt = 0;
if (this._relaxOwed >= RELAX_STEP) {
    relaxDt = this._relaxOwed;
    this._relaxOwed = 0;
}
```
Time is spent in larger $0.4\text{ second}$ increments, cleanly surpassing the half-float ULP and ensuring smooth, mathematically accurate $400\text{ s}$ track settling.

### 5.3 Simulation Shader Operations (`deformSim.fragment.wgsl`)
Every relaxation step:
1. **Wind Smoothing**: Berms and sharp ridges bleed slightly along the `windAngle` direction.
2. **Refill Accumulation**: Depressions fill in at `S.refillRate`.
3. **Ice Sheen Decay**: Polished ice sheen relaxes back to matte powder.

---

## 6. Real-Time Track Rendering in Shaders

The deformation texture is bound directly to the terrain snow material:

### 6.1 Vertex Displacement (`snow.vertex.wgsl`)
```wgsl
let deformUV = (worldPos.xz - deformCenter) / deformSize + vec2<f32>(0.5);
let deformSample = textureSampleLevel(deformTex, deformSampler, deformUV, 0.0);

let depth = deformSample.r;
let berm  = deformSample.g;

// Vertices physically move down into grooves and UP on berms
let totalDisplacement = (berm - depth) * deformDepthScale;
worldPos.y += totalDisplacement * groundNormal.y;
```
Because vertices physically move, tracks cast real directional shadows in the sun's low grazing light.

### 6.2 Fragment Shading (`snow.fragment.wgsl`)
- **Compacted Corduroy**: Areas with high blue channel (`compression`) have albedo dimmed by up to $12\%$ to simulate dense, light-absorbing compacted snow crystals.
- **Icy Edge Sheen**: Areas with high alpha channel (`ice`) receive high specular gloss and boosted grazing microfacet glints, rendering the carved tracks as polished, reflective cuts.

---

## 7. The Snow-Surf Wake System (`surfWake.js`)

At high carving speeds, the snowboard throws up a dramatic **breaking wave of snow** along the carved arc.

```
                              Crest Lip (Plume Spray Emitted Here)
                                  ┌───┐
                                 /     \
                                /       ▼ Curls Over
  Snowboard Bow ◄──────────────/          \
                               \           \
                                ────────────\── Collapses into Powder (0.62s)
```

### 7.1 Architecture & Geometry
The wake is composed of three synchronized systems sharing one central spine:
1. **The Wave**: A swept 3D mesh lattice ($128\text{ columns} \times 18\text{ rows}$) representing a curling wave that rises behind the board bow, peaks at up to $2.4\text{ m}$ height, and collapses after $0.62\text{ s}$ (`LIFE`).
2. **The Crest**: Two walls converging just ahead of the boots (`BOW_LEAD = 0.55\text{ m}`), splitting around the board.
3. **The Plume**: Spray particles emitted directly from the dynamic wave crest.

### 7.2 The 96-Sample Spine Ring
- A circular buffer of `SPINE_MAX = 96` samples committed every $0.30\text{ m}$ of travel.
- Stored in a $96 \times 3$ float data texture (`dataTex`).
- The vertex shader reads the spine texture to extrude and curl the wave lattice dynamically. No CPU mesh reconstruction occurs per frame.

---

## 8. Snow Spray & Particle VFX System (`particles.js`)

All airborne snow (footfall kicks, carving spray, hockey-stop fans, and landing bursts) is simulated by a single pooled system.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Spray Field Particle Pool                       │
│  - Total Capacity: 8,192 Particles                                    │
│  - Effect Pool:    5,120 Particles (Carve wake, hockey stop, landings) │
│  - Ambient Pool:   3,072 Particles (Ambient falling snow flakes)      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
       CPU Kinematics Step                           GPU Quad Expansion
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  CPU Typed Arrays                    │  │  Data Texture: 8192 x 2 Floats│
│  - pos[x,y,z], vel[x,y,z], age, life │  │  - Row 0: (x, y, z, size)    │
│  - Drag: 1/s (velocity damping)      │  │  - Row 1: (age01, seed, kind,│
│  - Terminal Velocity: 1.9 m/s        │  │            alpha)            │
│  - Kind: 0 (powder) vs 1 (clod)      │  │  Static Quad Mesh            │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### 8.1 Dual-Pool Architecture
Ambient snowfall can consume thousands of particles. To ensure that ambient flakes never starve an explosive hockey stop or carve plume:
- **`EFFECT_CAPACITY = 5120`**: Dedicated strictly to rider and gameplay VFX.
- **`AMBIENT_CAPACITY = 3072`**: Dedicated strictly to environmental snow.
- Full pool conditions drop new emissions gracefully in $O(1)$ time rather than hitching the frame.

### 8.2 Particle Kinematics & Aerodynamic Drag
Snow grains do not fall as ballistic cannonballs. They experience linear air resistance:
$$\vec{v}_{t+dt} = \vec{v}_t + (\vec{g} - \text{drag} \cdot \vec{v}_t) \cdot dt$$
- **Terminal Fall Speed**: Grains settle at $\sim 1.9\text{ m/s}$ (`TERMINAL = 1.9`).
- **Separation of Appearance vs. Drag**:
  - `kind = 0` (Powder puff): Translucent, soft-edged billboard.
  - `kind = 1` (Heavy clod): Sharp-edged, opaque snow chunk.
  - Plume spray uses powder appearance (`kind = 0`) but low drag ($1.6/\text{s}$ instead of $5.2/\text{s}$), allowing high-speed thrown sheets of snow to fly $8\text{ m}$ through the air before settling.

### 8.3 Hockey-Stop Spray Fan (`hockeySpray.js`)
During a hockey stop, spray is emitted in a wide forward fan:
- Number of particles scales with entry speed:
  $$N_{\text{particles}} = \text{brakeSkid} \cdot v_{\text{ref}} \cdot (6 + 20P) \cdot dt$$
- Particles radiate outward past the tips and tails with vertical launch velocity up to $9.5\text{ m/s}$ ($vy = vy_{\text{slow}} + (vy_{\text{fast}} - vy_{\text{slow}}) \cdot P$).
- A lingering powder cloud hangs suspended in the air for $2.5\text{ seconds}$ after a high-speed stop.

### 8.4 Landing Crown Burst (`landBurst.js`)
Touchdown after an aerial trick throws a circular crown of powder:
- Emits $N = 14 + \lfloor 30 \cdot \text{impact}\rfloor$ particles arranged in an even polar ring:
  $$\theta_k = \text{phase} + \frac{2\pi k}{N} \pm 0.17$$
  $$v_{\text{out}} = 2.2 + \text{rand}(2.0) \text{ m/s}$$
  Creates a symmetrical crown ring expanding outward from the skis.

---

## 9. Implementation Blueprint: 1:1 Recreation Guide

To build this dynamic track and VFX system in an external engine:

```
Step 1: 2D Toroidal Deformation Target
 └── Allocate two RGBA16F render targets (2048x2048) covering 80m.
 └── Set wrap mode to REPEAT / WRAP.
 └── Snap target center to multiples of texel size (0.039m).

Step 2: GPU Brush Pass
 └── Create brush staging texture (96 x 3 floats).
 └── Implement full-screen simulation shader applying elliptical brushes:
     R += depth, G += berm, B += compression, A = max(A, ice).
 └── Bank frame time into 0.4s steps to apply half-float decay relaxation.

Step 3: Terrain Material Integration
 └── In terrain vertex shader, sample deformation target and displace Y:
     y += (berm - depth) * scale.
 └── In terrain fragment shader, dim albedo on compression and boost specular on ice.

Step 4: Ski Contact Controller
 └── Connect character edge angle and carve to issue dual ski brushes.
 └── Elongate brushes based on inter-frame travel distance to avoid dotted lines.
 └── Add landing crater stamp and hockey-stop downhill ridge accumulation.

Step 5: Pooled GPU-Billboard Particle VFX
 └── Create static quad mesh with (particleID, corner) vertex attributes.
 └── Maintain 8192-particle typed array on CPU (position, velocity, age, drag).
 └── Upload position and age to an 8192x2 data texture per frame.
 └── Expand billboards facing the camera in vertex shader.
```