import {
  EditorEngine,
  createNotebook,
  Notebook,
  Cell,
  CellType,
  SciNotebookPlugin,
} from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { DOMCellRenderer } from "./dom-cell-renderer";
import { DragDropManager } from "./drag-drop-manager";
import { KeyboardHandler } from "./keyboard-handler";

export interface VanillaCellRenderer {
  (cell: Cell, container: HTMLElement): void;
}

export interface SciNotebookVanillaOptions {
  /** Target DOM element or CSS selector */
  target: HTMLElement | string;
  /** Pre-built notebook object */
  notebook?: Notebook;
  /** Pre-built engine (takes priority over notebook) */
  engine?: EditorEngine;
  /** Plugins to register */
  plugins?: SciNotebookPlugin[];
  /** Theme */
  theme?: "light" | "dark" | string;
  /** Callback when notebook changes */
  onChange?: (notebook: Notebook) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Custom cell renderer override */
  customCellRenderer?: VanillaCellRenderer;
  /** Show TOC sidebar */
  showTOC?: boolean;
}

/**
 * Vanilla JS adapter for sci-notebook.
 * No framework dependency — pure DOM manipulation.
 *
 * Usage:
 * ```js
 * const nb = new SciNotebookVanilla({
 *   target: '#app',
 *   notebook: myNotebook,
 *   theme: 'dark',
 *   onChange: (nb) => console.log('changed', nb),
 * });
 * nb.destroy();
 * ```
 */
export class SciNotebookVanilla {
  private engine: EditorEngine;
  private container: HTMLElement;
  private cellsContainer!: HTMLElement;
  private domRenderer: DOMCellRenderer;
  private dragDrop: DragDropManager | null = null;
  private keyboard: KeyboardHandler | null = null;
  private pipeline: RenderPipeline;
  private options: SciNotebookVanillaOptions;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  constructor(options: SciNotebookVanillaOptions) {
    this.options = options;

    // Resolve target element
    if (typeof options.target === "string") {
      const el = document.querySelector<HTMLElement>(options.target);
      if (!el) throw new Error(`SciNotebookVanilla: target "${options.target}" not found`);
      this.container = el;
    } else {
      this.container = options.target;
    }

    // Create or use engine
    if (options.engine) {
      this.engine = options.engine;
    } else {
      this.engine = createNotebook({
        notebook: options.notebook,
        config: { plugins: options.plugins },
      });
    }

    this.pipeline = new RenderPipeline();
    this.domRenderer = new DOMCellRenderer(this.pipeline);

    this.render();
    this.bindEvents();
  }

  // --- Public API ---

  getEngine(): EditorEngine {
    return this.engine;
  }

  getNotebook(): Readonly<Notebook> {
    return this.engine.getNotebook();
  }

  setTheme(theme: string): void {
    this.options.theme = theme;
    this.container.dataset.theme = theme;
  }

  insertCell(index: number, type?: CellType, source?: string): Cell {
    return this.engine.insertCell(index, type, source);
  }

  deleteCell(id: string): void {
    this.engine.deleteCell(id);
  }

  updateCellSource(id: string, source: string): void {
    this.engine.updateCellSource(id, source);
  }

  undo(): void { this.engine.undo(); }
  redo(): void { this.engine.redo(); }

  /**
   * Force a full re-render.
   */
  refresh(): void {
    this.renderCells();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];

