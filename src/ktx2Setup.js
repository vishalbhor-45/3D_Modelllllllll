// Configure KTX2 loader for drei's useGLTF
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

// Create KTX2 loader at module load time (before drei creates instances)
let ktx2Loader = new KTX2Loader()
  .setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/libs/basis/");

// Patch GLTFLoader prototype at module load time (before drei creates instances)
const originalParse = GLTFLoader.prototype.parse;
const originalLoad = GLTFLoader.prototype.load;

GLTFLoader.prototype.parse = function(...args) {
  if (!this.ktx2Loader && ktx2Loader) {
    this.setKTX2Loader(ktx2Loader);
  }
  return originalParse.apply(this, args);
};

GLTFLoader.prototype.load = function(...args) {
  if (!this.ktx2Loader && ktx2Loader) {
    this.setKTX2Loader(ktx2Loader);
  }
  return originalLoad.apply(this, args);
};

export function setupKTX2(renderer) {
  if (renderer) {
    // Update support detection with the actual renderer
    try {
      ktx2Loader.detectSupport(renderer);
    } catch (e) {
      console.warn('Could not detect KTX2 support:', e);
    }
  }
  return ktx2Loader;
}

