import { describe, it, expect } from "vitest";
import {
  MATH_CATEGORIES,
  DEFAULT_COMMANDS,
  LATEX_COMMANDS,
  renderImagePreview,
  renderEmbedPreview,
  renderTablePreview,
  renderCellOutput,
  renderCellOutputs,
  buildTOCItems,
} from "./index";
import { createNotebook } from "@velo-sci/notebook-core";

describe("Svelte adapter — exports", () => {
  it("exports all expected items", async () => {
    const mod = await import("./index");
    const expectedExports = [
      "SciNotebookSvelte", "createNotebookStore",
      "MATH_CATEGORIES",
      "FloatingToolbar", "SlashCommandMenu", "DEFAULT_COMMANDS",
      "buildTOCItems", "createTOCSidebar",
      "FindReplaceBar",
      "renderCellOutput", "renderCellOutputs",
      "renderImagePreview", "renderEmbedPreview", "renderTablePreview",
      "renderMermaidToSvg", "initMermaid",
      "LatexAutocompleteMenu", "LATEX_COMMANDS",
      "ChatSidebarPanel", "AIRewritePanel", "AICellGeneratePanel",
      "GhostTextOverlay", "ImageResizeHandle",
    ];
    for (const name of expectedExports) {
      expect((mod as any)[name], `Missing export: ${name}`).toBeDefined();
    }
  });
});

describe("Svelte adapter — MATH_CATEGORIES", () => {
  it("has 9 categories", () => {
    expect(MATH_CATEGORIES).toHaveLength(9);
  });

  it("each category has name, icon, and blocks", () => {
    for (const cat of MATH_CATEGORIES) {
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(Array.isArray(cat.blocks)).toBe(true);
      expect(cat.blocks.length).toBeGreaterThan(0);
    }
  });
});

describe("Svelte adapter — DEFAULT_COMMANDS", () => {
  it("has at least 8 commands", () => {
    expect(DEFAULT_COMMANDS.length).toBeGreaterThanOrEqual(8);
  });

  it("includes markdown, code, latex, image, embed, table types", () => {
    const types = DEFAULT_COMMANDS.map(c => c.type);
    expect(types).toContain("markdown");
    expect(types).toContain("code");
    expect(types).toContain("latex");
    expect(types).toContain("image");
    expect(types).toContain("embed");
    expect(types).toContain("table");
  });
});

describe("Svelte adapter — LATEX_COMMANDS", () => {
  it("has at least 30 commands", () => {
    expect(LATEX_COMMANDS.length).toBeGreaterThanOrEqual(30);
  });

  it("includes common LaTeX commands", () => {
    const cmds = LATEX_COMMANDS.map(c => c.cmd);
    expect(cmds).toContain("\\alpha");
    expect(cmds).toContain("\\frac{}{}");
    expect(cmds).toContain("\\int");
  });
});

describe("Svelte adapter — renderImagePreview", () => {
  it("returns placeholder for empty source", () => {
    const html = renderImagePreview("", {});
    expect(html).toContain("sci-nb-image-empty");
  });

  it("renders image with src", () => {
    const html = renderImagePreview("https://example.com/img.png", { alt: "Test", caption: "Cap" });
    expect(html).toContain("https://example.com/img.png");
    expect(html).toContain("Test");
    expect(html).toContain("Cap");
  });

  it("respects alignment and width", () => {
    const html = renderImagePreview("https://example.com/img.png", { align: "left", width: "50%" });
    expect(html).toContain("text-align:left");
    expect(html).toContain("max-width:50%");
  });
});

describe("Svelte adapter — renderEmbedPreview", () => {
  it("returns placeholder for empty URL", () => {
    const html = renderEmbedPreview("", {});
    expect(html).toContain("sci-nb-embed-empty");
  });

  it("renders iframe with URL", () => {
    const html = renderEmbedPreview("https://youtube.com/embed/x", { title: "Vid" });
    expect(html).toContain("iframe");
    expect(html).toContain("https://youtube.com/embed/x");
    expect(html).toContain("Vid");
  });
});

describe("Svelte adapter — renderTablePreview", () => {
  it("renders a markdown table", () => {
    const source = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    const html = renderTablePreview(source);
    expect(html).toContain("<table");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("handles empty source", () => {
    const html = renderTablePreview("");
    expect(html).toContain("<table");
  });
});

describe("Svelte adapter — renderCellOutput", () => {
  it("renders stream output", () => {
    const html = renderCellOutput({ outputType: "stream", name: "stdout", text: "hello" } as any);
    expect(html).toContain("hello");
    expect(html).toContain("sci-nb-output-stream");
  });

  it("renders error output", () => {
    const html = renderCellOutput({ outputType: "error", name: "TypeError", message: "bad", traceback: ["line1"] } as any);
    expect(html).toContain("TypeError");
    expect(html).toContain("bad");
    expect(html).toContain("line1");
  });

  it("renders display output with text/plain", () => {
    const html = renderCellOutput({ outputType: "display", data: { "text/plain": "plain text" } } as any);
    expect(html).toContain("plain text");
  });

  it("renders display output with image/png", () => {
    const html = renderCellOutput({ outputType: "display", data: { "image/png": "base64data" } } as any);
    expect(html).toContain("data:image/png;base64,base64data");
  });
});

describe("Svelte adapter — renderCellOutputs", () => {
  it("returns empty string for no outputs", () => {
    expect(renderCellOutputs([])).toBe("");
  });

  it("wraps multiple outputs", () => {
    const html = renderCellOutputs([
      { outputType: "stream", name: "stdout", text: "a" } as any,
      { outputType: "stream", name: "stderr", text: "b" } as any,
    ]);
    expect(html).toContain("sci-nb-cell-outputs");
    expect(html).toContain("a");
    expect(html).toContain("b");
  });
});

describe("Svelte adapter — buildTOCItems", () => {
  it("extracts headings from markdown cells", () => {
    const engine = createNotebook({
      notebook: {
        id: "test",
        title: "Test",
        cells: [
          { id: "c1", type: "markdown", source: "# Title\n## Subtitle", metadata: {} },
          { id: "c2", type: "code", source: "# not a heading", metadata: {} },
          { id: "c3", type: "markdown", source: "### Deep heading", metadata: {} },
        ],
      },
    });
    const items = buildTOCItems(engine);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ cellId: "c1", level: 1, text: "Title" });
    expect(items[1]).toEqual({ cellId: "c1", level: 2, text: "Subtitle" });
    expect(items[2]).toEqual({ cellId: "c3", level: 3, text: "Deep heading" });
  });

  it("returns empty array for no headings", () => {
    const engine = createNotebook({
      notebook: {
        id: "test",
        title: "Test",
        cells: [{ id: "c1", type: "code", source: "print('hi')", metadata: {} }],
      },
    });
    const items = buildTOCItems(engine);
    expect(items).toHaveLength(0);
  });
});
