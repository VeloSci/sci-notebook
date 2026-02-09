import { describe, it, expect } from "vitest";
import { runBenchmarks, formatBenchmarks } from "./benchmark";

describe("Performance Benchmarks", () => {
  it("runs all benchmarks and produces results", async () => {
    const suite = await runBenchmarks();
    expect(suite.results.length).toBeGreaterThan(0);
    expect(suite.timestamp).toBeTruthy();

    // All benchmarks should complete in reasonable time
    for (const r of suite.results) {
      expect(r.avgMs).toBeGreaterThan(0);
      expect(r.avgMs).toBeLessThan(1000); // No single op should take >1s avg
      expect(r.iterations).toBeGreaterThan(0);
    }

    // Format should produce a markdown table
    const formatted = formatBenchmarks(suite);
    expect(formatted).toContain("| Benchmark");
    expect(formatted).toContain("EditorEngine");
    expect(formatted).toContain("ExportEngine");
  }, 30000); // 30s timeout for benchmarks
});