    this.dragDrop?.destroy();
    this.keyboard?.destroy();
    this.engine.destroy();
    this.container.innerHTML = "";
  }

  // --- Private rendering ---

  private render(): void {
    this.container.innerHTML = "";
    this.container.className = "sci-nb sci-nb--vanilla";
    this.container.dataset.theme = this.options.theme || "light";
    this.container.tabIndex = 0;

    // Toolbar
    if (this.options.showToolbar !== false) {
      this.container.appendChild(this.createToolbar());
    }

    // Layout wrapper
    const layout = document.createElement("div");
    layout.className = "sci-nb-layout";
    layout.style.display = "flex";
    layout.style.gap = "16px";

    // TOC sidebar
    if (this.options.showTOC) {
      layout.appendChild(this.createTOCSidebar());
    }

    // Cells container
    this.cellsContainer = document.createElement("div");
    this.cellsContainer.className = "sci-nb-cells";
    this.cellsContainer.style.flex = "1";
    layout.appendChild(this.cellsContainer);

    this.container.appendChild(layout);

    this.renderCells();

    // Init drag & keyboard
    if (!this.options.readOnly) {
      this.dragDrop = new DragDropManager(this.engine, this.cellsContainer);
      this.keyboard = new KeyboardHandler(this.engine, this.container);
    }
  }

  private renderCells(): void {
    this.cellsContainer.innerHTML = "";
    const cells = this.engine.getCells();

    if (cells.length === 0) {
      const empty = document.createElement("div");
      empty.className = "sci-nb-empty";
      empty.innerHTML = `<p>Empty notebook. Add a cell to get started.</p>`;
      empty.appendChild(this.domRenderer.createInsertHandle(0));
      this.cellsContainer.appendChild(empty);
      return;
    }

    // Insert handle before first cell
    this.cellsContainer.appendChild(this.domRenderer.createInsertHandle(0));

    cells.forEach((cell, idx) => {
      const el = this.domRenderer.createCellElement(cell, idx);
      this.cellsContainer.appendChild(el);
      this.cellsContainer.appendChild(this.domRenderer.createInsertHandle(idx + 1));
    });
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement("div");
    toolbar.className = "sci-nb-toolbar";

    const nb = this.engine.getNotebook();
    toolbar.innerHTML = `
      <div class="sci-nb-toolbar-group">
        <span class="sci-nb-toolbar-title">${this.escapeHtml(nb.title)}</span>
      </div>
      <div class="sci-nb-toolbar-group">
        <button class="sci-nb-toolbar-btn" data-toolbar="undo" title="Undo (Ctrl+Z)">Undo</button>
        <button class="sci-nb-toolbar-btn" data-toolbar="redo" title="Redo (Ctrl+Shift+Z)">Redo</button>
        <span class="sci-nb-toolbar-sep"></span>
        <button class="sci-nb-toolbar-btn" data-toolbar="edit-all" title="Edit all cells">Edit All</button>
        <button class="sci-nb-toolbar-btn" data-toolbar="view-all" title="Preview all cells">View All</button>
      </div>
    `;

    return toolbar;
  }

  private createTOCSidebar(): HTMLElement {
    const sidebar = document.createElement("aside");
    sidebar.className = "sci-nb-toc";
    this.updateTOC(sidebar);
    return sidebar;
  }

  private updateTOC(sidebar?: HTMLElement): void {
    const toc = sidebar || this.container.querySelector<HTMLElement>(".sci-nb-toc");
    if (!toc) return;

    const cells = this.engine.getCells();
    const headings: Array<{ level: number; text: string; cellId: string }> = [];

    for (const cell of cells) {
      if (cell.type !== "markdown") continue;
      const lines = cell.source.split("\n");
      for (const line of lines) {
        const match = line.match(/^(#{1,3})\s+(.+)/);
        if (match) {
          headings.push({
            level: match[1].length,
            text: match[2].trim(),
            cellId: cell.id,
          });
        }
      }
    }

    toc.innerHTML = `<div class="sci-nb-toc-title">Contents</div>`;
    const list = document.createElement("ul");
    list.className = "sci-nb-toc-list";

    for (const h of headings) {
      const li = document.createElement("li");
      li.className = `sci-nb-toc-item sci-nb-toc-item--h${h.level}`;
      li.style.paddingLeft = `${(h.level - 1) * 12}px`;

      const link = document.createElement("a");
      link.textContent = h.text;
      link.href = "#";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const cellEl = this.cellsContainer.querySelector(`[data-cell-id="${h.cellId}"]`);
        cellEl?.scrollIntoView({ behavior: "smooth", block: "start" });
        this.engine.focusCell(h.cellId);
      });

      li.appendChild(link);
      list.appendChild(li);
    }

    toc.appendChild(list);
  }

  private bindEvents(): void {
    // Re-render on notebook changes
    const unsubUpdate = this.engine.on("notebook:updated", (payload) => {
      this.renderCells();
      if (this.options.showTOC) this.updateTOC();
      if (this.options.onChange) this.options.onChange(payload.data.notebook);
    });
    this.unsubscribers.push(unsubUpdate);

    // Delegate clicks on cells
    this.container.addEventListener("click", this.onContainerClick.bind(this));

    // Delegate clicks on insert handles
    this.container.addEventListener("click", this.onInsertClick.bind(this));

    // Delegate toolbar clicks
    this.container.addEventListener("click", this.onToolbarClick.bind(this));
  }

  private onContainerClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    // Cell action buttons
    const actionBtn = target.closest<HTMLElement>("[data-action]");
    if (actionBtn) {
      const cellEl = actionBtn.closest<HTMLElement>("[data-cell-id]");
      if (!cellEl) return;
      const cellId = cellEl.dataset.cellId!;
      const action = actionBtn.dataset.action;

      switch (action) {
        case "edit":
          this.engine.toggleMode(cellId);
          break;
        case "delete":
          this.engine.deleteCell(cellId);
          break;
        case "duplicate":
          this.engine.duplicateCell(cellId);
          break;
        case "move-up": {
          const idx = this.engine.getCells().findIndex(c => c.id === cellId);
          if (idx > 0) this.engine.moveCell(cellId, idx - 1);
          break;
        }
        case "move-down": {
          const cells = this.engine.getCells();
          const idx = cells.findIndex(c => c.id === cellId);
          if (idx < cells.length - 1) this.engine.moveCell(cellId, idx + 1);
          break;
        }
      }
      return;
    }

    // Click on cell content → focus + edit
    const cellEl = target.closest<HTMLElement>("[data-cell-id]");
    if (cellEl && !this.options.readOnly) {
      const cellId = cellEl.dataset.cellId!;
      this.engine.focusCell(cellId);

      // If clicking on content area, enter edit mode
      if (target.closest(".sci-nb-cell-content")) {
        this.engine.setEditMode(cellId);
      }
    }
  }

  private onInsertClick(e: MouseEvent): void {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".sci-nb-insert-btn");
    if (!btn) return;
    if (this.options.readOnly) return;

    const handle = btn.closest<HTMLElement>("[data-insert-index]");
    if (!handle) return;

    const index = parseInt(handle.dataset.insertIndex || "0", 10);
    const cell = this.engine.insertCell(index, "markdown", "");
    this.engine.setEditMode(cell.id);
    this.engine.focusCell(cell.id);
  }

  private onToolbarClick(e: MouseEvent): void {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-toolbar]");
    if (!btn) return;

    switch (btn.dataset.toolbar) {
      case "undo": this.engine.undo(); break;
      case "redo": this.engine.redo(); break;
      case "edit-all": this.engine.setAllEditMode(); break;
      case "view-all": this.engine.setAllViewMode(); break;
    }
  }

  // Handle editor changes via event delegation
  private onEditorInput(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    if (!textarea.classList.contains("sci-nb-cell-editor")) return;

    const cellEl = textarea.closest<HTMLElement>("[data-cell-id]");
    if (!cellEl) return;

    this.engine.updateCellSource(cellEl.dataset.cellId!, textarea.value);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
