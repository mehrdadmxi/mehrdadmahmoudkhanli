import * as THREE from 'three';

export interface FluidConfig {
  simRes: number;
  dyeRes: number;
  velocityDissipation: number;
  densityDissipation: number;
  pressureDissipation: number;
  pressureIterations: number;
  curl: number;
  dt: number;
}

export const DEFAULT_FLUID_CONFIG: FluidConfig = {
  simRes: 256,
  dyeRes: 512,
  velocityDissipation: 0.98,
  densityDissipation: 0.97,
  pressureDissipation: 0.95,
  pressureIterations: 5,
  curl: 30.0,
  dt: 1 / 60,
};

interface DoubleFBO {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap: () => void;
}

function createDoubleFBO(
  w: number,
  h: number,
  type: THREE.TextureDataType = THREE.HalfFloatType
): DoubleFBO {
  const options: THREE.RenderTargetOptions = {
    type,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  };
  let read = new THREE.WebGLRenderTarget(w, h, options);
  let write = new THREE.WebGLRenderTarget(w, h, options);
  return {
    get read() {
      return read;
    },
    get write() {
      return write;
    },
    swap() {
      const temp = read;
      read = write;
      write = temp;
    },
  };
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const splatShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspectRatio;
  uniform vec2 uPoint0;
  uniform vec2 uPoint1;
  uniform vec3 uColor;
  uniform float uRadius;
  uniform int uAdditive;

  float distToSegment(vec2 p, vec2 a, vec2 b, float aspect) {
    vec2 pa = (p - a) * vec2(aspect, 1.0);
    vec2 ba = (b - a) * vec2(aspect, 1.0);
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec4 base = texture2D(uTarget, vUv);
    float d = distToSegment(vUv, uPoint0, uPoint1, uAspectRatio);
    float s = exp(-d * d / max(uRadius * uRadius, 1e-6));
    if (uAdditive == 1) {
      gl_FragColor = base + vec4(uColor * s, 0.0);
    } else {
      gl_FragColor = mix(base, vec4(uColor, 1.0), s);
    }
  }
`;

const curlShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).y;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).y;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float uCurlStrength;
  uniform float uDt;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uCurl, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uCurl, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uCurl, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uCurl, vUv + vec2(0.0, uTexelSize.y)).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 1e-5;
    force *= uCurlStrength * C * vec2(1.0, -1.0);
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * uDt, 0.0, 1.0);
  }
`;

const divergenceShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vUv.x - uTexelSize.x < 0.0) L = -C.x;
    if (vUv.x + uTexelSize.x > 1.0) R = -C.x;
    if (vUv.y - uTexelSize.y < 0.0) B = -C.y;
    if (vUv.y + uTexelSize.y > 1.0) T = -C.y;
    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const pressureShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;
  uniform float uDissipation;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float div = texture2D(uDivergence, vUv).x;
    float p = (L + R + B + T - div) * 0.25 * uDissipation;
    gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vel.xy -= vec2(R - L, T - B) * 0.5;
    gl_FragColor = vec4(vel, 0.0, 1.0);
  }
`;

const advectShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;
  void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    vec2 coord = vUv - vel * uDt * uTexelSize;
    gl_FragColor = uDissipation * texture2D(uSource, coord);
  }
`;

export class GPUFluidSimulation {
  private camera: THREE.OrthographicCamera;
  private scene: THREE.Scene;
  private quad: THREE.Mesh;

  private velocityFBO: DoubleFBO;
  private densityFBO: DoubleFBO;
  private pressureFBO: DoubleFBO;
  private divergenceFBO: THREE.WebGLRenderTarget;
  private curlFBO: THREE.WebGLRenderTarget;

  private splatMaterial: THREE.ShaderMaterial;
  private curlMaterial: THREE.ShaderMaterial;
  private vorticityMaterial: THREE.ShaderMaterial;
  private divergenceMaterial: THREE.ShaderMaterial;
  private pressureMaterial: THREE.ShaderMaterial;
  private gradientSubtractMaterial: THREE.ShaderMaterial;
  private advectMaterial: THREE.ShaderMaterial;

  public config: FluidConfig;
  private lastSplatTime = 0;
  private lastX = 0;
  private lastY = 0;

