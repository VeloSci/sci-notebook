export const exportPluginsNotebook = {
  id: "doc-export",
  title: "Export Plugins (PDF/DOCX)",
  cells: [
    {
      id: "ex-intro",
      type: "markdown",
      source: "# Export Plugins\n\nExport notebooks to **PDF** and **DOCX** formats using `@velo-sci/notebook-plugin-export`. Works both as a standalone API and as an EditorEngine plugin.",
      metadata: {},
    },
    {
      id: "ex-install",
      type: "code",
      source: "// Installation\n// pnpm add @velo-sci/notebook-plugin-export\n\nimport { createExportPlugin } from '@velo-sci/notebook-plugin-export';\nimport { createNotebook } from '@velo-sci/notebook-core';\n\nconst engine = createNotebook({\n  notebook: myNotebook,\n  config: {\n    plugins: [createExportPlugin()],\n  },\n});\n\n// Trigger export via events\nengine.emit('export:pdf', { notebook: engine.getNotebook() });\nengine.emit('export:docx', { notebook: engine.getNotebook() });",
      metadata: { language: "typescript" },
    },
    {
      id: "ex-pdf",
      type: "markdown",
      source: "## PDF Export\n\n### Browser Print-to-PDF\n\nOpens the browser's print dialog with a print-optimized HTML view. The user can then save as PDF.\n\n### Headless Browser\n\nUse `generatePrintHTML()` to get a standalone HTML string for Puppeteer/Playwright.",
      metadata: {},
    },
    {
      id: "ex-pdf-code",
      type: "code",
      source: "import { exportToPDF, generatePrintHTML } from '@velo-sci/notebook-plugin-export';\n\n// Browser print dialog\nexportToPDF(notebook, {\n  pageSize: 'A4',           // 'A4' | 'letter' | 'legal'\n  orientation: 'portrait',  // 'portrait' | 'landscape'\n  margins: { top: 20, right: 20, bottom: 20, left: 20 },\n  includeHeader: true,\n  headerText: 'My Notebook',\n  footerText: 'Page {page}',\n});\n\n// Headless browser (Puppeteer)\nconst html = generatePrintHTML(notebook, { pageSize: 'A4' });\nconst page = await browser.newPage();\nawait page.setContent(html);\nawait page.pdf({ path: 'output.pdf', format: 'A4' });",
      metadata: { language: "typescript" },
    },
    {
      id: "ex-docx",
      type: "markdown",
      source: "## DOCX Export\n\nGenerates Office Open XML documents with proper formatting:\n\n| Markdown | DOCX Mapping |\n|----------|-------------|\n| `# Heading 1` | Heading 1 style |\n| `## Heading 2` | Heading 2 style |\n| `**bold**` | Bold run |\n| `*italic*` | Italic run |\n| `` `code` `` | Monospaced font |\n| `> blockquote` | Indented paragraph |\n| `- list item` | Bulleted list |\n| Code blocks | Monospaced with background |",
      metadata: {},
    },
    {
      id: "ex-docx-code",
      type: "code",
      source: "import { exportToDOCX, downloadDOCX } from '@velo-sci/notebook-plugin-export';\n\n// Generate DOCX content (Office Open XML)\nconst docx = exportToDOCX(notebook);\n\n// Or download directly\ndownloadDOCX(notebook, 'my-notebook.docx');",
      metadata: { language: "typescript" },
    },
    {
      id: "ex-events",
      type: "markdown",
      source: "## Plugin Events\n\nWhen using `createExportPlugin()`, the plugin listens for:\n\n| Event | Payload | Action |\n|-------|---------|--------|\n| `export:pdf` | `{ notebook }` | Calls `exportToPDF()` |\n| `export:docx` | `{ notebook }` | Calls `downloadDOCX()` |",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook-docs" },
  version: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
