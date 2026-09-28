import * as THREE from '../vendor/three.module.js';
import { QUIZ_QUESTIONS } from './config.js';
import { sound } from './audio.js';

export class AnatomyQuiz {
  constructor(appScene, anatomyManager, cameraController, onQuizUpdate) {
    this.appScene = appScene;
    this.scene = appScene.scene;
    this.anatomy = anatomyManager;
    this.cameraController = cameraController;
    this.onQuizUpdate = onQuizUpdate;

    this.active = false;
    this.currentIdx = 0;
    this.score = 0;
    this.streak = 0;
    this.hasAnswered = false;

    // 3D holographic feedback ring mesh in scene
    const ringGeom = new THREE.RingGeometry(0.08, 0.12, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.feedbackRing = new THREE.Mesh(ringGeom, ringMat);
    this.feedbackRing.visible = false;
    this.scene.add(this.feedbackRing);
  }

  start() {
    this.active = true;
    this.currentIdx = 0;
    this.score = 0;
    this.streak = 0;
    this.hasAnswered = false;

    this.cameraController.setMode('quiz');
    // Position camera for comfortable organ viewing
    this.cameraController.flyToCoordinates([0, 1.25, 2.2], [0, 1.15, 0], 1.5);
    this.loadQuestion();
  }

  loadQuestion() {
    if (this.currentIdx >= QUIZ_QUESTIONS.length) {
      // Completed all questions!
      if (this.onQuizUpdate) {
        this.onQuizUpdate({
          isComplete: true,
          score: this.score,
          total: QUIZ_QUESTIONS.length
        });
      }
      return;
    }

    this.hasAnswered = false;
    const q = QUIZ_QUESTIONS[this.currentIdx];

    // Ensure exploded anatomy or relevant organs are clearly visible
    this.anatomy.setScrollProgress(0.85);

    if (this.onQuizUpdate) {
      this.onQuizUpdate({
        isComplete: false,
        index: this.currentIdx + 1,
        total: QUIZ_QUESTIONS.length,
        question: q.question,
        hint: q.hint,
        score: this.score,
        streak: this.streak,
        feedback: null
      });
    }
  }

  handleMeshClick(clickedMesh) {
    if (!this.active || this.hasAnswered || !clickedMesh) return false;

    const q = QUIZ_QUESTIONS[this.currentIdx];
    const meshName = (clickedMesh.name || '').toLowerCase();
    const info = clickedMesh.userData.info;
    const infoId = info ? info.id : '';

    const isMatch =
      meshName.includes(q.targetMesh.toLowerCase()) ||
      infoId.includes(q.targetKey.toLowerCase()) ||
      (q.alternativeMeshes && q.alternativeMeshes.some(m => meshName.includes(m.toLowerCase())));

    if (isMatch) {
      // Correct!
      this.hasAnswered = true;
      this.score++;
      this.streak++;
      sound.playSuccess();
      this.trigger3DFeedback(clickedMesh, true);

      if (this.onQuizUpdate) {
        this.onQuizUpdate({
          isComplete: false,
          index: this.currentIdx + 1,
          total: QUIZ_QUESTIONS.length,
          question: q.question,
          score: this.score,
          streak: this.streak,
          feedback: {
            correct: true,
            title: 'ACCURATE IDENTIFICATION',
            text: q.explanation
          }
        });
      }
      return true;
    } else {
      // Incorrect attempt
      this.streak = 0;
      sound.playError();
      this.trigger3DFeedback(clickedMesh, false);

      if (this.onQuizUpdate) {
        this.onQuizUpdate({
          isComplete: false,
          index: this.currentIdx + 1,
          total: QUIZ_QUESTIONS.length,
          question: q.question,
          score: this.score,
          streak: this.streak,
          feedback: {
            correct: false,
            title: 'TRY AGAIN',
            text: `Selected: ${clickedMesh.userData.info?.name || clickedMesh.name}. ${q.hint}`
          }
        });
      }
      return false;
    }
  }

  nextQuestion() {
    this.currentIdx++;
    this.loadQuestion();
  }

  trigger3DFeedback(mesh, isCorrect) {
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());

    this.feedbackRing.position.copy(center);
    this.feedbackRing.position.z += 0.08;
    this.feedbackRing.lookAt(this.appScene.camera.position);
    this.feedbackRing.material.color.setHex(isCorrect ? 0x00ff88 : 0xff4444);
    this.feedbackRing.material.opacity = 1.0;
    this.feedbackRing.scale.set(1, 1, 1);
    this.feedbackRing.visible = true;

    // Animate expansion and fade out
    let startTime = performance.now();
    const animateRing = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.8) {
        const t = elapsed / 0.8;
        this.feedbackRing.scale.setScalar(1.0 + t * 2.2);
        this.feedbackRing.material.opacity = 1.0 - t;
        requestAnimationFrame(animateRing);
      } else {
        this.feedbackRing.visible = false;
      }
    };
    animateRing();
  }

  stop() {
    this.active = false;
    this.feedbackRing.visible = false;
  }
}
