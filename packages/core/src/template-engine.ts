/**
 * Template Engine for sci-notebook
 *
 * Processes notebook cells containing {{flag}} placeholders.
 * Resolvers can fetch data from servers, databases, APIs, etc.
 *
 * Syntax:
 *   {{variable}}           — simple replacement
 *   {{object.property}}    — dot-notation access
 *   {{#each items}}...{{/each}}  — loop
 *   {{#if condition}}...{{/if}}  — conditional
 *   {{#table dataKey}}     — auto-generate markdown table from array of objects
 *   {{#date format}}       — formatted date
 *   {{#eval expression}}   — safe expression evaluation
 */

import type { Notebook, Cell } from "./types";

// ── Types ──────────────────────────────────────────────────────

export interface TemplateContext {
  [key: string]: unknown;
}

export type TemplateResolver = (
  key: string,
  context: TemplateContext,
  cell: Readonly<Cell>
) => unknown | Promise<unknown>;

export interface TemplateEngineConfig {
  /** Static data context — available as {{key}} */
  data?: TemplateContext;
  /** Async resolvers — called when a key is not found in data */
  resolvers?: TemplateResolver[];
  /** Delimiter open/close (default: {{ and }}) */
  delimiters?: [string, string];
  /** Whether to leave unresolved flags as-is (default: false → replaces with empty) */
  preserveUnresolved?: boolean;
  /** Max iterations for loops (default: 1000) */
  maxLoopIterations?: number;
}

export interface TemplateResult {
  notebook: Notebook;
  resolvedFlags: string[];
  unresolvedFlags: string[];
  errors: Array<{ flag: string; error: string }>;
}

// ── Engine ─────────────────────────────────────────────────────

export class TemplateEngine {
  private data: TemplateContext;
  private resolvers: TemplateResolver[];
  private open: string;
  private close: string;
  private preserveUnresolved: boolean;
  private maxLoop: number;

  constructor(config: TemplateEngineConfig = {}) {
    this.data = config.data || {};
    this.resolvers = config.resolvers || [];
    this.open = config.delimiters?.[0] || "{{";
    this.close = config.delimiters?.[1] || "}}";
    this.preserveUnresolved = config.preserveUnresolved ?? false;
    this.maxLoop = config.maxLoopIterations ?? 1000;
  }

  /** Update the data context (merge) */
  setData(data: TemplateContext): void {
    this.data = { ...this.data, ...data };
  }

  /** Replace the entire data context */
  replaceData(data: TemplateContext): void {
    this.data = { ...data };
  }

  /** Add a resolver */
  addResolver(resolver: TemplateResolver): void {
    this.resolvers.push(resolver);
  }

  /** Get current data context */
  getData(): Readonly<TemplateContext> {
    return this.data;
  }

  /**
   * Process an entire notebook — resolves all {{flags}} in all cells.
   * Returns a new notebook (immutable).
   */
  async processNotebook(notebook: Readonly<Notebook>): Promise<TemplateResult> {
    const resolvedFlags: string[] = [];
    const unresolvedFlags: string[] = [];
    const errors: Array<{ flag: string; error: string }> = [];

    const processedCells: Cell[] = [];

    for (const cell of notebook.cells) {
      const processed = await this.processCell(cell, resolvedFlags, unresolvedFlags, errors);
      processedCells.push(processed);
    }

    // Also process title
    const titleResult = await this.processString(notebook.title, {} as Cell, resolvedFlags, unresolvedFlags, errors);

    return {
      notebook: {
        ...notebook,
        title: titleResult,
        cells: processedCells,
        updatedAt: new Date().toISOString(),
      },
      resolvedFlags,
      unresolvedFlags,
      errors,
    };
  }

  /**
   * Process a single cell
   */
  async processCell(
    cell: Readonly<Cell>,
    resolvedFlags: string[] = [],
    unresolvedFlags: string[] = [],
    errors: Array<{ flag: string; error: string }> = []
  ): Promise<Cell> {
    const source = await this.processString(cell.source, cell, resolvedFlags, unresolvedFlags, errors);
    return { ...cell, source };
  }

