/**
 * Callout Block Component
 *
 * Styled alert/note boxes with different types.
 */

import { useRef, useEffect, useState, type KeyboardEvent } from 'react';
import type { Block } from '../../types';

type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'note' | 'tip';

interface CalloutBlockProps {
  block: Block;
  calloutType: CalloutType;
  onChange: (content: string) => void;
  onTypeChange: (type: CalloutType) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  isSelected: boolean;
}

const CALLOUT_STYLES: Record<CalloutType, { bg: string; border: string; icon: string; label: string }> = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    icon: 'ℹ️',
    label: 'Info',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500',
    icon: '⚠️',
    label: 'Warning',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    icon: '❌',
    label: 'Error',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    icon: '✅',
    label: 'Success',
  },
  note: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    icon: '📝',
    label: 'Note',
  },
  tip: {
    bg: 'bg-[var(--color-gold-500)]/10',
    border: 'border-[var(--color-gold-500)]',
    icon: '💡',
    label: 'Tip',
  },
};

export function CalloutBlockComponent({
  block,
  calloutType,
  onChange,
  onTypeChange,
  onKeyDown,
  isSelected,
}: CalloutBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const style = CALLOUT_STYLES[calloutType];

  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.focus();
    }
  }, [isSelected]);

  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.innerText);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
    onKeyDown(e as unknown as KeyboardEvent);
  };

  return (
    <div className={`relative rounded-lg ${style.bg} border-l-4 ${style.border} p-4`}>
      {/* Type selector */}
      <div className="flex items-center gap-2 mb-2">
        <button
          className="flex items-center gap-1 text-sm font-medium hover:opacity-80"
          onClick={() => setShowTypeMenu(!showTypeMenu)}
        >
          <span>{style.icon}</span>
          <span>{style.label}</span>
          <ChevronDownIcon />
        </button>
      </div>

      {/* Type menu */}
      {showTypeMenu && (
        <div className="absolute top-12 left-4 z-50 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-lg py-1 min-w-[120px]">
          {(Object.keys(CALLOUT_STYLES) as CalloutType[]).map((type) => (
            <button
              key={type}
              className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-[var(--color-bg-tertiary)] ${
                type === calloutType ? 'bg-[var(--color-bg-tertiary)]' : ''
              }`}
              onClick={() => {
                onTypeChange(type);
                setShowTypeMenu(false);
              }}
            >
              <span>{CALLOUT_STYLES[type].icon}</span>
              <span>{CALLOUT_STYLES[type].label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`
          outline-none min-h-[1.5em]
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-[var(--color-text-muted)]
          empty:before:pointer-events-none
        `}
        data-placeholder="Type something..."
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      >
        {block.content}
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
