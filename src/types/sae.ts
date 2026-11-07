export interface Feature {
  id: string;
  layer: number;
  featureIndex: number;
  maxActivation: number;
  activationHistogram: number[];
  topTokens: string[];
  tokenActivations: number[];
  semanticLabel: string | null;
  explanation: string | null;
  description: string | null;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationData {
  featureId: string;
  tokens: string[];
  activations: number[];
  positions: number[];
}

export interface LayerInfo {
  index: number;
  name: string;
  featureCount: number;
  maxActivation: number;
  avgActivation: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  layers: LayerInfo[];
  totalFeatures: number;
  description: string;
}

export interface SearchFilters {
  query: string;
  layer?: number;
  minActivation?: number;
  maxActivation?: number;
  semanticLabel?: string;
  isBookmarked?: boolean;
  sortBy: 'activation' | 'layer' | 'label' | 'recent';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  features: Feature[];
  totalCount: number;
  searchTimeMs: number;
  page: number;
  pageSize: number;
}

export interface Bookmark {
  featureId: string;
  feature: Feature;
  note: string;
  tags: string[];
  createdAt: string;
}

export interface ComparisonSet {
  id: string;
  name: string;
  featureIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'parquet';
  fields: string[];
  filters: SearchFilters;
}

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
  focusFeatureId: string | null;
  fisheyeEnabled: boolean;
  fisheyeStrength: number;
  fisheyeRadius: number;
}

export interface JitterConfig {
  enabled: boolean;
  intensity: number;
  frequency: number;
  respectsReducedMotion: boolean;
}

export interface FeatureSelection {
  selectedIds: Set<string>;
  focusedId: string | null;
  hoveredId: string | null;
}

export type FeatureViewMode = 'grid' | 'list' | 'comparison' | 'detail';

export interface FeatureBrowserState {
  viewMode: FeatureViewMode;
  searchFilters: SearchFilters;
  selection: FeatureSelection;
  viewport: ViewportState;
  comparisonSet: ComparisonSet | null;
}