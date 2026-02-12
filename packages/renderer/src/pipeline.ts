import type { Cell, Notebook, CellType } from "@velo-sci/notebook-core";
import { MarkdownParser, MarkdownItParser } from "./parser";
import { LRUCache, hashString } from "./cache";
import { highlightCodeTokens } from "./highlighter";
import type Token from "markdown-it/lib/token";

export interface RenderedCell {
  cellId: string;
  html: string;
  renderTime: number;
  cached: boolean;
}

export type ASTTransformer = (tokens: Token[], cell: Cell) => Token[];
export type Preprocessor = (source: string, cell: Cell) => string;
export type PostProcessor = (html: string, cell: Cell) => string;

export interface CellRenderer {
  id: string;
  cellTypes: CellType[];
  renderToHTML?(tokens: Token[], cell: Cell): string | null;
  priority?: number;
}

export class RenderPipeline {
  private preprocessors: Array<{ id: string; fn: Preprocessor; priority: number }> = [];
  private astTransformers: Array<{ id: string; fn: ASTTransformer; priority: number }> = [];
  private renderers: CellRenderer[] = [];
  private postprocessors: Array<{ id: string; fn: PostProcessor; priority: number }> = [];
  private parser: MarkdownParser;
  private cache: LRUCache<string, string>;

  constructor(parser?: MarkdownParser, cacheSize: number = 200) {
    this.parser = parser || new MarkdownItParser();
    this.cache = new LRUCache(cacheSize);

    // Built-in: math rendering postprocessor (runs on markdown cells)
    this.addPostprocessor("builtin:math", (html, cell) => {
      if (cell.type !== "markdown") return html;
      return this.renderMathInHtml(html);
    }, -10);

    // Built-in: code syntax highlighting postprocessor
    this.addPostprocessor("builtin:code-highlight", (html, cell) => {
      if (cell.type === "code") {
        const lang = (cell.metadata.language as string) || "";
        return highlightCodeTokens(cell.source, lang);
      }
      return html;
    }, -5);
  }

  addPreprocessor(id: string, fn: Preprocessor, priority: number = 0): void {
    this.preprocessors.push({ id, fn, priority });
    this.preprocessors.sort((a, b) => b.priority - a.priority);
  }

  addASTTransformer(id: string, fn: ASTTransformer, priority: number = 0): void {
    this.astTransformers.push({ id, fn, priority });
    this.astTransformers.sort((a, b) => b.priority - a.priority);
  }

