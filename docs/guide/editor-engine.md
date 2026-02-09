# 03 — Editor Engine & Dual-Mode System

## Responsibilities

The editor engine is the central orchestrator. It owns:

1. **Cell lifecycle** — create, delete, move, split, merge cells.
2. **Dual-mode toggle** — per-cell edit/view switching.
3. **Selection model** — which cell is focused, text cursor position.
4. **Undo/Redo** — command-based history with configurable depth.
5. **Keybinding system** — extensible keyboard shortcuts.
6. **Clipboard** — copy/cut/paste cells or cell content.
7. **Drag & drop** — reorder cells via drag handle.

The engine is **pure TypeScript** — no DOM, no framework. It operates on the
`Notebook` data model and emits events via the Event Bus.

---

## EditorEngine Class

```typescript
interface EditorEngineConfig {
  /** Maximum undo history depth (default: 100) */
  maxHistory?: number;

  /** Default cell type for new cells */
  defaultCellType?: CellType;

  /** Whether to start all cells in edit mode */
  startInEditMode?: boolean;

  /** Keybinding overrides */
  keybindings?: Partial<KeybindingMap>;

  /** Registered plugins (injected at creation) */
  plugins?: SciNotebookPlugin[];
}

class EditorEngine {
  private notebook: Notebook;
  private history: HistoryManager;
  private bus: EventBus;
  private plugins: PluginManager;
  private keybindings: KeybindingManager;
  private selection: SelectionState;

  constructor(notebook: Notebook, config?: EditorEngineConfig);

  // --- Notebook access ---
  getNotebook(): Readonly<Notebook>;
  getCell(id: string): Readonly<Cell> | undefined;
  getCells(): ReadonlyArray<Cell>;

  // --- Cell CRUD ---
  insertCell(index: number, type?: CellType): Cell;
  insertCellAfter(refId: string, type?: CellType): Cell;
  insertCellBefore(refId: string, type?: CellType): Cell;
  deleteCell(id: string): void;
  deleteCells(ids: string[]): void;
  moveCell(id: string, toIndex: number): void;
  duplicateCell(id: string): Cell;

  // --- Cell content ---
  updateCellSource(id: string, source: string): void;
  updateCellMetadata(id: string, meta: Partial<CellMetadata>): void;
  setCellType(id: string, type: CellType): void;

  // --- Dual mode ---
  setEditMode(cellId: string): void;
  setViewMode(cellId: string): void;
  toggleMode(cellId: string): void;
  setAllEditMode(): void;
  setAllViewMode(): void;
  getMode(cellId: string): "edit" | "view";

  // --- Selection ---
  focusCell(id: string): void;
  getFocusedCellId(): string | null;
  selectCells(ids: string[]): void;
  getSelectedCellIds(): string[];
  clearSelection(): void;

  // --- History ---
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  checkpoint(label?: string): void;

  // --- Clipboard ---
  copyCells(ids: string[]): void;
  cutCells(ids: string[]): void;
  pasteCells(afterId?: string): Cell[];

  // --- Split / Merge ---
  splitCell(id: string, cursorOffset: number): [Cell, Cell];
  mergeCellUp(id: string): Cell | null;
  mergeCellDown(id: string): Cell | null;

  // --- Lifecycle ---
  destroy(): void;

  // --- Event Bus (delegate) ---
  on<T extends EventType>(type: T, handler: EventHandler<T>): Unsubscribe;
  emit<T extends EventType>(type: T, payload: EventPayload<T>): void;
}
```

---

## Dual-Mode System

### Per-Cell Mode

Each cell independently tracks its mode (`editing` field on the `Cell` model).

**Edit mode:**
- The cell renders a text editor (plain `<textarea>`, CodeMirror, Monaco, or
  any adapter-provided input).
- Raw Markdown/LaTeX/Mermaid source is visible.
- Syntax highlighting is optional (provided by adapter or plugin).
- AI completions are active (if plugin is loaded).

**View mode:**
- The cell's `source` is passed through the rendering pipeline.
- The rendered output (HTML) replaces the editor.
- Clicking the rendered cell switches it back to edit mode.
- Double-click or Enter on a focused cell also enters edit mode.

### Mode Transitions

```
┌──────────┐  click / Enter / dblclick  ┌──────────┐
│   VIEW   │ ─────────────────────────► │   EDIT   │
│   mode   │                            │   mode   │
│          │ ◄───────────────────────── │          │
└──────────┘  Escape / blur / Cmd+Enter └──────────┘
```

### Notebook-Level Mode

The engine also supports a global toggle:
- `setAllEditMode()` — every cell enters edit mode (raw MD view).
- `setAllViewMode()` — every cell enters view mode (rendered).

This is useful for "presentation mode" or "source mode" toggles in the toolbar.

---

## Selection Model

```typescript
interface SelectionState {
  /** Currently focused cell ID (keyboard navigation target) */
  focusedCellId: string | null;

  /** Set of selected cell IDs (for multi-select operations) */
  selectedCellIds: Set<string>;

  /** Text cursor position within the focused cell (for split/merge) */
  cursorOffset: number | null;

  /** Text selection range within the focused cell */
  textSelection: { start: number; end: number } | null;
}
```

