import { SYSTEMS, ANATOMY_DATA } from './config.js';
import { sound } from './audio.js';

export class UIManager {
  constructor({
    anatomyManager,
    cameraController,
    organExplorer,
    bodyJourneys,
    anatomyQuiz
  }) {
    this.anatomy = anatomyManager;
    this.camera = cameraController;
    this.organs = organExplorer;
    this.journeys = bodyJourneys;
    this.quiz = anatomyQuiz;

    this.activeMode = 'explore';
    this.searchOpen = false;

    this.bindDOM();
  }

  bindDOM() {
    // 1. Navigation Dock Buttons (Explore, Systems, Organs, Journeys, Quiz)
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sound.playSelect();
      });
    });

    // 2. Systems Filter Buttons (Skeletal, Muscular, Nervous, Respiratory, Circulatory, Digestive, Urinary, All)
    const sysButtons = document.querySelectorAll('.sys-btn');
    sysButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sysId = btn.dataset.system;
        sysButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.anatomy.setSystemFilter(sysId);

        // Find representative mesh for system and focus camera gently
        const sampleKeys = {
          'skeletal': 'skull',
          'muscular': 'muscles',
          'circulatory': 'heart',
          'respiratory': 'left_lung',
          'nervous': 'brain',
          'digestive': 'stomach',
          'urinary': 'left_kidney'
        };
        if (sysId !== 'all' && sampleKeys[sysId]) {
          const m = this.anatomy.focusOnKey(sampleKeys[sysId]);
          if (m && m.userData.info) {
            this.showInfoPanel(m.userData.info);
          }
        } else {
          this.camera.resetCamera();
          this.hideInfoPanel();
        }
      });
    });

    // 3. Search Bar & Autocomplete
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const searchSuggestions = document.getElementById('search-suggestions');

    const searchKeys = Object.keys(ANATOMY_DATA).map(key => ({
      key,
      name: ANATOMY_DATA[key].name,
      system: ANATOMY_DATA[key].system
    }));

    const updateSuggestions = (query) => {
      if (!query || query.trim() === '') {
        searchSuggestions.innerHTML = '';
        searchSuggestions.classList.remove('open');
        return;
      }
      const q = query.toLowerCase().trim();
      const matches = searchKeys.filter(
        item => item.name.toLowerCase().includes(q) || item.key.includes(q) || item.system.toLowerCase().includes(q)
      ).slice(0, 6);

      if (matches.length === 0) {
        searchSuggestions.innerHTML = `<div class="suggestion-item no-match">No matching anatomy found</div>`;
      } else {
        searchSuggestions.innerHTML = matches.map(m => `
          <div class="suggestion-item" data-key="${m.key}">
            <span class="suggestion-name">${m.name}</span>
            <span class="suggestion-sys">${m.system}</span>
          </div>
        `).join('');
      }
      searchSuggestions.classList.add('open');
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        updateSuggestions(e.target.value);
      });

      searchInput.addEventListener('focus', (e) => {
        updateSuggestions(e.target.value);
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-form') && searchSuggestions) {
        searchSuggestions.classList.remove('open');
      }
    });

    if (searchSuggestions) {
      searchSuggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item');
        if (item && item.dataset.key) {
          this.executeSearch(item.dataset.key);
          if (searchInput) searchInput.value = item.querySelector('.suggestion-name').textContent;
          searchSuggestions.classList.remove('open');
        }
      });
    }

    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (q) {
          this.executeSearch(q);
          if (searchSuggestions) searchSuggestions.classList.remove('open');
        }
      });
    }

    // 4. Reset Camera View Button
    const resetBtn = document.getElementById('btn-reset-view');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.camera.resetCamera();
        this.hideInfoPanel();
        sound.playSelect();
      });
    }

    // 5. Audio Toggle Button
    const audioBtn = document.getElementById('btn-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isEnabled = sound.toggle();
        audioBtn.classList.toggle('active', isEnabled);
        audioBtn.setAttribute('title', isEnabled ? 'Sound On' : 'Sound Off');
        const icon = audioBtn.querySelector('.audio-icon');
        if (icon) {
          icon.textContent = isEnabled ? '🔊' : '🔇';
        }
      });
    }

    // 6. Fullscreen Toggle
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fsBtn.classList.add('active');
        } else {
          document.exitFullscreen().catch(() => {});
          fsBtn.classList.remove('active');
        }
      });
    }

    // 7. Wheel Interaction Mode Toggle (Scroll Layers vs 3D Zoom)
    const wheelModeBtn = document.getElementById('btn-wheel-mode');
    if (wheelModeBtn) {
      wheelModeBtn.addEventListener('click', () => {
        const nextMode = this.camera.wheelMode === 'scroll' ? 'zoom' : 'scroll';
        this.camera.setWheelMode(nextMode);
        wheelModeBtn.classList.toggle('zoom-active', nextMode === 'zoom');
        wheelModeBtn.innerHTML = nextMode === 'zoom' ? '🔍 <span>ZOOM</span>' : '↕ <span>LAYERS</span>';
        this.showToast(`Mouse Wheel Mode: ${nextMode === 'zoom' ? '3D CAMERA ZOOM' : 'ANATOMY LAYERS SCROLL'}`);
        sound.playSelect();
      });
    }

    // 8. Info Panel Close & Action Buttons
    const closeInfoBtn = document.getElementById('info-close');
    if (closeInfoBtn) {
      closeInfoBtn.addEventListener('click', () => {
        this.hideInfoPanel();
        this.anatomy.resetSelection();
      });
    }

    const focusBtn = document.getElementById('info-focus-btn');
    if (focusBtn) {
      focusBtn.addEventListener('click', () => {
        if (this.anatomy.selectedMesh) {
          this.camera.focusOnPart(this.anatomy.selectedMesh, 0.65);
          sound.playSelect();
        }
      });
    }

    const infoResetBtn = document.getElementById('info-reset-btn');
    if (infoResetBtn) {
      infoResetBtn.addEventListener('click', () => {
        this.camera.resetCamera();
        this.hideInfoPanel();
        sound.playSelect();
      });
    }

    // 9. Organ Explorer Controls (Heart, Brain, Lungs, Liver, Stomach, Kidneys, Intestines)
    const organTabs = document.querySelectorAll('.organ-tab');
    organTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.organ;
        organTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Focus organ directly in master 3D human model
        const mesh = this.anatomy.focusOnKey(key);
        if (mesh) {
          this.camera.focusOnOrgan(mesh, 0.70);
          this.showInfoPanel(mesh.userData.info || ANATOMY_DATA[key]);
        }
        sound.playSelect();
      });
    });

    const organResetBtn = document.getElementById('organ-reset-btn');
    if (organResetBtn) {
      organResetBtn.addEventListener('click', () => {
        organTabs.forEach(t => t.classList.remove('active'));
        this.camera.resetCamera();
        this.hideInfoPanel();
        sound.playSelect();
      });
    }

    // 10. Depth HUD Controls & Exploded Anatomy Toggle
    const explodeToggleBtn = document.getElementById('btn-explode-toggle');
    if (explodeToggleBtn) {
      explodeToggleBtn.addEventListener('click', () => {
        const isExploded = this.camera.currentScroll > 0.5;
        if (isExploded) {
          this.camera.resetAnatomy(1.8);
          explodeToggleBtn.textContent = '💥 EXPLODE';
          explodeToggleBtn.classList.remove('active');
        } else {
          this.camera.explodeAnatomy(1.8);
          explodeToggleBtn.textContent = '🔄 ASSEMBLE';
          explodeToggleBtn.classList.add('active');
        }
        sound.playSelect();
      });
    }

    // Interactive Depth Track Scrubbing
    const depthTrack = document.getElementById('depth-track-clickable');
    if (depthTrack) {
      let isDragging = false;

      const handleDepthScrub = (clientY) => {
        const rect = depthTrack.getBoundingClientRect();
        // bottom is 0%, top is 100%
        const normalized = 1.0 - (clientY - rect.top) / rect.height;
        const clamped = Math.max(0, Math.min(1, normalized));
        this.camera.applyScrollProgress(clamped);
      };

      depthTrack.addEventListener('pointerdown', (e) => {
        isDragging = true;
        depthTrack.setPointerCapture(e.pointerId);
        handleDepthScrub(e.clientY);
      });

      depthTrack.addEventListener('pointermove', (e) => {
        if (isDragging) handleDepthScrub(e.clientY);
      });

      depthTrack.addEventListener('pointerup', (e) => {
        isDragging = false;
        try { depthTrack.releasePointerCapture(e.pointerId); } catch (_) {}
      });
    }

    // Direct depth stage shortcut buttons (100% Complete, 80% Skin, 60% Muscles, 40% Skeleton, 20% Organs, 0% Exploded)
    const stageBtns = document.querySelectorAll('.depth-stage-btn');
    stageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseFloat(btn.dataset.progress);
        if (!isNaN(p)) {
          this.camera.applyScrollProgress(p);
          sound.playSelect();
        }
      });
    });

    // 11. Journeys Selector
    const journeyCards = document.querySelectorAll('.journey-card');
    journeyCards.forEach((card) => {
      card.addEventListener('click', () => {
        const jId = card.dataset.journey;
        journeyCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.journeys.startJourney(jId);
      });
    });

    const journeyPlayBtn = document.getElementById('journey-play-btn');
    if (journeyPlayBtn) {
      journeyPlayBtn.addEventListener('click', () => {
        const isPlaying = this.journeys.togglePlay();
        journeyPlayBtn.textContent = isPlaying ? '⏸ PAUSE' : '▶ PLAY';
        sound.playSelect();
      });
    }

    const journeyNextBtn = document.getElementById('journey-next-btn');
    if (journeyNextBtn) {
      journeyNextBtn.addEventListener('click', () => {
        this.journeys.nextMilestone();
        sound.playSelect();
      });
    }

    const journeyPrevBtn = document.getElementById('journey-prev-btn');
    if (journeyPrevBtn) {
      journeyPrevBtn.addEventListener('click', () => {
        this.journeys.prevMilestone();
        sound.playSelect();
      });
    }

    // 12. Quiz Controls
    const quizNextBtn = document.getElementById('quiz-next-btn');
    if (quizNextBtn) {
      quizNextBtn.addEventListener('click', () => {
        this.quiz.nextQuestion();
        sound.playSelect();
      });
    }

    const quizRestartBtn = document.getElementById('quiz-restart-btn');
    if (quizRestartBtn) {
      quizRestartBtn.addEventListener('click', () => {
        this.quiz.start();
        sound.playSelect();
      });
    }

    // 13. Keyboard Shortcuts (ESC = Reset, Space = Explode Toggle)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideInfoPanel();
        this.anatomy.resetSelection();
        this.camera.resetCamera();
      }
    });
  }

  showToast(message) {
    let toast = document.getElementById('holographic-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'holographic-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2800);
  }

  executeSearch(query) {
    if (!query) return;
    this.switchMode('explore');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'explore'));

    const mesh = this.anatomy.focusOnKey(query);
    if (mesh) {
      this.camera.focusOnPart(mesh, 0.70);
      this.showInfoPanel(mesh.userData.info || {
        name: mesh.name,
        system: 'Anatomy',
        function: 'Identified anatomical structure in 3D human model.',
        description: 'Selected via 3D Bodyverse navigation search.'
      });
    } else {
      // 5. SEARCH: If no exact mesh exists, show subtle message instead of crashing
      this.showToast(`Anatomical mesh not available for "${query}"`);
    }
  }

  switchMode(mode) {
    this.activeMode = mode;
    this.camera.setMode(mode);

    // Hide all sub-HUD overlays
    document.getElementById('systems-hud').classList.remove('active');
    document.getElementById('organs-hud').classList.remove('active');
    document.getElementById('journeys-hud').classList.remove('active');
    document.getElementById('quiz-hud').classList.remove('active');
    document.getElementById('depth-hud').classList.remove('hidden');

    this.organs.hide();
    this.journeys.stop();
    this.quiz.stop();

    switch (mode) {
          case 'explore':
      this.anatomy.setSystemFilter('all');
      this.camera.applyScrollProgress(this.camera.currentScroll);
      // Reset visibility for all meshes (in case they were hidden in other modes)
      for (const mesh of this.anatomy.meshes.values()) {
        mesh.visible = true;
      }
      break;

      case 'systems':
        document.getElementById('systems-hud').classList.add('active');
        this.camera.flyToCoordinates([0, 0.95, 2.65], [0, 0.86, 0], 1.4);
        break;

        case 'organs':
          document.getElementById('organs-hud').classList.add('active');
          // Smoothly bring internal organs to foreground
          this.anatomy.setScrollProgress(0.70);
          this.camera.applyScrollProgress(0.70);
          // Hide outer skin completely
          for (const mesh of this.anatomy.meshes.values()) {
            const nameKey = (mesh.name || '').toLowerCase();
            if (nameKey.includes('skin')) {
              mesh.visible = false;
              if (mesh.material) {
                mesh.material.transparent = true;
                mesh.material.opacity = 0;
              }
            }
          }
          break;
        case 'journeys':
          document.getElementById('journeys-hud').classList.add('active');
          document.getElementById('depth-hud').classList.add('hidden');
          this.journeys.startJourney('blood');
          // Hide outer skin completely for journeys view as well
          for (const mesh of this.anatomy.meshes.values()) {
            const nameKey = (mesh.name || '').toLowerCase();
            if (nameKey.includes('skin')) {
              mesh.visible = false;
              if (mesh.material) {
                mesh.material.transparent = true;
                mesh.material.opacity = 0;
              }
            }
          }
          break;

      case 'quiz':
        document.getElementById('quiz-hud').classList.add('active');
        this.quiz.start();
        break;
    }
  }

  /**
   * 4. INFORMATION PANEL
   * Floating holographic glass panel displaying:
   * - BODY PART NAME
   * - SYSTEM
   * - SHORT DESCRIPTION
   * - FUNCTION
   * - KEY FACTS
   */
  showInfoPanel(info) {
    if (!info) return;
    const panel = document.getElementById('info-panel');
    const badge = document.getElementById('info-system-badge');
    const title = document.getElementById('info-title');
    const latin = document.getElementById('info-latin');
    const desc = document.getElementById('info-description');
    const func = document.getElementById('info-function');
    const statsContainer = document.getElementById('info-stats');

    if (badge) badge.textContent = (info.system || 'ANATOMY').toUpperCase();
    if (title) title.textContent = info.name || 'Structure';
    if (latin) latin.textContent = info.latin ? `Latin: ${info.latin}` : '';
    if (desc) desc.textContent = info.description || '3D interactive anatomical structure within the human body.';
    if (func) func.textContent = info.function || 'Essential physiological and mechanical function in human homeostasis.';

    // KEY FACTS / STATS
    if (statsContainer) {
      if (info.stats && Object.keys(info.stats).length > 0) {
        statsContainer.innerHTML = Object.entries(info.stats).map(([k, v]) => `
          <div class="stat-chip">
            <span class="stat-label">${k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
            <span class="stat-value">${v}</span>
          </div>
        `).join('');
        statsContainer.style.display = 'grid';
      } else {
        statsContainer.style.display = 'none';
      }
    }

    if (panel) panel.classList.add('open');
  }

  hideInfoPanel() {
    const panel = document.getElementById('info-panel');
    if (panel) panel.classList.remove('open');
  }

  updateHoverLabel(mesh, clientX, clientY) {
    const label = document.getElementById('hover-indicator');
    if (!label) return;

    if (!mesh || !mesh.userData.info) {
      label.classList.remove('visible');
      return;
    }

    const info = mesh.userData.info;
    label.innerHTML = `
      <span class="hover-tag">${info.system || 'ANATOMY'}</span>
      <span class="hover-title">${info.name || mesh.name}</span>
    `;

    label.style.left = `${clientX + 16}px`;
    label.style.top = `${clientY - 12}px`;
    label.classList.add('visible');
  }

  updateDepthIndicator(progress) {
    const depthPct = Math.round(progress * 100);
    const depthFill = document.getElementById('depth-fill');
    const depthText = document.getElementById('depth-value');
    const stageLabel = document.getElementById('depth-stage');
    const explodeToggleBtn = document.getElementById('btn-explode-toggle');

    if (depthFill) depthFill.style.height = `${depthPct}%`;
    if (depthText) depthText.textContent = `${depthPct}%`;

    // Stages from 100% complete down to 0% exploded:
    let stage = '100% COMPLETE HUMAN';
    if (progress >= 0.85) stage = '0% EXPLODED ANATOMY';
    else if (progress >= 0.65) stage = '20% ORGANS SEPARATING';
    else if (progress >= 0.45) stage = '40% SKELETAL LAYER';
    else if (progress >= 0.25) stage = '60% MUSCULAR LAYER';
    else if (progress >= 0.10) stage = '80% SKIN TRANSPARENCY';

    if (stageLabel) stageLabel.textContent = stage;

    if (explodeToggleBtn) {
      if (progress > 0.5) {
        explodeToggleBtn.textContent = '🔄 ASSEMBLE';
        explodeToggleBtn.classList.add('active');
      } else {
        explodeToggleBtn.textContent = '💥 EXPLODE';
        explodeToggleBtn.classList.remove('active');
      }
    }
  }

  updateJourneyMilestone(milestone, index, total) {
    const title = document.getElementById('journey-milestone-title');
    const desc = document.getElementById('journey-milestone-desc');
    const step = document.getElementById('journey-step-indicator');

    if (title) title.textContent = milestone.name;
    if (desc) desc.textContent = milestone.desc;
    if (step) step.textContent = `STEP ${index + 1} OF ${total}`;
  }

  updateQuizState(data) {
    const questionText = document.getElementById('quiz-question-text');
    const stepText = document.getElementById('quiz-step');
    const scoreText = document.getElementById('quiz-score');
    const streakText = document.getElementById('quiz-streak');
    const feedbackBox = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (data.isComplete) {
      questionText.textContent = `QUIZ COMPLETE! You identified ${data.score} out of ${data.total} anatomical structures!`;
      feedbackBox.className = 'quiz-feedback correct';
      feedbackBox.innerHTML = `<strong>MASTER ANATOMIST</strong><span>You have mastered this 3D anatomical knowledge test.</span>`;
      feedbackBox.style.display = 'block';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    if (questionText) questionText.textContent = data.question;
    if (stepText) stepText.textContent = `QUESTION ${data.index} OF ${data.total}`;
    if (scoreText) scoreText.textContent = data.score;
    if (streakText) streakText.textContent = data.streak;

    if (data.feedback) {
      feedbackBox.className = `quiz-feedback ${data.feedback.correct ? 'correct' : 'incorrect'}`;
      feedbackBox.innerHTML = `<strong>${data.feedback.title}</strong><span>${data.feedback.text}</span>`;
      feedbackBox.style.display = 'block';
      if (nextBtn) nextBtn.style.display = data.feedback.correct ? 'block' : 'none';
    } else {
      feedbackBox.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
    }
  }
}
