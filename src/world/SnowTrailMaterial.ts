import * as THREE from 'three';

export interface SnowTrailMaterialOptions {
  sunDir?: THREE.Vector3;
  sunColor?: THREE.Color;
  shadowColor?: THREE.Color;
}

export function createSnowTrailMaterial(options: SnowTrailMaterialOptions = {}): THREE.MeshStandardMaterial {
  const sunDir = options.sunDir || new THREE.Vector3(140, 110, -50).normalize();
  const sunColor = options.sunColor || new THREE.Color(0xfff6ec);
  const shadowColor = options.shadowColor || new THREE.Color(0x9ca9cb);

  const uniforms = {
    uTime: { value: 0.0 },
    uSunDir: { value: sunDir.clone() },
    uSunColor: { value: sunColor.clone() },
    uShadowColor: { value: shadowColor.clone() },
    uCameraPos: { value: new THREE.Vector3() },
    uNightFactor: { value: 0.0 }
  };

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.80,
    metalness: 0.02,
    transparent: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -3.0,
    polygonOffsetUnits: -6.0,
    side: THREE.DoubleSide
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSunDir = uniforms.uSunDir;
    shader.uniforms.uSunColor = uniforms.uSunColor;
    shader.uniforms.uShadowColor = uniforms.uShadowColor;
    shader.uniforms.uCameraPos = uniforms.uCameraPos;
    shader.uniforms.uNightFactor = uniforms.uNightFactor;

    // 1. Vertex Shader: export world position, normal, UVs, and alpha
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      attribute float aAlpha;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vTrailUV;
      varying float vTrailAlpha;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      /* glsl */ `
      #include <uv_vertex>
      vTrailUV = uv;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      vTrailAlpha = aAlpha;
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

    // 2. Fragment Shader: Add striations, rut cavity AO, snow rim & crystalline glints
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      /* glsl */ `
      #include <common>
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uShadowColor;
      uniform vec3 uCameraPos;
      uniform float uNightFactor;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec2 vTrailUV;
      varying float vTrailAlpha;

      // Hash for fine snow crystalline micro-sparkle
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      `
    );

    // 2. Fragment Shader: Normal perturbation for razor-sharp physical micro-striations
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      /* glsl */ `
      #include <normal_fragment_begin>

      // Exact true world-space lateral vector pointing from left edge to right edge of track
      vec3 dPdx = dFdx(vWorldPosition);
      vec3 dPdy = dFdy(vWorldPosition);
      float du_dx = dFdx(vTrailUV.x);
      float du_dy = dFdy(vTrailUV.x);
      vec3 crossTrack = normalize(dPdx * du_dx + dPdy * du_dy);
      if (length(crossTrack) < 0.01) crossTrack = vec3(1.0, 0.0, 0.0);

      // Micro-striation normal perturbation inside each ski rut (soft, fine grooming)
      float tRutL_n = clamp((vTrailUV.x - 0.16) / 0.22, 0.0, 1.0);
      float tRutR_n = clamp((vTrailUV.x - 0.62) / 0.22, 0.0, 1.0);
      float tRut_n = (vTrailUV.x < 0.5) ? tRutL_n : tRutR_n;
      float inRutBase_n = smoothstep(0.04, 0.14, tRut_n) * (1.0 - smoothstep(0.86, 0.96, tRut_n));
      float inLeftRut_n = smoothstep(0.14, 0.18, vTrailUV.x) * (1.0 - smoothstep(0.36, 0.40, vTrailUV.x));
      float inRightRut_n = smoothstep(0.60, 0.64, vTrailUV.x) * (1.0 - smoothstep(0.82, 0.86, vTrailUV.x));
      float inRutFloor_n = max(inLeftRut_n, inRightRut_n) * inRutBase_n;

      // Gentle, smooth surface without harsh dark grooved lines
      float striationSlope = 0.0;

      // Perturb normal laterally along exact cross-track axis
      vec3 trailPerturbedN = normalize(vWorldNormal + crossTrack * striationSlope);
      normal = normalize((viewMatrix * vec4(trailPerturbedN, 0.0)).xyz);
      `
    );

    // 3. Fragment Shader: Color fragment for rut cavity AO, compression tone, and powder grain
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>

      // 1. Ski Rut Floor:
      float inLeftRut = smoothstep(0.14, 0.20, vTrailUV.x) * (1.0 - smoothstep(0.34, 0.40, vTrailUV.x));
      float inRightRut = smoothstep(0.60, 0.66, vTrailUV.x) * (1.0 - smoothstep(0.80, 0.86, vTrailUV.x));
      float inRutFloor = max(inLeftRut, inRightRut);

      // Clean, light alpine snow without dark artificial grooves
      float striationPattern = 0.0;

      // Luminous pristine white powder snow throughout the carved trail
      vec3 dayPowder = vec3(0.99, 0.992, 1.0);
      vec3 nightPowder = vec3(0.94, 0.965, 0.995);
      vec3 baseSnow = mix(dayPowder, nightPowder, uNightFactor);

      // High-frequency granular snow powder texture matching mountain terrain
      float trailDistCam = length(vWorldPosition - uCameraPos);
      float trailNearFade = 1.0 - smoothstep(10.0, 75.0, trailDistCam);
      float trailGrainHash = fract(sin(dot(floor(vWorldPosition * 24.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      float trailPowderGrain = (trailGrainHash - 0.5) * 0.035 * trailNearFade;

      // Perfectly light, clean snow without cavity darkening
      float cavityDarkening = 1.0;
      // Soft rounded berm crest brightness
      float inBerm = smoothstep(0.06, 0.12, vTrailUV.x) * (1.0 - smoothstep(0.12, 0.18, vTrailUV.x))
                   + smoothstep(0.82, 0.88, vTrailUV.x) * (1.0 - smoothstep(0.88, 0.94, vTrailUV.x));
      vec3 bermColorBoost = vec3(0.03) * inBerm;

      diffuseColor.rgb = (diffuseColor.rgb * (baseSnow + vec3(striationPattern)) + vec3(trailPowderGrain) + bermColorBoost) * cavityDarkening;
      `
    );

    // Dynamic lighting enhancements: cavity shadow, velvet rim, and crystalline sparkles
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      /* glsl */ `
      #include <lights_fragment_end>

      float directSum = reflectedLight.directDiffuse.r + reflectedLight.directDiffuse.g + reflectedLight.directDiffuse.b;
      float shadowFactor = smoothstep(0.04, 0.18, directSum);

      // Granular powder micro-contrast
      float lightDistCam = length(vWorldPosition - uCameraPos);
      float lightNearFade = 1.0 - smoothstep(10.0, 75.0, lightDistCam);
      float lightGrainHash = fract(sin(dot(floor(vWorldPosition * 24.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      float lightPowderGrain = (lightGrainHash - 0.5) * 0.045 * lightNearFade;
      reflectedLight.directDiffuse += lightPowderGrain * 3.8 * reflectedLight.directDiffuse * shadowFactor;

      // 1. Gentle Cavity Ambient Occlusion
      float inLeftRutCavity = smoothstep(0.15, 0.22, vTrailUV.x) * (1.0 - smoothstep(0.32, 0.39, vTrailUV.x));
      float inRightRutCavity = smoothstep(0.61, 0.68, vTrailUV.x) * (1.0 - smoothstep(0.78, 0.85, vTrailUV.x));
      float cavityMask = max(inLeftRutCavity, inRightRutCavity);

      // Subtle, gentle 8% ambient soft dip (no dark stripes)
      reflectedLight.indirectDiffuse *= (1.0 - cavityMask * 0.08);

      // 2. Directional contact shadow cast along the raised berm shoulders:
      vec3 dPdx_l = dFdx(vWorldPosition);
      vec3 dPdy_l = dFdy(vWorldPosition);
      float du_dx_l = dFdx(vTrailUV.x);
      float du_dy_l = dFdy(vTrailUV.x);
      vec3 crossTrack_l = normalize(dPdx_l * du_dx_l + dPdy_l * du_dy_l);
      if (length(crossTrack_l) < 0.01) crossTrack_l = vec3(1.0, 0.0, 0.0);
      float sunLateral = dot(uSunDir, crossTrack_l);

      // Soft, diffuse contact shadow across the sun-opposing shoulder and rut bowl:
      float rightSoftShadow = smoothstep(0.68, 0.82, vTrailUV.x) * (1.0 - smoothstep(0.88, 0.94, vTrailUV.x));
      float innerLeftSoftShadow = smoothstep(0.30, 0.38, vTrailUV.x) * (1.0 - smoothstep(0.44, 0.50, vTrailUV.x));

      float leftSoftShadow = smoothstep(0.06, 0.12, vTrailUV.x) * (1.0 - smoothstep(0.18, 0.32, vTrailUV.x));
      float innerRightSoftShadow = smoothstep(0.50, 0.56, vTrailUV.x) * (1.0 - smoothstep(0.62, 0.70, vTrailUV.x));

      float wallShadow = (sunLateral >= 0.0)
        ? max(rightSoftShadow, innerLeftSoftShadow)
        : max(leftSoftShadow, innerRightSoftShadow);

      float shadowWeight = clamp(abs(sunLateral) * 1.5, 0.3, 0.85);
      float trenchOcclusion = wallShadow * shadowWeight * 0.25; // Gentle 25% max softening

      // Softly attenuate direct diffuse lighting without dark lines:
      reflectedLight.directDiffuse *= (1.0 - trenchOcclusion);

      // Soft sunlit rounded shoulder & crest sheen:
      float litCrest = (sunLateral >= 0.0)
        ? (smoothstep(0.86, 0.91, vTrailUV.x) * (1.0 - smoothstep(0.95, 0.99, vTrailUV.x)))
        : (smoothstep(0.01, 0.05, vTrailUV.x) * (1.0 - smoothstep(0.09, 0.14, vTrailUV.x)));
      float litShoulder = (sunLateral >= 0.0)
        ? (smoothstep(0.10, 0.18, vTrailUV.x) * (1.0 - smoothstep(0.26, 0.34, vTrailUV.x)))
        : (smoothstep(0.66, 0.74, vTrailUV.x) * (1.0 - smoothstep(0.82, 0.90, vTrailUV.x)));
      reflectedLight.directDiffuse += uSunColor * ((litShoulder * 0.18 + litCrest * 0.14) * shadowFactor);

      // Gentle alpine sky-blue ambient in shaded curvature:
      reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse,
                                           reflectedLight.indirectDiffuse * uShadowColor * 1.15,
                                           wallShadow * 0.25);

      // 3. Velvet Grazing Rim on Raised Berms (Forward & Backscatter)
      float NdotV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
      float rimSheen = pow(1.0 - NdotV, 2.8);
      vec3 rimColor = mix(uShadowColor * 1.15, uSunColor * 1.08, shadowFactor);
      reflectedLight.indirectDiffuse += rimSheen * rimColor * 0.28;

      // 4. Subsurface Scattering Terminator
      float worldNdotL = dot(vWorldNormal, uSunDir);
      float sss = smoothstep(-0.25, 0.12, worldNdotL) * (1.0 - smoothstep(0.12, 0.40, worldNdotL));
      vec3 daySss = vec3(0.98, 0.84, 0.76);
      vec3 nightSss = vec3(0.72, 0.80, 0.95);
      vec3 sssColor = mix(daySss, nightSss, uNightFactor);
      reflectedLight.directDiffuse += sss * sssColor * 0.12 * shadowFactor;

      // 5. Crystalline diamond sparkles on the raised berm crests
      if (shadowFactor > 0.01 && lightDistCam < 35.0) {
        float d = clamp((lightDistCam - 4.0) / 26.0, 0.0, 1.0);
        float distFade = (1.0 - d) * (1.0 - d);
        vec3 p = vWorldPosition * 22.0;
        vec3 cell = floor(p);
        vec3 rnd = hash33(cell);
        vec3 camToFrag = normalize(vWorldPosition - uCameraPos);
        vec3 viewDirWorld = -camToFrag;
        vec3 halfVecWorld = normalize(viewDirWorld + uSunDir);
        vec3 facetNorm = normalize(vWorldNormal + (rnd - 0.5) * 3.5);
        float spec = pow(max(0.0, dot(facetNorm, halfVecWorld)), 80.0);
        float sparkle = spec * step(0.72, rnd.x) * 10.0 * distFade;
        reflectedLight.directSpecular += uSunColor * sparkle;
      }
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      /* glsl */ `
      #include <dithering_fragment>
      gl_FragColor.a *= vTrailAlpha;
      if (gl_FragColor.a < 0.01) discard;
      `
    );
  };

  material.userData = {
    uniforms,
    update(time: number, sunDirection: THREE.Vector3, cameraPos: THREE.Vector3, nightFactor: number = 0.0, sunColor?: THREE.Color, shadowColor?: THREE.Color) {
      uniforms.uTime.value = time;
      uniforms.uSunDir.value.copy(sunDirection);
      uniforms.uCameraPos.value.copy(cameraPos);
      uniforms.uNightFactor.value = nightFactor;
      if (sunColor) uniforms.uSunColor.value.copy(sunColor);
      if (shadowColor) uniforms.uShadowColor.value.copy(shadowColor);
    }
  };

  (material as any).customUniforms = uniforms;
  return material;
}
