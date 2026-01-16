/**
 * Heading Block Component
 *
 * Renders H1, H2, or H3 headings.
 */

import { useRef, useEffect, type KeyboardEvent } from 'react';
import type { Block } from '../../types';

interface HeadingBlockProps {
  block: Block;
  level: 1 | 2 | 3;
  onChange: (content: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  isSelected: boolean;
}

export function HeadingBlockComponent({
  block,
  level,
  onChange,
  onKeyDown,
  isSelected,
}: HeadingBlockProps) {
  const ref = useRef<HTMLHeadingElement>(null);

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

  const handleKeyDown = (e: KeyboardEvent<HTMLHeadingElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
    onKeyDown(e as unknown as KeyboardEvent);
  };

  const sizeClasses = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-semibold',
  };

  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement> & React.RefObject<HTMLHeadingElement>}
      contentEditable
      suppressContentEditableWarning
      className={`
        outline-none ${sizeClasses[level]}
        empty:before:content-[attr(data-placeholder)]
        empty:before:text-[var(--color-text-muted)]
        empty:before:pointer-events-none
      `}
      data-placeholder={`Heading ${level}`}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
    >
      {block.content}
    </Tag>
  );
}
