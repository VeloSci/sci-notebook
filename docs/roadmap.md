# Roadmap de Desarrollo

## Estado Actual

El proyecto ha completado las fases 1–6 casi en su totalidad. Ver el [Estudio Competitivo](./COMPETITIVE_STUDY.md) para contexto de mercado.

**Resumen de lo implementado:**
- ✅ 5 paquetes funcionando (core, renderer, react, plugin-latex, plugin-ai)
- ✅ 113 tests pasando (10 test files)
- ✅ 8 tipos de celda (markdown, code, latex, image, embed, raw, table, mermaid)
- ✅ Editor visual de fórmulas (MathEditor) con 100+ bloques
- ✅ UX moderna (click-to-edit, toolbar flotante, insert handles, slash commands, drag & drop)
- ✅ Temas light/dark
- ✅ TemplateEngine con {{flags}}, resolvers async, filtros
- ✅ ExportEngine (HTML, Markdown, .ipynb, JSON)
- ✅ CodeExecutor (JS sandbox + custom language executors)
- ✅ Shiki syntax highlighting (30+ lenguajes)
- ✅ Mermaid diagrams
- ✅ Table editor interactivo
- ✅ TOC sidebar, Find & Replace, LaTeX autocomplete
- ✅ Cell outputs display, Ghost text AI, Chat sidebar
- ✅ VirtualRenderer para notebooks grandes
- ✅ Version history con diff
- ✅ Image resize handles, paste from clipboard
- ✅ ARIA accessibility
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ App de ejemplo completa con 12 celdas demo

---

## Phase 1: Foundation ✅ COMPLETADA

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

## Phase 2: Rendering Pipeline ✅ COMPLETADA

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

## Phase 3: Framework Adapters ✅ COMPLETADA (React)

- [x] `@velo-sci/notebook-react` package:
  - `<SciNotebook>` component (toolbar, cells, empty state, plugins, onChange, readOnly, showToolbar, engineRef)
  - `<Cell>` component con dispatch a editores especializados
  - `<FloatingToolbar>` — toolbar contextual en selección de texto
  - `<InsertHandle>` — botón `+` entre celdas con menú de tipos
  - `useSciNotebook()`, `useNotebook()`, `useCell()`, `useFocusedCell()`, `useNotebookEvent()` hooks
  - `engineRef` para acceso imperativo
- [x] CSS stylesheet (~1200 líneas) con light/dark themes via CSS custom properties
- [x] Keyboard navigation (Shift+Enter, Escape, Ctrl+B/I, Tab/Shift+Tab)
- [x] `packages/example/` — app de ejemplo completa con Vite
- [x] 6 component tests passing
- [ ] `@velo-sci/notebook-vanilla` — pendiente (fuera de scope v1)
- [x] Accessibility: ARIA labels, roles, aria-selected, tabIndex en celdas

---

## Phase 4: Core Plugins ✅ COMPLETADA

### Completado:
- [x] `@velo-sci/notebook-plugin-latex`:
  - Inline `$...$` y display `$$...$$` rendering via KaTeX
  - `latex` cell type
  - Preprocessor + AST transformer
- [x] **MathEditor** — Editor visual de fórmulas (built-in en react):
  - 9 categorías, 100+ bloques pre-armados
  - Modo dual: Preview (KaTeX) + LaTeX raw
  - Inserción inteligente en posición del cursor
- [x] **ImageCell** — Celda de imagen (built-in en react):
  - Drag & drop upload (data URL)
  - URL remota
  - Alt text, caption, width, alignment
  - `renderImagePreview()` para modo vista
- [x] **EmbedCell** — Contenido embebido (built-in en react):
  - Presets: YouTube, CodePen, Observable, Desmos, GeoGebra
  - URL + iframe sandboxed
  - `renderEmbedPreview()` para modo vista
- [x] `@velo-sci/notebook-plugin-ai`:
  - `InlineCompletionManager` (debounce, cancel, accept, ghost text)
  - `assembleContext()` para contexto de completions
  - `createOpenAIProvider()` con streaming SSE
  - Lifecycle management

### Completado (v0.2):
- [x] **Mermaid diagrams** — renderMermaidFallback() en pipeline, globalThis.mermaid pattern, CSS
- [x] **TableCell** — Editor interactivo de tablas con add/remove row/col, renderTablePreview()
- [x] **Shiki syntax highlighting** — shiki-highlighter.ts con lazy init, 30+ lenguajes, dual theme, postprocessor
- [x] **Paste image from clipboard** — Ctrl+V en ImageCell
- [x] **Image resize handles** — ImageResize component con drag SE corner
- [x] **SlashCommand** — '/' abre menú filtrable de 8 tipos de celda
- [x] **Drag & drop reorder** — Celdas arrastrables con indicador top/bottom
- [x] **TOCSidebar** — Tabla de contenidos desde headings h1/h2/h3
- [x] **FindReplace** — Ctrl+F, case sensitive, replace current/all
- [x] **LatexAutocomplete** — 120+ comandos en 8 categorías
- [x] **CellOutputDisplay** — Render stream/display/error outputs
- [x] **TemplateEngine** — {{flags}}, resolvers async, #table, #each, #if, #date, 13 filtros
- [x] **ExportEngine** — HTML, Markdown, .ipynb, JSON + downloadExport()
- [x] **CodeExecutor** — JS sandbox, console capture, async, timeout, custom executors
- [x] **VersionHistory** — save/restore/diff, auto-save, configurable max entries

