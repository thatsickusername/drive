import * as THREE from 'three';

export class SkyDome {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.SphereGeometry(1800, 32, 24);

    const uniforms = {
      uZenithColor: { value: new THREE.Color(0xa8b8db) },   // Soft lilac / periwinkle blue
      uMidColor: { value: new THREE.Color(0xefc4cb) },      // Warm blush lavender / pink
      uHorizonColor: { value: new THREE.Color(0xfff0e4) },  // Luminous peach / apricot cream
      uCloudColor1: { value: new THREE.Color(0xf6b2a4) },   // Soft coral-peach cloud band
      uCloudColor2: { value: new THREE.Color(0xffece2) },   // Soft golden apricot cloud band
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

        // Vertical sky gradient (Lilac -> Blush Pink -> Apricot Peach)
        vec3 sky;
        if (y > 0.26) {
          float t = clamp((y - 0.26) / 0.62, 0.0, 1.0);
          sky = mix(uMidColor, uZenithColor, t);
        } else if (y > 0.0) {
          float t = clamp(y / 0.26, 0.0, 1.0);
          sky = mix(uHorizonColor, uMidColor, t);
        } else {
          sky = uHorizonColor;
        }

        // Soft stylized cloud strata along horizon (matching acceptance criteria)
        if (y > 0.03 && y < 0.38) {
          float band1 = smoothstep(0.03, 0.09, y) * smoothstep(0.19, 0.11, y);
          float band2 = smoothstep(0.12, 0.18, y) * smoothstep(0.32, 0.22, y);
          float bandMask = band1 + band2 * 0.70;

          vec2 cloudCoord = vec2(angle * 2.0, y * 34.0);
          float n = noise(cloudCoord) * 0.65 + noise(cloudCoord * 2.2 + vec2(1.2, 0.5)) * 0.35;
          float cloudAlpha = smoothstep(0.40, 0.64, n) * bandMask * 0.60;
          vec3 cloudCol = mix(uCloudColor1, uCloudColor2, clamp(y * 3.2, 0.0, 1.0));
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
