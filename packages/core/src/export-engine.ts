/**
 * Export Engine for sci-notebook
 *
 * Converts notebooks to various output formats:
 * - HTML (standalone, with embedded CSS)
 * - Markdown (plain .md)
 * - Jupyter (.ipynb)
 * - JSON (native format)
 *
 * For PDF: use the TemplateEngine to resolve flags, then export to HTML
 * and use the browser's print-to-PDF or a headless renderer.
 */

import type { Notebook, Cell, CellOutput } from "./types";

// ── Types ──────────────────────────────────────────────────────

export interface ExportOptions {
  /** Include CSS in HTML export (default: true) */
  includeStyles?: boolean;
  /** Custom CSS to inject in HTML export */
  customCSS?: string;
  /** HTML renderer function — if not provided, uses basic fallback */
  renderCell?: (cell: Cell) => string;
  /** Title override */
  title?: string;
  /** Author for metadata */
  author?: string;
  /** Whether to include cell metadata in export */
  includeMetadata?: boolean;
}

export interface ExportResult {
  content: string;
  mimeType: string;
  extension: string;
  filename: string;
}

// ── Export functions ────────────────────────────────────────────

/**
 * Export notebook to standalone HTML
 */
export function exportToHTML(notebook: Readonly<Notebook>, options: ExportOptions = {}): ExportResult {
  const title = options.title || notebook.title || "Untitled Notebook";
  const author = options.author || (notebook.metadata.author as string) || "";

  const cellsHtml = notebook.cells.map(cell => {
    if (options.renderCell) {
      return `<div class="sci-nb-cell sci-nb-cell--${cell.type}" data-cell-type="${cell.type}">${options.renderCell(cell)}</div>`;
    }
    return renderCellFallback(cell);
  }).join("\n\n");

  const css = options.includeStyles !== false ? getDefaultCSS(options.customCSS) : (options.customCSS || "");

  const hasMermaid = notebook.cells.some(c => c.type === "mermaid");
  const hasLatex = notebook.cells.some(c => c.type === "latex") ||
    notebook.cells.some(c => c.type === "markdown" && /\$[^$]/.test(c.source));

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${author ? `<meta name="author" content="${escapeHtml(author)}">` : ""}
  <meta name="generator" content="sci-notebook">
  ${hasLatex ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">` : ""}
  <style>${css}</style>
</head>
<body>
  <div class="sci-nb sci-nb--export">
    <h1 class="sci-nb-export-title">${escapeHtml(title)}</h1>
    ${author ? `<p class="sci-nb-export-author">Por ${escapeHtml(author)}</p>` : ""}
    <p class="sci-nb-export-date">${new Date().toLocaleDateString("es")}</p>
    <div class="sci-nb-cells">
      ${cellsHtml}
    </div>
  </div>
  ${hasMermaid ? `<script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default', securityLevel: 'loose' });
  </script>` : ""}
</body>
</html>`;

  return {
    content: html,
    mimeType: "text/html",
    extension: "html",
    filename: `${slugify(title)}.html`,
  };
}

/**
 * Export notebook to Markdown
 */
export function exportToMarkdown(notebook: Readonly<Notebook>, options: ExportOptions = {}): ExportResult {
  const title = options.title || notebook.title;
  const parts: string[] = [];

  if (title) {
    parts.push(`# ${title}\n`);
  }

  for (const cell of notebook.cells) {
    switch (cell.type) {
      case "markdown":
        parts.push(cell.source);
        break;
      case "code": {
        const lang = cell.metadata.language || "";
        parts.push(`\`\`\`${lang}\n${cell.source}\n\`\`\``);
        break;
      }
      case "latex":
        parts.push(cell.source);
        break;
      case "raw":
        parts.push(cell.source);
        break;
      case "image": {
        const alt = (cell.metadata.alt as string) || "image";
        const caption = cell.metadata.caption as string;
        parts.push(`![${alt}](${cell.source})`);
        if (caption) parts.push(`*${caption}*`);
        break;
      }
      case "embed":
        parts.push(`[Embedded content](${cell.source})`);
        break;
      case "mermaid":
        parts.push(`\`\`\`mermaid\n${cell.source}\n\`\`\``);
        break;
      case "table":
        parts.push(cell.source);
        break;
      default:
        parts.push(cell.source);
    }
  }

  return {
    content: parts.join("\n\n"),
    mimeType: "text/markdown",
    extension: "md",
    filename: `${slugify(title || "notebook")}.md`,
  };
}

