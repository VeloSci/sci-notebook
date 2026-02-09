import { Cell, CellMetadata, CellType, Notebook, SciNotebookPlugin, PluginContext } from "./types";
import { EventBus, EventHandler, Unsubscribe } from "./event-bus";
import { HistoryManager, Command } from "./history";
import { KeybindingManager } from "./keybindings";
import { SelectionState, createInitialSelection } from "./selection";
import { generateCellId } from "./utils";

export interface EditorEngineConfig {
  maxHistory?: number;
  defaultCellType?: CellType;
  startInEditMode?: boolean;
  plugins?: SciNotebookPlugin[];
}

export class EditorEngine {
  private notebook: Notebook;
  private history: HistoryManager;
  private bus: EventBus;
  private keybindings: KeybindingManager;
  private selection: SelectionState;
  private config: EditorEngineConfig;
  private clipboard: Cell[] = [];
  private plugins: Map<string, { plugin: SciNotebookPlugin; context: PluginContext }> = new Map();
  private destroyed = false;

  constructor(notebook: Notebook, config: EditorEngineConfig = {}) {
    this.notebook = JSON.parse(JSON.stringify(notebook));
    this.config = config;
    this.bus = new EventBus();
    this.history = new HistoryManager(config.maxHistory);
    this.keybindings = new KeybindingManager();
    this.selection = createInitialSelection();

    if (config.plugins) {
      for (const plugin of config.plugins) {
        this.registerPlugin(plugin);
      }
    }
  }

  // --- Notebook access ---
  getNotebook(): Readonly<Notebook> { return this.notebook; }
  getCells(): ReadonlyArray<Cell> { return this.notebook.cells; }
  getCell(id: string): Readonly<Cell> | undefined {
    return this.notebook.cells.find((c) => c.id === id);
  }

  // --- Notebook mutation ---
  updateTitle(title: string): void {
    const oldTitle = this.notebook.title;
    if (oldTitle === title) return;
    this.notebook = { ...this.notebook, title, updatedAt: new Date().toISOString() };
    this.bus.emit("notebook:updated", { notebook: this.notebook });
  }

  updateMetadata(meta: Partial<Notebook["metadata"]>): void {
    this.notebook = {
      ...this.notebook,
      metadata: { ...this.notebook.metadata, ...meta },
      updatedAt: new Date().toISOString(),
    };
    this.bus.emit("notebook:updated", { notebook: this.notebook });
  }

