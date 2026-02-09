# 05 — Plugin System Architecture

## Design Goals

- Plugins are the **primary extension mechanism**. Every non-trivial feature
  (LaTeX, Mermaid, AI, embeds) is implemented as a plugin.
- Plugins are **isolated** — one plugin cannot break another.
- Plugins are **lazy-loadable** — they can be dynamically imported.
- Plugins have a **well-defined lifecycle** with setup and teardown hooks.
- The plugin API is **stable and versioned** — breaking changes bump the
  plugin API version.

---

## Plugin Interface

```typescript
interface SciNotebookPlugin {
  /** Unique plugin identifier (e.g., "sci-notebook-plugin-latex") */
  id: string;

  /** Human-readable name */
  name: string;

  /** Semver version string */
  version: string;

  /** Minimum core API version required */
  apiVersion?: string;

  /** Plugin dependencies (other plugin IDs) */
  dependencies?: string[];

  /** Called when the plugin is registered */
  setup?(ctx: PluginContext): void | Promise<void>;

  /** Called when the plugin is unregistered or the engine is destroyed */
  teardown?(ctx: PluginContext): void | Promise<void>;

  /** Cell types this plugin registers */
  cellTypes?: CustomCellType[];

  /** Rendering pipeline hooks */
  rendering?: PluginRenderingHooks;

  /** Keybindings this plugin adds */
  keybindings?: PluginKeybinding[];

  /** Toolbar items this plugin adds */
  toolbar?: PluginToolbarItem[];

  /** CSS to inject (string or URL) */
  styles?: string | string[];

  /** AI completion provider */
  aiProvider?: AICompletionProvider;

  /** Notebook validation rules */
  validators?: CellValidator[];

  /** Custom event handlers */
  events?: Record<string, (payload: unknown) => void>;
}
```

---

## Plugin Context

The `PluginContext` is the API surface available to plugins. It provides
controlled access to the engine without exposing internals.

```typescript
interface PluginContext {
  /** Read-only access to the current notebook */
  getNotebook(): Readonly<Notebook>;

  /** Get a specific cell */
  getCell(id: string): Readonly<Cell> | undefined;

  /** Update a cell's source */
  updateCellSource(id: string, source: string): void;

  /** Update a cell's metadata */
  updateCellMetadata(id: string, meta: Partial<CellMetadata>): void;

  /** Insert a cell */
  insertCell(index: number, type?: CellType, source?: string): Cell;

  /** Delete a cell */
  deleteCell(id: string): void;

  /** Subscribe to events */
  on(event: string, handler: (payload: unknown) => void): Unsubscribe;

  /** Emit a custom event */
  emit(event: string, payload: unknown): void;

  /** Register a rendering preprocessor */
  addPreprocessor(fn: (source: string, cell: Cell) => string, priority?: number): void;

  /** Register an AST transformer */
  addASTTransformer(fn: ASTTransformer, priority?: number): void;

  /** Register a cell renderer */
  addRenderer(renderer: CellRenderer): void;

  /** Register a postprocessor */
  addPostprocessor(fn: PostProcessor, priority?: number): void;

  /** Register a keybinding */
  addKeybinding(combo: string, action: string, handler: () => void, context?: string): void;

  /** Register a toolbar item */
  addToolbarItem(item: PluginToolbarItem): void;

  /** Inject CSS */
  injectStyles(css: string): void;

  /** Access to the render cache (for invalidation) */
  renderCache: RenderCache;

  /** Logger scoped to this plugin */
  log: PluginLogger;

  /** Store plugin-specific persistent data */
  setPluginData(key: string, value: unknown): void;
  getPluginData<T = unknown>(key: string): T | undefined;
}
```

---

## Plugin Lifecycle

```
  register(plugin)
       │
       ▼
  ┌─────────────┐
  │ Validate    │  Check apiVersion, dependencies, no ID conflicts
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Load styles │  Inject CSS into document head
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Register    │  Cell types, renderers, keybindings, toolbar items
  │ extensions  │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ setup()     │  Plugin's own initialization logic
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Active      │  Plugin is fully operational
  └──────┬──────┘
         │
    unregister(pluginId) or engine.destroy()
         │
         ▼
  ┌─────────────┐
  │ teardown()  │  Plugin cleanup
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Remove      │  Unregister all extensions, remove styles
  │ extensions  │
  └─────────────┘
```

---

## Plugin Manager

```typescript
class PluginManager {
  private plugins: Map<string, RegisteredPlugin>;
  private bus: EventBus;

  constructor(bus: EventBus);

  /** Register a plugin */
  register(plugin: SciNotebookPlugin): Promise<void>;

  /** Unregister a plugin by ID */
  unregister(pluginId: string): Promise<void>;

  /** Check if a plugin is registered */
  has(pluginId: string): boolean;

  /** Get a registered plugin */
  get(pluginId: string): RegisteredPlugin | undefined;

  /** List all registered plugins */
  list(): RegisteredPlugin[];

  /** Unregister all plugins */
  clear(): Promise<void>;
}

interface RegisteredPlugin {
  plugin: SciNotebookPlugin;
  context: PluginContext;
  status: "loading" | "active" | "error" | "disabled";
  error?: Error;
  registeredAt: number;
}
```

---

## Custom Cell Types

