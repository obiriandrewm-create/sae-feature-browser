/**
 * Perlin/Simplex noise implementation for organic jitter effects
 * Respects prefers-reduced-motion for accessibility
 */

// Simplex noise implementation (faster than Perlin, better quality)
// Based on Stefan Gustavson's implementation
const SIMPLEX_GRADIENTS_2D = new Float32Array([
  1, 1, -1, 1, 1, -1, -1, -1,
  1, 0, -1, 0, 1, 0, -1, 0,
  0, 1, 0, -1, 0, 1, 0, -1,
]);

const SIMPLEX_GRADIENTS_3D = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

export interface NoiseOptions {
  frequency?: number;
  amplitude?: number;
  octaves?: number;
  persistence?: number;
  lacunarity?: number;
  seed?: number;
}

export interface JitterState {
  position: { x: number; y: number };
  rotation: number;
  scale: number;
}

export interface JitterConfig {
  position: NoiseOptions;
  rotation: NoiseOptions;
  scale: NoiseOptions;
  speed: number;
  reducedMotion: boolean;
}

function createPermutation(seed: number): Uint8Array {
  const p = new Uint8Array(512);
  let random = seed;
  
  for (let i = 0; i < 256; i++) {
    random = (random * 1664525 + 1013904223) % 4294967296;
    p[i] = i;
  }
  
  for (let i = 255; i > 0; i--) {
    random = (random * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((random / 4294967296) * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  
  for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i];
  }
  
  return p;
}

function simplex2D(x: number, y: number, perm: Uint8Array): number {
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const t = (i + j) * G2;
  const X0 = i - t;
  const Y0 = j - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  
  let i1, j1;
  if (x0 > y0) {
    i1 = 1; j1 = 0;
  } else {
    i1 = 0; j1 = 1;
  }
  
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;
  
  const ii = i & 255;
  const jj = j & 255;
  
  const gi0 = perm[ii + perm[jj]] % 12;
  const gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
  const gi2 = perm[ii + 1 + perm[jj + 1]] % 12;
  
  let n0 = 0, n1 = 0, n2 = 0;
  
  const t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 >= 0) {
    const g0x = SIMPLEX_GRADIENTS_2D[gi0 * 2] ?? 0;
    const g0y = SIMPLEX_GRADIENTS_2D[gi0 * 2 + 1] ?? 0;
    const t0_2 = t0 * t0;
    n0 = t0_2 * t0_2 * (g0x * x0 + g0y * y0);
  }
  
  const t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 >= 0) {
    const g1x = SIMPLEX_GRADIENTS_2D[gi1 * 2] ?? 0;
    const g1y = SIMPLEX_GRADIENTS_2D[gi1 * 2 + 1] ?? 0;
    const t1_2 = t1 * t1;
    n1 = t1_2 * t1_2 * (g1x * x1 + g1y * y1);
  }
  
  const t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 >= 0) {
    const g2x = SIMPLEX_GRADIENTS_2D[gi2 * 2] ?? 0;
    const g2y = SIMPLEX_GRADIENTS_2D[gi2 * 2 + 1] ?? 0;
    const t2_2 = t2 * t2;
    n2 = t2_2 * t2_2 * (g2x * x2 + g2y * y2);
  }
  
  return 70.0 * (n0 + n1 + n2);
}

