import { describe, it, expect, vi } from "vitest";
import { EditorEngine } from "../src/editor-engine";
import { Notebook, SciNotebookPlugin } from "../src/types";

describe("EditorEngine", () => {
  const createEmptyNotebook = (): Notebook => ({
    id: "nb_1",
    title: "Untitled",
    cells: [],
    metadata: {},
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // --- Basic CRUD ---

  it("should insert cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0, "markdown", "# Hello");

    expect(engine.getNotebook().cells).toHaveLength(1);
    expect(engine.getNotebook().cells[0]).toBe(cell);
    expect(cell.source).toBe("# Hello");
  });

  it("should delete cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0);
    engine.deleteCell(cell.id);
    expect(engine.getNotebook().cells).toHaveLength(0);
  });

  it("should update cell source", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0);
    engine.updateCellSource(cell.id, "new content");
    expect(engine.getCell(cell.id)?.source).toBe("new content");
  });

  it("should handle undo/redo for insertions", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    engine.insertCell(0);
    expect(engine.getNotebook().cells).toHaveLength(1);
    expect(engine.canUndo()).toBe(true);

    engine.undo();
    expect(engine.getNotebook().cells).toHaveLength(0);
    expect(engine.canRedo()).toBe(true);

    engine.redo();
    expect(engine.getNotebook().cells).toHaveLength(1);
  });

  it("should change cell mode", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0);

    engine.setEditMode(cell.id);
    expect(engine.getCell(cell.id)?.editing).toBe(true);
    expect(engine.getMode(cell.id)).toBe("edit");

    engine.setViewMode(cell.id);
    expect(engine.getCell(cell.id)?.editing).toBe(false);
    expect(engine.getMode(cell.id)).toBe("view");
  });

  it("should focus cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0);
    const handler = vi.fn();
    engine.on("cell:focused", handler);

    engine.focusCell(cell.id);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ cellId: cell.id })
    }));
    expect(engine.getFocusedCellId()).toBe(cell.id);
  });

  // --- insertCellBefore / insertCellAfter ---

  it("should insert cell before a reference cell", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "first");
    const c0 = engine.insertCellBefore(c1.id, "markdown", "before");

    expect(engine.getCells()[0].id).toBe(c0.id);
    expect(engine.getCells()[1].id).toBe(c1.id);
  });

  it("should insert cell after a reference cell", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "first");
    const c2 = engine.insertCellAfter(c1.id, "markdown", "after");

    expect(engine.getCells()[0].id).toBe(c1.id);
    expect(engine.getCells()[1].id).toBe(c2.id);
  });

  // --- moveCell ---

  it("should move a cell to a new position", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "A");
    const c2 = engine.insertCell(1, "markdown", "B");
    const c3 = engine.insertCell(2, "markdown", "C");

    engine.moveCell(c3.id, 0);

    expect(engine.getCells().map(c => c.source)).toEqual(["C", "A", "B"]);
  });

  it("should undo moveCell", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "A");
    const c2 = engine.insertCell(1, "markdown", "B");

    engine.moveCell(c2.id, 0);
    expect(engine.getCells()[0].source).toBe("B");

    engine.undo();
    expect(engine.getCells()[0].source).toBe("A");
  });

  // --- duplicateCell ---

  it("should duplicate a cell", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "original");
    const dup = engine.duplicateCell(c1.id);

    expect(dup).not.toBeNull();
    expect(engine.getCells()).toHaveLength(2);
    expect(dup!.source).toBe("original");
    expect(dup!.id).not.toBe(c1.id);
  });

  // --- updateCellMetadata ---

  it("should update cell metadata", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0, "code", "x = 1");

    engine.updateCellMetadata(cell.id, { language: "python" });

    expect(engine.getCell(cell.id)?.metadata.language).toBe("python");
  });

  it("should undo metadata update", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0, "code", "");
    engine.updateCellMetadata(cell.id, { language: "python" });
    expect(engine.getCell(cell.id)?.metadata.language).toBe("python");

    engine.undo();
    expect(engine.getCell(cell.id)?.metadata.language).toBeUndefined();
  });

  // --- setCellType ---

  it("should change cell type", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0, "markdown", "# Title");

    engine.setCellType(cell.id, "code");
    expect(engine.getCell(cell.id)?.type).toBe("code");

    engine.undo();
    expect(engine.getCell(cell.id)?.type).toBe("markdown");
  });

  // --- toggleMode / setAll ---

  it("should toggle cell mode", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0);

    engine.toggleMode(cell.id);
    expect(engine.getCell(cell.id)?.editing).toBe(true);

    engine.toggleMode(cell.id);
    expect(engine.getCell(cell.id)?.editing).toBe(false);
  });

  it("should set all cells to edit mode", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    engine.insertCell(0, "markdown", "A");
    engine.insertCell(1, "markdown", "B");

    engine.setAllEditMode();
    expect(engine.getCells().every(c => c.editing)).toBe(true);

    engine.setAllViewMode();
    expect(engine.getCells().every(c => !c.editing)).toBe(true);
  });

  // --- Selection ---

  it("should select multiple cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0);
    const c2 = engine.insertCell(1);

    engine.selectCells([c1.id, c2.id]);
    expect(engine.getSelectedCellIds()).toEqual([c1.id, c2.id]);

    engine.clearSelection();
    expect(engine.getSelectedCellIds()).toEqual([]);
    expect(engine.getFocusedCellId()).toBeNull();
  });

  // --- Split / Merge ---

  it("should split a cell at cursor offset", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const cell = engine.insertCell(0, "markdown", "HelloWorld");

    const result = engine.splitCell(cell.id, 5);

    expect(result).not.toBeNull();
    expect(engine.getCells()).toHaveLength(2);
    expect(engine.getCells()[0].source).toBe("Hello");
    expect(engine.getCells()[1].source).toBe("World");
  });

  it("should merge cell up", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    engine.insertCell(0, "markdown", "Hello");
    const c2 = engine.insertCell(1, "markdown", "World");

    const merged = engine.mergeCellUp(c2.id);

    expect(engine.getCells()).toHaveLength(1);
    expect(merged?.source).toBe("HelloWorld");
  });

  it("should merge cell down", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "Hello");
    engine.insertCell(1, "markdown", "World");

    const merged = engine.mergeCellDown(c1.id);

    expect(engine.getCells()).toHaveLength(1);
    expect(merged?.source).toBe("HelloWorld");
  });

  // --- Clipboard ---

  it("should copy and paste cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "copied");

    engine.copyCells([c1.id]);
    const pasted = engine.pasteCells(c1.id);

    expect(pasted).toHaveLength(1);
    expect(pasted[0].source).toBe("copied");
    expect(pasted[0].id).not.toBe(c1.id);
    expect(engine.getCells()).toHaveLength(2);
  });

  it("should cut and paste cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "cut me");

    engine.cutCells([c1.id]);
    expect(engine.getCells()).toHaveLength(0);

    const pasted = engine.pasteCells();
    expect(pasted).toHaveLength(1);
    expect(pasted[0].source).toBe("cut me");
  });

  // --- deleteCells ---

  it("should delete multiple cells", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(0, "markdown", "A");
    const c2 = engine.insertCell(1, "markdown", "B");
    engine.insertCell(2, "markdown", "C");

    engine.deleteCells([c1.id, c2.id]);
    expect(engine.getCells()).toHaveLength(1);
    expect(engine.getCells()[0].source).toBe("C");
  });

  // --- Notebook mutations ---

  it("should update notebook title", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    engine.updateTitle("New Title");
    expect(engine.getNotebook().title).toBe("New Title");
  });

  it("should update notebook metadata", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    engine.updateMetadata({ author: "Test", tags: ["science"] });
    expect(engine.getNotebook().metadata.author).toBe("Test");
    expect(engine.getNotebook().metadata.tags).toEqual(["science"]);
  });

  // --- Plugin System ---

  it("should register and list plugins", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const plugin: SciNotebookPlugin = {
      id: "test-plugin",
      name: "Test Plugin",
      version: "1.0.0",
      setup: vi.fn(),
    };

    engine.registerPlugin(plugin);

    expect(engine.listPlugins()).toEqual([{ id: "test-plugin", name: "Test Plugin", version: "1.0.0" }]);
    expect(plugin.setup).toHaveBeenCalled();
    expect(engine.getPlugin("test-plugin")).toBe(plugin);
  });

  it("should unregister plugins and call teardown", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const plugin: SciNotebookPlugin = {
      id: "test-plugin",
      name: "Test",
      version: "1.0.0",
      teardown: vi.fn(),
    };

    engine.registerPlugin(plugin);
    engine.unregisterPlugin("test-plugin");

    expect(plugin.teardown).toHaveBeenCalled();
    expect(engine.listPlugins()).toEqual([]);
  });

  it("should throw on duplicate plugin registration", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const plugin: SciNotebookPlugin = { id: "dup", name: "Dup", version: "1.0.0" };

    engine.registerPlugin(plugin);
    expect(() => engine.registerPlugin(plugin)).toThrow('Plugin "dup" is already registered');
  });

  it("should register plugins via config", () => {
    const setup = vi.fn();
    const engine = new EditorEngine(createEmptyNotebook(), {
      plugins: [{ id: "cfg-plugin", name: "Cfg", version: "1.0.0", setup }],
    });

    expect(engine.listPlugins()).toHaveLength(1);
    expect(setup).toHaveBeenCalled();
  });

  // --- Destroy ---

  it("should destroy cleanly", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const teardown = vi.fn();
    engine.registerPlugin({ id: "p1", name: "P1", version: "1.0.0", teardown });

    engine.destroy();

    expect(teardown).toHaveBeenCalled();
    expect(engine.listPlugins()).toEqual([]);
    expect(engine.canUndo()).toBe(false);
  });

  // --- Default cell type from config ---

  it("should use defaultCellType from config", () => {
    const engine = new EditorEngine(createEmptyNotebook(), { defaultCellType: "code" });
    const cell = engine.insertCell(0);
    expect(cell.type).toBe("code");
  });

  // --- Index clamping ---

  it("should clamp insert index to valid range", () => {
    const engine = new EditorEngine(createEmptyNotebook());
    const c1 = engine.insertCell(999, "markdown", "end");
    expect(engine.getCells()).toHaveLength(1);

    const c2 = engine.insertCell(-5, "markdown", "start");
    expect(engine.getCells()[0].source).toBe("start");
  });
});
