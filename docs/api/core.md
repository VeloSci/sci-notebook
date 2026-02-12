# Core API Reference

The `@velo-sci/notebook-core` package contains the fundamental data models, the state engine, and utility modules for managing scientific notebooks.

## Factory Functions

### `createNotebook(options?): EditorEngine`

The recommended way to create a new notebook engine instance.

```typescript
import { createNotebook } from '@velo-sci/notebook-core';

const engine = createNotebook({
  notebook: {
    title: 'My Notebook',
    cells: [{ id: 'c1', type: 'markdown', source: '# Hello', metadata: {} }],
  },
  config: { maxHistory: 100, plugins: [] },
});
```

### `loadNotebook(json: string | object): Notebook`

Parses, migrates, and validates a notebook from JSON. Throws on critical validation errors.

```typescript
import { loadNotebook } from '@velo-sci/notebook-core';

const notebook = loadNotebook(jsonString);
```

### `saveNotebook(notebook: Notebook, pretty?: boolean): string`

Serializes a notebook to JSON.

```typescript
import { saveNotebook } from '@velo-sci/notebook-core';

const json = saveNotebook(engine.getNotebook());
```

---

## Types

### CellType

```typescript
type CellType =
  | "markdown" | "code" | "raw" | "latex"
  | "mermaid" | "embed" | "table" | "image"
  | string; // extensible via plugins
```

### Notebook

```typescript
interface Notebook {
  id: string;                    // Unique identifier (nanoid)
  title: string;                 // Human-readable title
  cells: Cell[];                 // Ordered list of cells
  metadata: NotebookMetadata;    // Author, tags, theme, pluginData, etc.
  version: number;               // Schema version
  createdAt: string;             // ISO-8601 timestamp
  updatedAt: string;             // ISO-8601 timestamp
}
```

### NotebookMetadata

```typescript
interface NotebookMetadata {
  author?: string;
  tags?: string[];
  theme?: string;
  defaultCellType?: CellType;
  defaultLanguage?: string;
  pluginData?: Record<string, unknown>;
  [key: string]: unknown;
}
```

### Cell

```typescript
interface Cell {
  id: string;                    // Unique identifier within the notebook
  type: CellType;                // Determines rendering strategy
  source: string;                // Raw source content
  metadata: CellMetadata;        // Language, lineNumbers, className, etc.
  outputs?: CellOutput[];        // Execution outputs (code cells)
  editing?: boolean;             // Whether in edit mode
  collapsed?: boolean;           // Whether collapsed in the UI
}
```

### CellMetadata

```typescript
interface CellMetadata {
  language?: string;
  lineNumbers?: boolean;
  className?: string;
  pluginData?: Record<string, unknown>;
  executionCount?: number;
  [key: string]: unknown;
}
```

### CellOutput

```typescript
type CellOutput = StreamOutput | DisplayOutput | ErrorOutput;

interface StreamOutput {
  outputType: "stream";
  name: "stdout" | "stderr";
  text: string;
}

interface DisplayOutput {
  outputType: "display";
  data: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface ErrorOutput {
  outputType: "error";
  name: string;
  message: string;
  traceback?: string[];
}
```

---

## EditorEngine

The `EditorEngine` is the central controller for notebook state. It handles all mutations, provides undo/redo history, and emits events for real-time UI updates.

### Constructor

```typescript
constructor(notebook: Notebook, config: EditorEngineConfig = {})
```

```typescript
interface EditorEngineConfig {
  maxHistory?: number;           // Max undo/redo steps
  defaultCellType?: CellType;   // Default type for new cells
  startInEditMode?: boolean;    // New cells start in edit mode
  plugins?: SciNotebookPlugin[];// Plugins to register on init
}
```

::: tip
Prefer `createNotebook()` over calling the constructor directly — it handles ID generation, timestamps, and defaults.
:::

### Notebook Access

#### `getNotebook(): Readonly<Notebook>`
Returns the current immutable notebook state.

#### `getCells(): ReadonlyArray<Cell>`
Returns the ordered list of cells.

#### `getCell(id: string): Readonly<Cell> | undefined`
Returns a single cell by ID, or `undefined` if not found.

### Notebook Mutation

#### `updateTitle(title: string): void`
Updates the notebook title. Emits `notebook:updated`.

#### `updateMetadata(meta: Partial<NotebookMetadata>): void`
Merges metadata into the notebook. Emits `notebook:updated`.

### Cell CRUD

All CRUD operations support **undo/redo**.

#### `insertCell(index: number, type?: CellType, source?: string): Cell`
Inserts a new cell at the specified index. Returns the created cell.

#### `insertCellAfter(refId: string, type?: CellType, source?: string): Cell`
Inserts a new cell after the cell with the given ID.

#### `insertCellBefore(refId: string, type?: CellType, source?: string): Cell`
Inserts a new cell before the cell with the given ID.

#### `deleteCell(id: string): void`
Removes a cell by ID.

#### `deleteCells(ids: string[]): void`
Removes multiple cells by ID.

#### `moveCell(id: string, toIndex: number): void`
Moves a cell to a new position.

#### `duplicateCell(id: string): Cell | null`
Duplicates a cell, inserting the copy immediately after the original.

### Cell Content

#### `updateCellSource(id: string, source: string): void`
Updates the raw content of a cell. Supports undo/redo.

#### `updateCellMetadata(id: string, meta: Partial<CellMetadata>): void`
Merges metadata into a cell. Supports undo/redo.

