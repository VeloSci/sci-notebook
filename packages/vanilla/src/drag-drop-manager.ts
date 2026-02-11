import type { EditorEngine } from "@velo-sci/notebook-core";

/**
 * Manages drag-and-drop reordering of cells in the vanilla adapter.
 */
export class DragDropManager {
  private engine: EditorEngine;
  private container: HTMLElement;
  private draggedCellId: string | null = null;
  private dropIndicator: HTMLElement | null = null;

  constructor(engine: EditorEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.init();
  }

  private init(): void {
    this.container.addEventListener("dragstart", this.onDragStart.bind(this));
    this.container.addEventListener("dragover", this.onDragOver.bind(this));
    this.container.addEventListener("dragleave", this.onDragLeave.bind(this));
    this.container.addEventListener("drop", this.onDrop.bind(this));
    this.container.addEventListener("dragend", this.onDragEnd.bind(this));
  }

  private onDragStart(e: DragEvent): void {
    const handle = (e.target as HTMLElement).closest(".sci-nb-cell-handle");
    if (!handle) return;

    const cellEl = handle.closest<HTMLElement>("[data-cell-id]");
    if (!cellEl) return;

    this.draggedCellId = cellEl.dataset.cellId || null;
    cellEl.classList.add("sci-nb-cell--dragging");

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", this.draggedCellId || "");
    }
  }

  private onDragOver(e: DragEvent): void {
    if (!this.draggedCellId) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

    const cellEl = (e.target as HTMLElement).closest<HTMLElement>("[data-cell-id]");
    if (!cellEl || cellEl.dataset.cellId === this.draggedCellId) return;

    this.removeDropIndicator();

    const rect = cellEl.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? "before" : "after";

    this.dropIndicator = document.createElement("div");
    this.dropIndicator.className = "sci-nb-drop-indicator";

    if (position === "before") {
      cellEl.parentNode?.insertBefore(this.dropIndicator, cellEl);
    } else {
      cellEl.parentNode?.insertBefore(this.dropIndicator, cellEl.nextSibling);
    }
  }

  private onDragLeave(_e: DragEvent): void {
    // Keep indicator visible during drag
  }

  private onDrop(e: DragEvent): void {
    e.preventDefault();
    if (!this.draggedCellId) return;

    const cellEl = (e.target as HTMLElement).closest<HTMLElement>("[data-cell-id]");
    if (!cellEl) return;

    const targetIndex = parseInt(cellEl.dataset.cellIndex || "0", 10);
    const rect = cellEl.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const toIndex = e.clientY < midY ? targetIndex : targetIndex + 1;

    this.engine.moveCell(this.draggedCellId, toIndex);
    this.cleanup();
  }

  private onDragEnd(_e: DragEvent): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.draggedCellId) {
      const el = this.container.querySelector(`[data-cell-id="${this.draggedCellId}"]`);
      el?.classList.remove("sci-nb-cell--dragging");
    }
    this.removeDropIndicator();
    this.draggedCellId = null;
  }

  private removeDropIndicator(): void {
    this.dropIndicator?.remove();
    this.dropIndicator = null;
  }

  destroy(): void {
    this.cleanup();
  }
}
