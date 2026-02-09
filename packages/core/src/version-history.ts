/**
 * Version History for sci-notebook
 *
 * Stores snapshots of the notebook state at key points.
 * Supports browsing, restoring, and basic diffing.
 */

import type { Notebook } from "./types";

// ── Types ──────────────────────────────────────────────────────

export interface VersionEntry {
  id: string;
  timestamp: number;
  description: string;
  snapshot: string; // JSON-serialized Notebook
  cellCount: number;
}

export interface VersionDiff {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: string[];
}

export interface VersionHistoryConfig {
  /** Max entries to keep (default: 50) */
  maxEntries?: number;
  /** Auto-save interval in ms (0 = disabled, default: 0) */
  autoSaveInterval?: number;
}

// ── Version History Manager ────────────────────────────────────

export class VersionHistory {
  private entries: VersionEntry[] = [];
  private maxEntries: number;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private counter = 0;

  constructor(config: VersionHistoryConfig = {}) {
    this.maxEntries = config.maxEntries ?? 50;
  }

  /**
   * Save a snapshot of the current notebook state.
   */
  save(notebook: Notebook, description: string = "Auto-save"): VersionEntry {
    const entry: VersionEntry = {
      id: `v_${++this.counter}_${Date.now()}`,
      timestamp: Date.now(),
      description,
      snapshot: JSON.stringify(notebook),
      cellCount: notebook.cells.length,
    };

    this.entries.push(entry);

    // Trim old entries
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return entry;
  }

  /**
   * Get all version entries (newest last).
   */
  getEntries(): ReadonlyArray<VersionEntry> {
    return this.entries;
  }

  /**
   * Get a specific version entry by ID.
   */
  getEntry(id: string): VersionEntry | undefined {
    return this.entries.find(e => e.id === id);
  }

  /**
   * Restore a notebook from a version entry.
   */
  restore(id: string): Notebook | null {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return null;
    try {
      return JSON.parse(entry.snapshot) as Notebook;
    } catch {
      return null;
    }
  }

  /**
   * Compute a diff between two versions (by cell IDs).
   */
  diff(fromId: string, toId: string): VersionDiff | null {
    const fromEntry = this.entries.find(e => e.id === fromId);
    const toEntry = this.entries.find(e => e.id === toId);
    if (!fromEntry || !toEntry) return null;

    try {
      const fromNb = JSON.parse(fromEntry.snapshot) as Notebook;
      const toNb = JSON.parse(toEntry.snapshot) as Notebook;

      const fromIds = new Set(fromNb.cells.map(c => c.id));
      const toIds = new Set(toNb.cells.map(c => c.id));
      const fromMap = new Map(fromNb.cells.map(c => [c.id, c.source]));
      const toMap = new Map(toNb.cells.map(c => [c.id, c.source]));

      const added: string[] = [];
      const removed: string[] = [];
      const modified: string[] = [];
      const unchanged: string[] = [];

      for (const id of toIds) {
        if (!fromIds.has(id)) {
          added.push(id);
        } else if (fromMap.get(id) !== toMap.get(id)) {
          modified.push(id);
        } else {
          unchanged.push(id);
        }
      }

      for (const id of fromIds) {
        if (!toIds.has(id)) {
          removed.push(id);
        }
      }

      return { added, removed, modified, unchanged };
    } catch {
      return null;
    }
  }

  /**
   * Get the latest entry.
   */
  getLatest(): VersionEntry | null {
    return this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Get entry count.
   */
  get count(): number {
    return this.entries.length;
  }

  /**
   * Start auto-saving at a given interval.
   */
  startAutoSave(getNotebook: () => Notebook, intervalMs: number = 30000): void {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.save(getNotebook(), "Auto-save");
    }, intervalMs);
  }

  /**
   * Stop auto-saving.
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Destroy and clean up.
   */
  destroy(): void {
    this.stopAutoSave();
    this.entries = [];
  }
}
