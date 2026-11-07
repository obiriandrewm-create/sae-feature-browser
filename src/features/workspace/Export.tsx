/**
 * Export panel component for workspace data export
 * Supports CSV, JSON, and shareable URL generation
 */

import { useState } from 'react';
import { useWorkspaceStore } from './store';
import { ExportData, ShareableUrlData } from './types';
import styles from './Export.module.css';

interface ExportProps {
  currentFilters?: Record<string, unknown>;
  selectedFeatureIds?: string[];
  comparisonFeatureIds?: string[];
  viewport?: { x: number; y: number; scale: number };
}

export function Export({
  currentFilters = {},
  selectedFeatureIds = [],
  comparisonFeatureIds = [],
  viewport,
}: ExportProps) {
  const { exportData: exportWorkspaceData, bookmarks, annotations, sessions, currentSessionId } = useWorkspaceStore();
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'url'>('json');
  const [includeBookmarks, setIncludeBookmarks] = useState(true);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeSession, setIncludeSession] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportWorkspaceData();
      
      const exportData: ExportData = {
        bookmarks: includeBookmarks ? data.bookmarks : [],
        annotations: includeAnnotations ? data.annotations : [],
        session: includeSession ? {
          id: currentSessionId || '',
          name: sessions.find(s => s.id === currentSessionId)?.name || 'Untitled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          bookmarks: includeBookmarks ? data.bookmarks : [],
          annotations: includeAnnotations ? data.annotations : [],
          filters: currentFilters,
          selectedFeatureIds,
          comparisonFeatureIds,
          viewport,
        } : undefined,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      if (exportFormat === 'json') {
        downloadJson(exportData);
      } else if (exportFormat === 'csv') {
        downloadCsv(data);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateUrl = async () => {
    const urlData: ShareableUrlData = {
      filters: currentFilters,
      selectedFeatureIds,
      comparisonFeatureIds,
      viewport,
      timestamp: new Date().toISOString(),
    };

    // Compress and encode for URL
    const compressed = compressToBase64(urlData);
    const url = `${window.location.origin}${window.location.pathname}?workspace=${compressed}`;
    setShareUrl(url);
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const downloadJson = (data: ExportData) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sae-workspace-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = (data: { bookmarks: typeof bookmarks; annotations: typeof annotations }) => {
    const rows: string[][] = [
      ['Type', 'ID', 'Feature ID', 'Layer', 'Semantic Label', 'Max Activation', 'Tags', 'Notes', 'Created At'],
    ];

    for (const b of data.bookmarks) {
      rows.push([
        'Bookmark',
        b.id,
        b.featureId,
        b.featureData.layer.toString(),
        b.featureData.semanticLabel || '',
        b.featureData.maxActivation.toString(),
        b.tags.join(';'),
        b.notes || '',
        b.createdAt,
      ]);
    }

    for (const a of data.annotations) {
      rows.push([
        'Annotation',
        a.id,
        a.featureId,
        '',
        '',
        '',
        a.tags.join(';'),
        a.content.replace(/\n/g, ' '),
        a.createdAt,
      ]);
    }

    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sae-workspace-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple base64 compression for URL sharing
  function compressToBase64(data: ShareableUrlData): string {
    const json = JSON.stringify(data);
    return btoa(json);
  }

  // Stats for display
  const stats = {
    bookmarks: bookmarks.length,
    annotations: annotations.length,
    sessions: sessions.length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Export Data</h3>
        <p className={styles.sectionDesc}>
          Download your workspace data including bookmarks, annotations, and session state.
        </p>

        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeBookmarks}
              onChange={(e) => setIncludeBookmarks(e.target.checked)}
            />
            <span>Bookmarks ({stats.bookmarks})</span>
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeAnnotations}
              onChange={(e) => setIncludeAnnotations(e.target.checked)}
            />
            <span>Annotations ({stats.annotations})</span>
          </label>
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeSession}
              onChange={(e) => setIncludeSession(e.target.checked)}
            />
            <span>Current Session</span>
          </label>
        </div>

        <div className={styles.formatSelector}>
          <label className={styles.formatLabel}>Format:</label>
          <div className={styles.formatButtons}>
            <button
              className={`${styles.formatBtn} ${exportFormat === 'json' ? styles.active : ''}`}
              onClick={() => setExportFormat('json')}
            >
              JSON
            </button>
            <button
              className={`${styles.formatBtn} ${exportFormat === 'csv' ? styles.active : ''}`}
              onClick={() => setExportFormat('csv')}
            >
              CSV
            </button>
          </div>
        </div>

        <button
          className={styles.exportBtn}
          onClick={handleExport}
          disabled={isExporting || (!includeBookmarks && !includeAnnotations && !includeSession)}
        >
          {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Shareable Link</h3>
        <p className={styles.sectionDesc}>
          Generate a link that recreates your current view with filters, selections, and viewport.
        </p>

        <button
          className={styles.generateBtn}
          onClick={handleGenerateUrl}
        >
          Generate Link
        </button>

        {shareUrl && (
          <div className={styles.urlContainer}>
            <input
              type="text"
              className={styles.urlInput}
              value={shareUrl}
              readOnly
              aria-label="Shareable workspace URL"
            />
            <button
              className={`${styles.copyBtn} ${copySuccess ? styles.copied : ''}`}
              onClick={handleCopyUrl}
              aria-label={copySuccess ? 'Copied!' : 'Copy to clipboard'}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Import</h3>
        <p className={styles.sectionDesc}>
          Restore a previously exported workspace JSON file.
        </p>
        <ImportWorkspace />
      </div>
    </div>
  );
}

function ImportWorkspace() {
  const [dragActive, setDragActive] = useState(false);
  const { loadBookmarks, loadAnnotations, loadSessions } = useWorkspaceStore();

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        // Import logic would go here
        alert('Import functionality would restore bookmarks, annotations, and sessions from the file.');
        await loadBookmarks();
        await loadAnnotations();
        await loadSessions();
      } catch {
        alert('Invalid JSON file');
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        alert('Import functionality would restore bookmarks, annotations, and sessions from the file.');
        await loadBookmarks();
        await loadAnnotations();
        await loadSessions();
      } catch {
        alert('Invalid JSON file');
      }
    }
  };

  return (
    <div
      className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".json"
        className={styles.fileInput}
        onChange={handleFileSelect}
        id="workspace-import"
        aria-label="Import workspace JSON"
      />
      <label htmlFor="workspace-import" className={styles.dropLabel}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15V19C21 19.5304 20.5304 20 20 20H4C3.46957 20 3 19.5304 3 19V15" />
          <path d="M17 21L12 16L7 21" />
          <path d="M12 16V4" />
        </svg>
        <span>Drag & drop JSON file or click to browse</span>
      </label>
    </div>
  );
}