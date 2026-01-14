/**
 * Table Block Component
 *
 * Editable markdown-style table.
 */

import { useState, useCallback } from 'react';
import type { TableBlock } from '../../types';

interface TableBlockProps {
  block: TableBlock;
  onChange: (updates: Partial<TableBlock>) => void;
}

export function TableBlockComponent({ block, onChange }: TableBlockProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const updateHeader = useCallback(
    (colIndex: number, value: string) => {
      const newHeaders = [...block.headers];
      newHeaders[colIndex] = value;
      onChange({ headers: newHeaders });
    },
    [block.headers, onChange]
  );

  const updateCell = useCallback(
    (rowIndex: number, colIndex: number, value: string) => {
      const newRows = block.rows.map((row, ri) =>
        ri === rowIndex
          ? row.map((cell, ci) => (ci === colIndex ? value : cell))
          : row
      );
      onChange({ rows: newRows });
    },
    [block.rows, onChange]
  );

  const addRow = useCallback(() => {
    const newRow = new Array(block.headers.length).fill('');
    onChange({ rows: [...block.rows, newRow] });
  }, [block.headers.length, block.rows, onChange]);

  const addColumn = useCallback(() => {
    const newHeaders = [...block.headers, `Column ${block.headers.length + 1}`];
    const newRows = block.rows.map((row) => [...row, '']);
    onChange({ headers: newHeaders, rows: newRows });
  }, [block.headers, block.rows, onChange]);

  const deleteRow = useCallback(
    (rowIndex: number) => {
      if (block.rows.length <= 1) return;
      const newRows = block.rows.filter((_, i) => i !== rowIndex);
      onChange({ rows: newRows });
    },
    [block.rows, onChange]
  );

  const deleteColumn = useCallback(
    (colIndex: number) => {
      if (block.headers.length <= 1) return;
      const newHeaders = block.headers.filter((_, i) => i !== colIndex);
      const newRows = block.rows.map((row) => row.filter((_, i) => i !== colIndex));
      onChange({ headers: newHeaders, rows: newRows });
    },
    [block.headers, block.rows, onChange]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {/* Headers */}
        <thead>
          <tr>
            {block.headers.map((header, colIndex) => (
              <th
                key={colIndex}
                className="relative border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] p-0 group"
              >
                <input
                  type="text"
                  value={header}
                  onChange={(e) => updateHeader(colIndex, e.target.value)}
                  className="w-full px-3 py-2 bg-transparent font-semibold outline-none focus:bg-[var(--color-bg-elevated)]"
                  placeholder="Header"
                />
                {/* Column delete button */}
                <button
                  className="absolute -top-2 right-1 w-4 h-4 rounded bg-red-500/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={() => deleteColumn(colIndex)}
                  title="Delete column"
                >
                  ×
                </button>
              </th>
            ))}
            {/* Add column button */}
            <th className="border border-[var(--color-border-default)] border-dashed bg-[var(--color-bg-secondary)] w-10">
              <button
                className="w-full h-full py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                onClick={addColumn}
                title="Add column"
              >
                +
              </button>
            </th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="group">
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className={`border border-[var(--color-border-default)] p-0 ${
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                      ? 'ring-2 ring-[var(--color-gold-500)] ring-inset'
                      : ''
                  }`}
                  onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                >
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    className="w-full px-3 py-2 bg-transparent outline-none focus:bg-[var(--color-bg-elevated)]"
                    placeholder="—"
                  />
                </td>
              ))}
              {/* Row actions */}
              <td className="border border-[var(--color-border-default)] border-dashed w-10 text-center">
                <button
                  className="w-full py-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10"
                  onClick={() => deleteRow(rowIndex)}
                  title="Delete row"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}

          {/* Add row button */}
          <tr>
            <td
              colSpan={block.headers.length + 1}
              className="border border-[var(--color-border-default)] border-dashed bg-[var(--color-bg-secondary)]"
            >
              <button
                className="w-full py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                onClick={addRow}
              >
                + Add row
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
