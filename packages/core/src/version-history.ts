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

export interface LineDiffEntry {
  type: "add" | "remove" | "context";
  lineNumber: number;
  content: string;
}

export interface CellDiff {
  cellId: string;
  status: "added" | "removed" | "modified" | "unchanged";
  lineDiff?: LineDiffEntry[];
  oldSource?: string;
  newSource?: string;
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
   * Compute a detailed git-like diff between two versions.
   * Returns per-cell diffs with line-level changes.
   */
  detailedDiff(fromId: string, toId: string): CellDiff[] | null {
    const fromEntry = this.entries.find(e => e.id === fromId);
    const toEntry = this.entries.find(e => e.id === toId);
    if (!fromEntry || !toEntry) return null;

    try {
      const fromNb = JSON.parse(fromEntry.snapshot) as Notebook;
      const toNb = JSON.parse(toEntry.snapshot) as Notebook;

      const fromMap = new Map(fromNb.cells.map(c => [c.id, c]));
      const toMap = new Map(toNb.cells.map(c => [c.id, c]));
      const allIds = new Set([...fromMap.keys(), ...toMap.keys()]);

      const result: CellDiff[] = [];

      for (const id of allIds) {
        const fromCell = fromMap.get(id);
        const toCell = toMap.get(id);

        if (!fromCell && toCell) {
          result.push({
            cellId: id,
            status: "added",
            newSource: toCell.source,
            lineDiff: toCell.source.split("\n").map((line, i) => ({
              type: "add" as const,
              lineNumber: i + 1,
              content: line,
            })),
          });
        } else if (fromCell && !toCell) {
          result.push({
            cellId: id,
            status: "removed",
            oldSource: fromCell.source,
            lineDiff: fromCell.source.split("\n").map((line, i) => ({
              type: "remove" as const,
              lineNumber: i + 1,
              content: line,
            })),
          });
        } else if (fromCell && toCell) {
          if (fromCell.source === toCell.source) {
            result.push({ cellId: id, status: "unchanged" });
          } else {
            result.push({
              cellId: id,
              status: "modified",
              oldSource: fromCell.source,
              newSource: toCell.source,
              lineDiff: computeLineDiff(fromCell.source, toCell.source),
            });
          }
        }
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Get a summary of changes between two versions.
   */
  diffSummary(fromId: string, toId: string): string | null {
    const d = this.diff(fromId, toId);
    if (!d) return null;
    const parts: string[] = [];
    if (d.added.length) parts.push(`+${d.added.length} added`);
    if (d.removed.length) parts.push(`-${d.removed.length} removed`);
    if (d.modified.length) parts.push(`~${d.modified.length} modified`);
    if (d.unchanged.length) parts.push(`${d.unchanged.length} unchanged`);
    return parts.join(", ");
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

// ── Line-level diff (Myers-like simple algorithm) ──────────────

/**
 * Compute a line-level diff between two strings.
 * Uses a simple LCS-based approach for readable diffs.
 */
export function computeLineDiff(oldText: string, newText: string): LineDiffEntry[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const lcs = longestCommonSubsequence(oldLines, newLines);
  const result: LineDiffEntry[] = [];

  let oi = 0;
  let ni = 0;
  let li = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    if (li < lcs.length && oi < oldLines.length && ni < newLines.length && oldLines[oi] === lcs[li] && newLines[ni] === lcs[li]) {
      result.push({ type: "context", lineNumber: ni + 1, content: newLines[ni] });
      oi++;
      ni++;
      li++;
    } else if (oi < oldLines.length && (li >= lcs.length || oldLines[oi] !== lcs[li])) {
      result.push({ type: "remove", lineNumber: oi + 1, content: oldLines[oi] });
      oi++;
    } else if (ni < newLines.length && (li >= lcs.length || newLines[ni] !== lcs[li])) {
      result.push({ type: "add", lineNumber: ni + 1, content: newLines[ni] });
      ni++;
    }
  }

  return result;
}

/**
 * Compute the longest common subsequence of two string arrays.
 */
function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find the LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
