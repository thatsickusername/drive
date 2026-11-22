import * as THREE from 'three';

export class AirborneSparkles {
  public points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private count = 320;
  private range = new THREE.Vector3(70, 30, 70);

  constructor() {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const scales = new Float32Array(this.count);
    const phases = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * this.range.x;
      positions[i * 3 + 1] = Math.random() * this.range.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * this.range.z;

      scales[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random() * Math.PI * 2;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const uniforms = {
      uTime: { value: 0.0 },
      uCenter: { value: new THREE.Vector3() },
      uRange: { value: this.range.clone() },
      uColor: { value: new THREE.Color(0xffeedd) }
    };

    const vertexShader = /* glsl */ `
      uniform float uTime;
      uniform vec3 uCenter;
      uniform vec3 uRange;
      attribute float aScale;
      attribute float aPhase;
      varying float vAlpha;

      void main() {
        vec3 pos = position;

        // Gentle floating drift
        pos.y -= uTime * 0.45;
        pos.x += sin(uTime * 0.5 + aPhase) * 0.8;
        pos.z += cos(uTime * 0.4 + aPhase) * 0.8;

        // Wrap around player / camera bounding volume
        vec3 halfRange = uRange * 0.5;
        pos = mod(pos + halfRange, uRange) - halfRange + uCenter;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Size attenuation
        gl_PointSize = (aScale * 56.0) / -mvPosition.z;

        // Twinkling animation
        float twinkle = sin(uTime * 3.2 + aPhase) * 0.5 + 0.5;
        vAlpha = smoothstep(0.15, 0.90, twinkle);
      }
    `;

    const fragmentShader = /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;

        // 4-point diamond star flare shape
        float flare = max(0.0, 1.0 - abs(p.x) * 3.5) * max(0.0, 1.0 - abs(p.y) * 1.2)
                    + max(0.0, 1.0 - abs(p.y) * 3.5) * max(0.0, 1.0 - abs(p.x) * 1.2);
        float core = smoothstep(0.60, 0.0, r);
        float shape = clamp(core * 0.8 + flare * 0.9, 0.0, 1.0);

        gl_FragColor = vec4(uColor * 1.4, shape * vAlpha);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  public update(time: number, center: THREE.Vector3): void {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uCenter.value.copy(center);
  }
}
