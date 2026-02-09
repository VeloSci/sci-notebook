# Core API Reference

The `@sci-notebook/core` package contains the fundamental data models and the state engine for managing scientific notebooks.

## Types

### Notebook
The root object representing a scientific notebook.

```typescript
interface Notebook {
  id: string;             // Unique identifier
  title: string;          // Human-readable title
  cells: Cell[];          // Ordered list of cells
  metadata: NotebookMetadata;
  version: number;        // Schema version
  createdAt: string;      // ISO-8601 timestamp
  updatedAt: string;      // ISO-8601 timestamp
}
```

### Cell
A single unit of content within a notebook.

```typescript
interface Cell {
  id: string;             // Unique identifier within the notebook
  type: CellType;         // "markdown", "code", "latex", etc.
  source: string;         // Raw input text
  metadata: CellMetadata;
  outputs?: CellOutput[]; // Execution outputs
  editing?: boolean;      // Edit mode state
  collapsed?: boolean;    // Visibility state
}
```

---

## EditorEngine

The `EditorEngine` is the central controller for notebook state. It handles all mutations, provides undo/redo history, and emits events for real-time UI updates.

### Constructor

```typescript
constructor(notebook: Notebook, config: EditorEngineConfig = {})
```

### Methods

#### `getNotebook(): Readonly<Notebook>`
Returns the current notebook state.

#### `insertCell(index: number, type?: CellType, source?: string): Cell`
Inserts a new cell at the specified index. Supports undo/redo.

#### `deleteCell(id: string): void`
Removes a cell by ID. Supports undo/redo.

#### `updateCellSource(id: string, source: string): void`
Updates the content of a cell. Supports undo/redo.

#### `setEditMode(cellId: string): void`
Toggles a cell into editing mode.

#### `setViewMode(cellId: string): void`
Toggles a cell into viewing (rendered) mode.

#### `focusCell(id: string): void`
Sets the focus to a specific cell.

#### `undo() / redo()`
Traverses the command history.

#### `on(event: string, handler: Function): Unsubscribe`
Subscribes to engine events (e.g., `notebook:updated`, `cell:focused`).

---

## Event Bus

The engine uses a typed event bus for all updates:

- `notebook:updated`: Emitted whenever any part of the notebook state changes.
- `cell:updated`: Emitted when a cell's source is modified.
- `cell:mode-changed`: Emitted when toggling between edit and view modes.
- `cell:focused`: Emitted when a cell gains focus.

---

## KeybindingManager

Handles keyboard shortcuts across different contexts (edit vs. view mode).

### Methods

#### `register(entry: KeybindingEntry): void`
Registers a new shortcut.

```typescript
engine.keybindings.register({
  combo: 'cmd+enter',
  action: 'execute-cell',
  context: 'edit',
  handler: () => engine.setViewMode(currentCellId)
});
```

#### `handleKeyDown(event: KeyboardEvent): boolean`
Entry point for event listeners. Returns `true` if a binding was matched and executed.