/**
 * Export notebook to Jupyter .ipynb format
 */
export function exportToIPYNB(notebook: Readonly<Notebook>, options: ExportOptions = {}): ExportResult {
  const title = options.title || notebook.title;

  const ipynbCells = notebook.cells.map(cell => {
    const source = cell.source.split("\n").map((line, i, arr) =>
      i < arr.length - 1 ? line + "\n" : line
    );

    if (cell.type === "code") {
      const outputs: any[] = [];
      if (cell.outputs) {
        for (const out of cell.outputs) {
          if (out.outputType === "stream") {
            outputs.push({
              output_type: "stream",
              name: out.name,
              text: [out.text],
            });
          } else if (out.outputType === "display") {
            outputs.push({
              output_type: "display_data",
              data: out.data,
              metadata: out.metadata || {},
            });
          } else if (out.outputType === "error") {
            outputs.push({
              output_type: "error",
              ename: out.name,
              evalue: out.message,
              traceback: out.traceback || [],
            });
          }
        }
      }

      return {
        cell_type: "code",
        execution_count: cell.metadata.executionCount ?? null,
        metadata: {},
        outputs,
        source,
      };
    }

    if (cell.type === "raw") {
      return {
        cell_type: "raw",
        metadata: {},
        source,
      };
    }

    // Everything else → markdown
    return {
      cell_type: "markdown",
      metadata: {},
      source,
    };
  });

  const ipynb = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
        version: "3.10.0",
      },
      title,
      ...(options.includeMetadata ? notebook.metadata : {}),
    },
    cells: ipynbCells,
  };

  return {
    content: JSON.stringify(ipynb, null, 2),
    mimeType: "application/x-ipynb+json",
    extension: "ipynb",
    filename: `${slugify(title || "notebook")}.ipynb`,
  };
}

/**
 * Export notebook to native JSON
 */
export function exportToJSON(notebook: Readonly<Notebook>, pretty = true): ExportResult {
  return {
    content: JSON.stringify(notebook, null, pretty ? 2 : 0),
    mimeType: "application/json",
    extension: "json",
    filename: `${slugify(notebook.title || "notebook")}.json`,
  };
}

/**
 * Trigger a browser download of an ExportResult
 */
export function downloadExport(result: ExportResult): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Helpers ──────────────────────────────────────────────────