#### `setCellType(id: string, type: CellType): void`
Changes the type of a cell. Supports undo/redo.

### Dual Mode (Edit / View)

#### `setEditMode(cellId: string): void`
Sets a cell to editing mode. Emits `cell:mode-changed`.

#### `setViewMode(cellId: string): void`
Sets a cell to view (rendered) mode. Emits `cell:mode-changed`.

#### `toggleMode(cellId: string): void`
Toggles a cell between edit and view mode.

#### `setAllEditMode(): void`
Sets **all** cells to edit mode.

#### `setAllViewMode(): void`
Sets **all** cells to view mode.

#### `getMode(cellId: string): "edit" | "view"`
Returns the current mode of a cell.

### Selection

#### `focusCell(id: string): void`
Sets focus to a specific cell. Emits `cell:focused` and `selection:changed`.

#### `getFocusedCellId(): string | null`
Returns the ID of the currently focused cell.

#### `selectCells(ids: string[]): void`
Selects multiple cells. Emits `selection:changed`.

#### `getSelectedCellIds(): string[]`
Returns the IDs of all selected cells.

#### `clearSelection(): void`
Clears focus and selection.

### Split / Merge

#### `splitCell(id: string, cursorOffset: number): [Cell, Cell] | null`
Splits a cell at the cursor position into two cells.

#### `mergeCellUp(id: string): Cell | null`
Merges a cell with the one above it.

#### `mergeCellDown(id: string): Cell | null`
Merges a cell with the one below it.

### Clipboard

#### `copyCells(ids: string[]): void`
Copies cells to the internal clipboard.

#### `cutCells(ids: string[]): void`
Copies cells to the clipboard and deletes them.

#### `pasteCells(afterId?: string): Cell[]`
Pastes clipboard contents after the specified cell (or at the end).

### History (Undo / Redo)

#### `undo(): void`
Undoes the last operation.

#### `redo(): void`
Redoes the last undone operation.

#### `canUndo(): boolean`
Returns `true` if there are operations to undo.

#### `canRedo(): boolean`
Returns `true` if there are operations to redo.

#### `checkpoint(label?: string): void`
Creates a checkpoint in the history.

### Event Bus

#### `on(type: string, handler: EventHandler): Unsubscribe`
Subscribes to engine events. Returns an unsubscribe function.

#### `emit(type: string, data: any): void`
Emits a custom event.

### Plugin System

#### `registerPlugin(plugin: SciNotebookPlugin): void`
Registers a plugin. Throws if a plugin with the same ID is already registered.

#### `unregisterPlugin(pluginId: string): void`
Unregisters a plugin and calls its `teardown()` method.

#### `getPlugin(pluginId: string): SciNotebookPlugin | undefined`
Returns a registered plugin by ID.

#### `getPluginContext(pluginId: string): PluginContext | undefined`
Returns the context object for a registered plugin.

#### `listPlugins(): Array<{ id: string; name: string; version: string }>`
Lists all registered plugins.

### Keybindings

#### `getKeybindingManager(): KeybindingManager`
Returns the `KeybindingManager` instance for registering custom shortcuts.

```typescript
const kb = engine.getKeybindingManager();
kb.register({
  combo: 'cmd+enter',
  action: 'execute-cell',
  context: 'edit',
  handler: () => engine.setViewMode(currentCellId)
});
```

#### `handleKeyDown(event: KeyboardEvent): boolean`
Delegates a keyboard event to the keybinding manager. Returns `true` if a binding was matched.

### Lifecycle

#### `destroy(): void`
Tears down all plugins, clears event listeners, history, and clipboard. Call this when unmounting.

---

## Event Reference

The engine emits the following events:

| Event | Payload | When |
|-------|---------|------|
| `notebook:updated` | `{ notebook }` | Any state change |
| `cell:created` | `{ cell, index }` | Cell inserted |
| `cell:deleted` | `{ cellId }` | Cell removed |
| `cell:updated` | `{ cellId, source?, metadata?, type? }` | Cell content changed |
| `cell:moved` | `{ cellId, fromIndex, toIndex }` | Cell reordered |
| `cell:mode-changed` | `{ cellId, mode }` | Edit/view toggle |
| `cell:focused` | `{ cellId }` | Cell gains focus |
| `selection:changed` | `{ focusedCellId, selectedCellIds }` | Selection changes |
| `plugin:registered` | `{ pluginId }` | Plugin registered |
| `plugin:unregistered` | `{ pluginId }` | Plugin unregistered |

---

## Additional Modules

The core package also exports:

- **`EventBus`** — Typed pub-sub system (`on`, `off`, `once`, `emit`, `removeAllListeners`)
- **`HistoryManager`** — Command-pattern undo/redo stack
- **`KeybindingManager`** — Keyboard shortcut registration and dispatch
- **`TemplateEngine`** — `{{flag}}` template resolution with async resolvers and filters
- **`ExportEngine`** — Export to HTML, Markdown, `.ipynb`, JSON (`downloadExport()`)
- **`CodeExecutor`** — JS sandbox execution with console capture and timeout
- **`VersionHistory`** — Save/restore/diff snapshots with `detailedDiff()` and `computeLineDiff()`
- **`PresentationEngine`** — Slideshow with 3 split modes, transitions, auto-advance, fullscreen
- **`MobileAdapter`** — Touch events, swipe gestures, responsive helpers
