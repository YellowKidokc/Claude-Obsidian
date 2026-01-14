/**
 * Database Block Component
 *
 * Notion-style database with multiple views (table, board, list).
 * Supports different column types and filtering/sorting.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  DatabaseBlock,
  DatabaseColumn,
  DatabaseRow,
  DatabaseCellValue,
  DatabaseColumnType,
  DatabaseView,
} from '../../types';
import { generateUUID } from '../../types/node';

interface DatabaseBlockProps {
  block: DatabaseBlock;
  onChange: (updates: Partial<DatabaseBlock>) => void;
}

export function DatabaseBlockComponent({ block, onChange }: DatabaseBlockProps) {
  const [activeViewId, setActiveViewId] = useState(block.views[0]?.id ?? '');
  const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);
  const [showNewColumnMenu, setShowNewColumnMenu] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);

  const activeView = block.views.find((v) => v.id === activeViewId) ?? block.views[0];

  // Apply filters and sorts to rows
  const filteredRows = useMemo(() => {
    let rows = [...block.rows];

    // Apply filters
    if (activeView?.filters) {
      for (const filter of activeView.filters) {
        rows = rows.filter((row) => {
          const value = row.cells[filter.columnId];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'not_equals':
              return value !== filter.value;
            case 'contains':
              return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'is_empty':
              return value === null || value === '' || value === undefined;
            case 'is_not_empty':
              return value !== null && value !== '' && value !== undefined;
            default:
              return true;
          }
        });
      }
    }

    // Apply sorts
    if (activeView?.sorts) {
      rows.sort((a, b) => {
        for (const sort of activeView.sorts!) {
          const aVal = a.cells[sort.columnId];
          const bVal = b.cells[sort.columnId];

          let comparison = 0;
          if (aVal === bVal) comparison = 0;
          else if (aVal === null) comparison = 1;
          else if (bVal === null) comparison = -1;
          else if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
          } else {
            comparison = aVal < bVal ? -1 : 1;
          }

          if (comparison !== 0) {
            return sort.direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    }

    return rows;
  }, [block.rows, activeView]);

  // Add new row
  const addRow = useCallback(() => {
    const newRow: DatabaseRow = {
      id: generateUUID(),
      cells: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Initialize with default values
    for (const col of block.schema.columns) {
      newRow.cells[col.id] = getDefaultValue(col.type);
    }
    onChange({ rows: [...block.rows, newRow] });
  }, [block.schema.columns, block.rows, onChange]);

  // Update cell value
  const updateCell = useCallback(
    (rowId: string, colId: string, value: DatabaseCellValue) => {
      const newRows = block.rows.map((row) =>
        row.id === rowId
          ? { ...row, cells: { ...row.cells, [colId]: value }, updatedAt: new Date() }
          : row
      );
      onChange({ rows: newRows });
    },
    [block.rows, onChange]
  );

  // Delete row
  const deleteRow = useCallback(
    (rowId: string) => {
      onChange({ rows: block.rows.filter((r) => r.id !== rowId) });
    },
    [block.rows, onChange]
  );

  // Add new column
  const addColumn = useCallback(
    (type: DatabaseColumnType) => {
      const newColumn: DatabaseColumn = {
        id: generateUUID(),
        name: `New ${type}`,
        type,
        options: type === 'select' || type === 'multi_select'
          ? {
              choices: [
                { id: '1', name: 'Option 1', color: 'gray' },
                { id: '2', name: 'Option 2', color: 'blue' },
              ],
            }
          : undefined,
      };

      // Add default values to existing rows
      const newRows = block.rows.map((row) => ({
        ...row,
        cells: { ...row.cells, [newColumn.id]: getDefaultValue(type) },
      }));

      onChange({
        schema: { columns: [...block.schema.columns, newColumn] },
        rows: newRows,
      });
      setShowNewColumnMenu(false);
    },
    [block.schema.columns, block.rows, onChange]
  );

  // Delete column
  const deleteColumn = useCallback(
    (colId: string) => {
      if (block.schema.columns.length <= 1) return;

      const newColumns = block.schema.columns.filter((c) => c.id !== colId);
      const newRows = block.rows.map((row) => {
        const { [colId]: _, ...remainingCells } = row.cells;
        return { ...row, cells: remainingCells };
      });

      onChange({
        schema: { columns: newColumns },
        rows: newRows,
      });
      setShowColumnMenu(null);
    },
    [block.schema.columns, block.rows, onChange]
  );

  // Update column
  const updateColumn = useCallback(
    (colId: string, updates: Partial<DatabaseColumn>) => {
      const newColumns = block.schema.columns.map((c) =>
        c.id === colId ? { ...c, ...updates } : c
      );
      onChange({ schema: { columns: newColumns } });
    },
    [block.schema.columns, onChange]
  );

  // Add new view
  const addView = useCallback(
    (type: DatabaseView['type']) => {
      const newView: DatabaseView = {
        id: generateUUID(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} view`,
        type,
      };
      onChange({ views: [...block.views, newView] });
      setActiveViewId(newView.id);
    },
    [block.views, onChange]
  );

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] overflow-hidden">
      {/* Header with views */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)]">
        {/* View tabs */}
        <div className="flex items-center gap-1">
          {block.views.map((view) => (
            <button
              key={view.id}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view.id === activeViewId
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-gold-400)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
              onClick={() => setActiveViewId(view.id)}
            >
              <ViewIcon type={view.type} />
              <span className="ml-1">{view.name}</span>
            </button>
          ))}
          {/* Add view button */}
          <div className="relative">
            <button
              className="px-2 py-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              onClick={() => addView('table')}
              title="Add new view"
            >
              +
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <FilterIcon />
          </button>
          <button className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <SortIcon />
          </button>
        </div>
      </div>

      {/* Table view */}
      {activeView?.type === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {block.schema.columns.map((col) => (
                  <th
                    key={col.id}
                    className="relative border-b border-r border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-0 text-left group"
                    style={{ width: col.width ?? 150 }}
                  >
                    <button
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--color-bg-tertiary)]"
                      onClick={() => setShowColumnMenu(showColumnMenu === col.id ? null : col.id)}
                    >
                      <ColumnTypeIcon type={col.type} />
                      <span className="font-medium truncate">{col.name}</span>
                    </button>

                    {/* Column menu */}
                    {showColumnMenu === col.id && (
                      <div className="absolute top-full left-0 z-50 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-lg py-1 min-w-[180px]">
                        <div className="px-3 py-2 border-b border-[var(--color-border-default)]">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => updateColumn(col.id, { name: e.target.value })}
                            className="w-full px-2 py-1 text-sm bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-default)] focus:outline-none focus:border-[var(--color-gold-500)]"
                          />
                        </div>
                        <button
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-bg-tertiary)] text-red-400"
                          onClick={() => deleteColumn(col.id)}
                        >
                          Delete column
                        </button>
                      </div>
                    )}
                  </th>
                ))}
                {/* Add column */}
                <th className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] w-10">
                  <div className="relative">
                    <button
                      className="w-full py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                      onClick={() => setShowNewColumnMenu(!showNewColumnMenu)}
                    >
                      +
                    </button>
                    {showNewColumnMenu && (
                      <NewColumnMenu onSelect={addColumn} onClose={() => setShowNewColumnMenu(false)} />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="group hover:bg-[var(--color-bg-secondary)]">
                  {block.schema.columns.map((col) => (
                    <td
                      key={col.id}
                      className="border-b border-r border-[var(--color-border-default)] p-0"
                    >
                      <CellEditor
                        column={col}
                        value={row.cells[col.id]}
                        isEditing={editingCell?.rowId === row.id && editingCell?.colId === col.id}
                        onEdit={() => setEditingCell({ rowId: row.id, colId: col.id })}
                        onBlur={() => setEditingCell(null)}
                        onChange={(value) => updateCell(row.id, col.id, value)}
                      />
                    </td>
                  ))}
                  <td className="border-b border-[var(--color-border-default)] w-10 text-center">
                    <button
                      className="p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteRow(row.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add row button */}
      <button
        className="w-full py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)]"
        onClick={addRow}
      >
        + New
      </button>
    </div>
  );
}