function simplex3D(x: number, y: number, z: number, perm: Uint8Array): number {
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = x - X0;
  const y0 = y - Y0;
  const z0 = z - Z0;
  
  let i1, j1, k1, i2, j2, k2;
  
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  } else {
    if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
    else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
  }
  
  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2.0 * G3;
  const y2 = y0 - j2 + 2.0 * G3;
  const z2 = z0 - k2 + 2.0 * G3;
  const x3 = x0 - 1.0 + 3.0 * G3;
  const y3 = y0 - 1.0 + 3.0 * G3;
  const z3 = z0 - 1.0 + 3.0 * G3;
  
  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  
  const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
  const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
  const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
  const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;

  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

  const t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 >= 0) {
    const g0x = SIMPLEX_GRADIENTS_3D[gi0 * 3] ?? 0;
    const g0y = SIMPLEX_GRADIENTS_3D[gi0 * 3 + 1] ?? 0;
    const g0z = SIMPLEX_GRADIENTS_3D[gi0 * 3 + 2] ?? 0;
    const t0_2 = t0 * t0;
    n0 = t0_2 * t0_2 * (g0x * x0 + g0y * y0 + g0z * z0);
  }

  const t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 >= 0) {
    const g1x = SIMPLEX_GRADIENTS_3D[gi1 * 3] ?? 0;
    const g1y = SIMPLEX_GRADIENTS_3D[gi1 * 3 + 1] ?? 0;
    const g1z = SIMPLEX_GRADIENTS_3D[gi1 * 3 + 2] ?? 0;
    const t1_2 = t1 * t1;
    n1 = t1_2 * t1_2 * (g1x * x1 + g1y * y1 + g1z * z1);
  }

  const t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 >= 0) {
    const g2x = SIMPLEX_GRADIENTS_3D[gi2 * 3] ?? 0;
    const g2y = SIMPLEX_GRADIENTS_3D[gi2 * 3 + 1] ?? 0;
    const g2z = SIMPLEX_GRADIENTS_3D[gi2 * 3 + 2] ?? 0;
    const t2_2 = t2 * t2;
    n2 = t2_2 * t2_2 * (g2x * x2 + g2y * y2 + g2z * z2);
  }

  const t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 >= 0) {
    const g3x = SIMPLEX_GRADIENTS_3D[gi3 * 3] ?? 0;
    const g3y = SIMPLEX_GRADIENTS_3D[gi3 * 3 + 1] ?? 0;
    const g3z = SIMPLEX_GRADIENTS_3D[gi3 * 3 + 2] ?? 0;
    const t3_2 = t3 * t3;
    n3 = t3_2 * t3_2 * (g3x * x3 + g3y * y3 + g3z * z3);
  }
  
  return 32.0 * (n0 + n1 + n2 + n3);
}

function fbm2D(x: number, y: number, perm: Uint8Array, octaves: number, persistence: number, lacunarity: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * simplex2D(x * frequency, y * frequency, perm);
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  return value / maxValue;
}

function fbm3D(x: number, y: number, z: number, perm: Uint8Array, octaves: number, persistence: number, lacunarity: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * simplex3D(x * frequency, y * frequency, z * frequency, perm);
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  return value / maxValue;
}

export class JitterGenerator {
  private perm: Uint8Array;
  private time: number = 0;
  private config: Required<JitterConfig>;
  private animationFrame: number | null = null;
  private callbacks: Set<(state: JitterState) => void> = new Set();
  private reducedMotionListener: (() => void) | null = null;

  constructor(config: Partial<JitterConfig> = {}) {
    this.config = {
      position: {
        frequency: 0.5,
        amplitude: 2,
        octaves: 2,
        persistence: 0.5,
        lacunarity: 2,
        seed: 12345,
        ...config.position,
      },
      rotation: {
        frequency: 0.3,
        amplitude: 0.02,
        octaves: 1,
        persistence: 0.5,
        lacunarity: 2,
        seed: 54321,
        ...config.rotation,
      },
      scale: {
        frequency: 0.2,
        amplitude: 0.01,
        octaves: 1,
        persistence: 0.5,
        lacunarity: 2,
        seed: 98765,
        ...config.scale,
      },
      speed: config.speed ?? 0.001,
      reducedMotion: config.reducedMotion ?? false,
    };

    this.perm = createPermutation(this.config.position.seed);
    this.setupReducedMotionListener();
  }

  private setupReducedMotionListener(): void {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.config.reducedMotion = mediaQuery.matches;
    
    this.reducedMotionListener = (e: MediaQueryListEvent) => {
      this.config.reducedMotion = e.matches;
    };
    
    mediaQuery.addEventListener('change', this.reducedMotionListener);
  }

