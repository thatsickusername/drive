# STEEZY Snow Shading & Player Interaction Specification

This document details the functional and technical implementation of the snow rendering pipeline and player interaction in **STEEZY**: how the soft, powdery top layer of textured snow is synthesized, its optical lighting model (microfacet glint, subsurface scattering, sastrugi wind ripples, slope-dependent rock stripping), and how snow dynamically influences player skiing, carving, and footstep physics.

---

## 1. Visual Goals & Optical Snow Model Overview

Snow in computer graphics frequently looks either like chalky white plastic or mirror-like ice. STEEZY achieves its signature soft, alpine aesthetic by modeling snow as a **multi-scale translucent participating medium composed of microscopic faceted ice crystals**:

```
                              Direct Sunlight (Low Sun Elevation 5°-15°)
                                         \        |
                                          \       |
                                           ▼      ▼
    Viewer Eye ◄────── Microfacet Glints (Faceted Ice Crystal Sparkle)
          ▲
           \───────── Subsurface Scattering (Forward & Translucent Warm Wrap)
            \
             ──────── Sastrugi & Wind Drift (Directional Macro Relief)
              \
               ────── Procedural Grain Texture (Microscopic Crystal Noise)
                \
                 ──── Slope Thresholding (Rock Stripping on Steep Faces >35°)
```

### Optical Principles
1. **Translucent Warm Wrap (Subsurface Scattering)**: Sunlight penetrates the porous surface of new powder, scattering internally between ice crystals before re-emerging. Shadows do not fall into cold blackness; they carry warm ambient skylight and forward-scattered rim radiance.
2. **Microfacet Specular Glint**: Fresh powder behaves as millions of tiny random mirrors. Looking toward the sun angle reveals sharp, sparkling pinpoints of light (glitter) that shimmer dynamically with camera movement.
3. **Multi-Scale Detail**: A procedural detail texture is sampled at **three distinct world frequencies** to completely prevent visible tiling patterns from $0.1\text{ m}$ up to $3\text{ km}$.
4. **Wind-Driven Sastrugi**: Wind carves directional ridges and ripples into the snowpack, aligning with the global wind vector (`windAngle`).
5. **Physical Interactivity**: Powder is not just visual—it alters edge response, turn radius, lateral smear, and aerodynamic drag.

---

## 2. Multi-Scale Snow Grain & Procedural Texturing

The snow material does not sample photograph textures. All grain and crystalline structures are generated procedurally via the GPU detail bake (`detailBake.fragment.wgsl` & `detailTex` in `terrain.js`).

### 2.1 The Procedural Detail Texture (`detailTex`)
- **Dimensions**: $1024 \times 1024$, `RGBA8`, trilinear filtered with mipmaps enabled.
- **Payload**:
  - `R`: High-frequency crystalline noise.
  - `G`: Mid-frequency flake clustering.
  - `B`: Flank slope gradient ($30^\circ$ dome flanks: `grainScale = 0.013`).
  - `A`: Sparkle phase seed.

### 2.2 Three-Frequency Octave Tiling
In the snow fragment shader (`snow.fragment.wgsl`), the detail texture is sampled three times at exponentially separated world scales:
```wgsl
// Micro scale: resolved near the ski tips (centimeter crystal grains)
let uvMicro = worldPos.xz * 12.0;
// Meso scale: resolves at 5-20 meters (clumping of snow mounds)
let uvMeso  = worldPos.xz * 2.4;
// Macro scale: resolves at 50-200 meters (subtle terrain density variation)
let uvMacro = worldPos.xz * 0.35;

let grainMicro = textureSample(detailTex, detailSampler, uvMicro);
let grainMeso  = textureSample(detailTex, detailSampler, uvMeso);
let grainMacro = textureSample(detailTex, detailSampler, uvMacro);

// Blend the three scales based on camera distance (LOD fade)
let grainNormal = blendNormals(grainMicro, grainMeso, grainMacro, distanceToCam);
```
This multi-scale blending eliminates the repetitive "grid" or "wallpaper" artifacts common in terrain shaders while preserving sub-centimeter tactile crispness at the skier's boots.