**Navigation rules:**
- `ArrowUp` at the top of a cell → focus previous cell (cursor at end).
- `ArrowDown` at the bottom of a cell → focus next cell (cursor at start).
- `Shift+ArrowUp/Down` → extend cell selection.
- `Cmd/Ctrl+A` → select all cells (if already all text is selected in current cell).
- `Tab` → indent (in edit mode) or focus next cell (in view mode).

---

## Undo/Redo (History Manager)

### Command Pattern

Every mutation is wrapped in a `Command` object:

```typescript
interface Command {
  /** Human-readable label for the undo stack UI */
  label: string;

  /** Apply the mutation */
  execute(): void;

  /** Reverse the mutation */
  undo(): void;
}
```

### Batching

Rapid keystrokes are batched into a single undo entry using a debounce timer
(default: 300ms). The `checkpoint()` method forces a new undo boundary.

### History Manager

```typescript
class HistoryManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private maxDepth: number;
  private batchTimer: ReturnType<typeof setTimeout> | null;
  private currentBatch: Command[];

  constructor(maxDepth?: number);

  push(cmd: Command): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  checkpoint(): void;
  clear(): void;
}
```

---

## Keybinding System

### Default Keybindings

| Key                    | Action                          | Context     |
|------------------------|---------------------------------|-------------|
| `Enter`                | Enter edit mode on focused cell | view mode   |
| `Escape`               | Exit edit mode                  | edit mode   |
| `Cmd+Enter`            | Run cell & advance (if plugin)  | edit mode   |
| `Shift+Enter`          | Exit edit mode & focus next     | edit mode   |
| `ArrowUp/Down`         | Navigate cells                  | view mode   |
| `Cmd+Shift+D`          | Delete focused cell             | any         |
| `Cmd+Shift+ArrowUp`    | Move cell up                    | any         |
| `Cmd+Shift+ArrowDown`  | Move cell down                  | any         |
| `Cmd+Z`                | Undo                            | any         |
| `Cmd+Shift+Z`          | Redo                            | any         |
| `Cmd+B`                | Toggle bold (insert `**`)       | edit mode   |
| `Cmd+I`                | Toggle italic (insert `*`)      | edit mode   |
| `Cmd+K`                | Insert link                     | edit mode   |
| `Cmd+Shift+M`          | Insert math block               | edit mode   |
| `Cmd+/`                | Toggle cell type (md ↔ code)    | any         |

### KeybindingManager

```typescript
type KeyCombo = string; // e.g., "cmd+shift+d", "escape"

interface KeybindingEntry {
  combo: KeyCombo;
  action: string;          // action identifier
  context?: "edit" | "view" | "any";
  handler: () => void;
}

class KeybindingManager {
  private bindings: Map<string, KeybindingEntry>;

  register(entry: KeybindingEntry): void;
  unregister(combo: KeyCombo): void;
  override(combo: KeyCombo, handler: () => void): void;
  handleKeyDown(event: KeyboardEvent): boolean;
  getAll(): KeybindingEntry[];
}
```

Plugins can register additional keybindings via `plugin.keybindings`.

---

## Cell Split & Merge

### Split

When the cursor is in the middle of a cell and the user triggers split
(e.g., `Cmd+Shift+Enter`):

1. The source is split at `cursorOffset`.
2. The original cell keeps the text before the cursor.
3. A new cell is created after it with the text after the cursor.
4. Both cells inherit the same type and metadata.
5. Focus moves to the new cell at offset 0.

### Merge Up

When the cursor is at the start of a cell and the user presses `Backspace`:

1. The current cell's source is appended to the previous cell's source.
2. The current cell is deleted.
3. Focus moves to the previous cell at the join point.

### Merge Down

Symmetric to merge up, triggered by `Delete` at the end of a cell.

---

## Event Bus

```typescript
type EventType =
  | "cell:created"
  | "cell:deleted"
  | "cell:updated"
  | "cell:moved"
  | "cell:mode-changed"
  | "cell:focused"
  | "selection:changed"
  | "history:undo"
  | "history:redo"
  | "history:checkpoint"
  | "notebook:updated"
  | "plugin:registered"
  | "plugin:unregistered"
  | string; // plugins can emit custom events

interface EventPayload<T extends EventType> {
  type: T;
  timestamp: number;
  data: EventDataMap[T];
}

type Unsubscribe = () => void;

class EventBus {
  on<T extends EventType>(type: T, handler: (payload: EventPayload<T>) => void): Unsubscribe;
  once<T extends EventType>(type: T, handler: (payload: EventPayload<T>) => void): Unsubscribe;
  emit<T extends EventType>(type: T, data: EventDataMap[T]): void;
  off<T extends EventType>(type: T, handler: (payload: EventPayload<T>) => void): void;
  removeAllListeners(type?: EventType): void;
}
```

The bus is synchronous by default. Async listeners can wrap their logic in
`queueMicrotask` or `setTimeout` if needed.

---

## Drag & Drop (Cell Reorder)

The engine provides the data layer for drag & drop:

```typescript
// Engine methods
startDrag(cellId: string): void;
dragOver(targetIndex: number): void;
endDrag(): void;
cancelDrag(): void;
getDragState(): { dragging: boolean; cellId: string | null; targetIndex: number | null };
```

The actual DOM drag handling is implemented by the framework adapter.
The engine only tracks state and emits `cell:moved` events.
