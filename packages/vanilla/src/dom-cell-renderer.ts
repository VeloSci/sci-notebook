import type { Cell } from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";

/**
 * Renders a Cell to a DOM element using the RenderPipeline.
 */
export class DOMCellRenderer {
  private pipeline: RenderPipeline;

  constructor(pipeline?: RenderPipeline) {
    this.pipeline = pipeline || new RenderPipeline();
  }

  getPipeline(): RenderPipeline {
    return this.pipeline;
  }

  /**
   * Render a cell to an HTML string via the pipeline.
   */
  renderToHTML(cell: Cell): string {
    const result = this.pipeline.render(cell);
    return result.html;
  }

  /**
   * Create a full DOM element for a cell (view mode).
   */
  createCellElement(cell: Cell, index: number): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = `sci-nb-cell sci-nb-cell--${cell.type}`;
    wrapper.dataset.cellId = cell.id;
    wrapper.dataset.cellIndex = String(index);
    wrapper.setAttribute("role", "article");
    wrapper.setAttribute("aria-label", `Cell ${index + 1}: ${cell.type}`);
    wrapper.tabIndex = 0;

    // Drag handle
    const handle = document.createElement("div");
    handle.className = "sci-nb-cell-handle";
    handle.draggable = true;
    handle.innerHTML = "⠿";
    handle.title = "Drag to reorder";
    wrapper.appendChild(handle);

    // Content area
    const content = document.createElement("div");
    content.className = "sci-nb-cell-content";

    if (cell.editing) {
      content.appendChild(this.createEditor(cell));
    } else {
      content.innerHTML = this.renderToHTML(cell);
    }

    wrapper.appendChild(content);

    // Actions bar
    const actions = document.createElement("div");
    actions.className = "sci-nb-cell-actions";
    actions.innerHTML = `
      <button class="sci-nb-cell-action" data-action="edit" title="Edit">✏️</button>
      <button class="sci-nb-cell-action" data-action="delete" title="Delete">🗑️</button>
      <button class="sci-nb-cell-action" data-action="duplicate" title="Duplicate">📋</button>
      <button class="sci-nb-cell-action" data-action="move-up" title="Move up">⬆️</button>
      <button class="sci-nb-cell-action" data-action="move-down" title="Move down">⬇️</button>
    `;
    wrapper.appendChild(actions);

    return wrapper;
  }

  /**
   * Create a textarea editor for a cell.
   */
  createEditor(cell: Cell): HTMLElement {
    const editor = document.createElement("textarea");
    editor.className = "sci-nb-cell-editor";
    editor.value = cell.source;
    editor.rows = Math.max(3, cell.source.split("\n").length + 1);
    editor.setAttribute("aria-label", `Edit ${cell.type} cell`);
    return editor;
  }

  /**
   * Create an insert handle element.
   */
  createInsertHandle(index: number): HTMLElement {
    const handle = document.createElement("div");
    handle.className = "sci-nb-insert-handle";
    handle.dataset.insertIndex = String(index);

    const btn = document.createElement("button");
    btn.className = "sci-nb-insert-btn";
    btn.innerHTML = "+";
    btn.title = "Insert cell";
    btn.setAttribute("aria-label", `Insert cell at position ${index}`);
    handle.appendChild(btn);

    return handle;
  }

  /**
   * Update an existing cell element in place.
   */
  updateCellElement(el: HTMLElement, cell: Cell): void {
    const content = el.querySelector(".sci-nb-cell-content");
    if (!content) return;

    el.className = `sci-nb-cell sci-nb-cell--${cell.type}`;

    if (cell.editing) {
      content.innerHTML = "";
      content.appendChild(this.createEditor(cell));
    } else {
      content.innerHTML = this.renderToHTML(cell);
    }
  }
}
