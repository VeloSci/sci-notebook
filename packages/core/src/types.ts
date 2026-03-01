/**
 * Core types for sci-notebook
 */

export type CellType =
  | "markdown"
  | "code"
  | "raw"
  | "latex"
  | "mermaid"
  | "embed"
  | "table"
  | "image"
  | "component"
  | "notebook"
  | string;

export interface Notebook {
  /** Unique identifier (nanoid, 21 chars) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Ordered list of cells */
  cells: Cell[];
  /** Notebook-level metadata (author, tags, theme, etc.) */
  metadata: NotebookMetadata;
  /** Schema version for forward compatibility */
  version: number;
  /** ISO-8601 timestamps */
  createdAt: string;
  updatedAt: string;
}

export interface NotebookMetadata {
  author?: string;
  tags?: string[];
  theme?: string;
  defaultCellType?: CellType;
  defaultLanguage?: string;
  pluginData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Cell {
  /** Unique identifier within the notebook */
  id: string;
  /** Cell type \u2014 determines rendering strategy */
  type: CellType;
  /** Raw source content */
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

export interface CellMetadata {
  language?: string;
  lineNumbers?: boolean;
  className?: string;
  pluginData?: Record<string, unknown>;
  executionCount?: number;
  [key: string]: unknown;
}

export type CellOutput = StreamOutput | DisplayOutput | ErrorOutput;

export interface StreamOutput {
  outputType: "stream";
  name: "stdout" | "stderr";
  text: string;
}

export interface DisplayOutput {
  outputType: "display";
  data: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface ErrorOutput {
  outputType: "error";
  name: string;
  message: string;
  traceback?: string[];
}

// --- Plugin System ---

export interface SciNotebookPlugin {
  id: string;
  name: string;
  version: string;
  apiVersion?: string;
  dependencies?: string[];
  setup?(ctx: PluginContext): void | Promise<void>;
  teardown?(ctx: PluginContext): void | Promise<void>;
  cellTypes?: CustomCellType[];
  rendering?: PluginRenderingHooks;
}

export interface PluginContext {
  getNotebook(): Readonly<Notebook>;
  getCell(id: string): Readonly<Cell> | undefined;
  updateCellSource(id: string, source: string): void;
  updateCellMetadata(id: string, meta: Partial<CellMetadata>): void;
  insertCell(index: number, type?: CellType, source?: string): Cell;
  deleteCell(id: string): void;
  on(event: string, handler: (payload: any) => void): () => void;
  emit(event: string, payload: any): void;
  addPreprocessor(fn: (source: string, cell: Cell) => string, priority?: number): void;
  addASTTransformer(fn: (tokens: any[], cell: Cell) => any[], priority?: number): void;
  addRenderer(renderer: any): void;
  addPostprocessor(fn: (html: string, cell: Cell) => string, priority?: number): void;
  log: {
    info(msg: string): void;
    error(msg: string): void;
    warn(msg: string): void;
  };
}

export interface CustomCellType {
  type: string;
  displayName: string;
  icon?: string;
  defaultSource?: string;
  supportsDualMode?: boolean;
}

export interface PluginRenderingHooks {
  preprocess?: (source: string, cell: Cell) => string;
  transformAST?: (tokens: any[], cell: Cell) => any[];
  postprocess?: (html: string, cell: Cell) => string;
  priority?: number;
}
