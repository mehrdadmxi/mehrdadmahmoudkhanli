import * as THREE from 'three';
import { createMatcapTexture } from './matcap';

export interface ParticleSystemOptions {
  isMobile: boolean;
  dpr: number;
}

const simVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const simFragmentShader = `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uCurrentPosition;
  uniform sampler2D uOriginPosition;
  uniform sampler2D uFluidVelocity;
  uniform sampler2D uFluidDensity;
  uniform float uTime;
  uniform float uHZ;
  uniform int uIsInitialized;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uModelMatrix;
  uniform mat4 uCameraWorldMatrix;

  // Analytic curl noise
  vec3 curlNoise(vec3 p) {
    float d_psi_z_dy = -2.0 * sin(p.y * 2.0);
    float d_psi_y_dz = 3.0 * cos(p.z * 3.0);
    float d_psi_x_dz = -2.0 * sin(p.z * 2.0);
    float d_psi_z_dx = 3.0 * cos(p.x * 3.0);
    float d_psi_y_dx = -2.0 * sin(p.x * 2.0);
    float d_psi_x_dy = 3.0 * cos(p.y * 3.0);
    vec3 c = vec3(
      d_psi_z_dy - d_psi_y_dz,
      d_psi_x_dz - d_psi_z_dx,
      d_psi_y_dx - d_psi_x_dy
    );
    return normalize(c);
  }

  // Rotate by quaternion (0.5, 0.5, 0.5, 0.5)
  vec3 rotateQ(vec3 p) {
    vec4 q = vec4(0.5, 0.5, 0.5, 0.5);
    vec3 t = 2.0 * cross(q.xyz, p);
    return p + q.w * t + cross(q.xyz, t);
  }

  // AXON sculpted logo form SDF
  float sdfShape(vec3 p) {
    float len = length(p);
    if (len > 0.8) {
      return len - 0.7;
    }

    // Mirror depth axis: p.z = sqrt(p.z*p.z + 0.0215) - sqrt(0.012)
    p.z = sqrt(p.z * p.z + 0.0215) - sqrt(0.012);
    p = rotateQ(p);

    // Torus / bent ring core with harmonic lobes
    float rMajor = 0.38;
    float rMinor = 0.16;
    float dPlane = length(p.xy) - rMajor;
    float d = length(vec2(dPlane, p.z)) - rMinor;

    float angle = atan(p.y, p.x);
    float harmonic = 0.06 * sin(angle * 2.0 + p.z * 5.0) + 0.03 * cos(p.x * 6.0);
    return d + harmonic;
  }

  vec3 sdfNormal(vec3 p) {
    float eps = 0.001;
    float dx = sdfShape(p + vec3(eps, 0.0, 0.0)) - sdfShape(p - vec3(eps, 0.0, 0.0));
    float dy = sdfShape(p + vec3(0.0, eps, 0.0)) - sdfShape(p - vec3(0.0, eps, 0.0));
    float dz = sdfShape(p + vec3(0.0, 0.0, eps)) - sdfShape(p - vec3(0.0, 0.0, eps));
    vec3 n = vec3(dx, dy, dz);
    return length(n) > 0.0 ? normalize(n) : vec3(0.0, 1.0, 0.0);
  }

  void main() {
    vec3 origin = texture2D(uOriginPosition, vUv).xyz;
    if (uIsInitialized == 0) {
      gl_FragColor = vec4(origin, 1.0);
      return;
    }

    vec3 pos = texture2D(uCurrentPosition, vUv).xyz;

    if (length(pos) > 0.7) pos /= 2.0;

    pos += curlNoise(pos * 0.1 + uTime * 0.05) * 1.0 * 0.0002 * uHZ;
    vec3 gradient = sdfNormal(pos);
    float sdf = sdfShape(pos);

    vec3 nPos = length(pos) > 0.0 ? normalize(pos) : vec3(0.0, 0.0, 1.0);
    pos += cross(nPos, gradient) * 0.0005;
    pos += -gradient * sdf * 0.5;
    pos += (origin - pos) * 0.0002 * uHZ;

    // Mouse fluid push
    vec4 clip = uProjectionMatrix * (uModelMatrix * vec4(pos, 1.0));
    vec2 screenUV = (clip.xy / max(clip.w, 1e-4)) * 0.5 + 0.5;

    if (screenUV.x >= 0.0 && screenUV.x <= 1.0 && screenUV.y >= 0.0 && screenUV.y <= 1.0) {
      vec2 fVel = texture2D(uFluidVelocity, screenUV).xy;
      float fDensity = texture2D(uFluidDensity, screenUV).r;
      vec3 flow2D = vec3(fVel, 0.0);
      vec3 flow = mat3(uCameraWorldMatrix) * flow2D;
      pos += flow * 0.0001 * uHZ * 0.4 * fDensity;
    }

    gl_FragColor = vec4(pos, 1.0);
  }
`;