### 2.3 Sastrugi & Wind Drift Shading
Wind sculpts ridges across open mountain bowls. The terrain shader applies directional sastrugi displacements to both vertex positions and normal vectors:
- **Direction**: Uniform `windAngle` (converted from `S.windDirection` degrees to radians).
- **Displacement Vector**: Project world position along the wind axis:
  $$u_{\text{wind}} = x \cdot \cos(\theta_{\text{wind}}) + z \cdot \sin(\theta_{\text{wind}})$$
  $$v_{\text{wind}} = -x \cdot \sin(\theta_{\text{wind}}) + z \cdot \cos(\theta_{\text{wind}})$$
- **Wave Profile**: An asymmetric sawtooth wave with a steep leeward face and a gentle windward slope, scaled by `sastrugiAmp` (`S.sastrugiStrength`).

---

## 3. Optical Lighting & Shading Model

The snow shading pipeline operates in linear radiometric space, tightly coupled with the procedural sky system (`sky.js`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Shading Pipeline Stages                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Direct Sun Light:    Diffuse N·L with Soft Shadow PCSS Blocker      │
│ 2. Subsurface (SSS):    Translucent Wrap (N·L + wrap) * sssStrength    │
│ 3. Microfacet Glint:    Specular Glitter * (N·H)^glintExp * grazing    │
│ 4. Ambient & Sky:       9-Coefficient Spherical Harmonics (SH)         │
│ 5. Snow Deformation:    Albedo tint, compaction darkening & ice sheen  │
│ 6. Aerial Perspective:  Atmospheric Inscatter & Height Fog             │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Translucent Subsurface Scattering (SSS)
Snow crystals transmit light into the bulk medium. STEEZY approximates this using a **wrapped diffuse scattering model**:
$$\text{diffuseWrap} = \text{saturate}\left(\frac{\vec{N} \cdot \vec{L} + w}{1.0 + w}\right)$$
Where wrap factor $w \approx 0.45$.
- Crests and thin berms catch forward-scattered sunlight from behind:
  $$\text{forwardScatter} = \text{pow}\left(\text{saturate}(\vec{V} \cdot -\vec{L}), \text{sssPower}\right) \cdot \text{sssStrength}$$
- The scattered light is tinted with a warm golden hue ($[1.0, 0.92, 0.82]$), giving the sunlit crests of powder waves their translucent glow.

### 3.2 Microfacet Sparkle / Glint System
Looking across fresh powder toward a low sun ($5^\circ - 15^\circ$ elevation) reveals sparkling specks:
1. **Micro-Normal Perturbation**: The procedural detail texture perturbs the macro surface normal with random microfacet tilts.
2. **Half-Vector Alignment**: Compute the Blinn-Phong half vector:
   $$\vec{H} = \text{normalize}(\vec{L} + \vec{V})$$
3. **Stochastic Glint Noise**: A high-frequency pseudo-random cellular function evaluates whether a given microfacet reflects directly into the camera:
   $$\text{glint} = \text{step}\left(0.96, \text{hash3D}(\vec{P}_{\text{world}} \cdot 18.0)\right) \cdot \text{pow}(\vec{N}_{\text{micro}} \cdot \vec{H}, 128.0)$$
4. **Grazing Enhancement**: Glints are magnified at grazing angles where Fresnel reflectance approaches unity (`glintGrazing`).

### 3.3 Sky Lighting & Spherical Harmonics
The cool blue tone in snow shadows comes from **analytic atmospheric integration**:
- **Sky LUT (`skyLUT`)**: A $512 \times 256$ half-float equirectangular map generated from Rayleigh and Mie scattering formulas.
- **Spherical Harmonics (`shR`)**: An array of 9 SH coefficients ($36$ floats) projected from the sky LUT every time the sun moves.
- **Ambient Snow Tint**:
  $$E_{\text{ambient}}(\vec{N}) = \sum_{l=0}^{2} \sum_{m=-l}^{l} c_{lm} \cdot Y_{lm}(\vec{N})$$
  Because upward-facing snow primarily faces the blue zenith, shadowed snow naturally resolves to a cool cobalt hue, creating the classic warm-sun / cool-shadow contrast.

### 3.4 Cascaded Shadow Integration (PCSS)
Direct sunlight is modulated by a **3-Cascade Shadow Map (`SPLITS = [26, 95, 330]` meters)**:
- Filtered using **Percentage-Closer Soft Shadows (PCSS)** with a real blocker search.
- The depth map stores linear meters in `R32F` targets, allowing shadows cast by trees, skiers, and jump lips to soften realistically with distance from the caster.

---

## 4. Slope-Dependent Snow Stripping & Rock Exposure

Real mountains cannot hold deep powder on vertical precipices. Gravity, avalanches, and wind scour steep faces down to bare bedrock.

```
Slope Angle:   0° ─────── 25° ─────── 35° ─────── 45° ──────── 90°
Surface:      [  Deep Powder  ]   [ Packed ]  [ Talus ]  [ Bare Rock / Cliffs ]
```

### 4.1 Slope Thresholding & Angle Detection
In both the height baking pass (`auxBake.fragment.wgsl`) and runtime snow fragment shader:
1. Surface slope is derived from the vertical component of the normal vector:
   $$\cos(\theta_{\text{slope}}) = \vec{N} \cdot \vec{Y} = N_y$$
2. Slopes shallower than $30^\circ$ ($N_y > 0.866$) maintain 100% snow cover.
3. Between $30^\circ$ and $45^\circ$, snow strips away according to a transition curve.

### 4.2 Non-Speckle Rock Noise (`rockNoise`)
Naive slope thresholding creates noisy single-pixel speckles. STEEZY employs a wide, geological wandering function (`rockNoise` in `landforms.js`):
```javascript
export function rockNoise(x, z) {
    // 18m broad geological wander, never per-pixel noise
    return 0.65 * vnoise(x / 18, z / 18, 777) + 0.35 * vnoise(x / 7, z / 7, 778);
}
```
The threshold test evaluates:
$$\text{rockMask} = \text{smoothstep}\left(0.65, 0.82, \frac{N_y}{\text{rockNoise}(x, z)}\right)$$
- Where exposed, the shader switches from snow albedo to dark granite/slate rock textures.
- Curvature channels in `auxTex` apply dark ambient occlusion in crevices and bright rim highlights on sharp cliff edges.

---

## 5. Dynamic Snow Interaction with the Player

The character physics engine (`controller.js`, `snowContact.js`, `walk.js`) distinguishes between different snow surfaces, modifying kinematics, handling, and visual response.

### 5.1 Groomed Snow vs. Untracked Heli Powder

| Physical Property | Groomed Resort Snow | Untracked Deep Powder (`powder = 1.0`) | Architectural Formula (`controller.js`) |
| :--- | :--- | :--- | :--- |
| **Edge Bite / Time Constant** | Immediate, sharp response | Slower edge engagement ($1.7\times$ float) | $\tau_P = 1.0 + 0.7 \cdot \text{powder}$ |
| **Carve Turn Radius** | Tight, precise arcs | Wider, sweeping arcs ($1.45\times$ radius) | $R = R_{\text{base}} \cdot (1 + 0.45 \cdot \text{powder})$ |
| **Lateral Grip** | High grip ($100\%$) | Smears and drifts ($30\%$ loose smear) | $\text{grip}_P = 1.0 - 0.3 \cdot \text{powder}$ |
| **Aerodynamic Drag** | Standard quadratic drag | $+25\%$ drag on steep pitches | $\text{drag} = \text{drag}_0 \cdot (1 + 0.25 \cdot \text{powder}_K)$ |
| **Snow Friction** | Low corduroy friction | $+30\%$ friction on steep pitches | $\mu = \mu_0 \cdot (1 + 0.3 \cdot \text{powder}_K)$ |

### 5.2 Pitch-Gated Powder Drag Governor
Deep powder should feel buoyant and floaty, but early builds suffered from players getting trapped on flat benches. STEEZY solves this with a **slope-gated governor**:
$$g_{\text{along}} = -\frac{\vec{N}_{xz} \cdot \vec{V}_{xz}}{\|\vec{V}_{xz}\|}$$
$$\text{powder}_K = \text{powder} \cdot \text{clamp}\left(\frac{g_{\text{along}} - \tan(8^\circ)}{\tan(20^\circ) - \tan(8^\circ)}, 0, 1\right)$$
- **On flat benches ($<8^\circ$)**: $\text{powder}_K = 0$. Skis glide freely without bogging down.
- **On steep pitches ($>20^\circ$)**: $\text{powder}_K$ reaches full strength, applying authentic powder deceleration and requiring active fall-line commitment.

### 5.3 Edge Scrub & Speed Bleed
Even on groomed corduroy, carving displaces snow and scrubs kinetic energy:
$$a_{\text{fwd}} \mathrel{-}= \text{edgeScrub} \cdot |\text{edge}| \cdot |v_{\text{fwd}}|$$
Pointing the skis across the hill turns forward velocity into lateral grip force, scrubbing speed dynamically without artificial arcade braking.

### 5.4 Tree Crown Brush Interaction
Skiing through the glades allows clipping tree branches:
- When the skier is above trunk height ($>0.4 \cdot H_{\text{tree}}$) and inside the crown radius ($0.2 \cdot H_{\text{tree}}$), the tree is treated as soft brush rather than a solid wall.
- **Brush Drag**: Velocity is reduced by $14\%$ per half-second:
  $$v \mathrel{*}= (1.0 - 0.3 \cdot dt)$$
- Every $0.15\text{ s}$ (`BRUSH_GAP`), a white snow puff particle burst is triggered off the evergreen boughs.

### 5.5 On-Foot Walking & Boot Sink (`walk.js`)
When stepping out of bindings (`G` key):
- **Wading Sink**: In deep powder, the character rig sinks into the snowpack by up to $31\text{ cm}$ (`S.footprintDepth`).
- **Gait Cycle Adaptation**: Stride length and duty cycle scale with velocity:
  $$\text{strideHalf}(v) = (0.34 + 0.14 \cdot \min(1, v / 5.4)) \cdot \min(1, v / 0.6)$$
  $$\text{dutyCycle}(v) = 0.66 - 0.40 \cdot \min(1, v / 5.4)$$
- **Pavement Detection**: When walking on wooden boardwalks, stone plazas, or roofs (`Floors.walkOnly`), boot sink is bypassed ($0\text{ cm}$), and footstep audio switches from snow crunch to hard sett clicks.

---

## 6. Implementation Blueprint: 1:1 Recreation Guide

To reproduce this snow rendering and interaction pipeline in an external engine:

```
Step 1: Procedural Detail Texture Generator
 └── Generate a 1024² seamless noise texture (grain, flake clusters, flank slope).
 └── Configure trilinear filtering and mipmapping.

Step 2: Multi-Scale Texture Sampling in Fragment Shader
 └── Sample the detail texture at 3 world scales (e.g., 12.0, 2.4, 0.35 cycles/meter).
 └── Perturb macro geometric normal vector using blended grain normals.
 └── Apply directional sastrugi displacements based on windAngle uniform.

Step 3: Translucent Snow Lighting Model
 └── Implement wrapped diffuse lighting (N·L + 0.45) / 1.45 for subsurface body.
 └── Implement forward-scatter rim light tinted warm gold.
 └── Add stochastic microfacet glint sparkles based on Blinn-Phong half-vector.
 └── Integrate ambient spherical harmonics from sky model.

Step 4: Slope-Dependent Rock Stripping
 └── Evaluate Ny normal component against threshold (30°-45°).
 └── Modulate threshold with low-frequency value noise (rockNoise, 18m wander).
 └── Blend rock albedo and increase specular roughness in stripped areas.

Step 5: Physics & Snow Interaction Controller
 └── Implement powder field query (0.0 on groomed runs, 1.0 in backcountry).
 └── Scale carve turn radius and ease edge response time in powder.
 └── Apply slope-gated drag governor: allow glide on flats, increase drag on steep pitches.
```