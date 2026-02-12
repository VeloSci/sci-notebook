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

describe("Vanilla adapter — exports", () => {
  it("exports all expected items", async () => {
    const mod = await import("./index");
    const expectedExports = [
      "SciNotebookVanilla", "DOMCellRenderer", "DragDropManager", "KeyboardHandler",
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

describe("Vanilla adapter — MATH_CATEGORIES", () => {
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

  it("category names match React adapter", () => {
    const names = MATH_CATEGORIES.map(c => c.name);
    expect(names).toEqual([
      "Structures", "Integrals", "Summations", "Matrices",
      "Greek", "Operators", "Arrows", "Functions", "Delimiters",
    ]);
  });
});

describe("Vanilla adapter — DEFAULT_COMMANDS", () => {
  it("has at least 8 commands", () => {
    expect(DEFAULT_COMMANDS.length).toBeGreaterThanOrEqual(8);
  });

  it("includes all expected cell types", () => {
    const types = DEFAULT_COMMANDS.map(c => c.type);
    expect(types).toContain("markdown");
    expect(types).toContain("code");
    expect(types).toContain("latex");
    expect(types).toContain("image");
    expect(types).toContain("embed");
    expect(types).toContain("table");
    expect(types).toContain("mermaid");
    expect(types).toContain("raw");
  });
});

describe("Vanilla adapter — LATEX_COMMANDS", () => {
  it("has at least 30 commands", () => {
    expect(LATEX_COMMANDS.length).toBeGreaterThanOrEqual(30);
  });

  it("includes common LaTeX commands", () => {
    const cmds = LATEX_COMMANDS.map(c => c.cmd);
    expect(cmds).toContain("\\alpha");
    expect(cmds).toContain("\\frac{}{}");
    expect(cmds).toContain("\\int");
    expect(cmds).toContain("\\sin");
  });

  it("each command has cmd, desc, category", () => {
    for (const cmd of LATEX_COMMANDS) {
      expect(cmd.cmd).toBeTruthy();
      expect(cmd.desc).toBeTruthy();
      expect(cmd.category).toBeTruthy();
    }
  });
});

describe("Vanilla adapter — renderImagePreview", () => {
  it("returns placeholder for empty source", () => {
    const html = renderImagePreview("", {});
    expect(html).toContain("sci-nb-image-empty");
    expect(html).toContain("Click to add image");
  });

  it("renders image with src and metadata", () => {
    const html = renderImagePreview("https://example.com/img.png", {
      alt: "Alt text", caption: "My caption", width: "75%", align: "right",
    });
    expect(html).toContain("https://example.com/img.png");
    expect(html).toContain("Alt text");
    expect(html).toContain("My caption");
    expect(html).toContain("max-width:75%");
    expect(html).toContain("text-align:right");
  });

  it("escapes HTML in alt and caption", () => {
    const html = renderImagePreview("https://example.com/img.png", {
      alt: '<script>alert("xss")</script>',
      caption: "a & b < c",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;");
  });
});

describe("Vanilla adapter — renderEmbedPreview", () => {
  it("returns placeholder for empty URL", () => {
    const html = renderEmbedPreview("", {});
    expect(html).toContain("sci-nb-embed-empty");
  });

  it("renders iframe with URL and settings", () => {
    const html = renderEmbedPreview("https://youtube.com/embed/x", {
      title: "Video", height: "500px", sandbox: "allow-scripts",
    });
    expect(html).toContain("iframe");
    expect(html).toContain("https://youtube.com/embed/x");
    expect(html).toContain("Video");
    expect(html).toContain("height:500px");
    expect(html).toContain('sandbox="allow-scripts"');
  });
});

describe("Vanilla adapter — renderTablePreview", () => {
  it("renders a markdown table", () => {
    const source = "| Name | Value |\n| --- | --- |\n| x | 1 |\n| y | 2 |";
    const html = renderTablePreview(source);
    expect(html).toContain("<table");
    expect(html).toContain("<th>Name</th>");
    expect(html).toContain("<th>Value</th>");
    expect(html).toContain("<td>x</td>");
    expect(html).toContain("<td>2</td>");
  });

  it("handles empty source with defaults", () => {
    const html = renderTablePreview("");
    expect(html).toContain("<table");
    expect(html).toContain("Col 1");
  });
});

describe("Vanilla adapter — renderCellOutput", () => {
  it("renders stream output", () => {
    const html = renderCellOutput({ outputType: "stream", name: "stdout", text: "hello world" } as any);
    expect(html).toContain("hello world");
    expect(html).toContain("sci-nb-output-stream--stdout");
  });

  it("renders error output with traceback", () => {
    const html = renderCellOutput({
      outputType: "error", name: "ValueError", message: "bad value",
      traceback: ["  File test.py", "    raise ValueError"],
    } as any);
    expect(html).toContain("ValueError");
    expect(html).toContain("bad value");
    expect(html).toContain("File test.py");
    expect(html).toContain("sci-nb-output-error");
  });

  it("renders display output with text/html", () => {
    const html = renderCellOutput({ outputType: "display", data: { "text/html": "<b>bold</b>" } } as any);
    expect(html).toContain("<b>bold</b>");
    expect(html).toContain("sci-nb-output-html");
  });

  it("renders display output with image/png", () => {
    const html = renderCellOutput({ outputType: "display", data: { "image/png": "abc123" } } as any);
    expect(html).toContain("data:image/png;base64,abc123");
  });

  it("renders display output with application/json", () => {
    const html = renderCellOutput({ outputType: "display", data: { "application/json": '{"a":1}' } } as any);
    expect(html).toContain('"a": 1');
    expect(html).toContain("sci-nb-output-json");
  });

  it("renders display output with text/plain fallback", () => {
    const html = renderCellOutput({ outputType: "display", data: { "text/plain": "plain" } } as any);
    expect(html).toContain("plain");
    expect(html).toContain("sci-nb-output-text");
  });
});

describe("Vanilla adapter — renderCellOutputs", () => {
  it("returns empty string for no outputs", () => {
    expect(renderCellOutputs([])).toBe("");
  });

  it("wraps multiple outputs in container", () => {
    const html = renderCellOutputs([
      { outputType: "stream", name: "stdout", text: "line1" } as any,
      { outputType: "stream", name: "stderr", text: "err" } as any,
    ]);
    expect(html).toContain("sci-nb-cell-outputs");
    expect(html).toContain("line1");
    expect(html).toContain("err");
  });
});

describe("Vanilla adapter — buildTOCItems", () => {
  it("extracts headings from markdown cells", () => {
    const engine = createNotebook({
      notebook: {
        id: "test", title: "Test",
        cells: [
          { id: "c1", type: "markdown", source: "# Title\n## Section", metadata: {} },
          { id: "c2", type: "code", source: "# comment", metadata: {} },
          { id: "c3", type: "markdown", source: "### Subsection", metadata: {} },
        ],
      },
    });
    const items = buildTOCItems(engine);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ cellId: "c1", level: 1, text: "Title" });
    expect(items[1]).toEqual({ cellId: "c1", level: 2, text: "Section" });
    expect(items[2]).toEqual({ cellId: "c3", level: 3, text: "Subsection" });
  });

  it("returns empty array for no headings", () => {
    const engine = createNotebook({
      notebook: {
        id: "test", title: "Test",
        cells: [{ id: "c1", type: "code", source: "x = 1", metadata: {} }],
      },
    });
    expect(buildTOCItems(engine)).toHaveLength(0);
  });

  it("strips markdown formatting from heading text", () => {
    const engine = createNotebook({
      notebook: {
        id: "test", title: "Test",
        cells: [
          { id: "c1", type: "markdown", source: "# **Bold** and *italic*", metadata: {} },
        ],
      },
    });
    const items = buildTOCItems(engine);
    expect(items[0].text).toBe("Bold and italic");
  });
});
