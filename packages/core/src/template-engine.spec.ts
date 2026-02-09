import { describe, it, expect } from "vitest";
import { TemplateEngine } from "./template-engine";
import type { Notebook, Cell } from "./types";

function makeCell(source: string, type = "markdown"): Cell {
  return { id: "c1", type, source, metadata: {} };
}

function makeNotebook(cells: Cell[]): Notebook {
  return {
    id: "nb1",
    title: "Test {{title}}",
    cells,
    metadata: {},
    version: 1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
}

describe("TemplateEngine", () => {
  describe("inline flags", () => {
    it("replaces simple {{key}}", async () => {
      const engine = new TemplateEngine({ data: { name: "Juan" } });
      const cell = makeCell("Hola {{name}}!");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("Hola Juan!");
    });

    it("replaces dot-notation {{obj.prop}}", async () => {
      const engine = new TemplateEngine({ data: { user: { name: "Ana", age: 30 } } });
      const cell = makeCell("{{user.name}} tiene {{user.age}} años");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("Ana tiene 30 años");
    });

    it("removes unresolved flags by default", async () => {
      const engine = new TemplateEngine({ data: {} });
      const cell = makeCell("Hola {{missing}}!");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("Hola !");
    });

    it("preserves unresolved flags when configured", async () => {
      const engine = new TemplateEngine({ data: {}, preserveUnresolved: true });
      const cell = makeCell("Hola {{missing}}!");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("Hola {{missing}}!");
    });
  });

  describe("filters", () => {
    it("applies uppercase filter", async () => {
      const engine = new TemplateEngine({ data: { name: "juan" } });
      const cell = makeCell("{{name | uppercase}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("JUAN");
    });

    it("applies currency filter", async () => {
      const engine = new TemplateEngine({ data: { price: 42.5 } });
      const cell = makeCell("Total: {{price | currency}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("Total: $42.50");
    });

    it("applies percent filter", async () => {
      const engine = new TemplateEngine({ data: { rate: 0.856 } });
      const cell = makeCell("{{rate | percent}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("85.6%");
    });
  });

  describe("#table directive", () => {
    it("generates markdown table from array of objects", async () => {
      const engine = new TemplateEngine({
        data: {
          users: [
            { name: "Ana", role: "Admin" },
            { name: "Bob", role: "User" },
          ],
        },
      });
      const cell = makeCell("{{#table users}}");
      const result = await engine.processCell(cell);
      expect(result.source).toContain("| name | role |");
      expect(result.source).toContain("| Ana | Admin |");
      expect(result.source).toContain("| Bob | User |");
    });

    it("generates table with specific columns", async () => {
      const engine = new TemplateEngine({
        data: {
          items: [
            { id: 1, name: "A", price: 10, hidden: "x" },
            { id: 2, name: "B", price: 20, hidden: "y" },
          ],
        },
      });
      const cell = makeCell("{{#table items name,price}}");
      const result = await engine.processCell(cell);
      expect(result.source).toContain("| name | price |");
      expect(result.source).not.toContain("hidden");
    });
  });

  describe("#each directive", () => {
    it("loops over array of primitives", async () => {
      const engine = new TemplateEngine({ data: { items: ["a", "b", "c"] } });
      const cell = makeCell("{{#each items}}- {{.}}\n{{/each}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("- a\n- b\n- c\n");
    });

    it("loops over array of objects", async () => {
      const engine = new TemplateEngine({
        data: { users: [{ name: "Ana" }, { name: "Bob" }] },
      });
      const cell = makeCell("{{#each users}}* {{.name}}\n{{/each}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("* Ana\n* Bob\n");
    });

    it("provides @index", async () => {
      const engine = new TemplateEngine({ data: { items: ["x", "y"] } });
      const cell = makeCell("{{#each items}}{{@index}}: {{.}}\n{{/each}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("0: x\n1: y\n");
    });
  });

  describe("#if directive", () => {
    it("shows content when truthy", async () => {
      const engine = new TemplateEngine({ data: { show: true } });
      const cell = makeCell("{{#if show}}visible{{/if}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("visible");
    });

    it("hides content when falsy", async () => {
      const engine = new TemplateEngine({ data: { show: false } });
      const cell = makeCell("{{#if show}}visible{{/if}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("");
    });

    it("handles else branch", async () => {
      const engine = new TemplateEngine({ data: { premium: false } });
      const cell = makeCell("{{#if premium}}PRO{{else}}FREE{{/if}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("FREE");
    });

    it("treats empty array as falsy", async () => {
      const engine = new TemplateEngine({ data: { items: [] } });
      const cell = makeCell("{{#if items}}has items{{else}}empty{{/if}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("empty");
    });
  });

  describe("#date directive", () => {
    it("inserts formatted date", async () => {
      const engine = new TemplateEngine({});
      const cell = makeCell("{{#date YYYY-MM-DD}}");
      const result = await engine.processCell(cell);
      expect(result.source).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("resolvers", () => {
    it("calls async resolver when key not in data", async () => {
      const engine = new TemplateEngine({
        data: {},
        resolvers: [
          async (key) => {
            if (key === "db.user") return "FromDB";
            return undefined;
          },
        ],
      });
      const cell = makeCell("User: {{db.user}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("User: FromDB");
    });

    it("prefers static data over resolver", async () => {
      const engine = new TemplateEngine({
        data: { name: "Static" },
        resolvers: [async (key) => (key === "name" ? "Resolved" : undefined)],
      });
      const cell = makeCell("{{name}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("Static");
    });
  });

  describe("processNotebook", () => {
    it("processes all cells and title", async () => {
      const engine = new TemplateEngine({ data: { title: "Mi Reporte", name: "Juan" } });
      const nb = makeNotebook([
        makeCell("Hola {{name}}"),
        makeCell("Titulo: {{title}}"),
      ]);
      const result = await engine.processNotebook(nb);
      expect(result.notebook.title).toBe("Test Mi Reporte");
      expect(result.notebook.cells[0].source).toBe("Hola Juan");
      expect(result.notebook.cells[1].source).toBe("Titulo: Mi Reporte");
      expect(result.resolvedFlags).toContain("name");
      expect(result.resolvedFlags).toContain("title");
    });

    it("tracks unresolved flags", async () => {
      const engine = new TemplateEngine({ data: {} });
      const nb = makeNotebook([makeCell("{{missing}}")]);
      const result = await engine.processNotebook(nb);
      expect(result.unresolvedFlags).toContain("missing");
    });
  });

  describe("setData / replaceData", () => {
    it("merges data with setData", async () => {
      const engine = new TemplateEngine({ data: { a: 1 } });
      engine.setData({ b: 2 });
      const cell = makeCell("{{a}} {{b}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe("1 2");
    });

    it("replaces data with replaceData", async () => {
      const engine = new TemplateEngine({ data: { a: 1 } });
      engine.replaceData({ b: 2 });
      const cell = makeCell("{{a}} {{b}}");
      const result = await engine.processCell(cell);
      expect(result.source).toBe(" 2");
    });
  });
});
