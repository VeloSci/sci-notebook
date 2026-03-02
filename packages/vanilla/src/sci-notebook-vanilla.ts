import {
  EditorEngine,
  createNotebook,
  Notebook,
  Cell,
  CellType,
  SciNotebookPlugin,
} from "@velo-sci/notebook-core";
import { RenderPipeline, DOMCellBuilder } from "@velo-sci/notebook-renderer";
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
  /** Callback when exiting this notebook */
  onExit?: () => void;

  /** Read-only mode */
  readOnly?: boolean;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Custom cell renderer override */
  customCellRenderer?: VanillaCellRenderer;
  /** Show TOC sidebar */
  showTOC?: boolean;
  /** Nesting level */
  level?: number;
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
  private builder: DOMCellBuilder;
  private dragDrop: DragDropManager | null = null;
  private keyboard: KeyboardHandler | null = null;
  private pipeline: RenderPipeline;
  private options: SciNotebookVanillaOptions;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;
  private showTOC: boolean;
  private focusedCellId: string | null = null;

  constructor(options: SciNotebookVanillaOptions) {
    this.options = options;
    this.showTOC = !!options.showTOC;

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
    const notebookInstances = new WeakMap<HTMLElement, SciNotebookVanilla>();

    this.builder = new DOMCellBuilder({
      engine: this.engine,
      pipeline: this.pipeline,
      readOnly: options.readOnly,
      level: options.level || 0,
      renderNotebookHook: (container: HTMLElement, cell: Cell, isEditing: boolean) => {
        let nestedData: Notebook | undefined = undefined;
        try {
          if (cell.source) {
            nestedData = JSON.parse(cell.source);
          }
        } catch(e) {}

        if (notebookInstances.has(container)) {
          try { notebookInstances.get(container)!.destroy(); } catch {}
          notebookInstances.delete(container);
        }

        container.innerHTML = "";
        const instance = new SciNotebookVanilla({
          target: container,
          notebook: nestedData || { id: `nested-${cell.id}`, title: "Nested Notebook", cells: [], metadata: {}, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          readOnly: Boolean(cell.metadata?.readOnly ?? this.options.readOnly),
          showToolbar: false,
          showTOC: false,
          theme: "inherit",
          level: (this.options.level || 0) + 1,
          onExit: () => {
            if (this.engine.getMode(cell.id) === "edit") {
              this.engine.setViewMode(cell.id);
            }
          },
          onChange: (updated) => {
            this.engine.updateCellSource(cell.id, JSON.stringify(updated));
          }

        });
        notebookInstances.set(container, instance);
      },
    });

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
    this.container.dataset.level = String(this.options.level || 0);
    this.container.tabIndex = 0;

    // Toolbar (using shared builder)
    if (this.options.showToolbar !== false) {
      this.container.appendChild(this.builder.buildToolbar({
        onToggleFind: () => {},
        onToggleTOC: () => {
          this.showTOC = !this.showTOC;
          const tocBtn = this.container.querySelector<HTMLElement>('[data-toolbar="toc"]');
          if (tocBtn) tocBtn.classList.toggle("sci-nb-toolbar-btn--active", this.showTOC);
          const toc = this.container.querySelector<HTMLElement>(".sci-nb-toc");
          if (this.showTOC && !toc) {
            const layout = this.container.querySelector<HTMLElement>(".sci-nb-layout");
            if (layout) layout.insertBefore(this.builder.buildTOC(this.focusedCellId), layout.firstChild);
          } else if (!this.showTOC && toc) {
            toc.remove();
          }
        },
        showTOC: this.showTOC,
      }));
    }

    // Layout wrapper
    const layout = document.createElement("div");
    layout.className = "sci-nb-layout";
    layout.style.display = "flex";
    layout.style.gap = "16px";

    // TOC sidebar (using shared builder)
    if (this.showTOC) {
      layout.appendChild(this.builder.buildTOC(this.focusedCellId));
    }

    // Cells container
    this.cellsContainer = document.createElement("div");
    this.cellsContainer.className = "sci-nb-cells";
    this.cellsContainer.style.flex = "1";
    layout.appendChild(this.cellsContainer);

    this.container.appendChild(layout);

    this.renderCells();

    // Init keyboard handler
    if (!this.options.readOnly) {
      this.keyboard = new KeyboardHandler(this.engine, this.container, {
        level: this.options.level || 0,
        onExit: this.options.onExit
      });
    }

  }

  private renderCells(): void {
    this.builder.patchCells(this.cellsContainer);
    // Hydrate pending mermaid diagrams (async render in v10+)
    this.pipeline.hydrateMermaid(this.cellsContainer);
  }

  private updateTOC(): void {
    const oldToc = this.container.querySelector<HTMLElement>(".sci-nb-toc");
    if (!oldToc) return;
    const newToc = this.builder.buildTOC(this.focusedCellId);
    oldToc.replaceWith(newToc);
  }

  private bindEvents(): void {
    // Re-render on notebook changes
    const unsubUpdate = this.engine.on("notebook:updated", (payload) => {
      // Optimization: If the update comes from a source change in the focused cell,
      // we might want to skip full re-render or be very careful.
      // Our enhanced renderCells handles this check.
      this.renderCells();
      if (this.showTOC) this.updateTOC();
      if (this.options.onChange) this.options.onChange(payload.data.notebook);
    });
    this.unsubscribers.push(unsubUpdate);

    const focusUnsub = this.engine.on("cell:focused", (payload: any) => {
      this.focusedCellId = payload.data.cellId;
      if (this.showTOC) this.updateTOC();
    });
    this.unsubscribers.push(focusUnsub);

    const onRemove = (e: Event) => {
      const ce = e as CustomEvent<{ notebookId: string; cellId: string }>;
      if (ce.detail.notebookId === this.engine.getNotebook().id) {
        this.engine.deleteCell(ce.detail.cellId);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("sci-nb-remove-cell", onRemove);
      this.unsubscribers.push(() => window.removeEventListener("sci-nb-remove-cell", onRemove));
    }
  }
}
