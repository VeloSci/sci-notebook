/**
 * Presentation Mode for sci-notebook
 *
 * Turns a notebook into a slideshow where each cell (or group of cells)
 * becomes a slide. Supports navigation, fullscreen, and slide transitions.
 */

import type { Notebook, Cell } from "./types";
import type { EditorEngine } from "./editor-engine";

export interface SlideConfig {
  /** How to split cells into slides: 'cell' = one cell per slide, 'heading' = split on h1/h2 */
  splitMode?: "cell" | "heading" | "manual";
  /** For manual mode: cell IDs that start a new slide */
  slideBreaks?: string[];
  /** Transition type */
  transition?: "none" | "fade" | "slide-left" | "slide-right";
  /** Transition duration in ms (default: 300) */
  transitionDuration?: number;
  /** Auto-advance interval in ms (0 = disabled) */
  autoAdvanceMs?: number;
  /** Show slide numbers */
  showSlideNumbers?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Theme override for presentation */
  theme?: string;
}

export interface Slide {
  index: number;
  cells: Cell[];
  title?: string;
}

export type PresentationEvent =
  | { type: "slide:changed"; slide: number; total: number }
  | { type: "presentation:started" }
  | { type: "presentation:ended" }
  | { type: "presentation:fullscreen"; active: boolean };

export type PresentationEventHandler = (event: PresentationEvent) => void;

/**
 * Presentation engine — manages slideshow state and navigation.
 */
export class PresentationEngine {
  private notebook: Readonly<Notebook>;
  private config: Required<SlideConfig>;
  private slides: Slide[] = [];
  private currentSlide = 0;
  private active = false;
  private autoAdvanceTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<PresentationEventHandler> = new Set();
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(notebook: Readonly<Notebook>, config: SlideConfig = {}) {
    this.notebook = notebook;
    this.config = {
      splitMode: config.splitMode ?? "heading",
      slideBreaks: config.slideBreaks ?? [],
      transition: config.transition ?? "fade",
      transitionDuration: config.transitionDuration ?? 300,
      autoAdvanceMs: config.autoAdvanceMs ?? 0,
      showSlideNumbers: config.showSlideNumbers ?? true,
      showProgress: config.showProgress ?? true,
      theme: config.theme ?? "",
    };
    this.buildSlides();
  }

  /**
   * Build slides from the notebook cells.
   */
  private buildSlides(): void {
    const cells = this.notebook.cells;
    this.slides = [];

    if (cells.length === 0) return;

    switch (this.config.splitMode) {
      case "cell":
        this.slides = cells.map((cell, i) => ({
          index: i,
          cells: [cell],
          title: this.extractTitle(cell),
        }));
        break;

      case "heading":
        this.splitByHeading(cells);
        break;

      case "manual":
        this.splitByManualBreaks(cells);
        break;
    }
  }

  private splitByHeading(cells: Cell[]): void {
    let current: Cell[] = [];
    let title: string | undefined;

    for (const cell of cells) {
      const headingMatch = cell.source.match(/^#{1,2}\s+(.+)/m);

      if (headingMatch && current.length > 0) {
        this.slides.push({
          index: this.slides.length,
          cells: [...current],
          title,
        });
        current = [cell];
        title = headingMatch[1].trim();
      } else {
        if (headingMatch && !title) {
          title = headingMatch[1].trim();
        }
        current.push(cell);
      }
    }

    if (current.length > 0) {
      this.slides.push({
        index: this.slides.length,
        cells: current,
        title,
      });
    }
  }

  private splitByManualBreaks(cells: Cell[]): void {
    const breakSet = new Set(this.config.slideBreaks);
    let current: Cell[] = [];

    for (const cell of cells) {
      if (breakSet.has(cell.id) && current.length > 0) {
        this.slides.push({
          index: this.slides.length,
          cells: [...current],
          title: this.extractTitle(current[0]),
        });
        current = [cell];
      } else {
        current.push(cell);
      }
    }

    if (current.length > 0) {
      this.slides.push({
        index: this.slides.length,
        cells: current,
        title: this.extractTitle(current[0]),
      });
    }
  }

  private extractTitle(cell: Cell): string | undefined {
    const match = cell.source.match(/^#{1,3}\s+(.+)/m);
    return match ? match[1].trim() : undefined;
  }

  // --- Public API ---

  getSlides(): ReadonlyArray<Slide> {
    return this.slides;
  }

  getSlideCount(): number {
    return this.slides.length;
  }

  getCurrentSlideIndex(): number {
    return this.currentSlide;
  }

  getCurrentSlide(): Slide | null {
    return this.slides[this.currentSlide] ?? null;
  }

  isActive(): boolean {
    return this.active;
  }

  /**
   * Start the presentation.
   */
  start(fromSlide: number = 0): void {
    this.active = true;
    this.currentSlide = Math.max(0, Math.min(fromSlide, this.slides.length - 1));
    this.emit({ type: "presentation:started" });
    this.emit({ type: "slide:changed", slide: this.currentSlide, total: this.slides.length });

    if (this.config.autoAdvanceMs > 0) {
      this.startAutoAdvance();
    }

    this.bindKeyboard();
  }

  /**
   * End the presentation.
   */
  end(): void {
    this.active = false;
    this.stopAutoAdvance();
    this.unbindKeyboard();
    this.emit({ type: "presentation:ended" });
  }

  /**
   * Go to next slide.
   */
  next(): boolean {
    if (this.currentSlide >= this.slides.length - 1) return false;
    this.currentSlide++;
    this.emit({ type: "slide:changed", slide: this.currentSlide, total: this.slides.length });
    return true;
  }

  /**
   * Go to previous slide.
   */
  prev(): boolean {
    if (this.currentSlide <= 0) return false;
    this.currentSlide--;
    this.emit({ type: "slide:changed", slide: this.currentSlide, total: this.slides.length });
    return true;
  }

  /**
   * Go to a specific slide.
   */
  goTo(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.slides.length - 1));
    if (clamped === this.currentSlide) return;
    this.currentSlide = clamped;
    this.emit({ type: "slide:changed", slide: this.currentSlide, total: this.slides.length });
  }

