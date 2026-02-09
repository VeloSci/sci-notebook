# 01 — Project Overview & Architecture

## Vision

**sci-notebook** is a framework-agnostic, highly configurable library for creating and
visualizing scientific notebooks. It provides a dual-mode editor (raw Markdown / rendered
preview), native LaTeX formula support, Mermaid diagrams, embeddable HTML/React/any-framework
components, image and table inlining, and an AI-agent connection layer for real-time text
predictions — all designed for maximum performance.

## Design Principles

- **Framework-agnostic core**: The kernel is pure TypeScript with zero framework dependencies.
  Thin adapter layers expose it to React, Vue, Svelte, Solid, or vanilla JS.
- **Plugin-first**: Every non-trivial feature (LaTeX, Mermaid, AI completions, embeds) is a
  plugin. The core ships with a minimal set; users opt-in to what they need.
- **Performance by default**: Virtual rendering for large documents, incremental parsing,
  lazy plugin loading, and Web Worker offloading where beneficial.
- **Serializable state**: The entire notebook is a plain JSON document. No opaque binary
  blobs. Easy to persist, diff, and version-control.
- **Extensible at every layer**: Custom cell types, custom renderers, custom toolbar actions,
  custom keybindings, custom AI providers.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Framework Adapter                    │
│          (React / Vue / Svelte / Vanilla JS)            │
├─────────────────────────────────────────────────────────┤
│                     Toolbar / UI Shell                  │
├──────────┬──────────┬───────────────────────────────────┤
│  Editor  │ Preview  │         Side Panels               │
│  (Edit)  │ (View)   │   (TOC, Outline, AI Chat)         │
├──────────┴──────────┴───────────────────────────────────┤
│                   Plugin Manager                        │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌───────────┐  │
│  │LaTeX │ │Mermaid │ │Embeds  │ │ AI   │ │  Custom   │  │
│  └──────┘ └────────┘ └────────┘ └──────┘ └───────────┘  │
├─────────────────────────────────────────────────────────┤
│                  Rendering Pipeline                     │
│         (Markdown Parser → AST → Renderers)             │
├─────────────────────────────────────────────────────────┤
│                    Editor Engine                        │
│       (Cell Manager, Selection, Undo/Redo, Keybindings) │
├─────────────────────────────────────────────────────────┤
│                    Document Model                       │
│            (Notebook → Cells → Content)                 │
├─────────────────────────────────────────────────────────┤
│                  Event Bus / State                      │
│          (Pub-Sub, Immutable Snapshots, History)        │
└─────────────────────────────────────────────────────────┘
```

---

## Package Structure (Monorepo)

```
sci-notebook/
├── packages/
│   ├── core/               # Document model, editor engine, event bus
│   ├── renderer/           # Markdown→AST→HTML rendering pipeline
│   ├── plugin-latex/       # KaTeX-based LaTeX rendering
│   ├── plugin-mermaid/     # Mermaid diagram rendering
│   ├── plugin-embeds/      # HTML / framework component embedding
│   ├── plugin-ai/          # AI agent connection (completions, rewrites)
│   ├── plugin-images/      # Image upload, paste, drag-drop, resize
│   ├── plugin-tables/      # Rich table editing inside cells
│   ├── react/              # React adapter + hooks
│   ├── vue/                # Vue adapter (future)
│   ├── svelte/             # Svelte adapter (future)
│   └── vanilla/            # Vanilla JS adapter
├── docs/                   # This development schema
├── examples/
│   ├── react-basic/
│   ├── react-full/
│   └── vanilla/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json            # Workspace root
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Technology Choices

| Layer              | Technology                  | Rationale                              |
|--------------------|-----------------------------|----------------------------------------|
| Language           | TypeScript (strict)         | Type safety, IDE support               |
| Build              | tsup + Vite                 | Fast builds, tree-shaking              |
| Monorepo           | pnpm workspaces             | Efficient, well-supported              |
| Markdown Parser    | markdown-it (pluggable)     | Fast, extensible, battle-tested        |
| LaTeX              | KaTeX                       | Fastest LaTeX renderer for the web     |
| Diagrams           | Mermaid                     | De-facto standard for text diagrams    |
| Testing            | Vitest + Playwright         | Fast unit + real browser e2e           |
| State              | Custom immutable store      | No framework dependency                |
| Styling            | CSS variables + BEM         | Framework-agnostic, themeable          |

---

## Core Concepts

### Notebook
A notebook is a JSON document containing an ordered list of **cells**. Each cell has a
`type`, `source` (raw content), and optional `metadata`.

### Cell
The atomic unit. Built-in types: `markdown`, `code`, `raw`. Plugins can register custom
types (e.g., `latex-block`, `mermaid`, `embed`, `table`, `image`).

### Dual Mode
- **Edit mode**: Shows raw Markdown source with syntax highlighting. The user types freely.
- **View mode**: Renders the Markdown through the rendering pipeline, applying all plugins.
- Per-cell or per-notebook toggle. Clicking a rendered cell switches it to edit mode.

### Plugin
A plugin is an object conforming to `SciNotebookPlugin` interface. It can:
- Register new cell types
- Hook into the rendering pipeline (AST transforms)
- Add toolbar buttons
- Register keybindings
- Provide AI completion providers
- Inject CSS

### Event Bus
A synchronous pub-sub system. All state mutations emit events. Plugins and adapters
subscribe to react. Events are typed and documented.

---

## Non-Goals (Explicit Exclusions)

- **Code execution**: This is a *document* editor, not a Jupyter kernel. Code cells are
  for display/syntax highlighting only (execution can be added via plugin).
- **Collaboration / CRDT**: Real-time multi-user editing is out of scope for v1.
  The architecture does not prevent it, but it is not a deliverable.
- **PDF export**: Can be added as a plugin later. Not in core scope.

---

## Document Index

| # | File                        | Content                                    |
|---|-----------------------------|--------------------------------------------|
| 1 | `01-overview.md`            | This file — vision, architecture, packages |
| 2 | `02-data-model.md`          | Notebook/Cell JSON schema, types           |
| 3 | `03-editor-engine.md`       | Cell manager, selection, undo/redo, keys   |
| 4 | `04-rendering-pipeline.md`  | MD parsing, AST, renderer chain            |
| 5 | `05-plugin-system.md`       | Plugin interface, lifecycle, registration  |
| 6 | `06-latex-mermaid-embeds.md` | LaTeX, Mermaid, HTML/component embeds      |
| 7 | `07-ai-integration.md`      | Agent protocol, inline completions         |
| 8 | `08-framework-adapters.md`  | React/Vue/Svelte/Vanilla adapters, API     |
| 9 | `09-performance.md`         | Virtual rendering, lazy loading, workers   |
| 10| `10-roadmap.md`             | Phased development plan, milestones        |
