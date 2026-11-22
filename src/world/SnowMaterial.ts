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
    uPlayerPos: { value: new THREE.Vector3() },
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
    shader.uniforms.uPlayerPos = uniforms.uPlayerPos;
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
      uniform vec3 uPlayerPos;
      uniform float uNightFactor;

      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;

      // 3D Hash for stable world-space cellular sparkles
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }

      // Smooth 2D noise for subtle, natural organic wind-drift contours
      float hash2D(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      vec2 hash2D2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453123);
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

      // Evaluates 2D cellular wind-drift snow pillow height and horizontal gradient vector
      // Returns vec3(height [0..1], gradX, gradZ)
      vec3 snowPillows(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float minDist = 1.0;
        vec2 bestDiff = vec2(0.0);
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 pt = hash2D2(i + neighbor);
            pt = 0.5 + 0.40 * sin(pt * 6.2831853);
            vec2 diff = neighbor + pt - f;
            float dist = length(diff);
            if (dist < minDist) {
              minDist = dist;
              bestDiff = diff;
            }
          }
        }
        float h = cos(clamp(minDist * 1.5707963, 0.0, 1.5707963));
        vec2 grad = (minDist > 0.001) ? normalize(bestDiff) * sin(clamp(minDist * 1.5707963, 0.0, 1.5707963)) : vec2(0.0);
        return vec3(h, grad);
      }
      `
    );

    // Powdery granular micro-grain texture & organic wind-drift contours (Distance LOD optimized)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      float isSnow = step(0.52, diffuseColor.r);

      // Distance LOD evaluation for snow micro-structure optimization
      float distToCam = length(vWorldPosition - uCameraPos);
      float nearFade = 1.0 - smoothstep(10.0, 75.0, distToCam);   // Fine crystalline powder grains (< 75m)
      
      // Sculpted snow sastrugi: subtle in immediate foreground (<4m), prominent on midground slopes (10m-180m)
      float sastrugiFade = smoothstep(3.5, 12.0, distToCam) * (1.0 - smoothstep(40.0, 240.0, distToCam));

      // 1. Topologically-guided wind-drift field
      vec3 wNorm = normalize(vWorldNormal);
      vec2 slopeVec = wNorm.xz;
      float slopeSteep = clamp(1.0 - wNorm.y, 0.0, 1.0);
      vec2 slopeDir = (slopeSteep > 0.001) ? normalize(slopeVec) : vec2(0.0);

      // Prevailing wind
      vec2 prevWind = normalize(vec2(0.707, -0.707));

      // Contour tangent along mountain face (deflects wind along slope)
      vec2 contourTangent = vec2(-slopeDir.y, slopeDir.x);
      if (dot(contourTangent, prevWind) < 0.0) contourTangent = -contourTangent;

      // Local wind smoothly combines prevailing wind with slope contour
      vec2 localWind = normalize(mix(prevWind, contourTangent, clamp(slopeSteep * 3.0, 0.0, 0.70)));
      vec2 crossWind = vec2(-localWind.y, localWind.x);

      // Altitude shear (rotates gently as elevation changes)
      float altAngle = (vWorldPosition.y - 70.0) * 0.0022;
      mat2 altRot = mat2(cos(altAngle), -sin(altAngle), sin(altAngle), cos(altAngle));
      vec2 finalCross = altRot * crossWind;
      vec2 finalWind = altRot * localWind;

      // 2. Continuous organic coordinate field
      vec2 macroWarp = vec2(
        noise2D(vWorldPosition.xz * 0.032),
        noise2D(vWorldPosition.xz * 0.032 + vec2(5.4, 2.7))
      ) * 3.2;

      vec2 warpedP = vWorldPosition.xz + macroWarp;
      float uFlow = dot(warpedP, finalCross);
      float vFlow = dot(warpedP, finalWind);

      // 3. Dynamic opacity & length masks: lines taper out and vary in opacity across the terrain
      float opac1 = mix(0.40, 1.0, smoothstep(0.20, 0.80, noise2D(vec2(uFlow * 0.16, vFlow * 0.065))));
      float opac2 = mix(0.35, 1.0, smoothstep(0.25, 0.75, noise2D(vec2(uFlow * 0.11 + 3.8, vFlow * 0.045 + 1.4))));

      // 4. Multi-scale curved sastrugi contours (curved organically by vFlow)
      float sastrugi1 = sin(uFlow * 1.35 + sin(vFlow * 0.30) * 1.6) * opac1;
      float sastrugi2 = sin(uFlow * 2.50 + sin(vFlow * 0.55) * 1.2) * opac2 * 0.55;
      float sastrugi3 = sin(uFlow * 0.50 + sin(vFlow * 0.15) * 1.4) * 0.45;

      float rawSastrugi = sastrugi1 * 0.55 + sastrugi2 * 0.25 + sastrugi3 * 0.20;

      // 5. Topological placement & exposure mask:
      float macroPatch = mix(0.55, 1.0, smoothstep(0.25, 0.75, noise2D(vWorldPosition.xz * 0.008 + vec2(2.1, 7.3))));
      float windward = dot(slopeDir, prevWind);
      float exposure = mix(0.70, 1.0, clamp(0.5 + 0.5 * windward, 0.0, 1.0));
      float topoStrength = macroPatch * exposure;

      float sastrugiVal = rawSastrugi * topoStrength * sastrugiFade;

      // Subtle albedo tint: soft cool shadow in troughs, warm ivory on crests (max ±3.2%)
      vec3 troughColor = uShadowColor * (-0.038);
      vec3 crestColor = vec3(0.032);
      vec3 sastrugiAlbedo = mix(troughColor, crestColor, clamp(sastrugiVal * 1.5 + 0.5, 0.0, 1.0));

      // 2. High-frequency granular snow powder texture (crystalline powder grains)
      float grainHash = fract(sin(dot(floor(vWorldPosition * 24.0), vec3(12.9898, 78.233, 45.164))) * 43758.5453);
      float powderGrain = (grainHash - 0.5) * 0.045 * nearFade;

      // Day vs Night Snow Albedo:
      // Day: Soft warm ivory/cream
      // Night: Serene soft pastel silvery moonlit snow
      vec3 daySnow = vec3(0.996, 0.982, 0.970);
      vec3 nightSnow = vec3(0.94, 0.965, 0.995);
      vec3 pastelSnow = mix(daySnow, nightSnow, uNightFactor);
      diffuseColor.rgb = mix(diffuseColor.rgb, pastelSnow + vec3(powderGrain) + sastrugiAlbedo, isSnow * 0.75);
      `
    );

    // Shading enhancements: Pronounced organic wind-drift, granular powder contrast, velvet rim, SSS, and diamond shimmer
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      /* glsl */ `
      #include <lights_fragment_end>

      if (isSnow > 0.5) {
        // Direct sun/moon illumination / shadow factor
        // Softly clamps to 0 inside cast shadows (trees) while keeping full retroreflection on open slopes
        float directDiffuseSum = reflectedLight.directDiffuse.r + reflectedLight.directDiffuse.g + reflectedLight.directDiffuse.b;
        float shadowFactor = smoothstep(0.06, 0.20, directDiffuseSum);

        // Sculptural 3D wind-drift lighting: gentle, varied sculptural sastrugi relief
        float lightMod = sastrugiVal * mix(0.40, 0.30, uNightFactor);
        reflectedLight.directDiffuse *= (1.0 + lightMod * 0.85);
        if (lightMod < 0.0) {
          reflectedLight.indirectDiffuse += (-lightMod) * 0.40 * uShadowColor;
        }

        // Granular powder micro-contrast: fine crystalline relief up close (< 75m)
        reflectedLight.directDiffuse += powderGrain * 4.2 * reflectedLight.directDiffuse * shadowFactor;

        // 1. Soft Powdery Velvet Sheen / Grazing Rim (Forward & Backscatter)
        float NdotV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
        float rimSheen = pow(1.0 - NdotV, 2.6);
        vec3 rimColor = mix(uShadowColor * 1.15, uSunColor * 1.08, shadowFactor);
        reflectedLight.indirectDiffuse += rimSheen * rimColor * 0.32;

        // 2. Subsurface Scattering Terminator:
        // Day: Soft pastel peach-cream
        // Night: Soft pastel lavender-blue glow
        float worldNdotL = dot(vWorldNormal, uSunDir);
        float sss = smoothstep(-0.30, 0.10, worldNdotL) * (1.0 - smoothstep(0.10, 0.42, worldNdotL));
        vec3 daySss = vec3(0.98, 0.82, 0.75);
        vec3 nightSss = vec3(0.70, 0.78, 0.95);
        vec3 sssColor = mix(daySss, nightSss, uNightFactor);
        reflectedLight.directDiffuse += sss * sssColor * mix(0.15, 0.09, uNightFactor) * shadowFactor;

        // 3. Snow Shimmer / Specular & Forward-Scatter Diamond Glints
        // Active under direct celestial light and gently decaying over distance into a soft velvety finish
        if (shadowFactor > 0.001) {
          vec3 camToFrag = normalize(vWorldPosition - uCameraPos);
          vec3 viewDirWorld = -camToFrag;
          vec3 halfVecWorld = normalize(viewDirWorld + uSunDir);
          vec3 forwardScatterDir = normalize(-viewDirWorld + uSunDir);

          // Smooth gradual distance attenuation (quadratic ease-out, zero hard cutoff)
          // 8m (near player): 100% -> 20m: ~30% -> 28m: ~8% -> 35m (~20m ahead of player): strictly 0%
          float d = clamp((distToCam - 8.0) / 27.0, 0.0, 1.0);
          float distFade = (1.0 - d) * (1.0 - d);

          // Big diamond glints fade slightly faster to keep midground clean
          float dBig = clamp((distToCam - 8.0) / 16.0, 0.0, 1.0);
          float bigDotFade = (1.0 - dBig) * (1.0 - dBig);

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
          float point1 = 1.0 - smoothstep(0.0, 0.40, length(fract1));
          float sparkle1 = spec1 * point1 * step(0.68, rnd1.x) * 12.0 * distFade;

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
          float point2 = 1.0 - smoothstep(0.0, 0.36, length(fract2));
          float sparkle2 = spec2 * point2 * step(0.75, rnd2.y) * 24.0 * bigDotFade;

          // Octave 3: Ultra-fine surface crystalline dust
          vec3 p3 = vWorldPosition * 55.0;
          vec3 cell3 = floor(p3);
          vec3 fract3 = fract(p3) - vec3(0.5);
          vec3 rnd3 = hash33(cell3);
          vec3 facetNorm3 = normalize(vWorldNormal + (rnd3 - 0.5) * 4.2);
          float spec3 = pow(max(0.0, dot(facetNorm3, halfVecWorld)), 130.0);
          float point3 = 1.0 - smoothstep(0.0, 0.44, length(fract3));
          float sparkle3 = spec3 * point3 * step(0.64, rnd3.z) * 8.0 * distFade;

          float totalSparkle = (sparkle1 + sparkle2 + sparkle3) * shadowFactor;
          // Day warm crystalline sparkle vs Night silvery moonlight diamond glints
          vec3 daySparkle = vec3(3.6, 3.4, 3.2);
          vec3 nightSparkle = vec3(4.5, 5.0, 5.8);
          vec3 sparkleColor = mix(daySparkle, nightSparkle, uNightFactor) * totalSparkle;

          reflectedLight.directSpecular += sparkleColor;
        }
      }
      `
    );
  };

  material.userData = {
    uniforms,
    update(time: number, sunDirection: THREE.Vector3, cameraPos: THREE.Vector3, playerPos?: THREE.Vector3, nightFactor: number = 0.0, sunColor?: THREE.Color, shadowColor?: THREE.Color) {
      uniforms.uTime.value = time;
      uniforms.uSunDir.value.copy(sunDirection);
      uniforms.uCameraPos.value.copy(cameraPos);
      if (playerPos) uniforms.uPlayerPos.value.copy(playerPos);
      uniforms.uNightFactor.value = nightFactor;
      if (sunColor) uniforms.uSunColor.value.copy(sunColor);
      if (shadowColor) uniforms.uShadowColor.value.copy(shadowColor);
    }
  };

  return material;
}
