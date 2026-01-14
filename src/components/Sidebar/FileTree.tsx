/**
 * FileTree Component
 *
 * Renders the file browser tree in the sidebar.
 * Supports expanding/collapsing directories and opening files.
 */

import { useCallback } from 'react';
import { useApp } from '../../store';
import type { FileEntry } from '../../types';

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
}

function FileTreeItem({ entry, depth }: FileTreeItemProps) {
  const { state, dispatch, openFile } = useApp();
  const isActive = state.activeFilePath === entry.path;
  const isUnsaved = state.unsavedChanges.has(entry.path);

  const handleClick = useCallback(() => {
    if (entry.isDirectory) {
      dispatch({ type: 'TOGGLE_FILE_EXPANDED', payload: entry.path });
    } else {
      openFile(entry.path);
    }
  }, [entry, dispatch, openFile]);

  const paddingLeft = 12 + depth * 16;

  return (
    <>
      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 cursor-pointer select-none
          hover:bg-[var(--color-bg-tertiary)] transition-colors duration-100
          ${isActive ? 'bg-[var(--color-bg-elevated)] text-[var(--color-gold-400)]' : ''}
        `}
        style={{ paddingLeft }}
        onClick={handleClick}
      >
        {/* Icon */}
        <span className="w-4 h-4 flex items-center justify-center text-[var(--color-text-muted)]">
          {entry.isDirectory ? (
            entry.expanded ? (
              <ChevronDownIcon />
            ) : (
              <ChevronRightIcon />
            )
          ) : (
            <FileIcon />
          )}
        </span>

        {/* Name */}
        <span className="flex-1 truncate text-sm">
          {entry.name.replace('.md', '')}
        </span>

        {/* Unsaved indicator */}
        {isUnsaved && (
          <span className="w-2 h-2 rounded-full bg-[var(--color-gold-500)]" />
        )}
      </div>

      {/* Children */}
      {entry.isDirectory && entry.expanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeItem key={child.path} entry={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  );
}

// Simple SVG icons
function ChevronRightIcon() {
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
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronDownIcon() {
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
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FileIcon() {
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
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// Main FileTree component
export function FileTree() {
  const { state } = useApp();

  if (state.files.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--color-text-muted)]">
        No files found
      </div>
    );
  }

  return (
    <div className="py-2">
      {state.files.map((entry) => (
        <FileTreeItem key={entry.path} entry={entry} depth={0} />
      ))}
    </div>
  );
}