  /**
   * Process a single string with template flags
   */
  async processString(
    input: string,
    cell: Readonly<Cell>,
    resolvedFlags: string[] = [],
    unresolvedFlags: string[] = [],
    errors: Array<{ flag: string; error: string }> = []
  ): Promise<string> {
    let result = input;

    // 1. Process block directives first (#each, #if, #table)
    result = await this.processBlocks(result, cell, resolvedFlags, unresolvedFlags, errors);

    // 2. Process inline flags
    result = await this.processInlineFlags(result, cell, resolvedFlags, unresolvedFlags, errors);

    return result;
  }

  // ── Block directives ───────────────────────────────────────

  private async processBlocks(
    input: string,
    cell: Readonly<Cell>,
    resolved: string[],
    unresolved: string[],
    errors: Array<{ flag: string; error: string }>
  ): Promise<string> {
    let result = input;

    // {{#table dataKey columns?}}
    result = await this.processTableBlocks(result, cell, resolved, unresolved, errors);

    // {{#each items}}...{{/each}}
    result = await this.processEachBlocks(result, cell, resolved, unresolved, errors);

    // {{#if condition}}...{{else}}...{{/if}}
    result = await this.processIfBlocks(result, cell, resolved, unresolved, errors);

    // {{#date format?}}
    result = this.processDateFlags(result, resolved);

    return result;
  }

  private async processTableBlocks(
    input: string,
    cell: Readonly<Cell>,
    resolved: string[],
    unresolved: string[],
    errors: Array<{ flag: string; error: string }>
  ): Promise<string> {
    const tableRegex = new RegExp(
      escapeRegex(this.open) + `#table\\s+([\\w.]+)(?:\\s+([\\w,]+))?` + escapeRegex(this.close),
      "g"
    );

    let result = input;
    let match: RegExpExecArray | null;
    // Reset lastIndex for safety
    tableRegex.lastIndex = 0;

    while ((match = tableRegex.exec(result)) !== null) {
      const fullMatch = match[0];
      const dataKey = match[1];
      const columnsStr = match[2];

      const value = await this.resolveValue(dataKey, cell);

      if (!Array.isArray(value)) {
        if (value === undefined) {
          unresolved.push(`#table ${dataKey}`);
          if (!this.preserveUnresolved) {
            result = result.replace(fullMatch, `<!-- table: ${dataKey} not found -->`);
          }
        } else {
          errors.push({ flag: `#table ${dataKey}`, error: "Value is not an array" });
          result = result.replace(fullMatch, `<!-- table: ${dataKey} is not an array -->`);
        }
        continue;
      }

      resolved.push(`#table ${dataKey}`);

      // Determine columns
      let columns: string[];
      if (columnsStr) {
        columns = columnsStr.split(",").map(c => c.trim());
      } else if (value.length > 0 && typeof value[0] === "object") {
        columns = Object.keys(value[0] as Record<string, unknown>);
      } else {
        columns = ["value"];
      }

      // Build markdown table
      const header = `| ${columns.join(" | ")} |`;
      const separator = `| ${columns.map(() => "---").join(" | ")} |`;
      const rows = value.slice(0, this.maxLoop).map((item: any) => {
        const cells = columns.map(col => {
          if (typeof item === "object" && item !== null) {
            return String(item[col] ?? "");
          }
          return String(item ?? "");
        });
        return `| ${cells.join(" | ")} |`;
      });

      const table = [header, separator, ...rows].join("\n");
      result = result.replace(fullMatch, table);
      // Reset regex after replacement
      tableRegex.lastIndex = 0;
    }

    return result;
  }

