import type { Notebook } from "@velo-sci/notebook-core";

export const SAMPLE_NOTEBOOK: Notebook = {
  id: "demo_nb_1",
  title: "Sci-Notebook Demo",
  cells: [
    {
      id: "c1",
      type: "markdown",
      source: "# Welcome to Sci-Notebook\n\nA modular, framework-agnostic scientific notebook editor. **Click** any cell to edit it.\n\n- Supports **Markdown**, code, LaTeX, tables, diagrams, and more\n- Undo/Redo with `Ctrl+Z` / `Ctrl+Shift+Z`\n- Navigate between cells with `Shift+Enter`\n- Type `/` to insert a new cell type\n- Drag cells to reorder\n- `Ctrl+F` to find and replace",
      metadata: {},
    },
    {
      id: "c2",
      type: "markdown",
      source: "## Features Overview\n\n| Feature | Status |\n|---------|--------|\n| Markdown (CommonMark) | ✅ |\n| Code cells (30+ languages) | ✅ |\n| LaTeX (visual editor, 100+ blocks) | ✅ |\n| Interactive tables | ✅ |\n| Mermaid diagrams | ✅ |\
| Image cells (drag & drop, resize) | ✅ |\n| Embed cells (YouTube, Desmos, CodePen) | ✅ |\n| Light / Dark themes | ✅ |\n| Slash commands | ✅ |\n| Drag & drop reorder | ✅ |\n| Find & Replace | ✅ |\n| TOC sidebar | ✅ |\n| Template engine | ✅ |\n| Export (HTML, MD, IPYNB, JSON) | ✅ |\n| **PDF export** | ✅ NEW |\n| **Presentation mode** | ✅ NEW |\n| **Version history (git-like diff)** | ✅ NEW |\n| **Cloud sync** | ✅ NEW |\n| **Mobile / touch support** | ✅ NEW |\n| **Vue 3+ adapter** | ✅ NEW |\n| **Svelte 5+ adapter** | ✅ NEW |\n| **Vanilla JS adapter** | ✅ NEW |",
      metadata: {},
    },
    {
      id: "c3",
      type: "code",
      source: '// Fibonacci — syntax highlighted with Shiki (30+ languages)\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10)); // 55',
      metadata: { language: "javascript" },
    },
    {
      id: "c4",
      type: "markdown",
      source: "### Visual Table Editor\n\nClick the table below to open the **interactive editor**. You can add/remove rows and columns, and edit content without touching Markdown code.",
      metadata: {},
    },
    {
      id: "c4b",
      type: "table",
      source: "| Feature | Description | Support |\n| --- | --- | --- |\n| Visual Editing | Edit content in a grid | ✅ |\n| Structure | Add/Remove rows & cols | ✅ |\n| Markdown Sync | Automatic code generation | ✅ |\n| Cross-framework | Vanilla, React, Vue, Svelte | ✅ |",
      metadata: {},
    },
    {
      id: "c4c",
      type: "table",
      source: "| Shortcut | Action |\n| --- | --- |\n| Click | Edit cell |\n| Escape | Exit edit mode |\n| Shift+Enter | Next cell |\n| / | Slash commands |\n| Drag handle | Reorder cells |\n| Ctrl+Z | Undo |",
      metadata: {},
    },
    {
      id: "c5",
      type: "latex",
      source: "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
      metadata: {},
    },
    {
      id: "c6",
      type: "markdown",
      source: "## Visual Formula Editor\n\nThe cell above is a **LaTeX cell**. Click it to open the visual editor:\n\n- **Block palette**: fractions, integrals, summations, matrices, Greek letters, operators\n- **Preview mode**: see the formula as you build it\n- **LaTeX mode**: edit the raw code directly\n- **100+ pre-built blocks** across 9 categories",
      metadata: {},
    },
    {
      id: "c7",
      type: "mermaid",
      source: "graph TD\n    A[Notebook] --> B[Core Engine]\n    A --> C[Renderer]\n    A --> D[React Adapter]\n    A --> E[Vue Adapter]\n    A --> F[Svelte Adapter]\n    A --> G[Vanilla Adapter]\n    B --> H[EditorEngine]\n    B --> I[PresentationEngine]\n    B --> J[VersionHistory]\n    B --> K[MobileAdapter]\n    C --> L[RenderPipeline]",
      metadata: {},
    },
    {
      id: "c8",
      type: "image",
      source: "https://upload.wikimedia.org/wikipedia/commons/4/41/Rising_circular.gif",
      metadata: { alt: "Euler's formula", caption: "Graphical representation of Euler's formula", width: "50%", align: "center" },
    },
    {
      id: "c9",
      type: "embed",
      source: "https://www.youtube.com/embed/aircAruvnKk",
      metadata: { title: "3Blue1Brown - Neural Networks", height: "400px", sandbox: "allow-scripts allow-same-origin allow-popups allow-presentation" },
    },
    {
      id: "c10",
      type: "markdown",
      source: "## Template Engine\n\nThe `TemplateEngine` supports `{{variable}}` flags in cells:\n\n- `{{variable}}` — simple replacement\n- `{{obj.prop}}` — dot-notation access\n- `{{#table dataKey}}` — generate Markdown table from array\n- `{{#each items}}...{{/each}}` — loop\n- `{{#if cond}}...{{else}}...{{/if}}` — conditional\n- `{{#date YYYY-MM-DD}}` — formatted date\n- `{{value | uppercase}}` — filters (uppercase, currency, percent, etc.)\n\nIdeal for generating reports from databases.",
      metadata: {},
    },
    {
      id: "c11",
      type: "markdown",
      source: "## Presentation Mode ✨\n\nNotebooks can be turned into **slideshows**. The `PresentationEngine` supports:\n\n- **3 split modes**: `cell` (one cell per slide), `heading` (split on h1/h2), `manual` (custom breakpoints)\n- **Keyboard navigation**: Arrow keys, Space, PageUp/Down, Home/End, Escape\n- **Transitions**: fade, slide-left, slide-right (configurable duration)\n- **Auto-advance** with configurable interval\n- **Fullscreen** via the Fullscreen API\n\nClick the **Present** button in the header to try it!",
      metadata: {},
    },
    {
      id: "c12",
      type: "markdown",
      source: "## Version History & Diffing ✨\n\nThe `VersionHistory` class provides **git-like diffing**:\n\n- `save()` — snapshot the current notebook state\n- `restore()` — restore a previous version\n- `detailedDiff()` — per-cell, line-level diffs using LCS algorithm\n- `diffSummary()` — human-readable change summary\n- Auto-save at configurable intervals\n\nClick **Save Version** in the header to create a snapshot. Click **History** to browse versions.",
      metadata: {},
    },
    {
      id: "c13",
      type: "markdown",
      source: "## Export Options ✨\n\nExport your notebook in multiple formats:\n\n| Format | Description |\n|--------|-------------|\n| **JSON** | Native notebook format |\n| **HTML** | Standalone HTML with embedded styles |\n| **Markdown** | Plain Markdown text |\n| **IPYNB** | Jupyter Notebook format |\n| **PDF** | Print-to-PDF via browser (or headless browser) |\n\nAll export buttons are in the header toolbar.",
      metadata: {},
    },
    {
      id: "c14",
      type: "markdown",
      source: "## Framework Adapters ✨\n\n| Package | Framework | Status |\n|---------|-----------|--------|\n| `@velo-sci/notebook-react` | React 18+ | ✅ Primary |\n| `@velo-sci/notebook-vue` | Vue 3+ | ✅ Implemented |\n| `@velo-sci/notebook-svelte` | Svelte 5+ | ✅ Implemented |\n| `@velo-sci/notebook-vanilla` | Vanilla JS | ✅ Primary |\n\nAll adapters share the same `@velo-sci/notebook-core` engine. The core is **100% framework-agnostic** — pure TypeScript with zero dependencies.",
      metadata: {},
    },
    {
      id: "c15",
      type: "raw",
      source: "This is a raw cell — displayed as-is, without any processing.\nUseful for raw data, logs, or content that should not be formatted.",
      metadata: {},
    },
    {
      id: "c16",
      type: "markdown",
      source: "## Cell Types\n\n| Type | Description |\n|------|-------------|\n| **Markdown** | Rich text with formatting, tables, lists, links |\n| **Code** | Syntax-highlighted code blocks (30+ languages) |\n| **LaTeX** | Formulas with visual editor (100+ blocks) |\n| **Table** | Interactive table editor |\n| **Mermaid** | Diagrams (flowchart, sequence, gantt, etc.) |\n| **Image** | Drag & drop, URL, caption, resize handles |\n| **Embed** | YouTube, CodePen, Desmos, GeoGebra, Observable |\n| **Raw** | Unformatted text |",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook" },
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function simpleMarkdown(src: string): string {
  return src
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\| (.+) \|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
