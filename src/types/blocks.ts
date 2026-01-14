/**
 * Block System Types
 *
 * Defines the block-based content model for Pipeline.
 * Blocks are the atomic units of content that can be:
 * - Text, headings, code
 * - Databases (Notion-style)
 * - Formulas (Excel-style)
 * - Embeds, callouts, etc.
 */

import { generateUUID } from './node';

// All available block types
export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted_list'
  | 'numbered_list'
  | 'todo'
  | 'toggle'
  | 'code'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'table'
  | 'database'
  | 'formula'
  | 'embed'
  | 'image';

/**
 * Base block interface - all blocks extend this
 */
export interface BaseBlock {
  id: string;
  type: BlockType;
  content: string;
  children?: Block[];
  collapsed?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Text block - basic paragraph
 */
export interface TextBlock extends BaseBlock {
  type: 'text';
}

/**
 * Heading blocks
 */
export interface HeadingBlock extends BaseBlock {
  type: 'heading1' | 'heading2' | 'heading3';
}

/**
 * List blocks
 */
export interface ListBlock extends BaseBlock {
  type: 'bulleted_list' | 'numbered_list';
  children: Block[];
}

/**
 * Todo block - checkbox item
 */
export interface TodoBlock extends BaseBlock {
  type: 'todo';
  checked: boolean;
}

/**
 * Toggle block - collapsible content
 */
export interface ToggleBlock extends BaseBlock {
  type: 'toggle';
  children: Block[];
  collapsed: boolean;
}

/**
 * Code block - syntax highlighted
 */
export interface CodeBlock extends BaseBlock {
  type: 'code';
  language: string;
  showLineNumbers?: boolean;
}

/**
 * Quote block
 */
export interface QuoteBlock extends BaseBlock {
  type: 'quote';
}

/**
 * Callout block - styled alert/note
 */
export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  calloutType: 'info' | 'warning' | 'error' | 'success' | 'note' | 'tip';
  icon?: string;
}

/**
 * Table block - markdown table
 */
export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
}

/**
 * Database block - Notion-style database
 */
export interface DatabaseBlock extends BaseBlock {
  type: 'database';
  schema: DatabaseSchema;
  rows: DatabaseRow[];
  views: DatabaseView[];
  activeView: string;
}

export interface DatabaseSchema {
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: DatabaseColumnType;
  options?: DatabaseColumnOptions;
  width?: number;
}

export type DatabaseColumnType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'formula'
  | 'relation'
  | 'rollup';

export interface DatabaseColumnOptions {
  // For select/multi_select
  choices?: Array<{ id: string; name: string; color: string }>;
  // For number
  format?: 'number' | 'currency' | 'percent';
  // For formula
  expression?: string;
  // For relation
  relatedDatabase?: string;
}

export interface DatabaseRow {
  id: string;
  cells: Record<string, DatabaseCellValue>;
  createdAt: Date;
  updatedAt: Date;
}

export type DatabaseCellValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | null;

export interface DatabaseView {
  id: string;
  name: string;
  type: 'table' | 'board' | 'list' | 'calendar' | 'gallery';
  filters?: DatabaseFilter[];
  sorts?: DatabaseSort[];
  groupBy?: string;
  hiddenColumns?: string[];
}

export interface DatabaseFilter {
  columnId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: DatabaseCellValue;
}

export interface DatabaseSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

/**
 * Formula block - Excel-style calculations
 */
export interface FormulaBlock extends BaseBlock {
  type: 'formula';
  expression: string;
  result?: FormulaResult;
  displayFormat?: 'number' | 'currency' | 'percent' | 'date' | 'text';
  references?: string[]; // Block IDs this formula references
}

export interface FormulaResult {
  value: number | string | boolean | null;
  error?: string;
  computedAt: Date;
}

/**
 * Embed block - external content
 */
export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  embedType: 'link' | 'file' | 'iframe' | 'wiki';
  url?: string;
  targetId?: string; // For wiki embeds, the UUID of the target
}

/**
 * Image block
 */
export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Divider block
 */
export interface DividerBlock extends BaseBlock {
  type: 'divider';
  content: ''; // Always empty
}

// Union type of all blocks
export type Block =
  | TextBlock
  | HeadingBlock
  | ListBlock
  | TodoBlock
  | ToggleBlock
  | CodeBlock
  | QuoteBlock
  | CalloutBlock
  | TableBlock
  | DatabaseBlock
  | FormulaBlock
  | EmbedBlock
  | ImageBlock
  | DividerBlock;

/**
 * Create a new block with defaults
 */
export function createBlock(type: BlockType, content: string = ''): Block {
  const base: BaseBlock = {
    id: generateUUID(),
    type,
    content,
  };

  switch (type) {
    case 'todo':
      return { ...base, type: 'todo', checked: false };

    case 'toggle':
      return { ...base, type: 'toggle', children: [], collapsed: false };

    case 'bulleted_list':
      return { ...base, type: 'bulleted_list', children: [] };

    case 'numbered_list':
      return { ...base, type: 'numbered_list', children: [] };

    case 'code':
      return { ...base, type: 'code', language: 'plaintext' };

    case 'callout':
      return { ...base, type: 'callout', calloutType: 'info' };

    case 'table':
      return {
        ...base,
        type: 'table',
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [['', '', '']],
      };

    case 'database':
      return {
        ...base,
        type: 'database',
        schema: {
          columns: [
            { id: generateUUID(), name: 'Name', type: 'text' },
            { id: generateUUID(), name: 'Status', type: 'select', options: { choices: [
              { id: '1', name: 'Not Started', color: 'gray' },
              { id: '2', name: 'In Progress', color: 'blue' },
              { id: '3', name: 'Done', color: 'green' },
            ]}},
          ],
        },
        rows: [],
        views: [{ id: generateUUID(), name: 'Table View', type: 'table' }],
        activeView: '',
      };

    case 'formula':
      return {
        ...base,
        type: 'formula',
        expression: '',
        references: [],
      };

    case 'divider':
      return { ...base, type: 'divider', content: '' };

    default:
      return base as Block;
  }
}

