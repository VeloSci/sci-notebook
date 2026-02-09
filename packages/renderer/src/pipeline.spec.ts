import { describe, it, expect, vi } from "vitest";
import { RenderPipeline } from "../src/pipeline";
import { Cell } from "@velo-sci/notebook-core";

describe("RenderPipeline", () => {
  const createMockCell = (id: string, source: string, type: string = "markdown", metadata: any = {}): Cell => ({
    id,
    source,
    type,
    metadata,
  });

  it("should render simple markdown", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", "# Hello");

    const result = pipeline.render(cell);

    expect(result.html).toContain("<h1>Hello</h1>");
    expect(result.cached).toBe(false);
  });

  it("should use cache for subsequent renders", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", "# Hello");

    pipeline.render(cell);
    const result = pipeline.render(cell);

    expect(result.cached).toBe(true);
  });

  it("should apply preprocessors", () => {
    const pipeline = new RenderPipeline();
    pipeline.addPreprocessor("test-pre", (src) => src.replace("TODO", "FIXME"));
    const cell = createMockCell("c1", "TODO: fix this");

    const result = pipeline.render(cell);

    expect(result.html).toContain("FIXME");
  });

  it("should apply AST transformers", () => {
    const pipeline = new RenderPipeline();
    pipeline.addASTTransformer("test-ast", (tokens) => {
      tokens.forEach(t => {
        if (t.tag === "h1") t.tag = "h2";
      });
      return tokens;
    });
    const cell = createMockCell("c1", "# Title");

    const result = pipeline.render(cell);

    expect(result.html).toContain("<h2>Title</h2>");
  });

  it("should apply postprocessors", () => {
    const pipeline = new RenderPipeline();
    pipeline.addPostprocessor("test-post", (html) => html + "<footer></footer>");
    const cell = createMockCell("c1", "content");

    const result = pipeline.render(cell);

    expect(result.html).toContain("<footer></footer>");
  });

  it("should handle custom cell types with registered renderers", () => {
    const pipeline = new RenderPipeline();
    pipeline.addRenderer({
      id: "raw-renderer",
      cellTypes: ["raw"],
      renderToHTML: (tokens, cell) => `<pre>${cell.source}</pre>`,
    });
    const cell = createMockCell("c1", "raw data", "raw");

    const result = pipeline.render(cell);

    expect(result.html).toBe("<pre>raw data</pre>");
  });

  // --- Code cell fallback ---

  it("should render code cells with pre/code tags", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", "const x = 1;", "code", { language: "javascript" });

    const result = pipeline.render(cell);

    expect(result.html).toContain('<pre class="sci-nb-code">');
    expect(result.html).toContain('<code class="language-javascript">');
    expect(result.html).toContain("const x = 1;");
  });

  it("should escape HTML in code cells", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", '<script>alert("xss")</script>', "code");

    const result = pipeline.render(cell);

    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
  });

  // --- Raw cell fallback ---

  it("should render raw cells with pre tags", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", "raw text content", "raw");

    const result = pipeline.render(cell);

    expect(result.html).toContain('<pre class="sci-nb-raw">');
    expect(result.html).toContain("raw text content");
  });

  // --- Unknown cell type fallback ---

  it("should render unknown cell types as markdown fallback", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", "**bold text**", "custom-unknown");

    const result = pipeline.render(cell);

    expect(result.html).toContain("<strong>bold text</strong>");
  });

  // --- remove() ---

  it("should remove hooks by ID", () => {
    const pipeline = new RenderPipeline();
    pipeline.addPreprocessor("removable", (src) => src + " ADDED");
    pipeline.addPostprocessor("removable", (html) => html + " POST");

    let result = pipeline.render(createMockCell("c1", "test"));
    expect(result.html).toContain("ADDED");
    expect(result.html).toContain("POST");

    pipeline.invalidateCache();
    pipeline.remove("removable");

    result = pipeline.render(createMockCell("c1", "test"));
    expect(result.html).not.toContain("ADDED");
    expect(result.html).not.toContain("POST");
  });

  // --- invalidateCache() ---

  it("should invalidate cache", () => {
    const pipeline = new RenderPipeline();
    const cell = createMockCell("c1", "# Hello");

    pipeline.render(cell);
    expect(pipeline.render(cell).cached).toBe(true);

    pipeline.invalidateCache();
    expect(pipeline.render(cell).cached).toBe(false);
  });

  // --- renderAll() ---

  it("should render all cells in batch", () => {
    const pipeline = new RenderPipeline();
    const cells = [
      createMockCell("c1", "# Title", "markdown"),
      createMockCell("c2", "x = 1", "code"),
      createMockCell("c3", "raw", "raw"),
    ];

    const results = pipeline.renderAll(cells);

    expect(results).toHaveLength(3);
    expect(results[0].html).toContain("<h1>Title</h1>");
    expect(results[1].html).toContain("x = 1");
    expect(results[2].html).toContain("raw");
  });

  // --- Priority ordering ---

  it("should respect preprocessor priority (higher runs first)", () => {
    const pipeline = new RenderPipeline();
    const order: string[] = [];
    pipeline.addPreprocessor("low", (src) => { order.push("low"); return src; }, 0);
    pipeline.addPreprocessor("high", (src) => { order.push("high"); return src; }, 10);

    pipeline.render(createMockCell("c1", "test"));

    expect(order).toEqual(["high", "low"]);
  });
});
