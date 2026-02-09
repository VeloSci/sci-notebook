import { describe, it, expect } from "vitest";
import { VersionHistory } from "./version-history";
import type { Notebook } from "./types";

function makeNotebook(cellCount = 2): Notebook {
  return {
    id: "nb1",
    title: "Test",
    cells: Array.from({ length: cellCount }, (_, i) => ({
      id: `c${i}`,
      type: "markdown" as const,
      source: `Cell ${i}`,
      metadata: {},
    })),
    metadata: {},
    version: 1,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  };
}

describe("VersionHistory", () => {
  it("saves and retrieves entries", () => {
    const vh = new VersionHistory();
    const nb = makeNotebook();
    const entry = vh.save(nb, "Initial");
    expect(vh.count).toBe(1);
    expect(entry.description).toBe("Initial");
    expect(entry.cellCount).toBe(2);
    expect(vh.getEntries()).toHaveLength(1);
  });

  it("restores a notebook from a version", () => {
    const vh = new VersionHistory();
    const nb = makeNotebook(3);
    const entry = vh.save(nb, "v1");
    const restored = vh.restore(entry.id);
    expect(restored).not.toBeNull();
    expect(restored!.cells).toHaveLength(3);
  });

  it("returns null for unknown version", () => {
    const vh = new VersionHistory();
    expect(vh.restore("nonexistent")).toBeNull();
  });

  it("respects maxEntries", () => {
    const vh = new VersionHistory({ maxEntries: 3 });
    for (let i = 0; i < 5; i++) {
      vh.save(makeNotebook(), `v${i}`);
    }
    expect(vh.count).toBe(3);
    // Oldest entries should be trimmed
    expect(vh.getEntries()[0].description).toBe("v2");
  });

  it("diffs two versions", () => {
    const vh = new VersionHistory();
    const nb1 = makeNotebook(3);
    const e1 = vh.save(nb1, "v1");

    const nb2 = { ...nb1, cells: [nb1.cells[0], { ...nb1.cells[1], source: "Modified" }, { id: "c_new", type: "code" as const, source: "new", metadata: {} }] };
    const e2 = vh.save(nb2, "v2");

    const diff = vh.diff(e1.id, e2.id);
    expect(diff).not.toBeNull();
    expect(diff!.modified).toContain("c1"); // source changed
    expect(diff!.added).toContain("c_new");
    expect(diff!.removed).toContain("c2"); // was in v1 but not v2
    expect(diff!.unchanged).toContain("c0");
  });

  it("getLatest returns the most recent entry", () => {
    const vh = new VersionHistory();
    vh.save(makeNotebook(), "first");
    vh.save(makeNotebook(), "second");
    expect(vh.getLatest()!.description).toBe("second");
  });

  it("clear removes all entries", () => {
    const vh = new VersionHistory();
    vh.save(makeNotebook(), "v1");
    vh.save(makeNotebook(), "v2");
    vh.clear();
    expect(vh.count).toBe(0);
    expect(vh.getLatest()).toBeNull();
  });
});
