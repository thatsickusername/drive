import * as THREE from 'three';

export interface SnowMaterialOptions {
  sunDir?: THREE.Vector3;
  sunColor?: THREE.Color;
  shadowColor?: THREE.Color;
}

export function createSnowMaterial(options: SnowMaterialOptions = {}): THREE.MeshStandardMaterial {
  const sunDir = options.sunDir || new THREE.Vector3(140, 110, -130).normalize();
  const sunColor = options.sunColor || new THREE.Color(0xffefe2);
  const shadowColor = options.shadowColor || new THREE.Color(0x94a6cf);

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
    roughness: 0.88,
    metalness: 0.02,
    flatShading: false,
    side: THREE.FrontSide
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uSunDir = uniforms.uSunDir;
    shader.uniforms.uSunColor = uniforms.uSunColor;
    shader.uniforms.uShadowColor = uniforms.uShadowColor;
    shader.uniforms.uCameraPos = uniforms.uCameraPos;
    shader.uniforms.uNightFactor = uniforms.uNightFactor;

    // 1. Vertex Shader: export world position & world normal
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

    // 2. Fragment Shader: Add uniforms, 3D hash, powdery SSS, velvet rim, and snow shimmer
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

      // 3D Hash for stable world-space cellular sparkles
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      `
    );

    // Powdery granular micro-grain texture & windswept sastrugi drifts (Distance LOD optimized)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      float isSnow = step(0.52, diffuseColor.r);

      // Distance LOD evaluation for snow micro-structure optimization
      float distToCam = length(vWorldPosition - uCameraPos);
      float nearFade = smoothstep(75.0, 10.0, distToCam);   // Fine crystalline powder grains (< 75m)
      float midFade = smoothstep(240.0, 25.0, distToCam);   // Soft windswept sastrugi drift contours (< 240m)

      // 1. Windswept snow sastrugi: broad, organic meandering snow dunes sculpted by alpine wind
      vec2 sastrugiP = vWorldPosition.xz;
      float warp = sin(sastrugiP.x * 0.05 + sastrugiP.y * 0.08) * 1.8;
      float sastrugiU = (sastrugiP.x * 0.16 + sastrugiP.y * 0.10) + warp * 0.25;
      float sastrugiV = (sastrugiP.y * 0.16 - sastrugiP.x * 0.10);
      float wave1 = sin(sastrugiU + sin(sastrugiV * 0.6) * 0.9) * 0.55;
      float wave2 = sin(sastrugiU * 2.1 + sastrugiV * 0.4) * 0.28;
      float wave3 = sin(sastrugiU * 4.2 - sastrugiV * 0.8) * 0.12;
      float sastrugiPattern = (wave1 + wave2 + wave3) * midFade;

      // 2. High-frequency granular snow powder texture (crystalline powder grains)
      float grainHash = fract(sin(dot(floor(vWorldPosition * 24.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      float powderGrain = (grainHash - 0.5) * 0.045 * nearFade;

      // Day vs Night Snow Albedo:
      // Day: Soft warm ivory/cream
      // Night: Serene soft pastel silvery moonlit snow
      vec3 daySnow = vec3(0.996, 0.982, 0.970);
      vec3 nightSnow = vec3(0.94, 0.965, 0.995);
      vec3 pastelSnow = mix(daySnow, nightSnow, uNightFactor);
      diffuseColor.rgb = mix(diffuseColor.rgb, pastelSnow + vec3(powderGrain + sastrugiPattern * 0.035), isSnow * 0.70);
      `
    );

    // Shading enhancements: Directional sastrugi relief, granular powder contrast, velvet rim, SSS, and diamond shimmer
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      /* glsl */ `
      #include <lights_fragment_end>

      if (isSnow > 0.5) {
        // Direct sun/moon illumination / shadow factor
        float shadowFactor = clamp((reflectedLight.directDiffuse.r + reflectedLight.directDiffuse.g + reflectedLight.directDiffuse.b) * 1.6, 0.0, 1.0);

        // Directional sastrugi surface gradient:
        // Slope derivative along drift axis: positive = windward facing sun, negative = leeward shadow
        float dU = (cos(sastrugiU + sin(sastrugiV * 0.6) * 0.9) * 0.55 + cos(sastrugiU * 2.1 + sastrugiV * 0.4) * 0.58) * midFade;
        float sunAlign = dot(normalize(vec2(0.16, 0.10)), normalize(uSunDir.xz));
        float sastrugiShade = clamp(dU * sunAlign * 1.4, -0.65, 0.65);

        // Windswept sastrugi lighting modulation:
        // Soft pastel modulation without harsh dark contrast
        float sastrugiWeight = mix(0.42, 0.24, uNightFactor);
        float leewardWeight = mix(0.32, 0.18, uNightFactor);
        if (sastrugiShade > 0.0) {
          reflectedLight.directDiffuse += sastrugiShade * sastrugiWeight * uSunColor * shadowFactor;
        } else {
          reflectedLight.indirectDiffuse += (-sastrugiShade) * leewardWeight * uShadowColor;
        }

        // Granular powder micro-contrast: fine crystalline relief up close (< 75m)
        reflectedLight.directDiffuse += powderGrain * 4.8 * reflectedLight.directDiffuse * shadowFactor;

        // 1. Soft Powdery Velvet Sheen / Grazing Rim (Forward & Backscatter)
        float NdotV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
        float rimSheen = pow(1.0 - NdotV, 2.6);
        vec3 rimColor = mix(uShadowColor * 1.15, uSunColor * 1.08, shadowFactor);
        reflectedLight.indirectDiffuse += rimSheen * rimColor * 0.32;

        // 2. Subsurface Scattering Terminator:
        // Day: Soft pastel peach-cream
        // Night: Soft pastel lavender-blue glow
        float worldNdotL = dot(vWorldNormal, uSunDir);
        float sss = smoothstep(-0.30, 0.10, worldNdotL) * smoothstep(0.42, 0.10, worldNdotL);
        vec3 daySss = vec3(0.98, 0.82, 0.75);
        vec3 nightSss = vec3(0.70, 0.78, 0.95);
        vec3 sssColor = mix(daySss, nightSss, uNightFactor);
        reflectedLight.directDiffuse += sss * sssColor * mix(0.15, 0.09, uNightFactor) * shadowFactor;

        // 3. Snow Shimmer / Specular & Forward-Scatter Diamond Glints
        vec3 camToFrag = normalize(vWorldPosition - uCameraPos);
        vec3 viewDirWorld = -camToFrag;
        vec3 halfVecWorld = normalize(viewDirWorld + uSunDir);
        vec3 forwardScatterDir = normalize(-viewDirWorld + uSunDir);

        // Distance attenuation for sparkles
        float distFade = smoothstep(180.0, 5.0, distToCam);

        // Octave 1: Dense micro-glitter with pinpoint radial falloff inside crystal cell
        vec3 p1 = vWorldPosition * 24.0;
        vec3 cell1 = floor(p1);
        vec3 fract1 = fract(p1) - vec3(0.5);
        vec3 rnd1 = hash33(cell1);
        vec3 facetNorm1 = normalize(vWorldNormal + (rnd1 - 0.5) * 3.8);
        float spec1 = max(
          pow(max(0.0, dot(facetNorm1, halfVecWorld)), 90.0),
          pow(max(0.0, dot(facetNorm1, forwardScatterDir)), 60.0) * 0.75
        );
        float point1 = smoothstep(0.40, 0.0, length(fract1));
        float sparkle1 = spec1 * point1 * step(0.68, rnd1.x) * 12.0;

        // Octave 2: Bright diamond glints with sharp crystalline highlight
        vec3 p2 = vWorldPosition * 8.5;
        vec3 cell2 = floor(p2);
        vec3 fract2 = fract(p2) - vec3(0.5);
        vec3 rnd2 = hash33(cell2);
        vec3 facetNorm2 = normalize(vWorldNormal + (rnd2 - 0.5) * 2.8);
        float spec2 = max(
          pow(max(0.0, dot(facetNorm2, halfVecWorld)), 60.0),
          pow(max(0.0, dot(facetNorm2, forwardScatterDir)), 45.0) * 0.85
        );
        float point2 = smoothstep(0.36, 0.0, length(fract2));
        float sparkle2 = spec2 * point2 * step(0.75, rnd2.y) * 24.0;

        // Octave 3: Ultra-fine surface crystalline dust
        vec3 p3 = vWorldPosition * 55.0;
        vec3 cell3 = floor(p3);
        vec3 fract3 = fract(p3) - vec3(0.5);
        vec3 rnd3 = hash33(cell3);
        vec3 facetNorm3 = normalize(vWorldNormal + (rnd3 - 0.5) * 4.2);
        float spec3 = pow(max(0.0, dot(facetNorm3, halfVecWorld)), 130.0);
        float point3 = smoothstep(0.44, 0.0, length(fract3));
        float sparkle3 = spec3 * point3 * step(0.64, rnd3.z) * 8.0;

        float totalSparkle = (sparkle1 + sparkle2 + sparkle3) * shadowFactor * distFade;
        // Day warm crystalline sparkle vs Night silvery moonlight diamond glints
        vec3 daySparkle = vec3(3.6, 3.4, 3.2);
        vec3 nightSparkle = vec3(4.5, 5.0, 5.8);
        vec3 sparkleColor = mix(daySparkle, nightSparkle, uNightFactor) * totalSparkle;

        reflectedLight.directSpecular += sparkleColor;
      }
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

  return material;
}
