/**
 * Code Block Component
 *
 * Syntax-highlighted code block with language selection.
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { Block } from '../../types';

interface CodeBlockProps {
  block: Block;
  language: string;
  onChange: (content: string) => void;
  onLanguageChange: (language: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  isSelected: boolean;
}

const LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
  'csharp',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'sql',
  'html',
  'css',
  'json',
  'yaml',
  'markdown',
  'bash',
  'shell',
];

export function CodeBlockComponent({
  block,
  language,
  onChange,
  onLanguageChange,
  onKeyDown,
  isSelected,
}: CodeBlockProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isSelected]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [block.content]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Enter in code blocks
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      // Reset cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
      return;
    }

    // Cmd/Ctrl + Enter to exit code block
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onKeyDown(e as unknown as KeyboardEvent);
      return;
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)]">
      {/* Language selector */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)]">
        <button
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
          onClick={() => setShowLangMenu(!showLangMenu)}
        >
          {language}
          <ChevronDownIcon />
        </button>
        <button
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          onClick={() => {
            navigator.clipboard.writeText(block.content);
          }}
          title="Copy code"
        >
          <CopyIcon />
        </button>
      </div>

      {/* Language menu */}
      {showLangMenu && (
        <div className="absolute top-8 left-0 z-50 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-lg py-1 max-h-[200px] overflow-y-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`w-full px-3 py-1 text-left text-sm hover:bg-[var(--color-bg-tertiary)] ${
                lang === language ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-gold-400)]' : ''
              }`}
              onClick={() => {
                onLanguageChange(lang);
                setShowLangMenu(false);
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      )}

      {/* Code textarea */}
      <textarea
        ref={textareaRef}
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="w-full p-3 bg-transparent font-mono text-sm resize-none outline-none min-h-[60px]"
        placeholder="// Enter code here..."
      />
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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
