import { AppScene } from './scene.js';
import { AnatomyManager } from './anatomy.js';
import { CameraController } from './cameraController.js';
import { OrganExplorer } from './organExplorer.js';
import { BodyJourneys } from './journeys.js';
import { AnatomyQuiz } from './quiz.js';
import { UIManager } from './ui.js';
import { gsap } from '../vendor/gsap.js';
import { sound } from './audio.js';

class BodyverseApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBar = document.getElementById('loading-bar-fill');
    this.loadingPercent = document.getElementById('loading-percent');
    this.loadingStatus = document.getElementById('loading-status-text');
    this.errorScreen = document.getElementById('error-screen');

    this.scene = null;
    this.anatomy = null;
    this.cameraCtrl = null;
    this.organExp = null;
    this.journeys = null;
    this.quiz = null;
    this.ui = null;

    this.isLoaded = false;
    this.introActive = true;

    this.init();
  }

  async init() {
    try {
      // 1. Initialize Scene & WebGL
      this.scene = new AppScene(this.canvas);

      // 2. Load Anatomy with Progress
      this.anatomy = new AnatomyManager(
        this.scene,
        (progress, isComplete) => this.onLoadProgress(progress, isComplete),
        (err) => this.onLoadError(err)
      );

      // 3. Camera Controller with GSAP ScrollTrigger
      this.cameraCtrl = new CameraController(this.scene, this.anatomy);

      // 4. Dedicated 3D Organ Explorer
      this.organExp = new OrganExplorer(
        this.scene,
        this.cameraCtrl,
        (organData) => {
          if (this.ui) this.ui.showInfoPanel(organData);
        }
      );

      // 5. 3D Body Journeys (Food, Air, Blood)
      this.journeys = new BodyJourneys(
        this.scene,
        this.cameraCtrl,
        (milestone, idx, total) => {
          if (this.ui) this.ui.updateJourneyMilestone(milestone, idx, total);
        }
      );

      // 6. 3D Anatomy Quiz
      this.quiz = new AnatomyQuiz(
        this.scene,
        this.anatomy,
        this.cameraCtrl,
        (data) => {
          if (this.ui) this.ui.updateQuizState(data);
        }
      );

      // 7. UI Manager
      this.ui = new UIManager({
        anatomyManager: this.anatomy,
        cameraController: this.cameraCtrl,
        organExplorer: this.organExp,
        bodyJourneys: this.journeys,
        anatomyQuiz: this.quiz
      });

      // 8. Event Listeners for Interaction
      this.bindInteractions();

      // Expose 11. CAMERA FUNCTIONS directly on the app instance
      this.focusOnPart = (mesh) => this.cameraCtrl.focusOnPart(mesh);
      this.focusOnOrgan = (mesh) => this.cameraCtrl.focusOnOrgan(mesh);
      this.resetCamera = () => this.cameraCtrl.resetCamera();
      this.explodeAnatomy = (d) => this.cameraCtrl.explodeAnatomy(d);
      this.resetAnatomy = (d) => this.cameraCtrl.resetAnatomy(d);

      // 9. Start Render Loop
      this.startRenderLoop();

    } catch (e) {
      console.error('Fatal initialization error:', e);
      this.onLoadError(e);
    }
  }

  onLoadProgress(progress, isComplete) {
    const pct = Math.round(progress * 100);
    if (this.loadingBar) this.loadingBar.style.width = `${pct}%`;
    if (this.loadingPercent) this.loadingPercent.textContent = `${pct}%`;

    const statuses = [
      'Calibrating spatial coordinates...',
      'Synthesizing skeletal framework...',
      'Mapping neural synaptic pathways...',
      'Constructing cardiovascular geometry...',
      'Finalizing 3D educational universe...'
    ];
    const sIdx = Math.min(statuses.length - 1, Math.floor(progress * statuses.length));
    if (this.loadingStatus) this.loadingStatus.textContent = statuses[sIdx];

    if (isComplete) {
      setTimeout(() => {
        this.organExp.attachMeshesFromMaster(this.anatomy.registry);
        this.playIntroSequence();
      }, 400);
    }
  }

  onLoadError(err) {
    console.error('Model loading error:', err);
    if (this.loadingScreen) this.loadingScreen.style.display = 'none';
    if (this.errorScreen) this.errorScreen.classList.add('visible');
  }

  playIntroSequence() {
    this.isLoaded = true;

    // SCENE 01 — 3D INTRO
    // Start in dark futuristic 3D environment, camera moves forward,
    // transform silhouette -> modern human -> anatomical human -> internal anatomy -> BODYVERSE
    const tl = gsap.timeline({
      onComplete: () => {
        this.introActive = false;
        // Reveal HUD
        document.body.classList.add('ready');
      }
    });

    // 1. Fade out preloader
    tl.to(this.loadingScreen, {
      opacity: 0,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => {
        this.loadingScreen.style.display = 'none';
      }
    });

    // 2. Initial silhouette state
    this.anatomy.setScrollProgress(0.0);

    // 3. Cinematic forward dolly zoom arriving at full human centered in viewport (70-80% height)
    tl.fromTo(
      this.scene.camera.position,
      { x: 0, y: 1.10, z: 5.2 },
      { x: 0, y: 0.92, z: 2.65, duration: 2.6, ease: 'power3.out' },
      0.2
    );

    // 4. Flash intro overlay typography
    const introCard = document.getElementById('intro-floating-text');
    if (introCard) {
      tl.to(introCard, { opacity: 1, duration: 0.8 }, 0.5);
      tl.to(introCard, { opacity: 0, duration: 0.8 }, 2.4);
    }
  }

  bindInteractions() {
    let mouseMoved = false;
    let mouseDownPos = { x: 0, y: 0 };

    window.addEventListener('pointerdown', (e) => {
      mouseMoved = false;
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y) > 6) {
        mouseMoved = true;
      }
      this.anatomy.updatePointer(e.clientX, e.clientY);
      if (this.ui) {
        this.ui.updateHoverLabel(this.anatomy.hoveredMesh, e.clientX, e.clientY);
      }
    });

    window.addEventListener('pointerup', (e) => {
      // If it was a drag, don't trigger click selection
      if (mouseMoved) return;

      const hit = this.anatomy.checkRaycast();
      if (!hit) {
        if (this.ui && this.ui.activeMode === 'explore') {
          // If clicked empty space, dismiss info panel
          this.ui.hideInfoPanel();
          this.anatomy.resetSelection();
        }
        return;
      }

      if (this.ui.activeMode === 'quiz') {
        this.quiz.handleMeshClick(hit);
      } else {
        this.anatomy.selectMesh(hit);
        this.cameraCtrl.flyToMesh(hit);
        if (this.ui) {
          this.ui.showInfoPanel(hit.userData.info || {
            name: hit.name,
            system: 'Anatomy',
            function: 'Structural anatomical component.',
            description: 'Explorable 3D human anatomy mesh.'
          });
        }
      }
    });
  }

  startRenderLoop() {
    const loop = (time) => {
      requestAnimationFrame(loop);

      // Update raycast
      if (this.isLoaded && !this.introActive) {
        this.anatomy.checkRaycast();
      }

      // Update organ procedural pulse & journeys
      this.organExp.update(0.016, time);
      this.journeys.update(0.016, time);

      // Update UI depth indicator
      if (this.ui && this.ui.activeMode === 'explore') {
        this.ui.updateDepthIndicator(this.cameraCtrl.currentScroll);
      }

      // Render Three.js scene
      this.scene.render(time);
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.bodyverse = new BodyverseApp();
});
