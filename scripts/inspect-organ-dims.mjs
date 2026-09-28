import fs from 'fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

global.self = global;
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onload) this.onload();
      if (this.onloadend) this.onloadend();
    });
  }
};
global.createImageBitmap = async () => ({ width: 1, height: 1, close: () => {} });

const loader = new GLTFLoader();

function load(file) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(file);
    loader.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '', resolve, reject);
  });
}

async function main() {
  const files = [
    'temp_skeleton.glb',
    'temp_brain.glb',
    'temp_heart.glb',
    'temp_lung.glb',
    'temp_liver.glb',
    'temp_kidney.glb',
    'temp_stomach.glb'
  ];

  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.log(f, 'does not exist');
      continue;
    }
    const gltf = await load(f);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    console.log(f, {
      center: center.toArray().map(n => +n.toFixed(3)),
      size: size.toArray().map(n => +n.toFixed(3))
    });
  }
}

main().catch(console.error);
