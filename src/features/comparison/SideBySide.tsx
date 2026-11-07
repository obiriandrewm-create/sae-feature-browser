/**
 * Side-by-side comparison view for features.
 * Displays two features next to each other with aligned sections.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Feature } from '@/types/sae';
import { cn } from '@/lib/utils';
import { ActivationSparkline } from '@/components/charts/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter';
import styles from './SideBySide.module.css';

export interface SideBySideProps {
  /** Left feature to compare */
  leftFeature: Feature | null;
  /** Right feature to compare */
  rightFeature: Feature | null;
  /** Callback when a feature is selected for detail view */
  onSelectFeature?: (feature: Feature) => void;
  /** Callback when bookmark is toggled */
  onToggleBookmark?: (featureId: string) => void;
  /** Show/hide sections */
  showActivation?: boolean;
  showTokens?: boolean;
  showMetadata?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * Side-by-side comparison component.
 * Aligns corresponding sections for easy visual comparison.
 */
export const SideBySide = ({
  leftFeature,
  rightFeature,
  onSelectFeature,
  onToggleBookmark,
  showActivation = true,
  showTokens = true,
  showMetadata = true,
  className,
}: SideBySideProps) => {
  const hasLeft = leftFeature !== null;
  const hasRight = rightFeature !== null;

  if (!hasLeft && !hasRight) {
    return (
      <div className={cn(styles.container, className)}>
        <div className={styles.emptyState}>
          <p>Select two features to compare</p>
        </div>
      </div>
    );
  }

  const comparisonRows = useMemo(() => {
    const rows: Array<{
      label: string;
      left: React.ReactNode;
      right: React.ReactNode;
      fullWidth?: boolean;
    }> = [];

    if (showMetadata) {
      rows.push(
        {
          label: 'Layer',
          left: hasLeft ? <span className={styles.layerBadge}>Layer {leftFeature!.layer}</span> : <span className={styles.empty}>—</span>,
          right: hasRight ? <span className={styles.layerBadge}>Layer {rightFeature!.layer}</span> : <span className={styles.empty}>—</span>,
        },
        {
          label: 'Semantic Label',
          left: hasLeft ? (
            leftFeature!.semanticLabel ? (
              <span>{leftFeature!.semanticLabel}</span>
            ) : (
              <em className={styles.unlabeled}>Unlabeled</em>
            )
          ) : (
            <span className={styles.empty}>—</span>
          ),
          right: hasRight ? (
            rightFeature!.semanticLabel ? (
              <span>{rightFeature!.semanticLabel}</span>
            ) : (
              <em className={styles.unlabeled}>Unlabeled</em>
            )
          ) : (
            <span className={styles.empty}>—</span>
          ),
        },
        {
          label: 'Max Activation',
          left: hasLeft ? <span className={styles.maxAct}>{leftFeature!.maxActivation.toFixed(4)}</span> : <span className={styles.empty}>—</span>,
          right: hasRight ? <span className={styles.maxAct}>{rightFeature!.maxActivation.toFixed(4)}</span> : <span className={styles.empty}>—</span>,
        },
        {
          label: 'Bookmarked',
          left: hasLeft ? (
            <button
              className={cn(styles.bookmarkBtn, leftFeature!.isBookmarked && styles.active)}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(leftFeature!.id);
              }}
              aria-label={leftFeature!.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={leftFeature!.isBookmarked}
            >
              {leftFeature!.isBookmarked ? '★' : '☆'}
            </button>
          ) : (
            <span className={styles.empty}>—</span>
          ),
          right: hasRight ? (
            <button
              className={cn(styles.bookmarkBtn, rightFeature!.isBookmarked && styles.active)}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark?.(rightFeature!.id);
              }}
              aria-label={rightFeature!.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={rightFeature!.isBookmarked}
            >
              {rightFeature!.isBookmarked ? '★' : '☆'}
            </button>
          ) : (
            <span className={styles.empty}>—</span>
          ),
        }
      );
    }

    if (showActivation) {
      rows.push({
        label: 'Activation Distribution',
        left: hasLeft ? (
          <ActivationSparkline
            data={leftFeature!.activationHistogram}
            maxActivation={leftFeature!.maxActivation}
            className={styles.sparkline}
          />
        ) : (
          <span className={styles.empty}>—</span>
        ),
        right: hasRight ? (
          <ActivationSparkline
            data={rightFeature!.activationHistogram}
            maxActivation={rightFeature!.maxActivation}
            className={styles.sparkline}
          />
        ) : (
          <span className={styles.empty}>—</span>
        ),
        fullWidth: true,
      });
    }

    if (showTokens) {
      rows.push({
        label: 'Top Tokens',
        left: hasLeft ? (
          <TokenHighlighter
            tokens={leftFeature!.topTokens}
            activations={leftFeature!.tokenActivations}
            maxTokens={10}
            className={styles.tokens}
          />
        ) : (
          <span className={styles.empty}>—</span>
        ),
        right: hasRight ? (
          <TokenHighlighter
            tokens={rightFeature!.topTokens}
            activations={rightFeature!.tokenActivations}
            maxTokens={10}
            className={styles.tokens}
          />
        ) : (
          <span className={styles.empty}>—</span>
        ),
        fullWidth: true,
      });
    }

    return rows;
  }, [leftFeature, rightFeature, showActivation, showTokens, showMetadata, onToggleBookmark]);

  return (
    <div className={cn(styles.container, className)} role="region" aria-label="Side-by-side feature comparison">
      <div className={styles.header}>
        <div className={cn(styles.column, styles.leftColumn)}>
          <h3 className={styles.columnTitle}>
            {hasLeft ? (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelectFeature?.(leftFeature!)}
                style={{ cursor: 'pointer' }}
              >
                {leftFeature.semanticLabel || `Feature ${leftFeature.id.slice(0, 8)}`}
              </motion.span>
            ) : (
              <span className={styles.empty}>No feature selected</span>
            )}
          </h3>
        </div>
        <div className={styles.divider} aria-hidden="true" />
        <div className={cn(styles.column, styles.rightColumn)}>
          <h3 className={styles.columnTitle}>
            {hasRight ? (
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => onSelectFeature?.(rightFeature!)}
                style={{ cursor: 'pointer' }}
              >
                {rightFeature.semanticLabel || `Feature ${rightFeature.id.slice(0, 8)}`}
              </motion.span>
            ) : (
              <span className={styles.empty}>No feature selected</span>
            )}
          </h3>
        </div>
      </div>

      <div className={styles.comparisonGrid}>
        {comparisonRows.map((row, index) => (
          <motion.div
            key={index}
            className={cn(styles.row, row.fullWidth && styles.fullWidth)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className={styles.label}>{row.label}</div>
            <div className={cn(styles.value, styles.leftValue)}>{row.left}</div>
            <div className={cn(styles.value, styles.rightValue)}>{row.right}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

SideBySide.displayName = 'SideBySide';