function renderCellFallback(cell: Cell): string {
  switch (cell.type) {
    case "markdown":
      return `<div class="sci-nb-cell sci-nb-cell--markdown">${markdownToHtml(cell.source)}</div>`;
    case "code": {
      const lang = cell.metadata.language || "";
      return `<div class="sci-nb-cell sci-nb-cell--code"><pre><code class="language-${lang}">${escapeHtml(cell.source)}</code></pre></div>`;
    }
    case "latex": {
      const cleaned = cell.source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
      const katex = typeof globalThis !== "undefined" ? (globalThis as any).katex : null;
      let rendered: string;
      if (katex) {
        try {
          rendered = katex.renderToString(cleaned, { displayMode: true, throwOnError: false });
        } catch {
          rendered = `<code class="sci-nb-latex-code">${escapeHtml(cleaned)}</code>`;
        }
      } else {
        rendered = `<code class="sci-nb-latex-code">${escapeHtml(cleaned)}</code>`;
      }
      return `<div class="sci-nb-cell sci-nb-cell--latex sci-nb-latex-display">${rendered}</div>`;
    }
    case "table":
      return `<div class="sci-nb-cell sci-nb-cell--table">${markdownTableToHtml(cell.source)}</div>`;
    case "mermaid":
      return `<div class="sci-nb-cell sci-nb-cell--mermaid"><pre class="mermaid">${escapeHtml(cell.source.trim())}</pre></div>`;
    case "raw":
      return `<div class="sci-nb-cell sci-nb-cell--raw"><pre>${escapeHtml(cell.source)}</pre></div>`;
    case "image": {
      const alt = escapeHtml((cell.metadata.alt as string) || "");
      const caption = (cell.metadata.caption as string) || "";
      const width = (cell.metadata.width as string) || "auto";
      let html = `<div class="sci-nb-cell sci-nb-cell--image" style="text-align:${cell.metadata.align || "center"}"><img src="${escapeHtml(cell.source)}" alt="${alt}" style="max-width:${width}">`;
      if (caption) html += `<p class="sci-nb-image-caption">${escapeHtml(caption)}</p>`;
      html += `</div>`;
      return html;
    }
    case "embed":
      return `<div class="sci-nb-cell sci-nb-cell--embed"><iframe src="${escapeHtml(cell.source)}" style="width:100%;height:${(cell.metadata.height as string) || "400px"};border:none" loading="lazy"></iframe></div>`;
    default:
      return `<div class="sci-nb-cell">${escapeHtml(cell.source)}</div>`;
  }
}

/**
 * Convert a markdown table string to an HTML <table>.
 */
