/**
 * Workspace store using Zustand for client-side state management
 * Integrates with IndexedDB for persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Bookmark,
  Annotation,
  WorkspaceSession,
  WorkspaceEvent,
} from './types';
import {
  addBookmark,
  removeBookmark,
  getAllBookmarks,
  updateBookmark,
  addAnnotation,
  removeAnnotation,
  getAllAnnotations,
  updateAnnotation,
  saveSession,
  loadSession,
  getAllSessions,
  deleteSession,
  getLatestSession,
  getEvents,
  clearAllData,
} from './storage';

interface WorkspaceState {
  // Bookmarks
  bookmarks: Bookmark[];
  bookmarksLoaded: boolean;
  
  // Annotations
  annotations: Annotation[];
  annotationsLoaded: boolean;
  
  // Sessions
  sessions: WorkspaceSession[];
  currentSessionId: string | null;
  sessionsLoaded: boolean;
  
  // Events
  events: WorkspaceEvent[];
  
  // UI state
  isSidebarOpen: boolean;
  activeTab: 'bookmarks' | 'annotations' | 'sessions' | 'export';
  
  // Actions - Bookmarks
  loadBookmarks: () => Promise<void>;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => Promise<string>;
  removeBookmark: (id: string) => Promise<void>;
  toggleBookmark: (featureId: string, featureData: Bookmark['featureData']) => Promise<void>;
  isBookmarked: (featureId: string) => boolean;
  getBookmark: (featureId: string) => Bookmark | undefined;
  
  // Actions - Annotations
  loadAnnotations: () => Promise<void>;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  removeAnnotation: (id: string) => Promise<void>;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => Promise<void>;
  getAnnotations: (featureId: string) => Annotation[];
  
  // Actions - Sessions
  loadSessions: () => Promise<void>;
  saveCurrentSession: (session: Omit<WorkspaceSession, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  loadSession: (id: string) => Promise<WorkspaceSession | undefined>;
  deleteSession: (id: string) => Promise<void>;
  createNewSession: (name: string) => Promise<string>;
  setCurrentSession: (id: string | null) => void;
  autoSaveSession: (data: Partial<WorkspaceSession>) => Promise<void>;
  
  // Actions - Events
  loadEvents: () => Promise<void>;
  
  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: WorkspaceState['activeTab']) => void;
  
  // Utility
  clearAll: () => Promise<void>;
  exportData: () => Promise<{
    bookmarks: Bookmark[];
    annotations: Annotation[];
    sessions: WorkspaceSession[];
  }>;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      bookmarks: [],
      bookmarksLoaded: false,
      annotations: [],
      annotationsLoaded: false,
      sessions: [],
      currentSessionId: null,
      sessionsLoaded: false,
      events: [],
      isSidebarOpen: false,
      activeTab: 'bookmarks',
      
      // Bookmarks
      loadBookmarks: async () => {
        const bookmarks = await getAllBookmarks();
        set({ bookmarks, bookmarksLoaded: true });
      },
      
      addBookmark: async (bookmarkData) => {
        const id = generateId();
        const bookmark: Bookmark = {
          ...bookmarkData,
          id,
          createdAt: new Date().toISOString(),
        };
        await addBookmark(bookmark);
        set((state) => ({ bookmarks: [...state.bookmarks, bookmark] }));
        return id;
      },
      
      removeBookmark: async (id) => {
        await removeBookmark(id);
        set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) }));
      },
      
      toggleBookmark: async (featureId, featureData) => {
        const existing = get().bookmarks.find((b) => b.featureId === featureId);
        if (existing) {
          await get().removeBookmark(existing.id);
        } else {
          await get().addBookmark({ featureId, featureData, tags: [], notes: '' });
        }
      },
      
      isBookmarked: (featureId) => {
        return get().bookmarks.some((b) => b.featureId === featureId);
      },
      
      getBookmark: (featureId) => {
        return get().bookmarks.find((b) => b.featureId === featureId);
      },
      
      // Annotations
      loadAnnotations: async () => {
        const annotations = await getAllAnnotations();
        set({ annotations, annotationsLoaded: true });
      },
      
      addAnnotation: async (annotationData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const annotation: Annotation = {
          ...annotationData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        await addAnnotation(annotation);
        set((state) => ({ annotations: [...state.annotations, annotation] }));
        return id;
      },
      
      removeAnnotation: async (id) => {
        await removeAnnotation(id);
        set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) }));
      },
      
      updateAnnotation: async (id, updates) => {
        const annotation = get().annotations.find((a) => a.id === id);
        if (!annotation) return;
        
        const updated = { ...annotation, ...updates, updatedAt: new Date().toISOString() };
        await updateAnnotation(updated);
        set((state) => ({
          annotations: state.annotations.map((a) => (a.id === id ? updated : a)),
        }));
      },
      
      getAnnotations: (featureId) => {
        return get().annotations.filter((a) => a.featureId === featureId);
      },
      
      // Sessions
      loadSessions: async () => {
        const sessions = await getAllSessions();
        set({ sessions, sessionsLoaded: true });
        
        // Auto-load latest session if none selected
        if (!get().currentSessionId && sessions.length > 0) {
          const latest = sessions[sessions.length - 1];
          set({ currentSessionId: latest.id });
        }
      },
      
      saveCurrentSession: async (sessionData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const session: WorkspaceSession = {
          ...sessionData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        await saveSession(session);
        set((state) => ({ 
          sessions: [...state.sessions, session],
          currentSessionId: id,
        }));
        return id;
      },
      
      loadSession: async (id) => {
        const session = await loadSession(id);
        if (session) {
          set({ currentSessionId: id });
        }
        return session;
      },
      
      deleteSession: async (id) => {
        await deleteSession(id);
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
        }));
      },
      
      createNewSession: async (name) => {
        return get().saveCurrentSession({
          name,
          bookmarks: [],
          annotations: [],
          filters: {},
          selectedFeatureIds: [],
          comparisonFeatureIds: [],
        });
      },
      
      setCurrentSession: (id) => {
        set({ currentSessionId: id });
      },
      
      autoSaveSession: async (data) => {
        const currentId = get().currentSessionId;
        if (currentId) {
          const session = get().sessions.find((s) => s.id === currentId);
          if (session) {
            const updated = { ...session, ...data, updatedAt: new Date().toISOString() };
            await saveSession(updated);
            set((state) => ({
              sessions: state.sessions.map((s) => (s.id === currentId ? updated : s)),
            }));
          }
        } else {
          // Create new session
          await get().saveCurrentSession({
            name: `Session ${new Date().toLocaleString()}`,
            bookmarks: [],
            annotations: [],
            filters: {},
            selectedFeatureIds: [],
            comparisonFeatureIds: [],
            ...data,
          });
        }
      },
      
      // Events
      loadEvents: async () => {
        const events = await getEvents();
        set({ events });
      },
      
      // UI
      toggleSidebar: () => {
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
      },
      
      setSidebarOpen: (open) => {
        set({ isSidebarOpen: open });
      },
      
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },
      
      // Utility
      clearAll: async () => {
        await clearAllData();
        set({
          bookmarks: [],
          annotations: [],
          sessions: [],
          currentSessionId: null,
          events: [],
        });
      },
      
      exportData: async () => {
        return {
          bookmarks: get().bookmarks,
          annotations: get().annotations,
          sessions: get().sessions,
        };
      },
    }),
    {
      name: 'workspace-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        activeTab: state.activeTab,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

// Selectors for common use cases
export const useBookmarks = () => useWorkspaceStore((state) => state.bookmarks);
export const useAnnotations = () => useWorkspaceStore((state) => state.annotations);
export const useSessions = () => useWorkspaceStore((state) => state.sessions);
export const useCurrentSession = () => useWorkspaceStore((state) => 
  state.sessions.find((s) => s.id === state.currentSessionId) ?? null
);
export const useWorkspaceUI = () => useWorkspaceStore((state) => ({
  isSidebarOpen: state.isSidebarOpen,
  activeTab: state.activeTab,
  toggleSidebar: state.toggleSidebar,
  setSidebarOpen: state.setSidebarOpen,
  setActiveTab: state.setActiveTab,
}));