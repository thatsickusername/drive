import * as THREE from 'three';

export interface SnowTrailMaterialOptions {
  sunDir?: THREE.Vector3;
  sunColor?: THREE.Color;
  shadowColor?: THREE.Color;
}

export function createSnowTrailMaterial(options: SnowTrailMaterialOptions = {}): THREE.MeshStandardMaterial {
  const sunDir = options.sunDir || new THREE.Vector3(-190, 130, -50).normalize();
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
    roughness: 0.82,
    metalness: 0.02,
    transparent: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -2.0,
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

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>

      // 1. Ski Rut Floor & Parallel Micro-Striations:
      // UV.x ranges from 0 (outer left feather) to 1 (outer right feather)
      // Left rut floor is UV.x in [0.18, 0.38]
      // Right rut floor is UV.x in [0.62, 0.82]
      float inLeftRut = smoothstep(0.16, 0.20, vTrailUV.x) * (1.0 - smoothstep(0.36, 0.40, vTrailUV.x));
      float inRightRut = smoothstep(0.60, 0.64, vTrailUV.x) * (1.0 - smoothstep(0.80, 0.84, vTrailUV.x));
      float inRutFloor = max(inLeftRut, inRightRut);

      // Local normalized coordinate across each ski rut (0.0 to 1.0)
      float tRutLeft = clamp((vTrailUV.x - 0.18) / 0.20, 0.0, 1.0);
      float tRutRight = clamp((vTrailUV.x - 0.62) / 0.20, 0.0, 1.0);
      float tRut = (vTrailUV.x < 0.5) ? tRutLeft : tRutRight;

      // 3 to 4 crisp parallel striation ridges inside each ski rut (matching reference image)
      float striationWaves = sin(tRut * 3.5 * 6.2831853);
      float ribLines = striationWaves * 0.5 + 0.5;
      float inRutBase = smoothstep(0.05, 0.16, tRut) * (1.0 - smoothstep(0.84, 0.95, tRut)) * inRutFloor;
      float striationPattern = (ribLines - 0.5) * 0.34 * inRutBase;

      // Rut cavity compression tone:
      // Compressed crystalline snow inside the ski groove is slightly cooler/periwinkle (#8fadcc),
      // while outer powdery berms are soft warm ivory (#fffbf7)
      vec3 dayPowder = vec3(0.996, 0.985, 0.975);
      vec3 dayCompressed = vec3(0.82, 0.88, 0.95);
      vec3 nightPowder = vec3(0.94, 0.965, 0.995);
      vec3 nightCompressed = vec3(0.72, 0.80, 0.92);

      vec3 baseSnow = mix(mix(dayPowder, dayCompressed, inRutFloor * 0.75),
                          mix(nightPowder, nightCompressed, inRutFloor * 0.75),
                          uNightFactor);

      // High-frequency granular snow powder texture matching mountain terrain
      float trailDistCam = length(vWorldPosition - uCameraPos);
      float trailNearFade = 1.0 - smoothstep(10.0, 75.0, trailDistCam);
      float trailGrainHash = fract(sin(dot(floor(vWorldPosition * 24.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      float trailPowderGrain = (trailGrainHash - 0.5) * 0.045 * trailNearFade;

      diffuseColor.rgb = diffuseColor.rgb * (baseSnow + vec3(striationPattern)) + vec3(trailPowderGrain);
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

      // 1. Cavity Ambient Occlusion in the deep trough of the ruts
      float inLeftRutCavity = smoothstep(0.18, 0.23, vTrailUV.x) * (1.0 - smoothstep(0.33, 0.38, vTrailUV.x));
      float inRightRutCavity = smoothstep(0.62, 0.67, vTrailUV.x) * (1.0 - smoothstep(0.77, 0.82, vTrailUV.x));
      float cavityMask = max(inLeftRutCavity, inRightRutCavity);

      // Cavity AO darkens ambient light at the base of the trench
      reflectedLight.indirectDiffuse *= (1.0 - cavityMask * 0.45);

      // 2. Micro-Striation Normal Shading on the Rut Floor
      float tRutL = clamp((vTrailUV.x - 0.18) / 0.20, 0.0, 1.0);
      float tRutR = clamp((vTrailUV.x - 0.62) / 0.20, 0.0, 1.0);
      float tRutCurrent = (vTrailUV.x < 0.5) ? tRutL : tRutR;
      float ribWaves = sin(tRutCurrent * 3.5 * 6.2831853);
      float inBaseMask = smoothstep(0.06, 0.18, tRutCurrent) * (1.0 - smoothstep(0.82, 0.94, tRutCurrent)) * cavityMask;

      reflectedLight.directDiffuse *= (1.0 + ribWaves * 0.36 * inBaseMask * shadowFactor);

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
