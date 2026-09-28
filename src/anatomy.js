import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { gsap } from '../vendor/gsap.js';
import { ANATOMY_MODEL_URL, ANATOMY_DATA, SYSTEMS } from './config.js';
import { sound } from './audio.js';

export class AnatomyManager {
  constructor(appScene, onProgress, onError) {
    this.appScene = appScene;
    this.scene = appScene.scene;
    this.onProgress = onProgress;
    this.onError = onError;

    this.root = null;
    this.meshes = new Map(); // uuid -> Mesh
    this.registry = {}; // key -> Mesh
    this.originalState = new Map(); // uuid -> { pos, rot, scale, expPos, expRot, material, ... }

    this.hoveredMesh = null;
    this.selectedMesh = null;
    this.activeSystem = 'all';
    this.scrollProgress = 0; // 0.0 to 1.0 (0.0 = complete, 1.0 = exploded)
    this.activeTab = 'explore';

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);

    // Callbacks
    this.onSelectCallback = null;
    this.onHoverCallback = null;
    this.onProgressChange = null;

    this._animTween = null;

    this.initLoader();
  }

  initLoader() {
    const loader = new GLTFLoader();

    loader.load(
      ANATOMY_MODEL_URL,
      (gltf) => {
        this.root = gltf.scene;
        this.root.name = 'HumanAnatomyModel';
        this.processModel();
        this.scene.add(this.root);
        if (this.onProgress) this.onProgress(1.0, true);
      },
      (xhr) => {
        if (xhr.lengthComputable && this.onProgress) {
          const ratio = xhr.loaded / xhr.total;
          this.onProgress(Math.min(ratio, 0.99), false);
        } else if (this.onProgress) {
          this.onProgress(0.75, false);
        }
      },
      (err) => {
        console.error('Failed to load human anatomy model:', err);
        if (this.onError) {
          this.onError(err);
        }
      }
    );
  }

  processModel() {
    this.root.updateWorldMatrix(true, true);

    this.root.traverse((obj) => {
      if (!obj.isMesh) return;

      obj.castShadow = true;
      obj.receiveShadow = true;

      const nameKey = (obj.name || obj.uuid).toLowerCase();
      let matchedKey = null;

      // Check exact anatomy data matches
      for (const key of Object.keys(ANATOMY_DATA)) {
        if (nameKey.includes(key)) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        if (nameKey.includes('bone') || nameKey.includes('spine') || nameKey.includes('rib') || nameKey.includes('pelv') || nameKey.includes('skull') || nameKey.includes('leg') || nameKey.includes('arm')) {
          matchedKey = 'skull';
        } else if (nameKey.includes('muscle')) {
          matchedKey = 'muscles';
        } else {
          matchedKey = 'skin';
        }
      }

      obj.userData.anatomyKey = matchedKey;
      obj.userData.info = ANATOMY_DATA[matchedKey] || null;

      // Clone material for independent highlighting
      const originalMat = obj.material.clone();
      originalMat.transparent = true;
      originalMat.depthWrite = true;
      obj.material = originalMat;

      // 8. Controlled Exploded Anatomy: Store original & exploded transforms
      const origPos = obj.position.clone();
      const origRot = obj.rotation.clone();
      const origScale = obj.scale.clone();

      let expPos = origPos.clone();
      let expRot = origRot.clone();

      // Meaningful anatomical offsets (symmetrical, clear separation)
      if (nameKey.includes('skin')) {
        expPos.z += 0.65;
        expPos.y += 0.05;
      } else if (nameKey.includes('muscle')) {
        expPos.z += 0.32;
      } else if (nameKey.includes('brain')) {
        expPos.y += 0.72; // Floats above opened skull
      } else if (nameKey.includes('skull')) {
        expPos.y += 0.42;
        expRot.x += 0.06;
      } else if (nameKey.includes('cervical_spine')) {
        expPos.y += 0.16;
        expPos.z -= 0.22;
      } else if (nameKey.includes('thoracic_spine')) {
        expPos.z -= 0.35;
      } else if (nameKey.includes('lumbar_spine')) {
        expPos.y -= 0.10;
        expPos.z -= 0.35;
      } else if (nameKey.includes('pelvis')) {
        expPos.y -= 0.22;
        expPos.z += 0.05;
      } else if (nameKey.includes('ribcage')) {
        expPos.z += 0.45;
        expRot.x += 0.04;
      } else if (nameKey.includes('heart')) {
        expPos.z += 0.72; // Steps out forward for full examination
        expPos.y += 0.06;
      } else if (nameKey.includes('left_lung')) {
        expPos.x -= 0.46; // Spreads laterally left
        expPos.z += 0.36;
      } else if (nameKey.includes('right_lung')) {
        expPos.x += 0.46; // Spreads laterally right
        expPos.z += 0.36;
      } else if (nameKey.includes('liver')) {
        expPos.x += 0.45;
        expPos.z += 0.48;
        expPos.y -= 0.04;
      } else if (nameKey.includes('stomach')) {
        expPos.x -= 0.38;
        expPos.z += 0.52;
        expPos.y -= 0.04;
      } else if (nameKey.includes('left_kidney')) {
        expPos.x -= 0.38;
        expPos.z -= 0.28;
      } else if (nameKey.includes('right_kidney')) {
        expPos.x += 0.38;
        expPos.z -= 0.28;
      } else if (nameKey.includes('intestin')) {
        expPos.y -= 0.25;
        expPos.z += 0.58;
      } else if (nameKey.includes('left_leg')) {
        expPos.x -= 0.28;
        expPos.y -= 0.18;
      } else if (nameKey.includes('right_leg')) {
        expPos.x += 0.28;
        expPos.y -= 0.18;
      }

      obj.userData.originalPosition = origPos;
      obj.userData.originalRotation = origRot;
      obj.userData.explodedPosition = expPos;
      obj.userData.explodedRotation = expRot;

      this.originalState.set(obj.uuid, {
        pos: origPos,
        rot: origRot,
        scale: origScale,
        expPos: expPos,
        expRot: expRot,
        material: originalMat,
        baseOpacity: originalMat.opacity || 1.0,
        baseColor: originalMat.color ? originalMat.color.clone() : new THREE.Color(0xffffff)
      });

      this.meshes.set(obj.uuid, obj);
      this.registry[matchedKey] = obj;
      if (nameKey.includes('lung')) {
        this.registry['lung'] = obj;
        this.registry['lungs'] = obj;
      }
      if (nameKey.includes('kidney')) {
        this.registry['kidney'] = obj;
        this.registry['kidneys'] = obj;
      }
    });

    console.info(`[BODYVERSE] Registered ${this.meshes.size} interactive anatomical meshes.`);
    this.setScrollProgress(0.0);
  }

  /**
   * 8 & 9. ANATOMY STAGES TRANSITION
   * 0.0 = 100% complete human
   * 0.2 = 80% skin transparency
   * 0.4 = 60% muscular layer
   * 0.6 = 40% skeletal layer
   * 0.8 = 20% organs separating
   * 1.0 = 0% controlled exploded anatomy
   */
  setScrollProgress(progress) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
    if (!this.root) return;

    const p = this.scrollProgress;

    this.meshes.forEach((mesh) => {
      const state = this.originalState.get(mesh.uuid);
      if (!state) return;

      const nameKey = (mesh.name || '').toLowerCase();
      const isSkin = nameKey.includes('skin');
      const isMuscle = nameKey.includes('muscle');
      const isSkeleton = nameKey.includes('skull') || nameKey.includes('spine') || nameKey.includes('rib') || nameKey.includes('pelvis') || nameKey.includes('leg') || nameKey.includes('bone') || nameKey.includes('skeleton') || nameKey.includes('arm') || nameKey.includes('hand') || nameKey.includes('foot') || nameKey.includes('vertebra');
      const isOrgan = !isSkin && !isMuscle && !isSkeleton;

      // 1. Position & Rotation Interpolation
      // Organs and bones start separating gracefully at p > 0.40, reaching full exploded state at p = 1.0
      let explodeFactor = 0;
      if (p > 0.40) {
        explodeFactor = (p - 0.40) / 0.60;
        explodeFactor = explodeFactor * explodeFactor * (3 - 2 * explodeFactor); // smooth Hermite ease
      }

      if (p >= 0.8) { // Apply explosion only to non‑skeleton meshes
        const t = (p - 0.8) / 0.2;
        if (isSkeleton) {
          // Keep skeleton static in original position/rotation
          mesh.position.copy(state.pos);
          mesh.rotation.copy(state.rot);
        } else {
          mesh.position.lerpVectors(state.pos, state.expPos, t);
          mesh.rotation.set(
            THREE.MathUtils.lerp(state.rot.x, state.expRot.x, t),
            THREE.MathUtils.lerp(state.rot.y, state.expRot.y, t),
            THREE.MathUtils.lerp(state.rot.z, state.expRot.z, t)
          );
        }
      } else {
         mesh.position.copy(state.pos);
        mesh.rotation.copy(state.rot);
      }

      // 2. Layer Opacity Stages:
      // p=0.0: Complete human (skin 0.70, internals subtly visible)
      // p=0.2: Skin transparent (skin 0.12, muscles 0.80)
      // p=0.4: Muscular layer (skin 0.03, muscles 0.95, skeleton 0.60)
      // p=0.6: Skeletal layer (muscles 0.12, skeleton 1.0, organs 0.70)
      // p=0.8: Organs separating (skeleton 0.45, organs 1.0, positions expanding)
      // p=1.0: Controlled exploded anatomy (all separated, clear 360 inspection)

      // Helper: piecewise linear interpolation
      const lerpPiecewise = (p, points) => {
        for (let i = 0; i < points.length - 1; i++) {
          const [x0, y0] = points[i];
          const [x1, y1] = points[i + 1];
          if (p >= x0 && p <= x1) {
            const t = (p - x0) / (x1 - x0);
            return y0 + t * (y1 - y0);
          }
        }
        // clamp to ends
        return p < points[0][0] ? points[0][1] : points[points.length - 1][1];
      };

      const getSkeletonOpacity = (p) => {
        const pts = [
          [0.0, 0.0],
          [0.1, 0.05],
          [0.2, 0.15],
          [0.3, 0.25],
          [0.4, 0.40],
          [0.5, 0.50],
          [0.6, 0.65],
          [0.7, 0.75],
          [0.8, 0.85],
          [0.9, 0.95],
          [1.0, 1.0]
        ];
        return lerpPiecewise(p, pts);
      };

      const getBodyOpacity = (p) => {
        const pts = [
          [0.0, 1.0],
          [0.25, 0.95],
          [0.5, 0.80],
          [0.75, 0.55],
          [1.0, 0.30]
        ];
        return lerpPiecewise(p, pts);
      };

      let targetOpacity = 1.0;

      if (isSkin) {
        targetOpacity = getBodyOpacity(p);
      } else if (isMuscle) {
        // Preserve existing muscle opacity behavior
        if (p < 0.12) {
          targetOpacity = 0.25;
        } else if (p < 0.45) {
          targetOpacity = 0.85;
        } else if (p < 0.65) {
          targetOpacity = 0.85 * (1 - (p - 0.45) / 0.20);
        } else {
          targetOpacity = 0.10;
        }
      } else if (isSkeleton) {
        targetOpacity = getSkeletonOpacity(p);
      } else if (isOrgan) {
        // Hide organs at low depth, reveal gradually (simple linear after 0.8)
        if (p < 0.8) {
          targetOpacity = 0.0;
        } else {
          // Linear increase from 0.8 to 1.0
          targetOpacity = (p - 0.8) / 0.2; // 0 -> 1
        }
      }

      // Check system filter override
      if (this.activeSystem !== 'all') {
        const info = mesh.userData.info;
        const belongs = info && info.systemId === this.activeSystem;
        if (!belongs) {
          targetOpacity = Math.min(targetOpacity, 0.12);
        } else {
          targetOpacity = Math.max(targetOpacity, 0.90);
        }
      }

      // Check selection dimming
      if (this.selectedMesh && this.selectedMesh.uuid !== mesh.uuid) {
        targetOpacity = Math.min(targetOpacity, 0.18);
      }

      // Ensure material transparency for opacity changes
      if (mesh.material) mesh.material.transparent = true;

      // Hide internal anatomy at depth 0 and hide outer skin at depth 100%
if (p === 0 && (isSkeleton || isMuscle || isOrgan)) {
  mesh.visible = false;
  targetOpacity = 0.0;
} else if (p === 1.0 && isSkin) {
  mesh.visible = false;
  targetOpacity = 0.0;
} else {
  mesh.visible = true;
}



      mesh.material.opacity = targetOpacity;
    });
  }

  explodeAnatomy(duration = 1.8) {
    if (this._animTween) this._animTween.kill();
    const state = { p: this.scrollProgress };
    this._animTween = gsap.to(state, {
      p: 1.0,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.setScrollProgress(state.p);
        if (this.onProgressChange) this.onProgressChange(state.p);
      }
    });
  }

  resetAnatomy(duration = 1.8) {
    if (this._animTween) this._animTween.kill();
    const state = { p: this.scrollProgress };
    this._animTween = gsap.to(state, {
      p: 0.0,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.setScrollProgress(state.p);
        if (this.onProgressChange) this.onProgressChange(state.p);
      }
    });
  }

  setSystemFilter(systemId) {
    this.activeSystem = systemId;
    this.setScrollProgress(this.scrollProgress);
    sound.playSelect();
  }

  updatePointer(clientX, clientY) {
    this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  }

  checkRaycast() {
    if (!this.root || this.mouse.x === -999) return null;

    this.raycaster.setFromCamera(this.mouse, this.appScene.camera);
    const intersects = this.raycaster.intersectObjects(this.root.children, true);

    let hit = null;
    for (const item of intersects) {
      if (item.object.isMesh && item.object.material.opacity > 0.12) {
        // Disregard outer skin if transparent
        if (item.object.name.toLowerCase().includes('skin') && item.object.material.opacity < 0.35) {
          continue;
        }
        hit = item.object;
        break;
      }
    }

    if (hit !== this.hoveredMesh) {
      this.setHovered(hit);
    }
    return hit;
  }