function markdownTableToHtml(source: string): string {
  const lines = source.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return `<p>${escapeHtml(source)}</p>`;

  const parseRow = (line: string): string[] =>
    line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

  const headers = parseRow(lines[0]);
  // skip separator line (lines[1])
  const rows = lines.slice(2).map(parseRow);

  let html = '<table><thead><tr>';
  for (const h of headers) html += `<th>${inlineMarkdown(h)}</th>`;
  html += '</tr></thead><tbody>';
  for (const row of rows) {
    html += '<tr>';
    for (let i = 0; i < headers.length; i++) {
      html += `<td>${inlineMarkdown(row[i] || "")}</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

/**
 * Minimal markdown → HTML converter for export.
 * Handles headings, bold, italic, code, links, lists, blockquotes,
 * tables embedded in markdown, inline/display math, and horizontal rules.
 */
function markdownToHtml(source: string): string {
  const lines = source.split("\n");
  const result: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let inTable = false;
  let tableLines: string[] = [];

  const flushTable = () => {
    if (tableLines.length >= 2) {
      result.push(markdownTableToHtml(tableLines.join("\n")));
    }
    tableLines = [];
    inTable = false;
  };

  const flushList = () => {
    if (inList) { result.push(`</${inList}>`); inList = null; }
  };

  const flushBlockquote = () => {
    if (inBlockquote) { result.push("</blockquote>"); inBlockquote = false; }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection: line contains | and is not a heading
    if (trimmed.includes("|") && !trimmed.startsWith("#")) {
      if (!inTable) { flushList(); flushBlockquote(); inTable = true; }
      tableLines.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Empty line
    if (!trimmed) {
      flushList();
      flushBlockquote();
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList(); flushBlockquote();
      result.push("<hr>");
      continue;
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      flushList(); flushBlockquote();
      const level = hMatch[1].length;
      result.push(`<h${level}>${inlineMarkdown(hMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      if (!inBlockquote) { result.push("<blockquote>"); inBlockquote = true; }
      result.push(`<p>${inlineMarkdown(trimmed.slice(2))}</p>`);
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      flushBlockquote();
      if (inList !== "ul") { flushList(); result.push("<ul>"); inList = "ul"; }
      result.push(`<li>${inlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)/);
    if (olMatch) {
      flushBlockquote();
      if (inList !== "ol") { flushList(); result.push("<ol>"); inList = "ol"; }
      result.push(`<li>${inlineMarkdown(olMatch[2])}</li>`);
      continue;
    }

    // Regular paragraph
    flushList(); flushBlockquote();
    result.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  if (inTable) flushTable();
  flushList();
  flushBlockquote();

  return result.join("\n");
}

/**
 * Process inline markdown: bold, italic, code, links, images, inline math.
 */
function inlineMarkdown(text: string): string {
  let html = escapeHtml(text);

  // Display math $$...$$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    return renderInlineLatex(tex.trim(), true);
  });

  // Inline math $...$
  html = html.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
    return renderInlineLatex(tex.trim(), false);
  });

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Strikethrough ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return html;
}

function renderInlineLatex(tex: string, displayMode: boolean): string {
  const katex = typeof globalThis !== "undefined" ? (globalThis as any).katex : null;
  if (katex) {
    try {
      return katex.renderToString(tex, { displayMode, throwOnError: false });
    } catch { /* fall through */ }
  }
  const tag = displayMode ? "div" : "span";
  return `<${tag} class="sci-nb-latex-code">${escapeHtml(tex)}</${tag}>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "notebook";
}

function getDefaultCSS(customCSS?: string): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; background: #fff; }
    .sci-nb--export { max-width: 800px; margin: 40px auto; padding: 0 24px; }
    .sci-nb-export-title { font-size: 2em; margin-bottom: 4px; }
    .sci-nb-export-author { color: #666; font-size: 0.95em; }
    .sci-nb-export-date { color: #999; font-size: 0.85em; margin-bottom: 32px; }
    .sci-nb-cell { margin-bottom: 20px; page-break-inside: avoid; }
    .sci-nb-cell--code pre { background: #f4f4f8; border-radius: 6px; padding: 12px 16px; overflow-x: auto; font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace; font-size: 13px; }
    .sci-nb-cell--raw pre { background: #f9f9f9; padding: 12px 16px; border-radius: 6px; font-family: monospace; font-size: 13px; }
    .sci-nb-cell--latex { text-align: center; padding: 16px 0; font-size: 1.1em; overflow-x: auto; }
    .sci-nb-latex-display { text-align: center; padding: 12px 0; overflow-x: auto; }
    .sci-nb-latex-code { font-family: 'KaTeX_Main', 'Times New Roman', serif; font-size: 1.15em; display: inline-block; padding: 4px 8px; background: #f8f8fc; border-radius: 4px; }
    .sci-nb-cell--image { padding: 8px 0; }
    .sci-nb-cell--image img { border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .sci-nb-image-caption { font-size: 0.85em; color: #666; font-style: italic; text-align: center; margin-top: 6px; }
    .sci-nb-cell--embed iframe { border-radius: 6px; }
    .sci-nb-cell--mermaid { text-align: center; padding: 12px 0; }
    .sci-nb-cell--mermaid pre.mermaid { background: none; text-align: center; }
    .sci-nb-cell--mermaid svg { max-width: 100%; height: auto; }
    .sci-nb-cell--table { overflow-x: auto; }
    h1 { font-size: 1.8em; margin: 24px 0 8px; }
    h2 { font-size: 1.4em; margin: 20px 0 6px; }
    h3 { font-size: 1.15em; margin: 16px 0 4px; }
    h4, h5, h6 { font-size: 1em; margin: 12px 0 4px; }
    p { margin-bottom: 8px; }
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f8; font-weight: 600; }
    blockquote { border-left: 3px solid #4a9eff; padding-left: 12px; color: #555; margin: 8px 0; }
    code { background: #f0f0f4; padding: 2px 5px; border-radius: 3px; font-size: 0.9em; font-family: 'Fira Code', 'Consolas', monospace; }
    pre code { background: none; padding: 0; }
    a { color: #228be6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
    del { text-decoration: line-through; color: #999; }
    img { max-width: 100%; height: auto; }
    @media print {
      body { font-size: 11pt; }
      .sci-nb--export { max-width: 100%; margin: 0; padding: 0; }
      .sci-nb-cell { page-break-inside: avoid; }
      .sci-nb-cell--code pre { page-break-inside: avoid; }
      a { color: inherit; text-decoration: underline; }
    }
    ${customCSS || ""}
  `;
}
