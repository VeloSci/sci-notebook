export * from "./types";
export * from "./event-bus";
export * from "./history";
export * from "./keybindings";
export * from "./selection";
export * from "./utils";
export * from "./editor-engine";
export * from "./template-engine";
export * from "./export-engine";
export * from "./code-executor";
export * from "./version-history";
export * from "./presentation";
export * from "./mobile-adapter";

import { Notebook } from "./types";
import { EditorEngine, EditorEngineConfig } from "./editor-engine";
import { generateNotebookId, validateNotebook } from "./utils";

export const CURRENT_VERSION = 1;

/**
 * Factory function to create a new notebook instance
 */
export function createNotebook(options: {
  notebook?: Partial<Notebook>;
  config?: EditorEngineConfig;
} = {}): EditorEngine {
  const notebook: Notebook = {
    id: options.notebook?.id || generateNotebookId(),
    title: options.notebook?.title || "Untitled",
    cells: options.notebook?.cells || [],
    metadata: options.notebook?.metadata || {},
    version: options.notebook?.version || CURRENT_VERSION,
    createdAt: options.notebook?.createdAt || new Date().toISOString(),
    updatedAt: options.notebook?.updatedAt || new Date().toISOString(),
  };

  return new EditorEngine(notebook, options.config);
}

/**
 * Load and migrate a notebook from JSON.
 * Applies migrations if the version is older than CURRENT_VERSION.
 * Validates the result and throws on critical errors.
 */
export function loadNotebook(json: string | object): Notebook {
  const raw = typeof json === "string" ? JSON.parse(json) : json;
  const doc = migrateNotebook(raw);

  const result = validateNotebook(doc);
  if (!result.valid) {
    const critical = result.errors.filter(e => e.severity === "error");
    if (critical.length > 0) {
      throw new Error(`Invalid notebook: ${critical.map(e => e.message).join("; ")}`);
    }
  }

  return doc;
}

/**
 * Serialize a notebook to JSON
 */
export function saveNotebook(notebook: Notebook, pretty: boolean = true): string {
  return JSON.stringify(notebook, null, pretty ? 2 : 0);
}

/**
 * Apply migrations to bring a notebook document up to CURRENT_VERSION.
 */
function migrateNotebook(raw: any): Notebook {
  const doc = { ...raw };

  // Ensure version field exists
  if (typeof doc.version !== "number") {
    doc.version = 0;
  }

  // Migration: 0 → 1 (initial schema normalization)
  if (doc.version < 1) {
    doc.id = doc.id || generateNotebookId();
    doc.title = doc.title || "Untitled";
    doc.cells = Array.isArray(doc.cells) ? doc.cells : [];
    doc.metadata = doc.metadata || {};
    doc.createdAt = doc.createdAt || new Date().toISOString();
    doc.updatedAt = doc.updatedAt || new Date().toISOString();
    doc.version = 1;

    // Normalize cells
    doc.cells = doc.cells.map((cell: any, i: number) => ({
      id: cell.id || `cell_migrated_${i}`,
      type: cell.type || "markdown",
      source: typeof cell.source === "string" ? cell.source : String(cell.source ?? ""),
      metadata: cell.metadata || {},
      outputs: cell.outputs,
      editing: false,
      collapsed: false,
    }));
  }

  // Future migrations go here:
  // if (doc.version < 2) { ... doc.version = 2; }

  return doc as Notebook;
}