### Completado (v0.2.1):
- [x] **LaTeX custom macros** — plugin-latex lee cell.metadata.latexMacros + opción global macros
- [x] **Lazy KaTeX loading** — lazy-katex.ts con ensureKaTeX(), isKaTeXAvailable(), createLazyKaTeXPostprocessor()

---

## Phase 5: AI Integration ✅ COMPLETADA

- [x] `@velo-sci/notebook-plugin-ai` package scaffold
- [x] `AICompletionProvider` interface
- [x] `InlineCompletionManager`
- [x] OpenAI-compatible provider with streaming
- [x] **GhostText** — Ghost text rendering en Cell.tsx (Tab accept, Escape dismiss)
- [x] **ChatSidebar** — Componente de chat conversacional con onSend/onApply
- [x] Keybindings: Tab (accept), Escape (reject) en GhostText
- [x] **AIRewrite** — select → prompt → preview diff (old/new) → accept/reject/retry
- [x] **AICellGenerate** — prompt → generate → preview cells → insert/regenerate/cancel

---

## Phase 6: Polish & Ecosystem ✅ COMPLETADA

- [x] **VirtualRenderer** — Scroll virtualization para notebooks 50+ cells, overscan, height measurement
- [x] `scrollToCell()` — Implementado en TOCSidebar y FindReplace (scrollIntoView smooth)
- [x] **TOCSidebar** — Built-in en react (no necesita plugin separado)
- [x] **FindReplace** — Built-in en react con Ctrl+F, replace, case sensitive
- [x] **CI/CD pipeline** — GitHub Actions: test Node 18/20/22, auto-publish npm
- [x] **npm publishing workflow** — En CI/CD pipeline
- [x] **CHANGELOG.md** — Documentado v0.1.0 y v0.2.0
- [x] **TypeDoc API docs** — typedoc.json config, docs:api script, typedoc-plugin-markdown
- [x] **Performance benchmarks** — benchmark.ts con 16 benchmarks, formatBenchmarks(), test

---

## Gaps Identificados (del Estudio Competitivo)

### Prioridad Alta — v0.2 ✅ COMPLETADO

| Gap | Descripción | Estado |
|-----|-------------|--------|
| **Slash commands** | `/` abre menú de inserción de celda | ✅ SlashCommand.tsx |
| **Drag & drop reorder** | Arrastrar celdas para reordenar | ✅ Cell.tsx drag handlers |
| **Syntax highlighting** | Shiki para celdas de código | ✅ shiki-highlighter.ts |
| **Mermaid diagrams** | Plugin para diagramas | ✅ renderMermaidFallback() |

### Prioridad Alta — v0.3 ✅ COMPLETADO

| Gap | Descripción | Estado |
|-----|-------------|--------|
| **Code execution** | JS sandbox + custom executors | ✅ CodeExecutor |
| **Export** | HTML standalone, Markdown, .ipynb | ✅ ExportEngine |
| **Table editor** | Editor interactivo de tablas | ✅ TableCell.tsx |
| **TOC sidebar** | Tabla de contenidos | ✅ TOCSidebar.tsx |

### Prioridad Media — v0.4 ✅ COMPLETADO

| Gap | Descripción | Estado |
|-----|-------------|--------|
| **Find & replace** | Búsqueda global across cells | ✅ FindReplace.tsx |
| **Cell outputs** | Display de resultados de ejecución | ✅ CellOutputDisplay.tsx |
| **LaTeX autocomplete** | Autocompletado de comandos LaTeX | ✅ LatexAutocomplete.tsx |
| **Version history** | Diffing de notebook JSON | ✅ VersionHistory |

### Prioridad Baja — v1.0 (Pendiente)

| Gap | Descripción | Estado |
|-----|-------------|--------|
| **Colaboración RT** | CRDT vía Yjs | 🔜 Fuera de scope v0.2 |
| **Presentation mode** | Slideshow celda por celda | 🔜 Fuera de scope v0.2 |
| **Comments** | Anotaciones en celdas | 🔜 Fuera de scope v0.2 |
| **Citations** | BibTeX management | 🔜 Fuera de scope v0.2 |

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

## Quality Gates

- **Tests**: 114 tests pasando en 11 test files.
- **Types**: Strict TypeScript. Mínimo uso de `any`.
- **Bundle**: Core ~35KB, React ~80KB, Renderer ~10KB.
- **Docs**: API reference, guías, estudio competitivo, ejemplos funcionales, CHANGELOG.
- **CI/CD**: GitHub Actions con test matrix Node 18/20/22, auto-publish npm.

---

## Visión Post-v1

Arquitecturalmente soportado pero fuera de scope para v1:

- **Real-time collaboration** (CRDT vía Yjs)
- **Code execution** (Pyodide, QuickJS)
- **PDF/DOCX export** (vía plugin)
- **Version history** (git-like diffing)
- **Cloud sync** (plugin con backend configurable)
- **Mobile support** (touch-optimized adapter)
- **Presentation mode** (slideshow)
