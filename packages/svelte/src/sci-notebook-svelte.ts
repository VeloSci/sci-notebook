import {
  EditorEngine,
  createNotebook,
  type Notebook,
  type Cell,
  type CellType,
  type SciNotebookPlugin,
} from "@velo-sci/notebook-core";
import { RenderPipeline, DOMCellBuilder } from "@velo-sci/notebook-renderer";
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
  /** Show TOC sidebar */
  showTOC?: boolean;
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
  private builder: DOMCellBuilder;
  private options: SciNotebookSvelteOptions;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;
  private showTOC = false;
  private focusedCellId: string | null = null;

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
    this.builder = new DOMCellBuilder({
      engine: this.engine,
      pipeline: this.pipeline,
      readOnly: options.readOnly,
    });
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
    this.showTOC = !!this.options.showTOC;

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

    // Layout wrapper (flex)
    const layout = document.createElement("div");
    layout.className = "sci-nb-layout";
    layout.style.display = "flex";
    layout.style.gap = "16px";

    if (this.showTOC) {
      layout.appendChild(this.builder.buildTOC(this.focusedCellId));
    }

    const cellsContainer = document.createElement("div");
    cellsContainer.className = "sci-nb-cells";
    cellsContainer.style.flex = "1";
    layout.appendChild(cellsContainer);

    this.container.appendChild(layout);
    this.builder.renderCells(cellsContainer);

    // Keyboard handler
    this.container.addEventListener("keydown", (e) => {
      if (this.options.readOnly) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        return;
      }
      this.engine.handleKeyDown(e);
    });
  }

  private updateTOC(): void {
    const oldToc = this.container.querySelector<HTMLElement>(".sci-nb-toc");
    if (!oldToc) return;
    const newToc = this.builder.buildTOC(this.focusedCellId);
    oldToc.replaceWith(newToc);
  }

  private bindEvents(): void {
    const unsub = this.engine.on("notebook:updated", (payload) => {
      const cellsContainer = this.container.querySelector<HTMLElement>(".sci-nb-cells");
      if (cellsContainer) this.builder.patchCells(cellsContainer);
      if (this.showTOC) this.updateTOC();
      if (this.options.onChange) this.options.onChange(payload.data.notebook);
    });
    this.unsubscribers.push(unsub);

    const focusUnsub = this.engine.on("cell:focused", (payload: any) => {
      this.focusedCellId = payload.data.cellId;
      if (this.showTOC) this.updateTOC();
    });
    this.unsubscribers.push(focusUnsub);
  }
}
