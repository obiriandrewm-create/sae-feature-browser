import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ActivationHistogram } from '@/components/charts/ActivationHistogram/ActivationHistogram';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter/TokenHighlighter';
import { Feature } from '@/types/sae';
import styles from './FeatureDetail.module.css';

export interface FeatureDetailProps {
  feature: Feature | null;
  relatedFeatures: Feature[];
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onSelectRelated: (id: string) => void;
  onClose?: () => void;
  onCompare?: (id: string) => void;
  showCompareButton?: boolean;
  className?: string;
}

export const FeatureDetail = ({
  feature,
  relatedFeatures,
  isBookmarked,
  onToggleBookmark,
  onSelectRelated,
  onClose,
  onCompare,
  showCompareButton = false,
  className,
}: FeatureDetailProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activations' | 'tokens' | 'related'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['metadata', 'statistics']));
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!feature) return;

      switch (event.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const tabs = ['overview', 'activations', 'tokens', 'related'] as const;
            const currentIndex = tabs.indexOf(activeTab);
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            setActiveTab(tabs[prevIndex]);
          }
          break;
        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            const tabs = ['overview', 'activations', 'tokens', 'related'] as const;
            const currentIndex = tabs.indexOf(activeTab);
            const nextIndex = (currentIndex + 1) % tabs.length;
            setActiveTab(tabs[nextIndex]);
          }
          break;
        case 'b':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onToggleBookmark(feature.id);
          }
          break;
        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onCompare?.(feature.id);
          }
          break;
      }
    },
    [feature, activeTab, onClose, onToggleBookmark, onCompare]
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.target === document.body || panelRef.current?.contains(event.target as Node)) {
        handleKeyDown(event as React.KeyboardEvent);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleKeyDown]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  if (!feature) {
    return (
      <div className={cn(styles.empty, className)} role="status" aria-live="polite">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.emptyContent}
        >
          <div className={styles.emptyIcon}>🔍</div>
          <h3>No Feature Selected</h3>
          <p>Select a feature from the list to view detailed information</p>
          <kbd className={styles.hint}>Click a feature card or use ↑↓ keys</kbd>
        </motion.div>
      </div>
    );
  }

  const stats = useMemo(() => {
    const activations = feature.activationHistogram;
    const total = activations.reduce((sum, v) => sum + v, 0);
    const mean = activations.reduce((sum, v, i) => sum + v * (i / activations.length), 0);
    const sorted = [...feature.tokenActivations].sort((a, b) => b - a);
    const topActivation = sorted[0] ?? 0;
    const sparsity = 1 - activations.filter((v) => v > 0.01).length / activations.length;

    return {
      maxActivation: feature.maxActivation,
      meanActivation: mean,
      sparsity,
      topTokenActivation: topActivation,
      tokenCount: feature.topTokens.length,
      hasLabel: !!feature.semanticLabel,
      layer: feature.layer,
      featureIndex: feature.featureIndex,
    };
  }, [feature]);

  return (
    <motion.div
      ref={panelRef}
      className={cn(styles.panel, className)}
      role="region"
      aria-label={`Feature ${feature.id} details`}
      tabIndex={-1}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onKeyDown={handleKeyDown}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={feature.id}
          className={styles.header}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className={styles.headerMain}>
            <div className={styles.idRow}>
              <span className={cn(styles.layerBadge, styles[`layer-${feature.layer}`])}>
                Layer {feature.layer}
              </span>
              <span className={styles.featureId}>Feature {feature.featureIndex}</span>
              <span className={styles.featureFullId}>{feature.id}</span>
            </div>
            <h2 className={styles.semanticLabel}>
              {feature.semanticLabel || <em>Unlabeled Feature</em>}
            </h2>
          </div>
          <div className={styles.headerActions}>
            <button
              className={cn(styles.actionBtn, isBookmarked && styles.active)}
              onClick={() => onToggleBookmark(feature.id)}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={isBookmarked}
              title={isBookmarked ? 'Remove bookmark (Ctrl+B)' : 'Add bookmark (Ctrl+B)'}
            >
              ★
              <span className={styles.actionLabel}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            {showCompareButton && onCompare && (
              <button
                className={styles.actionBtn}
                onClick={() => onCompare(feature.id)}
                aria-label="Add to comparison"
                title="Add to comparison (Ctrl+C)"
              >
                ⚖
                <span className={styles.actionLabel}>Compare</span>
              </button>
            )}
            {onClose && (
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close detail panel"
                title="Close (Esc)"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <nav className={styles.tabs} role="tablist" aria-label="Feature detail sections">
        {[
          { id: 'overview', label: 'Overview', shortcut: '1' },
          { id: 'activations', label: 'Activations', shortcut: '2' },
          { id: 'tokens', label: 'Top Tokens', shortcut: '3' },
          { id: 'related', label: 'Related', shortcut: '4' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            className={cn(styles.tab, activeTab === tab.id && styles.active)}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab(tab.id as typeof activeTab);
              }
            }}
          >
            <span>{tab.label}</span>
            <kbd className={styles.shortcut}>{tab.shortcut}</kbd>
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`${activeTab}-panel`}
            role="tabpanel"
            aria-labelledby={`${activeTab}-tab`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={styles.tabPanel}
          >
            {activeTab === 'overview' && <OverviewTab feature={feature} stats={stats} expandedSections={expandedSections} onToggleSection={toggleSection} />}
            {activeTab === 'activations' && <ActivationsTab feature={feature} />}
            {activeTab === 'tokens' && <TokensTab feature={feature} />}
            {activeTab === 'related' && <RelatedTab features={relatedFeatures} onSelect={onSelectRelated} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {feature.description && (
        <div className={styles.description}>
          <h4>Description</h4>
          <p>{feature.description}</p>
        </div>
      )}
    </motion.div>
  );
};

interface OverviewTabProps {
  feature: Feature;
  stats: ReturnType<typeof useMemo>;
  expandedSections: Set<string>;
  onToggleSection: (section: string) => void;
}

const OverviewTab = ({ feature, stats, expandedSections, onToggleSection }: OverviewTabProps) => (
  <div className={styles.overview}>
    <Section
      title="Metadata"
      id="metadata"
      expanded={expandedSections.has('metadata')}
      onToggle={onToggleSection}
    >
      <dl className={styles.metadataList}>
        <div className={styles.metadataItem}>
          <dt>Feature ID</dt>
          <dd className={styles.monospace}>{feature.id}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Layer</dt>
          <dd>{feature.layer}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Feature Index</dt>
          <dd className={styles.monospace}>{feature.featureIndex}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Semantic Label</dt>
          <dd>{feature.semanticLabel || <em>Not labeled</em>}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Bookmarked</dt>
          <dd>{feature.isBookmarked ? 'Yes' : 'No'}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Created</dt>
          <dd className={styles.monospace}>{new Date(feature.createdAt).toLocaleString()}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Updated</dt>
          <dd className={styles.monospace}>{new Date(feature.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>
    </Section>

    <Section
      title="Statistics"
      id="statistics"
      expanded={expandedSections.has('statistics')}
      onToggle={onToggleSection}
    >
      <dl className={styles.metadataList}>
        <div className={styles.metadataItem}>
          <dt>Max Activation</dt>
          <dd className={styles.monospace}>{stats.maxActivation.toFixed(4)}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Mean Activation</dt>
          <dd className={styles.monospace}>{stats.meanActivation.toFixed(4)}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Sparsity</dt>
          <dd className={styles.monospace}>{(stats.sparsity * 100).toFixed(1)}%</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Top Token Activation</dt>
          <dd className={styles.monospace}>{stats.topTokenActivation.toFixed(4)}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Token Count</dt>
          <dd>{stats.tokenCount}</dd>
        </div>
        <div className={styles.metadataItem}>
          <dt>Has Label</dt>
          <dd>{stats.hasLabel ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </Section>
  </div>
);

interface ActivationsTabProps {
  feature: Feature;
}

const ActivationsTab = ({ feature }: ActivationsTabProps) => (
  <div className={styles.activations}>
    <div className={styles.histogramWrapper}>
      <ActivationHistogram
        data={feature.activationHistogram}
        maxActivation={feature.maxActivation}
        bins={50}
        width={400}
        height={200}
        showAxes
        showTooltip
        showMeanLine
        showPercentileLines
        ariaLabel={`Activation histogram for ${feature.id}`}
      />
    </div>
    <div className={styles.sparklineWrapper}>
      <ActivationSparkline
        data={feature.activationHistogram}
        maxActivation={feature.maxActivation}
        width={400}
        height={60}
        ariaLabel={`Activation sparkline for ${feature.id}`}
      />
    </div>
  </div>
);

interface TokensTabProps {
  feature: Feature;
}

const TokensTab = ({ feature }: TokensTabProps) => (
  <div className={styles.tokens}>
    <TokenHighlighter
      tokens={feature.topTokens}
      activations={feature.tokenActivations}
      maxTokens={20}
      maxActivation={feature.maxActivation}
      showValues
      ariaLabel={`Top tokens for ${feature.id}`}
    />
    <table className={styles.tokenTable} role="table">
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">Token</th>
          <th scope="col">Activation</th>
          <th scope="col">Relative</th>
        </tr>
      </thead>
      <tbody>
        {feature.topTokens.map((token, i) => (
          <tr key={i}>
            <td className={styles.monospace}>{i + 1}</td>
            <td className={styles.tokenCell}>
              <code>{token}</code>
            </td>
            <td className={styles.monospace}>{feature.tokenActivations[i]?.toFixed(4) ?? '0'}</td>
            <td>
              <div className={styles.relativeBar}>
                <div
                  className={styles.relativeFill}
                  style={{ width: `${((feature.tokenActivations[i] ?? 0) / feature.maxActivation) * 100}%` }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface RelatedTabProps {
  features: Feature[];
  onSelect: (id: string) => void;
}

const RelatedTab = ({ features, onSelect }: RelatedTabProps) => {
  if (features.length === 0) {
    return (
      <div className={styles.emptyRelated}>
        <p>No related features found</p>
      </div>
    );
  }

  return (
    <div className={styles.relatedList}>
      {features.map((feature) => (
        <button
          key={feature.id}
          className={styles.relatedItem}
          onClick={() => onSelect(feature.id)}
        >
          <span className={cn(styles.layerBadge, styles[`layer-${feature.layer}`])}>
            L{feature.layer}
          </span>
          <span className={styles.relatedId}>{feature.id}</span>
          <span className={styles.relatedLabel}>{feature.semanticLabel || 'Unlabeled'}</span>
          <span className={styles.relatedActivation}>{feature.maxActivation.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
};

interface SectionProps {
  title: string;
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

const Section = ({ title, id, expanded, onToggle, children }: SectionProps) => (
  <details className={styles.section} open={expanded} onToggle={() => onToggle(id)}>
    <summary className={styles.sectionSummary}>
      <span>{title}</span>
      <span className={cn(styles.chevron, expanded && styles.expanded)}>▶</span>
    </summary>
    <div className={styles.sectionContent}>{children}</div>
  </details>
);

FeatureDetail.displayName = 'FeatureDetail';