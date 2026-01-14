/**
 * Block Renderer Component
 *
 * The main component that renders a block based on its type.
 * Handles block selection, editing, and type switching.
 */

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from 'react';
import type { Block, BlockType } from '../../types';
import { createBlock, getBlockTypeInfo } from '../../types/blocks';
import { TextBlockComponent } from './TextBlock';
import { HeadingBlockComponent } from './HeadingBlock';
import { CodeBlockComponent } from './CodeBlock';
import { TodoBlockComponent } from './TodoBlock';
import { QuoteBlockComponent } from './QuoteBlock';
import { DividerBlockComponent } from './DividerBlock';
import { DatabaseBlockComponent } from './DatabaseBlock';
import { FormulaBlockComponent } from './FormulaBlock';
import { TableBlockComponent } from './TableBlock';
import { CalloutBlockComponent } from './CalloutBlock';

interface BlockRendererProps {
  block: Block;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onInsertAfter: (id: string, block: Block) => void;
  onInsertBefore: (id: string, block: Block) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onTypeChange: (id: string, newType: BlockType) => void;
}

export function BlockRenderer({
  block,
  index,
  isSelected,
  onSelect,
  onChange,
  onDelete,
  onInsertAfter,
  onInsertBefore,
  onMoveUp,
  onMoveDown,
  onTypeChange,
}: BlockRendererProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const blockRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (blockRef.current && !blockRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowTypeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Enter at end of block -> create new block after
      if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
        e.preventDefault();
        onInsertAfter(block.id, createBlock('text'));
      }

      // Backspace at start of empty block -> delete block
      if (e.key === 'Backspace' && block.content === '' && block.type !== 'database') {
        e.preventDefault();
        onDelete(block.id);
      }

      // Cmd/Ctrl + Shift + Up/Down -> move block
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onMoveUp(block.id);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onMoveDown(block.id);
        }
      }

      // / at start of block -> show type menu
      if (e.key === '/' && block.content === '') {
        e.preventDefault();
        setShowTypeMenu(true);
      }
    },
    [block, onInsertAfter, onDelete, onMoveUp, onMoveDown]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      onChange(block.id, { content });
    },
    [block.id, onChange]
  );

  const renderBlockContent = () => {
    const commonProps = {
      block,
      onChange: handleContentChange,
      onKeyDown: handleKeyDown,
      isSelected,
    };

    switch (block.type) {
      case 'text':
        return <TextBlockComponent {...commonProps} />;

      case 'heading1':
      case 'heading2':
      case 'heading3':
        return <HeadingBlockComponent {...commonProps} level={parseInt(block.type.slice(-1)) as 1 | 2 | 3} />;

      case 'code':
        return (
          <CodeBlockComponent
            {...commonProps}
            language={(block as any).language ?? 'plaintext'}
            onLanguageChange={(lang) => onChange(block.id, { language: lang } as any)}
          />
        );

      case 'todo':
        return (
          <TodoBlockComponent
            {...commonProps}
            checked={(block as any).checked ?? false}
            onCheckedChange={(checked) => onChange(block.id, { checked } as any)}
          />
        );

      case 'quote':
        return <QuoteBlockComponent {...commonProps} />;

      case 'divider':
        return <DividerBlockComponent />;

      case 'database':
        return (
          <DatabaseBlockComponent
            block={block as any}
            onChange={(updates) => onChange(block.id, updates)}
          />
        );

      case 'formula':
        return (
          <FormulaBlockComponent
            block={block as any}
            onChange={(updates) => onChange(block.id, updates)}
          />
        );

      case 'table':
        return (
          <TableBlockComponent
            block={block as any}
            onChange={(updates) => onChange(block.id, updates)}
          />
        );

      case 'callout':
        return (
          <CalloutBlockComponent
            {...commonProps}
            calloutType={(block as any).calloutType ?? 'info'}
            onTypeChange={(type) => onChange(block.id, { calloutType: type } as any)}
          />
        );

      case 'bulleted_list':
      case 'numbered_list':
        return (
          <div className="flex items-start gap-2">
            <span className="text-[var(--color-text-muted)] select-none w-6 text-right">
              {block.type === 'numbered_list' ? `${index + 1}.` : '•'}
            </span>
            <TextBlockComponent {...commonProps} />
          </div>
        );

      default:
        return <TextBlockComponent {...commonProps} />;
    }
  };

  return (
    <div
      ref={blockRef}
      className={`
        group relative py-1 px-2 -mx-2 rounded transition-colors
        ${isSelected ? 'bg-[var(--color-bg-elevated)]' : 'hover:bg-[var(--color-bg-secondary)]'}
      `}
      onClick={() => onSelect(block.id)}
    >
      {/* Block handle and menu */}
      <div
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2
          flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity
        `}
      >
        {/* Drag handle */}
        <button
          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-grab"
          title="Drag to reorder"
        >
          <GripIcon />
        </button>

        {/* Add block / Menu */}
        <button
          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          title="Add block or options"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Block content */}
      {renderBlockContent()}

      {/* Block menu */}
      {showMenu && (
        <BlockMenu
          onClose={() => setShowMenu(false)}
          onDelete={() => {
            onDelete(block.id);
            setShowMenu(false);
          }}
          onInsertAbove={() => {
            onInsertBefore(block.id, createBlock('text'));
            setShowMenu(false);
          }}
          onInsertBelow={() => {
            onInsertAfter(block.id, createBlock('text'));
            setShowMenu(false);
          }}
          onChangeType={() => {
            setShowMenu(false);
            setShowTypeMenu(true);
          }}
          onMoveUp={() => {
            onMoveUp(block.id);
            setShowMenu(false);
          }}
          onMoveDown={() => {
            onMoveDown(block.id);
            setShowMenu(false);
          }}
        />
      )}

      {/* Type selection menu */}
      {showTypeMenu && (
        <BlockTypeMenu
          currentType={block.type}
          onSelect={(type) => {
            onTypeChange(block.id, type);
            setShowTypeMenu(false);
          }}
          onClose={() => setShowTypeMenu(false)}
        />
      )}
    </div>
  );
}

// Block menu component
function BlockMenu({
  onDelete,
  onInsertAbove,
  onInsertBelow,
  onChangeType,
  onMoveUp,
  onMoveDown,
}: {
  onClose: () => void;
  onDelete: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onChangeType: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="absolute left-0 top-full mt-1 z-50 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-lg py-1 min-w-[180px]">
      <MenuItem icon={<PlusIcon />} label="Insert above" onClick={onInsertAbove} />
      <MenuItem icon={<PlusIcon />} label="Insert below" onClick={onInsertBelow} />
      <div className="h-px bg-[var(--color-border-default)] my-1" />
      <MenuItem icon={<TypeIcon />} label="Change type" onClick={onChangeType} shortcut="/" />
      <div className="h-px bg-[var(--color-border-default)] my-1" />
      <MenuItem icon={<ArrowUpIcon />} label="Move up" onClick={onMoveUp} shortcut="⌘⇧↑" />
      <MenuItem icon={<ArrowDownIcon />} label="Move down" onClick={onMoveDown} shortcut="⌘⇧↓" />
      <div className="h-px bg-[var(--color-border-default)] my-1" />
      <MenuItem icon={<TrashIcon />} label="Delete" onClick={onDelete} className="text-red-400" />
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  shortcut,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  shortcut?: string;
  className?: string;
}) {
  return (
    <button
      className={`w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[var(--color-bg-tertiary)] text-sm ${className}`}
      onClick={onClick}
    >
      <span className="w-4 h-4 text-[var(--color-text-muted)]">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-xs text-[var(--color-text-muted)]">{shortcut}</span>
      )}
    </button>
  );
}

// Block type menu
function BlockTypeMenu({
  currentType,
  onSelect,
}: {
  currentType: BlockType;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const blockTypes: BlockType[] = [
    'text',
    'heading1',
    'heading2',
    'heading3',
    'bulleted_list',
    'numbered_list',
    'todo',
    'toggle',
    'code',
    'quote',
    'callout',
    'divider',
    'table',
    'database',
    'formula',
  ];

  const filteredTypes = blockTypes.filter((type) => {
    const info = getBlockTypeInfo(type);
    return info.label.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="absolute left-0 top-full mt-1 z-50 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-lg py-1 min-w-[220px] max-h-[300px] overflow-y-auto">
      <div className="px-2 pb-2 pt-1">
        <input
          type="text"
          placeholder="Search block types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] rounded focus:outline-none focus:border-[var(--color-gold-500)]"
          autoFocus
        />
      </div>
      {filteredTypes.map((type) => {
        const info = getBlockTypeInfo(type);
        return (
          <button
            key={type}
            className={`w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[var(--color-bg-tertiary)] text-sm ${
              type === currentType ? 'bg-[var(--color-bg-tertiary)]' : ''
            }`}
            onClick={() => onSelect(type)}
          >
            <span className="w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)]">
              <BlockTypeIcon type={type} />
            </span>
            <span className="flex-1 text-left">{info.label}</span>
            {info.shortcut && (
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                {info.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function BlockTypeIcon({ type }: { type: BlockType }) {
  switch (type) {
    case 'heading1':
    case 'heading2':
    case 'heading3':
      return <span className="font-bold text-xs">H{type.slice(-1)}</span>;
    case 'bulleted_list':
      return <span>•</span>;
    case 'numbered_list':
      return <span>1.</span>;
    case 'todo':
      return <CheckSquareIcon />;
    case 'code':
      return <CodeIcon />;
    case 'quote':
      return <QuoteIcon />;
    case 'divider':
      return <MinusIcon />;
    case 'table':
      return <TableIcon />;
    case 'database':
      return <DatabaseIcon />;
    case 'formula':
      return <FunctionIcon />;
    case 'callout':
      return <AlertIcon />;
    default:
      return <TypeIcon />;
  }
}

// Icons
function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="15" cy="5" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="15" cy="19" r="1.5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckSquareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function FunctionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2z" />
      <path d="M9 8h6M12 8v8M8 12h8" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
