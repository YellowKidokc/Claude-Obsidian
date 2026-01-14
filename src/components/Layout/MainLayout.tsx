/**
 * Main Layout Component
 *
 * The root layout that arranges all major UI components:
 * - Layer Ribbon (top)
 * - Sidebar (left)
 * - Main content area (center)
 */

import { useApp } from '../../store';
import { LayerRibbon } from '../Ribbon';
import { Sidebar } from '../Sidebar';
import { MarkdownEditor } from '../Editor';

export function MainLayout() {
  const { state } = useApp();

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Top ribbon */}
      <LayerRibbon />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {state.sidebarVisible && <Sidebar />}

        {/* Editor area */}
        <main className="flex-1 overflow-hidden">
          {renderLayerContent(state.activeLayer)}
        </main>
      </div>
    </div>
  );
}

// Render content based on active layer
function renderLayerContent(layer: import('../../types').Layer) {
  switch (layer) {
    case 'surface':
      return <MarkdownEditor />;
    case 'structure':
      return <StructureView />;
    case 'logic':
      return <LogicView />;
    case 'ai':
      return <AIView />;
    default:
      return <MarkdownEditor />;
  }
}

// Placeholder components for other layers
function StructureView() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Structure View
        </h2>
        <p className="text-[var(--color-text-muted)]">
          Pages within pages, embeds, backlinks, and database views.
        </p>
        <p className="text-sm text-[var(--color-gold-500)] mt-4">
          Coming in Phase 2
        </p>
      </div>
    </div>
  );
}

function LogicView() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          Logic View
        </h2>
        <p className="text-[var(--color-text-muted)]">
          SQL queries, automations, formulas, and workflow builders.
        </p>
        <p className="text-sm text-[var(--color-gold-500)] mt-4">
          Coming in Phase 3
        </p>
      </div>
    </div>
  );
}

function AIView() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
          AI View
        </h2>
        <p className="text-[var(--color-text-muted)]">
          Chat interface, AI suggestions, and the Curator.
        </p>
        <p className="text-sm text-[var(--color-gold-500)] mt-4">
          Coming in Phase 4
        </p>
      </div>
    </div>
  );
}
