import * as THREE from 'three';
import { createSnowDetailTexture } from './DetailTexture';

export interface SnowMaterialOptions {
  sunDir?: THREE.Vector3;
  sunColor?: THREE.Color;
  shadowColor?: THREE.Color;
  anisotropy?: number;
}

export function createSnowMaterial(options: SnowMaterialOptions = {}): THREE.MeshStandardMaterial {
  const sunDir = options.sunDir || new THREE.Vector3(140, 110, -50).normalize();
  const sunColor = options.sunColor || new THREE.Color(0xfff6ec);
  const shadowColor = options.shadowColor || new THREE.Color(0x9ca9cb);

  // Generate or retrieve shared 1024x1024 procedural detail texture
  const detailTexture = createSnowDetailTexture(options.anisotropy ?? 4);

  const uniforms = {
    uDetailTex: { value: detailTexture },
    uTime: { value: 0.0 },
    uSunDir: { value: sunDir.clone() },
    uSunColor: { value: sunColor.clone() },
    uShadowColor: { value: shadowColor.clone() },
    uCameraPos: { value: new THREE.Vector3() },
    uPlayerPos: { value: new THREE.Vector3() },
    uGoldenFactor: { value: 0.0 },
    uNightFactor: { value: 0.0 }
  };

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: false,
    side: THREE.FrontSide
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDetailTex = uniforms.uDetailTex;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSunDir = uniforms.uSunDir;
    shader.uniforms.uSunColor = uniforms.uSunColor;
    shader.uniforms.uShadowColor = uniforms.uShadowColor;
    shader.uniforms.uCameraPos = uniforms.uCameraPos;
    shader.uniforms.uPlayerPos = uniforms.uPlayerPos;
    shader.uniforms.uGoldenFactor = uniforms.uGoldenFactor;
    shader.uniforms.uNightFactor = uniforms.uNightFactor;

    // 1. Vertex Shader: export world position & normal
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      /* glsl */ `
      #include <worldpos_vertex>
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      `
    );

    // 2. Fragment Shader declarations
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      uniform sampler2D uDetailTex;
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uShadowColor;
      uniform vec3 uCameraPos;
      uniform vec3 uPlayerPos;
      uniform float uGoldenFactor;
      uniform float uNightFactor;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      // Shared globals across fragment chunks
      float gDistToCam;
      float gLodMicro;
      float gLodMeso;
      float gLodMacro;
      float gRockMask;
      float gIsSnow;
      vec3 gWorldNPerturbed;
      vec4 gDMicro;
      vec4 gDMeso;

      // 3D Hash for microfacet glints
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }

      // Smooth 2D noise for rock wander and domain warping
      float hash2D(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise2D(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash2D(i);
        float b = hash2D(i + vec2(1.0, 0.0));
        float c = hash2D(i + vec2(0.0, 1.0));
        float d = hash2D(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      `
    );

    // 3. Color fragment: Albedo & Slope-dependent rock stripping
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      gIsSnow = step(0.50, diffuseColor.r);

      gDistToCam = length(vWorldPosition - uCameraPos);
      gLodMicro = 1.0 - smoothstep(1.5, 95.0, gDistToCam);
      gLodMeso  = 1.0 - smoothstep(5.0, 280.0, gDistToCam);
      gLodMacro = 1.0 - smoothstep(20.0, 650.0, gDistToCam);

      gDMicro = gLodMicro > 0.001 ? texture2D(uDetailTex, vWorldPosition.xz * 8.0) : vec4(0.5, 0.5, 1.0, 1.0);
      gDMeso  = gLodMeso  > 0.001 ? texture2D(uDetailTex, vWorldPosition.xz * 2.0) : vec4(0.5, 0.5, 1.0, 1.0);

      // 18m broad geological wander for natural non-speckle rock stripping
      float rNoise1 = noise2D(vWorldPosition.xz / 18.0);
      float rNoise2 = noise2D(vWorldPosition.xz / 7.0);
      float rNoise = 0.65 * rNoise1 + 0.35 * rNoise2;

      float ny = vWorldNormal.y;
      float rockThreshold = mix(0.70, 0.82, rNoise);
      gRockMask = smoothstep(rockThreshold - 0.08, rockThreshold + 0.04, ny);

      // Rock albedo & striations
      vec3 darkRock = vec3(0.24, 0.22, 0.21) * mix(0.85, 1.15, rNoise2);
      // Physically-calibrated fresh alpine powder snow albedo
      vec3 daySnow = vec3(0.96, 0.965, 0.98);
      vec3 goldenSnow = vec3(0.97, 0.92, 0.92);
      vec3 nightSnow = vec3(0.80, 0.83, 0.88);
      vec3 snowAlbedo = mix(mix(daySnow, goldenSnow, uGoldenFactor), nightSnow, uNightFactor);

      // Tactile crystalline powder micro-AO and crevice tooth
      float microAO = mix(0.56, 1.0, smoothstep(0.08, 0.90, gDMicro.b));
      float mesoAO  = mix(0.78, 1.0, smoothstep(0.12, 0.88, gDMeso.b));
      float totalAO = mix(1.0, microAO * mesoAO, gLodMeso);
      snowAlbedo *= totalAO;

      // Sunward crystalline facet highlight
      float crystalGleam = smoothstep(0.52, 0.96, gDMicro.b) * 0.14 * gLodMicro;
      snowAlbedo += vec3(crystalGleam);

      // Combine based on rockMask and isSnow
      vec3 finalSurfColor = mix(darkRock, snowAlbedo, gRockMask);
      diffuseColor.rgb = mix(diffuseColor.rgb, finalSurfColor, gIsSnow * 0.85);
      `
    );

    // 4. Roughness map fragment: Modulate roughness across snow and rock
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      /* glsl */ `
      #include <roughnessmap_fragment>
      roughnessFactor = mix(0.94, 0.88, gRockMask);
      `
    );

    // 5. Normal Perturbation in View Space via Multi-Scale Procedural Snow & Organic Sastrugi
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      /* glsl */ `
      #include <normal_fragment_begin>

      // Multi-scale procedural sampling of uDetailTex (gated by distance LOD)
      vec4 dMacro = gLodMacro > 0.001 ? texture2D(uDetailTex, vWorldPosition.xz * 0.35) : vec4(0.5, 0.5, 1.0, 1.0);

      vec2 pMicro = (gDMicro.rg * 2.0 - 1.0) * (0.65 * gLodMicro);
      vec2 pMeso  = (gDMeso.rg * 2.0 - 1.0) * (0.42 * gLodMeso);
      vec2 pMacro = (dMacro.rg * 2.0 - 1.0) * (0.18 * gLodMacro);

      // Realistic groomed corduroy and subtle alpine powder drift (Section 2.1)
      float terrainDetailFade = smoothstep(1.5, 6.0, gDistToCam) * (1.0 - smoothstep(40.0, 180.0, gDistToCam));
      vec2 pGroomed = vec2(0.0);
      if (terrainDetailFade > 0.001) {
        float corduroy = sin(vWorldPosition.x * 24.0) * 0.010;
        float drift1 = (noise2D(vWorldPosition.xz * 0.06) - 0.5) * 0.015;
        float drift2 = (noise2D(vWorldPosition.xz * 0.18 + vec2(1.2, 3.4)) - 0.5) * 0.008;
        pGroomed = vec2(corduroy + drift1, drift2) * terrainDetailFade;
      }

      vec2 totalPerturb = pMicro + pMeso + pMacro + pGroomed;
      gWorldNPerturbed = normalize(vWorldNormal + vec3(totalPerturb.x, 0.0, totalPerturb.y));
      normal = normalize((viewMatrix * vec4(gWorldNPerturbed, 0.0)).xyz);
      `
    );

    // 6. Lighting fragment end: Subsurface Scattering, Microfacet Glint, and Velvet Rim
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      /* glsl */ `
      #include <lights_fragment_end>

      if (gIsSnow > 0.5 && gRockMask > 0.05) {
        float directDiffuseSum = reflectedLight.directDiffuse.r + reflectedLight.directDiffuse.g + reflectedLight.directDiffuse.b;
        float shadowFactor = smoothstep(0.04, 0.18, directDiffuseSum);

        vec3 camToFrag = normalize(vWorldPosition - uCameraPos);
        vec3 viewDirWorld = -camToFrag;

        // 1. Translucent Subsurface Scattering (SSS)
        float worldNdotL = dot(gWorldNPerturbed, uSunDir);
        float diffuseWrap = clamp((worldNdotL + 0.45) / 1.45, 0.0, 1.0);
        float forwardScatter = pow(clamp(dot(viewDirWorld, -uSunDir), 0.0, 1.0), 3.2) * 0.36;

        vec3 daySss = vec3(1.0, 0.92, 0.82);
        vec3 goldenSss = vec3(1.0, 0.80, 0.65);
        vec3 nightSss = vec3(0.72, 0.80, 0.98);
        vec3 sssTint = mix(mix(daySss, goldenSss, uGoldenFactor), nightSss, uNightFactor);
        vec3 sssRadiance = (diffuseWrap * 0.18 + forwardScatter * 0.32) * sssTint * uSunColor * shadowFactor * gRockMask;
        reflectedLight.directDiffuse += sssRadiance;

        // 2. Soft Powdery Velvet Sheen / Grazing Rim (Forward & Backscatter)
        float NdotV = clamp(dot(gWorldNPerturbed, viewDirWorld), 0.0, 1.0);
        float rimSheen = pow(1.0 - NdotV, 2.5) * 0.28;
        vec3 rimColor = mix(uShadowColor * 1.12, uSunColor * 1.08, shadowFactor);
        reflectedLight.indirectDiffuse += rimSheen * rimColor * gRockMask;

        // 3. Microfacet Sparkle / Glint System (Section 3.2)
        // Stochastic diamond pinpoints of light without grid alignment
        if (shadowFactor > 0.001) {
          vec3 halfVec = normalize(uSunDir + viewDirWorld);
          vec3 forwardScatterDir = normalize(-viewDirWorld + uSunDir);

          // Octave 1: Dense micro-glitter (~3.5cm crystal cells, stochastically jittered)
          vec3 p1 = vWorldPosition * 24.0;
          vec3 cell1 = floor(p1);
          vec3 rnd1 = hash33(cell1);
          vec2 jitter1 = (rnd1.yz - 0.5) * 0.65;
          vec2 fract1 = fract(p1.xz) - vec2(0.5) - jitter1;
          float point1 = 1.0 - smoothstep(0.0, 0.32, length(fract1));
          vec3 nMicro1 = normalize(gWorldNPerturbed + (rnd1 - 0.5) * 2.8);
          float spec1 = max(
            pow(max(0.0, dot(nMicro1, halfVec)), 65.0),
            pow(max(0.0, dot(nMicro1, forwardScatterDir)), 45.0) * 0.70
          );
          float glint1 = spec1 * point1 * step(0.82, rnd1.x) * 26.0;

          // Octave 2: Bright diamond pinpoints (~10cm crystal clusters, stochastically jittered)
          vec3 p2 = vWorldPosition * 10.0;
          vec3 cell2 = floor(p2);
          vec3 rnd2 = hash33(cell2);
          vec2 jitter2 = (rnd2.xz - 0.5) * 0.65;
          vec2 fract2 = fract(p2.xz) - vec2(0.5) - jitter2;
          float point2 = 1.0 - smoothstep(0.0, 0.30, length(fract2));
          vec3 nMicro2 = normalize(gWorldNPerturbed + (rnd2 - 0.5) * 2.2);
          float spec2 = max(
            pow(max(0.0, dot(nMicro2, halfVec)), 50.0),
            pow(max(0.0, dot(nMicro2, forwardScatterDir)), 38.0) * 0.80
          );
          float glint2 = spec2 * point2 * step(0.88, rnd2.y) * 42.0;

          // Grazing Fresnel enhancement & distance fade
          float oneMinusNdotV = 1.0 - NdotV;
          float glintGrazing = 1.0 + 3.5 * (oneMinusNdotV * oneMinusNdotV * oneMinusNdotV);
          float glintFade = 1.0 - smoothstep(1.5, 60.0, gDistToCam);

          float totalSparkle = (glint1 + glint2) * glintGrazing * glintFade * shadowFactor * gRockMask;
          vec3 daySparkle = vec3(3.5, 3.3, 3.1);
          vec3 goldenSparkle = vec3(4.8, 3.9, 3.2);
          vec3 nightSparkle = vec3(4.2, 4.8, 5.6);
          vec3 sparkleColor = mix(mix(daySparkle, goldenSparkle, uGoldenFactor), nightSparkle, uNightFactor) * totalSparkle;

          reflectedLight.directSpecular += sparkleColor;
        }
      }
      `
    );
  };

  material.userData = {
    uniforms,
    update(
      time: number,
      sunDirection: THREE.Vector3,
      cameraPos: THREE.Vector3,
      playerPos?: THREE.Vector3,
      nightFactor: number = 0.0,
      sunColor?: THREE.Color,
      shadowColor?: THREE.Color,
      goldenFactor: number = 0.0
    ) {
      uniforms.uTime.value = time;
      uniforms.uSunDir.value.copy(sunDirection);
      uniforms.uCameraPos.value.copy(cameraPos);
      if (playerPos) uniforms.uPlayerPos.value.copy(playerPos);
      uniforms.uNightFactor.value = nightFactor;
      uniforms.uGoldenFactor.value = goldenFactor;
      if (sunColor) uniforms.uSunColor.value.copy(sunColor);
      if (shadowColor) uniforms.uShadowColor.value.copy(shadowColor);
    }
  };

  return material;
}