// Cell editor component
function CellEditor({
  column,
  value,
  onEdit,
  onBlur,
  onChange,
}: {
  column: DatabaseColumn;
  value: DatabaseCellValue;
  isEditing: boolean;
  onEdit: () => void;
  onBlur: () => void;
  onChange: (value: DatabaseCellValue) => void;
}) {
  switch (column.type) {
    case 'checkbox':
      return (
        <div className="px-3 py-2 flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-gold-500)]"
          />
        </div>
      );

    case 'select': {
      const choices = column.options?.choices ?? [];
      return (
        <div className="px-3 py-2">
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent outline-none cursor-pointer"
          >
            <option value="">—</option>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case 'number':
      return (
        <input
          type="number"
          value={value as number ?? ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          onFocus={onEdit}
          onBlur={onBlur}
          className="w-full px-3 py-2 bg-transparent outline-none focus:bg-[var(--color-bg-elevated)]"
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={value ? new Date(value as string).toISOString().split('T')[0] : ''}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
          className="w-full px-3 py-2 bg-transparent outline-none focus:bg-[var(--color-bg-elevated)]"
        />
      );

    case 'url':
      return (
        <input
          type="url"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onEdit}
          onBlur={onBlur}
          className="w-full px-3 py-2 bg-transparent outline-none focus:bg-[var(--color-bg-elevated)] text-[var(--color-gold-400)]"
          placeholder="https://..."
        />
      );

    default: // text
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onEdit}
          onBlur={onBlur}
          className="w-full px-3 py-2 bg-transparent outline-none focus:bg-[var(--color-bg-elevated)]"
        />
      );
  }
}

