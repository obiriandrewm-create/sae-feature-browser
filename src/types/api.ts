export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface SearchRequest {
  query: string;
  filters: {
    layer?: number;
    minActivation?: number;
    maxActivation?: number;
    semanticLabel?: string;
    isBookmarked?: boolean;
  };
  sort: {
    field: 'activation' | 'layer' | 'label' | 'recent';
    order: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    pageSize: number;
  };
}

export interface SearchResponse {
  features: FeatureSummary[];
  totalCount: number;
  searchTimeMs: number;
}

export interface FeatureSummary {
  id: string;
  layer: number;
  maxActivation: number;
  semanticLabel: string | null;
  isBookmarked: boolean;
}

export interface FeatureDetailResponse {
  feature: Feature;
  activations: ActivationData;
  relatedFeatures: FeatureSummary[];
}

export interface BookmarkRequest {
  featureId: string;
  note: string;
  tags: string[];
}

export interface BookmarkResponse {
  bookmark: Bookmark;
}

export interface ComparisonRequest {
  featureIds: string[];
  name: string;
}

export interface ComparisonResponse {
  comparison: ComparisonSet;
  features: Feature[];
}

export interface ExportRequest {
  format: 'csv' | 'json' | 'parquet';
  filters: SearchRequest['filters'];
  fields: string[];
}

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    searchIndex: boolean;
    storage: boolean;
  };
  version: string;
}

export interface MockDataConfig {
  modelCount: number;
  featuresPerLayer: number;
  layersPerModel: number;
  tokenVocabSize: number;
  seed: number;
}

export interface Feature {
  id: string;
  layer: number;
  maxActivation: number;
  activationHistogram: number[];
  topTokens: string[];
  tokenActivations: number[];
  semanticLabel: string | null;
  explanation: string | null;
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