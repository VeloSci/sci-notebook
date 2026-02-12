# Development Roadmap

## Current Status

The project has completed all 7 phases. See the [Competitive Study](./COMPETITIVE_STUDY.md) for market context.

**Summary of implemented features:**
- ✅ 10 packages working (core, renderer, react, vanilla, vue, svelte, plugin-latex, plugin-export, example)
- ✅ 129 tests passing
- ✅ 8 cell types (markdown, code, latex, image, embed, raw, table, mermaid)
- ✅ Visual formula editor (MathEditor) with 100+ blocks
- ✅ Modern UX (click-to-edit, floating toolbar, insert handles, slash commands, drag & drop)
- ✅ Light/dark themes
- ✅ TemplateEngine with {{flags}}, async resolvers, filters
- ✅ ExportEngine (HTML, Markdown, .ipynb, JSON)
- ✅ CodeExecutor (JS sandbox + custom language executors)
- ✅ Shiki syntax highlighting (30+ languages)
- ✅ Mermaid diagrams
- ✅ Interactive table editor
- ✅ TOC sidebar, Find & Replace, LaTeX autocomplete
- ✅ VirtualRenderer for large notebooks
- ✅ Version history with diff (git-like line-level diffing)
- ✅ Image resize handles, paste from clipboard
- ✅ ARIA accessibility
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Full example app with 16 demo cells
- ✅ Framework adapters: React 18+, Vue 3+, Svelte 5+, Vanilla JS
- ✅ PDF/DOCX export plugin
- ✅ Presentation mode (slideshow with 3 split modes, navigation, fullscreen)
- ✅ Mobile support (touch adapter with swipe, long press, responsive CSS)

---

## Phase 1: Foundation ✅ COMPLETE

- [x] Monorepo setup (pnpm workspaces, tsconfig, tsup, vitest)
- [x] `@velo-sci/notebook-core` package
- [x] `Notebook`, `Cell`, `CellOutput` TypeScript types
- [x] `generateCellId()`, `generateNotebookId()` utilities
- [x] `validateNotebook()` function
- [x] `EventBus` class (typed pub-sub, on/off/once/emit)
- [x] `HistoryManager` class (undo/redo, command pattern)
- [x] `EditorEngine` class:
  - Cell CRUD (insert, delete, move, duplicate)
  - `updateCellSource`, `updateCellMetadata`
  - Dual-mode toggle (per-cell and global)
  - Selection model (focus, multi-select)
  - Split / merge cells
  - Clipboard (copy/cut/paste cells)
- [x] `KeybindingManager` with 21 default keybindings
- [x] `loadNotebook()` with migration and validation
- [x] 46 unit tests passing

---

## Phase 2: Rendering Pipeline ✅ COMPLETE

- [x] `@velo-sci/notebook-renderer` package
- [x] `MarkdownParser` interface + markdown-it implementation
- [x] `RenderPipeline` class:
  - Preprocessor chain (priority-sorted)
  - AST transformer chain
  - Renderer chain (cell type → HTML)
  - Postprocessor chain
- [x] `LRUCache` for render results (content-addressed, FNV-1a hash)
- [x] Fallback renderers: markdown, code, raw, latex, unknown
- [x] `remove(id)`, `renderAll()`, `invalidateCache()`
- [x] 14 unit tests passing

---

## Phase 3: Framework Adapters ✅ COMPLETE (4 adapters)

- [x] `@velo-sci/notebook-react` package:
  - `<SciNotebook>` component (toolbar, cells, empty state, plugins, onChange, readOnly, showToolbar, engineRef)
  - `<Cell>` component with dispatch to specialized editors
  - `<FloatingToolbar>` — contextual toolbar on text selection
  - `<InsertHandle>` — `+` button between cells with type menu
  - `useSciNotebook()`, `useNotebook()`, `useCell()`, `useFocusedCell()`, `useNotebookEvent()` hooks
  - `engineRef` for imperative access
- [x] CSS stylesheet (~1200 lines) with light/dark themes via CSS custom properties
- [x] Keyboard navigation (Shift+Enter, Escape, Ctrl+B/I, Tab/Shift+Tab)
- [x] `packages/example/` — full example app with Vite
- [x] 6 component tests passing
- [x] `@velo-sci/notebook-vanilla` — Vanilla JS adapter:
  - `SciNotebookVanilla` class (target, notebook, theme, onChange, readOnly)
  - `DOMCellRenderer` — pipeline-based DOM rendering
  - `DragDropManager` — drag-and-drop reordering
  - `KeyboardHandler` — keyboard navigation
  - TOC sidebar, toolbar, insert handles
- [x] `@velo-sci/notebook-vue` — Vue 3+ adapter:
  - `<SciNotebook>` component (render functions, no SFC)
  - `<NotebookCell>`, `<InsertHandle>` components
  - `useNotebookEngine()`, `useNotebook()`, `useCell()`, `useFocusedCell()` composables
  - `provideNotebookEngine()` / `NotebookEngineKey` injection
