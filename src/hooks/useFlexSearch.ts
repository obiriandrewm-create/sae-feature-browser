/**
 * useFlexSearch hook - Web Worker communication for FlexSearch
 * Provides type-safe search, filtering, and index management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Feature, SearchFilters, SearchResult } from '@/types/sae';
import type {
  IncomingMessage,
  OutgoingMessage,
  InitPayload,
  ReadyPayload,
  ResultPayload,
  ProgressPayload,
  ErrorPayload,
  StatsResult,
} from '@/types/flexsearch';
import {
  createMessage,
  isProgressMessage,
  isReadyMessage,
  isResultMessage,
  isErrorMessage,
} from '@/types/flexsearch';

interface UseFlexSearchOptions {
  autoInit?: boolean;
  onReady?: (indexedCount: number) => void;
  onError?: (error: ErrorPayload) => void;
  onProgress?: (progress: ProgressPayload) => void;
}

interface UseFlexSearchReturn {
  // State
  isReady: boolean;
  isIndexing: boolean;
  isSearching: boolean;
  indexedCount: number;
  indexSize: number;
  lastSearchTime: number;
  error: ErrorPayload | null;

  // Actions
  init: (features: Feature[], options?: InitPayload['options']) => Promise<void>;
  search: (query: string, filters?: SearchFilters, limit?: number, offset?: number) => Promise<SearchResult>;
  filter: (filters: SearchFilters, limit?: number, offset?: number) => Promise<SearchResult>;
  addFeatures: (features: Feature[]) => Promise<void>;
  clear: () => void;
  persist: () => Promise<void>;
  load: () => Promise<void>;
  getStats: () => Promise<StatsResult>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useFlexSearch(options: UseFlexSearchOptions = {}): UseFlexSearchReturn {
  const { autoInit = false, onReady, onError, onProgress } = options;

  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [indexedCount, setIndexedCount] = useState(0);
  const [indexSize, setIndexSize] = useState(0);
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [error, setError] = useState<ErrorPayload | null>(null);

  // Initialize worker
  useEffect(() => {
    // Create worker
    const worker = new Worker(new URL('../lib/flexsearch-worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    // Handle messages from worker
    worker.onmessage = (event: MessageEvent<OutgoingMessage>) => {
      const msg = event.data;

      // Handle progress updates
      if (isProgressMessage(msg)) {
        onProgress?.(msg.payload);
        if (msg.payload.phase === 'indexing') {
          setIsIndexing(true);
        }
        return;
      }

      // Handle ready state
      if (isReadyMessage(msg)) {
        setIsReady(true);
        setIsIndexing(false);
        setIndexedCount(msg.payload.indexedCount);
        setIndexSize(msg.payload.indexSize);
        onReady?.(msg.payload.indexedCount);

        // Resolve any pending init/load request
        const pending = pendingRequests.current.get(msg.id);
        if (pending) {
          pending.resolve(msg.payload);
          pendingRequests.current.delete(msg.id);
        }
        return;
      }

      // Handle search/filter results
      if (isResultMessage(msg)) {
        setIsSearching(false);
        setLastSearchTime(msg.payload.searchTimeMs);

        const pending = pendingRequests.current.get(msg.id);
        if (pending) {
          if ('results' in msg.payload) {
            pending.resolve(msg.payload.results);
          } else {
            pending.resolve(msg.payload);
          }
          pendingRequests.current.delete(msg.id);
        }
        return;
      }

      // Handle errors
      if (isErrorMessage(msg)) {
        setIsIndexing(false);
        setIsSearching(false);
        setError(msg.payload);
        onError?.(msg.payload);

        const pending = pendingRequests.current.get(msg.id);
        if (pending) {
          pending.reject(new Error(msg.payload.message));
          pendingRequests.current.delete(msg.id);
        }
        return;
      }
    };

    worker.onerror = (err) => {
      const errorPayload: ErrorPayload = {
        message: err.message || 'Worker error',
        code: 'WORKER_ERROR',
        originalError: err.message,
      };
      setError(errorPayload);
      onError?.(errorPayload);
    };

    // Cleanup
    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingRequests.current.clear();
    };
  }, [onReady, onError, onProgress]);

  // Send message to worker with promise
  const sendMessage = useCallback(<T,>(payload: IncomingMessage['payload'], type: IncomingMessage['type']): Promise<T> => {
    const worker = workerRef.current;
    if (!worker) {
      return Promise.reject(new Error('Worker not initialized'));
    }

    const id = generateId();
    const message = createMessage(type, payload, id);

    return new Promise((resolve, reject) => {
      pendingRequests.current.set(id, { resolve: resolve as (value: unknown) => void, reject });
      worker.postMessage(message);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequests.current.has(id)) {
          pendingRequests.current.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }, []);

  // Initialize index with features
  const init = useCallback(async (features: Feature[], initOptions?: InitPayload['options']): Promise<void> => {
    setIsIndexing(true);
    setError(null);
    await sendMessage<ReadyPayload>({ features, options: initOptions }, 'init');
  }, [sendMessage]);

  // Search with query and optional filters
  const search = useCallback(async (
    query: string,
    filters?: SearchFilters,
    limit = 100,
    offset = 0
  ): Promise<SearchResult> => {
    setIsSearching(true);
    setError(null);
    return sendMessage<SearchResult>({ query, filters, limit, offset }, 'search');
  }, [sendMessage]);

  // Filter without query (faceted search)
  const filter = useCallback(async (
    filters: SearchFilters,
    limit = 100,
    offset = 0
  ): Promise<SearchResult> => {
    setIsSearching(true);
    setError(null);
    return sendMessage<SearchResult>({ filters, limit, offset }, 'filter');
  }, [sendMessage]);

  // Add more features to existing index
  const addFeatures = useCallback(async (newFeatures: Feature[]): Promise<void> => {
    setIsIndexing(true);
    setError(null);
    await sendMessage<ReadyPayload>({ features: newFeatures }, 'index');
  }, [sendMessage]);

  // Clear index
  const clear = useCallback((): void => {
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage(createMessage('clear', {}));
    }
    setIsReady(false);
    setIndexedCount(0);
    setIndexSize(0);
  }, []);

  // Persist index to IndexedDB
  const persist = useCallback(async (): Promise<void> => {
    setError(null);
    await sendMessage<SearchResult>({}, 'persistIndex');
  }, [sendMessage]);

  // Load index from IndexedDB
  const load = useCallback(async (): Promise<void> => {
    setIsIndexing(true);
    setError(null);
    await sendMessage<ReadyPayload>({}, 'loadIndex');
  }, [sendMessage]);

  // Get index stats
  const getStats = useCallback(async (): Promise<StatsResult> => {
    return sendMessage<StatsResult>({}, 'getStats');
  }, [sendMessage]);

  return {
    isReady,
    isIndexing,
    isSearching,
    indexedCount,
    indexSize,
    lastSearchTime,
    error,
    init,
    search,
    filter,
    addFeatures,
    clear,
    persist,
    load,
    getStats,
  };
}

// Re-export types
export type { Feature, SearchFilters, SearchResult };