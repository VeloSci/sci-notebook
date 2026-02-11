# Interactive Playground

Try sci-notebook directly in your browser. The example includes all 8 cell types, light/dark theme, presentation mode, version history, and JSON export/import.

## Running the Playground

```bash
# From the monorepo root
pnpm install
pnpm -r build
pnpm --filter @velo-sci/notebook-example dev
```

Open **http://localhost:5174** in your browser.

---

## What You Can Do

### Editing
- **Click** any cell to edit it
- **Escape** to exit edit mode
- **Shift+Enter** to move to the next cell

### Markdown
- Write Markdown with full formatting (headings, bold, italic, tables, lists, links)
- **Select text** to see the floating toolbar with formatting options
- Shortcuts: `Ctrl+B` (bold), `Ctrl+I` (italic), `Tab` (indent)

### LaTeX Formulas
- Click a LaTeX cell to open the **visual formula editor**
- Use the **block palette** to insert fractions, integrals, matrices, Greek letters, etc.
- Toggle between **Preview mode** (visual) and **LaTeX mode** (raw)
- The formula renders in real time with KaTeX

### Images
- **Drag & drop** an image file onto the cell
- Or enter a remote image **URL**
- Configure: alt text, caption, width, alignment

### Embeds
- Choose a **preset** (YouTube, CodePen, Desmos, GeoGebra, Observable)
- Or enter any **URL** for an iframe
- Configure: title, height, sandbox level

### Cell Management
- **Hover between cells** → `+` button to insert a new cell
- **Side buttons**: move up/down, duplicate, delete
- **Toolbar**: undo/redo, add cell, toggle mode (edit all / view all)

### Presentation Mode
- Click **▶ Present** to start a slideshow
- Navigate with arrow keys, Space, PageUp/Down
- Press **Escape** to exit presentation

### Version History
- Click **Save Version** to create a snapshot
- Click **History** to browse saved versions with diff summaries

### Themes and Export
- **Toggle light/dark** in the header
- **Export**: JSON, HTML, Markdown, IPYNB, PDF
- **Import JSON**: load a notebook from JSON

---

## Technical Stack

The playground uses the exact same code you would use in production:

| Layer | Package | Role |
|-------|---------|------|
| **Engine** | `@velo-sci/notebook-core` | State, undo/redo, events, keybindings, presentation, mobile |
| **Rendering** | `@velo-sci/notebook-renderer` | Markdown → AST → HTML, LRU cache, Shiki highlighting |
| **UI** | `@velo-sci/notebook-react` | SciNotebook, Cell, MathEditor, ImageCell, EmbedCell |
| **LaTeX** | `katex` | Real-time formula rendering |
| **Build** | `vite` | Dev server with HMR |

---

## Demo Content

The example notebook includes 16 cells:

1. **Markdown** — Welcome with formatting
2. **Markdown** — Features overview table
3. **Code** — Fibonacci function in JavaScript
4. **Table** — Keyboard shortcuts reference
5. **LaTeX** — Gaussian integral (∫₀^∞ e^{-x²} dx)
6. **Markdown** — Visual formula editor description
7. **Mermaid** — Architecture diagram
8. **Image** — Euler's formula (Wikipedia)
9. **Embed** — 3Blue1Brown video (YouTube)
10. **Markdown** — Template engine documentation
11. **Markdown** — Presentation mode features
12. **Markdown** — Version history & diffing
13. **Markdown** — Export options
14. **Markdown** — Framework adapters table
15. **Raw** — Unformatted text
16. **Markdown** — Cell types summary table
