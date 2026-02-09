import { describe, it, expect } from "vitest";
import { generateCellId, generateNotebookId, validateNotebook } from "../src/utils";

describe("Utils", () => {
  describe("ID Generation", () => {
    it("should generate valid cell IDs", () => {
      const id = generateCellId();
      expect(id).toMatch(/^cell_[a-zA-Z0-9_-]{12}$/);
    });

    it("should generate valid notebook IDs", () => {
      const id = generateNotebookId();
      expect(id).toMatch(/^nb_[a-zA-Z0-9_-]{12}$/);
    });

    it("should generate unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCellId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("Validation", () => {
    it("should validate a correct notebook", () => {
      const notebook = {
        id: "nb_123",
        title: "Test",
        cells: [
          { id: "cell_1", type: "markdown", source: "hello", metadata: {} }
        ],
        version: 1
      };
      const result = validateNotebook(notebook);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail if required fields are missing", () => {
      const notebook = { title: "Test" };
      const result = validateNotebook(notebook);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === "id")).toBe(true);
    });

    it("should fail if duplicate cell IDs exist", () => {
      const notebook = {
        id: "nb_123",
        title: "Test",
        cells: [
          { id: "c1", type: "markdown", source: "", metadata: {} },
          { id: "c1", type: "code", source: "", metadata: {} }
        ],
        version: 1
      };
      const result = validateNotebook(notebook);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes("Duplicate cell ID"))).toBe(true);
    });
  });
});
