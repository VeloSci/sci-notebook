# Plugin System API

The SciNotebook plugin system allows you to extend every aspect of the engine and UI.

## Plugin Interface

Any object implementing the `SciNotebookPlugin` interface can be registered with the engine.

```typescript
interface SciNotebookPlugin {
  id: string;               // Unique plugin ID
  name: string;             // Human-readable name
  version: string;
  setup?(ctx: PluginContext): void;
  teardown?(ctx: PluginContext): void;
  cellTypes?: CustomCellType[];
  rendering?: PluginRenderingHooks;
}
```

### Setup Lifecycle
The `setup` method is called when the plugin is registered. It receives a `PluginContext` which provides access to the engine's core capabilities.

---

## PluginContext

The `PluginContext` is a restricted interface to the `EditorEngine`, tailored for plugin usage.

### Methods
- `getNotebook()`: Read the current state.
- `updateCellSource(id, source)`: Modify cell content.
- `insertCell(index, type, source)`: Add new cells.
- `on(event, handler)`: Listen to engine events.
- `addPreprocessor / addPostprocessor`: Hook into the rendering pipeline.
- `log`: Built-in logging utilities (`info`, `warn`, `error`).

---

## Custom Cell Types

Plugins can define new cell types that appear in the notebook UI:

```typescript
cellTypes: [
  {
    type: 'sql',
    displayName: 'SQL Query',
    icon: 'database',
    supportsDualMode: true
  }
]
```

---

## Example: Simple Word Counter

```typescript
const wordCounterPlugin = {
  id: 'word-counter',
  name: 'Word Counter',
  version: '1.0.0',
  setup(ctx) {
    ctx.on('cell:updated', ({ data }) => {
      const cell = ctx.getCell(data.cellId);
      const words = cell.source.split(/\s+/).length;
      ctx.log.info(`Cell ${cell.id} now has ${words} words`);
    });
  }
};

engine.registerPlugin(wordCounterPlugin);
```