  // --- Cell CRUD ---
  insertCell(index: number, type?: CellType, source: string = ""): Cell {
    const cellType = type || this.config.defaultCellType || "markdown";
    const cell: Cell = {
      id: generateCellId(),
      type: cellType,
      source,
      metadata: {},
      editing: this.config.startInEditMode,
    };

    const clampedIndex = Math.max(0, Math.min(index, this.notebook.cells.length));

    const execute = () => {
      const cells = [...this.notebook.cells];
      cells.splice(clampedIndex, 0, cell);
      this.notebook = { ...this.notebook, cells, updatedAt: new Date().toISOString() };
      this.bus.emit("cell:created", { cell, index: clampedIndex });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const undo = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.filter(c => c.id !== cell.id),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:deleted", { cellId: cell.id });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const cmd: Command = { label: "Insert Cell", execute, undo };
    cmd.execute();
    this.history.push(cmd);
    return cell;
  }

  insertCellAfter(refId: string, type?: CellType, source?: string): Cell {
    const index = this.notebook.cells.findIndex(c => c.id === refId);
    return this.insertCell(index === -1 ? this.notebook.cells.length : index + 1, type, source);
  }

  insertCellBefore(refId: string, type?: CellType, source?: string): Cell {
    const index = this.notebook.cells.findIndex(c => c.id === refId);
    return this.insertCell(index === -1 ? 0 : index, type, source);
  }

  deleteCell(id: string): void {
    const index = this.notebook.cells.findIndex((c) => c.id === id);
    if (index === -1) return;

    const cell = { ...this.notebook.cells[index] };
    const execute = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.filter(c => c.id !== id),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:deleted", { cellId: id });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const undo = () => {
      const cells = [...this.notebook.cells];
      cells.splice(index, 0, cell);
      this.notebook = { ...this.notebook, cells, updatedAt: new Date().toISOString() };
      this.bus.emit("cell:created", { cell, index });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const cmd: Command = { label: "Delete Cell", execute, undo };
    cmd.execute();
    this.history.push(cmd);
  }

  deleteCells(ids: string[]): void {
    for (const id of ids) this.deleteCell(id);
  }

  moveCell(id: string, toIndex: number): void {
    const fromIndex = this.notebook.cells.findIndex(c => c.id === id);
    if (fromIndex === -1 || fromIndex === toIndex) return;

    const clamped = Math.max(0, Math.min(toIndex, this.notebook.cells.length - 1));

    const execute = () => {
      const cells = [...this.notebook.cells];
      const [cell] = cells.splice(fromIndex, 1);
      cells.splice(clamped, 0, cell);
      this.notebook = { ...this.notebook, cells, updatedAt: new Date().toISOString() };
      this.bus.emit("cell:moved", { cellId: id, fromIndex, toIndex: clamped });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const undo = () => {
      const cells = [...this.notebook.cells];
      const [cell] = cells.splice(clamped, 1);
      cells.splice(fromIndex, 0, cell);
      this.notebook = { ...this.notebook, cells, updatedAt: new Date().toISOString() };
      this.bus.emit("cell:moved", { cellId: id, fromIndex: clamped, toIndex: fromIndex });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const cmd: Command = { label: "Move Cell", execute, undo };
    cmd.execute();
    this.history.push(cmd);
  }

  duplicateCell(id: string): Cell | null {
    const index = this.notebook.cells.findIndex(c => c.id === id);
    if (index === -1) return null;
    const original = this.notebook.cells[index];
    return this.insertCell(index + 1, original.type, original.source);
  }

  // --- Cell content ---
  updateCellSource(id: string, source: string): void {
    const cell = this.notebook.cells.find((c) => c.id === id);
    if (!cell || cell.source === source) return;

    const oldSource = cell.source;
    const execute = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === id ? { ...c, source } : c),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:updated", { cellId: id, source });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const undo = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === id ? { ...c, source: oldSource } : c),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:updated", { cellId: id, source: oldSource });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const cmd: Command = { label: "Update Cell Source", execute, undo };
    cmd.execute();
    this.history.push(cmd);
  }

  updateCellMetadata(id: string, meta: Partial<CellMetadata>): void {
    const cell = this.notebook.cells.find(c => c.id === id);
    if (!cell) return;

    const oldMeta = { ...cell.metadata };
    const newMeta = { ...cell.metadata, ...meta };

    const execute = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === id ? { ...c, metadata: newMeta } : c),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:updated", { cellId: id, metadata: newMeta });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const undo = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === id ? { ...c, metadata: oldMeta } : c),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:updated", { cellId: id, metadata: oldMeta });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const cmd: Command = { label: "Update Cell Metadata", execute, undo };
    cmd.execute();
    this.history.push(cmd);
  }

  setCellType(id: string, type: CellType): void {
    const cell = this.notebook.cells.find(c => c.id === id);
    if (!cell || cell.type === type) return;

    const oldType = cell.type;
    const execute = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === id ? { ...c, type } : c),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:updated", { cellId: id, type });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const undo = () => {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === id ? { ...c, type: oldType } : c),
        updatedAt: new Date().toISOString(),
      };
      this.bus.emit("cell:updated", { cellId: id, type: oldType });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    };

    const cmd: Command = { label: "Change Cell Type", execute, undo };
    cmd.execute();
    this.history.push(cmd);
  }

  // --- Dual mode ---
  setEditMode(cellId: string): void {
    const cell = this.notebook.cells.find((c) => c.id === cellId);
    if (cell && !cell.editing) {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === cellId ? { ...c, editing: true } : c),
      };
      this.bus.emit("cell:mode-changed", { cellId, mode: "edit" });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    }
  }

  setViewMode(cellId: string): void {
    const cell = this.notebook.cells.find((c) => c.id === cellId);
    if (cell && cell.editing) {
      this.notebook = {
        ...this.notebook,
        cells: this.notebook.cells.map(c => c.id === cellId ? { ...c, editing: false } : c),
      };
      this.bus.emit("cell:mode-changed", { cellId, mode: "view" });
      this.bus.emit("notebook:updated", { notebook: this.notebook });
    }
  }

  toggleMode(cellId: string): void {
    const cell = this.notebook.cells.find(c => c.id === cellId);
    if (!cell) return;
    if (cell.editing) this.setViewMode(cellId);
    else this.setEditMode(cellId);
  }

  setAllEditMode(): void {
    this.notebook = {
      ...this.notebook,
      cells: this.notebook.cells.map(c => ({ ...c, editing: true })),
    };
    this.bus.emit("notebook:updated", { notebook: this.notebook });
  }

  setAllViewMode(): void {
    this.notebook = {
      ...this.notebook,
      cells: this.notebook.cells.map(c => ({ ...c, editing: false })),
    };
    this.bus.emit("notebook:updated", { notebook: this.notebook });
  }

  getMode(cellId: string): "edit" | "view" {
    const cell = this.notebook.cells.find(c => c.id === cellId);
    return cell?.editing ? "edit" : "view";
  }

  // --- Selection ---
  focusCell(id: string): void {
    this.selection.focusedCellId = id;
    this.selection.selectedCellIds.clear();
    this.selection.selectedCellIds.add(id);
    this.bus.emit("cell:focused", { cellId: id });
    this.bus.emit("selection:changed", { focusedCellId: id, selectedCellIds: [...this.selection.selectedCellIds] });
  }

  getFocusedCellId(): string | null {
    return this.selection.focusedCellId;
  }

  selectCells(ids: string[]): void {
    this.selection.selectedCellIds = new Set(ids);
    this.bus.emit("selection:changed", { focusedCellId: this.selection.focusedCellId, selectedCellIds: ids });
  }

  getSelectedCellIds(): string[] {
    return [...this.selection.selectedCellIds];
  }

  clearSelection(): void {
    this.selection.focusedCellId = null;
    this.selection.selectedCellIds.clear();
    this.selection.cursorOffset = null;
    this.selection.textSelection = null;
    this.bus.emit("selection:changed", { focusedCellId: null, selectedCellIds: [] });
  }

  // --- Split / Merge ---
  splitCell(id: string, cursorOffset: number): [Cell, Cell] | null {
    const index = this.notebook.cells.findIndex(c => c.id === id);
    if (index === -1) return null;
    const cell = this.notebook.cells[index];
    const before = cell.source.slice(0, cursorOffset);
    const after = cell.source.slice(cursorOffset);

    this.updateCellSource(id, before);
    const newCell = this.insertCell(index + 1, cell.type, after);
    return [this.getCell(id)! as Cell, newCell];
  }

  mergeCellUp(id: string): Cell | null {
    const index = this.notebook.cells.findIndex(c => c.id === id);
    if (index <= 0) return null;
    const prev = this.notebook.cells[index - 1];
    const current = this.notebook.cells[index];
    const merged = prev.source + current.source;
    this.updateCellSource(prev.id, merged);
    this.deleteCell(id);
    return this.getCell(prev.id) as Cell | null;
  }

  mergeCellDown(id: string): Cell | null {
    const index = this.notebook.cells.findIndex(c => c.id === id);
    if (index === -1 || index >= this.notebook.cells.length - 1) return null;
    const current = this.notebook.cells[index];
    const next = this.notebook.cells[index + 1];
    const merged = current.source + next.source;
    this.updateCellSource(id, merged);
    this.deleteCell(next.id);
    return this.getCell(id) as Cell | null;
  }

  // --- Clipboard ---
  copyCells(ids: string[]): void {
    this.clipboard = ids
      .map(id => this.notebook.cells.find(c => c.id === id))
      .filter((c): c is Cell => !!c)
      .map(c => ({ ...c }));
  }

  cutCells(ids: string[]): void {
    this.copyCells(ids);
    for (const id of ids) this.deleteCell(id);
  }

  pasteCells(afterId?: string): Cell[] {
    if (this.clipboard.length === 0) return [];
    let insertIndex: number;
    if (afterId) {
      const idx = this.notebook.cells.findIndex(c => c.id === afterId);
      insertIndex = idx === -1 ? this.notebook.cells.length : idx + 1;
    } else {
      insertIndex = this.notebook.cells.length;
    }

    const pasted: Cell[] = [];
    for (let i = 0; i < this.clipboard.length; i++) {
      const src = this.clipboard[i];
      const cell = this.insertCell(insertIndex + i, src.type, src.source);
      pasted.push(cell);
    }
    return pasted;
  }

  // --- Event Bus ---
  on(type: string, handler: EventHandler): Unsubscribe { return this.bus.on(type, handler); }
  emit(type: string, data: any): void { this.bus.emit(type, data); }

  // --- History ---
  undo(): void { this.history.undo(); }
  redo(): void { this.history.redo(); }
  canUndo(): boolean { return this.history.canUndo(); }
  canRedo(): boolean { return this.history.canRedo(); }
  checkpoint(label?: string): void { this.history.checkpoint(); }

  // --- Keybindings ---
  getKeybindingManager(): KeybindingManager { return this.keybindings; }

  handleKeyDown(event: KeyboardEvent): boolean {
    return this.keybindings.handleKeyDown(event);
  }

  // --- Plugin System ---
  registerPlugin(plugin: SciNotebookPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered`);
    }

    const ctx: PluginContext = {
      getNotebook: () => this.getNotebook(),
      getCell: (id) => this.getCell(id),
      updateCellSource: (id, source) => this.updateCellSource(id, source),
      updateCellMetadata: (id, meta) => this.updateCellMetadata(id, meta),
      insertCell: (index, type, source) => this.insertCell(index, type, source),
      deleteCell: (id) => this.deleteCell(id),
      on: (event, handler) => this.bus.on(event, handler),
      emit: (event, payload) => this.bus.emit(event, payload),
      addPreprocessor: () => { /* wired by renderer */ },
      addASTTransformer: () => { /* wired by renderer */ },
      addRenderer: () => { /* wired by renderer */ },
      addPostprocessor: () => { /* wired by renderer */ },
      log: {
        info: (msg) => console.log(`[${plugin.id}] ${msg}`),
        warn: (msg) => console.warn(`[${plugin.id}] ${msg}`),
        error: (msg) => console.error(`[${plugin.id}] ${msg}`),
      },
    };

    this.plugins.set(plugin.id, { plugin, context: ctx });

    if (plugin.setup) {
      plugin.setup(ctx);
    }

    this.bus.emit("plugin:registered", { pluginId: plugin.id });
  }

  unregisterPlugin(pluginId: string): void {
    const entry = this.plugins.get(pluginId);
    if (!entry) return;

    if (entry.plugin.teardown) {
      entry.plugin.teardown(entry.context);
    }

    this.plugins.delete(pluginId);
    this.bus.emit("plugin:unregistered", { pluginId });
  }

  getPlugin(pluginId: string): SciNotebookPlugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  getPluginContext(pluginId: string): PluginContext | undefined {
    return this.plugins.get(pluginId)?.context;
  }

  listPlugins(): Array<{ id: string; name: string; version: string }> {
    return Array.from(this.plugins.values()).map(({ plugin }) => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
    }));
  }

  // --- Lifecycle ---
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    for (const [id] of this.plugins) {
      this.unregisterPlugin(id);
    }

    this.bus.removeAllListeners();
    this.history.clear();
    this.clipboard = [];
  }
}
