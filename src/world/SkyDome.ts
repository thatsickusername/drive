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

      // Night Palette (Matching acceptance criteria 2)
      uNightZenithColor: { value: new THREE.Color(0x182542) },  // Deep midnight sapphire indigo
      uNightMidColor: { value: new THREE.Color(0x28385a) },     // Muted steel midnight blue
      uNightHorizonColor: { value: new THREE.Color(0x42547a) }, // Hazy dusky valley blue
      uNightCloudColor1: { value: new THREE.Color(0x202b40) },  // Dark slate nocturnal cloud
      uNightCloudColor2: { value: new THREE.Color(0x30405c) },  // Soft night cloud rim
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

        // 1. Sky Gradient (Continuous 3-stop vertical gradient for Day and Night)
        float tZenith = smoothstep(0.10, 0.65, y);
        float tHorizon = smoothstep(-0.02, 0.25, y);

        vec3 dayLowerSky = mix(uHorizonColor, uMidColor, tHorizon);
        vec3 daySky = mix(dayLowerSky, uZenithColor, tZenith);

        vec3 nightLowerSky = mix(uNightHorizonColor, uNightMidColor, tHorizon);
        vec3 nightSky = mix(nightLowerSky, uNightZenithColor, tZenith);

        vec3 sky = mix(daySky, nightSky, uNightFactor);

        // 2. Soft Stylized Cloud Strata along horizon
        if (y > 0.04 && y < 0.40) {
          float band1 = smoothstep(0.04, 0.11, y) * smoothstep(0.22, 0.13, y);
          float band2 = smoothstep(0.13, 0.20, y) * smoothstep(0.36, 0.24, y);
          float bandMask = band1 * 0.75 + band2 * 0.50;

          vec2 cloudCoord = vec2(angle * 3.2, y * 42.0);
          float n = noise(cloudCoord) * 0.62 + noise(cloudCoord * 2.3 + vec2(1.5, 0.7)) * 0.38;
          float cloudAlpha = smoothstep(0.46, 0.70, n) * bandMask * mix(0.30, 0.42, uNightFactor);

          vec3 dayCloudCol = mix(uCloudColor1, uCloudColor2, clamp((y - 0.05) * 3.5, 0.0, 1.0));
          vec3 nightCloudCol = mix(uNightCloudColor1, uNightCloudColor2, clamp((y - 0.05) * 3.5, 0.0, 1.0));
          vec3 cloudCol = mix(dayCloudCol, nightCloudCol, uNightFactor);

          sky = mix(sky, cloudCol, cloudAlpha);
        }

        // 3. Night Celestial Elements: Luminous Moon & Alpine Starry Sky
        if (uNightFactor > 0.01) {
          // Luminous Moon disk & atmospheric lunar glow in upper-left sky (matching acceptance criteria 2)
          float moonDot = dot(dir, normalize(uMoonDir));
          if (moonDot > 0.0) {
            float moonDisk = smoothstep(0.9984, 0.9993, moonDot);
            float halo1 = pow(moonDot, 160.0) * 0.90;
            float halo2 = pow(moonDot, 40.0) * 0.40;
            float halo3 = pow(moonDot, 12.0) * 0.18;
            float totalHalo = (halo1 + halo2 + halo3);

            vec3 moonDiskCol = vec3(1.0, 0.99, 0.96) * moonDisk * 4.2;
            vec3 moonHaloCol = vec3(0.70, 0.82, 1.0) * totalHalo * 0.75;
            sky += (moonDiskCol + moonHaloCol) * uNightFactor;
          }

          // Crystalline Sparkling Stars in clear upper midnight sky
          if (y > 0.08) {
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
              sky += starCol * (starCore * 2.6 + crossFlare * 2.0) * twinkle * uNightFactor;
            }
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
}
