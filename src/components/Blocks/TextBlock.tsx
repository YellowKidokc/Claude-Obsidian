/**
 * Text Block Component
 *
 * Basic text/paragraph block with rich text editing support.
 */

import { useRef, useEffect, type KeyboardEvent } from 'react';
import type { Block } from '../../types';

interface TextBlockProps {
  block: Block;
  onChange: (content: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  isSelected: boolean;
  placeholder?: string;
}

export function TextBlockComponent({
  block,
  onChange,
  onKeyDown,
  isSelected,
  placeholder = "Type '/' for commands...",
}: TextBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Focus when selected
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.focus();
    }
  }, [isSelected]);

  // Handle input changes
  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.innerText);
    }
  };

  // Prevent default paragraph insertion on Enter
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
    onKeyDown(e as unknown as KeyboardEvent);
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`
        outline-none min-h-[1.5em] leading-relaxed
        empty:before:content-[attr(data-placeholder)]
        empty:before:text-[var(--color-text-muted)]
        empty:before:pointer-events-none
      `}
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.content) }}
    />
  );
}

/**
 * Format inline markdown (bold, italic, code, links)
 */
function formatInlineMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-[var(--color-bg-tertiary)] rounded text-sm font-mono">$1</code>')
    // Wiki links
    .replace(/\[\[(.+?)\]\]/g, '<span class="wiki-link">$1</span>')
    // Regular links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--color-gold-400)] underline">$1</a>');
}
