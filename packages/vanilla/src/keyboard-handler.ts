import type { EditorEngine } from "@velo-sci/notebook-core";

/**
 * Handles keyboard shortcuts for the vanilla adapter.
 */
export class KeyboardHandler {
  private engine: EditorEngine;
  private container: HTMLElement;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor(engine: EditorEngine, container: HTMLElement) {
    this.engine = engine;
    this.container = container;
    this.boundHandler = this.onKeyDown.bind(this);
    this.container.addEventListener("keydown", this.boundHandler);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const handled = this.engine.handleKeyDown(e);
    if (handled) return;

    const mod = e.ctrlKey || e.metaKey;

    // Escape: exit edit mode
    if (e.key === "Escape") {
      const focused = this.engine.getFocusedCellId();
      if (focused && this.engine.getMode(focused) === "edit") {
        e.preventDefault();
        this.engine.setViewMode(focused);
        const el = this.container.querySelector<HTMLElement>(`[data-cell-id="${focused}"]`);
        el?.focus();
      }
      return;
    }

    // Enter: enter edit mode
    if (e.key === "Enter" && !mod && !e.shiftKey) {
      const focused = this.engine.getFocusedCellId();
      if (focused && this.engine.getMode(focused) === "view") {
        e.preventDefault();
        this.engine.setEditMode(focused);
      }
      return;
    }

    // Shift+Enter: exit edit, move to next cell
    if (e.key === "Enter" && e.shiftKey && !mod) {
      const focused = this.engine.getFocusedCellId();
      if (focused) {
        e.preventDefault();
        this.engine.setViewMode(focused);
        const cells = this.engine.getCells();
        const idx = cells.findIndex(c => c.id === focused);
        if (idx < cells.length - 1) {
          this.engine.focusCell(cells[idx + 1].id);
        }
      }
      return;
    }

    // ArrowUp/ArrowDown: navigate cells in view mode
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const focused = this.engine.getFocusedCellId();
      if (!focused) return;
      if (this.engine.getMode(focused) === "edit") return;

      e.preventDefault();
      const cells = this.engine.getCells();
      const idx = cells.findIndex(c => c.id === focused);
      const next = e.key === "ArrowUp" ? idx - 1 : idx + 1;
      if (next >= 0 && next < cells.length) {
        this.engine.focusCell(cells[next].id);
        const el = this.container.querySelector<HTMLElement>(`[data-cell-id="${cells[next].id}"]`);
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }

    // Mod+Z: undo
    if (mod && !e.shiftKey && e.key === "z") {
      e.preventDefault();
      this.engine.undo();
      return;
    }

    // Mod+Shift+Z: redo
    if (mod && e.shiftKey && e.key === "z") {
      e.preventDefault();
      this.engine.redo();
      return;
    }

    // Mod+Shift+D: delete cell
    if (mod && e.shiftKey && e.key === "d") {
      const focused = this.engine.getFocusedCellId();
      if (focused) {
        e.preventDefault();
        this.engine.deleteCell(focused);
      }
      return;
    }

    // Mod+D: duplicate cell
    if (mod && !e.shiftKey && e.key === "d") {
      const focused = this.engine.getFocusedCellId();
      if (focused) {
        e.preventDefault();
        this.engine.duplicateCell(focused);
      }
      return;
    }
  }

  destroy(): void {
    this.container.removeEventListener("keydown", this.boundHandler);
  }
}