Plugins can register new cell types with custom rendering and editing behavior.

```typescript
interface CustomCellType {
  /** Cell type identifier (e.g., "mermaid", "latex", "chart") */
  type: string;

  /** Display name for the UI */
  displayName: string;

  /** Icon (SVG string, URL, or framework component reference) */
  icon?: string;

  /** Default source content for new cells of this type */
  defaultSource?: string;

  /** Custom renderer for this cell type */
  renderer?: CellRenderer;

  /** Custom editor for this cell type (framework-specific) */
  editor?: CellEditorDescriptor;

  /** Whether this cell type supports edit/view mode toggle */
  supportsDualMode?: boolean;

  /** Validation function for this cell type */
  validate?(source: string): ValidationError[];
}

interface CellEditorDescriptor {
  /** Editor type hint for the framework adapter */
  type: "textarea" | "codemirror" | "monaco" | "custom";

  /** Language hint for syntax highlighting */
  language?: string;

  /** Custom editor component ID (for "custom" type) */
  componentId?: string;

  /** Editor configuration */
  config?: Record<string, unknown>;
}
```

---

## Plugin Rendering Hooks

```typescript
interface PluginRenderingHooks {
  /** Pre-process source before parsing */
  preprocess?: (source: string, cell: Cell) => string;

  /** Transform AST tokens after parsing */
  transformAST?: ASTTransformer;

  /** Custom renderer for specific cell types */
  renderers?: CellRenderer[];

  /** Post-process rendered HTML */
  postprocess?: PostProcessor;

  /** Priority for all hooks (default: 0, higher = runs first) */
  priority?: number;
}
```

---

## Plugin Toolbar Items

```typescript
interface PluginToolbarItem {
  /** Unique item ID */
  id: string;

  /** Display label */
  label: string;

  /** Icon (SVG string) */
  icon?: string;

  /** Tooltip text */
  tooltip?: string;

  /** Toolbar group (e.g., "format", "insert", "view") */
  group?: string;

  /** Click handler */
  action: () => void;

  /** Whether the item is currently active (toggle state) */
  isActive?: () => boolean;

  /** Whether the item is currently disabled */
  isDisabled?: () => boolean;

  /** Keyboard shortcut label (display only) */
  shortcut?: string;

  /** Sub-items for dropdown menus */
  children?: PluginToolbarItem[];
}
```

---

## Plugin Communication

Plugins communicate through the event bus. The convention is to namespace
events with the plugin ID:

```typescript
// Plugin "my-plugin" emitting an event
ctx.emit("my-plugin:data-loaded", { rows: 100 });

// Another plugin listening
ctx.on("my-plugin:data-loaded", (payload) => {
  console.log("Data loaded:", payload);
});
```

Plugins can also read each other's data through the notebook metadata:

```typescript
// Plugin A stores data
ctx.setPluginData("sharedConfig", { theme: "dark" });

// Plugin B reads it (if it knows the key)
const config = ctx.getPluginData<{ theme: string }>("sharedConfig");
```

---

## Built-in Plugins

These plugins ship with the library but are opt-in:

| Plugin ID                    | Package                  | Description                    |
|------------------------------|--------------------------|--------------------------------|
| `sci-nb-latex`               | `plugin-latex`           | KaTeX LaTeX rendering          |
| `sci-nb-mermaid`             | `plugin-mermaid`         | Mermaid diagram rendering      |
| `sci-nb-embeds`              | `plugin-embeds`          | HTML/iframe/component embeds   |
| `sci-nb-ai`                  | `plugin-ai`              | AI completions & rewrites      |
| `sci-nb-images`              | `plugin-images`          | Image upload, paste, resize    |
| `sci-nb-tables`              | `plugin-tables`          | Rich table editing             |
| `sci-nb-code-highlight`      | `plugin-code-highlight`  | Shiki/Prism syntax highlighting|
| `sci-nb-toc`                 | `plugin-toc`             | Table of contents sidebar      |
| `sci-nb-search`              | `plugin-search`          | Find & replace across cells    |

---

## Plugin Development Guide (Summary)

1. Create a new package exporting a function that returns `SciNotebookPlugin`.
2. Implement `setup()` to register hooks via `PluginContext`.
3. Implement `teardown()` to clean up resources.
4. Declare `dependencies` if you depend on other plugins.
5. Export types for any public API your plugin exposes.

```typescript
// Example: minimal plugin skeleton
import type { SciNotebookPlugin, PluginContext } from "@velo-sci/notebook-core";

export function myPlugin(options?: MyPluginOptions): SciNotebookPlugin {
  return {
    id: "my-plugin",
    name: "My Plugin",
    version: "1.0.0",

    setup(ctx: PluginContext) {
      ctx.addPostprocessor((html, cell) => {
        // Transform rendered HTML
        return html.replace(/TODO/g, '<mark>TODO</mark>');
      });

      ctx.addKeybinding("cmd+shift+t", "insert-todo", () => {
        const nb = ctx.getNotebook();
        const lastCell = nb.cells[nb.cells.length - 1];
        ctx.insertCell(nb.cells.length, "markdown", "- [ ] TODO: ");
      });

      ctx.log.info("My Plugin initialized");
    },

    teardown(ctx: PluginContext) {
      ctx.log.info("My Plugin destroyed");
    },
  };
}
```
