import { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  feature: any;
}

export interface FisheyeDistortionProps {
  cards: CardTransform[];
  config: {
    focalLength: number;
    strength: number;
    viewportWidth: number;
    viewportHeight: number;
  };
  enabled?: boolean;
  onCardHover?: (feature: any) => void;
  onCardClick?: (feature: any) => void;
  className?: string;
}

export const FisheyeDistortion = ({
  cards,
  config,
  enabled = true,
  onCardHover,
  onCardClick,
  className,
}: FisheyeDistortionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoveredFeatureRef = useRef<any>(null);

  const renderedCards = cards.filter((c) => c !== null && c !== undefined);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let hovered: any = null;
    for (let i = renderedCards.length - 1; i >= 0; i--) {
      const card = renderedCards[i];
      if (!card) continue;
      if (
        mouseX >= card.x &&
        mouseX <= card.x + card.width &&
        mouseY >= card.y &&
        mouseY <= card.y + card.height
      ) {
        hovered = card.feature;
        break;
      }
    }

    if (hovered !== hoveredFeatureRef.current) {
      hoveredFeatureRef.current = hovered;
      onCardHover?.(hovered);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let i = renderedCards.length - 1; i >= 0; i--) {
      const card = renderedCards[i];
      if (!card) continue;
      if (
        mouseX >= card.x &&
        mouseX <= card.x + card.width &&
        mouseY >= card.y &&
        mouseY <= card.y + card.height
      ) {
        onCardClick?.(card.feature);
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('fisheye-container', className)}
      style={{
        position: 'relative',
        width: config.viewportWidth,
        height: config.viewportHeight,
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {renderedCards.map((card, i) => {
        if (!card) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: card.x,
              top: card.y,
              width: card.width,
              height: card.height,
            }}
          />
        );
      })}
    </div>
  );
};