  constructor(config: FluidConfig = DEFAULT_FLUID_CONFIG) {
    this.config = { ...config };

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    const geo = new THREE.PlaneGeometry(2, 2);

    this.velocityFBO = createDoubleFBO(this.config.simRes, this.config.simRes);
    this.densityFBO = createDoubleFBO(this.config.dyeRes, this.config.dyeRes);
    this.pressureFBO = createDoubleFBO(this.config.simRes, this.config.simRes);

    const fboOpts: THREE.RenderTargetOptions = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.divergenceFBO = new THREE.WebGLRenderTarget(this.config.simRes, this.config.simRes, fboOpts);
    this.curlFBO = new THREE.WebGLRenderTarget(this.config.simRes, this.config.simRes, fboOpts);

    this.splatMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: splatShader,
      uniforms: {
        uTarget: { value: null },
        uAspectRatio: { value: 1.0 },
        uPoint0: { value: new THREE.Vector2() },
        uPoint1: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Vector3() },
        uRadius: { value: 0.05 },
        uAdditive: { value: 0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.curlMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: curlShader,
      uniforms: {
        uVelocity: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.vorticityMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: vorticityShader,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        uCurlStrength: { value: this.config.curl },
        uDt: { value: this.config.dt },
        uTexelSize: { value: new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.divergenceMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: divergenceShader,
      uniforms: {
        uVelocity: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.pressureMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: pressureShader,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes) },
        uDissipation: { value: this.config.pressureDissipation },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.gradientSubtractMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: gradientSubtractShader,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.advectMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: advectShader,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexelSize: { value: new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes) },
        uDt: { value: this.config.dt },
        uDissipation: { value: 1.0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.quad = new THREE.Mesh(geo, this.splatMaterial);
    this.scene.add(this.quad);
  }

  public get velocityTexture(): THREE.Texture {
    return this.velocityFBO.read.texture;
  }

  public get densityTexture(): THREE.Texture {
    return this.densityFBO.read.texture;
  }

  public addPointerMove(
    currentX: number,
    currentY: number,
    screenWidth: number,
    screenHeight: number,
    renderer: THREE.WebGLRenderer,
    isMobile = false
  ) {
    const now = performance.now();
    const timeDelta = now - this.lastSplatTime;

    let p0x = this.lastX / screenWidth;
    let p0y = 1.0 - this.lastY / screenHeight;
    const p1x = currentX / screenWidth;
    const p1y = 1.0 - currentY / screenHeight;

    if (timeDelta > 50 || this.lastSplatTime === 0) {
      p0x = p1x;
      p0y = p1y;
    }

    const dx = (p1x - p0x) * screenWidth;
    const dy = (p1y - p0y) * screenHeight;
    const len = Math.sqrt(dx * dx + dy * dy);

    this.lastX = currentX;
    this.lastY = currentY;
    this.lastSplatTime = now;

    if (len < 0.01) return;

    // Splat radius = clamp-map(len, 0..5 -> 0..60) * 0.6 (* 0.8 on mobile)
    const mappedRadius = Math.min(Math.max((len / 5.0) * 60.0, 0), 60.0);
    const radiusPx = mappedRadius * (isMobile ? 0.8 : 0.6);
    // radius / 200 in UV units
    const radiusUV = (radiusPx / 200.0) * (256.0 / Math.max(screenWidth, screenHeight));

    // force multiplier = clamp-map(len, 0..15 -> 0..10)
    const forceMult = Math.min(Math.max((len / 15.0) * 10.0, 0), 10.0);

    const aspect = screenWidth / screenHeight;

    // 1. Splat into velocity (additive, dx * mult, -dy * mult, 1)
    this.splat(
      renderer,
      this.velocityFBO,
      new THREE.Vector2(p0x, p0y),
      new THREE.Vector2(p1x, p1y),
      new THREE.Vector3(dx * forceMult * 10.0, -dy * forceMult * 10.0, 1.0),
      radiusUV,
      aspect,
      true
    );

    // 2. Splat into density (white)
    this.splat(
      renderer,
      this.densityFBO,
      new THREE.Vector2(p0x, p0y),
      new THREE.Vector2(p1x, p1y),
      new THREE.Vector3(1.0, 1.0, 1.0),
      radiusUV * 1.5,
      aspect,
      false
    );
  }

  private splat(
    renderer: THREE.WebGLRenderer,
    fbo: DoubleFBO,
    p0: THREE.Vector2,
    p1: THREE.Vector2,
    color: THREE.Vector3,
    radius: number,
    aspect: number,
    additive: boolean
  ) {
    this.splatMaterial.uniforms.uTarget.value = fbo.read.texture;
    this.splatMaterial.uniforms.uAspectRatio.value = aspect;
    this.splatMaterial.uniforms.uPoint0.value.copy(p0);
    this.splatMaterial.uniforms.uPoint1.value.copy(p1);
    this.splatMaterial.uniforms.uColor.value.copy(color);
    this.splatMaterial.uniforms.uRadius.value = Math.max(radius, 0.005);
    this.splatMaterial.uniforms.uAdditive.value = additive ? 1 : 0;

    this.quad.material = this.splatMaterial;
    renderer.setRenderTarget(fbo.write);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
    fbo.swap();
  }

  public step(renderer: THREE.WebGLRenderer) {
    const simTexel = new THREE.Vector2(1 / this.config.simRes, 1 / this.config.simRes);
    const dyeTexel = new THREE.Vector2(1 / this.config.dyeRes, 1 / this.config.dyeRes);

    // 1. Curl pass
    this.curlMaterial.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.curlMaterial.uniforms.uTexelSize.value.copy(simTexel);
    this.quad.material = this.curlMaterial;
    renderer.setRenderTarget(this.curlFBO);
    renderer.render(this.scene, this.camera);

    // 2. Vorticity confinement pass
    this.vorticityMaterial.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.vorticityMaterial.uniforms.uCurl.value = this.curlFBO.texture;
    this.vorticityMaterial.uniforms.uCurlStrength.value = this.config.curl;
    this.vorticityMaterial.uniforms.uDt.value = this.config.dt;
    this.vorticityMaterial.uniforms.uTexelSize.value.copy(simTexel);
    this.quad.material = this.vorticityMaterial;
    renderer.setRenderTarget(this.velocityFBO.write);
    renderer.render(this.scene, this.camera);
    this.velocityFBO.swap();

    // 3. Divergence pass
    this.divergenceMaterial.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.divergenceMaterial.uniforms.uTexelSize.value.copy(simTexel);
    this.quad.material = this.divergenceMaterial;
    renderer.setRenderTarget(this.divergenceFBO);
    renderer.render(this.scene, this.camera);

    // 4. Pressure solve (Jacobi iterations)
    this.pressureMaterial.uniforms.uDivergence.value = this.divergenceFBO.texture;
    this.pressureMaterial.uniforms.uTexelSize.value.copy(simTexel);
    this.pressureMaterial.uniforms.uDissipation.value = this.config.pressureDissipation;
    this.quad.material = this.pressureMaterial;

    for (let i = 0; i < this.config.pressureIterations; i++) {
      this.pressureMaterial.uniforms.uPressure.value = this.pressureFBO.read.texture;
      renderer.setRenderTarget(this.pressureFBO.write);
      renderer.render(this.scene, this.camera);
      this.pressureFBO.swap();
    }

    // 5. Gradient subtract pass
    this.gradientSubtractMaterial.uniforms.uPressure.value = this.pressureFBO.read.texture;
    this.gradientSubtractMaterial.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.gradientSubtractMaterial.uniforms.uTexelSize.value.copy(simTexel);
    this.quad.material = this.gradientSubtractMaterial;
    renderer.setRenderTarget(this.velocityFBO.write);
    renderer.render(this.scene, this.camera);
    this.velocityFBO.swap();

    // 6. Advect velocity pass (dissipation 0.98)
    this.advectMaterial.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.advectMaterial.uniforms.uSource.value = this.velocityFBO.read.texture;
    this.advectMaterial.uniforms.uTexelSize.value.copy(simTexel);
    this.advectMaterial.uniforms.uDt.value = this.config.dt;
    this.advectMaterial.uniforms.uDissipation.value = this.config.velocityDissipation;
    this.quad.material = this.advectMaterial;
    renderer.setRenderTarget(this.velocityFBO.write);
    renderer.render(this.scene, this.camera);
    this.velocityFBO.swap();

    // 7. Advect density pass (dissipation 0.97)
    this.advectMaterial.uniforms.uVelocity.value = this.velocityFBO.read.texture;
    this.advectMaterial.uniforms.uSource.value = this.densityFBO.read.texture;
    this.advectMaterial.uniforms.uTexelSize.value.copy(dyeTexel);
    this.advectMaterial.uniforms.uDt.value = this.config.dt;
    this.advectMaterial.uniforms.uDissipation.value = this.config.densityDissipation;
    this.quad.material = this.advectMaterial;
    renderer.setRenderTarget(this.densityFBO.write);
    renderer.render(this.scene, this.camera);
    this.densityFBO.swap();

    renderer.setRenderTarget(null);
  }

  public dispose() {
    this.velocityFBO.read.dispose();
    this.velocityFBO.write.dispose();
    this.densityFBO.read.dispose();
    this.densityFBO.write.dispose();
    this.pressureFBO.read.dispose();
    this.pressureFBO.write.dispose();
    this.divergenceFBO.dispose();
    this.curlFBO.dispose();
    this.splatMaterial.dispose();
    this.curlMaterial.dispose();
    this.vorticityMaterial.dispose();
    this.divergenceMaterial.dispose();
    this.pressureMaterial.dispose();
    this.gradientSubtractMaterial.dispose();
    this.advectMaterial.dispose();
    this.quad.geometry.dispose();
  }
}
