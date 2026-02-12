# Plugin System API

The SciNotebook plugin system allows you to extend every aspect of the engine and UI.

## Plugin Interface

Any object implementing the `SciNotebookPlugin` interface can be registered with the engine.

```typescript
interface SciNotebookPlugin {
  id: string;                          // Unique plugin ID
  name: string;                        // Human-readable name
  version: string;
  apiVersion?: string;                 // Target API version
  dependencies?: string[];             // IDs of required plugins
  setup?(ctx: PluginContext): void | Promise<void>;
  teardown?(ctx: PluginContext): void | Promise<void>;
  cellTypes?: CustomCellType[];
  rendering?: PluginRenderingHooks;
}
```

### Lifecycle

1. **Registration** — `engine.registerPlugin(plugin)` creates a `PluginContext` and calls `setup(ctx)`.
2. **Runtime** — The plugin uses `ctx` to listen to events, modify cells, and hook into rendering.
3. **Teardown** — `engine.unregisterPlugin(id)` calls `teardown(ctx)` for cleanup.

---

## PluginContext

The `PluginContext` is a sandboxed interface to the `EditorEngine`, tailored for plugin usage.

### Notebook Access

| Method | Description |
|--------|-------------|
| `getNotebook(): Readonly<Notebook>` | Read the current notebook state |
| `getCell(id: string): Readonly<Cell> \| undefined` | Read a specific cell |

### Cell Mutation

| Method | Description |
|--------|-------------|
| `updateCellSource(id, source)` | Modify cell content |
| `updateCellMetadata(id, meta)` | Merge metadata into a cell |
| `insertCell(index, type?, source?)` | Insert a new cell |
| `deleteCell(id)` | Remove a cell |

### Events

| Method | Description |
|--------|-------------|
| `on(event, handler): Unsubscribe` | Listen to engine events |
| `emit(event, payload)` | Emit custom events |

### Rendering Hooks

| Method | Description |
|--------|-------------|
| `addPreprocessor(fn, priority?)` | Modify raw source before parsing |
| `addASTTransformer(fn, priority?)` | Modify markdown-it tokens |
| `addRenderer(renderer)` | Add a custom cell renderer |
| `addPostprocessor(fn, priority?)` | Modify final HTML output |

### Logging

```typescript
ctx.log.info('Plugin initialized');
ctx.log.warn('Deprecated API usage');
ctx.log.error('Failed to process cell');
```

All log messages are automatically prefixed with the plugin ID: `[my-plugin] Plugin initialized`.

---

## PluginRenderingHooks

Plugins can declare rendering hooks directly in their definition, as an alternative to calling `ctx.addPreprocessor()` etc. in `setup()`:

```typescript
interface PluginRenderingHooks {
  preprocess?: (source: string, cell: Cell) => string;
  transformAST?: (tokens: any[], cell: Cell) => any[];
  postprocess?: (html: string, cell: Cell) => string;
  priority?: number;
}
```

---

## Custom Cell Types

Plugins can define new cell types that appear in the insert menu:

```typescript
interface CustomCellType {
  type: string;              // e.g. 'sql'
  displayName: string;       // e.g. 'SQL Query'
  icon?: string;             // Icon identifier
  defaultSource?: string;    // Initial content for new cells
  supportsDualMode?: boolean;// Edit/view toggle support
}
```

```typescript
cellTypes: [
  {
    type: 'sql',
    displayName: 'SQL Query',
    icon: 'database',
    defaultSource: 'SELECT * FROM ',
    supportsDualMode: true
  }
]
```

---

## Example: Word Counter Plugin

```typescript
import { SciNotebookPlugin, PluginContext } from '@velo-sci/notebook-core';

const wordCounterPlugin: SciNotebookPlugin = {
  id: 'word-counter',
  name: 'Word Counter',
  version: '1.0.0',
  setup(ctx: PluginContext) {
    ctx.on('cell:updated', (payload) => {
      const cell = ctx.getCell(payload.data.cellId);
      if (!cell) return;
      const words = cell.source.split(/\s+/).filter(Boolean).length;
      ctx.log.info(`Cell ${cell.id} now has ${words} words`);
    });
  }
};

engine.registerPlugin(wordCounterPlugin);
```

## Example: Custom Postprocessor Plugin

```typescript
const todoBadgePlugin: SciNotebookPlugin = {
  id: 'todo-badge',
  name: 'TODO Badge',
  version: '1.0.0',
  rendering: {
    postprocess: (html, cell) => {
      return html.replace(/TODO/g, '<span class="todo-badge">TODO</span>');
    },
    priority: 10,
  }
};
```
