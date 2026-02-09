import { describe, it, expect } from "vitest";
import { CodeExecutor } from "./code-executor";
import type { Cell } from "./types";

function makeCodeCell(source: string, language = "javascript"): Cell {
  return { id: "c1", type: "code", source, metadata: { language } };
}

describe("CodeExecutor", () => {
  it("executes simple JS and captures console.log", async () => {
    const executor = new CodeExecutor();
    const result = await executor.execute(makeCodeCell('console.log("hello")'));
    expect(result.success).toBe(true);
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0].outputType).toBe("stream");
    if (result.outputs[0].outputType === "stream") {
      expect(result.outputs[0].text).toContain("hello");
    }
  });

  it("captures return value as display output", async () => {
    const executor = new CodeExecutor();
    const result = await executor.execute(makeCodeCell("return 42"));
    expect(result.success).toBe(true);
    const display = result.outputs.find(o => o.outputType === "display");
    expect(display).toBeDefined();
    if (display?.outputType === "display") {
      expect(display.data["text/plain"]).toBe("42");
    }
  });

  it("captures errors", async () => {
    const executor = new CodeExecutor();
    const result = await executor.execute(makeCodeCell("throw new Error('boom')"));
    expect(result.success).toBe(false);
    const err = result.outputs.find(o => o.outputType === "error");
    expect(err).toBeDefined();
    if (err?.outputType === "error") {
      expect(err.message).toContain("boom");
    }
  });

  it("captures console.warn and console.error as stderr", async () => {
    const executor = new CodeExecutor();
    const result = await executor.execute(makeCodeCell('console.warn("w"); console.error("e")'));
    expect(result.success).toBe(true);
    const stderrs = result.outputs.filter(o => o.outputType === "stream" && o.name === "stderr");
    expect(stderrs).toHaveLength(2);
  });

  it("increments execution count", async () => {
    const executor = new CodeExecutor();
    const r1 = await executor.execute(makeCodeCell("1"));
    const r2 = await executor.execute(makeCodeCell("2"));
    expect(r2.executionCount).toBe(r1.executionCount + 1);
  });

  it("supports custom globals", async () => {
    const executor = new CodeExecutor({ globals: { myVar: 99 } });
    const result = await executor.execute(makeCodeCell("return myVar"));
    expect(result.success).toBe(true);
    const display = result.outputs.find(o => o.outputType === "display");
    if (display?.outputType === "display") {
      expect(display.data["text/plain"]).toBe("99");
    }
  });

  it("reports unsupported language", async () => {
    const executor = new CodeExecutor();
    const result = await executor.execute(makeCodeCell("print('hi')", "fortran"));
    expect(result.success).toBe(false);
    const err = result.outputs.find(o => o.outputType === "error");
    if (err?.outputType === "error") {
      expect(err.message).toContain("fortran");
    }
  });

  it("supports async code", async () => {
    const executor = new CodeExecutor();
    const result = await executor.execute(makeCodeCell("return await Promise.resolve(7)"));
    expect(result.success).toBe(true);
    const display = result.outputs.find(o => o.outputType === "display");
    if (display?.outputType === "display") {
      expect(display.data["text/plain"]).toBe("7");
    }
  });

  it("supports custom language executors", async () => {
    const executor = new CodeExecutor();
    executor.registerLanguage("custom", async (source) => ({
      cellId: "c1",
      outputs: [{ outputType: "stream" as const, name: "stdout" as const, text: `custom:${source}` }],
      executionCount: 1,
      duration: 0,
      success: true,
    }));
    const result = await executor.execute(makeCodeCell("test", "custom"));
    expect(result.success).toBe(true);
    if (result.outputs[0].outputType === "stream") {
      expect(result.outputs[0].text).toBe("custom:test");
    }
  });

  it("executeAll runs only code cells", async () => {
    const executor = new CodeExecutor();
    const cells: Cell[] = [
      { id: "c1", type: "markdown", source: "# hi", metadata: {} },
      makeCodeCell('console.log("a")'),
      { id: "c3", type: "raw", source: "raw", metadata: {} },
      makeCodeCell('console.log("b")'),
    ];
    const results = await executor.executeAll(cells);
    expect(results).toHaveLength(2);
  });
});
