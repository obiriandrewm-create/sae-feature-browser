/**
 * FlexSearch Web Worker message types
 * Type-safe communication between main thread and search worker
 */

import type { Feature, SearchFilters, SearchResult } from '@/types/sae';

// Worker message types
export type WorkerMessageType =
  | 'init'
  | 'index'
  | 'search'
  | 'filter'
  | 'clear'
  | 'getStats'
  | 'persistIndex'
  | 'loadIndex'
  | 'error'
  | 'ready'
  | 'progress'
  | 'result';

export interface WorkerMessage<T = unknown> {
  type: WorkerMessageType;
  id: string;
  payload: T;
}

export interface InitPayload {
  features: Feature[];
  options?: FlexSearchOptions;
}

export interface FlexSearchOptions {
  tokenize?: 'strict' | 'forward' | 'reverse' | ((str: string) => string[]);
  resolution?: number;
  depth?: number;
  minlength?: number;
  maxlen?: number;
  split?: string | RegExp;
  charset?: string;
  optimize?: boolean;
  context?: boolean;
  suggest?: boolean;
  profile?: 'score' | 'match' | 'balanced';
}

export interface SearchPayload {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  profile?: 'score' | 'match' | 'balanced';
}

export interface FilterPayload {
  filters: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface IndexPayload {
  features: Feature[];
}

export interface ClearPayload {
  // Empty payload
}

export interface PersistPayload {
  // Empty payload - uses IndexedDB
}

export interface LoadPayload {
  // Empty payload - loads from IndexedDB
}

export interface StatsPayload {
  // Empty payload
}

export interface ReadyPayload {
  indexedCount: number;
  indexSize: number;
}

export interface ProgressPayload {
  phase: 'indexing' | 'persisting' | 'loading';
  processed: number;
  total: number;
  percentage: number;
}

export interface ResultPayload {
  results: SearchResult;
  searchTimeMs: number;
}

export interface ErrorPayload {
  message: string;
  code: string;
  originalError?: string;
}

export interface StatsResult {
  indexedCount: number;
  indexSize: number;
  memoryUsage: number;
}

// Incoming messages (from main thread to worker)
export type IncomingMessage =
  | WorkerMessage<InitPayload>
  | WorkerMessage<SearchPayload>
  | WorkerMessage<FilterPayload>
  | WorkerMessage<IndexPayload>
  | WorkerMessage<ClearPayload>
  | WorkerMessage<PersistPayload>
  | WorkerMessage<LoadPayload>
  | WorkerMessage<StatsPayload>;

// Outgoing messages (from worker to main thread)
export type OutgoingMessage =
  | WorkerMessage<ReadyPayload>
  | WorkerMessage<ResultPayload>
  | WorkerMessage<ProgressPayload>
  | WorkerMessage<ErrorPayload>
  | WorkerMessage<StatsResult>;

// Message type guards
export function isInitMessage(msg: IncomingMessage): msg is WorkerMessage<InitPayload> {
  return msg.type === 'init';
}

export function isSearchMessage(msg: IncomingMessage): msg is WorkerMessage<SearchPayload> {
  return msg.type === 'search';
}

export function isFilterMessage(msg: IncomingMessage): msg is WorkerMessage<FilterPayload> {
  return msg.type === 'filter';
}

export function isIndexMessage(msg: IncomingMessage): msg is WorkerMessage<IndexPayload> {
  return msg.type === 'index';
}

export function isClearMessage(msg: IncomingMessage): msg is WorkerMessage<ClearPayload> {
  return msg.type === 'clear';
}

export function isPersistMessage(msg: IncomingMessage): msg is WorkerMessage<PersistPayload> {
  return msg.type === 'persistIndex';
}

export function isLoadMessage(msg: IncomingMessage): msg is WorkerMessage<LoadPayload> {
  return msg.type === 'loadIndex';
}

export function isStatsMessage(msg: IncomingMessage): msg is WorkerMessage<StatsPayload> {
  return msg.type === 'getStats';
}

// Response type guards
export function isReadyMessage(msg: OutgoingMessage): msg is WorkerMessage<ReadyPayload> {
  return msg.type === 'ready';
}

export function isResultMessage(msg: OutgoingMessage): msg is WorkerMessage<ResultPayload> {
  return msg.type === 'result';
}

export function isProgressMessage(msg: OutgoingMessage): msg is WorkerMessage<ProgressPayload> {
  return msg.type === 'progress';
}

export function isErrorMessage(msg: OutgoingMessage): msg is WorkerMessage<ErrorPayload> {
  return msg.type === 'error';
}

export function isStatsResultMessage(msg: OutgoingMessage): msg is WorkerMessage<StatsResult> {
  return msg.type === 'result' && 'indexedCount' in msg.payload;
}

// Helper to create messages
export function createMessage<T>(type: WorkerMessageType, payload: T, id?: string): WorkerMessage<T> {
  return {
    type,
    id: id || crypto.randomUUID(),
    payload,
  };
}

// IndexedDB schema for persisted index
export interface PersistedIndex {
  version: number;
  createdAt: string;
  featureCount: number;
  indexData: string; // Serialized FlexSearch index
  features: Feature[]; // Store features for filtering
}