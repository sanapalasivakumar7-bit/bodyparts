import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';

export class AppScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040812);
    this.scene.fog = new THREE.FogExp2(0x040812, 0.16);

    // Camera — Framing human model to occupy 70-80% viewport height
    this.camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.05,
      100
    );
    // Initial camera positioned for exact frontal view (eye level at model center)
    this.camera.position.set(0, 0.86, 2.5);
    this.cameraTarget = new THREE.Vector3(0, 0.86, 0);
    this.camera.lookAt(this.cameraTarget);

    // 360 Degree OrbitControls: Left drag = rotate, Wheel = zoom, Right drag = pan
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 0.45;
    this.controls.maxDistance = 5.2;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.minPolarAngle = Math.PI * 0.08;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    this.controls.target.copy(this.cameraTarget);

    // Lighting
    this.initLights();

    // Subtle 3D Futuristic Environment
    this.initEnvironment();

    // Interaction raycaster
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);

    // Dynamic animation callbacks
    this.updateCallbacks = [];

    // Resize event
    window.addEventListener('resize', () => this.onResize());
  }

  initLights() {
    // 1. Soft Ambient Fill
    this.ambientLight = new THREE.AmbientLight(0x101b33, 1.4);
    this.scene.add(this.ambientLight);

    // 2. Cyan Key Light (Front-Right Top)
    this.keyLight = new THREE.DirectionalLight(0xdcf8ff, 3.2);
    this.keyLight.position.set(2.8, 3.6, 3.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // 3. Electric Blue Secondary Light (Left-Front)
    this.fillLight = new THREE.DirectionalLight(0x00c8ff, 1.8);
    this.fillLight.position.set(-3.2, 2.0, 2.2);
    this.scene.add(this.fillLight);

    // 4. Subtle Violet Rim Light (Behind-Top)
    this.rimLight = new THREE.DirectionalLight(0xa855f7, 3.8);
    this.rimLight.position.set(0, 3.2, -3.5);
    this.scene.add(this.rimLight);

    // 5. Floor Upward Point Glow (Deep Cyan/Turquoise)
    this.floorGlow = new THREE.PointLight(0x00f0ff, 1.8, 4.5, 1.2);
    this.floorGlow.position.set(0, 0.05, 0);
    this.scene.add(this.floorGlow);

    // 6. Camera-mounted diagnostic flashlight
    this.headLight = new THREE.PointLight(0xffffff, 0.6, 4.0);
    this.camera.add(this.headLight);
    this.scene.add(this.camera);
  }

  initEnvironment() {
    // Holographic Circular Energy Rings on Floor
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, 0.001, 0);

    const ringRadii = [0.45, 0.90, 1.45, 2.1];
    ringRadii.forEach((r, idx) => {
      const ringGeom = new THREE.RingGeometry(r - 0.003, r + 0.003, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x00f0ff : 0x8b5cf6,
        transparent: true,
        opacity: 0.25 - idx * 0.04,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ringsGroup.add(ring);
    });

    // Holographic Polar Grid
    const polarGrid = new THREE.PolarGridHelper(2.5, 16, 8, 64, 0x00f0ff, 0x1a2b4c);
    polarGrid.material.transparent = true;
    polarGrid.material.opacity = 0.18;
    polarGrid.position.y = 0.002;
    ringsGroup.add(polarGrid);

    this.scene.add(ringsGroup);
    this.ringsGroup = ringsGroup;

    // Floating Bio-Luminescent Dust Particles
    const particleCount = 1200;
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color(0x00f0ff);
    const violet = new THREE.Color(0xa855f7);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Cylinder/spherical distribution around the human body
      const theta = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 2.2;
      posArray[i3] = Math.cos(theta) * radius;
      posArray[i3 + 1] = Math.random() * 2.5 - 0.2;
      posArray[i3 + 2] = Math.sin(theta) * radius;

      // Color variation
      const randColor = Math.random();
      const c = randColor > 0.6 ? cyan : randColor > 0.2 ? violet : white;
      colorArray[i3] = c.r;
      colorArray[i3 + 1] = c.g;
      colorArray[i3 + 2] = c.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    // Create circular dot texture programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(56,228,238,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.024,
      map: particleTexture,
      transparent: true,
      opacity: 0.65,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(particleGeom, particleMat);
    this.scene.add(this.particles);

    // Subtle Holographic Vertical Measurement Ruler (Side scale)
    const rulerGroup = new THREE.Group();
    rulerGroup.position.set(-0.85, 0, 0);

    const linePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.72, 0)];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.25 });
    const line = new THREE.Line(lineGeom, lineMat);
    rulerGroup.add(line);

    for (let y = 0; y <= 1.7; y += 0.2) {
      const tickPoints = [new THREE.Vector3(-0.02, y, 0), new THREE.Vector3(0.02, y, 0)];
      const tickGeom = new THREE.BufferGeometry().setFromPoints(tickPoints);
      const tick = new THREE.Line(tickGeom, lineMat);
      rulerGroup.add(tick);
    }
    this.scene.add(rulerGroup);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  addUpdateCallback(fn) {
    this.updateCallbacks.push(fn);
  }

  render(time) {
    const delta = (time - (this.lastTime || time)) * 0.001;
    this.lastTime = time;

    // Gently rotate floor energy rings and drift particles
    if (this.ringsGroup) {
      this.ringsGroup.rotation.y += 0.0015;
    }
    if (this.particles) {
      this.particles.rotation.y += 0.0008;
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += Math.sin(time * 0.001 + i) * 0.0004;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Update controls
    this.controls.update();

    // Run user callbacks
    for (const cb of this.updateCallbacks) {
      cb(delta, time);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
