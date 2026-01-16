/**
 * App Context - Global state management for Pipeline
 *
 * Manages:
 * - Vault state (path, files)
 * - Active file and editor state
 * - UI state (active layer, sidebar visibility)
 * - Settings
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { FileEntry, Layer, AppSettings, PipelineFile } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import {
  readDirectoryTree,
  readMarkdownFile,
  saveMarkdownFile,
  selectVaultFolder,
  buildWikiLinkIndex,
} from '../lib';

// State shape
interface AppState {
  // Vault
  vaultPath: string | null;
  files: FileEntry[];
  wikiLinkIndex: Map<string, string>;

  // Editor
  activeFile: PipelineFile | null;
  activeFilePath: string | null;
  openFiles: string[];
  unsavedChanges: Set<string>;

  // UI
  activeLayer: Layer;
  sidebarVisible: boolean;
  sidebarWidth: number;

  // Settings
  settings: AppSettings;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

// Actions
type AppAction =
  | { type: 'SET_VAULT'; payload: { path: string; files: FileEntry[] } }
  | { type: 'SET_FILES'; payload: FileEntry[] }
  | { type: 'SET_ACTIVE_FILE'; payload: { file: PipelineFile | null; path: string | null } }
  | { type: 'UPDATE_FILE_CONTENT'; payload: string }
  | { type: 'ADD_OPEN_FILE'; payload: string }
  | { type: 'REMOVE_OPEN_FILE'; payload: string }
  | { type: 'MARK_SAVED'; payload: string }
  | { type: 'MARK_UNSAVED'; payload: string }
  | { type: 'SET_LAYER'; payload: Layer }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: number }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_WIKI_LINK_INDEX'; payload: Map<string, string> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_FILE_EXPANDED'; payload: string };

// Initial state
const initialState: AppState = {
  vaultPath: null,
  files: [],
  wikiLinkIndex: new Map(),
  activeFile: null,
  activeFilePath: null,
  openFiles: [],
  unsavedChanges: new Set(),
  activeLayer: 'surface',
  sidebarVisible: true,
  sidebarWidth: 280,
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VAULT':
      return {
        ...state,
        vaultPath: action.payload.path,
        files: action.payload.files,
        settings: { ...state.settings, vaultPath: action.payload.path },
      };

    case 'SET_FILES':
      return { ...state, files: action.payload };

    case 'SET_ACTIVE_FILE':
      return {
        ...state,
        activeFile: action.payload.file,
        activeFilePath: action.payload.path,
      };

    case 'UPDATE_FILE_CONTENT':
      if (!state.activeFile) return state;
      return {
        ...state,
        activeFile: { ...state.activeFile, content: action.payload },
        unsavedChanges: new Set(state.unsavedChanges).add(state.activeFilePath!),
      };

    case 'ADD_OPEN_FILE':
      if (state.openFiles.includes(action.payload)) return state;
      return { ...state, openFiles: [...state.openFiles, action.payload] };

    case 'REMOVE_OPEN_FILE':
      return {
        ...state,
        openFiles: state.openFiles.filter((f) => f !== action.payload),
      };

    case 'MARK_SAVED': {
      const newUnsaved = new Set(state.unsavedChanges);
      newUnsaved.delete(action.payload);
      return { ...state, unsavedChanges: newUnsaved };
    }

    case 'MARK_UNSAVED':
      return {
        ...state,
        unsavedChanges: new Set(state.unsavedChanges).add(action.payload),
      };

    case 'SET_LAYER':
      return { ...state, activeLayer: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarVisible: !state.sidebarVisible };

    case 'SET_SIDEBAR_WIDTH':
      return { ...state, sidebarWidth: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SET_WIKI_LINK_INDEX':
      return { ...state, wikiLinkIndex: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'TOGGLE_FILE_EXPANDED': {
      const toggleExpanded = (entries: FileEntry[]): FileEntry[] =>
        entries.map((entry) => {
          if (entry.path === action.payload) {
            return { ...entry, expanded: !entry.expanded };
          }
          if (entry.children) {
            return { ...entry, children: toggleExpanded(entry.children) };
          }
          return entry;
        });
      return { ...state, files: toggleExpanded(state.files) };
    }

    default:
      return state;
  }
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  // Convenience actions
  openVault: () => Promise<void>;
  openFile: (path: string) => Promise<void>;
  saveCurrentFile: () => Promise<void>;
  createNewFile: (name: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Open vault folder
  const openVault = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const path = await selectVaultFolder();
      if (path) {
        const files = await readDirectoryTree(path);
        dispatch({ type: 'SET_VAULT', payload: { path, files } });

        // Build wiki link index
        const index = await buildWikiLinkIndex(path);
        dispatch({ type: 'SET_WIKI_LINK_INDEX', payload: index });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to open vault' });
      console.error(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Open a file
  const openFile = useCallback(async (path: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const file = await readMarkdownFile(path);
      if (file) {
        dispatch({ type: 'SET_ACTIVE_FILE', payload: { file, path } });
        dispatch({ type: 'ADD_OPEN_FILE', payload: path });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to open file' });
      console.error(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save current file
  const saveCurrentFile = useCallback(async () => {
    if (!state.activeFile || !state.activeFilePath) return;

    try {
      const { frontmatter, content } = state.activeFile;
      // Reconstruct the full file content with frontmatter
      const yaml = await import('yaml');
      const frontmatterYaml = yaml.stringify(frontmatter, { indent: 2, lineWidth: 0 });
      const fullContent = `---\n${frontmatterYaml}---\n\n${content}`;

      const success = await saveMarkdownFile(state.activeFilePath, fullContent);
      if (success) {
        dispatch({ type: 'MARK_SAVED', payload: state.activeFilePath });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save file' });
      console.error(error);
    }
  }, [state.activeFile, state.activeFilePath]);

  // Create new file
  const createNewFile = useCallback(
    async (name: string) => {
      if (!state.vaultPath) return;

      const filename = name.endsWith('.md') ? name : `${name}.md`;
      const path = `${state.vaultPath}/${filename}`;

      const { v4: uuidv4 } = await import('uuid');
      const now = new Date().toISOString();
      const initialContent = `---
uuid: ${uuidv4()}
type: note
title: ${name.replace('.md', '')}
created: ${now}
modified: ${now}
version: 1.0.0
status: draft
public: false
access_tier: owner
---

# ${name.replace('.md', '')}

`;

      try {
        const success = await saveMarkdownFile(path, initialContent);
        if (success) {
          await refreshFiles();
          await openFile(path);
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create file' });
        console.error(error);
      }
    },
    [state.vaultPath, openFile, refreshFiles]
  );

  // Refresh files
  const refreshFiles = useCallback(async () => {
    if (!state.vaultPath) return;

    try {
      const files = await readDirectoryTree(state.vaultPath);
      dispatch({ type: 'SET_FILES', payload: files });
    } catch (error) {
      console.error('Failed to refresh files:', error);
    }
  }, [state.vaultPath]);

  // Auto-save effect
  useEffect(() => {
    if (!state.settings.autoSave || state.unsavedChanges.size === 0) return;

    const timer = setTimeout(() => {
      saveCurrentFile();
    }, state.settings.autoSaveDelay);

    return () => clearTimeout(timer);
  }, [
    state.activeFile?.content,
    state.settings.autoSave,
    state.settings.autoSaveDelay,
    state.unsavedChanges.size,
    saveCurrentFile,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentFile]);

  const value: AppContextValue = {
    state,
    dispatch,
    openVault,
    openFile,
    saveCurrentFile,
    createNewFile,
    refreshFiles,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