- [x] `@velo-sci/notebook-svelte` — Svelte 5+ adapter:
  - `SciNotebookSvelte` class (imperative mounting)
  - `createNotebookStore()` — Svelte-compatible stores ($store syntax)
  - `NotebookStore` with reactive notebook, cells, focusedCellId
- [x] Accessibility: ARIA labels, roles, aria-selected, tabIndex on cells

---

## Phase 4: Core Plugins ✅ COMPLETE

### Completed:
- [x] `@velo-sci/notebook-plugin-latex`:
  - Inline `$...$` and display `$$...$$` rendering via KaTeX
  - `latex` cell type
  - Preprocessor + AST transformer
- [x] **MathEditor** — Visual formula editor (built-in in react):
  - 9 categories, 100+ pre-built blocks
  - Dual mode: Preview (KaTeX) + LaTeX raw
  - Smart insertion at cursor position
- [x] **ImageCell** — Image cell (built-in in react):
  - Drag & drop upload (data URL)
  - Remote URL
  - Alt text, caption, width, alignment
  - `renderImagePreview()` for view mode
- [x] **EmbedCell** — Embedded content (built-in in react):
  - Presets: YouTube, CodePen, Observable, Desmos, GeoGebra
  - URL + sandboxed iframe
  - `renderEmbedPreview()` for view mode
- [x] `@velo-sci/notebook-plugin-ai`:
  - `InlineCompletionManager` (debounce, cancel, accept, ghost text)
  - `assembleContext()` for completion context
  - `createOpenAIProvider()` with SSE streaming
  - Lifecycle management

### Completed (v0.2):
- [x] **Mermaid diagrams** — renderMermaidFallback() in pipeline, globalThis.mermaid pattern, CSS
- [x] **TableCell** — Interactive table editor with add/remove row/col, renderTablePreview()
- [x] **Shiki syntax highlighting** — shiki-highlighter.ts with lazy init, 30+ languages, dual theme, postprocessor
- [x] **Paste image from clipboard** — Ctrl+V in ImageCell
- [x] **Image resize handles** — ImageResize component with drag SE corner
- [x] **SlashCommand** — '/' opens filterable menu of 8 cell types
- [x] **Drag & drop reorder** — Draggable cells with top/bottom indicator
- [x] **TOCSidebar** — Table of contents from h1/h2/h3 headings
- [x] **FindReplace** — Ctrl+F, case sensitive, replace current/all
- [x] **LatexAutocomplete** — 120+ commands in 8 categories
- [x] **CellOutputDisplay** — Render stream/display/error outputs
- [x] **TemplateEngine** — {{flags}}, async resolvers, #table, #each, #if, #date, 13 filters
- [x] **ExportEngine** — HTML, Markdown, .ipynb, JSON + downloadExport()
- [x] **CodeExecutor** — JS sandbox, console capture, async, timeout, custom executors
- [x] **VersionHistory** — save/restore/diff, auto-save, configurable max entries

### Completed (v0.2.1):
- [x] **LaTeX custom macros** — plugin-latex reads cell.metadata.latexMacros + global macros option
- [x] **Lazy KaTeX loading** — lazy-katex.ts with ensureKaTeX(), isKaTeXAvailable(), createLazyKaTeXPostprocessor()

---

---

---

## Phase 6: Polish & Ecosystem ✅ COMPLETE

- [x] **VirtualRenderer** — Scroll virtualization for 50+ cell notebooks, overscan, height measurement
- [x] `scrollToCell()` — Implemented in TOCSidebar and FindReplace (scrollIntoView smooth)
- [x] **TOCSidebar** — Built-in in react (no separate plugin needed)
- [x] **FindReplace** — Built-in in react with Ctrl+F, replace, case sensitive
- [x] **CI/CD pipeline** — GitHub Actions: test Node 18/20/22, auto-publish npm
- [x] **npm publishing workflow** — In CI/CD pipeline
- [x] **CHANGELOG.md** — Documented v0.1.0 and v0.2.0
- [x] **TypeDoc API docs** — typedoc.json config, docs:api script, typedoc-plugin-markdown
- [x] **Performance benchmarks** — benchmark.ts with 16 benchmarks, formatBenchmarks(), test

---

## Identified Gaps (from Competitive Study)

### High Priority — v0.2 ✅ COMPLETE

| Gap | Description | Status |
|-----|-------------|--------|
| **Slash commands** | `/` opens cell insertion menu | ✅ SlashCommand.tsx |
| **Drag & drop reorder** | Drag cells to reorder | ✅ Cell.tsx drag handlers |
| **Syntax highlighting** | Shiki for code cells | ✅ shiki-highlighter.ts |
| **Mermaid diagrams** | Diagram plugin | ✅ renderMermaidFallback() |

### High Priority — v0.3 ✅ COMPLETE

| Gap | Description | Status |
|-----|-------------|--------|
| **Code execution** | JS sandbox + custom executors | ✅ CodeExecutor |
| **Export** | Standalone HTML, Markdown, .ipynb | ✅ ExportEngine |
| **Table editor** | Interactive table editor | ✅ TableCell.tsx |
| **TOC sidebar** | Table of contents | ✅ TOCSidebar.tsx |

