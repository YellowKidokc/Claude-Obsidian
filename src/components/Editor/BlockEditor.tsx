/**
 * Block Editor Component
 *
 * The main block-based editing surface.
 * Manages a list of blocks with CRUD operations.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Block, BlockType } from '../../types';
import { parseMarkdownToBlocks, blocksToMarkdown, createBlock } from '../../types/blocks';
import { BlockRenderer } from '../Blocks';
import { useApp } from '../../store';

export function BlockEditor() {
  const { state, dispatch } = useApp();

  // Parse content into blocks
  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (!state.activeFile?.content) return [createBlock('text')];
    return parseMarkdownToBlocks(state.activeFile.content);
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Re-parse when file changes
  useEffect(() => {
    if (state.activeFile?.content) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBlocks(parseMarkdownToBlocks(state.activeFile.content));
    } else {
      setBlocks([createBlock('text')]);
    }
  }, [state.activeFilePath, state.activeFile?.content]);

  // Sync blocks back to content
  const syncToContent = useCallback(
    (newBlocks: Block[]) => {
      const markdown = blocksToMarkdown(newBlocks);
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: markdown });
    },
    [dispatch]
  );

  // Update blocks and sync
  const updateBlocks = useCallback(
    (newBlocks: Block[]) => {
      setBlocks(newBlocks);
      syncToContent(newBlocks);
    },
    [syncToContent]
  );

  // Block operations
  const handleBlockChange = useCallback(
    (id: string, updates: Partial<Block>) => {
      const newBlocks = blocks.map((b) =>
        b.id === id ? ({ ...b, ...updates } as Block) : b
      );
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks]
  );

  const handleBlockDelete = useCallback(
    (id: string) => {
      if (blocks.length <= 1) {
        // Don't delete last block, just clear it
        updateBlocks([createBlock('text')]);
        return;
      }
      const newBlocks = blocks.filter((b) => b.id !== id);
      updateBlocks(newBlocks);

      // Select previous block
      const index = blocks.findIndex((b) => b.id === id);
      if (index > 0) {
        setSelectedBlockId(blocks[index - 1].id);
      }
    },
    [blocks, updateBlocks]
  );

  const handleInsertAfter = useCallback(
    (id: string, newBlock: Block) => {
      const index = blocks.findIndex((b) => b.id === id);
      const newBlocks = [
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1),
      ];
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
    },
    [blocks, updateBlocks]
  );

  const handleInsertBefore = useCallback(
    (id: string, newBlock: Block) => {
      const index = blocks.findIndex((b) => b.id === id);
      const newBlocks = [
        ...blocks.slice(0, index),
        newBlock,
        ...blocks.slice(index),
      ];
      updateBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
    },
    [blocks, updateBlocks]
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index <= 0) return;

      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks]
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      const index = blocks.findIndex((b) => b.id === id);
      if (index >= blocks.length - 1) return;

      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks]
  );

  const handleTypeChange = useCallback(
    (id: string, newType: BlockType) => {
      const block = blocks.find((b) => b.id === id);
      if (!block) return;

      const newBlock = createBlock(newType, block.content);
      newBlock.id = id; // Keep same ID

      const newBlocks = blocks.map((b) => (b.id === id ? newBlock : b));
      updateBlocks(newBlocks);
    },
    [blocks, updateBlocks]
  );

  // Keyboard navigation between blocks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedBlockId) return;

      const index = blocks.findIndex((b) => b.id === selectedBlockId);

      // Arrow up - select previous block
      if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        if (index > 0) {
          setSelectedBlockId(blocks[index - 1].id);
        }
      }

      // Arrow down - select next block
      if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        if (index < blocks.length - 1) {
          setSelectedBlockId(blocks[index + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, selectedBlockId]);

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
            <StatusBadge status={state.activeFile.frontmatter.status} />
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

          {/* Blocks */}
          <div className="space-y-1 pl-8">
            {blocks.map((block, index) => (
              <BlockRenderer
                key={block.id}
                block={block}
                index={index}
                isSelected={selectedBlockId === block.id}
                onSelect={setSelectedBlockId}
                onChange={handleBlockChange}
                onDelete={handleBlockDelete}
                onInsertAfter={handleInsertAfter}
                onInsertBefore={handleInsertBefore}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onTypeChange={handleTypeChange}
              />
            ))}
          </div>

          {/* Add block button */}
          <button
            className="mt-4 ml-8 flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={() => {
              const newBlock = createBlock('text');
              updateBlocks([...blocks, newBlock]);
              setSelectedBlockId(newBlock.id);
            }}
          >
            <span className="text-lg">+</span>
            <span>Add a block</span>
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-4">
          <span>{blocks.length} blocks</span>
          <span>
            {blocksToMarkdown(blocks).split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>v{state.activeFile.frontmatter.version}</span>
          <span>Block Editor</span>
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
        <p className="mb-2">Block types:</p>
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Text</span>
          <span className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Headings</span>
          <span className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Code</span>
          <span className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Database</span>
          <span className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Formula</span>
          <span className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">Table</span>
        </div>
      </div>
    </div>
  );
}
