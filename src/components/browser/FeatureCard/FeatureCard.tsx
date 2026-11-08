import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivationSparkline } from '@/components/charts/ActivationSparkline/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter/TokenHighlighter';
import { Feature } from '@/types/sae';
import styles from './FeatureCard.module.css';

export interface FeatureCardProps {
  feature: Feature;
  variant?: 'compact' | 'detailed' | 'comparison';
  isFocused?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark: (id: string) => void;
  onSelect: (id: string) => void;
  onCompare?: (id: string) => void;
  showCompareButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
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
    const cardStyle = { ...style } as React.CSSProperties;

    return (
      <motion.div
        ref={ref}
        className={cn(styles.card, styles[variant], className)}
        style={cardStyle}
        whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)' }}
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