const renderVertexShader = `
  attribute vec2 aUv;
  attribute vec4 aRandom;

  varying vec4 vRandom;
  varying float vScale;
  varying float vDistToCamera;

  uniform sampler2D uPositionTexture;
  uniform float uDPR;

  void main() {
    vRandom = aRandom;
    vec3 pos = texture2D(uPositionTexture, aUv).xyz;
    pos *= mix(1.0, 1.5, pow(aRandom.y, 150.0));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float distToCamera = -mvPosition.z;
    vDistToCamera = distToCamera;

    float scale = smoothstep(3.0, 15.0, distToCamera) * mix(0.5, 1.0, aRandom.z);
    vScale = scale;

    gl_PointSize = 0.04 * uDPR * 2.0 * scale * (1000.0 / max(distToCamera, 0.1));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const renderFragmentShader = `
  precision highp float;

  varying vec4 vRandom;
  varying float vScale;
  varying float vDistToCamera;

  uniform sampler2D uMatcap;
  uniform float uTime;

  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    if (vScale < 0.1) discard;

    vec3 grey = vec3(mix(0.0, 0.2, vRandom.x));
    vec3 lavender = vec3(0.6, 0.45, 1.0);
    vec3 col = mix(grey, lavender, pow(vRandom.z, 100.0));

    float sparkle = 0.5 + (0.4 + sin(uTime * 4.0 + vRandom.y * 20.0)) * pow(vRandom.z, 10.0) * 2.5;
    col *= sparkle;

    float rot = sin(uTime + vRandom.z * 20.0) * 0.5 + 1.0;
    vec2 pUv = gl_PointCoord - 0.5;
    float c = cos(rot);
    float s = sin(rot);
    vec2 rotUv = vec2(pUv.x * c - pUv.y * s, pUv.x * s + pUv.y * c) + 0.5;
    vec4 matcap = texture2D(uMatcap, rotUv);

    vec3 softLight = mix(
      2.0 * col * matcap.rgb + col * col * (1.0 - 2.0 * matcap.rgb),
      sqrt(max(col, vec3(0.0))) * (2.0 * matcap.rgb - 1.0) + 2.0 * col * (1.0 - matcap.rgb),
      step(0.5, matcap.rgb)
    );
    vec3 overlay = mix(
      2.0 * col * matcap.rgb,
      1.0 - 2.0 * (1.0 - col) * (1.0 - matcap.rgb),
      step(0.5, col)
    );
    vec3 finalCol = mix(col, softLight, 0.8);
    finalCol = mix(finalCol, overlay, 0.2);

    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

export class AXONParticleSystem {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public pointsGroup: THREE.Group;
  public pointsMesh: THREE.Points;

  private simScene: THREE.Scene;
  private simCamera: THREE.OrthographicCamera;
  private simQuad: THREE.Mesh;
  private simMaterial: THREE.ShaderMaterial;
  private renderMaterial: THREE.ShaderMaterial;

  private readTarget: THREE.WebGLRenderTarget;
  private writeTarget: THREE.WebGLRenderTarget;
  private matcapTexture: THREE.CanvasTexture;

  public basePosition = new THREE.Vector3(-1.17, 0, 6);
  public targetCameraPos = new THREE.Vector3(-1.17, 0, 6);
  public size: number;
  public count: number;

