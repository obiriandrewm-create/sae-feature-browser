/**
 * Annotations panel component for the workspace sidebar
 */

import { useState } from 'react';
import { useWorkspaceStore, useAnnotations } from './store';
import { Annotation } from './types';
import styles from './Annotations.module.css';

interface AnnotationsProps {
  onFeatureSelect?: (featureId: string) => void;
}

export function Annotations({ onFeatureSelect }: AnnotationsProps) {
  const annotations = useAnnotations();
  const { removeAnnotation, updateAnnotation } = useWorkspaceStore();
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'feature'>('date');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const filteredAnnotations = annotations
    .filter((a) => {
      if (!filter) return true;
      const search = filter.toLowerCase();
      return (
        a.content.toLowerCase().includes(search) ||
        a.tags.some((t) => t.toLowerCase().includes(search)) ||
        a.featureId.includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'feature':
          return a.featureId.localeCompare(b.featureId);
      }
    });

  const typeIcons: Record<Annotation['type'], JSX.Element> = {
    note: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
        <path d="M14 2V8H20" />
      </svg>
    ),
    highlight: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3V21" />
        <path d="M3 12H21" />
      </svg>
    ),
    question: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9A3 3 0 0 1 15 6.36M12 17H12.01" />
      </svg>
    ),
    insight: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <path d="M12 22V12" />
      </svg>
    ),
  };

  const typeColors: Record<Annotation['type'], string> = {
    note: 'var(--accent-color)',
    highlight: 'var(--warning-color)',
    question: 'var(--info-color)',
    insight: 'var(--success-color)',
  };

  const startEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const saveEdit = async (id: string) => {
    await updateAnnotation(id, { content: editContent });
    setEditingId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeAnnotation(id);
  };

  const handleSelect = (featureId: string) => {
    onFeatureSelect?.(featureId);
  };

  if (annotations.length === 0) {
    return (
      <div className={styles.empty}>
        <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
          <path d="M14 2V8H20" />
          <path d="M16 13H8M16 17H8M10 9H9" />
        </svg>
        <p>No annotations yet</p>
        <span className={styles.emptyHint}>Annotations appear when you add notes to features</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder="Filter annotations..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter annotations"
        />
        <select
          className={styles.sort}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          aria-label="Sort annotations"
        >
          <option value="date">Date</option>
          <option value="type">Type</option>
          <option value="feature">Feature</option>
        </select>
      </div>

      <div className={styles.list} role="list" aria-label="Annotations">
        {filteredAnnotations.map((annotation) => (
          <AnnotationItem
            key={annotation.id}
            annotation={annotation}
            typeIcons={typeIcons}
            typeColors={typeColors}
            isEditing={editingId === annotation.id}
            editContent={editContent}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={cancelEdit}
            onContentChange={setEditContent}
            onRemove={handleRemove}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <div className={styles.count}>
        {filteredAnnotations.length} of {annotations.length} annotations
      </div>
    </div>
  );
}

interface AnnotationItemProps {
  annotation: Annotation;
  typeIcons: Record<Annotation['type'], JSX.Element>;
  typeColors: Record<Annotation['type'], string>;
  isEditing: boolean;
  editContent: string;
  onStartEdit: (annotation: Annotation) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onContentChange: (content: string) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  onSelect: (featureId: string) => void;
}

function AnnotationItem({
  annotation,
  typeIcons,
  typeColors,
  isEditing,
  editContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onContentChange,
  onRemove,
  onSelect,
}: AnnotationItemProps) {
  const date = new Date(annotation.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const updatedDate = new Date(annotation.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const typeColor = typeColors[annotation.type] || 'var(--accent-color)';
  const Icon = typeIcons[annotation.type];

  return (
    <article className={`${styles.item} ${styles[annotation.type]} ${isEditing ? styles.editing : ''}`}>
      <div className={styles.header}>
        <div className={styles.typeBadge} style={{ borderColor: typeColor }}>
          <span className={styles.typeIcon} style={{ color: typeColor }}>
            {Icon}
          </span>
          <span className={styles.typeLabel}>{annotation.type}</span>
        </div>
        <div className={styles.featureRef}>
          <span className={styles.layerBadge} style={{ background: `var(--layer-${annotation.featureId.split('-')[0]}-alpha, var(--accent-alpha))` }}>
            Feature #{annotation.featureId}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className={styles.editForm}>
          <textarea
            className={styles.editTextarea}
            value={editContent}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                onSaveEdit(annotation.id);
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            rows={3}
            placeholder="Enter your annotation..."
            aria-label="Edit annotation"
          />
          <div className={styles.editActions}>
            <button
              className={styles.cancelBtn}
              onClick={onCancelEdit}
            >
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={() => onSaveEdit(annotation.id)}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.content} onDoubleClick={() => onStartEdit(annotation)}>
            {annotation.content}
          </div>
          <div className={styles.meta}>
            <span className={styles.date}>Created {date}</span>
            {annotation.updatedAt !== annotation.createdAt && (
              <span className={styles.updated}>Updated {updatedDate}</span>
            )}
            {annotation.tags.length > 0 && (
              <div className={styles.tags}>
                {annotation.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <button
              className={styles.iconBtn}
              onClick={() => onSelect(annotation.featureId)}
              aria-label="View feature"
              title="View feature"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              className={styles.iconBtn}
              onClick={() => onStartEdit(annotation)}
              aria-label="Edit annotation"
              title="Edit"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H18C19.1046 20 20 19.1046 20 18V11" />
                <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" />
              </svg>
            </button>
            <button
              className={`${styles.iconBtn} ${styles.removeBtn}`}
              onClick={(e) => onRemove(annotation.id, e)}
              aria-label="Delete annotation"
              title="Delete"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6H5H21M8 6V4C8 3.46957 8.46957 3 9 3H15C15.5304 3 16 3.46957 16 4V6M19 6V20C19 20.5304 18.5304 21 18 21H6C5.46957 21 5 20.5304 5 20V6H19Z" />
              </svg>
            </button>
          </div>
        </>
      )}
    </article>
  );
}