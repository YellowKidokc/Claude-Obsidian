/**
 * Markdown Editor Component
 *
 * The main editing surface for Layer 1 (Surface).
 * Features:
 * - Syntax highlighting for markdown
 * - Wiki-style [[link]] detection and rendering
 * - Real-time preview option
 * - Line numbers
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { useApp } from '../../store';

export function MarkdownEditor() {
  const { state, dispatch, openFile } = useApp();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const content = state.activeFile?.content ?? '';

  // Handle content changes
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: e.target.value });
    },
    [dispatch]
  );

  // Track cursor position
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return;

    const { selectionStart, value } = textareaRef.current;
    const textBefore = value.substring(0, selectionStart);
    const lines = textBefore.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    setCursorPosition({ line, column });
  }, []);

  // Handle wiki link clicks in preview (will be used in future preview mode)
  const _handleWikiLinkClick = useCallback(
    (linkText: string) => {
      const targetPath = state.wikiLinkIndex.get(linkText.toLowerCase());
      if (targetPath) {
        openFile(targetPath);
      }
    },
    [state.wikiLinkIndex, openFile]
  );
  void _handleWikiLinkClick; // Reserved for preview mode

  // Helper to wrap selection with characters
  const wrapSelection = useCallback(
    (
      textarea: HTMLTextAreaElement,
      before: string,
      after: string
    ) => {
      const { selectionStart, selectionEnd, value } = textarea;
      const selectedText = value.substring(selectionStart, selectionEnd);
      const newValue =
        value.substring(0, selectionStart) +
        before +
        selectedText +
        after +
        value.substring(selectionEnd);
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: newValue });

      setTimeout(() => {
        textarea.selectionStart = selectionStart + before.length;
        textarea.selectionEnd = selectionEnd + before.length;
        textarea.focus();
      }, 0);
    },
    [dispatch]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const { selectionStart, selectionEnd, value } = textarea;
        const newValue =
          value.substring(0, selectionStart) +
          '\t' +
          value.substring(selectionEnd);
        dispatch({ type: 'UPDATE_FILE_CONTENT', payload: newValue });

        // Reset cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }

      // Ctrl/Cmd + B for bold
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        wrapSelection(textarea, '**', '**');
      }

      // Ctrl/Cmd + I for italic
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        wrapSelection(textarea, '*', '*');
      }

      // Ctrl/Cmd + K for link
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        wrapSelection(textarea, '[[', ']]');
      }
    },
    [dispatch, wrapSelection]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  if (!state.activeFile) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[var(--editor-max-width)] mx-auto">
          {/* Title */}
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-6">
            {state.activeFile.frontmatter.title}
          </h1>

          {/* Metadata bar */}
          <div className="flex items-center gap-4 mb-6 text-sm text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <StatusBadge status={state.activeFile.frontmatter.status} />
            </span>
            {state.activeFile.frontmatter.confidence !== undefined && (
              <span>
                Confidence: {Math.round(state.activeFile.frontmatter.confidence * 100)}%
              </span>
            )}
            {state.activeFile.frontmatter.tags?.length ? (
              <div className="flex items-center gap-1">
                {state.activeFile.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[var(--color-bg-tertiary)] rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Editor */}
          <div className="relative">
            {state.settings.showLineNumbers && (
              <div className="absolute left-0 top-0 w-10 text-right pr-3 pt-0 select-none pointer-events-none">
                {content.split('\n').map((_, i) => (
                  <div
                    key={i}
                    className="text-sm leading-6 text-[var(--color-text-muted)] opacity-50"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleChange}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className={`
                w-full min-h-[60vh] bg-transparent resize-none focus:outline-none
                font-[var(--font-mono)] text-sm leading-6 text-[var(--color-text-primary)]
                ${state.settings.showLineNumbers ? 'pl-12' : ''}
              `}
              placeholder="Start writing..."
            />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-4">
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          <span>
            {content.split(/\s+/).filter(Boolean).length} words
          </span>
          <span>{content.length} chars</span>
        </div>
        <div className="flex items-center gap-4">
          <span>v{state.activeFile.frontmatter.version}</span>
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'bg-yellow-500/20 text-yellow-400',
    review: 'bg-blue-500/20 text-blue-400',
    canonical: 'bg-green-500/20 text-green-400',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status as keyof typeof colors] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}

// Empty state when no file is open
function EmptyState() {
  const { openVault } = useApp();

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 mb-6 text-[var(--color-text-muted)]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        No file selected
      </h2>
      <p className="text-[var(--color-text-muted)] mb-6 max-w-md">
        Select a file from the sidebar to start editing, or open a vault to browse your notes.
      </p>
      <button
        onClick={openVault}
        className="px-4 py-2 bg-[var(--color-gold-500)] text-[var(--color-bg-primary)] rounded font-medium hover:bg-[var(--color-gold-400)] transition-colors"
      >
        Open Vault
      </button>
      <div className="mt-8 text-sm text-[var(--color-text-muted)]">
        <p className="mb-2">Keyboard shortcuts:</p>
        <div className="flex flex-wrap justify-center gap-3">
          <kbd className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Ctrl+S</kbd>
          <span>Save</span>
          <kbd className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Ctrl+B</kbd>
          <span>Bold</span>
          <kbd className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Ctrl+K</kbd>
          <span>Wiki link</span>
        </div>
      </div>
    </div>
  );
}
