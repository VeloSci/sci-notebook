# 08 — Framework Adapters & Public API

## Overview

The core library (`@sci-notebook/core`) is framework-agnostic. Framework
adapters are thin wrappers that bridge the core engine to a specific UI
framework's component model, lifecycle, and reactivity system.

Each adapter is a separate package:

| Package                  | Framework    | Status     |
|--------------------------|-------------|------------|
| `@sci-notebook/react`    | React 18+   | Primary    |
| `@sci-notebook/vue`      | Vue 3+      | Planned    |
| `@sci-notebook/svelte`   | Svelte 5+   | Planned    |
| `@sci-notebook/vanilla`  | Vanilla JS   | Primary    |

---

## Adapter Responsibilities

1. **Mount the editor** into a DOM container.
2. **Render cells** using the framework's component model.
3. **Bind events** from the core engine to framework reactivity.
4. **Provide text editors** (textarea, CodeMirror, Monaco) for edit mode.
5. **Hydrate plugin output** (Mermaid SVGs, component embeds).
6. **Expose a framework-idiomatic API** (hooks for React, composables for Vue).

---

## Core Public API (`@sci-notebook/core`)

### `createNotebook`

The main entry point. Creates an `EditorEngine` instance.

```typescript
function createNotebook(options?: CreateNotebookOptions): EditorEngine;

interface CreateNotebookOptions {
  /** Initial notebook document (or creates empty) */
  notebook?: Notebook;

  /** Plugins to register */
  plugins?: SciNotebookPlugin[];

  /** Editor engine configuration */
  editor?: EditorEngineConfig;

  /** Rendering pipeline configuration */
  rendering?: {
    parser?: MarkdownParser;
    sanitize?: boolean;
    cacheSize?: number;
  };

  /** Theme ("light" | "dark" | custom CSS variables object) */
  theme?: string | Record<string, string>;
}
```

### `loadNotebook`

Load and migrate a notebook from JSON.

```typescript
function loadNotebook(json: string | object): Notebook;
```

### `saveNotebook`

Serialize a notebook to JSON.

```typescript
function saveNotebook(notebook: Notebook, pretty?: boolean): string;
```

### `validateNotebook`

Validate a notebook document.

```typescript
function validateNotebook(doc: unknown): ValidationResult;
```

---

## React Adapter (`@sci-notebook/react`)

### `<SciNotebook>` Component

The primary React component. Renders the full notebook UI.

```tsx
import { SciNotebook } from "@sci-notebook/react";
import { latexPlugin } from "@sci-notebook/plugin-latex";
import { mermaidPlugin } from "@sci-notebook/plugin-mermaid";

function App() {
  return (
    <SciNotebook
      notebook={initialNotebook}
      plugins={[latexPlugin(), mermaidPlugin()]}
      theme="dark"
      onChange={(notebook) => console.log("Updated:", notebook)}
      onCellFocus={(cellId) => console.log("Focused:", cellId)}
      className="my-notebook"
    />
  );
}
```

### Props

```typescript
interface SciNotebookProps {
  /** Initial or controlled notebook document */
  notebook?: Notebook;

  /** Plugins to register */
  plugins?: SciNotebookPlugin[];

  /** Theme */
  theme?: "light" | "dark" | string;

  /** Called when the notebook changes */
  onChange?: (notebook: Notebook) => void;

  /** Called when a cell is focused */
  onCellFocus?: (cellId: string | null) => void;

  /** Called when a cell's mode changes */
  onCellModeChange?: (cellId: string, mode: "edit" | "view") => void;

  /** Whether the notebook is read-only */
  readOnly?: boolean;

  /** Whether to show the toolbar */
  showToolbar?: boolean;

  /** Whether to show cell type badges */
  showCellTypes?: boolean;

  /** Whether to show cell drag handles */
  showDragHandles?: boolean;

  /** Whether to show cell action buttons (delete, move, etc.) */
  showCellActions?: boolean;

  /** Custom toolbar items (merged with plugin toolbar items) */
  toolbarItems?: PluginToolbarItem[];

  /** CSS class name */
  className?: string;

  /** Inline styles */
  style?: React.CSSProperties;

  /** Text editor implementation */
  editorType?: "textarea" | "codemirror" | "monaco";

  /** Ref to the EditorEngine instance */
  engineRef?: React.Ref<EditorEngine>;
}
```

### Hooks

```typescript
/** Access the EditorEngine from within the notebook tree */
function useSciNotebook(): EditorEngine;

/** Get the current notebook state (reactive) */
function useNotebook(): Readonly<Notebook>;

/** Get a specific cell (reactive) */
function useCell(cellId: string): Readonly<Cell> | undefined;

/** Get the focused cell ID (reactive) */
function useFocusedCell(): string | null;

/** Subscribe to engine events */
function useNotebookEvent<T extends EventType>(
  type: T,
  handler: (payload: EventPayload<T>) => void
): void;

/** Get the rendering pipeline output for a cell */
function useRenderedCell(cellId: string): RenderedCell | null;

/** Access plugin data */
function usePluginData<T = unknown>(pluginId: string, key: string): T | undefined;
```

### Custom Cell Renderers (React)

```tsx
import { registerCellRenderer } from "@sci-notebook/react";

// Register a custom React component for a cell type
registerCellRenderer("my-widget", ({ cell, isEditing, onUpdate }) => {
  if (isEditing) {
    return (
      <textarea
        value={cell.source}
        onChange={(e) => onUpdate(e.target.value)}
      />
    );
  }
  return <MyWidgetPreview data={JSON.parse(cell.source)} />;
});
```

