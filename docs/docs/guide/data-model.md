# 02 — Core Data Model & Types

## Design Goals

- Plain JSON — serializable, diffable, version-controllable.
- Every field has a sensible default so a minimal notebook is just `{ cells: [] }`.
- Metadata is open-ended (`Record<string, unknown>`) for plugin data.
- IDs are client-generated (nanoid) — no server dependency.

---

## Notebook

```typescript
interface Notebook {
  /** Unique identifier (nanoid, 21 chars) */
  id: string;

  /** Human-readable title */
  title: string;

  /** Ordered list of cells */
  cells: Cell[];

  /** Notebook-level metadata (author, tags, theme, etc.) */
  metadata: NotebookMetadata;

  /** Schema version for forward compatibility */
  version: number; // current: 1

  /** ISO-8601 timestamps */
  createdAt: string;
  updatedAt: string;
}

interface NotebookMetadata {
  /** Author name or identifier */
  author?: string;

  /** Freeform tags */
  tags?: string[];

  /** Theme override (light | dark | custom slug) */
  theme?: string;

  /** Default cell type when user creates a new cell */
  defaultCellType?: CellType;

  /** Language hint for code cells */
  defaultLanguage?: string;

  /** Plugin-specific data keyed by plugin ID */
  pluginData?: Record<string, unknown>;

  /** Arbitrary extra fields */
  [key: string]: unknown;
}
```

---

## Cell

```typescript
type CellType =
  | "markdown"
  | "code"
  | "raw"
  | "latex"
  | "mermaid"
  | "embed"
  | "table"
  | "image"
  | string; // plugins can register custom types

interface Cell {
  /** Unique identifier within the notebook */
  id: string;

  /** Cell type — determines rendering strategy */
  type: CellType;

  /** Raw source content (Markdown, code, LaTeX, Mermaid DSL, HTML, etc.) */
  source: string;

  /** Cell-level metadata */
  metadata: CellMetadata;

  /** Outputs (for code cells or plugin-generated content) */
  outputs?: CellOutput[];

  /** Whether this cell is currently in edit mode */
  editing?: boolean;

  /** Whether this cell is collapsed in the UI */
  collapsed?: boolean;
}

interface CellMetadata {
  /** Language for code cells (e.g., "python", "javascript") */
  language?: string;

  /** Whether to show line numbers in code cells */
  lineNumbers?: boolean;

  /** Custom CSS class applied to the cell container */
  className?: string;

  /** Cell-level plugin data */
  pluginData?: Record<string, unknown>;

  /** Execution order (for code cells, if execution plugin is used) */
  executionCount?: number;

  /** Arbitrary extra fields */
  [key: string]: unknown;
}
```

---

## Cell Outputs

Outputs are produced by code execution plugins or by transform plugins.
They follow a simplified version of the Jupyter nbformat output model.

```typescript
type CellOutput =
  | StreamOutput
  | DisplayOutput
  | ErrorOutput;

interface StreamOutput {
  outputType: "stream";
  name: "stdout" | "stderr";
  text: string;
}

interface DisplayOutput {
  outputType: "display";
  /** MIME-type keyed data */
  data: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface ErrorOutput {
  outputType: "error";
  name: string;
  message: string;
  traceback?: string[];
}
```

---

## Table Cell Data

When `cell.type === "table"`, the `source` field contains JSON:

```typescript
interface TableData {
  /** Column definitions */
  columns: TableColumn[];

  /** Row data — array of arrays (column-major or row-major, configurable) */
  rows: (string | number | boolean | null)[][];

  /** Whether the first row is a header */
  hasHeader: boolean;

  /** Optional caption */
  caption?: string;
}

interface TableColumn {
  id: string;
  name: string;
  align?: "left" | "center" | "right";
  width?: number;
}
```

---

## Image Cell Data

When `cell.type === "image"`, the `source` field contains JSON:

```typescript
interface ImageData {
  /** Image source — URL, data URI, or blob reference */
  src: string;

  /** Alt text for accessibility */
  alt?: string;

  /** Display width in pixels (null = natural) */
  width?: number | null;

  /** Display height in pixels (null = natural) */
  height?: number | null;

  /** Caption below the image */
  caption?: string;

  /** Alignment */
  align?: "left" | "center" | "right";
}
```

---

## Embed Cell Data

When `cell.type === "embed"`, the `source` field contains JSON:

```typescript
interface EmbedData {
  /** Embed strategy */
  strategy: "html" | "iframe" | "component";

  /** Raw HTML (strategy: "html") */
  html?: string;

  /** URL for iframe (strategy: "iframe") */
  url?: string;

  /** Component identifier registered via plugin (strategy: "component") */
  componentId?: string;

  /** Props passed to the component */
  props?: Record<string, unknown>;

  /** Sandbox attributes for iframe */
  sandbox?: string;

  /** Fixed height in pixels */
  height?: number;
}
```

---

## Minimal Valid Notebook

```json
{
  "id": "nb_abc123",
  "title": "Untitled",
  "cells": [],
  "metadata": {},
  "version": 1,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

## Minimal Cell

```json
{
  "id": "cell_xyz789",
  "type": "markdown",
  "source": "# Hello World",
  "metadata": {}
}
```

---

## ID Generation

```typescript
import { nanoid } from "nanoid";

function generateCellId(): string {
  return `cell_${nanoid(12)}`;
}

function generateNotebookId(): string {
  return `nb_${nanoid(12)}`;
}
```

IDs are prefixed for debuggability. The 12-char nanoid gives ~2.2 trillion
combinations — collision-safe for single-user local notebooks.

---

## Serialization Contract

- `JSON.stringify(notebook)` produces the canonical serialization.
- All `Date` values are stored as ISO-8601 strings (not `Date` objects).
- `Float32Array` or typed arrays are **not** used in the document model.
  Numeric data in tables is plain `number`.
- Plugins may store arbitrary data in `metadata.pluginData[pluginId]`.
  The core never inspects plugin data — it is opaque.

---

## Validation

The core exports a `validateNotebook(doc: unknown): ValidationResult` function
that checks:

1. Required fields (`id`, `title`, `cells`, `version`).
2. Each cell has `id`, `type`, `source`.
3. No duplicate cell IDs.
4. Version is a supported number.
5. Plugin validators run if registered.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  path: string;       // e.g., "cells[2].source"
  message: string;
  severity: "error" | "warning";
}
```

---

## Migration

When `version` changes between releases, the core provides a migration chain:

```typescript
type Migrator = (doc: unknown) => Notebook;

const migrations: Record<number, Migrator> = {
  // 0 → 1: initial schema
  1: (doc) => ({ ...defaults, ...doc, version: 1 }),
};

function migrateNotebook(raw: unknown): Notebook {
  let doc = raw as Record<string, unknown>;
  const v = (doc.version as number) || 0;
  for (let i = v + 1; i <= CURRENT_VERSION; i++) {
    doc = migrations[i](doc) as Record<string, unknown>;
  }
  return doc as unknown as Notebook;
}
```
