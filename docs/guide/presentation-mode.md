<script setup>
import { presentationModeNotebook } from '../.vitepress/theme/notebooks/presentation-mode'
</script>

# Presentation Mode

<InteractiveDoc :notebook="presentationModeNotebook" title="Presentation Mode — Interactive Notebook" />

Turn any notebook into a slideshow with the `PresentationEngine`.

---

## Quick Start

```typescript
import { PresentationEngine, getPresentationCSS } from "@velo-sci/notebook-core";

const engine = new PresentationEngine(notebook, {
  splitMode: "heading",
  transition: "fade",
  transitionDuration: 300,
});

// Inject CSS
const style = document.createElement("style");
style.textContent = getPresentationCSS({ transition: "fade" });
document.head.appendChild(style);

// Start presenting
engine.start();

// Navigate
engine.next();
engine.prev();
engine.goTo(3);

// End
engine.end();
engine.destroy();
```

---

## Split Modes

The `PresentationEngine` supports 3 ways to split a notebook into slides:

| Mode | Description |
|------|-------------|
| `cell` | One cell per slide. Every cell becomes its own slide. |
| `heading` | Split on `h1` / `h2` headings. Cells between headings are grouped into a single slide. |
| `manual` | Split on cells that have `metadata.slideBreak: true`. |

### Example: Heading Mode

Given a notebook with cells:
1. `# Introduction` (markdown)
2. Some text (markdown)
3. `## Methods` (markdown)
4. Code cell
5. `## Results` (markdown)

This produces 3 slides:
- Slide 1: cells 1–2
- Slide 2: cells 3–4
- Slide 3: cell 5

---

## Navigation

### Programmatic

```typescript
engine.next();           // Next slide
engine.prev();           // Previous slide
engine.goTo(index);      // Go to specific slide (0-indexed)
engine.first();          // Go to first slide
engine.last();           // Go to last slide
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` / `Space` / `PageDown` | Next slide |
| `←` / `PageUp` | Previous slide |
| `Home` | First slide |
| `End` | Last slide |
| `Escape` | End presentation |
| `F` | Toggle fullscreen |

---

## Transitions

| Transition | Description |
|------------|-------------|
| `none` | Instant switch, no animation |
| `fade` | Fade in/out (default) |
| `slide-left` | Slide from right to left |
| `slide-right` | Slide from left to right |

```typescript
const engine = new PresentationEngine(notebook, {
  transition: "fade",
  transitionDuration: 300, // milliseconds
});
```

---

## Auto-Advance

Automatically advance slides at a configurable interval:

```typescript
engine.startAutoAdvance(5000); // Advance every 5 seconds
engine.stopAutoAdvance();
```

---

## Fullscreen

The engine integrates with the browser's Fullscreen API:

```typescript
engine.enterFullscreen();
engine.exitFullscreen();
```

---

## Events

```typescript
engine.on((event) => {
  switch (event.type) {
    case "presentation:started":
      console.log("Started with", event.slideCount, "slides");
      break;
    case "slide:changed":
      console.log("Now on slide", event.slide);
      break;
    case "presentation:ended":
      console.log("Presentation ended");
      break;
  }
});
```

---

## CSS

Use `getPresentationCSS()` to get the complete CSS for presentation mode:

```typescript
import { getPresentationCSS } from "@velo-sci/notebook-core";

const css = getPresentationCSS({
  transition: "fade",
  transitionDuration: 300,
});
```

The CSS includes:
- Full-viewport slide container
- Centered slide content
- Transition animations
- Progress bar
- Navigation controls
- Slide counter

---

## API Reference

### `PresentationEngine`

```typescript
class PresentationEngine {
  constructor(notebook: Notebook, options?: PresentationOptions);

  start(): void;
  end(): void;
  destroy(): void;

  next(): void;
  prev(): void;
  goTo(index: number): void;
  first(): void;
  last(): void;

  getCurrentSlide(): Slide | null;
  getSlideCount(): number;
  getCurrentIndex(): number;

  startAutoAdvance(intervalMs: number): void;
  stopAutoAdvance(): void;

  enterFullscreen(): void;
  exitFullscreen(): void;

  on(handler: (event: PresentationEvent) => void): void;
}
```

### `PresentationOptions`

```typescript
interface PresentationOptions {
  splitMode?: "cell" | "heading" | "manual";
  transition?: "none" | "fade" | "slide-left" | "slide-right";
  transitionDuration?: number;
}
```
