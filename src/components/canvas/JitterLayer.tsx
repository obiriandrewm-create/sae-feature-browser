import { cn } from '@/lib/utils';

export interface JitterLayerProps {
  enabled?: boolean;
  intensity?: number;
  className?: string;
}

export const JitterLayer = ({
  enabled = true,
  className,
}: JitterLayerProps) => {
  if (!enabled) {
    return <div className={cn('jitter-container', className)} />;
  }

  return (
    <div className={cn('jitter-container', className)}>
      <canvas
        className={cn('jitter-canvas')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.15,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </div>
  );
};

JitterLayer.displayName = 'JitterLayer';