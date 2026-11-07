/**
 * FlexSearch Web Worker for client-side full-text search
 * Handles indexing and searching 1M+ features in <100ms
 */

import FlexSearch from 'flexsearch';
import {
  Feature,
  SearchFilters,
  SearchResult,
} from '@/types/sae';
import {
  IncomingMessage,
  OutgoingMessage,
  InitPayload,
  SearchPayload,
  FilterPayload,
  IndexPayload,
  ProgressPayload,
  ErrorPayload,
  StatsResult,
  createMessage,
  isInitMessage,
  isSearchMessage,
  isFilterMessage,
  isIndexMessage,
  isClearMessage,
  isPersistMessage,
  isLoadMessage,
  isStatsMessage,
} from '@/types/flexsearch';

// Worker state
let index: FlexSearch.Document<Feature> | null = null;
let features: Feature[] = [];
let isIndexing = false;
let currentId = '';

// IndexedDB for persistence
const DB_NAME = 'sae-flexsearch-index';
const DB_VERSION = 1;
const STORE_NAME = 'indexStore';

interface IndexedDBIndex {
  id: string;
  data: string;
  featureCount: number;
  createdAt: string;
  features: Feature[];
}

// Initialize IndexedDB
function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save index to IndexedDB
async function saveIndexToDB(indexData: string, featureCount: number): Promise<void> {
  const db = await initIndexedDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const data: IndexedDBIndex = {
    id: 'main-index',
    data: indexData,
    featureCount,
    createdAt: new Date().toISOString(),
    features,
  };

  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Load index from IndexedDB
async function loadIndexFromDB(): Promise<IndexedDBIndex | null> {
  const db = await initIndexedDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get('main-index');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Create FlexSearch document index
function createIndex(options?: InitPayload['options']): FlexSearch.Document<Feature> {
  return new FlexSearch.Document<Feature>({
    document: {
      id: 'id',
      index: [
        'id',
        'semanticLabel',
        'explanation',
        'topTokens',
      ],
      store: true,
    },
    tokenize: options?.tokenize || 'forward',
    resolution: options?.resolution || 9,
    depth: options?.depth || 0,
    minlength: options?.minlength || 1,
    maxlen: options?.maxlen || 100,
    split: options?.split || /[\s\-_\/\\.,;:!?()[\]{}"'<>]+/,
    charset: options?.charset || 'latin:advanced',
    optimize: options?.optimize !== false,
    context: options?.context ?? true,
    suggest: options?.suggest ?? false,
    profile: options?.profile || 'balanced',
  } as FlexSearch.DocumentOptions<Feature, string>);
}

// Apply filters to search results
function applyFilters(results: Feature[], filters: SearchFilters): Feature[] {
  return results.filter((feature) => {
    if (filters.layer !== undefined && feature.layer !== filters.layer) {
      return false;
    }
    if (filters.minActivation !== undefined && feature.maxActivation < filters.minActivation) {
      return false;
    }
    if (filters.maxActivation !== undefined && feature.maxActivation > filters.maxActivation) {
      return false;
    }
    if (filters.semanticLabel !== undefined && feature.semanticLabel !== filters.semanticLabel) {
      return false;
    }
    if (filters.isBookmarked !== undefined && feature.isBookmarked !== filters.isBookmarked) {
      return false;
    }
    return true;
  });
}

// Sort results
function sortResults(results: Feature[], sortBy: SearchFilters['sortBy'], sortOrder: SearchFilters['sortOrder']): Feature[] {
  const multiplier = sortOrder === 'asc' ? 1 : -1;
  return [...results].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    switch (sortBy) {
      case 'activation':
        aVal = a.maxActivation;
        bVal = b.maxActivation;
        break;
      case 'layer':
        aVal = a.layer;
        bVal = b.layer;
        break;
      case 'label':
        aVal = a.semanticLabel || '';
        bVal = b.semanticLabel || '';
        break;
      case 'recent':
        aVal = new Date(a.updatedAt).getTime();
        bVal = new Date(b.updatedAt).getTime();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return -1 * multiplier;
    if (aVal > bVal) return 1 * multiplier;
    return 0;
  });
}

// Send message to main thread
function postMessage<T>(msg: OutgoingMessage): void {
  self.postMessage(msg);
}

// Send progress update
function sendProgress(phase: ProgressPayload['phase'], processed: number, total: number): void {
  postMessage(createMessage('progress', {
    phase,
    processed,
    total,
    percentage: total > 0 ? Math.round((processed / total) * 100) : 0,
  }));
}

// Send error
function sendError(message: string, code: string, originalError?: Error): void {
  postMessage(createMessage('error', {
    message,
    code,
    originalError: originalError?.message,
  }));
}

// Handle init message
async function handleInit(msg: IncomingMessage & { payload: InitPayload }): Promise<void> {
  if (isIndexing) {
    sendError('Already indexing', 'ALREADY_INDEXING');
    return;
  }

  isIndexing = true;
  currentId = msg.id;
  features = msg.payload.features;

  try {
    index = createIndex(msg.payload.options);
    const total = features.length;

    // Batch index for better performance
    const batchSize = 10000;
    for (let i = 0; i < total; i += batchSize) {
      const batch = features.slice(i, i + batchSize);
      index.add(batch);
      sendProgress('indexing', Math.min(i + batchSize, total), total);

      // Yield to main thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    postMessage(createMessage('ready', {
      indexedCount: features.length,
      indexSize: index.export().length,
    }));

  } catch (error) {
    sendError('Failed to initialize index', 'INIT_FAILED', error as Error);
  } finally {
    isIndexing = false;
  }
}