// Helper: get hover delta based on mesh name
  getHoverDelta(nameKey) {
    // Define small rotation deltas (radians) for parts
    const deltaMap = [
      { substr: 'head', rot: new THREE.Euler(0.04, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'neck', rot: new THREE.Euler(0.03, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'shoulder', rot: new THREE.Euler(0.04, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'arm', rot: new THREE.Euler(0.05, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'hand', rot: new THREE.Euler(0.06, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'finger', rot: new THREE.Euler(0.07, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'leg', rot: new THREE.Euler(0.05, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'knee', rot: new THREE.Euler(0.04, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'foot', rot: new THREE.Euler(0.06, 0, 0), pos: new THREE.Vector3(0, 0, 0) },
      { substr: 'toe', rot: new THREE.Euler(0.07, 0, 0), pos: new THREE.Vector3(0, 0, 0) }
    ];
    for (const entry of deltaMap) {
      if (nameKey.includes(entry.substr)) return entry;
    }
    // default minimal delta
    return { rot: new THREE.Euler(0.03, 0, 0), pos: new THREE.Vector3(0, 0, 0) };
  }

  // Apply hover animation to a mesh (entering = true) or reset (entering = false)
  applyHoverEffect(mesh, entering) {
    if (!mesh) return;
    const state = this.originalState.get(mesh.uuid);
    if (!state) return;
    const nameKey = (mesh.name || '').toLowerCase();
    const delta = this.getHoverDelta(nameKey);
    const targetRot = new THREE.Euler();
    const targetPos = new THREE.Vector3();
    if (entering) {
      targetRot.copy(state.rot);
      targetRot.x += delta.rot.x;
      targetRot.y += delta.rot.y;
      targetRot.z += delta.rot.z;

      targetPos.copy(state.pos);
      targetPos.add(delta.pos);
    } else {
      targetRot.copy(state.rot);
      targetPos.copy(state.pos);
    }
    gsap.to(mesh.rotation, { x: targetRot.x, y: targetRot.y, z: targetRot.z, duration: 0.4, ease: 'power1.out' });
    gsap.to(mesh.position, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: 0.4, ease: 'power1.out' });
  }

  setHovered(mesh) {
    const prev = this.hoveredMesh;
    if (prev && prev !== this.selectedMesh) {
      this.resetMeshHighlight(prev);
      this.applyHoverEffect(prev, false);
    }
    this.hoveredMesh = mesh;
    if (this.hoveredMesh && this.hoveredMesh !== this.selectedMesh) {
      this.highlightMesh(this.hoveredMesh, false);
      this.applyHoverEffect(this.hoveredMesh, true);
      sound.playHover();
    }
    if (this.onHoverCallback) {
      this.onHoverCallback(this.hoveredMesh);
    }
  }



  selectMesh(mesh) {
    if (this.selectedMesh) {
      this.resetMeshHighlight(this.selectedMesh);
    }

    this.selectedMesh = mesh;

    if (this.selectedMesh) {
      this.highlightMesh(this.selectedMesh, true);
      sound.playSelect();
    }

    // Update opacity of all other meshes (dimming unrelated anatomy)
    this.setScrollProgress(this.scrollProgress);

    if (this.onSelectCallback) {
      this.onSelectCallback(this.selectedMesh);
    }
  }

  highlightMesh(mesh, isSelected) {
    const mat = mesh.material;
    if (!mat) return;

    if ('emissive' in mat) {
      mat.emissive = new THREE.Color(isSelected ? 0x00f0ff : 0x00c8ff);
      mat.emissiveIntensity = isSelected ? 1.8 : 0.75;
    }
    mesh.scale.setScalar(isSelected ? 1.05 : 1.02);
  }

  resetMeshHighlight(mesh) {
    const state = this.originalState.get(mesh.uuid);
    if (!state) return;

    mesh.scale.copy(state.scale);
    const mat = mesh.material;
    if (mat && 'emissive' in mat) {
      mat.emissive = new THREE.Color(0x000000);
      mat.emissiveIntensity = 0;
    }
  }

  focusOnKey(query) {
    if (!query) return null;
    const q = query.toLowerCase().trim();

    // Direct registry match
    if (this.registry[q]) {
      this.selectMesh(this.registry[q]);
      return this.registry[q];
    }

    // Alias mapping for common terms
    const aliasMap = {
      'heart': 'heart',
      'brain': 'brain',
      'head': 'skull',
      'skull': 'skull',
      'cranium': 'skull',
      'face': 'skull',
      'lungs': 'left_lung',
      'lung': 'left_lung',
      'chest': 'ribcage',
      'ribs': 'ribcage',
      'ribcage': 'ribcage',
      'liver': 'liver',
      'stomach': 'stomach',
      'belly': 'stomach',
      'kidney': 'left_kidney',
      'kidneys': 'left_kidney',
      'intestine': 'intestines',
      'intestines': 'intestines',
      'gut': 'intestines',
      'spine': 'thoracic_spine',
      'vertebrae': 'lumbar_spine',
      'neck': 'cervical_spine',
      'pelvis': 'pelvis',
      'hip': 'pelvis',
      'leg': 'left_leg',
      'legs': 'left_leg',
      'muscle': 'muscles',
      'muscles': 'muscles',
      'skin': 'skin',
      'body': 'skin'
    };

    const targetKey = aliasMap[q];
    if (targetKey && this.registry[targetKey]) {
      this.selectMesh(this.registry[targetKey]);
      return this.registry[targetKey];
    }

    // Partial search across registered meshes
    for (const [mKey, mObj] of Object.entries(this.registry)) {
      if (mKey.includes(q) || (mObj.name || '').toLowerCase().includes(q)) {
        this.selectMesh(mObj);
        return mObj;
      }
    }

    return null;
  }

  resetSelection() {
    if (this.selectedMesh) {
      this.resetMeshHighlight(this.selectedMesh);
      this.selectedMesh = null;
    }
    this.setScrollProgress(this.scrollProgress);
    if (this.onSelectCallback) {
      this.onSelectCallback(null);
    }
  }
}
