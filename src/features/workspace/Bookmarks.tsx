/**
 * Bookmarks panel component for the workspace sidebar
 */

import { useState } from 'react';
import { useWorkspaceStore, useBookmarks } from './store';
import { Bookmark } from './types';
import styles from './Bookmarks.module.css';

interface BookmarksProps {
  onFeatureSelect?: (featureId: string) => void;
  onFeatureCompare?: (featureId: string) => void;
}

export function Bookmarks({ onFeatureSelect, onFeatureCompare }: BookmarksProps) {
  const bookmarks = useBookmarks();
  const { removeBookmark, toggleBookmark, getBookmark } = useWorkspaceStore();
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'layer' | 'activation'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredBookmarks = bookmarks
    .filter((b) => {
      if (!filter) return true;
      const search = filter.toLowerCase();
      return (
        b.featureData.semanticLabel?.toLowerCase().includes(search) ||
        b.tags.some((t) => t.toLowerCase().includes(search)) ||
        b.notes?.toLowerCase().includes(search) ||
        b.featureId.includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'layer':
          return a.featureData.layer - b.featureData.layer;
        case 'activation':
          return b.featureData.maxActivation - a.featureData.maxActivation;
      }
    });

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeBookmark(id);
  };

  const handleSelect = (featureId: string) => {
    onFeatureSelect?.(featureId);
  };

  const handleCompare = (featureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFeatureCompare?.(featureId);
  };

  const handleTagAdd = async (bookmark: Bookmark, tag: string) => {
    if (!tag.trim()) return;
    const updated = { ...bookmark, tags: [...bookmark.tags, tag.trim()] };
    // Update would need to be added to store
  };

  if (bookmarks.length === 0) {
    return (
      <div className={styles.empty}>
        <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 21L12 16.5L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z" />
        </svg>
        <p>No bookmarks yet</p>
        <span className={styles.emptyHint}>Click the star on any feature to bookmark it</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Filter bookmarks..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter bookmarks"
        />
        <select
          className={styles.sort}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          aria-label="Sort bookmarks"
        >
          <option value="date">Date Added</option>
          <option value="layer">Layer</option>
          <option value="activation">Activation</option>
        </select>
      </div>

      <div className={styles.list} role="list" aria-label="Bookmarks">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            isExpanded={expandedId === bookmark.id}
            onToggleExpand={handleToggleExpand}
            onRemove={handleRemove}
            onSelect={handleSelect}
            onCompare={handleCompare}
          />
        ))}
      </div>

      <div className={styles.count}>
        {filteredBookmarks.length} of {bookmarks.length} bookmarks
      </div>
    </div>
  );
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onSelect: (featureId: string) => void;
  onCompare: (featureId: string, e: React.MouseEvent) => void;
}

function BookmarkItem({
  bookmark,
  isExpanded,
  onToggleExpand,
  onRemove,
  onSelect,
  onCompare,
}: BookmarkItemProps) {
  const date = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article
      className={`${styles.item} ${isExpanded ? styles.expanded : ''}`}
      onClick={() => onToggleExpand(bookmark.id)}
    >
      <div className={styles.mainRow}>
        <div className={styles.featureInfo}>
          <span className={`${styles.layerBadge} layer-${bookmark.featureData.layer}`}>
            L{bookmark.featureData.layer}
          </span>
          <span className={styles.featureId}>#{bookmark.featureId}</span>
          {bookmark.featureData.semanticLabel && (
            <span className={styles.semanticLabel}>{bookmark.featureData.semanticLabel}</span>
          )}
        </div>
        <div className={styles.actions}>
          <span className={styles.activation}>{bookmark.featureData.maxActivation.toFixed(2)}</span>
          <button
            className={styles.iconBtn}
            onClick={(e) => onCompare(bookmark.featureId, e)}
            aria-label="Add to comparison"
            title="Compare"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 19H8C6.89543 19 6 18.1046 6 17V7C6 5.89543 6.89543 5 8 5H16C17.1046 5 18 5.89543 18 7V15" />
              <path d="M16 5H18C19.1046 5 20 5.89543 20 7V17C20 18.1046 19.1046 19 18 19H14" />
            </svg>
          </button>
          <button
            className={`${styles.iconBtn} ${styles.removeBtn}`}
            onClick={(e) => onRemove(bookmark.id, e)}
            aria-label="Remove bookmark"
            title="Remove bookmark"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.meta}>
            <span className={styles.date}>Added {date}</span>
            {bookmark.tags.length > 0 && (
              <div className={styles.tags}>
                {bookmark.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
            {bookmark.notes && (
              <p className={styles.notes}>{bookmark.notes}</p>
            )}
          </div>
          <div className={styles.expandedActions}>
            <button
              className={styles.primaryBtn}
              onClick={() => onSelect(bookmark.featureId)}
            >
              View Feature
            </button>
          </div>
        </div>
      )}
    </article>
  );
}