  /**
   * Go to first slide.
   */
  first(): void {
    this.goTo(0);
  }

  /**
   * Go to last slide.
   */
  last(): void {
    this.goTo(this.slides.length - 1);
  }

  /**
   * Toggle fullscreen mode.
   */
  async toggleFullscreen(element?: HTMLElement): Promise<void> {
    if (typeof document === "undefined") return;

    const el = element || document.documentElement;

    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      this.emit({ type: "presentation:fullscreen", active: true });
    } else {
      await document.exitFullscreen?.();
      this.emit({ type: "presentation:fullscreen", active: false });
    }
  }

  getConfig(): Readonly<Required<SlideConfig>> {
    return this.config;
  }

  /**
   * Update the notebook and rebuild slides.
   */
  updateNotebook(notebook: Readonly<Notebook>): void {
    this.notebook = notebook;
    this.buildSlides();
    if (this.currentSlide >= this.slides.length) {
      this.currentSlide = Math.max(0, this.slides.length - 1);
    }
  }

  /**
   * Subscribe to presentation events.
   */
  on(handler: PresentationEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  /**
   * Clean up.
   */
  destroy(): void {
    this.end();
    this.listeners.clear();
  }

  // --- Private ---

  private emit(event: PresentationEvent): void {
    for (const handler of this.listeners) {
      try {
        handler(event);
      } catch (e) {
        console.error("Presentation event handler error:", e);
      }
    }
  }

  private startAutoAdvance(): void {
    this.stopAutoAdvance();
    this.autoAdvanceTimer = setInterval(() => {
      if (!this.next()) {
        this.stopAutoAdvance();
      }
    }, this.config.autoAdvanceMs);
  }

  private stopAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearInterval(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  private bindKeyboard(): void {
    if (typeof document === "undefined") return;

    this.keyHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
        case "PageDown":
          e.preventDefault();
          this.next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          this.prev();
          break;
        case "Home":
          e.preventDefault();
          this.first();
          break;
        case "End":
          e.preventDefault();
          this.last();
          break;
        case "Escape":
          e.preventDefault();
          this.end();
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener("keydown", this.keyHandler);
  }

  private unbindKeyboard(): void {
    if (this.keyHandler && typeof document !== "undefined") {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }
}

/**
 * Generate CSS for presentation mode.
 */
export function getPresentationCSS(config: SlideConfig = {}): string {
  const transition = config.transition ?? "fade";
  const duration = config.transitionDuration ?? 300;

  return `
.sci-nb-presentation {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #0a0a1a;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sci-nb-slide {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 48px 80px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

.sci-nb-slide-content {
  width: 100%;
  font-size: 1.4em;
  line-height: 1.8;
}

.sci-nb-slide-content h1 { font-size: 2.4em; margin-bottom: 0.5em; }
.sci-nb-slide-content h2 { font-size: 1.8em; margin-bottom: 0.4em; }
.sci-nb-slide-content h3 { font-size: 1.4em; margin-bottom: 0.3em; }
.sci-nb-slide-content pre { font-size: 0.75em; border-radius: 8px; padding: 16px; background: #1a1a2e; }
.sci-nb-slide-content img { max-width: 80%; max-height: 60vh; border-radius: 8px; }
.sci-nb-slide-content table { font-size: 0.85em; }

.sci-nb-presentation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
}

.sci-nb-presentation-controls button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e0e0e0;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}

.sci-nb-presentation-controls button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.sci-nb-presentation-controls button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sci-nb-slide-number {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.sci-nb-progress-bar {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
}

.sci-nb-progress-bar-fill {
  height: 100%;
  background: #4a9eff;
  transition: width ${duration}ms ease;
}

${transition === "fade" ? `
.sci-nb-slide-enter { opacity: 0; }
.sci-nb-slide-active { opacity: 1; transition: opacity ${duration}ms ease; }
.sci-nb-slide-exit { opacity: 0; transition: opacity ${duration}ms ease; }
` : ""}

${transition === "slide-left" ? `
.sci-nb-slide-enter { transform: translateX(100%); }
.sci-nb-slide-active { transform: translateX(0); transition: transform ${duration}ms ease; }
.sci-nb-slide-exit { transform: translateX(-100%); transition: transform ${duration}ms ease; }
` : ""}

${transition === "slide-right" ? `
.sci-nb-slide-enter { transform: translateX(-100%); }
.sci-nb-slide-active { transform: translateX(0); transition: transform ${duration}ms ease; }
.sci-nb-slide-exit { transform: translateX(100%); transition: transform ${duration}ms ease; }
` : ""}
`;
}