// New column menu
function NewColumnMenu({
  onSelect,
}: {
  onSelect: (type: DatabaseColumnType) => void;
  onClose: () => void;
}) {
  const types: Array<{ type: DatabaseColumnType; label: string }> = [
    { type: 'text', label: 'Text' },
    { type: 'number', label: 'Number' },
    { type: 'select', label: 'Select' },
    { type: 'multi_select', label: 'Multi-select' },
    { type: 'date', label: 'Date' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'url', label: 'URL' },
    { type: 'email', label: 'Email' },
    { type: 'formula', label: 'Formula' },
  ];

  return (
    <div className="absolute top-full right-0 z-50 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-lg py-1 min-w-[150px]">
      <div className="px-3 py-1 text-xs text-[var(--color-text-muted)] uppercase">Property type</div>
      {types.map(({ type, label }) => (
        <button
          key={type}
          className="w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--color-bg-tertiary)] flex items-center gap-2"
          onClick={() => onSelect(type)}
        >
          <ColumnTypeIcon type={type} />
          {label}
        </button>
      ))}
    </div>
  );
}

// Helper to get default value for column type
function getDefaultValue(type: DatabaseColumnType): DatabaseCellValue {
  switch (type) {
    case 'checkbox':
      return false;
    case 'number':
      return null;
    case 'date':
      return null;
    default:
      return '';
  }
}

// Icons
function ViewIcon({ type }: { type: DatabaseView['type'] }) {
  switch (type) {
    case 'board':
      return <span>◫</span>;
    case 'list':
      return <span>☰</span>;
    case 'calendar':
      return <span>📅</span>;
    case 'gallery':
      return <span>⊞</span>;
    default:
      return <span>▤</span>;
  }
}

function ColumnTypeIcon({ type }: { type: DatabaseColumnType }) {
  const icons: Record<DatabaseColumnType, string> = {
    text: 'Aa',
    number: '#',
    select: '▼',
    multi_select: '▼▼',
    date: '📅',
    checkbox: '☑',
    url: '🔗',
    email: '✉',
    phone: '📞',
    formula: 'ƒ',
    relation: '↗',
    rollup: 'Σ',
  };
  return <span className="text-xs text-[var(--color-text-muted)]">{icons[type] ?? '?'}</span>;
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="18" x2="12" y2="18" />
    </svg>
  );
}
