import * as THREE from '../vendor/three.module.js';
import { gsap } from '../vendor/gsap.js';
import { ScrollTrigger } from '../vendor/ScrollTrigger.js';

if (gsap && ScrollTrigger && gsap.registerPlugin) {
  gsap.registerPlugin(ScrollTrigger);
}

export class CameraController {
  constructor(appScene, anatomyManager) {
    this.appScene = appScene;
    this.camera = appScene.camera;
    this.controls = appScene.controls;
    this.anatomy = anatomyManager;

    this.isTransitioning = false;
    this.currentMode = 'explore'; // explore, systems, organs, journeys, quiz
    this.wheelMode = 'scroll'; // 'scroll' (scrubs anatomy layers) or 'zoom' (3D camera dolly)

    // Base waypoints calibrated for human height (Y: 0.0 - 1.71m, center Y: 0.86m)
    // Model occupies 70–80% viewport height
    this.scrollWaypoints = [
      { p: 0.0, cam: [0, 0.92, 2.65], target: [0, 0.86, 0] },     // 100% Complete human body
      { p: 0.20, cam: [0, 1.10, 2.30], target: [0, 0.95, 0] },    // 80% Skin transparency
      { p: 0.40, cam: [0.12, 1.15, 1.95], target: [0, 1.05, 0] }, // 60% Muscular layer
      { p: 0.60, cam: [-0.10, 1.18, 1.65], target: [0, 1.12, 0] },// 40% Skeletal layer
      { p: 0.80, cam: [0.22, 1.12, 1.80], target: [0, 1.08, 0] }, // 20% Organs separating
      { p: 1.0, cam: [0, 1.05, 2.85], target: [0, 0.95, 0] }      // 0% Controlled exploded anatomy
    ];

    this.currentScroll = 0;

    // Connect AnatomyManager progress updates to CameraController
    if (this.anatomy) {
      this.anatomy.onProgressChange = (p) => {
        this.currentScroll = p;
        this.updateCameraForProgress(p);
      };
    }

    this.initScrollInteractions();
  }

  initScrollInteractions() {
    // 2. Prevent accidental browser page scrolling & enable seamless scroll-driven journey
    const canvas = this.appScene.canvas;

    window.addEventListener('wheel', (e) => {
      // Holding Shift or in 'zoom' mode: allow OrbitControls zoom
      if (e.shiftKey || this.wheelMode === 'zoom') {
        this.controls.enableZoom = true;
        return;
      }

      // Default explore mode: wheel scrolls smoothly through the anatomy stages
      if (this.currentMode === 'explore' && !this.isTransitioning) {
        if (e.target === canvas || e.target.id === 'scroll-track' || e.target.closest('#depth-hud')) {
          e.preventDefault();
          const delta = e.deltaY * 0.00085;
          const next = Math.max(0, Math.min(1, this.currentScroll + delta));
          this.applyScrollProgress(next);
        }
      }
    }, { passive: false });

    // Touch interactions on canvas: OrbitControls handles one finger rotate & pinch zoom
    canvas.addEventListener('touchmove', (e) => {
      // Prevent browser default pull-to-refresh
      if (e.touches.length > 0) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  setWheelMode(mode) {
    this.wheelMode = mode;
    this.controls.enableZoom = (mode === 'zoom');
  }

  applyScrollProgress(progress) {
    this.currentScroll = Math.max(0, Math.min(1, progress));
    this.anatomy.setScrollProgress(this.currentScroll);
    this.updateCameraForProgress(this.currentScroll);
  }

  updateCameraForProgress(progress) {
    // Interpolate camera position and target between waypoints
    const wp = this.scrollWaypoints;
    let idx = 0;
    while (idx < wp.length - 2 && progress > wp[idx + 1].p) {
      idx++;
    }

    const start = wp[idx];
    const end = wp[idx + 1];
    const segmentT = Math.max(0, Math.min(1, (progress - start.p) / (end.p - start.p)));

    // Smooth Hermite ease
    const easeT = segmentT * segmentT * (3 - 2 * segmentT);

    const targetPos = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...start.cam),
      new THREE.Vector3(...end.cam),
      easeT
    );

    const targetLook = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...start.target),
      new THREE.Vector3(...end.target),
      easeT
    );

    // Smoothly apply if user is not actively dragging OrbitControls
    if (!this.controls.state || this.controls.state === -1) {
      this.camera.position.lerp(targetPos, 0.10);
      this.controls.target.lerp(targetLook, 0.10);
    }
  }

  /**
   * 11. CAMERA FUNCTIONS REQUIRED
   * - focusOnPart(mesh)
   * - focusOnOrgan(mesh)
   * - resetCamera()
   * - explodeAnatomy()
   * - resetAnatomy()
   */
  focusOnPart(mesh, customDistance = null) {
    return this.flyToMesh(mesh, customDistance);
  }

  focusOnOrgan(mesh, customDistance = null) {
    return this.flyToMesh(mesh, customDistance || 0.75);
  }

  resetCamera() {
    this.flyToCoordinates([0, 0.92, 2.65], [0, 0.86, 0], 1.4);
    this.anatomy.resetSelection();
    this.anatomy.setSystemFilter('all');
  }

  resetView() {
    this.resetCamera();
  }

  explodeAnatomy(duration = 1.8) {
    this.anatomy.explodeAnatomy(duration);
    const endWp = this.scrollWaypoints[this.scrollWaypoints.length - 1];
    this.flyToCoordinates(endWp.cam, endWp.target, duration);
  }

  resetAnatomy(duration = 1.8) {
    this.anatomy.resetAnatomy(duration);
    const startWp = this.scrollWaypoints[0];
    this.flyToCoordinates(startWp.cam, startWp.target, duration);
  }

  flyToMesh(mesh, customDistance = null) {
    if (!mesh) return Promise.resolve();

    this.isTransitioning = true;
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const dist = customDistance || Math.max(0.65, maxDim * 2.1);

    // Calculate forward vantage offset
    const offset = new THREE.Vector3(0, 0.04, dist);
    const targetCamPos = center.clone().add(offset);

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          this.isTransitioning = false;
          resolve();
        }
      });

      tl.to(this.camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: 1.5,
        ease: 'power3.inOut'
      }, 0);

      tl.to(this.controls.target, {
        x: center.x,
        y: center.y,
        z: center.z,
        duration: 1.5,
        ease: 'power3.inOut'
      }, 0);
    });
  }

  flyToCoordinates(pos, target, duration = 1.5) {
    this.isTransitioning = true;
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.controls.target);

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          this.isTransitioning = false;
          resolve();
        }
      });

      tl.to(this.camera.position, {
        x: pos[0],
        y: pos[1],
        z: pos[2],
        duration: duration,
        ease: 'power3.inOut'
      }, 0);

      tl.to(this.controls.target, {
        x: target[0],
        y: target[1],
        z: target[2],
        duration: duration,
        ease: 'power3.inOut'
      }, 0);
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'explore') {
      this.applyScrollProgress(this.currentScroll);
    }
  }
}
