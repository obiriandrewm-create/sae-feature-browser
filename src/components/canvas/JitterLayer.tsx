/**
 * JitterLayer - Canvas-based organic jitter effect overlay
 * Applies Perlin/Simplex noise-based transformations to child elements
 * Respects prefers-reduced-motion for accessibility
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { JitterGenerator, JitterState, JitterConfig } from '@/lib/jitter';

export interface JitterLayerProps {
  /** Child elements to apply jitter to */
  children: React.ReactNode;
  /** Jitter configuration */
  config?: Partial<JitterConfig>;
  /** Enable jitter on mount */
  enabled?: boolean;
  /** Class name for the canvas wrapper */
  className?: string;
  /** Style for the canvas wrapper */
  style?: React.CSSProperties;
  /** Callback when jitter state changes */
  onJitterChange?: (state: JitterState) => void;
  /** Use global jitter instance */
  useGlobal?: boolean;
}

interface JitterLayerRef {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  getState: () => JitterState;
}

/**
 * Canvas-based jitter layer for organic micro-interactions
 * 
 * @example
 * ```tsx
 * <JitterLayer
 *   config={{
 *     position: { amplitude: 2, frequency: 0.5 },
 *     rotation: { amplitude: 0.02 },
 *     scale: { amplitude: 0.01 },
 *   }}
 *   enabled={true}
 * >
 *   <FeatureCard feature={feature} />
 * </JitterLayer>
 * ```
 */
export const JitterLayer = forwardRef<JitterLayerRef, JitterLayerProps>(
  (
    {
      children,
      config = {},
      enabled = true,
      className = '',
      style = {},
      onJitterChange,
      useGlobal = false,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const generatorRef = useRef<JitterGenerator | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [state, setState] = useState<JitterState>({
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: 1,
    });

    // Initialize jitter generator
    useEffect(() => {
      if (useGlobal) {
        // Import dynamically to avoid circular deps
        import('@/lib/jitter').then(({ getGlobalJitter }) => {
          generatorRef.current = getGlobalJitter(config);
          setupGenerator();
        });
      } else {
        generatorRef.current = new JitterGenerator(config);
        setupGenerator();
      }

      function setupGenerator() {
        if (!generatorRef.current) return;
        
        const unsubscribe = generatorRef.current.subscribe((newState) => {
          setState(newState);
          onJitterChange?.(newState);
        });

        if (enabled) {
          generatorRef.current.start();
          setIsRunning(true);
        }

        return () => {
          unsubscribe();
          generatorRef.current?.stop();
          if (!useGlobal) {
            generatorRef.current?.destroy();
          }
          setIsRunning(false);
        };
      }
    }, [useGlobal, enabled, onJitterChange]);

    // Update config when it changes
    useEffect(() => {
      generatorRef.current?.updateConfig(config);
    }, [config]);

    // Render loop - apply transform to canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const render = () => {
        const { position, rotation, scale } = state;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transform
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2 + position.x, -canvas.height / 2 + position.y);
        
        // The actual children are rendered via React, not canvas
        // This canvas is for visual effects only (e.g., background noise)
        // Children receive transform via CSS
        
        ctx.restore();
        
        animationFrameRef.current = requestAnimationFrame(render);
      };

      animationFrameRef.current = requestAnimationFrame(render);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [state]);

    // Resize handler
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
          canvas.width = rect.width * window.devicePixelRatio;
          canvas.height = rect.height * window.devicePixelRatio;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
        }
      };

      resize();
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    }, []);

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      start: () => {
        generatorRef.current?.start();
        setIsRunning(true);
      },
      stop: () => {
        generatorRef.current?.stop();
        setIsRunning(false);
      },
      toggle: () => {
        if (isRunning) {
          generatorRef.current?.stop();
          setIsRunning(false);
        } else {
          generatorRef.current?.start();
          setIsRunning(true);
        }
      },
      getState: () => state,
    }));

    const transformStyle = {
      transform: `translate(${state.position.x}px, ${state.position.y}px) rotate(${state.rotation}rad) scale(${state.scale})`,
      willChange: 'transform',
      transformOrigin: 'center center',
    } as React.CSSProperties;

    return (
      <div
        ref={canvasRef as unknown as React.RefObject<HTMLDivElement>}
        className={className}
        style={{
          position: 'relative',
          overflow: 'visible',
          ...style,
        }}
      >
        <div
          style={transformStyle}
          className="jitter-layer-content"
        >
          {children}
        </div>
        <canvas
          ref={canvasRef}
          className="jitter-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: -1,
          }}
          aria-hidden="true"
        />
      </div>
    );
  }
);

JitterLayer.displayName = 'JitterLayer';

import { forwardRef, useImperativeHandle } from 'react';

/**
 * Simpler jitter wrapper that just applies CSS transform to children
 * No canvas overhead - pure CSS transform approach
 */
export interface SimpleJitterProps {
  children: React.ReactNode;
  config?: Partial<JitterConfig>;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onJitterChange?: (state: JitterState) => void;
  useGlobal?: boolean;
}

export function SimpleJitter({
  children,
  config = {},
  enabled = true,
  className = '',
  style = {},
  onJitterChange,
  useGlobal = false,
}: SimpleJitterProps) {
  const generatorRef = useRef<JitterGenerator | null>(null);
  const [state, setState] = useState<JitterState>({
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: 1,
  });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (useGlobal) {
      import('@/lib/jitter').then(({ getGlobalJitter }) => {
        generatorRef.current = getGlobalJitter(config);
        setupGenerator();
      });
    } else {
      generatorRef.current = new JitterGenerator(config);
      setupGenerator();
    }

    function setupGenerator() {
      if (!generatorRef.current) return;
      
      const unsubscribe = generatorRef.current.subscribe((newState) => {
        setState(newState);
        onJitterChange?.(newState);
      });

      if (enabled) {
        generatorRef.current.start();
        setIsRunning(true);
      }

      return () => {
        unsubscribe();
        generatorRef.current?.stop();
        if (!useGlobal) {
          generatorRef.current?.destroy();
        }
        setIsRunning(false);
      };
    }
  }, [useGlobal, enabled, onJitterChange]);

  useEffect(() => {
    generatorRef.current?.updateConfig(config);
  }, [config]);

  const transformStyle = {
    transform: `translate(${state.position.x}px, ${state.position.y}px) rotate(${state.rotation}rad) scale(${state.scale})`,
    willChange: 'transform',
    transformOrigin: 'center center',
  } as React.CSSProperties;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      <div style={transformStyle} className="jitter-content">
        {children}
      </div>
    </div>
  );
}

/**
 * Hook-based jitter for applying to any element via style prop
 */
export function useJitterStyle(config?: Partial<JitterConfig>, enabled = true): React.CSSProperties {
  const generatorRef = useRef<JitterGenerator | null>(null);
  const [state, setState] = useState<JitterState>({
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: 1,
  });

  useEffect(() => {
    generatorRef.current = new JitterGenerator(config);
    
    const unsubscribe = generatorRef.current.subscribe(setState);
    
    if (enabled) {
      generatorRef.current.start();
    }

    return () => {
      unsubscribe();
      generatorRef.current?.stop();
      generatorRef.current?.destroy();
    };
  }, [enabled]);

  useEffect(() => {
    generatorRef.current?.updateConfig(config || {});
  }, [config]);

  return {
    transform: `translate(${state.position.x}px, ${state.position.y}px) rotate(${state.rotation}rad) scale(${state.scale})`,
    willChange: 'transform',
    transformOrigin: 'center center',
  } as React.CSSProperties;
}