  private async processEachBlocks(
    input: string,
    cell: Readonly<Cell>,
    resolved: string[],
    unresolved: string[],
    errors: Array<{ flag: string; error: string }>
  ): Promise<string> {
    const eachOpen = new RegExp(
      escapeRegex(this.open) + `#each\\s+([\\w.]+)` + escapeRegex(this.close),
      "g"
    );
    const eachClose = `${this.open}/each${this.close}`;

    let result = input;
    let safety = 0;

    while (result.includes(`${this.open}#each`) && safety++ < 50) {
      eachOpen.lastIndex = 0;
      const match = eachOpen.exec(result);
      if (!match) break;

      const startIdx = match.index;
      const afterOpen = startIdx + match[0].length;
      const endIdx = result.indexOf(eachClose, afterOpen);
      if (endIdx === -1) break;

      const dataKey = match[1];
      const template = result.slice(afterOpen, endIdx);
      const fullBlock = result.slice(startIdx, endIdx + eachClose.length);

      const value = await this.resolveValue(dataKey, cell);

      if (!Array.isArray(value)) {
        unresolved.push(`#each ${dataKey}`);
        result = result.replace(fullBlock, this.preserveUnresolved ? fullBlock : "");
        continue;
      }

      resolved.push(`#each ${dataKey}`);

      const rendered: string[] = [];
      const limit = Math.min(value.length, this.maxLoop);
      for (let i = 0; i < limit; i++) {
        let itemStr = template;
        const item = value[i];

        // Replace {{.}} with the item itself (for primitives)
        itemStr = itemStr.replace(
          new RegExp(escapeRegex(this.open) + `\\.` + escapeRegex(this.close), "g"),
          String(item ?? "")
        );

        // Replace {{.property}} for objects
        if (typeof item === "object" && item !== null) {
          for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
            itemStr = itemStr.replace(
              new RegExp(escapeRegex(this.open) + `\\.${escapeRegex(k)}` + escapeRegex(this.close), "g"),
              String(v ?? "")
            );
          }
        }

        // Replace {{@index}}
        itemStr = itemStr.replace(
          new RegExp(escapeRegex(this.open) + `@index` + escapeRegex(this.close), "g"),
          String(i)
        );

        rendered.push(itemStr);
      }

      result = result.replace(fullBlock, rendered.join(""));
    }