### Medium Priority — v0.4 ✅ COMPLETE

| Gap | Description | Status |
|-----|-------------|--------|
| **Find & replace** | Global search across cells | ✅ FindReplace.tsx |
| **Cell outputs** | Execution result display | ✅ CellOutputDisplay.tsx |
| **LaTeX autocomplete** | LaTeX command autocomplete | ✅ LatexAutocomplete.tsx |
| **Version history** | Notebook JSON diffing | ✅ VersionHistory |

### Low Priority — v1.0 ✅ COMPLETE (partial)

| Gap | Description | Status |
|-----|-------------|--------|
| **RT Collaboration** | CRDT via Yjs | 🔜 Out of scope v1.0 |
| **Presentation mode** | Cell-by-cell slideshow | ✅ PresentationEngine |
| **Comments** | Cell annotations | 🔜 Out of scope v1.0 |
| **Citations** | BibTeX management | 🔜 Out of scope v1.0 |

---

## Dependency Graph

```
Phase 1 (Foundation) ✅
  │
  ▼
Phase 2 (Rendering) ✅
  │
  ├──────────────────────┐
  ▼                      ▼
Phase 3 (Adapters) ✅   Phase 4 (Plugins) ✅
  │                      │
  └──────────┬───────────┘
             ▼
       Phase 5 (AI) ✅
             │
             ▼
       Phase 6 (Polish) ✅
```

---

## Phase 7: Post-v1 Features ✅ COMPLETE

- [x] **PDF/DOCX export** — `@velo-sci/notebook-plugin-export`:
  - `exportToPDF()` — browser print-to-PDF with page size, orientation, margins, headers/footers
  - `generatePrintHTML()` — HTML optimized for headless browsers (Puppeteer/Playwright)
  - `exportToDOCX()` — Office Open XML with headings, code, bold/italic, blockquotes, lists
  - `downloadDOCX()` — direct download
  - `createExportPlugin()` — plugin that listens to `export:pdf` / `export:docx` events
- [x] **Presentation mode** — `PresentationEngine` in core:
  - 3 split modes: `cell` (1 cell = 1 slide), `heading` (split on h1/h2), `manual` (breakpoints)
  - Navigation: next/prev/goTo/first/last
  - Keyboard: Arrow keys, Space, PageUp/Down, Home/End, Escape, F (fullscreen)
  - Transitions: none, fade, slide-left, slide-right (configurable duration)
  - Auto-advance with configurable interval
  - Fullscreen API integration
  - `getPresentationCSS()` — complete CSS for presentation mode
  - 15 tests passing
- [x] **Mobile support** — `MobileAdapter` in core:
  - Touch events: tap (focus), double-tap (edit), long press (context menu)
  - Swipe gestures: left/right with visual feedback and haptic
  - Responsive CSS: 3 breakpoints (small <640px, medium <1024px, large)
  - Safe area insets for notched devices
  - Touch-friendly hit targets (min 44px)
  - `MobileAdapter.isTouchDevice()`, `getViewportSize()` static helpers
- [x] **Version history enhancements** — git-like diffing:
  - `detailedDiff()` — per-cell diffs with line-level changes
  - `computeLineDiff()` — LCS-based line diff algorithm
  - `diffSummary()` — human-readable change summary
  - `CellDiff` type with status, lineDiff, oldSource, newSource
  - `LineDiffEntry` type: add/remove/context with lineNumber

---

## Quality Gates

- **Tests**: 129 tests passing across 12 test files.
- **Types**: Strict TypeScript. Minimal use of `any`.
- **Packages**: 10 packages (core, renderer, react, vanilla, vue, svelte, plugin-latex, plugin-export, example).
- **Bundle**: Core ~45KB, React ~80KB, Renderer ~10KB, Vanilla ~15KB, Vue ~12KB, Svelte ~10KB.
- **Docs**: API reference, guides, competitive study, working examples, CHANGELOG.
- **CI/CD**: GitHub Actions with test matrix Node 18/20/22, auto-publish npm.

---

## Post-v1 Vision

Architecturally supported but out of scope for v1:

- **Real-time collaboration** (CRDT via Yjs)
- **Code execution** (Pyodide, QuickJS)
- **Comments & annotations** (inline comments on cells)
- **Citations** (BibTeX management)
- **S3/GCS backend** for cloud sync
- **WebSocket backend** for real-time sync
- **Offline PWA** with service worker

---

## Ecosystem Packages

| Package | Framework | Status |
|---------|-----------|--------|
| `@velo-sci/notebook-core` | — | ✅ Primary |
| `@velo-sci/notebook-renderer` | — | ✅ Primary |
| `@velo-sci/notebook-react` | React 18+ | ✅ Primary |
| `@velo-sci/notebook-vue` | Vue 3+ | ✅ Implemented |
| `@velo-sci/notebook-svelte` | Svelte 5+ | ✅ Implemented |
| `@velo-sci/notebook-vanilla` | Vanilla JS | ✅ Primary |
| `@velo-sci/notebook-plugin-latex` | — | ✅ Plugin |
| `@velo-sci/notebook-plugin-export` | — | ✅ Plugin |
