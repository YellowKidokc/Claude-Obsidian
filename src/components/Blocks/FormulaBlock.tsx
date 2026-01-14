/**
 * Formula Block Component
 *
 * Excel-style formula calculations with expression parsing.
 * Supports basic math, references to other blocks, and functions.
 */

import { useState, useEffect, useCallback } from 'react';
import type { FormulaBlock, FormulaResult } from '../../types';

interface FormulaBlockProps {
  block: FormulaBlock;
  onChange: (updates: Partial<FormulaBlock>) => void;
}

export function FormulaBlockComponent({ block, onChange }: FormulaBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [expression, setExpression] = useState(block.expression);
  const [error, setError] = useState<string | null>(null);

  // Evaluate formula when expression changes
  useEffect(() => {
    if (!block.expression) {
      onChange({ result: undefined });
      return;
    }

    try {
      const result = evaluateFormula(block.expression);
      onChange({
        result: {
          value: result,
          computedAt: new Date(),
        },
      });
      setError(null);
    } catch (err) {
      onChange({
        result: {
          value: null,
          error: err instanceof Error ? err.message : 'Invalid formula',
          computedAt: new Date(),
        },
      });
      setError(err instanceof Error ? err.message : 'Invalid formula');
    }
  }, [block.expression]);

  const handleSubmit = useCallback(() => {
    onChange({ expression });
    setIsEditing(false);
  }, [expression, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        setExpression(block.expression);
        setIsEditing(false);
      }
    },
    [block.expression, handleSubmit]
  );

  const formatResult = (result: FormulaResult | undefined): string => {
    if (!result) return '—';
    if (result.error) return `Error: ${result.error}`;
    if (result.value === null) return '—';

    const value = result.value;

    switch (block.displayFormat) {
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : String(value);
      case 'percent':
        return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value);
      case 'date':
        // Try to parse as date
        if (typeof value === 'number' || typeof value === 'string') {
          const date = new Date(value);
          return !isNaN(date.getTime()) ? date.toLocaleDateString() : String(value);
        }
        return String(value);
      default:
        return typeof value === 'number' ? value.toLocaleString() : String(value);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] overflow-hidden">
      {/* Expression editor */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-default)]">
        <span className="text-[var(--color-gold-500)] font-mono font-bold">=</span>
        {isEditing ? (
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSubmit}
            autoFocus
            className="flex-1 bg-transparent font-mono text-sm outline-none"
            placeholder="Enter formula (e.g., 2 + 2, SUM(1, 2, 3))"
          />
        ) : (
          <button
            className="flex-1 text-left font-mono text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            onClick={() => setIsEditing(true)}
          >
            {block.expression || 'Click to add formula...'}
          </button>
        )}

        {/* Format selector */}
        <select
          value={block.displayFormat ?? 'number'}
          onChange={(e) => onChange({ displayFormat: e.target.value as FormulaBlock['displayFormat'] })}
          className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded px-2 py-1 text-xs outline-none"
        >
          <option value="number">Number</option>
          <option value="currency">Currency</option>
          <option value="percent">Percent</option>
          <option value="text">Text</option>
        </select>
      </div>

      {/* Result display */}
      <div
        className={`px-4 py-3 text-2xl font-semibold font-mono ${
          error ? 'text-red-400 bg-red-500/10' : 'text-[var(--color-gold-400)]'
        }`}
      >
        {formatResult(block.result)}
      </div>

      {/* Function help */}
      {isEditing && (
        <div className="px-3 py-2 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-default)]">
          <div className="text-xs text-[var(--color-text-muted)]">
            <span className="font-semibold">Functions:</span>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">SUM()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">AVG()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">MIN()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">MAX()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">COUNT()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">ROUND()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">ABS()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">SQRT()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">POW()</code>{' '}
            <code className="px-1 bg-[var(--color-bg-tertiary)] rounded">IF()</code>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple formula evaluator
 * Supports: +, -, *, /, ^, (), and basic functions
 */
function evaluateFormula(expression: string): number | string | boolean {
  // Remove whitespace
  let expr = expression.trim();

  // Handle empty expression
  if (!expr) return 0;

  // Check for functions and evaluate them first
  expr = evaluateFunctions(expr);

  // Safety check - only allow numbers, operators, and parentheses
  if (!/^[\d\s+\-*/().^,]+$/.test(expr)) {
    throw new Error('Invalid characters in formula');
  }

  // Replace ^ with ** for exponentiation
  expr = expr.replace(/\^/g, '**');

  // Evaluate the expression
  try {
    // Use Function constructor for safe evaluation (only allows math)
    const result = new Function(`return ${expr}`)();

    if (typeof result === 'number' && !isFinite(result)) {
      throw new Error('Result is not a finite number');
    }

    return result;
  } catch (err) {
    throw new Error('Invalid formula syntax');
  }
}

/**
 * Evaluate function calls in the expression
 */
function evaluateFunctions(expr: string): string {
  // SUM function
  expr = expr.replace(/SUM\(([^)]+)\)/gi, (_, args) => {
    const numbers = parseArgs(args);
    return String(numbers.reduce((a, b) => a + b, 0));
  });

  // AVG function
  expr = expr.replace(/AVG\(([^)]+)\)/gi, (_, args) => {
    const numbers = parseArgs(args);
    return String(numbers.reduce((a, b) => a + b, 0) / numbers.length);
  });

  // MIN function
  expr = expr.replace(/MIN\(([^)]+)\)/gi, (_, args) => {
    const numbers = parseArgs(args);
    return String(Math.min(...numbers));
  });

  // MAX function
  expr = expr.replace(/MAX\(([^)]+)\)/gi, (_, args) => {
    const numbers = parseArgs(args);
    return String(Math.max(...numbers));
  });

  // COUNT function
  expr = expr.replace(/COUNT\(([^)]+)\)/gi, (_, args) => {
    const numbers = parseArgs(args);
    return String(numbers.length);
  });

  // ROUND function
  expr = expr.replace(/ROUND\(([^,]+),?\s*(\d*)\)/gi, (_, num, decimals) => {
    const value = evaluateFormula(num) as number;
    const places = decimals ? parseInt(decimals) : 0;
    return String(Math.round(value * Math.pow(10, places)) / Math.pow(10, places));
  });

  // ABS function
  expr = expr.replace(/ABS\(([^)]+)\)/gi, (_, num) => {
    return String(Math.abs(evaluateFormula(num) as number));
  });

  // SQRT function
  expr = expr.replace(/SQRT\(([^)]+)\)/gi, (_, num) => {
    return String(Math.sqrt(evaluateFormula(num) as number));
  });

  // POW function
  expr = expr.replace(/POW\(([^,]+),\s*([^)]+)\)/gi, (_, base, exp) => {
    return String(Math.pow(evaluateFormula(base) as number, evaluateFormula(exp) as number));
  });

  // IF function
  expr = expr.replace(/IF\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi, (_, condition, ifTrue, ifFalse) => {
    // Simple comparison handling
    let cond = condition.trim();
    let result = false;

    if (cond.includes('>=')) {
      const [left, right] = cond.split('>=');
      result = (evaluateFormula(left) as number) >= (evaluateFormula(right) as number);
    } else if (cond.includes('<=')) {
      const [left, right] = cond.split('<=');
      result = (evaluateFormula(left) as number) <= (evaluateFormula(right) as number);
    } else if (cond.includes('>')) {
      const [left, right] = cond.split('>');
      result = (evaluateFormula(left) as number) > (evaluateFormula(right) as number);
    } else if (cond.includes('<')) {
      const [left, right] = cond.split('<');
      result = (evaluateFormula(left) as number) < (evaluateFormula(right) as number);
    } else if (cond.includes('=')) {
      const [left, right] = cond.split('=');
      result = (evaluateFormula(left) as number) === (evaluateFormula(right) as number);
    } else {
      result = !!evaluateFormula(cond);
    }

    return result ? String(evaluateFormula(ifTrue)) : String(evaluateFormula(ifFalse));
  });

  // PI constant
  expr = expr.replace(/PI\(\)/gi, String(Math.PI));

  // E constant
  expr = expr.replace(/E\(\)/gi, String(Math.E));

  return expr;
}

/**
 * Parse comma-separated arguments into numbers
 */
function parseArgs(args: string): number[] {
  return args.split(',').map((arg) => {
    const trimmed = arg.trim();
    // Handle ranges like 1:10
    if (trimmed.includes(':')) {
      const [start, end] = trimmed.split(':').map(Number);
      const range: number[] = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      return range;
    }
    return [evaluateFormula(trimmed) as number];
  }).flat();
}
