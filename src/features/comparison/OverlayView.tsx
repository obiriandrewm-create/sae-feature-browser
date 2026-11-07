/**
 * Overlay comparison view for features.
 * Displays features overlaid on top of each other with opacity blending.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Feature } from '@/types/sae';
import { cn } from '@/lib/utils';
import { ActivationSparkline } from '@/components/charts/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter';
import styles from './OverlayView.module.css';

export interface OverlayViewProps {
  /** Features to overlay (max 3 for clarity) */
  features: Feature[];
  /** Active feature index (highlighted) */
  activeIndex?: number;
  /** Callback when a feature is selected */
  onSelectFeature?: (feature: Feature, index: number) => void;
  /** Callback when bookmark is toggled */
  onToggleBookmark?: (featureId: string) => void;
  /** Opacity for non-active features */
  inactiveOpacity?: number;
  /** Show/hide sections */
  showActivation?: boolean;
  showTokens?: boolean;
  showMetadata?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * Overlay comparison component.
 * Stacks features with transparency for direct visual comparison.
 */
export const OverlayView = ({
  features,
  activeIndex = 0,
  onSelectFeature,
  onToggleBookmark,
  inactiveOpacity = 0.4,
  showActivation = true,
  showTokens = true,
  showMetadata = true,
  className,
}: OverlayViewProps) => {
  if (features.length === 0) {
    return (
      <div className={cn(styles.container, className)}>
        <div className={styles.emptyState}>
          <p>Select features to overlay</p>
        </div>
      </div>
    );
  }

  const maxFeatures = Math.min(features.length, 3);
  const displayFeatures = features.slice(0, maxFeatures);

  const isActive = useMemo(
    () => displayFeatures.map((_, i) => i === activeIndex),
    [activeIndex, displayFeatures.length]
  );

  return (
    <div className={cn(styles.container, className)} role="region" aria-label="Overlay feature comparison">
      <div className={styles.header}>
        <div className={styles.featureTabs} role="tablist" aria-label="Features in overlay">
          {displayFeatures.map((feature, index) => (
            <motion.button
              key={feature.id}
              className={cn(styles.featureTab, isActive[index] && styles.active)}
              role="tab"
              aria-selected={isActive[index]}
              aria-controls={`overlay-panel-${index}`}
              id={`overlay-tab-${index}`}
              onClick={() => onSelectFeature?.(feature, index)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                opacity: isActive[index] ? 1 : inactiveOpacity,
                borderColor: isActive[index] ? 'var(--color-brand-primary)' : 'transparent',
              }}
            >
              <span className={styles.tabLabel}>
                {feature.semanticLabel || `Feature ${feature.id.slice(0, 8)}`}
              </span>
              <span className={cn(styles.tabLayer, `layer-${feature.layer}`)}>
                L{feature.layer}
              </span>
              {feature.isBookmarked && <span className={styles.tabBookmark} aria-label="Bookmarked">★</span>}
            </motion.button>
          ))}
        </div>
        {features.length > 3 && (
          <span className={styles.moreIndicator}>
            +{features.length - 3} more
          </span>
        )}
      </div>

      <div className={styles.overlayArea}>
        {/* Activation Overlay */}
        {showActivation && (
          <div className={styles.overlaySection}>
            <h4 className={styles.sectionTitle}>Activation Distributions</h4>
            <div className={styles.overlayChart} role="img" aria-label="Overlaid activation histograms">
              {displayFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className={cn(styles.overlayTrace, isActive[index] && styles.activeTrace)}
                  style={{
                    opacity: isActive[index] ? 1 : inactiveOpacity,
                    zIndex: isActive[index] ? 10 : index,
                    transformOrigin: 'center',
                  }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: isActive[index] ? 1 : inactiveOpacity }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ActivationSparkline
                    data={feature.activationHistogram}
                    maxActivation={feature.maxActivation}
                    className={styles.sparkline}
                    strokeColor={`hsl(${index * 120 + 200}, 70%, 50%)`}
                  />
                </motion.div>
              ))}
            </div>
            <div className={styles.overlayLegend}>
              {displayFeatures.map((feature, index) => (
                <span
                  key={feature.id}
                  className={cn(styles.legendItem, isActive[index] && styles.activeLegend)}
                  style={{ borderLeftColor: `hsl(${index * 120 + 200}, 70%, 50%)` }}
                >
                  {feature.semanticLabel || `Feature ${feature.id.slice(0, 8)}`}
                  <span className={styles.legendValue}>{feature.maxActivation.toFixed(3)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Token Overlay */}
        {showTokens && (
          <div className={styles.overlaySection}>
            <h4 className={styles.sectionTitle}>Top Tokens Comparison</h4>
            <div className={styles.tokenOverlay}>
              {displayFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className={cn(styles.featureTokens, isActive[index] && styles.activeTokens)}
                  style={{
                    opacity: isActive[index] ? 1 : inactiveOpacity,
                    borderLeftColor: `hsl(${index * 120 + 200}, 70%, 50%)`,
                  }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: isActive[index] ? 1 : inactiveOpacity }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TokenHighlighter
                    tokens={feature.topTokens}
                    activations={feature.tokenActivations}
                    maxTokens={15}
                    className={styles.tokenList}
                    highlightColor={`hsl(${index * 120 + 200}, 70%, 50%)`}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Overlay */}
        {showMetadata && (
          <div className={styles.overlaySection}>
            <h4 className={styles.sectionTitle}>Feature Metadata</h4>
            <div className={styles.metadataGrid}>
              {displayFeatures.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  className={cn(styles.metadataCard, isActive[index] && styles.activeMetadata)}
                  style={{
                    opacity: isActive[index] ? 1 : inactiveOpacity,
                    borderColor: isActive[index] ? `hsl(${index * 120 + 200}, 70%, 50%)` : 'var(--color-border-primary)',
                  }}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: isActive[index] ? 1 : inactiveOpacity }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className={styles.metadataRow}>
                    <span className={styles.metadataLabel}>Layer</span>
                    <span className={cn(styles.metadataValue, styles.layerBadge)}>Layer {feature.layer}</span>
                  </div>
                  <div className={styles.metadataRow}>
                    <span className={styles.metadataLabel}>Max Activation</span>
                    <span className={styles.metadataValue}>{feature.maxActivation.toFixed(4)}</span>
                  </div>
                  <div className={styles.metadataRow}>
                    <span className={styles.metadataLabel}>Label</span>
                    <span className={styles.metadataValue}>
                      {feature.semanticLabel ? (
                        feature.semanticLabel
                      ) : (
                        <em className={styles.unlabeled}>Unlabeled</em>
                      )}
                    </span>
                  </div>
                  <div className={styles.metadataRow}>
                    <span className={styles.metadataLabel}>Bookmarked</span>
                    <button
                      className={cn(styles.bookmarkBtn, feature.isBookmarked && styles.active)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark?.(feature.id);
                      }}
                      aria-label={feature.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                      aria-pressed={feature.isBookmarked}
                    >
                      {feature.isBookmarked ? '★' : '☆'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

OverlayView.displayName = 'OverlayView';