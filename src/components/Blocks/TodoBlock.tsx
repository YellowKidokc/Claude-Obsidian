/**
 * Todo Block Component
 *
 * Checkbox item with text content.
 */

import { useRef, useEffect, type KeyboardEvent } from 'react';
import type { Block } from '../../types';

interface TodoBlockProps {
  block: Block;
  checked: boolean;
  onChange: (content: string) => void;
  onCheckedChange: (checked: boolean) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  isSelected: boolean;
}

export function TodoBlockComponent({
  block,
  checked,
  onChange,
  onCheckedChange,
  onKeyDown,
  isSelected,
}: TodoBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

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
    <div className="flex items-start gap-2">
      <button
        className={`
          mt-1 w-4 h-4 rounded border flex items-center justify-center
          transition-colors flex-shrink-0
          ${checked
            ? 'bg-[var(--color-gold-500)] border-[var(--color-gold-500)]'
            : 'border-[var(--color-text-muted)] hover:border-[var(--color-gold-500)]'
          }
        `}
        onClick={() => onCheckedChange(!checked)}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-bg-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={`
          flex-1 outline-none min-h-[1.5em]
          ${checked ? 'line-through text-[var(--color-text-muted)]' : ''}
          empty:before:content-[attr(data-placeholder)]
          empty:before:text-[var(--color-text-muted)]
          empty:before:pointer-events-none
        `}
        data-placeholder="To-do"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      >
        {block.content}
      </div>
    </div>
  );
}
