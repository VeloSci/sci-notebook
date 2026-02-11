export const cellTypesNotebook = {
  id: "doc-cell-types",
  title: "Cell Types Guide",
  cells: [
    {
      id: "ct-intro",
      type: "markdown",
      source: "# Cell Types in Sci-Notebook\n\nSci-Notebook supports **8 built-in cell types**, each optimized for a specific kind of content. Every cell has a type badge, supports view/edit modes, and can be reordered via drag & drop.\n\nBelow you can see **live examples** of each cell type.",
      metadata: {},
    },

    // ── Markdown ──────────────────────────────────────────────
    {
      id: "ct-md-title",
      type: "markdown",
      source: "---\n## 📝 Markdown Cell\n\nThe most common cell type. Supports full **CommonMark** syntax with extensions:\n\n- **Bold**, *italic*, ~~strikethrough~~, `inline code`\n- Tables, task lists, blockquotes\n- Links and images\n- Math: inline $E = mc^2$ and display blocks\n\n> **Tip:** Type `/` to open the slash command menu and insert any cell type.",
      metadata: {},
    },

    // ── Code ──────────────────────────────────────────────────
    {
      id: "ct-code-title",
      type: "markdown",
      source: "---\n## </> Code Cell\n\nCode cells render with **built-in syntax highlighting** for TypeScript, JavaScript, Python, and more.",
      metadata: {},
    },
    {
      id: "ct-code-ts",
      type: "code",
      source: "// TypeScript example with syntax highlighting\nimport { createNotebook } from '@velo-sci/notebook-core';\n\ninterface Config {\n  theme: 'light' | 'dark';\n  readOnly: boolean;\n}\n\nfunction fibonacci(n: number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconst result = fibonacci(10); // 55\nconsole.log(`Result: ${result}`);",
      metadata: { language: "typescript" },
    },
    {
      id: "ct-code-py",
      type: "code",
      source: "# Python example\nimport numpy as np\nfrom scipy import signal\n\ndef analyze_spectrum(data, sample_rate=1000):\n    \"\"\"Compute FFT and find dominant frequency.\"\"\"\n    freqs = np.fft.fftfreq(len(data), 1/sample_rate)\n    fft_vals = np.abs(np.fft.fft(data))\n    peak_idx = np.argmax(fft_vals[:len(data)//2])\n    return freqs[peak_idx]\n\nresult = analyze_spectrum(np.random.randn(1024))\nprint(f\"Dominant frequency: {result:.2f} Hz\")",
      metadata: { language: "python" },
    },

    // ── LaTeX ─────────────────────────────────────────────────
    {
      id: "ct-latex-title",
      type: "markdown",
      source: "---\n## ∑ LaTeX Cell\n\nLaTeX cells render mathematical formulas with **KaTeX**. They include a visual formula editor with 9 categories and 100+ symbols.",
      metadata: {},
    },
    {
      id: "ct-latex-demo",
      type: "latex",
      source: "$$\n\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
      metadata: {},
    },
    {
      id: "ct-latex-demo2",
      type: "latex",
      source: "$$\n\\mathbf{A} = \\begin{pmatrix} a_{11} & a_{12} & \\cdots & a_{1n} \\\\ a_{21} & a_{22} & \\cdots & a_{2n} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ a_{m1} & a_{m2} & \\cdots & a_{mn} \\end{pmatrix}\n$$",
      metadata: {},
    },
    {
      id: "ct-latex-inline",
      type: "markdown",
      source: "You can also use **inline math** in markdown cells: the Euler identity $e^{i\\pi} + 1 = 0$ or the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.",
      metadata: {},
    },

    // ── Mermaid ───────────────────────────────────────────────
    {
      id: "ct-mermaid-title",
      type: "markdown",
      source: "---\n## ◇ Mermaid Diagram Cell\n\nMermaid cells render diagrams from text definitions. Supports flowchart, sequence, class, state, ER, gantt, pie, and git graph.",
      metadata: {},
    },
    {
      id: "ct-mermaid-demo",
      type: "mermaid",
      source: "graph TD\n  A[Notebook] --> B[EditorEngine]\n  B --> C[RenderPipeline]\n  B --> D[EventBus]\n  C --> E[HTML Output]\n  D --> F[UI Update]\n  B --> G[VersionHistory]\n  G --> H[Undo/Redo]",
      metadata: {},
    },

    // ── Table ─────────────────────────────────────────────────
    {
      id: "ct-table-title",
      type: "markdown",
      source: "---\n## ▦ Table Cell\n\nTable cells provide an interactive spreadsheet-like editor with add/remove rows and columns.\n\n| Cell Type | Badge | Editor | Rendering |\n|-----------|-------|--------|-----------|\n| Markdown | M | Textarea + floating toolbar | CommonMark HTML |\n| Code | </> | Textarea | Syntax highlighted |\n| LaTeX | ∑ | MathEditor (visual) | KaTeX |\n| Mermaid | ◇ | Textarea | SVG diagram |\n| Table | ▦ | Spreadsheet grid | HTML table |\n| Image | 🖼 | Drop zone + fields | `<img>` |\n| Embed | ⧉ | URL + presets | `<iframe>` |\n| Raw | T | Textarea | `<pre>` |",
      metadata: {},
    },
    {
      id: "ct-table-demo",
      type: "table",
      source: "| Metric | Value | Unit |\n|--------|-------|------|\n| Temperature | 23.5 | °C |\n| Pressure | 101.3 | kPa |\n| Humidity | 45 | % |",
      metadata: {},
    },

    // ── Raw ───────────────────────────────────────────────────
    {
      id: "ct-raw-title",
      type: "markdown",
      source: "---\n## T Raw Cell\n\nRaw cells display text exactly as-is in a monospaced font — no Markdown, no LaTeX, no syntax highlighting.",
      metadata: {},
    },
    {
      id: "ct-raw-demo",
      type: "raw",
      source: "[2025-02-10 21:30:00] INFO  Server started on port 3000\n[2025-02-10 21:30:01] INFO  Connected to database (latency: 12ms)\n[2025-02-10 21:30:02] WARN  Cache miss ratio: 0.45\n[2025-02-10 21:30:05] ERROR Connection timeout after 5000ms\n[2025-02-10 21:30:06] INFO  Retrying connection (attempt 2/3)...\n[2025-02-10 21:30:07] INFO  Connection restored",
      metadata: {},
    },

    // ── Image & Embed ─────────────────────────────────────────
    {
      id: "ct-image-embed",
      type: "markdown",
      source: "---\n## �️ Image & 🌐 Embed Cells\n\n**Image cells** support drag & drop, remote URLs, alt text, captions, width control (25%–100%), and alignment.\n\n**Embed cells** render external content via sandboxed iframes with presets for YouTube, CodePen, Observable, Desmos, and GeoGebra.\n\n> Both cell types have dedicated visual editors that activate on click.",
      metadata: {},
    },

    // ── API ───────────────────────────────────────────────────
    {
      id: "ct-api",
      type: "code",
      source: "// Creating and manipulating cells programmatically\nimport { createNotebook } from '@velo-sci/notebook-core';\n\nconst engine = createNotebook({ notebook: myNotebook });\n\n// Insert cells at specific positions\nengine.insertCell(0, 'markdown', '# Hello World');\nengine.insertCell(1, 'code', 'console.log(\"hi\")');\nengine.insertCell(2, 'latex', '$$E = mc^2$$');\n\n// Change cell type dynamically\nengine.setCellType('cell-id', 'latex');\n\n// Listen for changes\nengine.on('notebook:updated', ({ data }) => {\n  console.log('Cells:', data.notebook.cells.length);\n});",
      metadata: { language: "typescript" },
    },

    // ── Custom Types ──────────────────────────────────────────
    {
      id: "ct-plugin",
      type: "markdown",
      source: "---\n## 🔌 Custom Cell Types via Plugins\n\nRegister custom cell types through the plugin system. Custom renderers integrate seamlessly with the rendering pipeline and support caching.",
      metadata: {},
    },
    {
      id: "ct-plugin-code",
      type: "code",
      source: "const chartPlugin: SciNotebookPlugin = {\n  id: 'custom-chart',\n  name: 'Chart Cell',\n  version: '1.0.0',\n  cellTypes: [{\n    type: 'chart',\n    displayName: 'Chart',\n    icon: '📈',\n    defaultSource: '{\"type\":\"line\",\"data\":[]}',\n  }],\n  rendering: {\n    preprocess: (source, cell) => {\n      if (cell.type === 'chart') {\n        return renderChartToSVG(JSON.parse(source));\n      }\n      return source;\n    },\n    priority: 10,\n  },\n};",
      metadata: { language: "typescript" },
    },
  ],
  metadata: { author: "sci-notebook-docs" },
  version: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
