import { describe, it, expect } from "vitest";
import { exportToHTML, exportToMarkdown, exportToIPYNB, exportToJSON } from "./export-engine";
import type { Notebook } from "./types";

function makeNotebook(): Notebook {
  return {
    id: "nb1",
    title: "Test Notebook",
    cells: [
      { id: "c1", type: "markdown", source: "# Hello\n\nWorld", metadata: {} },
      { id: "c2", type: "code", source: "console.log('hi')", metadata: { language: "javascript" } },
      { id: "c3", type: "latex", source: "$$\\int_0^1 x dx$$", metadata: {} },
      { id: "c4", type: "raw", source: "raw text", metadata: {} },
      { id: "c5", type: "image", source: "https://example.com/img.png", metadata: { alt: "test", caption: "A caption", width: "50%", align: "center" } },
      { id: "c6", type: "embed", source: "https://youtube.com/embed/abc", metadata: { height: "400px" } },
    ],
    metadata: { author: "tester" },
    version: 1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
}

describe("exportToHTML", () => {
  it("produces valid HTML with all cell types", () => {
    const result = exportToHTML(makeNotebook());
    expect(result.mimeType).toBe("text/html");
    expect(result.extension).toBe("html");
    expect(result.content).toContain("<!DOCTYPE html>");
    expect(result.content).toContain("Test Notebook");
    expect(result.content).toContain("sci-nb-cell--markdown");
    expect(result.content).toContain("sci-nb-cell--code");
    expect(result.content).toContain("language-javascript");
    expect(result.content).toContain("sci-nb-cell--latex");
    expect(result.content).toContain("sci-nb-cell--raw");
    expect(result.content).toContain("sci-nb-cell--image");
    expect(result.content).toContain("sci-nb-cell--embed");
    expect(result.content).toContain("tester");
  });

  it("uses custom title", () => {
    const result = exportToHTML(makeNotebook(), { title: "Custom Title" });
    expect(result.content).toContain("Custom Title");
    expect(result.filename).toBe("custom-title.html");
  });

  it("uses custom renderCell", () => {
    const result = exportToHTML(makeNotebook(), {
      renderCell: (cell) => `<p>CUSTOM:${cell.type}</p>`,
    });
    expect(result.content).toContain("CUSTOM:markdown");
    expect(result.content).toContain("CUSTOM:code");
  });
});

describe("exportToMarkdown", () => {
  it("produces markdown with all cell types", () => {
    const result = exportToMarkdown(makeNotebook());
    expect(result.mimeType).toBe("text/markdown");
    expect(result.extension).toBe("md");
    expect(result.content).toContain("# Test Notebook");
    expect(result.content).toContain("# Hello");
    expect(result.content).toContain("```javascript");
    expect(result.content).toContain("console.log('hi')");
    expect(result.content).toContain("$$\\int_0^1 x dx$$");
    expect(result.content).toContain("raw text");
    expect(result.content).toContain("![test](https://example.com/img.png)");
    expect(result.content).toContain("*A caption*");
  });
});

describe("exportToIPYNB", () => {
  it("produces valid ipynb JSON", () => {
    const result = exportToIPYNB(makeNotebook());
    expect(result.mimeType).toBe("application/x-ipynb+json");
    expect(result.extension).toBe("ipynb");

    const ipynb = JSON.parse(result.content);
    expect(ipynb.nbformat).toBe(4);
    expect(ipynb.cells).toHaveLength(6);
    expect(ipynb.cells[0].cell_type).toBe("markdown");
    expect(ipynb.cells[1].cell_type).toBe("code");
    expect(ipynb.cells[3].cell_type).toBe("raw");
    // latex, image, embed → markdown in ipynb
    expect(ipynb.cells[2].cell_type).toBe("markdown");
  });

  it("includes code cell outputs", () => {
    const nb = makeNotebook();
    nb.cells[1].outputs = [
      { outputType: "stream", name: "stdout", text: "hi\n" },
    ];
    const result = exportToIPYNB(nb);
    const ipynb = JSON.parse(result.content);
    expect(ipynb.cells[1].outputs).toHaveLength(1);
    expect(ipynb.cells[1].outputs[0].output_type).toBe("stream");
  });
});

describe("exportToJSON", () => {
  it("produces valid JSON", () => {
    const result = exportToJSON(makeNotebook());
    expect(result.mimeType).toBe("application/json");
    const parsed = JSON.parse(result.content);
    expect(parsed.id).toBe("nb1");
    expect(parsed.cells).toHaveLength(6);
  });
});
