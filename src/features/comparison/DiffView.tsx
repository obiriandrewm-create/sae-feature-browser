/**
 * Diff comparison view for features.
 * Shows differences between two features with visual indicators.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Feature } from '@/types/sae';
import { cn } from '@/lib/utils';
import { ActivationSparkline } from '@/components/charts/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter';
import styles from './DiffView.module.css';

export interface DiffViewProps {
  /** Base feature (left/first) */
  baseFeature: Feature | null;
  /** Comparison feature (right/second) */
  compareFeature: Feature | null;
  /** Callback when a feature is selected */
  onSelectFeature?: (feature: Feature) => void;
  /** Show/hide sections */
  showActivation?: boolean;
  showTokens?: boolean;
  showMetadata?: boolean;
  /** CSS class name */
  className?: string;
}

interface DiffItem<T> {
  type: 'same' | 'added' | 'removed' | 'changed';
  label: string;
  baseValue: T | null;
  compareValue: T | null;
  diffPercent?: number | undefined;
}

/**
 * Compute diff between two values.
 */
function computeDiff<T>(base: T | null, compare: T | null, label: string): DiffItem<T> {
  if (base === null && compare === null) {
    return { type: 'same', label, baseValue: null, compareValue: null };
  }
  if (base === null) {
    return { type: 'added', label, baseValue: null, compareValue: compare };
  }
  if (compare === null) {
    return { type: 'removed', label, baseValue: base, compareValue: null };
  }
  if (base === compare) {
    return { type: 'same', label, baseValue: base, compareValue: compare };
  }

  // For numbers, compute percentage difference
  let diffPercent: number | undefined;
  if (typeof base === 'number' && typeof compare === 'number' && base !== 0) {
    diffPercent = ((compare - base) / Math.abs(base)) * 100;
  }

  return { type: 'changed', label, baseValue: base, compareValue: compare, diffPercent };
}

/**
 * Compute token diff between two feature token lists.
 */
function computeTokenDiff(baseTokens: string[], baseActivations: number[], compareTokens: string[], compareActivations: number[]): Array<{
  token: string;
  baseActivation: number | null;
  compareActivation: number | null;
  type: 'same' | 'added' | 'removed' | 'changed';
}> {
  const baseMap = new Map(baseTokens.map((t, i) => [t, baseActivations[i]]));
  const compareMap = new Map(compareTokens.map((t, i) => [t, compareActivations[i]]));
  const allTokens = new Set([...baseTokens, ...compareTokens]);

  return Array.from(allTokens).map((token) => {
    const baseAct = baseMap.get(token) ?? null;
    const compareAct = compareMap.get(token) ?? null;

    if (baseAct !== null && compareAct !== null) {
      return {
        token,
        baseActivation: baseAct,
        compareActivation: compareAct,
        type: baseAct === compareAct ? 'same' : 'changed' as const,
      };
    }
    if (baseAct !== null) {
      return { token, baseActivation: baseAct, compareActivation: null, type: 'removed' as const };
    }
    return { token, baseActivation: null, compareActivation: compareAct, type: 'added' as const };
  });
}

/**
 * Diff comparison component.
 * Highlights differences between two features with color-coded indicators.
 */
