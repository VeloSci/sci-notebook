export type KeyCombo = string; // e.g., "cmd+shift+d", "escape"
export type KeyContext = "edit" | "view" | "any";

export interface KeybindingEntry {
  combo: KeyCombo;
  action: string;
  context?: KeyContext;
  handler: () => void;
}

/**
 * Manages keyboard shortcuts and their handlers.
 * Supports context-aware dispatch (edit mode vs view mode).
 */
export class KeybindingManager {
  private bindings: Map<string, KeybindingEntry[]> = new Map();
  private currentContext: KeyContext = "view";

  setContext(ctx: KeyContext): void {
    this.currentContext = ctx;
  }

  getContext(): KeyContext {
    return this.currentContext;
  }

  register(entry: KeybindingEntry): void {
    const key = entry.combo.toLowerCase();
    const list = this.bindings.get(key) || [];
    list.push(entry);
    this.bindings.set(key, list);
  }

  unregister(combo: KeyCombo, action?: string): void {
    const key = combo.toLowerCase();
    if (action) {
      const list = this.bindings.get(key);
      if (list) {
        const filtered = list.filter(e => e.action !== action);
        if (filtered.length === 0) this.bindings.delete(key);
        else this.bindings.set(key, filtered);
      }
    } else {
      this.bindings.delete(key);
    }
  }

  override(combo: KeyCombo, handler: () => void): void {
    const key = combo.toLowerCase();
    const list = this.bindings.get(key);
    if (list && list.length > 0) {
      list[list.length - 1].handler = handler;
    }
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const combo = this.getComboString(event);
    const entries = this.bindings.get(combo);
    if (!entries || entries.length === 0) return false;

    // Find the best match: prefer context-specific over "any"
    const match =
      entries.find(e => e.context === this.currentContext) ||
      entries.find(e => e.context === "any" || !e.context);

    if (match) {
      event.preventDefault();
      match.handler();
      return true;
    }
    return false;
  }

  getAll(): KeybindingEntry[] {
    const all: KeybindingEntry[] = [];
    for (const list of this.bindings.values()) {
      all.push(...list);
    }
    return all;
  }

  clear(): void {
    this.bindings.clear();
  }

  private getComboString(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey || event.metaKey) parts.push("mod");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");
    const key = event.key.toLowerCase();
    if (key !== "control" && key !== "meta" && key !== "alt" && key !== "shift") {
      parts.push(key);
    }
    return parts.join("+");
  }
}

/**
 * Default keybinding definitions. The engine wires these to actual handlers.
 */
export const DEFAULT_KEYBINDINGS: Array<{ combo: KeyCombo; action: string; context?: KeyContext }> = [
  { combo: "enter", action: "enter-edit", context: "view" },
  { combo: "escape", action: "exit-edit", context: "edit" },
  { combo: "mod+shift+enter", action: "split-cell", context: "edit" },
  { combo: "shift+enter", action: "exit-edit-next", context: "edit" },
  { combo: "mod+enter", action: "run-cell", context: "edit" },
  { combo: "arrowup", action: "focus-prev", context: "view" },
  { combo: "arrowdown", action: "focus-next", context: "view" },
  { combo: "mod+shift+d", action: "delete-cell", context: "any" },
  { combo: "mod+shift+arrowup", action: "move-cell-up", context: "any" },
  { combo: "mod+shift+arrowdown", action: "move-cell-down", context: "any" },
  { combo: "mod+z", action: "undo", context: "any" },
  { combo: "mod+shift+z", action: "redo", context: "any" },
  { combo: "mod+b", action: "toggle-bold", context: "edit" },
  { combo: "mod+i", action: "toggle-italic", context: "edit" },
  { combo: "mod+k", action: "insert-link", context: "edit" },
  { combo: "mod+shift+m", action: "insert-math", context: "edit" },
  { combo: "mod+/", action: "toggle-cell-type", context: "any" },
  { combo: "mod+d", action: "duplicate-cell", context: "any" },
  { combo: "mod+c", action: "copy-cells", context: "any" },
  { combo: "mod+x", action: "cut-cells", context: "any" },
  { combo: "mod+v", action: "paste-cells", context: "any" },
];
