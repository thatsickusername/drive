import * as THREE from 'three';

export class SkyDome {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.SphereGeometry(1800, 32, 24);

    const uniforms = {
      // Day Palette
      uZenithColor: { value: new THREE.Color(0xa0b3dc) },   // Soft daytime alpine periwinkle blue
      uMidColor: { value: new THREE.Color(0xe2d5e0) },      // Soft delicate lavender-blush
      uHorizonColor: { value: new THREE.Color(0xfff3e9) },  // Soft luminous warm cream / apricot
      uCloudColor1: { value: new THREE.Color(0xf0d8ce) },   // Pastel warm peach cloud band
      uCloudColor2: { value: new THREE.Color(0xfff4ed) },   // Pastel cream cloud highlight

      // Golden Hour Palette (Matching acceptance criteria 3 - Radiant sunset / sunrise glow)
      uGoldenZenithColor: { value: new THREE.Color(0x806e8f) },  // Serene twilight dusk indigo
      uGoldenMidColor: { value: new THREE.Color(0xdc8f94) },     // Warm salmon rose near sun
      uGoldenHorizonColor: { value: new THREE.Color(0xffa675) }, // Luminous peach-amber sunset glow
      uGoldenCloudColor1: { value: new THREE.Color(0x6a4664) },  // Deep dusky mauve cloud base
      uGoldenCloudColor2: { value: new THREE.Color(0xf29880) },  // Sunset peach / amber cloud highlight
      uGoldenSunDir: { value: new THREE.Vector3(0.492, 0.006, 0.870).normalize() }, // Sun nestled right on saddle
      uGoldenFactor: { value: 0.0 },

      // Night Palette (Matching acceptance criteria 2 - Soft pastel night)
      uNightZenithColor: { value: new THREE.Color(0x283656) },  // Soft pastel midnight navy
      uNightMidColor: { value: new THREE.Color(0x42527a) },     // Soft pastel slate blue
      uNightHorizonColor: { value: new THREE.Color(0x6e7ca2) }, // Luminous pastel valley mist
      uNightCloudColor1: { value: new THREE.Color(0x3a486c) },  // Soft nocturnal cloud
      uNightCloudColor2: { value: new THREE.Color(0x52628a) },  // Soft night cloud rim
      uMoonDir: { value: new THREE.Vector3(0.58, 0.22, 0.77).normalize() }, // Upper-left moon in night sky (perfectly aligned with left crest)
      uNightFactor: { value: 0.0 },                             // 0 = Day, 1 = Night
      uTime: { value: 0.0 }
    };

    const vertexShader = /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `;

    const fragmentShader = /* glsl */ `
      uniform vec3 uZenithColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uCloudColor1;
      uniform vec3 uCloudColor2;

      uniform vec3 uGoldenZenithColor;
      uniform vec3 uGoldenMidColor;
      uniform vec3 uGoldenHorizonColor;
      uniform vec3 uGoldenCloudColor1;
      uniform vec3 uGoldenCloudColor2;
      uniform vec3 uGoldenSunDir;
      uniform float uGoldenFactor;

      uniform vec3 uNightZenithColor;
      uniform vec3 uNightMidColor;
      uniform vec3 uNightHorizonColor;
      uniform vec3 uNightCloudColor1;
      uniform vec3 uNightCloudColor2;
      uniform vec3 uMoonDir;
      uniform float uNightFactor;

