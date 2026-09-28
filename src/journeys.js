import * as THREE from '../vendor/three.module.js';
import { JOURNEYS_DATA } from './config.js';
import { sound } from './audio.js';

export class BodyJourneys {
  constructor(appScene, cameraController, onMilestoneReached) {
    this.appScene = appScene;
    this.scene = appScene.scene;
    this.cameraController = cameraController;
    this.onMilestoneReached = onMilestoneReached;

    this.group = new THREE.Group();
    this.group.name = 'JourneysGroup';
    this.group.visible = false;
    this.scene.add(this.group);

    this.currentJourney = null;
    this.currentMilestoneIdx = 0;
    this.isPlaying = false;
    this.progress = 0; // 0.0 to 1.0 along spline
    this.speed = 0.08;

    this.curve = null;
    this.splineMesh = null;
    this.particles = null;
    this.particlePositions = [];
    this.particleCount = 280;

    this.initParticleStream();
  }

  initParticleStream() {
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particleCount * 3);
    const col = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions.push(Math.random());
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      col[i * 3] = 0.0;
      col[i * 3 + 1] = 0.94;
      col[i * 3 + 2] = 1.0;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(0,240,255,0.9)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.035,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geom, mat);
    this.group.add(this.particles);
  }

  startJourney(journeyId) {
    const data = JOURNEYS_DATA[journeyId];
    if (!data) return;

    this.currentJourney = data;
    this.currentMilestoneIdx = 0;
    this.progress = 0;
    this.isPlaying = true;
    this.group.visible = true;

    // Build CatmullRomCurve3 from milestone points
    const points = data.milestones.map((m) => new THREE.Vector3(...m.pos));
    this.curve = new THREE.CatmullRomCurve3(points, journeyId === 'blood'); // Closed loop for blood

    // Create glowing neon tube along spline
    if (this.splineMesh) {
      this.group.remove(this.splineMesh);
      this.splineMesh.geometry.dispose();
      this.splineMesh.material.dispose();
    }

    const tubeGeom = new THREE.TubeGeometry(this.curve, 80, 0.007, 8, journeyId === 'blood');
    const splineColor = journeyId === 'food' ? 0xffaa00 : journeyId === 'blood' ? 0xff2244 : 0x00f0ff;
    const tubeMat = new THREE.MeshBasicMaterial({
      color: splineColor,
      transparent: true,
      opacity: 0.45,
      wireframe: true
    });
    this.splineMesh = new THREE.Mesh(tubeGeom, tubeMat);
    this.group.add(this.splineMesh);

    // Color particles based on journey
    const colArray = this.particles.geometry.attributes.color.array;
    const baseCol = new THREE.Color(splineColor);
    for (let i = 0; i < this.particleCount; i++) {
      colArray[i * 3] = baseCol.r;
      colArray[i * 3 + 1] = baseCol.g;
      colArray[i * 3 + 2] = baseCol.b;
    }
    this.particles.geometry.attributes.color.needsUpdate = true;

    // Fly camera to first milestone
    this.jumpToMilestone(0);
    sound.playSelect();
  }

  jumpToMilestone(idx) {
    if (!this.currentJourney) return;
    idx = Math.max(0, Math.min(this.currentJourney.milestones.length - 1, idx));
    this.currentMilestoneIdx = idx;

    const ms = this.currentJourney.milestones[idx];
    this.progress = idx / (this.currentJourney.milestones.length - 1);

    this.cameraController.flyToCoordinates(ms.cam, ms.pos, 1.4);

    if (this.onMilestoneReached) {
      this.onMilestoneReached(ms, idx, this.currentJourney.milestones.length);
    }
  }

  nextMilestone() {
    if (!this.currentJourney) return;
    if (this.currentMilestoneIdx < this.currentJourney.milestones.length - 1) {
      this.jumpToMilestone(this.currentMilestoneIdx + 1);
    } else {
      // Loop back to start
      this.jumpToMilestone(0);
    }
  }

  prevMilestone() {
    if (!this.currentJourney) return;
    if (this.currentMilestoneIdx > 0) {
      this.jumpToMilestone(this.currentMilestoneIdx - 1);
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  stop() {
    this.isPlaying = false;
    this.group.visible = false;
    this.currentJourney = null;
  }

  update(delta, time) {
    if (!this.group.visible || !this.curve) return;

    // Stream particles along spline curve
    const posArray = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      this.particlePositions[i] = (this.particlePositions[i] + delta * 0.25) % 1.0;
      const pt = this.curve.getPointAt(this.particlePositions[i]);
      posArray[i * 3] = pt.x + (Math.sin(time * 0.005 + i) * 0.005);
      posArray[i * 3 + 1] = pt.y + (Math.cos(time * 0.005 + i) * 0.005);
      posArray[i * 3 + 2] = pt.z;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // If auto-playing continuous camera flythrough:
    if (this.isPlaying && this.currentJourney) {
      this.progress = (this.progress + delta * this.speed * 0.5) % 1.0;
      const camTarget = this.curve.getPointAt(this.progress);
      // Look slightly ahead
      const lookAhead = (this.progress + 0.04) % 1.0;
      const lookTarget = this.curve.getPointAt(lookAhead);

      // Camera flies slightly offset from the spline
      const camPos = new THREE.Vector3(
        camTarget.x + Math.sin(this.progress * Math.PI * 2) * 0.15,
        camTarget.y + 0.06,
        camTarget.z + 0.32
      );

      this.appScene.camera.position.lerp(camPos, 0.05);
      this.appScene.controls.target.lerp(lookTarget, 0.05);

      // Check milestones
      const numMs = this.currentJourney.milestones.length;
      const currentExpectedMs = Math.floor(this.progress * numMs);
      if (currentExpectedMs !== this.currentMilestoneIdx && currentExpectedMs < numMs) {
        this.currentMilestoneIdx = currentExpectedMs;
        if (this.onMilestoneReached) {
          this.onMilestoneReached(
            this.currentJourney.milestones[currentExpectedMs],
            currentExpectedMs,
            numMs
          );
        }
      }
    }
  }
}
