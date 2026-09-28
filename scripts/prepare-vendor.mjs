import fs from 'fs';
import path from 'path';

const vendorDir = path.resolve('vendor');
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true });
}

// Copy three.module.js
fs.copyFileSync(
  'node_modules/three/build/three.module.js',
  path.join(vendorDir, 'three.module.js')
);

// Copy OrbitControls.js with import fix for local three
let orbitContent = fs.readFileSync(
  'node_modules/three/examples/jsm/controls/OrbitControls.js',
  'utf8'
);
orbitContent = orbitContent.replace(/from\s+['"]three['"]/g, "from './three.module.js'");
fs.writeFileSync(path.join(vendorDir, 'OrbitControls.js'), orbitContent);

// Copy GLTFLoader.js with import fix for local three
let gltfContent = fs.readFileSync(
  'node_modules/three/examples/jsm/loaders/GLTFLoader.js',
  'utf8'
);
gltfContent = gltfContent.replace(/from\s+['"]three['"]/g, "from './three.module.js'");
fs.writeFileSync(path.join(vendorDir, 'GLTFLoader.js'), gltfContent);

// Copy gsap
fs.copyFileSync(
  'node_modules/gsap/index.js',
  path.join(vendorDir, 'gsap.js')
);

// Copy ScrollTrigger
fs.copyFileSync(
  'node_modules/gsap/ScrollTrigger.js',
  path.join(vendorDir, 'ScrollTrigger.js')
);

console.log('Vendor files successfully prepared in ./vendor !');