  addRenderer(renderer: CellRenderer): void {
    this.renderers.push(renderer);
    this.renderers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  addPostprocessor(id: string, fn: PostProcessor, priority: number = 0): void {
    this.postprocessors.push({ id, fn, priority });
    this.postprocessors.sort((a, b) => b.priority - a.priority);
  }

  remove(id: string): void {
    this.preprocessors = this.preprocessors.filter(p => p.id !== id);
    this.astTransformers = this.astTransformers.filter(t => t.id !== id);
    this.renderers = this.renderers.filter(r => r.id !== id);
    this.postprocessors = this.postprocessors.filter(p => p.id !== id);
  }

  invalidateCache(cellId?: string): void {
    if (cellId) {
      // We can't invalidate by cellId directly since cache is content-addressed,
      // but clearing the whole cache is safe (it's just a performance cache)
      this.cache.clear();
    } else {
      this.cache.clear();
    }
  }

  render(cell: Cell): RenderedCell {
    const startTime = performance.now();
    const key = this.getCacheKey(cell);
    const cachedHtml = this.cache.get(key);

    if (cachedHtml) {
      return {
        cellId: cell.id,
        html: cachedHtml,
        renderTime: performance.now() - startTime,
        cached: true,
      };
    }

    let source = cell.source;
    for (const pre of this.preprocessors) {
      source = pre.fn(source, cell);
    }

    let tokens = this.parser.parse(source);
    for (const trans of this.astTransformers) {
      tokens = trans.fn(tokens, cell);
    }

    let html = "";
    let rendered = false;
    for (const renderer of this.renderers) {
      if (renderer.cellTypes.includes(cell.type) && renderer.renderToHTML) {
        const result = renderer.renderToHTML(tokens, cell);
        if (result !== null) {
          html = result;
          rendered = true;
          break;
        }
      }
    }

    if (!rendered) {
      if (cell.type === "markdown") {
        html = this.parser.render(tokens);
      } else if (cell.type === "code") {
        const lang = cell.metadata.language || "";
        const escaped = this.escapeHtml(cell.source);
        html = `<pre class="sci-nb-code"><code class="language-${lang}">${escaped}</code></pre>`;
      } else if (cell.type === "raw") {
        html = `<pre class="sci-nb-raw">${this.escapeHtml(cell.source)}</pre>`;
      } else if (cell.type === "latex") {
        html = this.renderLatexFallback(cell.source);
      } else if (cell.type === "mermaid") {
        html = this.renderMermaidFallback(cell.source);
      } else if (cell.type === "image") {
        html = this.renderImage(cell.source, cell.metadata);
      } else if (cell.type === "embed") {
        html = this.renderEmbed(cell.source, cell.metadata);
      } else if (cell.type === "table") {
        html = this.renderTable(cell.source);
      } else {
        // Unknown type: render as markdown fallback
        html = this.parser.render(tokens);
      }
    }

    for (const post of this.postprocessors) {
      html = post.fn(html, cell);
    }

    this.cache.set(key, html);

    return {
      cellId: cell.id,
      html,
      renderTime: performance.now() - startTime,
      cached: false,
    };
  }

  renderAll(cells: ReadonlyArray<Cell>): RenderedCell[] {
    return cells.map(cell => this.render(cell));
  }

  private getCacheKey(cell: Cell): string {
    return hashString(`${cell.type}:${cell.source}:${JSON.stringify(cell.metadata)}`);
  }

  private renderLatexFallback(source: string): string {
    const cleaned = source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
    if (!cleaned) {
      return '<div class="sci-nb-latex-display"><span class="sci-nb-placeholder">Empty formula</span></div>';
    }
    // Try KaTeX if available globally or via optional import
    if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
      try {
        return `<div class="sci-nb-latex-display">${(globalThis as any).katex.renderToString(cleaned, { displayMode: true, throwOnError: false })}</div>`;
      } catch { /* fall through */ }
    }
    // Fallback: styled code block
    return `<div class="sci-nb-latex-display"><code class="sci-nb-latex-code">${this.escapeHtml(cleaned)}</code></div>`;
  }

  private renderMermaidFallback(source: string): string {
    const trimmed = source.trim();
    if (!trimmed) {
      return '<div class="sci-nb-mermaid-preview"><span class="sci-nb-placeholder">Empty diagram</span></div>';
    }
    // Mermaid v10+ render() is async — we cannot call it synchronously in the pipeline.
    // Instead, output a pending placeholder that adapters will hydrate asynchronously.
    if (typeof globalThis !== "undefined" && (globalThis as any).mermaid) {
      return `<div class="sci-nb-mermaid-preview" data-mermaid-pending="true"><pre class="mermaid">${this.escapeHtml(trimmed)}</pre></div>`;
    }
    // No mermaid library — styled code block fallback
    return `<div class="sci-nb-mermaid-preview"><pre class="sci-nb-code"><code class="language-mermaid">${this.escapeHtml(trimmed)}</code></pre></div>`;
  }

