/**
 * React hook for organic jitter effects
 * Provides Perlin/Simplex noise-based position, rotation, and scale jitter
 * Respects prefers-reduced-motion for accessibility
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { JitterGenerator, JitterState, JitterConfig, getGlobalJitter, destroyGlobalJitter } from '@/lib/jitter';

export interface UseJitterOptions extends Partial<JitterConfig> {
  /** Use the global singleton jitter instance */
  useGlobal?: boolean;
  /** Enable jitter on mount */
  enabled?: boolean;
}

export interface UseJitterReturn {
  /** Current jitter state */
  state: JitterState;
  /** Start the jitter animation */
  start: () => void;
  /** Stop the jitter animation */
  stop: () => void;
  /** Toggle jitter on/off */
  toggle: () => void;
  /** Whether jitter is currently running */
  isRunning: boolean;
  /** Update jitter configuration */
  updateConfig: (config: Partial<JitterConfig>) => void;
  /** Force reduced motion mode */
  setReducedMotion: (reduced: boolean) => void;
}

/**
 * Hook for organic jitter effects using Perlin/Simplex noise
 * 
 * @example
 * ```tsx
 * const { state, start, stop, isRunning } = useJitter({
 *   position: { amplitude: 2, frequency: 0.5 },
 *   rotation: { amplitude: 0.02 },
 *   scale: { amplitude: 0.01 },
 *   speed: 0.001,
 * });
 * 
 * // Apply to element style
 * <div style={{
 *   transform: `translate(${state.position.x}px, ${state.position.y}px) rotate(${state.rotation}rad) scale(${state.scale})`
 * }}>
 *   Content
 * </div>
 * ```
 */
export function useJitter(options: UseJitterOptions = {}): UseJitterReturn {
  const {
    useGlobal = false,
    enabled = true,
    ...config
  } = options;

  const generatorRef = useRef<JitterGenerator | null>(null);
  const isRunningRef = useRef(false);
  const [state, setState] = useState<JitterState>({
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: 1,
  });
  const [isRunning, setIsRunning] = useState(false);

  // Initialize generator
  useEffect(() => {
    if (useGlobal) {
      generatorRef.current = getGlobalJitter(config);
    } else {
      generatorRef.current = new JitterGenerator(config);
    }

    // Subscribe to state updates
    const unsubscribe = generatorRef.current.subscribe(setState);

    // Auto-start if enabled
    if (enabled && !isRunningRef.current) {
      generatorRef.current.start();
      isRunningRef.current = true;
      setIsRunning(true);
    }

    return () => {
      unsubscribe();
      if (!useGlobal && generatorRef.current) {
        generatorRef.current.destroy();
        generatorRef.current = null;
      }
      isRunningRef.current = false;
      setIsRunning(false);
    };
  }, [useGlobal]);

  // Update config when options change
  useEffect(() => {
    if (generatorRef.current) {
      generatorRef.current.updateConfig(config);
    }
  }, [config]);

  const start = useCallback(() => {
    if (generatorRef.current && !isRunningRef.current) {
      generatorRef.current.start();
      isRunningRef.current = true;
      setIsRunning(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (generatorRef.current && isRunningRef.current) {
      generatorRef.current.stop();
      isRunningRef.current = false;
      setIsRunning(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRunningRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const updateConfig = useCallback((newConfig: Partial<JitterConfig>) => {
    if (generatorRef.current) {
      generatorRef.current.updateConfig(newConfig);
    }
  }, []);

  const setReducedMotion = useCallback((reduced: boolean) => {
    if (generatorRef.current) {
      generatorRef.current.setReducedMotion(reduced);
    }
  }, []);

  return {
    state,
    start,
    stop,
    toggle,
    isRunning,
    updateConfig,
    setReducedMotion,
  };
}

/**
 * Hook for applying jitter to a CSS transform
 * Returns a style object ready to spread onto an element
 */
export function useJitterTransform(options: UseJitterOptions = {}): React.CSSProperties {
  const { state } = useJitter(options);
  
  return {
    transform: `translate(${state.position.x}px, ${state.position.y}px) rotate(${state.rotation}rad) scale(${state.scale})`,
    willChange: 'transform',
  } as React.CSSProperties;
}

/**
 * Hook for subtle jitter - reduced amplitude for UI elements
 */
export function useSubtleJitter(options: UseJitterOptions = {}): UseJitterReturn {
  return useJitter({
    position: { amplitude: 0.5, frequency: 0.3, octaves: 2 },
    rotation: { amplitude: 0.005, frequency: 0.2, octaves: 1 },
    scale: { amplitude: 0.003, frequency: 0.15, octaves: 1 },
    speed: 0.0008,
    ...options,
  });
}

/**
 * Hook for card hover jitter - more pronounced effect
 */
export function useCardJitter(options: UseJitterOptions = {}): UseJitterReturn {
  return useJitter({
    position: { amplitude: 1.5, frequency: 0.4, octaves: 2 },
    rotation: { amplitude: 0.01, frequency: 0.25, octaves: 1 },
    scale: { amplitude: 0.008, frequency: 0.2, octaves: 1 },
    speed: 0.0012,
    ...options,
  });
}

// Cleanup global jitter on unmount (for testing)
export function useJitterCleanup(): void {
  useEffect(() => {
    return () => {
      destroyGlobalJitter();
    };
  }, []);
}