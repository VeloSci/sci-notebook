import { describe, it, expect } from "vitest";
import {
  MATH_CATEGORIES,
  DEFAULT_COMMANDS,
  LATEX_COMMANDS,
  renderImagePreview,
  renderEmbedPreview,
  renderTablePreview,
} from "./index";

describe("Vue adapter — exports", () => {
  it("exports all expected components", async () => {
    const mod = await import("./index");
    const expectedExports = [
      "SciNotebook", "NotebookCell", "InsertHandle",
      "FloatingToolbar", "MathEditor", "MATH_CATEGORIES",
      "ImageCell", "renderImagePreview",
      "EmbedCell", "renderEmbedPreview",
      "SlashCommand", "DEFAULT_COMMANDS",
      "TableCell", "renderTablePreview",
      "TOCSidebar", "FindReplace",
      "LatexAutocomplete", "LATEX_COMMANDS",
      "CellOutputDisplay", "GhostText",
      "ChatSidebar", "ImageResize",
      "VirtualRenderer", "MermaidPreview", "initMermaid",
      "AIRewrite", "AICellGenerate",
      "useNotebookEngine", "provideNotebookEngine",
      "useNotebook", "useCell", "useFocusedCell",
    ];
    for (const name of expectedExports) {
      expect((mod as any)[name], `Missing export: ${name}`).toBeDefined();
    }
  });
});

describe("Vue adapter — MATH_CATEGORIES", () => {
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

  it("each block has label and latex", () => {
    for (const cat of MATH_CATEGORIES) {
      for (const block of cat.blocks) {
        expect(block.label).toBeTruthy();
        expect(block.latex).toBeTruthy();
      }
    }
  });

  it("contains expected categories", () => {
    const names = MATH_CATEGORIES.map(c => c.name);
    expect(names).toContain("Structures");
    expect(names).toContain("Greek");
    expect(names).toContain("Operators");
    expect(names).toContain("Integrals");
    expect(names).toContain("Functions");
  });
});

describe("Vue adapter — DEFAULT_COMMANDS", () => {
  it("has at least 8 commands", () => {
    expect(DEFAULT_COMMANDS.length).toBeGreaterThanOrEqual(8);
  });

  it("each command has type, label, description, icon, keywords", () => {
    for (const cmd of DEFAULT_COMMANDS) {
      expect(cmd.type).toBeTruthy();
      expect(cmd.label).toBeTruthy();
      expect(cmd.description).toBeTruthy();
      expect(cmd.icon).toBeTruthy();
      expect(Array.isArray(cmd.keywords)).toBe(true);
    }
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

describe("Vue adapter — LATEX_COMMANDS", () => {
  it("has at least 30 commands", () => {
    expect(LATEX_COMMANDS.length).toBeGreaterThanOrEqual(30);
  });

  it("each command has cmd, desc, category", () => {
    for (const cmd of LATEX_COMMANDS) {
      expect(cmd.cmd).toBeTruthy();
      expect(cmd.desc).toBeTruthy();
      expect(cmd.category).toBeTruthy();
    }
  });

  it("includes common LaTeX commands", () => {
    const cmds = LATEX_COMMANDS.map(c => c.cmd);
    expect(cmds).toContain("\\alpha");
    expect(cmds).toContain("\\frac{}{}");
    expect(cmds).toContain("\\int");
    expect(cmds).toContain("\\sin");
  });
});

describe("Vue adapter — renderImagePreview", () => {
  it("returns placeholder for empty source", () => {
    const html = renderImagePreview("", {});
    expect(html).toContain("sci-nb-image-empty");
    expect(html).toContain("Click to add image");
  });

  it("renders image with src", () => {
    const html = renderImagePreview("https://example.com/img.png", { alt: "Test", caption: "A caption" });
    expect(html).toContain("https://example.com/img.png");
    expect(html).toContain("Test");
    expect(html).toContain("A caption");
    expect(html).toContain("sci-nb-image-view");
  });

  it("respects alignment", () => {
    const html = renderImagePreview("https://example.com/img.png", { align: "right" });
    expect(html).toContain("text-align:right");
  });

  it("respects width", () => {
    const html = renderImagePreview("https://example.com/img.png", { width: "50%" });
    expect(html).toContain("max-width:50%");
  });
});

describe("Vue adapter — renderEmbedPreview", () => {
  it("returns placeholder for empty URL", () => {
    const html = renderEmbedPreview("", {});
    expect(html).toContain("sci-nb-embed-empty");
    expect(html).toContain("Click to add embedded content");
  });

  it("renders iframe with URL", () => {
    const html = renderEmbedPreview("https://www.youtube.com/embed/abc", { title: "My Video" });
    expect(html).toContain("https://www.youtube.com/embed/abc");
    expect(html).toContain("My Video");
    expect(html).toContain("iframe");
  });

  it("respects height", () => {
    const html = renderEmbedPreview("https://example.com", { height: "600px" });
    expect(html).toContain("height:600px");
  });

  it("respects sandbox", () => {
    const html = renderEmbedPreview("https://example.com", { sandbox: "allow-scripts" });
    expect(html).toContain('sandbox="allow-scripts"');
  });
});

describe("Vue adapter — renderTablePreview", () => {
  it("renders a markdown table", () => {
    const source = "| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |";
    const html = renderTablePreview(source);
    expect(html).toContain("<table");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<th>B</th>");
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("<td>4</td>");
  });

  it("handles empty/short source gracefully", () => {
    const html = renderTablePreview("");
    expect(html).toContain("<table");
    expect(html).toContain("Col 1");
  });
});
