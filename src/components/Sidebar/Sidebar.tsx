/**
 * Sidebar Component
 *
 * Main sidebar containing:
 * - Vault selector
 * - File tree
 * - Search
 * - Quick actions
 */

import { useState, useCallback } from 'react';
import { useApp } from '../../store';
import { FileTree } from './FileTree';

export function Sidebar() {
  const { state, openVault, createNewFile, refreshFiles } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateFile = useCallback(async () => {
    if (!newFileName.trim()) return;
    await createNewFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  }, [newFileName, createNewFile]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCreateFile();
      } else if (e.key === 'Escape') {
        setIsCreating(false);
        setNewFileName('');
      }
    },
    [handleCreateFile]
  );

  return (
    <div
      className="h-full flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-default)]"
      style={{ width: state.sidebarWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-default)]">
        <span className="font-semibold text-sm text-[var(--color-gold-400)]">
          {state.vaultPath ? state.vaultPath.split('/').pop() : 'Pipeline'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={refreshFiles}
            className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            title="Refresh"
          >
            <RefreshIcon />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            title="New file"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-[var(--color-border-default)]">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-[var(--color-bg-tertiary)] border border-transparent rounded focus:border-[var(--color-gold-500)] focus:outline-none placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>

      {/* New file input */}
      {isCreating && (
        <div className="p-2 border-b border-[var(--color-border-default)]">
          <input
            type="text"
            placeholder="New file name..."
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => !newFileName && setIsCreating(false)}
            autoFocus
            className="w-full px-3 py-1.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-gold-500)] rounded focus:outline-none"
          />
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto">
        {state.vaultPath ? (
          <FileTree />
        ) : (
          <div className="p-4 flex flex-col items-center gap-4 text-center">
            <div className="text-[var(--color-text-muted)] text-sm">
              Open a vault to get started
            </div>
            <button
              onClick={openVault}
              className="px-4 py-2 bg-[var(--color-gold-500)] text-[var(--color-bg-primary)] rounded font-medium text-sm hover:bg-[var(--color-gold-400)] transition-colors"
            >
              Open Vault
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
        {state.files.length > 0 && (
          <span>
            {countFiles(state.files)} files
          </span>
        )}
      </div>
    </div>
  );
}

// Count total markdown files
function countFiles(entries: import('../../types').FileEntry[]): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory && entry.children) {
      count += countFiles(entry.children);
    } else if (entry.name.endsWith('.md')) {
      count++;
    }
  }
  return count;
}

// Icons
function RefreshIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