  private computeState(): JitterState {
    if (this.config.reducedMotion) {
      return { position: { x: 0, y: 0 }, rotation: 0, scale: 1 };
    }

    const t = this.time;
    const posFreq = this.config.position.frequency;
    const posAmp = this.config.position.amplitude;
    const posOctaves = this.config.position.octaves;
    const posPersist = this.config.position.persistence;
    const posLacunarity = this.config.position.lacunarity;
    
    const rotFreq = this.config.rotation.frequency;
    const rotAmp = this.config.rotation.amplitude;
    const rotOctaves = this.config.rotation.octaves;
    const rotPersist = this.config.rotation.persistence;
    const rotLacunarity = this.config.rotation.lacunarity;
    
    const scaleFreq = this.config.scale.frequency;
    const scaleAmp = this.config.scale.amplitude;
    const scaleOctaves = this.config.scale.octaves;
    const scalePersist = this.config.scale.persistence;
    const scaleLacunarity = this.config.scale.lacunarity;

    // Position uses 2D noise with time as third dimension
    const x = fbm2D(t * posFreq, 0, this.perm, posOctaves, posPersist, posLacunarity) * posAmp;
    const y = fbm2D(0, t * posFreq, this.perm, posOctaves, posPersist, posLacunarity) * posAmp;
    
    // Rotation uses 1D noise (time-based)
    const rotation = fbm2D(t * rotFreq, 100, this.perm, rotOctaves, rotPersist, rotLacunarity) * rotAmp;
    
    // Scale uses 1D noise (time-based, different seed offset)
    const scale = 1 + fbm2D(t * scaleFreq, 200, this.perm, scaleOctaves, scalePersist, scaleLacunarity) * scaleAmp;

    return {
      position: { x, y },
      rotation,
      scale,
    };
  }

  private animate = (): void => {
    this.time += this.config.speed;
    const state = this.computeState();
    this.callbacks.forEach(cb => cb(state));
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  start(): void {
    if (this.animationFrame !== null) return;
    this.animate();
  }

  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  subscribe(callback: (state: JitterState) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getState(): JitterState {
    return this.computeState();
  }

  setReducedMotion(reduced: boolean): void {
    this.config.reducedMotion = reduced;
  }

  updateConfig(config: Partial<JitterConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.position?.seed || config.rotation?.seed || config.scale?.seed) {
      this.perm = createPermutation(this.config.position.seed);
    }
  }

  destroy(): void {
    this.stop();
    this.callbacks.clear();
    if (this.reducedMotionListener) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.removeEventListener('change', this.reducedMotionListener);
      this.reducedMotionListener = null;
    }
  }
}

// Singleton instance for global jitter
let globalJitter: JitterGenerator | null = null;

export function getGlobalJitter(config?: Partial<JitterConfig>): JitterGenerator {
  if (!globalJitter) {
    globalJitter = new JitterGenerator(config);
  }
  return globalJitter;
}

export function destroyGlobalJitter(): void {
  if (globalJitter) {
    globalJitter.destroy();
    globalJitter = null;
  }
}

// Utility functions for direct noise sampling
export function simplexNoise2D(x: number, y: number, seed = 12345): number {
  const perm = createPermutation(seed);
  return simplex2D(x, y, perm);
}

export function simplexNoise3D(x: number, y: number, z: number, seed = 12345): number {
  const perm = createPermutation(seed);
  return simplex3D(x, y, z, perm);
}

export function fbmNoise2D(x: number, y: number, options: NoiseOptions = {}): number {
  const {
    frequency = 1,
    amplitude = 1,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2,
    seed = 12345,
  } = options;
  
  const perm = createPermutation(seed);
  return fbm2D(x * frequency, y * frequency, perm, octaves, persistence, lacunarity) * amplitude;
}

export function fbmNoise3D(x: number, y: number, z: number, options: NoiseOptions = {}): number {
  const {
    frequency = 1,
    amplitude = 1,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2,
    seed = 12345,
  } = options;
  
  const perm = createPermutation(seed);
  return fbm3D(x * frequency, y * frequency, z * frequency, perm, octaves, persistence, lacunarity) * amplitude;
}