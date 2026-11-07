/**
 * Hook for fisheye distortion controller.
 * Manages focus state, animation, and respects prefers-reduced-motion.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FisheyeConfig, FisheyeTransform } from '@/lib/fisheye';
import { polarFisheye, createFisheyeConfig, inversePolarFisheye } from '@/lib/fisheye';

export interface UseFisheyeOptions {
  /** Initial focus point in normalized coordinates [0, 1] */
  initialFocusX?: number;
  initialFocusY?: number;
  /** Radius of focus region in normalized coordinates */
  radius?: number;
  /** Distortion strength (0-1) */
  strength?: number;
  /** Smoothness of transition */
  smoothness?: number;
  /** Viewport dimensions */
  viewportWidth?: number;
  viewportHeight?: number;
  /** Random seed for reproducibility */
  seed?: number;
  /** Enable fisheye distortion */
  enabled?: boolean;
  /** Animation duration for focus transitions (ms) */
  transitionDuration?: number;
  /** Respect prefers-reduced-motion media query */
  respectReducedMotion?: boolean;
}

export interface UseFisheyeReturn {
  /** Current fisheye configuration */
  config: FisheyeConfig;
  /** Update focus point (normalized 0-1) */
  setFocus: (x: number, y: number, animate?: boolean) => void;
  /** Set focus to a specific feature by its bounding box */
  focusOnFeature: (bounds: DOMRect, containerBounds: DOMRect, animate?: boolean) => void;
  /** Enable/disable fisheye */
  setEnabled: (enabled: boolean) => void;
  /** Update viewport dimensions */
  setViewportSize: (width: number, height: number) => void;
  /** Transform a point through fisheye */
  transformPoint: (x: number, y: number) => FisheyeTransform;
  /** Inverse transform (for hit testing) */
  inverseTransformPoint: (x: number, y: number) => { x: number; y: number };
  /** Current focus point in normalized coordinates */
  focusPoint: { x: number; y: number };
  /** Whether fisheye is currently animating */
  isAnimating: boolean;
  /** Whether fisheye is enabled */
  isEnabled: boolean;
  /** Reset to center */
  reset: () => void;
}

/**
 * Hook for managing fisheye distortion state and transformations.
 */
export function useFisheye(options: UseFisheyeOptions = {}): UseFisheyeReturn {
  const {
    initialFocusX = 0.5,
    initialFocusY = 0.5,
    radius = 0.3,
    strength = 0.5,
    smoothness = 2.0,
    viewportWidth = 1024,
    viewportHeight = 768,
    seed = 42,
    enabled = true,
    transitionDuration = 300,
    respectReducedMotion = true,
  } = options;

  const [config, setConfig] = useState<FisheyeConfig>(() =>
    createFisheyeConfig({
      focusX: initialFocusX,
      focusY: initialFocusY,
      radius,
      strength,
      smoothness,
      seed,
      viewportWidth,
      viewportHeight,
    })
  );
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<{ start: number; fromX: number; fromY: number; toX: number; toY: number } | null>(null);
  const reducedMotionRef = useRef(false);
  const animationFrameRef = useRef<number>();

  // Check prefers-reduced-motion
  useEffect(() => {
    if (!respectReducedMotion) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;

    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [respectReducedMotion]);

  // Animation loop for smooth focus transitions
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!animationRef.current) return;

      const { start, fromX, fromY, toX, toY } = animationRef.current;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / transitionDuration, 1);

      // Easing function (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const currentX = fromX + (toX - fromX) * easedProgress;
      const currentY = fromY + (toY - fromY) * easedProgress;

      setConfig((prev) => ({
        ...prev,
        focusX: currentX,
        focusY: currentY,
      }));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        setIsAnimating(false);
      }
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [transitionDuration]);

  const setFocus = useCallback(
    (x: number, y: number, animate = true) => {
      const clampedX = Math.max(0, Math.min(1, x));
      const clampedY = Math.max(0, Math.min(1, y));

      if (animate && !reducedMotionRef.current && isEnabled) {
        setIsAnimating(true);
        animationRef.current = {
          start: performance.now(),
          fromX: config.focusX,
          fromY: config.focusY,
          toX: clampedX,
          toY: clampedY,
        };
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame((ts) => animate(ts));
      } else {
        setConfig((prev) => ({
          ...prev,
          focusX: clampedX,
          focusY: clampedY,
        }));
      }
    },
    [config.focusX, config.focusY, isEnabled]
  );

  const focusOnFeature = useCallback(
    (bounds: DOMRect, containerBounds: DOMRect, animate = true) => {
      const centerX = (bounds.left + bounds.width / 2 - containerBounds.left) / containerBounds.width;
      const centerY = (bounds.top + bounds.height / 2 - containerBounds.top) / containerBounds.height;
      setFocus(centerX, centerY, animate);
    },
    [setFocus]
  );

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      // Reset to center when disabled
      setConfig((prev) => ({
        ...prev,
        focusX: 0.5,
        focusY: 0.5,
      }));
    }
  }, []);

  const setViewportSize = useCallback((width: number, height: number) => {
    setConfig((prev) => ({
      ...prev,
      viewportWidth: width,
      viewportHeight: height,
    }));
  }, []);

  const transformPoint = useCallback(
    (x: number, y: number) => {
      return polarFisheye(x, y, config);
    },
    [config]
  );

  const inverseTransformPoint = useCallback(
    (x: number, y: number) => {
      return inversePolarFisheye(x, y, config);
    },
    [config]
  );

  const reset = useCallback(() => {
    setFocus(0.5, 0.5, true);
  }, [setFocus]);

  return {
    config,
    setFocus,
    focusOnFeature,
    setEnabled,
    setViewportSize,
    transformPoint,
    inverseTransformPoint,
    focusPoint: { x: config.focusX, y: config.focusY },
    isAnimating,
    isEnabled,
    reset,
  };
}