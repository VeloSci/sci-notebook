# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] — 2025-02-09

### Added

#### Core (`@sci-notebook/core`)
- **TemplateEngine** — Programmable templates with `{{flags}}`, dot-notation, block directives (`#table`, `#each`, `#if/#else`, `#date`, `#eval`), 13 filters, async resolvers for server/DB data binding
- **ExportEngine** — Export notebooks to HTML (standalone), Markdown, Jupyter `.ipynb`, JSON; `downloadExport()` browser helper
- **CodeExecutor** — JS sandbox execution with console capture, async support, timeout, custom language executors (e.g., Pyodide for Python)
- **VersionHistory** — Snapshot-based version history with save/restore/diff, auto-save interval, configurable max entries

#### Renderer (`@sci-notebook/renderer`)
- **Shiki syntax highlighting** — Lazy-loaded highlighter with 30+ pre-loaded languages, dual theme (light/dark), language aliases, `createShikiPostprocessor()` for pipeline integration
- **Mermaid diagrams** — `renderMermaidFallback()` using `globalThis.mermaid` pattern (same as KaTeX), fallback to styled code block

#### React (`@sci-notebook/react`)
- **SlashCommand** — `/` in textarea opens filterable menu of 8 cell types with icons, descriptions, keyword search, arrow/enter/escape navigation
- **TableCell** — Interactive table editor with add/remove row/col, Tab navigation, markdown table sync, `renderTablePreview()`
- **TOCSidebar** — Table of contents from h1/h2/h3 headings, sticky nav, scroll-to-cell, active cell highlight
- **FindReplace** — `Ctrl+F` search across all cells, case sensitive toggle, prev/next navigation, replace current/all
- **LatexAutocomplete** — 120+ LaTeX commands in 8 categories, filterable dropdown with keyboard navigation
- **CellOutputDisplay** — Renders stream (stdout/stderr), display (HTML/SVG/image/JSON/text), and error outputs with traceback
- **GhostText** — AI inline completion overlay with Tab to accept, Escape to dismiss
- **ChatSidebar** — Conversational AI interface with message history, onSend/onApply callbacks, streaming support
- **ImageResize** — Drag-to-resize handles (SE corner) for images with percentage-based width output
- **VirtualRenderer** — Scroll virtualization for large notebooks (50+ cells) with IntersectionObserver, overscan, and height measurement

#### Cell.tsx Enhancements
- **Drag & drop reorder** — Cells are draggable with top/bottom drop indicators
- **Cell outputs** — Code execution results displayed below cell content
- **ARIA accessibility** — `role="region"`, `aria-label`, `aria-selected`, `tabIndex` on all cells

#### ImageCell
- **Paste from clipboard** — `Ctrl+V` with image data auto-detected and loaded as data URL

#### SciNotebook.tsx
- **TOC sidebar** toggle from toolbar (`showTOC` prop)
- **Find & Replace** bar via `Ctrl+F` or toolbar button
- **Buscar / TOC** toolbar buttons

#### Infrastructure
- **GitHub Actions CI/CD** — Test on Node 18/20/22, auto-publish to npm on main push
- **CSS** — ~1750 lines with styles for all new components, cell outputs, Shiki, ghost text, image resize, version history, chat sidebar

### Changed
- Example app updated with 12 demo cells (table, mermaid, template docs), export buttons (JSON/HTML/MD/IPYNB), TOC enabled
- Cell type menu now includes `table` and `mermaid` types
- Renderer pipeline handles `mermaid` cell type

### Tests
- **113 tests passing** across 10 test files:
  - 23 template engine tests
  - 7 export engine tests
  - 10 code executor tests
  - 7 version history tests
  - 32 editor engine tests
  - 14 renderer pipeline tests
  - 6 React component tests
  - 4 event bus tests
  - 4 history manager tests
  - 6 utility tests

---

## [0.1.0] — 2025-01-15

### Added
- Initial release with 5 packages: core, renderer, react, plugin-latex, plugin-ai
- 6 cell types: markdown, code, latex, image, embed, raw
- EditorEngine with cell CRUD, history, keybindings, selection, split/merge, clipboard
- RenderPipeline with preprocessors, AST transformers, renderers, postprocessors, LRU cache
- MathEditor visual formula builder (9 categories, 100+ blocks)
- ImageCell with drag & drop, URL, alt/caption/width/align
- EmbedCell with presets (YouTube, CodePen, Observable, Desmos, GeoGebra)
- FloatingToolbar contextual formatting
- InsertHandle between cells
- Light/dark themes
- 66 tests passing
