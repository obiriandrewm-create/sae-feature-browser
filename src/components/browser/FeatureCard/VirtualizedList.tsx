import { List as ReactWindowList } from 'react-window';
import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Feature } from '@/types/sae';
import { FeatureCard } from './FeatureCard';
import styles from './VirtualizedList.module.css';

export interface VirtualizedListProps {
  features: Feature[];
  variant?: 'compact' | 'detailed' | 'comparison';
  height: number;
  itemHeight: number;
  itemWidth?: number;
  selectedIds: Set<string>;
  focusedId: string | null;
  bookmarkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onCompare?: (id: string) => void;
  showCompareButton?: boolean;
  onScroll?: (scrollTop: number) => void;
  overscanCount?: number;
  className?: string;
  emptyMessage?: string;
  renderPlaceholder?: () => React.ReactNode;
}

export const VirtualizedList = ({
  features,
  variant = 'detailed',
  height,
  itemHeight,
  itemWidth,
  selectedIds,
  focusedId,
  bookmarkedIds,
  onSelect,
  onToggleBookmark,
  onCompare,
  showCompareButton = false,
  onScroll,
  overscanCount = 5,
  className,
  emptyMessage = 'No features found',
  renderPlaceholder,
}: VirtualizedListProps) => {
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const ListComponent = ReactWindowList as any;

  const handleScroll = useCallback(
    (scrollTop: number) => {
      if (onScroll) {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
          onScroll(scrollTop);
        }, 16);
      }
    },
    [onScroll]
  );

  const ItemRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const feature = features[index];
      if (!feature) return null;

      const isBookmarked = bookmarkedIds.has(feature.id);
      const isFocused = focusedId === feature.id;

      return (
        <div style={style} data-feature-id={feature.id}>
          <FeatureCard
            feature={feature}
            variant={variant}
            isFocused={isFocused}
            isBookmarked={isBookmarked}
            onToggleBookmark={onToggleBookmark}
            onSelect={onSelect}
            onCompare={onCompare}
            showCompareButton={showCompareButton}
          />
        </div>
      );
    },
    [features, variant, selectedIds, focusedId, bookmarkedIds, onToggleBookmark, onSelect, onCompare, showCompareButton]
  );

  if (features.length === 0) {
    return (
      <div className={cn(styles.empty, className)} style={{ height }} role="status" aria-live="polite">
        {renderPlaceholder ? renderPlaceholder() : emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn(styles.container, className)} style={{ height, width: itemWidth }}>
      <ListComponent
        height={height}
        itemCount={features.length}
        itemSize={itemHeight}
        itemData={features}
        width={itemWidth}
        overscanCount={overscanCount}
        onScroll={(e: any) => handleScroll(e.target.scrollTop)}
        itemKey={(index: number) => features[index]?.id ?? index}
      >
        {(ItemRenderer as unknown) as React.ReactNode}
      </ListComponent>
    </div>
  );
};

VirtualizedList.displayName = 'VirtualizedList';