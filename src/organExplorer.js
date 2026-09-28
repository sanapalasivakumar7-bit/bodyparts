import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { sound } from './audio.js';
import { ANATOMY_DATA } from './config.js';

export class OrganExplorer {
  constructor(appScene, cameraController, onSelectOrgan) {
    this.appScene = appScene;
    this.scene = appScene.scene;
    this.cameraController = cameraController;
    this.onSelectOrgan = onSelectOrgan;

    this.group = new THREE.Group();
    this.group.name = 'OrganExplorerArena';
    this.group.visible = false;
    this.scene.add(this.group);

    this.organs = new Map(); // key -> { root, mesh, data, basePos, baseScale }
    this.activeKey = null;
    this.isBeating = true;
    this.isWireframe = false;

    this.initSpatialArrangement();
  }

  initSpatialArrangement() {
    // 3D Spatial Circular Ring coordinates for the major organs
    const organKeys = ['heart', 'brain', 'left_lung', 'liver', 'stomach', 'left_kidney', 'intestines'];
    const radius = 2.4;
    const ringY = 1.10;

    organKeys.forEach((key, idx) => {
      const angle = (idx / organKeys.length) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const anchor = new THREE.Group();
      anchor.position.set(x, ringY, z);
      anchor.name = `OrganAnchor_${key}`;
      anchor.lookAt(0, ringY, 0);

      // Add a holographic circular pedestal on floor
      const pedGeom = new THREE.CylinderGeometry(0.35, 0.40, 0.04, 32);
      const pedMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.15,
        wireframe: true
      });
      const pedestal = new THREE.Mesh(pedGeom, pedMat);
      pedestal.position.set(x, 0.02, z);
      this.group.add(pedestal);

      // Light beam above each organ
      const beamGeom = new THREE.CylinderGeometry(0.01, 0.25, 2.0, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(x, 1.0, z);
      this.group.add(beam);

      this.group.add(anchor);
      this.organs.set(key, {
        anchor,
        mesh: null,
        data: ANATOMY_DATA[key] || { name: key },
        basePos: new THREE.Vector3(x, ringY, z),
        baseScale: 1.0
      });
    });
  }

  attachMeshesFromMaster(masterMeshRegistry) {
    // Clone or reposition meshes for the dedicated 3D Organ Arena
    for (const [key, organEntry] of this.organs.entries()) {
      const sourceMesh = masterMeshRegistry[key] || masterMeshRegistry[key.replace('left_', '')];
      if (!sourceMesh) continue;

      const clone = sourceMesh.clone();
      clone.position.set(0, 0, 0);
      clone.scale.setScalar(1.6);
      clone.material = sourceMesh.material.clone();
      clone.material.transparent = false;
      clone.material.opacity = 1.0;
      clone.userData.organKey = key;

      organEntry.anchor.add(clone);
      organEntry.mesh = clone;
      organEntry.baseScale = clone.scale.x;
    }
  }

  show() {
    this.group.visible = true;
    this.cameraController.setMode('organs');
    // Camera arrives at vantage point overlooking the 3D organ ring
    this.cameraController.flyToCoordinates([0, 2.2, 3.8], [0, 1.10, 0], 1.6);
    sound.playSelect();
  }

  hide() {
    this.group.visible = false;
  }

  focusOrgan(key) {
    const entry = this.organs.get(key);
    if (!entry) return;

    this.activeKey = key;
    const targetPos = entry.basePos.clone();
    // Calculate camera offset in front of the organ
    const camOffset = targetPos.clone().normalize().multiplyScalar(targetPos.length() + 0.85);
    camOffset.y += 0.15;

    this.cameraController.flyToCoordinates(
      [camOffset.x, camOffset.y, camOffset.z],
      [targetPos.x, targetPos.y, targetPos.z],
      1.5
    );

    sound.playSelect();
    if (this.onSelectOrgan) {
      this.onSelectOrgan(entry.data, entry.mesh);
    }
  }

  update(delta, time) {
    if (!this.group.visible) return;

    // Rotate organ anchors gently
    this.organs.forEach((entry, key) => {
      if (entry.mesh) {
        entry.mesh.rotation.y += 0.008;

        // Procedural biological pulse animations
        if (key.includes('heart') && this.isBeating) {
          // Double systolic pulse: Lub-Dub
          const beatCycle = (time * 0.0012) % 1.0;
          let pulse = 0;
          if (beatCycle < 0.12) {
            pulse = Math.sin((beatCycle / 0.12) * Math.PI) * 0.08;
          } else if (beatCycle > 0.18 && beatCycle < 0.32) {
            pulse = Math.sin(((beatCycle - 0.18) / 0.14) * Math.PI) * 0.05;
          }
          entry.mesh.scale.setScalar(entry.baseScale * (1.0 + pulse));

          // Trigger procedural heartbeat sound if focused
          if (this.activeKey === 'heart' && beatCycle < 0.02) {
            sound.playHeartbeat();
          }
        } else if (key.includes('lung')) {
          // Slow smooth 14 breaths/min inhalation/exhalation
          const breath = Math.sin(time * 0.002) * 0.06;
          entry.mesh.scale.setScalar(entry.baseScale * (1.0 + breath));
        } else {
          // Gentle floating levitation
          entry.mesh.position.y = Math.sin(time * 0.0015 + key.length) * 0.02;
        }
      }
    });
  }

  toggleWireframe() {
    this.isWireframe = !this.isWireframe;
    this.organs.forEach((entry) => {
      if (entry.mesh && entry.mesh.material) {
        entry.mesh.material.wireframe = this.isWireframe;
      }
    });
    return this.isWireframe;
  }
}
