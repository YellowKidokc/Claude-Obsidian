/**
 * Pipeline Types - Central export for all type definitions
 */

export * from './node';

// Layer types for the 4-layer architecture
export type Layer = 'surface' | 'structure' | 'logic' | 'ai';

export interface LayerConfig {
  id: Layer;
  name: string;
  icon: string;
  description: string;
}

export const LAYERS: LayerConfig[] = [
  {
    id: 'surface',
    name: 'Surface',
    icon: 'file-text',
    description: 'Markdown view - what you see and type',
  },
  {
    id: 'structure',
    name: 'Structure',
    icon: 'layout',
    description: 'Navigation - pages within pages, embeds, backlinks',
  },
  {
    id: 'logic',
    name: 'Logic',
    icon: 'cpu',
    description: 'Computation - SQL queries, automations, formulas',
  },
  {
    id: 'ai',
    name: 'AI',
    icon: 'bot',
    description: 'Intelligence - AI assistance, suggestions, analysis',
  },
];

// File system types
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileEntry[];
  expanded?: boolean;
  modified?: Date;
}

// Editor state
export interface EditorState {
  activeFile: string | null;
  openFiles: string[];
  unsavedChanges: Set<string>;
  cursorPosition: { line: number; column: number };
}

// App settings
export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  vaultPath: string | null;
  fontSize: number;
  vimMode: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  showLineNumbers: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  vaultPath: null,
  fontSize: 14,
  vimMode: false,
  autoSave: true,
  autoSaveDelay: 1000,
  showLineNumbers: true,
};
