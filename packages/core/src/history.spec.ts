import { describe, it, expect, vi } from "vitest";
import { HistoryManager, Command } from "../src/history";

describe("HistoryManager", () => {
  const createMockCommand = (label: string): Command => ({
    label,
    execute: vi.fn(),
    undo: vi.fn(),
  });

  it("should push and undo commands", () => {
    const history = new HistoryManager();
    const cmd = createMockCommand("test");

    history.push(cmd);
    expect(history.canUndo()).toBe(true);

    const success = history.undo();
    expect(success).toBe(true);
    expect(cmd.undo).toHaveBeenCalled();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("should redo commands", () => {
    const history = new HistoryManager();
    const cmd = createMockCommand("test");

    history.push(cmd);
    history.undo();
    const success = history.redo();

    expect(success).toBe(true);
    expect(cmd.execute).toHaveBeenCalled();
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("should clear redo stack when a new command is pushed", () => {
    const history = new HistoryManager();
    history.push(createMockCommand("1"));
    history.undo();
    expect(history.canRedo()).toBe(true);

    history.push(createMockCommand("2"));
    expect(history.canRedo()).toBe(false);
  });

  it("should respect max depth", () => {
    const history = new HistoryManager(2);
    history.push(createMockCommand("1"));
    history.push(createMockCommand("2"));
    history.push(createMockCommand("3"));

    // "1" should be gone
    history.undo(); // undo "3"
    history.undo(); // undo "2"
    expect(history.canUndo()).toBe(false);
  });
});