// Handle search message
async function handleSearch(msg: IncomingMessage & { payload: SearchPayload }): Promise<void> {
  if (!index) {
    sendError('Index not initialized', 'INDEX_NOT_READY');
    return;
  }

  currentId = msg.id;
  const { query, filters, limit = 100, offset = 0, profile = 'balanced' } = msg.payload;

  const startTime = performance.now();

  try {
    // Perform search
    let searchResults: Feature[];

    if (query.trim()) {
      const results = index.search(query, {
        limit: limit + offset,
        enrich: true,
        profile: profile as 'score' | 'match' | 'balanced',
      }) as Array<{ doc: Feature }>;

      searchResults = results.map(r => r.doc).slice(offset, offset + limit);
    } else {
      // No query - return all (with filters)
      searchResults = features.slice(offset, offset + limit);
    }

    // Apply filters
    if (filters) {
      searchResults = applyFilters(searchResults, filters);
    }

    // Sort results
    if (filters) {
      searchResults = sortResults(searchResults, filters.sortBy, filters.sortOrder);
    }

    const searchTimeMs = performance.now() - startTime;

    const result: SearchResult = {
      features: searchResults,
      totalCount: searchResults.length,
      searchTimeMs,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };

    postMessage(createMessage('result', {
      results: result,
      searchTimeMs,
    }));

  } catch (error) {
    sendError('Search failed', 'SEARCH_FAILED', error as Error);
  }
}

// Handle filter message
async function handleFilter(msg: IncomingMessage & { payload: FilterPayload }): Promise<void> {
  if (!index) {
    sendError('Index not initialized', 'INDEX_NOT_READY');
    return;
  }

  currentId = msg.id;
  const { filters, limit = 100, offset = 0 } = msg.payload;

  const startTime = performance.now();

  try {
    // Filter all features
    let filtered = applyFilters(features, filters);

    // Sort
    filtered = sortResults(filtered, filters.sortBy, filters.sortOrder);

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    const searchTimeMs = performance.now() - startTime;

    const result: SearchResult = {
      features: paginated,
      totalCount: filtered.length,
      searchTimeMs,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };

    postMessage(createMessage('result', {
      results: result,
      searchTimeMs,
    }));

  } catch (error) {
    sendError('Filter failed', 'FILTER_FAILED', error as Error);
  }
}

