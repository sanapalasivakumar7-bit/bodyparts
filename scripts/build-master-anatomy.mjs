import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

global.self = global;
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = 'data:' + (blob.type || 'application/octet-stream') + ';base64,' + Buffer.from(buf).toString('base64');
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    });
  }
};
global.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });

const loader = new GLTFLoader();

function cleanGeom(g) {
  if (!g.attributes.normal) g.computeVertexNormals();
  delete g.attributes.uv;
  delete g.attributes.tangent;
  delete g.attributes.color;
  return g;
}

function loadGLTF(filePath) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(filePath);
    loader.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '', resolve, reject);
  });
}

function exportGLB(scene) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => resolve(result),
      (err) => reject(err),
      { binary: true }
    );
  });
}

async function build() {
  console.log('Building BODYVERSE Master 3D Anatomy Model...');
  const masterScene = new THREE.Scene();
  masterScene.name = 'HumanAnatomyUniverse';

  // 1. Load Skeleton
  console.log('Loading Skeleton...');
  const skelGLTF = await loadGLTF('temp_skeleton.glb');
  
  // Categorize bones by anatomical regions
  const boneCategories = {
    Skull: [],
    Ribcage: [],
    Cervical_Spine: [],
    Thoracic_Spine: [],
    Lumbar_Spine: [],
    Pelvis: [],
    Left_Arm: [],
    Right_Arm: [],
    Left_Leg: [],
    Right_Leg: []
  };

  skelGLTF.scene.updateWorldMatrix(true, true);

  skelGLTF.scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry) return;
    const name = (obj.name || '').toLowerCase();
    
    // Clone and bake world matrix into geometry
    const geom = obj.geometry.clone();
    geom.applyMatrix4(obj.matrixWorld);
    if (!geom.attributes.normal) geom.computeVertexNormals();
    delete geom.attributes.uv;
    delete geom.attributes.tangent;
    delete geom.attributes.color;

    if (name.includes('frontal') || name.includes('parietal') || name.includes('occipital') || 
        name.includes('temporal') || name.includes('sphenoid') || name.includes('mandible') || 
        name.includes('maxilla') || name.includes('tooth') || name.includes('teeth') || 
        name.includes('zygomatic') || name.includes('nasal') || name.includes('incus') || 
        name.includes('malleus') || name.includes('stapes') || name.includes('vomer') || 
        name.includes('palatine') || name.includes('ethmoid') || name.includes('lacrimal')) {
      boneCategories.Skull.push(geom);
    } else if (name.includes('rib') || name.includes('sternum') || name.includes('manubrium') || name.includes('costal cartilage')) {
      boneCategories.Ribcage.push(geom);
    } else if (name.includes('vertebra c') || name.includes('axis') || name.includes('atlas')) {
      boneCategories.Cervical_Spine.push(geom);
    } else if (name.includes('vertebra t')) {
      boneCategories.Thoracic_Spine.push(geom);
    } else if (name.includes('vertebra l') || name.includes('sacrum') || name.includes('coccyx')) {
      boneCategories.Lumbar_Spine.push(geom);
    } else if (name.includes('hip bone') || name.includes('ilium') || name.includes('ischium') || name.includes('pubis')) {
      boneCategories.Pelvis.push(geom);
    } else if (name.includes('.l') && (name.includes('femur') || name.includes('tibia') || name.includes('fibula') || name.includes('patella') || name.includes('foot') || name.includes('calcaneus') || name.includes('talus') || name.includes('metatarsal'))) {
      boneCategories.Left_Leg.push(geom);
    } else if (name.includes('.r') && (name.includes('femur') || name.includes('tibia') || name.includes('fibula') || name.includes('patella') || name.includes('foot') || name.includes('calcaneus') || name.includes('talus') || name.includes('metatarsal'))) {
      boneCategories.Right_Leg.push(geom);
    } else if (name.includes('.l') && (name.includes('clavicle') || name.includes('scapula') || name.includes('humerus') || name.includes('radius') || name.includes('ulna') || name.includes('hand') || name.includes('carpal') || name.includes('phalanx'))) {
      boneCategories.Left_Arm.push(geom);
    } else if (name.includes('.r') && (name.includes('clavicle') || name.includes('scapula') || name.includes('humerus') || name.includes('radius') || name.includes('ulna') || name.includes('hand') || name.includes('carpal') || name.includes('phalanx'))) {
      boneCategories.Right_Arm.push(geom);
    } else {
      // Fallback based on Y coordinate
      const box = new THREE.Box3().setFromBufferAttribute(geom.attributes.position);
      const y = (box.min.y + box.max.y) / 2;
      if (y > 1.45) boneCategories.Skull.push(geom);
      else if (y > 1.35) boneCategories.Cervical_Spine.push(geom);
      else if (y > 1.05) boneCategories.Thoracic_Spine.push(geom);
      else if (y > 0.85) boneCategories.Lumbar_Spine.push(geom);
      else if (y > 0.75) boneCategories.Pelvis.push(geom);
      else if (box.min.x < 0) boneCategories.Left_Leg.push(geom);
      else boneCategories.Right_Leg.push(geom);
    }
  });

  const boneMaterial = new THREE.MeshStandardMaterial({
    color: 0xded8c9,
    roughness: 0.65,
    metalness: 0.15,
    name: 'BoneMaterial'
  });

  const boneMetadata = {
    Skull: { name: 'Cranium & Skull', system: 'Skeletal', function: 'Protects the brain and supports facial structures', description: 'Composed of cranial and facial bones fused together to house sensory organs and encephalon.' },
    Ribcage: { name: 'Thoracic Ribcage & Sternum', system: 'Skeletal', function: 'Protects thoracic organs and assists in respiratory expansion', description: 'Consists of 12 pairs of ribs, costal cartilages, and sternum providing cage-like protection for the heart and lungs.' },
    Cervical_Spine: { name: 'Cervical Spine (C1-C7)', system: 'Skeletal', function: 'Supports skull mobility and protects the spinal cord', description: 'Comprises the atlas, axis, and C3-C7 vertebrae permitting flexion, extension, and axial rotation of the head.' },
    Thoracic_Spine: { name: 'Thoracic Spine (T1-T12)', system: 'Skeletal', function: 'Anchors rib cage and articulates with thoracic cavity', description: 'Twelve thoracic vertebrae configured for stability, attachment of ribs, and postural rigidity.' },
    Lumbar_Spine: { name: 'Lumbar Spine & Sacrum (L1-L5)', system: 'Skeletal', function: 'Bears upper body weight and enables lumbar flexibility', description: 'Robust vertebral bodies engineered to absorb axial compression and distribute weight to the pelvis.' },
    Pelvis: { name: 'Pelvic Girdle', system: 'Skeletal', function: 'Connects spine to lower extremities and cradles pelvic organs', description: 'Composed of fused ilium, ischium, and pubis bones transmitting locomotion force vectors.' },
    Left_Arm: { name: 'Left Upper Extremity Skeleton', system: 'Skeletal', function: 'Facilitates dextrous manipulation and upper body reach', description: 'Encompasses clavicle, scapula, humerus, radius, ulna, and 27 delicate hand bones.' },
    Right_Arm: { name: 'Right Upper Extremity Skeleton', system: 'Skeletal', function: 'Facilitates dextrous manipulation and upper body reach', description: 'Encompasses clavicle, scapula, humerus, radius, ulna, and 27 delicate hand bones.' },
    Left_Leg: { name: 'Left Lower Extremity Skeleton', system: 'Skeletal', function: 'Weight bearing, shock absorption, and bipedal locomotion', description: 'Includes femur, patella, tibia, fibula, and tarsal/metatarsal foot arches.' },
    Right_Leg: { name: 'Right Lower Extremity Skeleton', system: 'Skeletal', function: 'Weight bearing, shock absorption, and bipedal locomotion', description: 'Includes femur, patella, tibia, fibula, and tarsal/metatarsal foot arches.' }
  };

  const explodedOffsets = {
    Skull: [0, 0.45, 0],
    Ribcage: [0, 0, 0.35],
    Cervical_Spine: [0, 0.20, -0.15],
    Thoracic_Spine: [0, 0, -0.25],
    Lumbar_Spine: [0, -0.15, -0.25],
    Pelvis: [0, -0.30, 0],
    Left_Arm: [-0.45, 0.10, 0.15],
    Right_Arm: [0.45, 0.10, 0.15],
    Left_Leg: [-0.25, -0.35, 0],
    Right_Leg: [0.25, -0.35, 0]
  };

  for (const [key, geoms] of Object.entries(boneCategories)) {
    if (geoms.length === 0) continue;
    const merged = BufferGeometryUtils.mergeGeometries(geoms, false);
    if (!merged) continue;
    merged.computeVertexNormals();
    const mesh = new THREE.Mesh(merged, boneMaterial.clone());
    mesh.name = key;
    const meta = boneMetadata[key];
    const offset = explodedOffsets[key] || [0, 0, 0];
    mesh.userData = {
      anatomyId: key,
      anatomyKey: key.toLowerCase(),
      anatomyName: meta.name,
      system: meta.system,
      function: meta.function,
      description: meta.description,
      originalPosition: [0, 0, 0],
      explodedPosition: offset,
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0, 0]
    };
    masterScene.add(mesh);
  }

  // 2. Load and add Brain
  console.log('Adding Brain...');
  const brainGLTF = await loadGLTF('temp_brain.glb');
  const brainGeoms = [];
  brainGLTF.scene.updateWorldMatrix(true, true);
  brainGLTF.scene.traverse((obj) => {
    if (obj.isMesh && obj.geometry) {
      const g = obj.geometry.clone();
      g.applyMatrix4(obj.matrixWorld);
      if (!g.attributes.normal) g.computeVertexNormals();
      delete g.attributes.uv;
      delete g.attributes.tangent;
      delete g.attributes.color;
      brainGeoms.push(g);
    }
  });
  if (brainGeoms.length > 0) {
    const brainMerged = BufferGeometryUtils.mergeGeometries(brainGeoms, false);
    brainMerged.computeVertexNormals();
    const brainMat = new THREE.MeshStandardMaterial({
      color: 0xdf848d,
      roughness: 0.45,
      metalness: 0.1,
      name: 'BrainMaterial'
    });
    const brainMesh = new THREE.Mesh(brainMerged, brainMat);
    brainMesh.name = 'Brain';
    brainMesh.userData = {
      anatomyId: 'Brain',
      anatomyKey: 'brain',
      anatomyName: 'Brain & Cerebrum',
      system: 'Nervous',
      function: 'Master control center of the nervous system, cognition, memory, and autonomic regulation',
      description: 'Contains over 86 billion neurons orchestrating sensory input, thought, consciousness, and bodily motor control.',
      originalPosition: [0, 0, 0],
      explodedPosition: [0, 0.70, 0.05],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0, 0]
    };
    masterScene.add(brainMesh);
  }

  // 3. Load and add Heart
  console.log('Adding Heart...');
  const heartGLTF = await loadGLTF('temp_heart.glb');
  const heartGroup = new THREE.Group();
  heartGLTF.scene.traverse(o => {
    if (o.isMesh) {
      o.material = new THREE.MeshStandardMaterial({
        color: 0xb5222e,
        roughness: 0.35,
        metalness: 0.25,
        emissive: new THREE.Color(0x330005),
        name: 'HeartMaterial'
      });
    }
  });
  heartGLTF.scene.scale.setScalar(0.10);
  heartGLTF.scene.position.set(-0.025, 1.23, 0.035);
  heartGLTF.scene.updateWorldMatrix(true, true);
  const heartGeoms = [];
  heartGLTF.scene.traverse(o => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      heartGeoms.push(cleanGeom(g));
    }
  });
  if (heartGeoms.length > 0) {
    const mergedHeart = BufferGeometryUtils.mergeGeometries(heartGeoms, false);
    mergedHeart.computeVertexNormals();
    const heartMesh = new THREE.Mesh(mergedHeart, new THREE.MeshStandardMaterial({
      color: 0xbf1c2d,
      roughness: 0.38,
      metalness: 0.2,
      name: 'HeartMaterial'
    }));
    heartMesh.name = 'Heart';
    heartMesh.userData = {
      anatomyId: 'Heart',
      anatomyKey: 'heart',
      anatomyName: 'Heart & Cardia',
      system: 'Circulatory',
      function: 'Muscular pump delivering oxygenated blood and vital nutrients to all tissues',
      description: 'Four-chambered organ generating rhythmic contractile pressure to sustain systemic and pulmonary circulation.',
      originalPosition: [0, 0, 0],
      explodedPosition: [0, 0.15, 0.75],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0.1, 0]
    };
    masterScene.add(heartMesh);
  }

  // 4. Load and add Lungs
  console.log('Adding Lungs...');
  const lungGLTF = await loadGLTF('temp_lung.glb');
  lungGLTF.scene.scale.setScalar(0.95);
  lungGLTF.scene.position.set(0, 1.10, 0.04);
  lungGLTF.scene.updateWorldMatrix(true, true);
  
  const leftLungGeoms = [];
  const rightLungGeoms = [];
  lungGLTF.scene.traverse(o => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      const box = new THREE.Box3().setFromBufferAttribute(g.attributes.position);
      const cx = (box.min.x + box.max.x) / 2;
      if (cx < 0) leftLungGeoms.push(cleanGeom(g));
      else rightLungGeoms.push(cleanGeom(g));
    }
  });

  const lungMat = new THREE.MeshStandardMaterial({
    color: 0xc87882,
    roughness: 0.5,
    metalness: 0.1,
    name: 'LungMaterial'
  });

  if (leftLungGeoms.length > 0) {
    const ml = BufferGeometryUtils.mergeGeometries(leftLungGeoms, false);
    ml.computeVertexNormals();
    const meshL = new THREE.Mesh(ml, lungMat.clone());
    meshL.name = 'Left_Lung';
    meshL.userData = {
      anatomyId: 'Left_Lung',
      anatomyKey: 'lung',
      anatomyName: 'Left Lung',
      system: 'Respiratory',
      function: 'Gas exchange: extracts oxygen from inhaled air and releases carbon dioxide',
      description: 'Composed of superior and inferior lobes, featuring cardiac notch to accommodate heart position.',
      originalPosition: [0, 0, 0],
      explodedPosition: [-0.55, 0.05, 0.25],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0.2, 0]
    };
    masterScene.add(meshL);
  }

  if (rightLungGeoms.length > 0) {
    const mr = BufferGeometryUtils.mergeGeometries(rightLungGeoms, false);
    mr.computeVertexNormals();
    const meshR = new THREE.Mesh(mr, lungMat.clone());
    meshR.name = 'Right_Lung';
    meshR.userData = {
      anatomyId: 'Right_Lung',
      anatomyKey: 'lung',
      anatomyName: 'Right Lung',
      system: 'Respiratory',
      function: 'Gas exchange: extracts oxygen from inhaled air and releases carbon dioxide',
      description: 'Larger than the left lung, comprising superior, middle, and inferior lobes with 300 million alveoli.',
      originalPosition: [0, 0, 0],
      explodedPosition: [0.55, 0.05, 0.25],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, -0.2, 0]
    };
    masterScene.add(meshR);
  }

  // 5. Load and add Liver
  console.log('Adding Liver...');
  const liverGLTF = await loadGLTF('temp_liver.glb');
  liverGLTF.scene.scale.setScalar(0.95);
  liverGLTF.scene.position.set(0.04, 1.07, 0.03);
  liverGLTF.scene.updateWorldMatrix(true, true);
  const liverGeoms = [];
  liverGLTF.scene.traverse(o => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      liverGeoms.push(cleanGeom(g));
    }
  });
  if (liverGeoms.length > 0) {
    const ml = BufferGeometryUtils.mergeGeometries(liverGeoms, false);
    ml.computeVertexNormals();
    const liverMesh = new THREE.Mesh(ml, new THREE.MeshStandardMaterial({
      color: 0x8a3328,
      roughness: 0.45,
      metalness: 0.15,
      name: 'LiverMaterial'
    }));
    liverMesh.name = 'Liver';
    liverMesh.userData = {
      anatomyId: 'Liver',
      anatomyKey: 'liver',
      anatomyName: 'Liver & Hepatic System',
      system: 'Digestive',
      function: 'Metabolizes nutrients, detoxifies blood, produces bile, and synthesizes plasma proteins',
      description: 'The body’s largest internal gland, performing over 500 chemical processes essential for homeostasis.',
      originalPosition: [0, 0, 0],
      explodedPosition: [0.55, -0.05, 0.40],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0.2, 0]
    };
    masterScene.add(liverMesh);
  }

  // 6. Load and add Stomach
  console.log('Adding Stomach...');
  const stomGLTF = await loadGLTF('temp_stomach.glb');
  stomGLTF.scene.scale.setScalar(0.18);
  stomGLTF.scene.position.set(-0.04, 1.00, 0.04);
  stomGLTF.scene.updateWorldMatrix(true, true);
  const stomGeoms = [];
  stomGLTF.scene.traverse(o => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      stomGeoms.push(cleanGeom(g));
    }
  });
  if (stomGeoms.length > 0) {
    const ms = BufferGeometryUtils.mergeGeometries(stomGeoms, false);
    ms.computeVertexNormals();
    const stomMesh = new THREE.Mesh(ms, new THREE.MeshStandardMaterial({
      color: 0xba5a5b,
      roughness: 0.45,
      metalness: 0.1,
      name: 'StomachMaterial'
    }));
    stomMesh.name = 'Stomach';
    stomMesh.userData = {
      anatomyId: 'Stomach',
      anatomyKey: 'stomach',
      anatomyName: 'Stomach & Gastric Antrum',
      system: 'Digestive',
      function: 'Secretes gastric acid and digestive enzymes to break down food into chyme',
      description: 'J-shaped muscular reservoir churning food through peristalsis prior to duodenal absorption.',
      originalPosition: [0, 0, 0],
      explodedPosition: [-0.45, -0.05, 0.55],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, -0.15, 0]
    };
    masterScene.add(stomMesh);
  }

  // 7. Load and add Kidneys
  console.log('Adding Kidneys...');
  const kidGLTF = await loadGLTF('temp_kidney.glb');
  
  // Left Kidney
  kidGLTF.scene.scale.setScalar(0.026);
  kidGLTF.scene.position.set(-0.065, 1.05, -0.04);
  kidGLTF.scene.updateWorldMatrix(true, true);
  const leftKidGeoms = [];
  kidGLTF.scene.traverse(o => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      leftKidGeoms.push(cleanGeom(g));
    }
  });
  if (leftKidGeoms.length > 0) {
    const mkL = BufferGeometryUtils.mergeGeometries(leftKidGeoms, false);
    mkL.computeVertexNormals();
    const kidMat = new THREE.MeshStandardMaterial({
      color: 0x7a2228,
      roughness: 0.4,
      metalness: 0.15,
      name: 'KidneyMaterial'
    });
    const leftKidMesh = new THREE.Mesh(mkL, kidMat.clone());
    leftKidMesh.name = 'Left_Kidney';
    leftKidMesh.userData = {
      anatomyId: 'Left_Kidney',
      anatomyKey: 'kidney',
      anatomyName: 'Left Kidney',
      system: 'Urinary',
      function: 'Filters waste products and excess water from bloodstream to generate urine',
      description: 'Bean-shaped retroperitoneal organ containing approximately 1 million nephrons for osmotic regulation.',
      originalPosition: [0, 0, 0],
      explodedPosition: [-0.45, 0, -0.35],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, -0.2, 0]
    };
    masterScene.add(leftKidMesh);
  }

  // Right Kidney
  kidGLTF.scene.scale.setScalar(0.026);
  kidGLTF.scene.position.set(0.065, 1.03, -0.04);
  kidGLTF.scene.updateWorldMatrix(true, true);
  const rightKidGeoms = [];
  kidGLTF.scene.traverse(o => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      rightKidGeoms.push(cleanGeom(g));
    }
  });
  if (rightKidGeoms.length > 0) {
    const mkR = BufferGeometryUtils.mergeGeometries(rightKidGeoms, false);
    mkR.computeVertexNormals();
    const rightKidMesh = new THREE.Mesh(mkR, new THREE.MeshStandardMaterial({
      color: 0x7a2228,
      roughness: 0.4,
      metalness: 0.15,
      name: 'KidneyMaterial'
    }));
    rightKidMesh.name = 'Right_Kidney';
    rightKidMesh.userData = {
      anatomyId: 'Right_Kidney',
      anatomyKey: 'kidney',
      anatomyName: 'Right Kidney',
      system: 'Urinary',
      function: 'Filters metabolic waste, balances electrolytes, and maintains arterial blood pressure',
      description: 'Positioned slightly lower than the left kidney due to the right hepatic lobe asymmetry.',
      originalPosition: [0, 0, 0],
      explodedPosition: [0.45, 0, -0.35],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0.2, 0]
    };
    masterScene.add(rightKidMesh);
  }

  // 8. Add Intestines (Digestive system loop)
  console.log('Generating Intestines...');
  const curvePoints = [];
  for (let t = 0; t <= 36; t++) {
    const angle = t * 0.9;
    const r = 0.055 + Math.sin(t * 1.5) * 0.02;
    const x = Math.sin(angle) * r;
    const y = 0.92 - (t / 36) * 0.14 + Math.sin(t * 2) * 0.015;
    const z = 0.03 + Math.cos(angle) * (r * 0.6);
    curvePoints.push(new THREE.Vector3(x, y, z));
  }
  const intestineCurve = new THREE.CatmullRomCurve3(curvePoints);
  const intestineGeom = new THREE.TubeGeometry(intestineCurve, 64, 0.013, 8, false);
  const intestineMesh = new THREE.Mesh(intestineGeom, new THREE.MeshStandardMaterial({
    color: 0xc47e68,
    roughness: 0.4,
    metalness: 0.1,
    name: 'IntestinesMaterial'
  }));
  intestineMesh.name = 'Intestines';
  intestineMesh.userData = {
    anatomyId: 'Intestines',
    anatomyKey: 'intestines',
    anatomyName: 'Intestines (Small & Large)',
    system: 'Digestive',
    function: 'Digests food, absorbs 90% of water and nutrients into circulation, and compacts waste',
    description: 'A 7-meter winding convoluted digestive tract comprising the duodenum, jejunum, ileum, and colon.',
    originalPosition: [0, 0, 0],
    explodedPosition: [0, -0.35, 0.45],
    originalRotation: [0, 0, 0],
    explodedRotation: [0, 0, 0]
  };
  masterScene.add(intestineMesh);

  // 9. Add Muscles layer
  console.log('Generating Muscular Layer...');
  const muscleGroups = [];
  // Torso pectorals and abdominal obliques
  const pecGeomL = new THREE.SphereGeometry(0.065, 16, 16);
  pecGeomL.scale(1.2, 0.8, 0.5);
  pecGeomL.translate(-0.06, 1.25, 0.075);
  muscleGroups.push(pecGeomL);

  const pecGeomR = new THREE.SphereGeometry(0.065, 16, 16);
  pecGeomR.scale(1.2, 0.8, 0.5);
  pecGeomR.translate(0.06, 1.25, 0.075);
  muscleGroups.push(pecGeomR);

  // Rectus abdominis
  for (let row = 0; row < 3; row++) {
    const abL = new THREE.BoxGeometry(0.042, 0.045, 0.02);
    abL.translate(-0.026, 1.12 - row * 0.055, 0.08);
    muscleGroups.push(abL);
    const abR = new THREE.BoxGeometry(0.042, 0.045, 0.02);
    abR.translate(0.026, 1.12 - row * 0.055, 0.08);
    muscleGroups.push(abR);
  }

  // Biceps left & right
  const bicepL = new THREE.CylinderGeometry(0.025, 0.022, 0.16, 12);
  bicepL.translate(-0.21, 1.18, 0.01);
  muscleGroups.push(bicepL);
  const bicepR = new THREE.CylinderGeometry(0.025, 0.022, 0.16, 12);
  bicepR.translate(0.21, 1.18, 0.01);
  muscleGroups.push(bicepR);

  // Quadriceps left & right
  const quadL = new THREE.CylinderGeometry(0.048, 0.038, 0.32, 14);
  quadL.translate(-0.11, 0.58, 0.015);
  muscleGroups.push(quadL);
  const quadR = new THREE.CylinderGeometry(0.048, 0.038, 0.32, 14);
  quadR.translate(0.11, 0.58, 0.015);
  muscleGroups.push(quadR);

  const mergedMuscles = BufferGeometryUtils.mergeGeometries(muscleGroups, false);
  mergedMuscles.computeVertexNormals();
  const muscleMat = new THREE.MeshStandardMaterial({
    color: 0x9e2b34,
    roughness: 0.55,
    metalness: 0.15,
    name: 'MuscleMaterial'
  });
  const muscleMesh = new THREE.Mesh(mergedMuscles, muscleMat);
  muscleMesh.name = 'Muscles';
  muscleMesh.userData = {
    anatomyId: 'Muscles',
    anatomyKey: 'muscle',
    anatomyName: 'Muscular System',
    system: 'Muscular',
    function: 'Enables active posture, movement, joint stabilization, and heat generation',
    description: 'Skeletal muscle fibers contracts via actin-myosin cross-bridges under somatic motor neuron control.',
    originalPosition: [0, 0, 0],
    explodedPosition: [0, 0, 0.25],
    originalRotation: [0, 0, 0],
    explodedRotation: [0, 0, 0]
  };
  masterScene.add(muscleMesh);

  // 10. Add Translucent Skin Silhouette
  console.log('Adding Translucent Human Skin Mesh...');
  const skinGLTF = await loadGLTF('temp_skin.glb');
  let skinMeshFound = null;
  skinGLTF.scene.traverse(o => {
    if (o.isMesh) skinMeshFound = o;
  });

  if (skinMeshFound) {
    const skinGeom = skinMeshFound.geometry.clone();
    skinGeom.computeBoundingBox();
    const curBox = skinGeom.boundingBox;
    const curCenterY = (curBox.min.y + curBox.max.y) / 2;
    const curHeight = curBox.max.y - curBox.min.y;

    // Center to origin first
    skinGeom.translate(
      -(curBox.min.x + curBox.max.x) / 2,
      -curCenterY,
      -(curBox.min.z + curBox.max.z) / 2
    );

    // Skeleton spans Y from ~0.01 to ~1.71 (height ~1.70, center ~0.86)
    const targetHeight = 1.70;
    const sFactor = targetHeight / curHeight;
    skinGeom.scale(sFactor, sFactor, sFactor);
    skinGeom.translate(0, 0.86, 0);
    skinGeom.computeVertexNormals();

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0x3ac5d8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.25,
      metalness: 0.2,
      emissive: new THREE.Color(0x062835),
      emissiveIntensity: 0.6,
      name: 'SkinMaterial'
    });
    const skinMesh = new THREE.Mesh(skinGeom, skinMat);
    skinMesh.name = 'Skin';
    skinMesh.userData = {
      anatomyId: 'Skin',
      anatomyKey: 'skin',
      anatomyName: 'Integumentary Skin Layer',
      system: 'Integumentary',
      function: 'Protective external barrier against pathogens, UV radiation, and dehydration',
      description: 'Composed of epidermis, dermis, and subcutaneous hypodermis housing millions of thermoreceptors.',
      originalPosition: [0, 0, 0],
      explodedPosition: [0, 0, 0.50],
      originalRotation: [0, 0, 0],
      explodedRotation: [0, 0, 0]
    };
    masterScene.add(skinMesh);
  }

  // Calculate master bounds
  const masterBox = new THREE.Box3().setFromObject(masterScene);
  console.log('Master scene bounds:', masterBox.min, masterBox.max);
  console.log('Total children in master scene:', masterScene.children.length);

  // Export to /models/anatomy/human-anatomy.glb
  console.log('Exporting master GLB to models/anatomy/human-anatomy.glb...');
  const glbBuffer = await exportGLB(masterScene);
  fs.writeFileSync('models/anatomy/human-anatomy.glb', Buffer.from(glbBuffer));
  console.log('SUCCESS! Wrote models/anatomy/human-anatomy.glb (' + glbBuffer.byteLength + ' bytes)');
}

build().catch(err => {
  console.error('Build error:', err);
  process.exit(1);
});
