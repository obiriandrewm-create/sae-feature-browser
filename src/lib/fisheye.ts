/**
 * Fisheye distortion math using polar coordinate mapping.
 * Provides smooth transition zone between focus and context regions.
 * Seeded for reproducibility.
 */

export interface FisheyeConfig {
  /** Focus point in normalized coordinates [0, 1] */
  focusX: number;
  /** Focus point in normalized coordinates [0, 1] */
  focusY: number;
  /** Radius of the focus region in normalized coordinates [0, 1] */
  radius: number;
  /** Distortion strength (0 = no distortion, 1 = maximum) */
  strength: number;
  /** Smoothness of transition zone (higher = smoother) */
  smoothness: number;
  /** Random seed for reproducible jitter/noise */
  seed: number;
  /** Viewport dimensions in pixels */
  viewportWidth: number;
  viewportHeight: number;
}

export interface FisheyeTransform {
  /** Transformed x coordinate in pixels */
  x: number;
  /** Transformed y coordinate in pixels */
  y: number;
  /** Scale factor at this point */
  scale: number;
  /** Whether the point is in the focus region */
  isInFocus: boolean;
  /** Distance from focus center in normalized coordinates */
  distance: number;
}

/**
 * Seeded pseudo-random number generator for reproducible noise/jitter.
 * Uses a simple LCG (Linear Congruential Generator).
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns a random float in [0, 1) */
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  /** Returns a random float in [min, max) */
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Reset to a new seed */
  setSeed(seed: number): void {
    this.state = seed >>> 0;
  }
}

/**
 * Polar coordinate mapping for fisheye distortion.
 * Maps cartesian coordinates to polar, applies distortion, maps back.
 */
export function polarFisheye(
  x: number,
  y: number,
  config: FisheyeConfig
): FisheyeTransform {
  const { focusX, focusY, radius, strength, smoothness, viewportWidth, viewportHeight } = config;

  // Convert to normalized coordinates relative to focus center
  const dx = x - focusX;
  const dy = y - focusY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check if point is in focus region
  const isInFocus = distance <= radius;

  if (distance === 0) {
    // At exact center - maximum scale
    return {
      x: focusX * viewportWidth,
      y: focusY * viewportHeight,
      scale: 1 + strength,
      isInFocus: true,
      distance: 0,
    };
  }

  let scale: number;
  let normalizedDistance: number;

  if (isInFocus) {
    // Inside focus region: linear scale increase toward center
    const progress = distance / radius;
    scale = 1 + strength * (1 - progress);
    normalizedDistance = distance * scale;
  } else {
    // Outside focus region: smooth transition to context
    const excessDistance = distance - radius;
    const transitionWidth = radius * smoothness;
    const transitionProgress = Math.min(excessDistance / transitionWidth, 1);

    // Smoothstep for smooth transition
    const smoothProgress = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);
    scale = 1 + strength * (1 - smoothProgress);
    normalizedDistance = radius + excessDistance * scale;
  }

  // Calculate angle and new position
  const angle = Math.atan2(dy, dx);
  const newX = focusX + Math.cos(angle) * normalizedDistance;
  const newY = focusY + Math.sin(angle) * normalizedDistance;

  return {
    x: newX * viewportWidth,
    y: newY * viewportHeight,
    scale,
    isInFocus,
    distance,
  };
}

/**
 * Batch transform multiple points for performance.
 */
export function polarFisheyeBatch(
  points: Array<{ x: number; y: number }>,
  config: FisheyeConfig
): FisheyeTransform[] {
  return points.map((p) => polarFisheye(p.x, p.y, config));
}

/**
 * Inverse transform: given a distorted coordinate, find the original.
 * Useful for hit-testing and cursor position mapping.
 */
export function inversePolarFisheye(
  distortedX: number,
  distortedY: number,
  config: FisheyeConfig
): { x: number; y: number } {
  const { focusX, focusY, radius, viewportWidth, viewportHeight } = config;

  // Convert to normalized
  const ndx = distortedX / viewportWidth - focusX;
  const ndy = distortedY / viewportHeight - focusY;
  const distortedDistance = Math.sqrt(ndx * ndx + ndy * ndy);

  if (distortedDistance === 0) {
    return { x: focusX, y: focusY };
  }

  const angle = Math.atan2(ndy, ndx);

  // Binary search for the original distance
  let low = 0;
  let high = Math.max(distortedDistance * 2, radius * 2);
  let originalDistance = distortedDistance;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const transform = polarFisheye(
      focusX + Math.cos(angle) * mid,
      focusY + Math.sin(angle) * mid,
      config
    );
    const testDist = Math.sqrt(
      Math.pow((transform.x / viewportWidth) - focusX, 2) +
      Math.pow((transform.y / viewportHeight) - focusY, 2)
    );

    if (testDist < distortedDistance) {
      low = mid;
    } else {
      high = mid;
    }
    originalDistance = mid;
  }

  return {
    x: focusX + Math.cos(angle) * originalDistance,
    y: focusY + Math.sin(angle) * originalDistance,
  };
}

/**
 * Create a default fisheye config with sensible defaults.
 */
export function createFisheyeConfig(overrides: Partial<FisheyeConfig> = {}): FisheyeConfig {
  return {
    focusX: 0.5,
    focusY: 0.5,
    radius: 0.3,
    strength: 0.5,
    smoothness: 2.0,
    seed: 42,
    viewportWidth: 1024,
    viewportHeight: 768,
    ...overrides,
  };
}

/**
 * Generate organic noise offset for a point using seeded random.
 * Used for subtle jitter effects in the focus region.
 */
export function generateFisheyeJitter(
  x: number,
  y: number,
  time: number,
  config: FisheyeConfig,
  intensity: number = 0.005
): { x: number; y: number } {
  const random = new SeededRandom(config.seed);
  // Use position and time to create coherent noise
  const hash = Math.sin(x * 12.9898 + y * 78.233 + time * 0.001) * 43758.5453;
  const noiseSeed = Math.floor((hash - Math.floor(hash)) * 4294967296);
  random.setSeed(noiseSeed ^ config.seed);

  return {
    x: (random.next() - 0.5) * intensity,
    y: (random.next() - 0.5) * intensity,
  };
}