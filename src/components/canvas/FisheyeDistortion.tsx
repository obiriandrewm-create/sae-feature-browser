/**
 * Canvas-based Fisheye Distortion Renderer.
 * Renders feature cards with fisheye distortion using Canvas 2D API.
 * Respects prefers-reduced-motion, seeded for reproducibility.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Feature } from '@/types/sae';
import type { FisheyeConfig, FisheyeTransform } from '@/lib/fisheye';
import { polarFisheye, generateFisheyeJitter } from '@/lib/fisheye';
import { cn } from '@/lib/utils';

export interface FeatureCardData {
  feature: Feature;
  bounds: DOMRect;
  originalX: number;
  originalY: number;
  originalWidth: number;
  originalHeight: number;
}

export interface FisheyeDistortionProps {
  /** Feature cards to render */
  cards: FeatureCardData[];
  /** Fisheye configuration */
  config: FisheyeConfig;
  /** Whether fisheye is enabled */
  enabled: boolean;
  /** Whether animation is in progress */
  isAnimating: boolean;
  /** Respect prefers-reduced-motion */
  respectReducedMotion?: boolean;
  /** Jitter intensity for organic feel */
  jitterIntensity?: number;
  /** Current animation time for jitter */
  animationTime?: number;
  /** Callback when a card is clicked */
  onCardClick?: (feature: Feature) => void;
  /** Callback when a card is hovered */
  onCardHover?: (feature: Feature | null) => void;
  /** CSS class name */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
}

interface RenderedCard {
  feature: Feature;
  transform: FisheyeTransform;
  width: number;
  height: number;
  jitterX: number;
  jitterY: number;
}

/**
 * Canvas-based Fisheye Distortion Component.
 * Efficiently renders many feature cards with fisheye distortion.
 */
