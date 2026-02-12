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
    this.builder = new DOMCellBuilder({
      engine: this.engine,
      pipeline: this.pipeline,
      readOnly: options.readOnly,
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
      this.keyboard = new KeyboardHandler(this.engine, this.container);
    }
  }

  private renderCells(): void {
    const cells = this.engine.getCells();
    const container = this.cellsContainer;
    
    // Handle empty state
    if (cells.length === 0) {
      container.innerHTML = "";
      container.appendChild(this.builder.buildEmpty());
      return;
    }

    // Identify current active element to try to restore focus later if needed
    const activeEl = document.activeElement as HTMLElement;
    const activeCellId = activeEl?.closest('[data-cell-id]')?.getAttribute('data-cell-id');
    const isEditing = activeEl?.classList.contains('sci-nb-editor');
    const cursorStart = (activeEl as HTMLTextAreaElement)?.selectionStart;
    const cursorEnd = (activeEl as HTMLTextAreaElement)?.selectionEnd;

    // Get existing children map for reuse
    const existingNodes = Array.from(container.children) as HTMLElement[];
    const cellMap = new Map<string, HTMLElement>();
    const handleMap = new Map<string, HTMLElement>(); // Keyed by preceding cell ID or "start"

    existingNodes.forEach(node => {
      if (node.classList.contains("sci-nb-cell")) {
        const id = node.getAttribute("data-cell-id");
        if (id) cellMap.set(id, node);
      } else if (node.classList.contains("sci-nb-insert-handle")) {
        // Handles don't have IDs, but we can try to reuse them if we track position. 
        // For simplicity in this version, we might recreate handles or check their position.
        // Let's rely on simple recreation for handles as they are lightweight, 
        // OR simply reuse them based on iteration order.
        // Better: let's clear handles and re-insert, but REUSE CELLS. 
        // Recreating handles is cheap. Recreating cells (editors) is expensive/destructive.
      }
    });

    // We will build a new fragment or append directly to ensure order
    // But modifying the live DOM "in place" is better to preserve state of unchanged nodes.

    // Strategy: Navigate the list of required cells, and ensure DOM matches.
    
    // 1. Remove empty state if present
    const emptyState = container.querySelector(".sci-nb-empty");
    if (emptyState) emptyState.remove();

    // 2. Ensure start handle exists
    let currentDomNode = container.firstElementChild as HTMLElement | null;
    
    // Check first handle
    if (!currentDomNode || !currentDomNode.classList.contains("sci-nb-insert-handle")) {
      const handle = this.builder.buildInsertHandle(0);
      if (currentDomNode) container.insertBefore(handle, currentDomNode);
      else container.appendChild(handle);
      currentDomNode = handle; // Now point to the handle
    } else {
      // update handle index if needed (though handle internal logic mostly relies on closures, 
      // we might need to rebuild it if closures capture stale index. 
      // The shared builder captures index in callbacks. So YES, we must replace handles to update indices.)
      const newHandle = this.builder.buildInsertHandle(0);
      currentDomNode.replaceWith(newHandle);
      currentDomNode = newHandle;
    }

    // Advance
    currentDomNode = currentDomNode.nextElementSibling as HTMLElement | null;

    cells.forEach((cell, idx) => {
      // 3. Process Cell
      let cellNode: HTMLElement;

      // Check if current DOM node matches this cell
      if (currentDomNode && currentDomNode.getAttribute("data-cell-id") === cell.id) {
        // MATCH: Update in place if needed
        cellNode = currentDomNode;
        
        // Diffing logic:
        const oldType = cellNode.getAttribute("data-cell-type");
        const oldEditing = cellNode.getAttribute("data-editing") === "true";
        
        // If critical attributes changed, we MUST replace (e.g. type switch, view/edit toggle)
        // EXCEPTION: If we are editing and typing, source changes triggering updates shouldn't kill the editor.
        const shouldReplace = oldType !== cell.type || oldEditing !== !!cell.editing;
        
        if (shouldReplace) {
           const newNode = this.builder.buildCell(cell, idx, cells.length);
           cellNode.replaceWith(newNode);
           cellNode = newNode;
        } else {
           // Same type, same mode.
           // If in View mode, re-render content because source might have changed.
           // If in Edit mode, ONLY update if it's NOT the active focused cell (avoid cursor jumps).
           if (!cell.editing) {
             // View mode: naive update is safe
             const newNode = this.builder.buildCell(cell, idx, cells.length);
             cellNode.replaceWith(newNode);
             cellNode = newNode;
           } else {
             // Edit mode:
             if (activeCellId === cell.id && isEditing) {
               // We are typing in this cell. DO NOT TOUCH IT or you lose focus/selection.
               // We assume the DOM state matches the Engine state because the Engine state came FROM the DOM event.
               // Update auxiliary bits like Index if moved
               const idxLabel = cellNode.querySelector(".sci-nb-cell-index");
               if (idxLabel) idxLabel.textContent = `[${idx + 1}]`;
             } else {
               // Edit mode but not focused (e.g. changed programmatically or by other user), replace safely
               const newNode = this.builder.buildCell(cell, idx, cells.length);
               cellNode.replaceWith(newNode);
               cellNode = newNode;
             }
           }
        }

      } else {
        // MISMATCH: 
        // Is the cell somewhere else in the DOM? (Moved)
        const existing = cellMap.get(cell.id);
        if (existing) {
          // It exists elsewhere, move it here
          container.insertBefore(existing, currentDomNode); // moves it from old pos to here
          cellNode = existing;
          // Update it just in case
          const newNode = this.builder.buildCell(cell, idx, cells.length);
          cellNode.replaceWith(newNode);
          cellNode = newNode;
        } else {
          // New cell
          cellNode = this.builder.buildCell(cell, idx, cells.length);
          if (currentDomNode) {
            container.insertBefore(cellNode, currentDomNode);
          } else {
            container.appendChild(cellNode);
          }
        }
      }
      
      // Advance past cell
      currentDomNode = cellNode.nextElementSibling as HTMLElement | null;

      // 4. Process Next Handle
      if (!currentDomNode || !currentDomNode.classList.contains("sci-nb-insert-handle")) {
         const handle = this.builder.buildInsertHandle(idx + 1);
         if (currentDomNode) container.insertBefore(handle, currentDomNode);
         else container.appendChild(handle);
         currentDomNode = handle;
      } else {
         // Replace handle to update index closure
         const handle = this.builder.buildInsertHandle(idx + 1);
         currentDomNode.replaceWith(handle);
         currentDomNode = handle;
      }

      // Advance past handle
      currentDomNode = currentDomNode.nextElementSibling as HTMLElement | null;
    });

    // 5. Cleanup remaining nodes (deleted cells)
    while (currentDomNode) {
      const next = currentDomNode.nextElementSibling as HTMLElement | null;
      currentDomNode.remove();
      currentDomNode = next;
    }
    
    // Restore focus if we brutally replaced the active node (shouldn't happen with logic above, but safety net)
    if (activeCellId && isEditing && document.activeElement !== activeEl) {
        // Try to find the input again
        const newCell = container.querySelector(`[data-cell-id="${activeCellId}"]`);
        const input = newCell?.querySelector("textarea");
        if (input) {
            input.focus();
            if (cursorStart != null) input.setSelectionRange(cursorStart, cursorEnd ?? cursorStart);
        }
    }
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
  }
}
