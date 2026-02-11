export const overviewNotebook = {
  id: "doc-overview",
  title: "Architecture Overview",
  cells: [
    {
      id: "ov-intro",
      type: "markdown",
      source: "# Sci-Notebook Architecture\n\nSci-Notebook is a **framework-agnostic scientific notebook engine** built entirely in TypeScript. It runs 100% in the browser with zero server dependencies.",
      metadata: {},
    },
    {
      id: "ov-arch",
      type: "markdown",
      source: "## Layered Architecture\n\n```\n┌─────────────────────────────────────────────────────────┐\n│                    UI Adapters                           │\n│   React 18+  │  Vue 3+  │  Svelte 5+  │  Vanilla JS    │\n├─────────────────────────────────────────────────────────┤\n│                  Rendering Pipeline                      │\n│   Markdown-it → AST → Transformers → HTML + Shiki       │\n├─────────────────────────────────────────────────────────┤\n│                    Core Engine                           │\n│   EditorEngine │ EventBus │ History │ Keybindings        │\n│   VersionHistory │ PresentationEngine │ MobileAdapter    │\n├─────────────────────────────────────────────────────────┤\n│                    Plugin System                         │\n│   LaTeX │ AI │ Export (PDF/DOCX) │ Cloud Sync            │\n└─────────────────────────────────────────────────────────┘\n```",
      metadata: {},
    },
    {
      id: "ov-packages",
      type: "markdown",
      source: "## Package Structure\n\n| Package | Description | Size |\n|---------|-------------|------|\n| `@velo-sci/notebook-core` | Document model, engine, events, presentation, mobile | ~45KB |\n| `@velo-sci/notebook-renderer` | Markdown→HTML pipeline, Shiki highlighting | ~30KB |\n| `@velo-sci/notebook-react` | React 18+ adapter, hooks, components | ~80KB |\n| `@velo-sci/notebook-vue` | Vue 3+ adapter, composables | ~15KB |\n| `@velo-sci/notebook-svelte` | Svelte 5+ adapter, stores | ~10KB |\n| `@velo-sci/notebook-vanilla` | Vanilla JS adapter, DOM renderer | ~20KB |\n| `@velo-sci/notebook-plugin-export` | PDF/DOCX export | ~12KB |\n| `@velo-sci/notebook-plugin-cloud-sync` | Cloud sync with backends | ~15KB |",
      metadata: {},
    },
    {
      id: "ov-data-flow",
      type: "markdown",
      source: "## Unidirectional Data Flow",
      metadata: {},
    },
    {
      id: "ov-data-flow-diagram",
      type: "mermaid",
      source: "graph LR\n  A[User Action] --> B[EditorEngine]\n  B --> C[State Mutation]\n  C --> D[EventBus]\n  D --> E[Framework Adapter]\n  E --> F[RenderPipeline]\n  F --> G[HTML Output]\n  G --> H[DOM Update]",
      metadata: {},
    },
    {
      id: "ov-data-flow-desc",
      type: "markdown",
      source: "1. **User Interaction** → triggers a command in `EditorEngine`\n2. **State Mutation** → engine updates the immutable `Notebook` state\n3. **Event Emission** → engine emits `notebook:updated` via `EventBus`\n4. **Reactive Update** → framework adapter catches event, triggers re-render\n5. **Rendering Pipeline** → `RenderPipeline` processes cells (with LRU cache) → HTML",
      metadata: {},
    },
    {
      id: "ov-engine-api",
      type: "code",
      source: "import { createNotebook, EditorEngine } from '@velo-sci/notebook-core';\n\n// Create an engine from a notebook\nconst engine: EditorEngine = createNotebook({\n  notebook: myNotebook,\n  config: { plugins: [latexPlugin, exportPlugin] }\n});\n\n// Cell operations\nengine.insertCell(0, 'markdown', '# New Section');\nengine.updateCellSource('cell-id', 'Updated content');\nengine.deleteCell('cell-id');\nengine.moveCell('cell-id', 3);\n\n// History\nengine.undo();\nengine.redo();\n\n// Events\nengine.on('notebook:updated', (payload) => {\n  console.log('Notebook changed:', payload.data.notebook);\n});",
      metadata: { language: "typescript" },
    },
    {
      id: "ov-principles",
      type: "markdown",
      source: "## Design Principles\n\n| Principle | Description |\n|-----------|-------------|\n| **Instant feedback** | Every action produces visual result in <16ms |\n| **Zero friction** | Never more than 2 clicks for common operations |\n| **Keyboard-first** | Everything accessible by keyboard |\n| **Offline-first** | Works without connection, syncs when online |\n| **Composable** | Every feature is an opt-in plugin, tree-shakeable |\n| **Framework agnostic** | Core has zero framework dependencies |\n| **Open** | Standard JSON format, MIT license, no vendor lock-in |",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook-docs" },
  version: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