      uniform float uTime;
      varying vec3 vWorldPosition;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      vec3 hash33(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float y = dir.y;
        float angle = atan(dir.x, dir.z);

        // 1. Sky Gradient (Continuous 3-stop vertical gradient for Day, Golden Hour, and Night)
        float tZenith = smoothstep(0.10, 0.65, y);
        float tHorizon = smoothstep(-0.02, 0.25, y);

        vec3 dayLowerSky = mix(uHorizonColor, uMidColor, tHorizon);
        vec3 daySky = mix(dayLowerSky, uZenithColor, tZenith);

        // Directional golden hour horizon & sky based on sun azimuth
        vec3 horizDir = normalize(vec3(dir.x, 0.0, dir.z));
        vec3 horizSun = normalize(vec3(uGoldenSunDir.x, 0.0, uGoldenSunDir.z));
        float sunAzimuth = max(0.0, dot(horizDir, horizSun));
        float azimuthGlow = pow(sunAzimuth, 2.0);

        vec3 goldenDuskHorizon = vec3(0.68, 0.58, 0.70); // Soft twilight lavender away from sun
        vec3 goldenSunHorizon = uGoldenHorizonColor;       // Warm luminous peach-amber near sun
        vec3 effectiveGoldenHorizon = mix(goldenDuskHorizon, goldenSunHorizon, azimuthGlow);

        vec3 goldenDuskMid = vec3(0.60, 0.50, 0.64);     // Soft twilight mauve away from sun
        vec3 goldenSunMid = uGoldenMidColor;              // Warm salmon rose near sun
        vec3 effectiveGoldenMid = mix(goldenDuskMid, goldenSunMid, azimuthGlow);

        float tGoldenZenith = smoothstep(0.10, 0.62, y);
        float tGoldenHorizon = smoothstep(-0.02, 0.26, y);
        vec3 goldenLowerSky = mix(effectiveGoldenHorizon, effectiveGoldenMid, tGoldenHorizon);
        vec3 goldenSky = mix(goldenLowerSky, uGoldenZenithColor, tGoldenZenith);

        vec3 nightLowerSky = mix(uNightHorizonColor, uNightMidColor, tHorizon);
        vec3 nightSky = mix(nightLowerSky, uNightZenithColor, tZenith);

        vec3 sky = mix(daySky, goldenSky, uGoldenFactor);
        sky = mix(sky, nightSky, uNightFactor);

        // 2. Soft Stylized Cloud Strata along horizon
        if (y > 0.04 && y < 0.40) {
          float band1 = smoothstep(0.04, 0.11, y) * smoothstep(0.22, 0.13, y);
          float band2 = smoothstep(0.13, 0.20, y) * smoothstep(0.36, 0.24, y);
          float bandMask = band1 * 0.75 + band2 * 0.50;

          vec2 cloudCoord = vec2(angle * 3.2, y * 42.0);
          float n = noise(cloudCoord) * 0.62 + noise(cloudCoord * 2.3 + vec2(1.5, 0.7)) * 0.38;
          float cloudAlpha = smoothstep(0.46, 0.70, n) * bandMask * mix(0.30, 0.46, max(uGoldenFactor, uNightFactor));

          vec3 dayCloudCol = mix(uCloudColor1, uCloudColor2, clamp((y - 0.05) * 3.5, 0.0, 1.0));
          vec3 goldenCloudShadow = uGoldenCloudColor1;
          vec3 goldenCloudLit = mix(vec3(0.75, 0.52, 0.62), uGoldenCloudColor2, azimuthGlow);
          vec3 goldenCloudCol = mix(goldenCloudShadow, goldenCloudLit, clamp((y - 0.05) * 3.5, 0.0, 1.0));
          vec3 nightCloudCol = mix(uNightCloudColor1, uNightCloudColor2, clamp((y - 0.05) * 3.5, 0.0, 1.0));

          vec3 cloudCol = mix(dayCloudCol, goldenCloudCol, uGoldenFactor);
          cloudCol = mix(cloudCol, nightCloudCol, uNightFactor);

          sky = mix(sky, cloudCol, cloudAlpha);
        }

        // 3. Golden Hour Celestial Elements: Setting Sun disk & Warm Solar Corona
        if (uGoldenFactor > 0.001) {
          float sunDot = dot(dir, normalize(uGoldenSunDir));
          if (sunDot > 0.0) {
            float sunDisk = smoothstep(0.99965, 0.99990, sunDot);
            float halo1 = pow(sunDot, 400.0) * 0.95;
            float halo2 = pow(sunDot, 90.0) * 0.60;
            float halo3 = pow(sunDot, 20.0) * 0.35;
            float halo4 = pow(sunDot, 5.0) * 0.16;

            vec3 sunDiskCol = vec3(1.0, 0.99, 0.92) * sunDisk * 4.2;
            vec3 sunInnerCol = vec3(1.0, 0.84, 0.48) * (halo1 * 0.85 + halo2 * 0.45);
            vec3 sunOuterCol = vec3(0.98, 0.58, 0.24) * (halo3 * 0.55 + halo4 * 0.32);
            sky += (sunDiskCol + sunInnerCol + sunOuterCol) * uGoldenFactor;
          }
        }

        // 4. Night Celestial Elements: Luminous Moon & Atmospheric Lunar Glow
        if (uNightFactor > 0.01) {
          float moonDot = dot(dir, normalize(uMoonDir));
          if (moonDot > 0.0) {
            float moonDisk = smoothstep(0.9984, 0.9993, moonDot);
            float halo1 = pow(moonDot, 140.0) * 0.85;
            float halo2 = pow(moonDot, 32.0) * 0.40;
            float halo3 = pow(moonDot, 8.0) * 0.18;
            float halo4 = pow(moonDot, 2.0) * 0.08;
            float totalHalo = (halo1 + halo2 + halo3 + halo4);

            vec3 moonDiskCol = vec3(1.0, 0.99, 0.97) * moonDisk * 3.8;
            vec3 moonHaloCol = vec3(0.76, 0.86, 1.0) * totalHalo * 0.65;
            sky += (moonDiskCol + moonHaloCol) * uNightFactor;
          }
        }

        // 5. Crystalline Sparkling Stars in clear upper sky
        float starFactor = max(uNightFactor, uGoldenFactor * 0.38);
        if (starFactor > 0.01 && y > 0.08) {
          vec3 starPos = dir * 135.0;
          vec3 starCell = floor(starPos);
          vec3 starFract = fract(starPos) - vec3(0.5);
          vec3 starRnd = hash33(starCell);

          if (starRnd.x > 0.93) {
            float starDist = length(starFract);
            float starCore = smoothstep(0.28, 0.0, starDist) * smoothstep(0.08, 0.28, y);
            // 4-point cross diffraction flare for brightest magnitude stars
            float crossFlare = max(
              smoothstep(0.34, 0.0, abs(starFract.x)) * smoothstep(0.08, 0.0, abs(starFract.y)),
              smoothstep(0.34, 0.0, abs(starFract.y)) * smoothstep(0.08, 0.0, abs(starFract.x))
            ) * step(0.985, starRnd.x) * 1.8;

            float twinkle = sin(uTime * 2.2 + starRnd.y * 30.0) * 0.22 + 0.78;
            vec3 starCol = mix(vec3(0.92, 0.96, 1.0), vec3(1.0, 0.95, 0.88), starRnd.z);
            sky += starCol * (starCore * 2.6 + crossFlare * 2.0) * twinkle * starFactor;
          }
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.renderOrder = -1000;
  }

  public update(time: number, cameraPosition: THREE.Vector3): void {
    this.material.uniforms.uTime.value = time;
    this.mesh.position.copy(cameraPosition);
  }

  public setNightFactor(factor: number): void {
    this.material.uniforms.uNightFactor.value = factor;
  }

  public setLightingFactors(goldenFactor: number, nightFactor: number): void {
    this.material.uniforms.uGoldenFactor.value = goldenFactor;
    this.material.uniforms.uNightFactor.value = nightFactor;
  }
}
