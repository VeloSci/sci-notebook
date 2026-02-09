/**
 * Code Executor for sci-notebook
 *
 * Provides safe JavaScript execution in a sandboxed environment.
 * For Python support, consumers can provide a Pyodide-based executor.
 *
 * Architecture:
 *   - JS execution uses Function() constructor with a controlled scope
 *   - Console output is captured (log, warn, error)
 *   - Execution has a configurable timeout
 *   - Async code is supported via async Function()
 */

import type { Cell, CellOutput } from "./types";

// ── Types ──────────────────────────────────────────────────────

export interface ExecutionResult {
  cellId: string;
  outputs: CellOutput[];
  executionCount: number;
  duration: number;
  success: boolean;
}

export interface CodeExecutorConfig {
  /** Timeout in ms (default: 5000) */
  timeout?: number;
  /** Extra globals to expose in the sandbox */
  globals?: Record<string, unknown>;
  /** Custom executor for non-JS languages */
  languageExecutors?: Record<string, LanguageExecutor>;
}

export type LanguageExecutor = (
  source: string,
  globals: Record<string, unknown>
) => Promise<ExecutionResult>;

// ── Code Executor ──────────────────────────────────────────────

export class CodeExecutor {
  private executionCount = 0;
  private timeout: number;
  private globals: Record<string, unknown>;
  private languageExecutors: Record<string, LanguageExecutor>;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: CodeExecutorConfig = {}) {
    this.timeout = config.timeout ?? 5000;
    this.globals = config.globals ?? {};
    this.languageExecutors = config.languageExecutors ?? {};
  }

  /**
   * Execute a code cell and return outputs.
   */
  async execute(cell: Cell): Promise<ExecutionResult> {
    const startTime = performance.now();
    this.executionCount++;
    const count = this.executionCount;

    const language = (cell.metadata.language as string || "javascript").toLowerCase();

    // Check for custom language executor
    if (this.languageExecutors[language]) {
      try {
        const result = await this.languageExecutors[language](cell.source, this.globals);
        return { ...result, cellId: cell.id, executionCount: count };
      } catch (e: any) {
        return {
          cellId: cell.id,
          outputs: [{ outputType: "error", name: "ExecutionError", message: e.message || String(e) }],
          executionCount: count,
          duration: performance.now() - startTime,
          success: false,
        };
      }
    }

    // Default: JavaScript execution
    if (language === "javascript" || language === "js" || language === "typescript" || language === "ts") {
      return this.executeJS(cell.id, cell.source, startTime, count);
    }

    return {
      cellId: cell.id,
      outputs: [{
        outputType: "error",
        name: "UnsupportedLanguage",
        message: `No executor available for language: ${language}`,
      }],
      executionCount: count,
      duration: performance.now() - startTime,
      success: false,
    };
  }

  /**
   * Execute all code cells in order.
   */
  async executeAll(cells: Cell[]): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    for (const cell of cells) {
      if (cell.type === "code") {
        results.push(await this.execute(cell));
      }
    }
    return results;
  }

  /**
   * Cancel execution for a specific cell.
   */
  cancel(cellId: string): void {
    const controller = this.abortControllers.get(cellId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(cellId);
    }
  }

  /**
   * Cancel all running executions.
   */
  cancelAll(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  /**
   * Register a custom language executor (e.g., Pyodide for Python).
   */
  registerLanguage(language: string, executor: LanguageExecutor): void {
    this.languageExecutors[language.toLowerCase()] = executor;
  }

  /**
   * Update sandbox globals.
   */
  setGlobals(globals: Record<string, unknown>): void {
    Object.assign(this.globals, globals);
  }

  /**
   * Reset execution count.
   */
  resetCount(): void {
    this.executionCount = 0;
  }

  // ── Private ────────────────────────────────────────────────

  private async executeJS(
    cellId: string,
    source: string,
    startTime: number,
    count: number
  ): Promise<ExecutionResult> {
    const outputs: CellOutput[] = [];
    const controller = new AbortController();
    this.abortControllers.set(cellId, controller);

    // Capture console
    const consoleMethods = {
      log: (...args: unknown[]) => {
        outputs.push({ outputType: "stream", name: "stdout", text: args.map(formatValue).join(" ") + "\n" });
      },
      warn: (...args: unknown[]) => {
        outputs.push({ outputType: "stream", name: "stderr", text: "[warn] " + args.map(formatValue).join(" ") + "\n" });
      },
      error: (...args: unknown[]) => {
        outputs.push({ outputType: "stream", name: "stderr", text: "[error] " + args.map(formatValue).join(" ") + "\n" });
      },
      info: (...args: unknown[]) => {
        outputs.push({ outputType: "stream", name: "stdout", text: "[info] " + args.map(formatValue).join(" ") + "\n" });
      },
      table: (data: unknown) => {
        outputs.push({
          outputType: "display",
          data: { "application/json": JSON.stringify(data), "text/plain": formatValue(data) },
        });
      },
      clear: () => {
        // Remove all stream outputs
        for (let i = outputs.length - 1; i >= 0; i--) {
          if (outputs[i].outputType === "stream") outputs.splice(i, 1);
        }
      },
    };

    // Build sandbox scope
    const sandbox: Record<string, unknown> = {
      console: consoleMethods,
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      RegExp,
      Promise,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      setTimeout: undefined, // Blocked
      setInterval: undefined, // Blocked
      fetch: undefined, // Blocked by default
      ...this.globals,
    };

    try {
      // Create async function with sandbox scope
      const paramNames = Object.keys(sandbox);
      const paramValues = Object.values(sandbox);

      const asyncFn = new Function(
        ...paramNames,
        `"use strict";\nreturn (async () => {\n${source}\n})();`
      );

      // Execute with timeout
      const result = await Promise.race([
        asyncFn(...paramValues),
        new Promise((_, reject) => {
          const timer = setTimeout(() => reject(new Error(`Execution timed out (${this.timeout}ms)`)), this.timeout);
          controller.signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("Execution cancelled"));
          });
        }),
      ]);

      // If the function returned a value, add it as display output
      if (result !== undefined) {
        outputs.push({
          outputType: "display",
          data: {
            "text/plain": formatValue(result),
            ...(typeof result === "object" && result !== null
              ? { "application/json": JSON.stringify(result, null, 2) }
              : {}),
          },
        });
      }

      this.abortControllers.delete(cellId);

      return {
        cellId,
        outputs,
        executionCount: count,
        duration: performance.now() - startTime,
        success: true,
      };
    } catch (e: any) {
      this.abortControllers.delete(cellId);

      if (e.message === "Execution cancelled") {
        outputs.push({ outputType: "error", name: "Cancelled", message: "Execution was cancelled" });
      } else {
        outputs.push({
          outputType: "error",
          name: e.name || "Error",
          message: e.message || String(e),
          traceback: e.stack ? e.stack.split("\n") : undefined,
        });
      }

      return {
        cellId,
        outputs,
        executionCount: count,
        duration: performance.now() - startTime,
        success: false,
      };
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────

function formatValue(val: unknown): string {
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;
  if (val instanceof Error) return `${val.name}: ${val.message}`;
  if (Array.isArray(val)) {
    if (val.length <= 10) return JSON.stringify(val);
    return `[${val.slice(0, 10).map(formatValue).join(", ")}, ... (${val.length} items)]`;
  }
  try {
    const json = JSON.stringify(val, null, 2);
    if (json.length > 500) return json.slice(0, 500) + "...";
    return json;
  } catch {
    return String(val);
  }
}
