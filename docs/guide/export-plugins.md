<script setup>
import { exportPluginsNotebook } from '../.vitepress/theme/notebooks/export-plugins'
</script>

# Export Plugins

<InteractiveDoc :notebook="exportPluginsNotebook" title="Export Plugins — Interactive Notebook" />

Export notebooks to PDF and DOCX formats using `@velo-sci/notebook-plugin-export`.

---

## Installation

```bash
pnpm add @velo-sci/notebook-plugin-export
```

---

## Quick Start

### As a Plugin

```typescript
import { createExportPlugin } from "@velo-sci/notebook-plugin-export";

const engine = createNotebook({
  notebook: myNotebook,
  config: {
    plugins: [createExportPlugin()],
  },
});

// Trigger via events
engine.emit("export:pdf", { notebook: engine.getNotebook() });
engine.emit("export:docx", { notebook: engine.getNotebook() });
```

### Standalone Functions

```typescript
import {
  exportToPDF,
  exportToDOCX,
  generatePrintHTML,
  downloadDOCX,
} from "@velo-sci/notebook-plugin-export";
```

---

## PDF Export

### Browser Print-to-PDF

```typescript
import { exportToPDF } from "@velo-sci/notebook-plugin-export";

exportToPDF(notebook, {
  pageSize: "A4",          // "A4" | "letter" | "legal"
  orientation: "portrait", // "portrait" | "landscape"
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  includeHeader: true,
  includeFooter: true,
  headerText: "My Notebook",
  footerText: "Page {page}",
});
```

This opens the browser's print dialog. The user can then save as PDF.

### Headless Browser (Puppeteer / Playwright)

```typescript
import { generatePrintHTML } from "@velo-sci/notebook-plugin-export";

const html = generatePrintHTML(notebook, {
  pageSize: "A4",
  orientation: "portrait",
});

// Use with Puppeteer
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({ path: "output.pdf", format: "A4" });
await browser.close();
```

---

## DOCX Export

### Generate and Download

```typescript
import { exportToDOCX, downloadDOCX } from "@velo-sci/notebook-plugin-export";

// Generate DOCX content (Office Open XML)
const docx = exportToDOCX(notebook);

// Download directly
downloadDOCX(notebook, "my-notebook.docx");
```

### Supported Formatting

The DOCX export preserves:

| Element | DOCX Mapping |
|---------|-------------|
| `# Heading 1` | Heading 1 style |
| `## Heading 2` | Heading 2 style |
| `### Heading 3` | Heading 3 style |
| `**bold**` | Bold run |
| `*italic*` | Italic run |
| `` `code` `` | Monospaced font |
| `> blockquote` | Indented paragraph |
| `- list item` | Bulleted list |
| Code blocks | Monospaced paragraph with background |

---

## Plugin Events

When using `createExportPlugin()`, the plugin listens for these events on the `EditorEngine`:

| Event | Payload | Action |
|-------|---------|--------|
| `export:pdf` | `{ notebook }` | Calls `exportToPDF()` |
| `export:docx` | `{ notebook }` | Calls `downloadDOCX()` |

---

## API Reference

### `exportToPDF(notebook, options?)`

Opens the browser print dialog with a print-optimized HTML view.

### `generatePrintHTML(notebook, options?)`

Returns a standalone HTML string optimized for headless browser PDF generation.

### `exportToDOCX(notebook)`

Returns the DOCX file content as a string (Office Open XML format).

### `downloadDOCX(notebook, filename?)`

Generates and triggers a browser download of the DOCX file.

### `createExportPlugin()`

Returns a `SciNotebookPlugin` that registers event handlers for `export:pdf` and `export:docx`.

### `PDFExportOptions`

```typescript
interface PDFExportOptions {
  pageSize?: "A4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  margins?: { top: number; right: number; bottom: number; left: number };
  includeHeader?: boolean;
  includeFooter?: boolean;
  headerText?: string;
  footerText?: string;
}
```
