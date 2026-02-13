# Full Example — All Cell Types

This example shows how to create a notebook with all 8 built-in cell types, light/dark theme, and JSON export/import.

## Setup

```bash
pnpm add @velo-sci/notebook-core @velo-sci/notebook-react @velo-sci/notebook-renderer

# Optional: LaTeX rendering with KaTeX
pnpm add katex
```

## Full Code

```tsx
import React, { useState, useRef } from "react";
import { SciNotebook } from "@velo-sci/notebook-react";
import { EditorEngine, Notebook } from "@velo-sci/notebook-core";
import "@velo-sci/notebook-core/styles/index.css";

// Optional: KaTeX for formula rendering
import katex from "katex";
import "katex/dist/katex.min.css";
(globalThis as any).katex = katex;

const SAMPLE_NOTEBOOK: Notebook = {
  id: "demo_nb_1",
  title: "Sci-Notebook Demo",
  cells: [
    // ── Markdown ──
    {
      id: "c1",
      type: "markdown",
      source: "# Welcome to Sci-Notebook\n\n**Click** any cell to edit it.",
      metadata: {},
    },
    // ── Code ──
    {
      id: "c2",
      type: "code",
      source: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\nconsole.log(fibonacci(10)); // 55',
      metadata: { language: "javascript" },
    },
    // ── LaTeX ──
    {
      id: "c3",
      type: "latex",
      source: "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
      metadata: {},
    },
    // ── Image ──
    {
      id: "c4",
      type: "image",
      source: "https://upload.wikimedia.org/wikipedia/commons/4/41/Rising_circular.gif",
      metadata: {
        alt: "Euler's formula",
        caption: "Graphical representation of Euler's formula",
        width: "50%",
        align: "center",
      },
    },
    // ── Embed ──
    {
      id: "c5",
      type: "embed",
      source: "https://www.youtube.com/embed/aircAruvnKk",
      metadata: {
        title: "3Blue1Brown - Neural Networks",
        height: "400px",
        sandbox: "allow-scripts allow-same-origin allow-popups allow-presentation",
      },
    },
    // ── Raw ──
    {
      id: "c6",
      type: "raw",
      source: "Raw text — displayed as-is, without formatting.",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook" },
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const engineRef = useRef<EditorEngine | null>(null);

  return (
    <div data-app-theme={theme}>
      <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <SciNotebook
        notebook={SAMPLE_NOTEBOOK}
        theme={theme}
        onChange={(nb) => console.log("Updated:", nb)}
        engineRef={engineRef}
      />
    </div>
  );
}
```

## Available Interactions

| Action | How |
|--------|-----|
| **Edit cell** | Click on the cell |
| **PDF export** | ✅ NEW |
| **Presentation mode** | ✅ NEW |
| **Exit edit mode** | `Escape` |
| **Next cell** | `Shift+Enter` |
| **Bold / Italic** | `Ctrl+B` / `Ctrl+I` |
| **Indent** | `Tab` / `Shift+Tab` |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Shift+Z` |
| **Insert cell** | Hover between cells → click `+` |
| **PDF** | Print-to-PDF via browser (or headless browser) |

All export buttons are in the header toolbar.
| **Floating toolbar** | Select text in a Markdown cell |

## Cell Types

### Markdown
Full CommonMark rendering via markdown-it. Floating toolbar for Bold, Italic, Strikethrough, Code, Headings, Links, Lists.

### Code
Code blocks with language metadata. Rendered with `<pre><code>` and Shiki syntax highlighting (30+ languages).

### LaTeX
**Visual formula editor** with 9 categories of clickable blocks:
- Structures, Integrals, Summations, Matrices, Greek letters, Operators, Arrows, Functions, Delimiters
- Dual mode: Visual preview (KaTeX) + raw LaTeX mode

### Image
- Drag & drop local files
- URL for remote images
- Alt text, caption, width (25%–100%), alignment

### Embed
- Presets: YouTube, CodePen, Observable, Desmos, GeoGebra
- Custom URL with sandboxed iframe
- Configurable height and sandbox level

### Raw
Unprocessed text, useful for raw data or logs.

## Running the Example

```bash
# From the monorepo root
pnpm --filter @velo-sci/notebook-example dev

# Opens http://localhost:5174
```
