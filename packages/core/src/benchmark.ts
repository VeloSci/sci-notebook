/**
 * Performance benchmarks for sci-notebook core operations.
 *
 * Run with: npx tsx packages/core/src/benchmark.ts
 * Or import and call runBenchmarks() programmatically.
 */

import { EditorEngine } from "./editor-engine";
import { TemplateEngine } from "./template-engine";
import { exportToHTML, exportToMarkdown, exportToIPYNB, exportToJSON } from "./export-engine";
import { CodeExecutor } from "./code-executor";
import { VersionHistory } from "./version-history";
import type { Notebook, Cell } from "./types";

// ── Helpers ──────────────────────────────────────────────────

function generateNotebook(cellCount: number): Notebook {
  const cells: Cell[] = [];
  for (let i = 0; i < cellCount; i++) {
    const type = i % 5 === 0 ? "code" : i % 3 === 0 ? "latex" : "markdown";
    cells.push({
      id: `cell_${i}`,
      type: type as Cell["type"],
      source: type === "markdown"
        ? `# Heading ${i}\n\nThis is paragraph ${i} with **bold** and *italic* text.\n\n- Item 1\n- Item 2\n- Item 3`
        : type === "code"
        ? `const x = ${i};\nconsole.log("Result:", x * 2);\nreturn x;`
        : `$$\\int_0^{${i}} x^2 \\, dx = \\frac{${i}^3}{3}$$`,
      metadata: { language: type === "code" ? "javascript" : undefined },
    });
  }
  return {
    id: "bench_nb",
    title: "Benchmark Notebook",
    cells,
    metadata: {},
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function measure(name: string, fn: () => void, iterations = 100): BenchmarkResult {
  // Warmup
  for (let i = 0; i < 3; i++) fn();

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  return { name, iterations, avgMs: avg, p50Ms: p50, p95Ms: p95, p99Ms: p99 };
}

async function measureAsync(name: string, fn: () => Promise<void>, iterations = 50): Promise<BenchmarkResult> {
  // Warmup
  for (let i = 0; i < 2; i++) await fn();

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  return { name, iterations, avgMs: avg, p50Ms: p50, p95Ms: p95, p99Ms: p99 };
}

// ── Types ──────────────────────────────────────────────────

export interface BenchmarkResult {
  name: string;
  iterations: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface BenchmarkSuite {
  timestamp: string;
  results: BenchmarkResult[];
}

// ── Benchmarks ──────────────────────────────────────────────

export async function runBenchmarks(): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];

  // --- EditorEngine ---
  const nb10 = generateNotebook(10);
  const nb100 = generateNotebook(100);
  const nb500 = generateNotebook(500);

  results.push(measure("EditorEngine: create (10 cells)", () => {
    new EditorEngine(structuredClone(nb10));
  }));

  results.push(measure("EditorEngine: create (100 cells)", () => {
    new EditorEngine(structuredClone(nb100));
  }));

  results.push(measure("EditorEngine: create (500 cells)", () => {
    new EditorEngine(structuredClone(nb500));
  }, 20));

  results.push(measure("EditorEngine: insertCell (into 100)", () => {
    const engine = new EditorEngine(structuredClone(nb100));
    engine.insertCell(50, "markdown");
  }));

  results.push(measure("EditorEngine: deleteCell (from 100)", () => {
    const engine = new EditorEngine(structuredClone(nb100));
    engine.deleteCell("cell_50");
  }));

  results.push(measure("EditorEngine: moveCell (in 100)", () => {
    const engine = new EditorEngine(structuredClone(nb100));
    engine.moveCell("cell_10", 90);
  }));

  results.push(measure("EditorEngine: updateCellSource (100 cells)", () => {
    const engine = new EditorEngine(structuredClone(nb100));
    engine.updateCellSource("cell_50", "Updated content " + Math.random());
  }));

  // --- Export Engine ---
  results.push(measure("ExportEngine: toHTML (10 cells)", () => {
    exportToHTML(nb10);
  }));

  results.push(measure("ExportEngine: toHTML (100 cells)", () => {
    exportToHTML(nb100);
  }));

  results.push(measure("ExportEngine: toMarkdown (100 cells)", () => {
    exportToMarkdown(nb100);
  }));

  results.push(measure("ExportEngine: toIPYNB (100 cells)", () => {
    exportToIPYNB(nb100);
  }));

  results.push(measure("ExportEngine: toJSON (100 cells)", () => {
    exportToJSON(nb100);
  }));

  // --- Template Engine ---
  const templateData = {
    title: "Report",
    author: "Test",
    items: Array.from({ length: 20 }, (_, i) => ({ name: `Item ${i}`, value: i * 10 })),
    showDetails: true,
  };

  const templateNb = generateNotebook(10);
  templateNb.cells[0].source = "# {{title}} by {{author | uppercase}}";
  templateNb.cells[1].source = "{{#each items}}\n- {{.name}}: {{.value | currency}}\n{{/each}}";
  templateNb.cells[2].source = "{{#if showDetails}}\nDetails shown\n{{/if}}";

  const te = new TemplateEngine({ data: templateData });

  results.push(await measureAsync("TemplateEngine: processNotebook (10 cells, 20 items)", async () => {
    await te.processNotebook(structuredClone(templateNb));
  }));

  // --- Code Executor ---
  const executor = new CodeExecutor({ timeout: 1000 });
  const codeCell: Cell = {
    id: "bench_code",
    type: "code",
    source: 'const arr = Array.from({length: 100}, (_, i) => i);\nconst sum = arr.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);\nreturn sum;',
    metadata: { language: "javascript" },
  };

  results.push(await measureAsync("CodeExecutor: execute JS (array sum)", async () => {
    await executor.execute(codeCell);
  }));

  // --- Version History ---
  results.push(measure("VersionHistory: save (100 cells)", () => {
    const vh = new VersionHistory({ maxEntries: 100 });
    vh.save(nb100, "snapshot");
  }));

  results.push(measure("VersionHistory: restore (100 cells)", () => {
    const vh = new VersionHistory();
    const entry = vh.save(nb100, "snapshot");
    vh.restore(entry.id);
  }));

  const vh = new VersionHistory();
  const e1 = vh.save(nb100, "v1");
  const nb100mod = structuredClone(nb100);
  nb100mod.cells[50].source = "Modified";
  const e2 = vh.save(nb100mod, "v2");

  results.push(measure("VersionHistory: diff (100 cells)", () => {
    vh.diff(e1.id, e2.id);
  }));

  return {
    timestamp: new Date().toISOString(),
    results,
  };
}

/**
 * Format benchmark results as a readable table string.
 */
export function formatBenchmarks(suite: BenchmarkSuite): string {
  const lines: string[] = [
    `# sci-notebook Performance Benchmarks`,
    ``,
    `Date: ${suite.timestamp}`,
    ``,
    `| Benchmark | Iterations | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) |`,
    `|-----------|-----------|----------|----------|----------|----------|`,
  ];

  for (const r of suite.results) {
    lines.push(
      `| ${r.name} | ${r.iterations} | ${r.avgMs.toFixed(3)} | ${r.p50Ms.toFixed(3)} | ${r.p95Ms.toFixed(3)} | ${r.p99Ms.toFixed(3)} |`
    );
  }

  return lines.join("\n");
}
