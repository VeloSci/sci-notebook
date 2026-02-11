import {
  EditorEngine,
  createNotebook,
  type Notebook,
  type Cell,
  type CellType,
  type SciNotebookPlugin,
} from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { createNotebookStore, type NotebookStore } from "./stores";

export interface SciNotebookSvelteOptions {
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
}

/**
 * Svelte 5+ adapter for sci-notebook.
 *
 * Provides a store-based API that integrates with Svelte's reactivity.
 * Can also be used imperatively for mounting into a DOM element.
 *
 * Usage (imperative):
 * ```ts
 * const nb = new SciNotebookSvelte({
 *   target: '#app',
 *   notebook: myNotebook,
 *   theme: 'dark',
 * });
 * // Access stores: nb.store.notebook, nb.store.cells, nb.store.focusedCellId
 * nb.destroy();
 * ```
 *
 * Usage (Svelte component):
 * ```svelte
 * <script>
 *   import { createNotebookStore } from '@velo-sci/notebook-svelte';
 *   import { createNotebook } from '@velo-sci/notebook-core';
 *
 *   const engine = createNotebook({ notebook: myNotebook });
 *   const { notebook, cells, focusedCellId } = createNotebookStore(engine);
 * </script>
 *
 * <div class="sci-nb" data-theme="dark">
 *   {#each $cells as cell, idx}
 *     <div class="sci-nb-cell sci-nb-cell--{cell.type}">
 *       {cell.source}
 *     </div>
 *   {/each}
 * </div>
 * ```
 */
export class SciNotebookSvelte {
  private engine: EditorEngine;
  private container: HTMLElement;
  private pipeline: RenderPipeline;
  private options: SciNotebookSvelteOptions;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  readonly store: NotebookStore;

  constructor(options: SciNotebookSvelteOptions) {
    this.options = options;

    if (typeof options.target === "string") {
      const el = document.querySelector<HTMLElement>(options.target);
      if (!el) throw new Error(`SciNotebookSvelte: target "${options.target}" not found`);
      this.container = el;
    } else {
      this.container = options.target;
    }

    if (options.engine) {
      this.engine = options.engine;
    } else {
      this.engine = createNotebook({
        notebook: options.notebook,
        config: { plugins: options.plugins },
      });
    }

    this.pipeline = new RenderPipeline();
    this.store = createNotebookStore(this.engine);

    this.render();
    this.bindEvents();
  }

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

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.engine.destroy();
    this.container.innerHTML = "";
  }

  private render(): void {
    this.container.innerHTML = "";
    this.container.className = "sci-nb sci-nb--svelte";
    this.container.dataset.theme = this.options.theme || "light";
    this.container.tabIndex = 0;

    if (this.options.showToolbar !== false) {
      this.container.appendChild(this.createToolbar());
    }

    const cellsContainer = document.createElement("div");
    cellsContainer.className = "sci-nb-cells";
    this.container.appendChild(cellsContainer);

    this.renderCells(cellsContainer);
  }

  private renderCells(container: HTMLElement): void {
    container.innerHTML = "";
    const cells = this.engine.getCells();

    if (cells.length === 0) {
      container.innerHTML = `<div class="sci-nb-empty"><p>Empty notebook. Add a cell to get started.</p></div>`;
      return;
    }

    for (const cell of cells) {
      const el = document.createElement("div");
      el.className = `sci-nb-cell sci-nb-cell--${cell.type}`;
      el.dataset.cellId = cell.id;

      const content = document.createElement("div");
      content.className = "sci-nb-cell-content";

      if (cell.editing) {
        const editor = document.createElement("textarea");
        editor.className = "sci-nb-cell-editor";
        editor.value = cell.source;
        editor.rows = Math.max(3, cell.source.split("\n").length + 1);
        editor.addEventListener("input", () => {
          this.engine.updateCellSource(cell.id, editor.value);
        });
        editor.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            this.engine.setViewMode(cell.id);
          }
        });
        content.appendChild(editor);
      } else {
        content.innerHTML = this.pipeline.render(cell).html;
        content.addEventListener("click", () => {
          if (!this.options.readOnly) {
            this.engine.focusCell(cell.id);
            this.engine.setEditMode(cell.id);
          }
        });
      }

      el.appendChild(content);
      container.appendChild(el);
    }
  }

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement("div");
    toolbar.className = "sci-nb-toolbar";
    const nb = this.engine.getNotebook();
    toolbar.innerHTML = `
      <div class="sci-nb-toolbar-group">
        <span class="sci-nb-toolbar-title">${nb.title}</span>
      </div>
      <div class="sci-nb-toolbar-group">
        <button class="sci-nb-toolbar-btn" data-toolbar="undo">Undo</button>
        <button class="sci-nb-toolbar-btn" data-toolbar="redo">Redo</button>
        <button class="sci-nb-toolbar-btn" data-toolbar="edit-all">Edit All</button>
        <button class="sci-nb-toolbar-btn" data-toolbar="view-all">View All</button>
      </div>
    `;
    toolbar.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-toolbar]");
      if (!btn) return;
      switch (btn.dataset.toolbar) {
        case "undo": this.engine.undo(); break;
        case "redo": this.engine.redo(); break;
        case "edit-all": this.engine.setAllEditMode(); break;
        case "view-all": this.engine.setAllViewMode(); break;
      }
    });
    return toolbar;
  }

  private bindEvents(): void {
    const unsub = this.engine.on("notebook:updated", (payload) => {
      const cellsContainer = this.container.querySelector<HTMLElement>(".sci-nb-cells");
      if (cellsContainer) this.renderCells(cellsContainer);
      if (this.options.onChange) this.options.onChange(payload.data.notebook);
    });
    this.unsubscribers.push(unsub);
  }
}
