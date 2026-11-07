import { forwardRef, useMemo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivationSparkline } from '@/components/charts/ActivationSparkline/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter/TokenHighlighter';
import { Feature } from '@/types/sae';
import styles from './FeatureCard.module.css';

export interface FeatureCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  feature: Feature;
  variant?: 'compact' | 'detailed' | 'comparison';
  isFocused?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark: (id: string) => void;
  onSelect: (id: string) => void;
  onCompare?: (id: string) => void;
  showCompareButton?: boolean;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  (
    {
      feature,
      variant = 'detailed',
      isFocused = false,
      isBookmarked = false,
      onToggleBookmark,
      onSelect,
      onCompare,
      showCompareButton = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const cardStyle = useMemo(() => ({
      ...style,
      transform: isFocused ? 'var(--fisheye-scale, 1)' : undefined,
    }), [style, isFocused]);

    return (
      <motion.div
        ref={ref}
        className={cn(styles.card, styles[variant], className)}
        style={cardStyle as React.CSSProperties}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
        tapHighlight={{ opacity: 0.8 }}
        onTap={() => onSelect(feature.id)}
        {...props}
      >
        <div className={styles.header}>
          <span className={cn(styles.layerBadge, styles[`layer-${feature.layer}`])}>
            Layer {feature.layer}
          </span>
          <div className={styles.actions}>
            <button
              className={cn(styles.bookmarkBtn, isBookmarked && styles.active)}
              onClick={(e) => { e.stopPropagation(); onToggleBookmark(feature.id); }}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={isBookmarked}
              title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              ★
            </button>
            {showCompareButton && onCompare && (
              <button
                className={styles.compareBtn}
                onClick={(e) => { e.stopPropagation(); onCompare(feature.id); }}
                aria-label="Add to comparison"
                title="Add to comparison"
              >
                ⚖
              </button>
            )}
          </div>
        </div>

        <div className={styles.activation}>
          <ActivationSparkline
            data={feature.activationHistogram}
            maxActivation={feature.maxActivation}
            className={styles.sparkline}
            width={variant === 'compact' ? 80 : 120}
            height={variant === 'compact' ? 24 : 32}
          />
          <span className={styles.maxAct}>{feature.maxActivation.toFixed(2)}</span>
        </div>

        {variant !== 'compact' && (
          <TokenHighlighter
            tokens={feature.topTokens}
            activations={feature.tokenActivations}
            className={styles.tokens}
            maxTokens={5}
            maxActivation={feature.maxActivation}
          />
        )}

        <div className={styles.semanticLabel}>
          {feature.semanticLabel || <em>Unlabeled</em>}
        </div>

        {variant === 'detailed' && feature.description && (
          <div className={styles.description}>
            {feature.description}
          </div>
        )}
      </motion.div>
    )
  }
);

FeatureCard.displayName = 'FeatureCard';