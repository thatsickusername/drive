import * as THREE from 'three';

export class SkyDome {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.SphereGeometry(1800, 32, 24);

    const uniforms = {
      uZenithColor: { value: new THREE.Color(0xa0b3dc) },   // Soft daytime alpine periwinkle blue
      uMidColor: { value: new THREE.Color(0xe2d5e0) },      // Soft delicate lavender-blush
      uHorizonColor: { value: new THREE.Color(0xfff3e9) },  // Soft luminous warm cream / apricot
      uCloudColor1: { value: new THREE.Color(0xf0d8ce) },   // Pastel warm peach cloud band
      uCloudColor2: { value: new THREE.Color(0xfff4ed) },   // Pastel cream cloud highlight
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
      uniform float uTime;
      varying vec3 vWorldPosition;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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

        // Smooth continuous 3-stop vertical gradient without harsh banding
        float tZenith = smoothstep(0.10, 0.65, y);
        float tHorizon = smoothstep(-0.02, 0.25, y);
        vec3 lowerSky = mix(uHorizonColor, uMidColor, tHorizon);
        vec3 sky = mix(lowerSky, uZenithColor, tZenith);

        // Soft stylized wispy cloud strata along horizon (pastel daytime look)
        if (y > 0.04 && y < 0.40) {
          float band1 = smoothstep(0.04, 0.11, y) * smoothstep(0.22, 0.13, y);
          float band2 = smoothstep(0.13, 0.20, y) * smoothstep(0.36, 0.24, y);
          float bandMask = band1 * 0.75 + band2 * 0.50;

          vec2 cloudCoord = vec2(angle * 3.2, y * 42.0);
          float n = noise(cloudCoord) * 0.62 + noise(cloudCoord * 2.3 + vec2(1.5, 0.7)) * 0.38;
          float cloudAlpha = smoothstep(0.46, 0.70, n) * bandMask * 0.30;
          vec3 cloudCol = mix(uCloudColor1, uCloudColor2, clamp((y - 0.05) * 3.5, 0.0, 1.0));
          sky = mix(sky, cloudCol, cloudAlpha);
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
}