    return result;
  }

  private async processIfBlocks(
    input: string,
    cell: Readonly<Cell>,
    resolved: string[],
    unresolved: string[],
    _errors: Array<{ flag: string; error: string }>
  ): Promise<string> {
    const ifOpen = new RegExp(
      escapeRegex(this.open) + `#if\\s+([\\w.]+)` + escapeRegex(this.close),
      "g"
    );
    const ifClose = `${this.open}/if${this.close}`;
    const elseTag = `${this.open}else${this.close}`;

    let result = input;
    let safety = 0;

    while (result.includes(`${this.open}#if`) && safety++ < 50) {
      ifOpen.lastIndex = 0;
      const match = ifOpen.exec(result);
      if (!match) break;

      const startIdx = match.index;
      const afterOpen = startIdx + match[0].length;
      const endIdx = result.indexOf(ifClose, afterOpen);
      if (endIdx === -1) break;

      const condKey = match[1];
      const body = result.slice(afterOpen, endIdx);
      const fullBlock = result.slice(startIdx, endIdx + ifClose.length);

      const value = await this.resolveValue(condKey, cell);
      const truthy = isTruthy(value);

      resolved.push(`#if ${condKey}`);

      const elseIdx = body.indexOf(elseTag);
      let output: string;
      if (elseIdx !== -1) {
        output = truthy
          ? body.slice(0, elseIdx)
          : body.slice(elseIdx + elseTag.length);
      } else {
        output = truthy ? body : "";
      }

      result = result.replace(fullBlock, output);
    }

    return result;
  }

  private processDateFlags(input: string, resolved: string[]): string {
    const dateRegex = new RegExp(
      escapeRegex(this.open) + `#date(?:\\s+([^}]+))?` + escapeRegex(this.close),
      "g"
    );

    return input.replace(dateRegex, (_match, format?: string) => {
      resolved.push("#date");
      const now = new Date();
      if (!format || format.trim() === "") {
        return now.toLocaleDateString();
      }
      // Simple format tokens
      return format
        .replace("YYYY", String(now.getFullYear()))
        .replace("MM", String(now.getMonth() + 1).padStart(2, "0"))
        .replace("DD", String(now.getDate()).padStart(2, "0"))
        .replace("HH", String(now.getHours()).padStart(2, "0"))
        .replace("mm", String(now.getMinutes()).padStart(2, "0"))
        .replace("ss", String(now.getSeconds()).padStart(2, "0"));
    });
  }

  // ── Inline flags ───────────────────────────────────────────

  private async processInlineFlags(
    input: string,
    cell: Readonly<Cell>,
    resolved: string[],
    unresolved: string[],
    errors: Array<{ flag: string; error: string }>
  ): Promise<string> {
    const flagRegex = new RegExp(
      escapeRegex(this.open) + `\\s*([\\w.]+(?:\\s*\\|\\s*[\\w]+)*)\\s*` + escapeRegex(this.close),
      "g"
    );

    const replacements: Array<{ match: string; replacement: string }> = [];
    let m: RegExpExecArray | null;

    while ((m = flagRegex.exec(input)) !== null) {
      const fullMatch = m[0];
      const expr = m[1].trim();

      // Check for pipe filters: {{value | uppercase}}
      const parts = expr.split(/\s*\|\s*/);
      const key = parts[0];
      const filters = parts.slice(1);

      try {
        let value = await this.resolveValue(key, cell);

        if (value === undefined) {
          unresolved.push(key);
          replacements.push({
            match: fullMatch,
            replacement: this.preserveUnresolved ? fullMatch : "",
          });
          continue;
        }

        // Apply filters
        for (const filter of filters) {
          value = applyFilter(value, filter);
        }

        resolved.push(key);
        replacements.push({
          match: fullMatch,
          replacement: String(value ?? ""),
        });
      } catch (err: any) {
        errors.push({ flag: key, error: err.message || String(err) });
        replacements.push({
          match: fullMatch,
          replacement: this.preserveUnresolved ? fullMatch : "",
        });
      }
    }

    // Apply replacements in reverse order to preserve indices
    let result = input;
    for (const { match, replacement } of replacements.reverse()) {
      const idx = result.lastIndexOf(match);
      if (idx !== -1) {
        result = result.slice(0, idx) + replacement + result.slice(idx + match.length);
      }
    }

    return result;
  }

  // ── Value resolution ───────────────────────────────────────

  private async resolveValue(key: string, cell: Readonly<Cell>): Promise<unknown> {
    // 1. Check static data (dot-notation)
    const staticVal = getNestedValue(this.data, key);
    if (staticVal !== undefined) return staticVal;

    // 2. Try resolvers in order
    for (const resolver of this.resolvers) {
      const val = await resolver(key, this.data, cell);
      if (val !== undefined) return val;
    }

    return undefined;
  }
}

// ── Helpers ──────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function isTruthy(value: unknown): boolean {
  if (value === undefined || value === null || value === false || value === 0 || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function applyFilter(value: unknown, filter: string): unknown {
  const str = String(value ?? "");
  switch (filter.toLowerCase()) {
    case "uppercase": return str.toUpperCase();
    case "lowercase": return str.toLowerCase();
    case "capitalize": return str.charAt(0).toUpperCase() + str.slice(1);
    case "trim": return str.trim();
    case "number": return Number(str);
    case "json": return JSON.stringify(value, null, 2);
    case "length": return Array.isArray(value) ? value.length : str.length;
    case "keys": return typeof value === "object" && value ? Object.keys(value).join(", ") : str;
    case "round": return Math.round(Number(str));
    case "fixed2": return Number(str).toFixed(2);
    case "currency": return `$${Number(str).toFixed(2)}`;
    case "percent": return `${(Number(str) * 100).toFixed(1)}%`;
    default: return value;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