/**
 * Get block type display info
 */
export function getBlockTypeInfo(type: BlockType): { label: string; icon: string; shortcut?: string } {
  const info: Record<BlockType, { label: string; icon: string; shortcut?: string }> = {
    text: { label: 'Text', icon: 'type', shortcut: '' },
    heading1: { label: 'Heading 1', icon: 'heading', shortcut: '# ' },
    heading2: { label: 'Heading 2', icon: 'heading', shortcut: '## ' },
    heading3: { label: 'Heading 3', icon: 'heading', shortcut: '### ' },
    bulleted_list: { label: 'Bulleted List', icon: 'list', shortcut: '- ' },
    numbered_list: { label: 'Numbered List', icon: 'list-ordered', shortcut: '1. ' },
    todo: { label: 'To-do', icon: 'check-square', shortcut: '[] ' },
    toggle: { label: 'Toggle', icon: 'chevron-right', shortcut: '> ' },
    code: { label: 'Code', icon: 'code', shortcut: '```' },
    quote: { label: 'Quote', icon: 'quote', shortcut: '> ' },
    callout: { label: 'Callout', icon: 'alert-circle' },
    divider: { label: 'Divider', icon: 'minus', shortcut: '---' },
    table: { label: 'Table', icon: 'table' },
    database: { label: 'Database', icon: 'database' },
    formula: { label: 'Formula', icon: 'function', shortcut: '=' },
    embed: { label: 'Embed', icon: 'link' },
    image: { label: 'Image', icon: 'image' },
  };

  return info[type] ?? { label: type, icon: 'file' };
}

/**
 * Parse markdown content into blocks
 */
export function parseMarkdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line -> skip or end current block
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push(createBlock(`heading${level}` as BlockType, headingMatch[2]));
      i++;
      continue;
    }

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim() || 'plaintext';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const block = createBlock('code', codeLines.join('\n')) as CodeBlock;
      block.language = language;
      blocks.push(block);
      i++; // Skip closing ```
      continue;
    }

    // Divider
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(createBlock('divider'));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push(createBlock('quote', quoteLines.join('\n')));
      continue;
    }

    // Todo item
    if (/^\s*[-*]\s+\[([ xX])\]\s+/.test(line)) {
      const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
      if (match) {
        const block = createBlock('todo', match[2]) as TodoBlock;
        block.checked = match[1].toLowerCase() === 'x';
        blocks.push(block);
        i++;
        continue;
      }
    }

    // Bulleted list
    if (/^\s*[-*+]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*+]\s+/, '');
      blocks.push(createBlock('bulleted_list', content));
      i++;
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      blocks.push(createBlock('numbered_list', content));
      i++;
      continue;
    }

    // Regular text paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|_{3,}|\*{3,})$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    blocks.push(createBlock('text', paragraphLines.join('\n')));
  }

  return blocks.length > 0 ? blocks : [createBlock('text', '')];
}

/**
 * Serialize blocks back to markdown
 */
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map((block) => blockToMarkdown(block)).join('\n\n');
}

function blockToMarkdown(block: Block): string {
  switch (block.type) {
    case 'text':
      return block.content;

    case 'heading1':
      return `# ${block.content}`;

    case 'heading2':
      return `## ${block.content}`;

    case 'heading3':
      return `### ${block.content}`;

    case 'bulleted_list':
      return `- ${block.content}`;

    case 'numbered_list':
      return `1. ${block.content}`;

    case 'todo': {
      const checkbox = (block as TodoBlock).checked ? '[x]' : '[ ]';
      return `- ${checkbox} ${block.content}`;
    }

    case 'code': {
      const codeBlock = block as CodeBlock;
      return `\`\`\`${codeBlock.language}\n${block.content}\n\`\`\``;
    }

    case 'quote':
      return block.content.split('\n').map((line) => `> ${line}`).join('\n');

    case 'divider':
      return '---';

    case 'callout': {
      const callout = block as CalloutBlock;
      return `> [!${callout.calloutType}]\n> ${block.content.split('\n').join('\n> ')}`;
    }

    case 'table': {
      const table = block as TableBlock;
      const headerRow = `| ${table.headers.join(' | ')} |`;
      const separatorRow = `| ${table.headers.map(() => '---').join(' | ')} |`;
      const dataRows = table.rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
      return `${headerRow}\n${separatorRow}\n${dataRows}`;
    }

    case 'formula': {
      const formula = block as FormulaBlock;
      return `= ${formula.expression}`;
    }

    case 'database':
      // Databases are stored as special YAML blocks
      return `<!-- database:${block.id} -->`;

    case 'embed': {
      const embed = block as EmbedBlock;
      if (embed.embedType === 'wiki' && embed.targetId) {
        return `![[${embed.targetId}]]`;
      }
      return embed.url ? `![](${embed.url})` : '';
    }

    case 'image': {
      const image = block as ImageBlock;
      return `![${image.alt ?? ''}](${image.src})`;
    }

    default:
      return block.content;
  }
}
