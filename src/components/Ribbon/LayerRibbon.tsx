/**
 * Layer Ribbon Component
 *
 * The navigation ribbon that allows switching between the 4 layers:
 * - Surface (Markdown)
 * - Structure (Navigation)
 * - Logic (Computation)
 * - AI (Intelligence)
 */

import { useApp } from '../../store';
import { LAYERS, type Layer } from '../../types';

export function LayerRibbon() {
  const { state, dispatch } = useApp();

  const handleLayerChange = (layer: Layer) => {
    dispatch({ type: 'SET_LAYER', payload: layer });
  };

  return (
    <div className="flex items-center h-12 px-4 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-default)]">
      {/* Layer tabs */}
      <div className="flex items-center gap-1">
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            onClick={() => handleLayerChange(layer.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors
              ${
                state.activeLayer === layer.id
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-gold-400)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
              }
            `}
            title={layer.description}
          >
            <LayerIcon layer={layer.id} />
            <span>{layer.name}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Current file indicator */}
        {state.activeFile && (
          <span className="text-sm text-[var(--color-text-muted)]">
            {state.activeFile.frontmatter.title}
            {state.unsavedChanges.has(state.activeFilePath!) && (
              <span className="ml-1 text-[var(--color-gold-500)]">*</span>
            )}
          </span>
        )}

        {/* Sidebar toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          title={state.sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        >
          <SidebarIcon />
        </button>
      </div>
    </div>
  );
}

// Layer-specific icons
function LayerIcon({ layer }: { layer: Layer }) {
  switch (layer) {
    case 'surface':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'structure':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );
    case 'logic':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      );
    case 'ai':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1" />
        </svg>
      );
    default:
      return null;
  }
}

function SidebarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
