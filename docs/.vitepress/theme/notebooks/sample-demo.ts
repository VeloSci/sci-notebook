import type { Notebook } from '@velo-sci/notebook-core';

export const sampleNotebookData: Notebook = {
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
            source: "## Features Overview\n\n| Feature | Status |\n|---------|--------|\n| Markdown (CommonMark) | ✅ |\n| Code cells (30+ languages) | ✅ |\n| LaTeX (visual editor, 100+ blocks) | ✅ |\n| Interactive tables | ✅ |\n| Mermaid diagrams | ✅ |\n| Image cells (drag & drop, resize) | ✅ |\n| Embed cells (YouTube, Desmos, CodePen) | ✅ |\n| Light / Dark themes | ✅ |\n| Slash commands | ✅ |\n| Drag & drop reorder | ✅ |\n| Find & Replace | ✅ |\n| TOC sidebar | ✅ |\n| Template engine | ✅ |\n| Export (HTML, MD, IPYNB, JSON) | ✅ |\n| **PDF / DOCX export** | ✅ NEW |\n| **Presentation mode** | ✅ NEW |\n| **Version history (git-like diff)** | ✅ NEW |\n| **Cloud sync** | ✅ NEW |\n| **Mobile / touch support** | ✅ NEW |\n| **Vue 3+ adapter** | ✅ NEW |\n| **Svelte 5+ adapter** | ✅ NEW |\n| **Vanilla JS adapter** | ✅ NEW |",
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
            id: "c5",
            type: "latex",
            source: "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
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
            source: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Euler%27s_formula.svg/400px-Euler%27s_formula.svg.png",
            metadata: { alt: "Euler's formula", caption: "Graphical representation of Euler's formula", width: "50%", align: "center" },
        },
        {
            id: "c9",
            type: "embed",
            source: "https://www.youtube.com/embed/aircAruvnKk",
            metadata: { title: "3Blue1Brown - Neural Networks", height: "400px", sandbox: "allow-scripts allow-same-origin allow-popups" },
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