export const FisheyeDistortion = ({
  cards,
  config,
  enabled,
  isAnimating,
  respectReducedMotion = true,
  jitterIntensity = 0.003,
  animationTime = 0,
  onCardClick,
  onCardHover,
  className,
  style,
}: FisheyeDistortionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredFeatureRef = useRef<Feature | null>(null);

  // Pre-compute rendered card positions
  const renderedCards = useMemo((): RenderedCard[] => {
    if (!enabled) {
      return cards.map((card) => ({
        feature: card.feature,
        transform: {
          x: card.originalX,
          y: card.originalY,
          scale: 1,
          isInFocus: false,
          distance: 0,
        },
        width: card.originalWidth,
        height: card.originalHeight,
        jitterX: 0,
        jitterY: 0,
      }));
    }

    return cards.map((card) => {
      // Transform the center point of the card
      const centerX = card.originalX + card.originalWidth / 2;
      const centerY = card.originalY + card.originalHeight / 2;
      const transform = polarFisheye(centerX, centerY, config);

      // Apply scale to dimensions
      const width = card.originalWidth * transform.scale;
      const height = card.originalHeight * transform.scale;

      // Calculate top-left position from transformed center
      const x = transform.x - width / 2;
      const y = transform.y - height / 2;

      // Generate jitter for organic feel (only in focus region, not during animation)
      let jitterX = 0;
      let jitterY = 0;
      if (transform.isInFocus && !isAnimating && !respectReducedMotion) {
        const jitter = generateFisheyeJitter(
          card.originalX,
          card.originalY,
          animationTime,
          config,
          jitterIntensity
        );
        jitterX = jitter.x * config.viewportWidth;
        jitterY = jitter.y * config.viewportHeight;
      }

      return {
        feature: card.feature,
        transform: { ...transform, x: x + jitterX, y: y + jitterY },
        width,
        height,
        jitterX,
        jitterY,
      };
    });
  }, [cards, config, enabled, isAnimating, respectReducedMotion, jitterIntensity, animationTime]);

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Render cards back-to-front (context first, focus last)
    const sortedCards = [...renderedCards].sort((a, b) => {
      // Focus cards on top
      if (a.transform.isInFocus !== b.transform.isInFocus) {
        return a.transform.isInFocus ? 1 : -1;
      }
      // Then by distance from focus (closer on top)
      return b.transform.distance - a.transform.distance;
    });

    for (const card of sortedCards) {
      const { feature, transform, width, height } = card;

      ctx.save();

      // Clip to card bounds for clean edges
      ctx.beginPath();
      ctx.roundRect(transform.x, transform.y, width, height, 8 * transform.scale);
      ctx.clip();

      // Card background
      ctx.fillStyle = transform.isInFocus ? '#ffffff' : '#f8fafc';
      ctx.fillRect(transform.x, transform.y, width, height);

      // Border
      ctx.strokeStyle = transform.isInFocus ? '#3b82f6' : '#e2e8f0';
      ctx.lineWidth = transform.isInFocus ? 2 : 1;
      ctx.strokeRect(transform.x, transform.y, width, height);

      // Layer badge
      ctx.font = `bold ${Math.max(10, 11 * transform.scale)}px system-ui`;
      ctx.fillStyle = '#1e293b';
      const layerText = `Layer ${feature.layer}`;
      ctx.fillText(layerText, transform.x + 8 * transform.scale, transform.y + 20 * transform.scale);

      // Max activation
      ctx.font = `${Math.max(11, 13 * transform.scale)}px system-ui`;
      ctx.fillStyle = '#0f172a';
      ctx.fillText(
        feature.maxActivation.toFixed(2),
        transform.x + 8 * transform.scale,
        transform.y + 44 * transform.scale
      );

      // Semantic label (truncated)
      ctx.font = `${Math.max(10, 12 * transform.scale)}px system-ui`;
      ctx.fillStyle = '#64748b';
      const label = feature.semanticLabel || 'Unlabeled';
      const maxLabelWidth = width - 16 * transform.scale;
      let displayLabel = label;
      while (ctx.measureText(displayLabel).width > maxLabelWidth && displayLabel.length > 3) {
        displayLabel = displayLabel.slice(0, -1);
      }
      if (displayLabel !== label) displayLabel += '…';
      ctx.fillText(displayLabel, transform.x + 8 * transform.scale, transform.y + 64 * transform.scale);

      // Top tokens (if space permits)
      if (height > 80 * transform.scale && feature.topTokens.length > 0) {
        ctx.font = `${Math.max(9, 11 * transform.scale)}px monospace`;
        ctx.fillStyle = '#94a3b8';
        const tokensText = feature.topTokens.slice(0, 3).join(', ');
        ctx.fillText(tokensText, transform.x + 8 * transform.scale, transform.y + height - 12 * transform.scale);
      }

      // Bookmark indicator
      if (feature.isBookmarked) {
        ctx.font = `${Math.max(12, 16 * transform.scale)}px system-ui`;
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('★', transform.x + width - 24 * transform.scale, transform.y + 24 * transform.scale);
      }

      ctx.restore();
    }
  }, [renderedCards, config.viewportWidth, config.viewportHeight]);

  // Handle mouse move for hover detection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Find hovered card (check in reverse order - topmost first)
      let hovered: Feature | null = null;
      for (let i = renderedCards.length - 1; i >= 0; i--) {
        const card = renderedCards[i];
        if (
          mouseX >= card.transform.x &&
          mouseX <= card.transform.x + card.width &&
          mouseY >= card.transform.y &&
          mouseY <= card.transform.y + card.height
        ) {
          hovered = card.feature;
          break;
        }
      }

      if (hovered !== hoveredFeatureRef.current) {
        hoveredFeatureRef.current = hovered;
        onCardHover?.(hovered);
      }
    },
    [enabled, renderedCards, onCardHover]
  );

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (let i = renderedCards.length - 1; i >= 0; i--) {
        const card = renderedCards[i];
        if (
          mouseX >= card.transform.x &&
          mouseX <= card.transform.x + card.width &&
          mouseY >= card.transform.y &&
          mouseY <= card.transform.y + card.height
        ) {
          onCardClick?.(card.feature);
          break;
        }
      }
    },
    [enabled, renderedCards, onCardClick]
  );

  return (
    <motion.div
      ref={containerRef}
      className={cn('fisheye-container', className)}
      style={{
        position: 'relative',
        width: config.viewportWidth,
        height: config.viewportHeight,
        overflow: 'hidden',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => onCardHover?.(null)}
      animate={{ opacity: isAnimating ? 0.95 : 1 }}
      transition={{ duration: 0.1 }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
      {/* Accessibility: hidden list for screen readers */}
      <div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}>
        <ul role="list" aria-label="Feature cards">
          {cards.map((card) => (
            <li key={card.feature.id} role="listitem">
              <span>{card.feature.semanticLabel || 'Unlabeled feature'}</span>
              <span>Layer {card.feature.layer}</span>
              <span>Max activation: {card.feature.maxActivation.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

FisheyeDistortion.displayName = 'FisheyeDistortion';