  /**
   * Hydrate all pending mermaid diagrams in a container.
   * Call this after rendering cells into the DOM.
   * Works with mermaid v10+ async render().
   */
  async hydrateMermaid(container: HTMLElement | Document = document): Promise<void> {
    const mermaid = typeof globalThis !== "undefined" ? (globalThis as any).mermaid : null;
    if (!mermaid || typeof mermaid.render !== "function") return;

    const pending = container.querySelectorAll<HTMLElement>('[data-mermaid-pending="true"]');
    for (const el of Array.from(pending)) {
      const pre = el.querySelector("pre.mermaid");
      if (!pre) continue;
      const source = pre.textContent?.trim();
      if (!source) continue;

      const id = `sci-mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const result = await mermaid.render(id, source);
        el.innerHTML = result.svg;
        el.removeAttribute("data-mermaid-pending");
      } catch (e: any) {
        el.innerHTML = `<div class="sci-nb-mermaid-error">Mermaid error: ${e.message || String(e)}</div>`;
        el.removeAttribute("data-mermaid-pending");
        // Clean up temp element mermaid creates on error
        const errEl = document.getElementById(`d${id}`);
        if (errEl) errEl.remove();
      }
    }
  }

  private renderImage(source: string, metadata: Record<string, unknown> = {}): string {
    const src = source || "";
    const alt = (metadata.alt as string) || "";
    const caption = (metadata.caption as string) || "";
    const width = (metadata.width as string) || "100%";
    const align = (metadata.align as string) || "center";

    if (!src) {
      return '<div class="sci-nb-image-empty"><span class="sci-nb-placeholder">Click to add image</span></div>';
    }

    const alignStyle = `text-align:${align}`;
    const widthStyle = `max-width:${width};width:auto;max-height:400px`;

    let html = `<div class="sci-nb-image-view" style="${alignStyle}">`;
    html += `<img src="${this.escapeAttr(src)}" alt="${this.escapeAttr(alt)}" style="${widthStyle}" loading="lazy" />`;
    if (caption) {
      html += `<p class="sci-nb-image-caption">${this.escapeHtml(caption)}</p>`;
    }
    html += `</div>`;
    return html;
  }

  private renderEmbed(source: string, metadata: Record<string, unknown> = {}): string {
    const url = source || "";
    const height = (metadata.height as string) || "400px";
    const sandbox = (metadata.sandbox as string) || "allow-scripts allow-same-origin allow-popups";
    const title = (metadata.title as string) || "";

    if (!url) {
      return '<div class="sci-nb-embed-empty"><span class="sci-nb-placeholder">Click to add embedded content</span></div>';
    }

    const titleAttr = title ? ` title="${this.escapeAttr(title)}"` : "";
    return `<div class="sci-nb-embed-view" style="height:${height}">
      <iframe src="${this.escapeAttr(url)}"${titleAttr} sandbox="${this.escapeAttr(sandbox)}" style="width:100%;height:100%;border:none;border-radius:6px" loading="lazy" allowfullscreen></iframe>
    </div>`;
  }

  private renderTable(source: string): string {
    const lines = source.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) {
      return '<div class="sci-nb-table-empty"><span class="sci-nb-placeholder">Empty table</span></div>';
    }

    const parseLine = (line: string): string[] =>
      line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

    const headers = parseLine(lines[0]);
    const rows = lines.slice(2).filter(l => l.includes("|") && !l.includes("---")).map(parseLine);

    if (headers.length === 0) return "<p>Empty table</p>";

    const ths = headers.map(h => `<th>${this.escapeHtml(h)}</th>`).join("");
    const trs = rows.map(row =>
      `<tr>${row.map(c => `<td>${this.escapeHtml(c)}</td>`).join("")}</tr>`
    ).join("");

    return `<table class="sci-nb-rendered-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  }

  /**
   * Process math expressions in rendered HTML.
   * Handles $$...$$ (display) and $...$ (inline) using KaTeX if available.
   */
  private renderMathInHtml(html: string): string {
    const katex = typeof globalThis !== "undefined" ? (globalThis as any).katex : null;
    if (!katex) return html;

    // Display math: $$...$$ (may appear as <p>$$...$$</p> after markdown rendering)
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
      const cleaned = tex.trim();
      if (!cleaned) return _;
      try {
        return `<div class="sci-nb-latex-display">${katex.renderToString(cleaned, { displayMode: true, throwOnError: false })}</div>`;
      } catch { return _; }
    });

    // Inline math: $...$ (not preceded/followed by $)
    html = html.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (_, tex) => {
      const cleaned = tex.trim();
      if (!cleaned) return _;
      try {
        return katex.renderToString(cleaned, { displayMode: false, throwOnError: false });
      } catch { return _; }
    });

    return html;
  }


  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private escapeAttr(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