---

## Vanilla JS Adapter (`@sci-notebook/vanilla`)

For environments without a framework (plain HTML pages, web components, etc.).

### Mounting

```typescript
import { mount } from "@sci-notebook/vanilla";
import { latexPlugin } from "@sci-notebook/plugin-latex";

const container = document.getElementById("notebook");

const editor = mount(container, {
  notebook: myNotebook,
  plugins: [latexPlugin()],
  theme: "dark",
  onChange: (notebook) => {
    localStorage.setItem("notebook", JSON.stringify(notebook));
  },
});

// Programmatic API
editor.insertCell(0, "markdown", "# New Cell");
editor.setAllViewMode();
editor.destroy(); // cleanup
```

### `mount` Return Type

```typescript
interface VanillaNotebookInstance {
  /** The underlying EditorEngine */
  engine: EditorEngine;

  /** Update options after mount */
  update(options: Partial<VanillaMountOptions>): void;

  /** Destroy the instance and clean up DOM */
  destroy(): void;

  /** Force re-render all cells */
  refresh(): void;

  /** Get the current notebook */
  getNotebook(): Notebook;

  /** Replace the entire notebook */
  setNotebook(notebook: Notebook): void;
}
```

### DOM Structure

The vanilla adapter generates this DOM structure:

```html
<div class="sci-nb" data-theme="dark">
  <div class="sci-nb-toolbar">
    <!-- Toolbar buttons -->
  </div>
  <div class="sci-nb-cells">
    <div class="sci-nb-cell sci-nb-cell--markdown sci-nb-cell--view" data-cell-id="cell_abc">
      <div class="sci-nb-cell-handle">⋮⋮</div>
      <div class="sci-nb-cell-badge">MD</div>
      <div class="sci-nb-cell-content">
        <!-- Rendered HTML or textarea -->
      </div>
      <div class="sci-nb-cell-actions">
        <!-- Delete, move up/down, type change -->
      </div>
    </div>
    <!-- More cells... -->
    <div class="sci-nb-add-cell">
      <button>+ Add Cell</button>
    </div>
  </div>
</div>
```

---

## Theming

Themes are implemented via CSS custom properties. The core ships with
`light` and `dark` themes. Custom themes override these variables.

```css
.sci-nb[data-theme="dark"] {
  --sci-nb-bg: #1a1a2e;
  --sci-nb-bg-cell: #16213e;
  --sci-nb-bg-cell-hover: #1a2744;
  --sci-nb-bg-cell-focused: #0f3460;
  --sci-nb-bg-toolbar: #0f0f23;
  --sci-nb-border: #2a2a4a;
  --sci-nb-border-focused: #4a6fa5;
  --sci-nb-text: #e0e0e0;
  --sci-nb-text-dim: #8888aa;
  --sci-nb-text-heading: #ffffff;
  --sci-nb-accent: #4a9eff;
  --sci-nb-accent-hover: #6ab0ff;
  --sci-nb-error: #ff6b6b;
  --sci-nb-success: #51cf66;
  --sci-nb-warning: #ffd43b;
  --sci-nb-font-body: "Inter", -apple-system, sans-serif;
  --sci-nb-font-mono: "JetBrains Mono", "Fira Code", monospace;
  --sci-nb-font-size: 14px;
  --sci-nb-line-height: 1.7;
  --sci-nb-cell-padding: 16px;
  --sci-nb-cell-radius: 8px;
  --sci-nb-cell-gap: 8px;
  --sci-nb-toolbar-height: 44px;
  --sci-nb-ghost-text-color: #555577;
}
```

### Custom Theme Example

```typescript
const myTheme = {
  "--sci-nb-bg": "#0d1117",
  "--sci-nb-accent": "#58a6ff",
  "--sci-nb-font-body": "'IBM Plex Sans', sans-serif",
};

<SciNotebook theme={myTheme} />
```

---

## Toolbar API

The toolbar is rendered by the adapter. It combines built-in actions with
plugin-provided toolbar items.

### Built-in Toolbar Groups

| Group      | Items                                              |
|------------|----------------------------------------------------|
| `file`     | Save, Export                                       |
| `edit`     | Undo, Redo                                         |
| `insert`   | Add Markdown, Add Code, Add Raw (+ plugin items)   |
| `format`   | Bold, Italic, Strikethrough, Code, Link, Heading   |
| `view`     | Toggle all edit/view, Toggle toolbar, Theme switch  |

### Toolbar Customization

```typescript
<SciNotebook
  showToolbar={true}
  toolbarItems={[
    {
      id: "my-export",
      label: "Export PDF",
      icon: "<svg>...</svg>",
      group: "file",
      action: () => exportToPDF(notebook),
    },
  ]}
  // Hide specific built-in groups
  toolbarGroups={["edit", "insert", "format", "view"]}
/>
```

---

## Accessibility

- All interactive elements have ARIA labels.
- Keyboard navigation follows WAI-ARIA patterns.
- Cell focus is managed with `tabindex` and `aria-activedescendant`.
- Screen reader announcements for cell operations (created, deleted, moved).
- High contrast mode supported via CSS custom properties.
- Reduced motion respected via `prefers-reduced-motion` media query.