  constructor(options: ParticleSystemOptions) {
    this.size = options.isMobile ? 128 : 512;
    this.count = this.size * this.size;

    // Main 3D scene & camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(0, 0, 0);

    // Group holding the points
    this.pointsGroup = new THREE.Group();
    this.pointsGroup.position.set(0.343, 0.16, -1);
    this.pointsGroup.rotation.set(
      (-28.4 * Math.PI) / 180,
      (390 * Math.PI) / 180,
      (4.92 * Math.PI) / 180
    );
    this.pointsGroup.scale.set(5, 5, 6);
    this.scene.add(this.pointsGroup);

    // Initial random positions texture (uniform in [-1, 1]³)
    const originData = new Float32Array(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      const idx = i * 4;
      originData[idx] = (Math.random() * 2 - 1);
      originData[idx + 1] = (Math.random() * 2 - 1);
      originData[idx + 2] = (Math.random() * 2 - 1);
      originData[idx + 3] = 1.0;
    }
    const originTexture = new THREE.DataTexture(
      originData,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    originTexture.needsUpdate = true;

    // Ping-pong float render targets
    const rtOpts: THREE.RenderTargetOptions = {
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    };
    this.readTarget = new THREE.WebGLRenderTarget(this.size, this.size, rtOpts);
    this.writeTarget = new THREE.WebGLRenderTarget(this.size, this.size, rtOpts);

    // GPGPU Simulation pass setup
    this.simScene = new THREE.Scene();
    this.simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.simMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertexShader,
      fragmentShader: simFragmentShader,
      uniforms: {
        uCurrentPosition: { value: originTexture },
        uOriginPosition: { value: originTexture },
        uFluidVelocity: { value: null },
        uFluidDensity: { value: null },
        uTime: { value: 0 },
        uHZ: { value: 1.0 },
        uIsInitialized: { value: 0 },
        uProjectionMatrix: { value: new THREE.Matrix4() },
        uModelMatrix: { value: new THREE.Matrix4() },
        uCameraWorldMatrix: { value: new THREE.Matrix4() },
      },
      depthWrite: false,
      depthTest: false,
    });
    this.simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.simMaterial);
    this.simScene.add(this.simQuad);

    // Particle rendering geometry
    const geometry = new THREE.BufferGeometry();
    const uvs = new Float32Array(this.count * 2);
    const randoms = new Float32Array(this.count * 4);

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const i = y * this.size + x;
        uvs[i * 2] = (x + 0.5) / this.size;
        uvs[i * 2 + 1] = (y + 0.5) / this.size;

        randoms[i * 4] = Math.random();
        randoms[i * 4 + 1] = Math.random();
        randoms[i * 4 + 2] = Math.random();
        randoms[i * 4 + 3] = Math.random();
      }
    }

    // Dummy position attribute for points mesh
    const dummyPos = new Float32Array(this.count * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
    geometry.setAttribute('aUv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 4));

    this.matcapTexture = createMatcapTexture();

    this.renderMaterial = new THREE.ShaderMaterial({
      vertexShader: renderVertexShader,
      fragmentShader: renderFragmentShader,
      uniforms: {
        uPositionTexture: { value: null },
        uMatcap: { value: this.matcapTexture },
        uDPR: { value: options.dpr },
        uTime: { value: 0 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(geometry, this.renderMaterial);
    this.pointsGroup.add(this.pointsMesh);
  }

  public initTargets(renderer: THREE.WebGLRenderer) {
    // Render origin texture into both readTarget and writeTarget
    this.simMaterial.uniforms.uIsInitialized.value = 0;
    renderer.setRenderTarget(this.readTarget);
    renderer.render(this.simScene, this.simCamera);
    renderer.setRenderTarget(this.writeTarget);
    renderer.render(this.simScene, this.simCamera);
    renderer.setRenderTarget(null);
    this.simMaterial.uniforms.uIsInitialized.value = 1;
  }

  public updateGaze(mouseX: number, mouseY: number, width: number, height: number) {
    const normX = (mouseX / width) * 2 - 1;
    const normY = (mouseY / height) * 2 - 1;
    this.targetCameraPos.set(
      this.basePosition.x + normX * -1.0,
      this.basePosition.y + normY * 2.0,
      this.basePosition.z
    );
  }

  public step(
    renderer: THREE.WebGLRenderer,
    time: number,
    dt: number,
    fluidVel: THREE.Texture,
    fluidDen: THREE.Texture
  ) {
    // 1. Lerp camera to target
    this.camera.position.lerp(this.targetCameraPos, 0.05);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.pointsGroup.updateMatrixWorld();

    const HZ = dt * 60;

    // Calculate projection matrix: camera projection * inverse camera world
    const invCamWorld = this.camera.matrixWorldInverse;
    const projMat = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      invCamWorld
    );

    // 2. GPGPU Simulation step
    this.simMaterial.uniforms.uCurrentPosition.value = this.readTarget.texture;
    this.simMaterial.uniforms.uFluidVelocity.value = fluidVel;
    this.simMaterial.uniforms.uFluidDensity.value = fluidDen;
    this.simMaterial.uniforms.uTime.value = time;
    this.simMaterial.uniforms.uHZ.value = HZ;
    this.simMaterial.uniforms.uProjectionMatrix.value.copy(projMat);
    this.simMaterial.uniforms.uModelMatrix.value.copy(this.pointsGroup.matrixWorld);
    this.simMaterial.uniforms.uCameraWorldMatrix.value.copy(this.camera.matrixWorld);

    renderer.setRenderTarget(this.writeTarget);
    renderer.render(this.simScene, this.simCamera);
    renderer.setRenderTarget(null);

    // Swap targets
    const temp = this.readTarget;
    this.readTarget = this.writeTarget;
    this.writeTarget = temp;

    // 3. Update render material
    this.renderMaterial.uniforms.uPositionTexture.value = this.readTarget.texture;
    this.renderMaterial.uniforms.uTime.value = time;
  }

  public resize(width: number, height: number, dpr: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderMaterial.uniforms.uDPR.value = dpr;
  }

  public dispose() {
    this.readTarget.dispose();
    this.writeTarget.dispose();
    this.matcapTexture.dispose();
    this.simMaterial.dispose();
    this.renderMaterial.dispose();
    this.simQuad.geometry.dispose();
    this.pointsMesh.geometry.dispose();
  }
}