export const DiffView = ({
  baseFeature,
  compareFeature,
  onSelectFeature,
  showActivation = true,
  showTokens = true,
  showMetadata = true,
  className,
}: DiffViewProps) => {
  const hasBase = baseFeature !== null;
  const hasCompare = compareFeature !== null;

  if (!hasBase && !hasCompare) {
    return (
      <div className={cn(styles.container, className)}>
        <div className={styles.emptyState}>
          <p>Select two features to diff</p>
        </div>
      </div>
    );
  }

  const metadataDiffs = useMemo(() => {
    if (!hasBase || !hasCompare) return [];

    return [
      computeDiff(baseFeature.layer, compareFeature.layer, 'Layer'),
      computeDiff(baseFeature.maxActivation, compareFeature.maxActivation, 'Max Activation'),
      computeDiff(baseFeature.semanticLabel, compareFeature.semanticLabel, 'Semantic Label'),
      computeDiff(baseFeature.isBookmarked, compareFeature.isBookmarked, 'Bookmarked'),
    ];
  }, [baseFeature, compareFeature, hasBase, hasCompare]);

  const activationDiff = useMemo(() => {
    if (!hasBase || !hasCompare || !showActivation) return null;

    const baseHist = baseFeature.activationHistogram;
    const compareHist = compareFeature.activationHistogram;
    const maxLen = Math.max(baseHist.length, compareHist.length);

    const diffData = Array.from({ length: maxLen }, (_, i) => {
      const base = baseHist[i] ?? 0;
      const compare = compareHist[i] ?? 0;
      return compare - base;
    });

    const maxDiff = Math.max(...diffData.map(Math.abs), 1);

    return { diffData, maxDiff, baseMax: baseFeature.maxActivation, compareMax: compareFeature.maxActivation };
  }, [baseFeature, compareFeature, hasBase, hasCompare, showActivation]);

  const tokenDiffs = useMemo(() => {
    if (!hasBase || !hasCompare || !showTokens) return [];

    return computeTokenDiff(
      baseFeature.topTokens,
      baseFeature.tokenActivations,
      compareFeature.topTokens,
      compareFeature.tokenActivations
    );
  }, [baseFeature, compareFeature, hasBase, hasCompare, showTokens]);

  return (
    <div className={cn(styles.container, className)} role="region" aria-label="Feature diff comparison">
      <div className={styles.header}>
        <div className={cn(styles.column, styles.baseColumn)}>
          <h3 className={styles.columnTitle}>
            {hasBase ? (
              <span onClick={() => onSelectFeature?.(baseFeature!)} style={{ cursor: 'pointer' }}>
                {baseFeature.semanticLabel || `Feature ${baseFeature.id.slice(0, 8)}`}
              </span>
            ) : (
              <span className={styles.empty}>No base feature</span>
            )}
            <span className={styles.columnBadge} aria-label="Base">Base</span>
          </h3>
        </div>
        <div className={styles.diffArrow} aria-hidden="true">
          <span className={styles.arrow}>→</span>
          <span className={styles.diffLabel}>Diff</span>
        </div>
        <div className={cn(styles.column, styles.compareColumn)}>
          <h3 className={styles.columnTitle}>
            {hasCompare ? (
              <span onClick={() => onSelectFeature?.(compareFeature!)} style={{ cursor: 'pointer' }}>
                {compareFeature.semanticLabel || `Feature ${compareFeature.id.slice(0, 8)}`}
              </span>
            ) : (
              <span className={styles.empty}>No compare feature</span>
            )}
            <span className={styles.columnBadge} aria-label="Compare">Compare</span>
          </h3>
        </div>
      </div>

      {/* Metadata Diff */}
      {showMetadata && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Metadata</h4>
          <div className={styles.diffGrid}>
            {metadataDiffs.map((diff, index) => (
              <motion.div
                key={index}
                className={cn(styles.diffRow, styles[diff.type])}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div className={styles.diffLabel}>{diff.label}</div>
                <div className={cn(styles.diffValue, styles.baseValue)}>
                  {diff.baseValue !== null ? (
                    typeof diff.baseValue === 'boolean' ? (
                      diff.baseValue ? 'Yes' : 'No'
                    ) : (
                      diff.baseValue
                    )
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </div>
                <div className={styles.diffArrow} aria-hidden="true">
                  <span className={cn(styles.arrow, styles[diff.type])}>
                    {diff.type === 'added' ? '+' : diff.type === 'removed' ? '−' : diff.type === 'changed' ? '→' : '='}
                  </span>
                </div>
                <div className={cn(styles.diffValue, styles.compareValue)}>
                  {diff.compareValue !== null ? (
                    typeof diff.compareValue === 'boolean' ? (
                      diff.compareValue ? 'Yes' : 'No'
                    ) : (
                      diff.compareValue
                    )
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </div>
                {diff.diffPercent !== undefined && (
                  <div className={cn(styles.diffPercent, diff.diffPercent > 0 ? styles.positive : styles.negative)}>
                    {diff.diffPercent > 0 ? '+' : ''}{diff.diffPercent.toFixed(1)}%
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Activation Diff */}
      {showActivation && activationDiff && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Activation Difference</h4>
          <div className={styles.activationDiff}>
            <div className={styles.diffChart} role="img" aria-label="Activation difference histogram">
              <ActivationSparkline
                data={activationDiff.diffData}
                maxActivation={activationDiff.maxDiff}
                className={styles.diffSparkline}
                strokeColor="var(--color-semantic-info)"
                fillColor="rgba(59, 130, 246, 0.1)"
                showZeroLine
              />
            </div>
            <div className={styles.diffSummary}>
              <div className={cn(styles.summaryItem, styles.baseSummary)}>
                <span className={styles.summaryLabel}>Base Max</span>
                <span className={styles.summaryValue}>{activationDiff.baseMax.toFixed(3)}</span>
              </div>
              <div className={cn(styles.summaryItem, styles.compareSummary)}>
                <span className={styles.summaryLabel}>Compare Max</span>
                <span className={styles.summaryValue}>{activationDiff.compareMax.toFixed(3)}</span>
              </div>
              <div className={cn(styles.summaryItem, styles.diffSummary)}>
                <span className={styles.summaryLabel}>Range</span>
                <span className={styles.summaryValue}>±{activationDiff.maxDiff.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Diff */}
      {showTokens && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Token Differences</h4>
          <div className={styles.tokenDiff}>
            {hasBase && (
              <div className={cn(styles.tokenColumn, styles.baseColumn)}>
                <h5 className={styles.tokenColumnTitle}>Base Tokens</h5>
                <TokenHighlighter
                  tokens={baseFeature!.topTokens}
                  activations={baseFeature!.tokenActivations}
                  maxTokens={20}
                  className={styles.tokenList}
                  highlightColor="var(--color-semantic-error)"
                  dimTokens={tokenDiffs.filter((t) => t.type === 'removed').map((t) => t.token)}
                />
              </div>
            )}
            <div className={cn(styles.tokenColumn, styles.diffColumn)}>
              <h5 className={styles.tokenColumnTitle}>Changes</h5>
              <div className={styles.tokenChanges}>
                {tokenDiffs.length === 0 ? (
                  <p className={styles.noChanges}>No token differences</p>
                ) : (
                  tokenDiffs.map((diff, index) => (
                    <motion.div
                      key={index}
                      className={cn(styles.tokenChange, styles[diff.type])}
                      initial={{ opacity: 0, x: diff.type === 'added' ? -20 : diff.type === 'removed' ? 20 : 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <span className={styles.tokenText}>{diff.token}</span>
                      <div className={styles.tokenActivations}>
                        {diff.baseActivation !== null && (
                          <span className={cn(styles.activationValue, styles.baseActivation)}>
                            {diff.baseActivation.toFixed(3)}
                          </span>
                        )}
                        {diff.compareActivation !== null && (
                          <span className={cn(styles.activationValue, styles.compareActivation)}>
                            {diff.compareActivation.toFixed(3)}
                          </span>
                        )}
                      </div>
                      {diff.type === 'changed' && diff.baseActivation !== null && diff.compareActivation !== null && (
                        <span className={cn(styles.tokenDiffPercent, diff.compareActivation > diff.baseActivation ? styles.positive : styles.negative)}>
                          {diff.compareActivation > diff.baseActivation ? '+' : ''}
                          {((diff.compareActivation - diff.baseActivation) / Math.abs(diff.baseActivation) * 100).toFixed(1)}%
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
            {hasCompare && (
              <div className={cn(styles.tokenColumn, styles.compareColumn)}>
                <h5 className={styles.tokenColumnTitle}>Compare Tokens</h5>
                <TokenHighlighter
                  tokens={compareFeature!.topTokens}
                  activations={compareFeature!.tokenActivations}
                  maxTokens={20}
                  className={styles.tokenList}
                  highlightColor="var(--color-semantic-success)"
                  dimTokens={tokenDiffs.filter((t) => t.type === 'added').map((t) => t.token)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

DiffView.displayName = 'DiffView';