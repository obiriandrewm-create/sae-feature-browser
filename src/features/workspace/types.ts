/**
 * Workspace types for bookmarks, annotations, and session persistence
 */

export interface Bookmark {
  id: string;
  featureId: string;
  featureData: {
    layer: number;
    index: number;
    semanticLabel?: string;
    maxActivation: number;
  };
  createdAt: string; // ISO date string
  tags: string[];
  notes?: string;
}

export interface Annotation {
  id: string;
  featureId: string;
  type: 'note' | 'highlight' | 'question' | 'insight';
  content: string;
  position?: { x: number; y: number }; // For spatial annotations
  createdAt: string;
  updatedAt: string;
  tags: string[];
  color?: string;
}

export interface WorkspaceSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  bookmarks: Bookmark[];
  annotations: Annotation[];
  filters: Record<string, unknown>;
  selectedFeatureIds: string[];
  comparisonFeatureIds: string[];
  viewport?: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface ExportData {
  bookmarks: Bookmark[];
  annotations: Annotation[];
  session: Partial<WorkspaceSession>;
  exportedAt: string;
  version: string;
}

export interface ShareableUrlData {
  filters: Record<string, unknown>;
  selectedFeatureIds: string[];
  comparisonFeatureIds: string[];
  viewport?: {
    x: number;
    y: number;
    scale: number;
  };
  timestamp: string;
}

export type WorkspaceEventType = 
  | 'bookmark_added'
  | 'bookmark_removed'
  | 'annotation_added'
  | 'annotation_updated'
  | 'annotation_removed'
  | 'session_saved'
  | 'session_loaded'
  | 'export_requested';

export interface WorkspaceEvent {
  type: WorkspaceEventType;
  payload: unknown;
  timestamp: string;
}