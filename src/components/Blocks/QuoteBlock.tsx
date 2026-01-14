/**
 * Quote Block Component
 *
 * Blockquote with styled left border.
 */

import { useRef, useEffect, type KeyboardEvent } from 'react';
import type { Block } from '../../types';

interface QuoteBlockProps {
  block: Block;
  onChange: (content: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  isSelected: boolean;
}

export function QuoteBlockComponent({
  block,
  onChange,
  onKeyDown,
  isSelected,
}: QuoteBlockProps) {
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
    <blockquote className="border-l-3 border-[var(--color-gold-500)] pl-4 py-1 italic text-[var(--color-text-secondary)]">
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
        data-placeholder="Quote..."
        onInput={handleInput}
        onKeyDown={handleKeyDown}
      >
        {block.content}
      </div>
    </blockquote>
  );
}
