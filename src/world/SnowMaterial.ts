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
    uCameraPos: { value: new THREE.Vector3() }
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

    // Powdery micro-grain texture & gentle wind dunes in color_fragment
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      /* glsl */ `
      #include <color_fragment>
      float isSnow = step(0.52, diffuseColor.r);
      float microGrain = (sin(vWorldPosition.x * 28.0 + sin(vWorldPosition.z * 18.0)) * 0.5 + 0.5) * 0.024;
      float windRipple = sin(vWorldPosition.x * 0.35 + vWorldPosition.z * 0.18 + vWorldPosition.y * 0.4) * 0.018;
      vec3 warmSnow = vec3(0.99, 0.965, 0.94);
      diffuseColor.rgb = mix(diffuseColor.rgb, warmSnow + vec3(microGrain + windRipple), isSnow * 0.70);
      `
    );

    // Shading enhancements: Subsurface scattering, velvet rim, and multi-octave crystalline snow sparkles
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <lights_fragment_end>',
      /* glsl */ `
      #include <lights_fragment_end>

      if (isSnow > 0.5) {
        // Direct sun illumination / shadow factor
        float shadowFactor = clamp((reflectedLight.directDiffuse.r + reflectedLight.directDiffuse.g + reflectedLight.directDiffuse.b) * 1.6, 0.0, 1.0);

        // 1. Soft Powdery Velvet Sheen / Grazing Rim (Forward & Backscatter)
        float NdotV = clamp(dot(geometryNormal, geometryViewDir), 0.0, 1.0);
        float rimSheen = pow(1.0 - NdotV, 3.0);
        vec3 rimColor = mix(uShadowColor * 1.15, uSunColor * 1.05, shadowFactor);
        reflectedLight.indirectDiffuse += rimSheen * rimColor * 0.28;

        // 2. Subsurface Scattering Terminator (Warm rose-peach bleed along shadow boundary)
        float worldNdotL = dot(vWorldNormal, uSunDir);
        float sss = smoothstep(-0.35, 0.08, worldNdotL) * smoothstep(0.45, 0.08, worldNdotL);
        vec3 sssColor = vec3(0.98, 0.54, 0.40);
        reflectedLight.directDiffuse += sss * sssColor * 0.28 * shadowFactor;

        // 3. Snow Shimmer / Specular Micro-Facet Glitter
        vec3 camToFrag = normalize(vWorldPosition - uCameraPos);
        vec3 viewDirWorld = -camToFrag;
        vec3 halfVecWorld = normalize(viewDirWorld + uSunDir);

        // Distance attenuation
        float distToCam = length(vWorldPosition - uCameraPos);
        float distFade = smoothstep(220.0, 8.0, distToCam);

        // Octave 1: Dense micro-glitter with pinpoint radial falloff inside crystal cell
        vec3 p1 = vWorldPosition * 26.0;
        vec3 cell1 = floor(p1);
        vec3 fract1 = fract(p1) - vec3(0.5);
        vec3 rnd1 = hash33(cell1);
        vec3 facetNorm1 = normalize(vWorldNormal + (rnd1 - 0.5) * 3.8);
        float spec1 = pow(max(0.0, dot(facetNorm1, halfVecWorld)), 130.0);
        float point1 = smoothstep(0.40, 0.0, length(fract1));
        float sparkle1 = spec1 * point1 * step(0.72, rnd1.x) * 8.5;

        // Octave 2: Bright diamond glints with sharp crystalline highlight
        vec3 p2 = vWorldPosition * 9.5;
        vec3 cell2 = floor(p2);
        vec3 fract2 = fract(p2) - vec3(0.5);
        vec3 rnd2 = hash33(cell2);
        vec3 facetNorm2 = normalize(vWorldNormal + (rnd2 - 0.5) * 2.8);
        float spec2 = pow(max(0.0, dot(facetNorm2, halfVecWorld)), 75.0);
        float point2 = smoothstep(0.36, 0.0, length(fract2));
        float sparkle2 = spec2 * point2 * step(0.80, rnd2.y) * 18.0;

        // Octave 3: Ultra-fine surface crystalline dust
        vec3 p3 = vWorldPosition * 60.0;
        vec3 cell3 = floor(p3);
        vec3 fract3 = fract(p3) - vec3(0.5);
        vec3 rnd3 = hash33(cell3);
        vec3 facetNorm3 = normalize(vWorldNormal + (rnd3 - 0.5) * 4.2);
        float spec3 = pow(max(0.0, dot(facetNorm3, halfVecWorld)), 160.0);
        float point3 = smoothstep(0.44, 0.0, length(fract3));
        float sparkle3 = spec3 * point3 * step(0.68, rnd3.z) * 5.5;

        float totalSparkle = (sparkle1 + sparkle2 + sparkle3) * shadowFactor * distFade;
        vec3 sparkleColor = vec3(3.2, 3.0, 2.8) * totalSparkle;

        reflectedLight.directSpecular += sparkleColor;
      }
      `
    );
  };

  material.userData = {
    uniforms,
    update(time: number, sunDirection: THREE.Vector3, cameraPos: THREE.Vector3) {
      uniforms.uTime.value = time;
      uniforms.uSunDir.value.copy(sunDirection);
      uniforms.uCameraPos.value.copy(cameraPos);
    }
  };

  return material;
}