// Handle index message (add more features)
async function handleIndex(msg: IncomingMessage & { payload: IndexPayload }): Promise<void> {
  if (!index || isIndexing) {
    sendError('Index not ready or already indexing', 'INDEX_NOT_READY');
    return;
  }

  isIndexing = true;
  currentId = msg.id;

  try {
    const newFeatures = msg.payload.features;
    features = [...features, ...newFeatures];

    const total = newFeatures.length;
    const batchSize = 10000;

    for (let i = 0; i < total; i += batchSize) {
      const batch = newFeatures.slice(i, i + batchSize);
      index.add(batch);
      sendProgress('indexing', features.length - total + i + batchSize, features.length);
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    postMessage(createMessage('ready', {
      indexedCount: features.length,
      indexSize: index.export().length,
    }));

  } catch (error) {
    sendError('Failed to add features', 'INDEX_FAILED', error as Error);
  } finally {
    isIndexing = false;
  }
}

// Handle clear message
function handleClear(): void {
  index = null;
  features = [];
  postMessage(createMessage('ready', {
    indexedCount: 0,
    indexSize: 0,
  }));
}

// Handle persist message
async function handlePersist(): Promise<void> {
  if (!index) {
    sendError('No index to persist', 'NO_INDEX');
    return;
  }

  currentId = 'persist';

  try {
    const indexData = index.export();
    await saveIndexToDB(indexData, features.length);
    sendProgress('persisting', features.length, features.length);
    postMessage(createMessage('result', {
      results: {
        features: [],
        totalCount: features.length,
        searchTimeMs: 0,
        page: 1,
        pageSize: 0,
      },
      searchTimeMs: 0,
    }));
  } catch (error) {
    sendError('Failed to persist index', 'PERSIST_FAILED', error as Error);
  }
}

// Handle load message
async function handleLoad(): Promise<void> {
  if (isIndexing) {
    sendError('Already indexing', 'ALREADY_INDEXING');
    return;
  }

  isIndexing = true;

  try {
    const persisted = await loadIndexFromDB();

    if (!persisted) {
      sendError('No persisted index found', 'NO_PERSISTED_INDEX');
      isIndexing = false;
      return;
    }

    index = createIndex();
    index.import(persisted.data);
    features = persisted.features;

    postMessage(createMessage('ready', {
      indexedCount: features.length,
      indexSize: persisted.data.length,
    }));

  } catch (error) {
    sendError('Failed to load index', 'LOAD_FAILED', error as Error);
  } finally {
    isIndexing = false;
  }
}

// Handle stats message
function handleStats(): void {
  if (!index) {
    postMessage(createMessage('result', {
      indexedCount: 0,
      indexSize: 0,
      memoryUsage: 0,
    } as StatsResult));
    return;
  }

  const indexData = index.export();
  postMessage(createMessage('result', {
    indexedCount: features.length,
    indexSize: indexData.length,
    memoryUsage: indexData.length + JSON.stringify(features).length,
  } as StatsResult));
}

// Main message handler
self.onmessage = async (event: MessageEvent<IncomingMessage>) => {
  const msg = event.data;

  try {
    if (isInitMessage(msg)) {
      await handleInit(msg);
    } else if (isSearchMessage(msg)) {
      await handleSearch(msg);
    } else if (isFilterMessage(msg)) {
      await handleFilter(msg);
    } else if (isIndexMessage(msg)) {
      await handleIndex(msg);
    } else if (isClearMessage(msg)) {
      handleClear();
    } else if (isPersistMessage(msg)) {
      await handlePersist();
    } else if (isLoadMessage(msg)) {
      await handleLoad();
    } else if (isStatsMessage(msg)) {
      handleStats();
    } else {
      sendError(`Unknown message type: ${(msg as IncomingMessage).type}`, 'UNKNOWN_MESSAGE');
    }
  } catch (error) {
    sendError('Worker error', 'WORKER_ERROR', error as Error);
  }
};

// Export types for testing
export type { Feature, SearchFilters, SearchResult };