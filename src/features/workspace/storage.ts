/**
 * IndexedDB storage layer for workspace persistence
 * Handles bookmarks, annotations, and session data
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Bookmark, Annotation, WorkspaceSession, WorkspaceEvent } from './types';

interface WorkspaceDB extends DBSchema {
  bookmarks: {
    key: string;
    value: Bookmark;
    indexes: { 'by-feature': string; 'by-created': string };
  };
  annotations: {
    key: string;
    value: Annotation;
    indexes: { 'by-feature': string; 'by-created': string };
  };
  sessions: {
    key: string;
    value: WorkspaceSession;
    indexes: { 'by-updated': string };
  };
  events: {
    key: number;
    value: WorkspaceEvent;
    indexes: { 'by-timestamp': string };
  };
  metadata: {
    key: string;
    value: { version: number; lastMigration: string };
  };
}

const DB_NAME = 'sae-workspace';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<WorkspaceDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<WorkspaceDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<WorkspaceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Bookmarks store
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bookmarkStore.createIndex('by-feature', 'featureId');
        bookmarkStore.createIndex('by-created', 'createdAt');
      }

      // Annotations store
      if (!db.objectStoreNames.contains('annotations')) {
        const annotationStore = db.createObjectStore('annotations', { keyPath: 'id' });
        annotationStore.createIndex('by-feature', 'featureId');
        annotationStore.createIndex('by-created', 'createdAt');
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-updated', 'updatedAt');
      }

      // Events store (for audit trail)
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        eventStore.createIndex('by-timestamp', 'timestamp');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Bookmark operations
export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.add('bookmarks', bookmark);
  await logEvent('bookmark_added', bookmark);
}

export async function removeBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bookmarks', id);
  await logEvent('bookmark_removed', { id });
}

export async function getBookmark(id: string): Promise<Bookmark | undefined> {
  const db = await getDB();
  return db.get('bookmarks', id);
}

export async function getBookmarksByFeature(featureId: string): Promise<Bookmark[]> {
  const db = await getDB();
  return db.getAllFromIndex('bookmarks', 'by-feature', featureId);
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  return db.getAllFromIndex('bookmarks', 'by-created');
}

export async function updateBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put('bookmarks', bookmark);
}

// Annotation operations
export async function addAnnotation(annotation: Annotation): Promise<void> {
  const db = await getDB();
  await db.add('annotations', annotation);
  await logEvent('annotation_added', annotation);
}

export async function removeAnnotation(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('annotations', id);
  await logEvent('annotation_removed', { id });
}

export async function getAnnotation(id: string): Promise<Annotation | undefined> {
  const db = await getDB();
  return db.get('annotations', id);
}

export async function getAnnotationsByFeature(featureId: string): Promise<Annotation[]> {
  const db = await getDB();
  return db.getAllFromIndex('annotations', 'by-feature', featureId);
}

export async function getAllAnnotations(): Promise<Annotation[]> {
  const db = await getDB();
  return db.getAllFromIndex('annotations', 'by-created');
}

export async function updateAnnotation(annotation: Annotation): Promise<void> {
  const db = await getDB();
  const updated = { ...annotation, updatedAt: new Date().toISOString() };
  await db.put('annotations', updated);
  await logEvent('annotation_updated', updated);
}

// Session operations
export async function saveSession(session: WorkspaceSession): Promise<void> {
  const db = await getDB();
  const updated = { ...session, updatedAt: new Date().toISOString() };
  await db.put('sessions', updated);
  await logEvent('session_saved', { id: session.id });
}

export async function loadSession(id: string): Promise<WorkspaceSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getAllSessions(): Promise<WorkspaceSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-updated');
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function getLatestSession(): Promise<WorkspaceSession | undefined> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('sessions', 'by-updated');
  return sessions[sessions.length - 1];
}

// Event logging
async function logEvent(type: WorkspaceEvent['type'], payload: unknown): Promise<void> {
  const db = await getDB();
  const event: WorkspaceEvent = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
  await db.add('events', event);
}

export async function getEvents(limit = 100): Promise<WorkspaceEvent[]> {
  const db = await getDB();
  const events = await db.getAllFromIndex('events', 'by-timestamp');
  return events.slice(-limit).reverse();
}

// Utility functions
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('bookmarks');
  await db.clear('annotations');
  await db.clear('sessions');
  await db.clear('events');
}

export async function getStorageInfo(): Promise<{ bookmarks: number; annotations: number; sessions: number }> {
  const db = await getDB();
  const [bookmarks, annotations, sessions] = await Promise.all([
    db.count('bookmarks'),
    db.count('annotations'),
    db.count('sessions'),
  ]);
  return { bookmarks, annotations, sessions };
}

// Migration helpers
export async function setVersion(version: number): Promise<void> {
  const db = await getDB();
  await db.put('metadata', { key: 'version', value: { version, lastMigration: new Date().toISOString() } });
}

export async function getVersion(): Promise<number> {
  const db = await getDB();
  const meta = await db.get('metadata', 'version');
  return meta?.value?.version ?? 0;
}