import { describe, it, expect, vi, beforeEach } from "vitest";
import { PresentationEngine, getPresentationCSS } from "./presentation";
import type { Notebook } from "./types";

const SAMPLE_NOTEBOOK: Notebook = {
  id: "test_nb",
  title: "Test Notebook",
  cells: [
    { id: "c1", type: "markdown", source: "# Introduction\n\nWelcome to the notebook.", metadata: {} },
    { id: "c2", type: "markdown", source: "## Methods\n\nWe used the following approach.", metadata: {} },
    { id: "c3", type: "code", source: "const x = 42;", metadata: { language: "javascript" } },
    { id: "c4", type: "markdown", source: "## Results\n\nThe results are shown below.", metadata: {} },
    { id: "c5", type: "latex", source: "$$E = mc^2$$", metadata: {} },
    { id: "c6", type: "markdown", source: "# Conclusion\n\nIn summary...", metadata: {} },
  ],
  metadata: {},
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("PresentationEngine", () => {
  let engine: PresentationEngine;

  beforeEach(() => {
    engine = new PresentationEngine(SAMPLE_NOTEBOOK);
  });

  it("should build slides from headings", () => {
    const slides = engine.getSlides();
    expect(slides.length).toBeGreaterThan(0);
    expect(slides.length).toBeLessThanOrEqual(SAMPLE_NOTEBOOK.cells.length);
  });

  it("should split by cell mode", () => {
    const cellEngine = new PresentationEngine(SAMPLE_NOTEBOOK, { splitMode: "cell" });
    expect(cellEngine.getSlideCount()).toBe(SAMPLE_NOTEBOOK.cells.length);
  });

  it("should split by heading mode", () => {
    const slides = engine.getSlides();
    // Should have 3 groups: "Introduction" (c1), "Methods" (c2,c3), "Results" (c4,c5), "Conclusion" (c6)
    expect(slides.length).toBeGreaterThanOrEqual(3);
  });

  it("should split by manual breaks", () => {
    const manualEngine = new PresentationEngine(SAMPLE_NOTEBOOK, {
      splitMode: "manual",
      slideBreaks: ["c3", "c5"],
    });
    expect(manualEngine.getSlideCount()).toBe(3);
  });

  it("should navigate forward and backward", () => {
    engine.start(0);
    expect(engine.getCurrentSlideIndex()).toBe(0);

    engine.next();
    expect(engine.getCurrentSlideIndex()).toBe(1);

    engine.prev();
    expect(engine.getCurrentSlideIndex()).toBe(0);

    // Can't go before first
    expect(engine.prev()).toBe(false);
    expect(engine.getCurrentSlideIndex()).toBe(0);

    engine.end();
  });

  it("should go to specific slide", () => {
    engine.start();
    engine.goTo(2);
    expect(engine.getCurrentSlideIndex()).toBe(2);

    // Clamp to valid range
    engine.goTo(999);
    expect(engine.getCurrentSlideIndex()).toBe(engine.getSlideCount() - 1);

    engine.goTo(-5);
    expect(engine.getCurrentSlideIndex()).toBe(0);

    engine.end();
  });

  it("should go to first and last", () => {
    engine.start(1);
    engine.last();
    expect(engine.getCurrentSlideIndex()).toBe(engine.getSlideCount() - 1);

    engine.first();
    expect(engine.getCurrentSlideIndex()).toBe(0);

    engine.end();
  });

  it("should track active state", () => {
    expect(engine.isActive()).toBe(false);
    engine.start();
    expect(engine.isActive()).toBe(true);
    engine.end();
    expect(engine.isActive()).toBe(false);
  });

  it("should emit events", () => {
    const events: any[] = [];
    engine.on((e) => events.push(e));

    engine.start();
    engine.next();
    engine.end();

    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0].type).toBe("presentation:started");
    expect(events.some(e => e.type === "slide:changed")).toBe(true);
    expect(events[events.length - 1].type).toBe("presentation:ended");
  });

  it("should get current slide data", () => {
    engine.start();
    const slide = engine.getCurrentSlide();
    expect(slide).not.toBeNull();
    expect(slide!.cells.length).toBeGreaterThan(0);
    expect(slide!.index).toBe(0);
    engine.end();
  });

  it("should update notebook and rebuild slides", () => {
    const oldCount = engine.getSlideCount();
    const newNb = {
      ...SAMPLE_NOTEBOOK,
      cells: SAMPLE_NOTEBOOK.cells.slice(0, 2),
    };
    engine.updateNotebook(newNb);
    expect(engine.getSlideCount()).toBeLessThanOrEqual(oldCount);
  });

  it("should handle empty notebook", () => {
    const emptyEngine = new PresentationEngine({
      ...SAMPLE_NOTEBOOK,
      cells: [],
    });
    expect(emptyEngine.getSlideCount()).toBe(0);
    expect(emptyEngine.getCurrentSlide()).toBeNull();
  });

  it("should clean up on destroy", () => {
    engine.start();
    engine.destroy();
    expect(engine.isActive()).toBe(false);
  });
});

describe("getPresentationCSS", () => {
  it("should return CSS string", () => {
    const css = getPresentationCSS();
    expect(css).toContain(".sci-nb-presentation");
    expect(css).toContain(".sci-nb-slide");
  });

  it("should include transition styles", () => {
    const fadeCss = getPresentationCSS({ transition: "fade" });
    expect(fadeCss).toContain("opacity");

    const slideCss = getPresentationCSS({ transition: "slide-left" });
    expect(slideCss).toContain("translateX");
  });
});
