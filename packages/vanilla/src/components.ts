/**
 * DOM-based components for Vanilla adapter.
 * These are imperative classes that create and manage DOM elements,
 * matching the functionality of @velo-sci/notebook-react components.
 */

import type { EditorEngine, CellType, Cell, CellOutput as ICellOutput } from "@velo-sci/notebook-core";
import { MATH_CATEGORIES, type MathBlock } from "./math-categories";

// ── Helpers ──

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mkEl(tag: string, cls?: string, attrs?: Record<string, string>): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

// ── FloatingToolbar ──

const FORMAT_ACTIONS = [
  { label: "B", title: "Bold (Ctrl+B)", wrap: ["**", "**"], prefix: "" },
  { label: "I", title: "Italic (Ctrl+I)", wrap: ["*", "*"], prefix: "" },
  { label: "S", title: "Strikethrough", wrap: ["~~", "~~"], prefix: "" },
  { label: "<>", title: "Inline code", wrap: ["`", "`"], prefix: "" },
  { label: "H1", title: "Heading 1", wrap: null, prefix: "# " },
  { label: "H2", title: "Heading 2", wrap: null, prefix: "## " },
  { label: "\u{1F517}", title: "Link", wrap: ["[", "](url)"], prefix: "" },
  { label: "\u2022", title: "Bullet list", wrap: null, prefix: "- " },
];

export class FloatingToolbar {
  private el: HTMLDivElement;
  private cleanups: Array<() => void> = [];

  constructor(
    private engine: EditorEngine,
    private cellId: string,
    private textarea: HTMLTextAreaElement,
  ) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-floating-toolbar";
    this.el.style.cssText = "position:fixed;transform:translateX(-50%);display:none";
    this.el.onmousedown = (e) => e.preventDefault();

    for (const action of FORMAT_ACTIONS) {
      const btn = document.createElement("button");
      btn.className = "sci-nb-ft-btn";
      btn.title = action.title;
      btn.textContent = action.label;
      btn.onclick = () => this.applyFormat(action);
      this.el.appendChild(btn);
    }

    document.body.appendChild(this.el);
    this.bind();
  }

  private bind() {
    const update = () => requestAnimationFrame(() => this.updatePosition());
    this.textarea.addEventListener("select", update);
    this.textarea.addEventListener("mouseup", update);
    this.textarea.addEventListener("keyup", update);
    const onMouseDown = (e: MouseEvent) => {
      if (!this.el.contains(e.target as Node) && e.target !== this.textarea) {
        this.el.style.display = "none";
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    this.cleanups.push(
      () => this.textarea.removeEventListener("select", update),
      () => this.textarea.removeEventListener("mouseup", update),
      () => this.textarea.removeEventListener("keyup", update),
      () => document.removeEventListener("mousedown", onMouseDown),
    );
  }

  private updatePosition() {
    const ta = this.textarea;
    if (ta.selectionStart === ta.selectionEnd) {
      this.el.style.display = "none";
      return;
    }
    const r = ta.getBoundingClientRect();
    this.el.style.top = `${r.top - 44}px`;
    this.el.style.left = `${r.left + r.width / 2}px`;
    this.el.style.display = "";
  }

  private applyFormat(action: typeof FORMAT_ACTIONS[number]) {
    const ta = this.textarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const src = ta.value;
    const selected = src.slice(start, end);
    let newSrc: string, ns: number, ne: number;

    if (action.wrap) {
      const [b, a] = action.wrap;
      newSrc = src.slice(0, start) + b + selected + a + src.slice(end);
      ns = start + b.length; ne = end + b.length;
    } else if (action.prefix) {
      const ls = src.lastIndexOf("\n", start - 1) + 1;
      const le = src.indexOf("\n", end);
      const ae = le === -1 ? src.length : le;
      const lines = src.slice(ls, ae).split("\n");
      const prefixed = lines.map(l => action.prefix + l).join("\n");
      newSrc = src.slice(0, ls) + prefixed + src.slice(ae);
      ns = start + action.prefix.length; ne = end + action.prefix.length * lines.length;
    } else return;

    this.engine.updateCellSource(this.cellId, newSrc);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(ns, ne); });
  }

  destroy() {
    for (const c of this.cleanups) c();
    this.el.remove();
  }
}

// ── SlashCommand ──

export interface SlashCommandItem {
  type: CellType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
}

export const DEFAULT_COMMANDS: SlashCommandItem[] = [
  { type: "markdown", label: "Text", description: "Markdown formatted text block", icon: "M", keywords: ["text", "markdown", "paragraph"] },
  { type: "code", label: "Code", description: "Code block with syntax highlighting", icon: "</>", keywords: ["code", "script", "program"] },
  { type: "latex", label: "Formula", description: "Visual LaTeX formula editor", icon: "∑", keywords: ["latex", "math", "formula", "equation"] },
  { type: "image", label: "Image", description: "Image with drag & drop, URL, caption", icon: "\u{1F5BC}", keywords: ["image", "picture", "photo", "img"] },
  { type: "embed", label: "Embed", description: "YouTube, CodePen, Desmos, iframe", icon: "⧉", keywords: ["embed", "iframe", "youtube", "video", "codepen"] },
  { type: "table", label: "Table", description: "Editable table with rows and columns", icon: "▦", keywords: ["table", "grid", "spreadsheet"] },
  { type: "mermaid", label: "Diagram", description: "Mermaid diagram (flowchart, sequence, etc.)", icon: "◇", keywords: ["mermaid", "diagram", "flowchart", "chart"] },
  { type: "raw", label: "Raw", description: "Plain unformatted text", icon: "T", keywords: ["raw", "plain", "text"] },
];

export class SlashCommandMenu {
  private el: HTMLDivElement;
  private selectedIndex = 0;
  private filtered: SlashCommandItem[] = [];
  private cleanups: Array<() => void> = [];

  constructor(
    private position: { top: number; left: number },
    private query: string,
    private onSelect: (type: CellType) => void,
    private onClose: () => void,
    private extraCommands?: SlashCommandItem[],
  ) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-slash-menu";
    this.el.style.top = `${position.top}px`;
    this.el.style.left = `${position.left}px`;
    document.body.appendChild(this.el);
    this.updateFilter(query);
    this.bind();
  }

  updateFilter(query: string) {
    this.query = query;
    this.selectedIndex = 0;
    const all = this.extraCommands ? [...DEFAULT_COMMANDS, ...this.extraCommands] : DEFAULT_COMMANDS;
    this.filtered = query
      ? all.filter(cmd => {
          const q = query.toLowerCase();
          return cmd.label.toLowerCase().includes(q) || cmd.type.toLowerCase().includes(q) || cmd.keywords.some(k => k.includes(q));
        })
      : all;
    this.render();
  }

  private render() {
    this.el.innerHTML = "";
    if (this.filtered.length === 0) {
      this.el.innerHTML = `<div class="sci-nb-slash-empty">No results for "/${escapeHtml(this.query)}"</div>`;
      return;
    }
    const header = mkEl("div", "sci-nb-slash-header");
    header.textContent = "Insert block";
    this.el.appendChild(header);
    this.filtered.forEach((cmd, i) => {
      const btn = mkEl("button", `sci-nb-slash-item${i === this.selectedIndex ? " sci-nb-slash-item--active" : ""}`);
      btn.innerHTML = `<span class="sci-nb-slash-icon">${escapeHtml(cmd.icon)}</span><div class="sci-nb-slash-text"><span class="sci-nb-slash-label">${escapeHtml(cmd.label)}</span><span class="sci-nb-slash-desc">${escapeHtml(cmd.description)}</span></div>`;
      btn.onmouseenter = () => { this.selectedIndex = i; this.render(); };
      btn.onclick = () => this.onSelect(cmd.type);
      this.el.appendChild(btn);
    });
  }

  private bind() {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); this.selectedIndex = (this.selectedIndex + 1) % Math.max(this.filtered.length, 1); this.render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); this.selectedIndex = (this.selectedIndex - 1 + this.filtered.length) % Math.max(this.filtered.length, 1); this.render(); }
      else if (e.key === "Enter" && this.filtered.length > 0) { e.preventDefault(); this.onSelect(this.filtered[this.selectedIndex]?.type || "markdown"); }
      else if (e.key === "Escape") { e.preventDefault(); this.onClose(); }
    };
    const handleClick = (e: MouseEvent) => {
      if (!this.el.contains(e.target as Node)) this.onClose();
    };
    document.addEventListener("keydown", handleKey, true);
    document.addEventListener("mousedown", handleClick);
    this.cleanups.push(
      () => document.removeEventListener("keydown", handleKey, true),
      () => document.removeEventListener("mousedown", handleClick),
    );
  }

  destroy() {
    for (const c of this.cleanups) c();
    this.el.remove();
  }
}

// ── TOCSidebar ──

export interface TOCItem {
  cellId: string;
  level: number;
  text: string;
}

export function buildTOCItems(engine: EditorEngine): TOCItem[] {
  const result: TOCItem[] = [];
  for (const cell of engine.getCells()) {
    if (cell.type !== "markdown") continue;
    for (const line of cell.source.split("\n")) {
      const match = line.match(/^(#{1,3})\s+(.+)/);
      if (match) {
        result.push({ cellId: cell.id, level: match[1].length, text: match[2].replace(/[*_`~#]/g, "").trim() });
      }
    }
  }
  return result;
}

export function createTOCSidebar(engine: EditorEngine, container: HTMLElement, focusedCellId?: string | null): HTMLElement {
  const nav = mkEl("nav", "sci-nb-toc");
  const title = mkEl("div", "sci-nb-toc-title");
  title.textContent = "Contenido";
  nav.appendChild(title);

  const items = buildTOCItems(engine);
  for (const item of items) {
    const btn = document.createElement("button");
    btn.className = `sci-nb-toc-item sci-nb-toc-item--h${item.level}${item.cellId === focusedCellId ? " sci-nb-toc-item--active" : ""}`;
    btn.textContent = item.text;
    btn.title = item.text;
    btn.onclick = () => {
      engine.focusCell(item.cellId);
      engine.setEditMode(item.cellId);
      const cellEl = container.querySelector(`[data-cell-id="${item.cellId}"]`);
      cellEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    nav.appendChild(btn);
  }
  return nav;
}

// ── FindReplace ──

export interface FindMatch {
  cellId: string;
  index: number;
  length: number;
}

export class FindReplaceBar {
  private el: HTMLDivElement;
  private query = "";
  private replacement = "";
  private caseSensitive = false;
  private showReplace = false;
  private matches: FindMatch[] = [];
  private currentIdx = 0;
  private inputEl!: HTMLInputElement;

  constructor(
    private engine: EditorEngine,
    private container: HTMLElement,
    private onClose: () => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-find-bar";
    this.render();
    container.prepend(this.el);
    requestAnimationFrame(() => this.inputEl?.focus());
  }

  private search() {
    this.matches = [];
    if (!this.query) return;
    const q = this.caseSensitive ? this.query : this.query.toLowerCase();
    const nb = this.engine.getNotebook();
    for (const cell of nb.cells) {
      const src = this.caseSensitive ? cell.source : cell.source.toLowerCase();
      let pos = 0;
      while (true) {
        const idx = src.indexOf(q, pos);
        if (idx === -1) break;
        this.matches.push({ cellId: cell.id, index: idx, length: this.query.length });
        pos = idx + 1;
      }
    }
    this.currentIdx = 0;
  }

  private navigateToMatch(match: FindMatch) {
    this.engine.focusCell(match.cellId);
    const cellEl = this.container.querySelector(`[data-cell-id="${match.cellId}"]`);
    cellEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  private goNext() {
    if (this.matches.length === 0) return;
    this.currentIdx = (this.currentIdx + 1) % this.matches.length;
    this.navigateToMatch(this.matches[this.currentIdx]);
    this.render();
  }

  private goPrev() {
    if (this.matches.length === 0) return;
    this.currentIdx = (this.currentIdx - 1 + this.matches.length) % this.matches.length;
    this.navigateToMatch(this.matches[this.currentIdx]);
    this.render();
  }

  private replaceCurrent() {
    if (this.matches.length === 0) return;
    const match = this.matches[this.currentIdx];
    const nb = this.engine.getNotebook();
    const cell = nb.cells.find(c => c.id === match.cellId);
    if (!cell) return;
    const newSrc = cell.source.slice(0, match.index) + this.replacement + cell.source.slice(match.index + match.length);
    this.engine.updateCellSource(match.cellId, newSrc);
    this.search();
    this.render();
  }

  private replaceAll() {
    if (this.matches.length === 0) return;
    const nb = this.engine.getNotebook();
    const byCellId = new Map<string, FindMatch[]>();
    for (const m of this.matches) {
      const arr = byCellId.get(m.cellId) || [];
      arr.push(m);
      byCellId.set(m.cellId, arr);
    }
    for (const [cellId, cellMatches] of byCellId) {
      const cell = nb.cells.find(c => c.id === cellId);
      if (!cell) continue;
      let src = cell.source;
      for (let i = cellMatches.length - 1; i >= 0; i--) {
        const m = cellMatches[i];
        src = src.slice(0, m.index) + this.replacement + src.slice(m.index + m.length);
      }
      this.engine.updateCellSource(cellId, src);
    }
    this.search();
    this.render();
  }

  private render() {
    this.el.innerHTML = "";
    const input = document.createElement("input");
    input.type = "text"; input.value = this.query; input.placeholder = "Search...";
    input.oninput = () => { this.query = input.value; this.search(); this.render(); };
    this.inputEl = input;
    this.el.appendChild(input);

    const count = mkEl("span", "sci-nb-find-count");
    count.textContent = this.matches.length > 0 ? `${this.currentIdx + 1}/${this.matches.length}` : this.query ? "0" : "";
    this.el.appendChild(count);

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "▲"; prevBtn.title = "Previous"; prevBtn.onclick = () => this.goPrev();
    this.el.appendChild(prevBtn);

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "▼"; nextBtn.title = "Next"; nextBtn.onclick = () => this.goNext();
    this.el.appendChild(nextBtn);

    const csBtn = document.createElement("button");
    csBtn.textContent = "Aa"; csBtn.title = "Case sensitive";
    csBtn.style.fontWeight = this.caseSensitive ? "700" : "400";
    csBtn.onclick = () => { this.caseSensitive = !this.caseSensitive; this.search(); this.render(); };
    this.el.appendChild(csBtn);

    const replBtn = document.createElement("button");
    replBtn.textContent = `${this.showReplace ? "▾" : "▸"} Replace`;
    replBtn.onclick = () => { this.showReplace = !this.showReplace; this.render(); };
    this.el.appendChild(replBtn);

    if (this.showReplace) {
      const replInput = document.createElement("input");
      replInput.type = "text"; replInput.value = this.replacement;
      replInput.placeholder = "Replace with...";
      replInput.oninput = () => { this.replacement = replInput.value; };
      this.el.appendChild(replInput);

      const r1 = document.createElement("button");
      r1.textContent = "1"; r1.title = "Replace current"; r1.onclick = () => this.replaceCurrent();
      this.el.appendChild(r1);

      const rAll = document.createElement("button");
      rAll.textContent = "∀"; rAll.title = "Replace all"; rAll.onclick = () => this.replaceAll();
      this.el.appendChild(rAll);
    }

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕"; closeBtn.title = "Close"; closeBtn.onclick = () => this.onClose();
    this.el.appendChild(closeBtn);

    this.el.onkeydown = (e) => {
      if (e.key === "Escape") { e.preventDefault(); this.onClose(); }
      else if (e.key === "Enter") { e.preventDefault(); e.shiftKey ? this.goPrev() : this.goNext(); }
    };
  }

  destroy() { this.el.remove(); }
}

// ── CellOutput ──

export function renderCellOutput(output: ICellOutput): string {
  switch (output.outputType) {
    case "stream":
      return `<pre class="sci-nb-output-stream sci-nb-output-stream--${escapeAttr(output.name || "stdout")}">${escapeHtml(output.text || "")}</pre>`;
    case "display": {
      if (output.data["text/html"]) return `<div class="sci-nb-output-html">${output.data["text/html"]}</div>`;
      if (output.data["image/svg+xml"]) return `<div class="sci-nb-output-svg">${output.data["image/svg+xml"]}</div>`;
      if (output.data["image/png"]) return `<img class="sci-nb-output-image" src="data:image/png;base64,${output.data["image/png"]}" alt="Output" />`;
      if (output.data["image/jpeg"]) return `<img class="sci-nb-output-image" src="data:image/jpeg;base64,${output.data["image/jpeg"]}" alt="Output" />`;
      if (output.data["application/json"]) return `<pre class="sci-nb-output-json">${escapeHtml(JSON.stringify(JSON.parse(output.data["application/json"]), null, 2))}</pre>`;
      if (output.data["text/plain"]) return `<pre class="sci-nb-output-text">${escapeHtml(output.data["text/plain"])}</pre>`;
      return `<pre class="sci-nb-output-text">[Display output]</pre>`;
    }
    case "error":
      return `<div class="sci-nb-output-error"><strong class="sci-nb-output-error-name">${escapeHtml(output.name || "Error")}: </strong><span class="sci-nb-output-error-msg">${escapeHtml(output.message || "")}</span>${output.traceback?.length ? `<pre class="sci-nb-output-traceback">${escapeHtml(output.traceback.join("\n"))}</pre>` : ""}</div>`;
    default:
      return "";
  }
}

export function renderCellOutputs(outputs: ICellOutput[]): string {
  if (!outputs || outputs.length === 0) return "";
  return `<div class="sci-nb-cell-outputs">${outputs.map(o => `<div class="sci-nb-output sci-nb-output--${o.outputType}">${renderCellOutput(o)}</div>`).join("")}</div>`;
}

// ── ImageCell ──

interface ImageData {
  src: string; alt: string; caption: string; width: string; align: "left" | "center" | "right";
}

function parseImageSource(source: string, metadata: Record<string, unknown>): ImageData {
  return {
    src: source || "", alt: (metadata.alt as string) || "",
    caption: (metadata.caption as string) || "",
    width: (metadata.width as string) || "100%",
    align: (metadata.align as "left" | "center" | "right") || "center",
  };
}

export function renderImagePreview(source: string, metadata: Record<string, unknown>): string {
  const d = parseImageSource(source, metadata);
  if (!d.src) return '<div class="sci-nb-image-empty"><span class="sci-nb-placeholder">Click to add image</span></div>';
  let html = `<div class="sci-nb-image-view" style="text-align:${d.align}">`;
  html += `<img src="${escapeAttr(d.src)}" alt="${escapeAttr(d.alt)}" style="max-width:${d.width};width:auto;max-height:400px" />`;
  if (d.caption) html += `<p class="sci-nb-image-caption">${escapeHtml(d.caption)}</p>`;
  return html + "</div>";
}

// ── EmbedCell ──

interface EmbedData { url: string; height: string; sandbox: string; title: string; }

function parseEmbedSource(source: string, metadata: Record<string, unknown>): EmbedData {
  return {
    url: source || "", height: (metadata.height as string) || "400px",
    sandbox: (metadata.sandbox as string) || "allow-scripts allow-same-origin allow-popups",
    title: (metadata.title as string) || "",
  };
}

export function renderEmbedPreview(source: string, metadata: Record<string, unknown>): string {
  const d = parseEmbedSource(source, metadata);
  if (!d.url) return '<div class="sci-nb-embed-empty"><span class="sci-nb-placeholder">Click to add embedded content</span></div>';
  const t = d.title ? ` title="${escapeAttr(d.title)}"` : "";
  return `<div class="sci-nb-embed-view" style="height:${d.height}"><iframe src="${escapeAttr(d.url)}"${t} sandbox="${escapeAttr(d.sandbox)}" style="width:100%;height:100%;border:none;border-radius:6px" loading="lazy" allowfullscreen></iframe></div>`;
}

// ── TableCell ──

interface TableData { headers: string[]; rows: string[][]; }

function parseMarkdownTable(source: string): TableData {
  const lines = source.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return { headers: ["Col 1", "Col 2", "Col 3"], rows: [["", "", ""], ["", "", ""]] };
  const parseLine = (line: string): string[] => line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
  const headers = parseLine(lines[0]);
  const rows = lines.slice(2).map(parseLine);
  const colCount = headers.length;
  const normalizedRows = rows.map(row => { while (row.length < colCount) row.push(""); return row.slice(0, colCount); });
  if (normalizedRows.length === 0) normalizedRows.push(new Array(colCount).fill(""));
  return { headers, rows: normalizedRows };
}

export function renderTablePreview(source: string): string {
  const d = parseMarkdownTable(source);
  if (d.headers.length === 0) return "<p>Empty table</p>";
  const ths = d.headers.map(h => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = d.rows.map(row => `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
  return `<table class="sci-nb-rendered-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

// ── MermaidCell ──

let mermaidIdCounter = 0;

export async function renderMermaidToSvg(source: string): Promise<{ svg?: string; error?: string }> {
  const trimmed = source.trim();
  if (!trimmed) return {};
  const mermaid = (globalThis as any).mermaid;
  if (!mermaid) return {};
  const id = `sci-mermaid-${++mermaidIdCounter}`;
  try {
    const result = await mermaid.render(id, trimmed);
    return { svg: result.svg };
  } catch (e: any) {
    const errEl = document.getElementById(`d${id}`);
    if (errEl) errEl.remove();
    return { error: e.message || String(e) };
  }
}

export function initMermaid(mermaidLib: any, config?: Record<string, unknown>): void {
  (globalThis as any).mermaid = mermaidLib;
  mermaidLib.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose", ...config });
}

// ── LatexAutocomplete ──

export const LATEX_COMMANDS: Array<{ cmd: string; desc: string; category: string }> = [
  { cmd: "\\frac{}{}", desc: "Fracción", category: "struct" },
  { cmd: "\\sqrt{}", desc: "Raíz cuadrada", category: "struct" },
  { cmd: "\\int", desc: "Integral", category: "calc" },
  { cmd: "\\int_{}^{}", desc: "Integral definida", category: "calc" },
  { cmd: "\\sum_{}^{}", desc: "Sumatoria", category: "calc" },
  { cmd: "\\alpha", desc: "α", category: "greek" },
  { cmd: "\\beta", desc: "β", category: "greek" },
  { cmd: "\\gamma", desc: "γ", category: "greek" },
  { cmd: "\\delta", desc: "δ", category: "greek" },
  { cmd: "\\theta", desc: "θ", category: "greek" },
  { cmd: "\\lambda", desc: "λ", category: "greek" },
  { cmd: "\\pi", desc: "π", category: "greek" },
  { cmd: "\\sigma", desc: "σ", category: "greek" },
  { cmd: "\\omega", desc: "ω", category: "greek" },
  { cmd: "\\pm", desc: "±", category: "op" },
  { cmd: "\\times", desc: "×", category: "op" },
  { cmd: "\\div", desc: "÷", category: "op" },
  { cmd: "\\leq", desc: "≤", category: "op" },
  { cmd: "\\geq", desc: "≥", category: "op" },
  { cmd: "\\neq", desc: "≠", category: "op" },
  { cmd: "\\approx", desc: "≈", category: "op" },
  { cmd: "\\infty", desc: "∞", category: "op" },
  { cmd: "\\partial", desc: "∂", category: "op" },
  { cmd: "\\nabla", desc: "∇", category: "op" },
  { cmd: "\\rightarrow", desc: "→", category: "arrow" },
  { cmd: "\\Rightarrow", desc: "⇒", category: "arrow" },
  { cmd: "\\sin", desc: "sin", category: "func" },
  { cmd: "\\cos", desc: "cos", category: "func" },
  { cmd: "\\log", desc: "log", category: "func" },
  { cmd: "\\ln", desc: "ln", category: "func" },
  { cmd: "\\text{}", desc: "Texto", category: "misc" },
  { cmd: "\\mathbb{}", desc: "Blackboard bold", category: "misc" },
];

export class LatexAutocompleteMenu {
  private el: HTMLDivElement;
  private selectedIndex = 0;
  private filtered: typeof LATEX_COMMANDS = [];
  private cleanups: Array<() => void> = [];

  constructor(
    private position: { top: number; left: number },
    private query: string,
    private onSelect: (cmd: string) => void,
    private onClose: () => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-slash-menu";
    this.el.style.cssText = `top:${position.top}px;left:${position.left}px;min-width:220px`;
    document.body.appendChild(this.el);
    this.updateFilter(query);
    this.bind();
  }

  updateFilter(query: string) {
    this.query = query;
    this.selectedIndex = 0;
    const q = query.toLowerCase();
    this.filtered = q
      ? LATEX_COMMANDS.filter(c => c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)).slice(0, 10)
      : LATEX_COMMANDS.slice(0, 12);
    this.render();
  }

  private render() {
    this.el.innerHTML = "";
    if (this.filtered.length === 0) return;
    this.filtered.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.className = `sci-nb-slash-item${i === this.selectedIndex ? " sci-nb-slash-item--active" : ""}`;
      btn.innerHTML = `<span class="sci-nb-slash-icon" style="font-family:monospace;font-size:11px">${item.desc.length <= 2 ? escapeHtml(item.desc) : escapeHtml(item.cmd.slice(0, 4))}</span><div class="sci-nb-slash-text"><span class="sci-nb-slash-label" style="font-family:monospace;font-size:12px">${escapeHtml(item.cmd)}</span><span class="sci-nb-slash-desc">${escapeHtml(item.desc)}</span></div>`;
      btn.onmouseenter = () => { this.selectedIndex = i; this.render(); };
      btn.onclick = () => this.onSelect(item.cmd);
      this.el.appendChild(btn);
    });
  }

  private bind() {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); this.selectedIndex = (this.selectedIndex + 1) % Math.max(this.filtered.length, 1); this.render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); this.selectedIndex = (this.selectedIndex - 1 + this.filtered.length) % Math.max(this.filtered.length, 1); this.render(); }
      else if (e.key === "Enter" || e.key === "Tab") { if (this.filtered.length > 0) { e.preventDefault(); e.stopPropagation(); this.onSelect(this.filtered[this.selectedIndex]?.cmd || ""); } }
      else if (e.key === "Escape") { e.preventDefault(); this.onClose(); }
    };
    document.addEventListener("keydown", handleKey, true);
    this.cleanups.push(() => document.removeEventListener("keydown", handleKey, true));
  }

  destroy() {
    for (const c of this.cleanups) c();
    this.el.remove();
  }
}

// ── ChatSidebar ──

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  cellRefs?: string[];
}

export class ChatSidebarPanel {
  private el: HTMLDivElement;
  private messages: ChatMessage[] = [];
  private loading = false;
  private inputEl!: HTMLInputElement;

  constructor(
    private container: HTMLElement,
    private onSend?: (message: string, history: ChatMessage[]) => Promise<string>,
    private onApply?: (content: string) => void,
    private onClose?: () => void,
    systemPrompt?: string,
  ) {
    if (systemPrompt) this.messages.push({ role: "system", content: systemPrompt, timestamp: Date.now() });
    this.el = document.createElement("div");
    this.el.className = "sci-nb-chat-sidebar";
    container.appendChild(this.el);
    this.render();
    requestAnimationFrame(() => this.inputEl?.focus());
  }

  private async handleSend() {
    const text = this.inputEl.value.trim();
    if (!text || this.loading) return;
    this.messages.push({ role: "user", content: text, timestamp: Date.now() });
    this.inputEl.value = "";
    this.loading = true;
    this.render();
    try {
      if (this.onSend) {
        const response = await this.onSend(text, this.messages);
        this.messages.push({ role: "assistant", content: response, timestamp: Date.now() });
      } else {
        this.messages.push({ role: "assistant", content: "No AI provider configured.", timestamp: Date.now() });
      }
    } catch (e: any) {
      this.messages.push({ role: "assistant", content: `Error: ${e.message || "Failed"}`, timestamp: Date.now() });
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private render() {
    this.el.innerHTML = "";
    const header = mkEl("div", "sci-nb-chat-header");
    header.innerHTML = "<span>AI Assistant</span>";
    if (this.onClose) {
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.style.cssText = "border:none;background:transparent;cursor:pointer;font-size:16px";
      closeBtn.onclick = () => this.onClose!();
      header.appendChild(closeBtn);
    }
    this.el.appendChild(header);

    const msgsDiv = mkEl("div", "sci-nb-chat-messages");
    const visible = this.messages.filter(m => m.role !== "system");
    if (visible.length === 0) {
      msgsDiv.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:24px">Ask me anything about your notebook...</div>';
    } else {
      for (const msg of visible) {
        const msgEl = mkEl("div", `sci-nb-chat-msg sci-nb-chat-msg--${msg.role}`);
        msgEl.innerHTML = `<div>${escapeHtml(msg.content)}</div>`;
        if (msg.role === "assistant" && this.onApply) {
          const applyBtn = document.createElement("button");
          applyBtn.textContent = "Apply to cell";
          applyBtn.style.cssText = "margin-top:4px;font-size:11px;padding:2px 6px;border:1px solid #e2e8f0;border-radius:4px;background:transparent;cursor:pointer";
          applyBtn.onclick = () => this.onApply!(msg.content);
          msgEl.appendChild(applyBtn);
        }
        msgsDiv.appendChild(msgEl);
      }
    }
    if (this.loading) {
      const loadEl = mkEl("div", "sci-nb-chat-msg sci-nb-chat-msg--assistant");
      loadEl.style.opacity = "0.6";
      loadEl.textContent = "Thinking...";
      msgsDiv.appendChild(loadEl);
    }
    this.el.appendChild(msgsDiv);

    const inputDiv = mkEl("div", "sci-nb-chat-input");
    const input = document.createElement("input");
    input.type = "text"; input.placeholder = "Ask something..."; input.disabled = this.loading;
    input.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.handleSend(); } };
    this.inputEl = input;
    inputDiv.appendChild(input);
    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Send"; sendBtn.disabled = this.loading;
    sendBtn.onclick = () => this.handleSend();
    inputDiv.appendChild(sendBtn);
    this.el.appendChild(inputDiv);
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
  }

  destroy() { this.el.remove(); }
}

// ── AIRewrite ──

export interface AIRewriteOptions {
  selectedText: string;
  position: { top: number; left: number };
  onRewrite: (instruction: string, selectedText: string) => Promise<string>;
  onAccept: (newText: string) => void;
  onReject: () => void;
}

export class AIRewritePanel {
  private el: HTMLDivElement;
  private state: "prompt" | "loading" | "preview" = "prompt";
  private instruction = "";
  private result = "";
  private error: string | null = null;

  constructor(private opts: AIRewriteOptions) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-ai-rewrite";
    this.el.style.cssText = `position:absolute;top:${opts.position.top}px;left:${opts.position.left}px;z-index:100`;
    document.body.appendChild(this.el);
    this.render();
  }

  private async handleSubmit() {
    if (!this.instruction.trim()) return;
    this.state = "loading"; this.error = null; this.render();
    try {
      this.result = await this.opts.onRewrite(this.instruction, this.opts.selectedText);
      this.state = "preview";
    } catch (e: any) {
      this.error = e.message || "Rewrite failed";
      this.state = "prompt";
    }
    this.render();
  }

  private render() {
    this.el.innerHTML = "";
    if (this.state === "prompt") {
      const div = mkEl("div", "sci-nb-ai-rewrite-prompt");
      div.innerHTML = `<div class="sci-nb-ai-rewrite-selected"><span class="sci-nb-ai-rewrite-label">Selected:</span><span class="sci-nb-ai-rewrite-text">${escapeHtml(this.opts.selectedText.length > 80 ? this.opts.selectedText.slice(0, 80) + "..." : this.opts.selectedText)}</span></div>`;
      const row = mkEl("div", "sci-nb-ai-rewrite-input-row");
      const input = document.createElement("input");
      input.type = "text"; input.className = "sci-nb-ai-rewrite-input";
      input.placeholder = "How should I rewrite this?"; input.value = this.instruction;
      input.oninput = () => { this.instruction = input.value; };
      input.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.handleSubmit(); }
        else if (e.key === "Escape") { e.preventDefault(); this.opts.onReject(); }
      };
      row.appendChild(input);
      const submitBtn = document.createElement("button");
      submitBtn.className = "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary";
      submitBtn.textContent = "Rewrite"; submitBtn.onclick = () => this.handleSubmit();
      row.appendChild(submitBtn);
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "sci-nb-ai-rewrite-btn";
      cancelBtn.textContent = "Cancel"; cancelBtn.onclick = () => this.opts.onReject();
      row.appendChild(cancelBtn);
      div.appendChild(row);
      if (this.error) { const errEl = mkEl("div", "sci-nb-ai-rewrite-error"); errEl.textContent = this.error; div.appendChild(errEl); }
      this.el.appendChild(div);
      requestAnimationFrame(() => input.focus());
    } else if (this.state === "loading") {
      this.el.innerHTML = '<div class="sci-nb-ai-rewrite-loading"><span>Rewriting...</span></div>';
    } else {
      const div = mkEl("div", "sci-nb-ai-rewrite-preview");
      div.innerHTML = `<div class="sci-nb-ai-rewrite-diff"><div class="sci-nb-ai-rewrite-diff-old"><span class="sci-nb-ai-rewrite-diff-label">Original:</span><pre>${escapeHtml(this.opts.selectedText)}</pre></div><div class="sci-nb-ai-rewrite-diff-new"><span class="sci-nb-ai-rewrite-diff-label">Rewritten:</span><pre>${escapeHtml(this.result)}</pre></div></div>`;
      const actions = mkEl("div", "sci-nb-ai-rewrite-actions");
      const acceptBtn = document.createElement("button");
      acceptBtn.className = "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary";
      acceptBtn.textContent = "Accept"; acceptBtn.onclick = () => this.opts.onAccept(this.result);
      actions.appendChild(acceptBtn);
      const retryBtn = document.createElement("button");
      retryBtn.className = "sci-nb-ai-rewrite-btn";
      retryBtn.textContent = "Retry"; retryBtn.onclick = () => { this.state = "prompt"; this.result = ""; this.render(); };
      actions.appendChild(retryBtn);
      const rejectBtn = document.createElement("button");
      rejectBtn.className = "sci-nb-ai-rewrite-btn";
      rejectBtn.textContent = "Reject"; rejectBtn.onclick = () => this.opts.onReject();
      actions.appendChild(rejectBtn);
      div.appendChild(actions);
      this.el.appendChild(div);
    }
  }

  destroy() { this.el.remove(); }
}

// ── AICellGenerate ──

export interface GeneratedCell {
  type: CellType;
  source: string;
}

export interface AICellGenerateOptions {
  onGenerate: (prompt: string) => Promise<GeneratedCell[]>;
  onAccept: (cells: GeneratedCell[]) => void;
  onCancel: () => void;
  insertIndex: number;
}

const CELL_TYPE_LABELS: Record<string, string> = {
  markdown: "Markdown", code: "Code", latex: "LaTeX", table: "Table", mermaid: "Mermaid", raw: "Raw",
};

export class AICellGeneratePanel {
  private el: HTMLDivElement;
  private state: "prompt" | "loading" | "preview" = "prompt";
  private prompt = "";
  private cells: GeneratedCell[] = [];
  private error: string | null = null;

  constructor(private container: HTMLElement, private opts: AICellGenerateOptions) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-ai-generate";
    container.appendChild(this.el);
    this.render();
  }

  private async handleGenerate() {
    if (!this.prompt.trim()) return;
    this.state = "loading"; this.error = null; this.render();
    try {
      this.cells = await this.opts.onGenerate(this.prompt);
      this.state = "preview";
    } catch (e: any) {
      this.error = e.message || "Generation failed";
      this.state = "prompt";
    }
    this.render();
  }

  private render() {
    this.el.innerHTML = "";
    if (this.state === "prompt") {
      const div = mkEl("div", "sci-nb-ai-generate-prompt");
      div.innerHTML = '<div class="sci-nb-ai-generate-header"><span>Generate cells with AI</span></div>';
      const ta = document.createElement("textarea");
      ta.className = "sci-nb-ai-generate-textarea"; ta.rows = 3; ta.value = this.prompt;
      ta.placeholder = "Describe what you want to generate...";
      ta.oninput = () => { this.prompt = ta.value; };
      ta.onkeydown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.handleGenerate(); }
        else if (e.key === "Escape") { e.preventDefault(); this.opts.onCancel(); }
      };
      div.appendChild(ta);
      const actions = mkEl("div", "sci-nb-ai-generate-actions");
      const genBtn = document.createElement("button");
      genBtn.className = "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary";
      genBtn.textContent = "Generate (Ctrl+Enter)"; genBtn.onclick = () => this.handleGenerate();
      actions.appendChild(genBtn);
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "sci-nb-ai-rewrite-btn";
      cancelBtn.textContent = "Cancel"; cancelBtn.onclick = () => this.opts.onCancel();
      actions.appendChild(cancelBtn);
      div.appendChild(actions);
      if (this.error) { const errEl = mkEl("div", "sci-nb-ai-rewrite-error"); errEl.textContent = this.error; div.appendChild(errEl); }
      this.el.appendChild(div);
      requestAnimationFrame(() => ta.focus());
    } else if (this.state === "loading") {
      this.el.innerHTML = '<div class="sci-nb-ai-generate-loading"><span>Generating cells...</span></div>';
    } else {
      const div = mkEl("div", "sci-nb-ai-generate-preview");
      div.innerHTML = `<div class="sci-nb-ai-generate-header"><span>Generated ${this.cells.length} cell${this.cells.length !== 1 ? "s" : ""}</span></div>`;
      const cellsDiv = mkEl("div", "sci-nb-ai-generate-cells");
      for (const cell of this.cells) {
        const cellEl = mkEl("div", "sci-nb-ai-generate-cell");
        cellEl.innerHTML = `<div class="sci-nb-ai-generate-cell-badge">${escapeHtml(CELL_TYPE_LABELS[cell.type] || cell.type)}</div><pre class="sci-nb-ai-generate-cell-source">${escapeHtml(cell.source.length > 200 ? cell.source.slice(0, 200) + "..." : cell.source)}</pre>`;
        cellsDiv.appendChild(cellEl);
      }
      div.appendChild(cellsDiv);
      const actions = mkEl("div", "sci-nb-ai-generate-actions");
      const acceptBtn = document.createElement("button");
      acceptBtn.className = "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary";
      acceptBtn.textContent = `Insert ${this.cells.length} cell${this.cells.length !== 1 ? "s" : ""}`;
      acceptBtn.onclick = () => this.opts.onAccept(this.cells);
      actions.appendChild(acceptBtn);
      const regenBtn = document.createElement("button");
      regenBtn.className = "sci-nb-ai-rewrite-btn";
      regenBtn.textContent = "Regenerate";
      regenBtn.onclick = () => { this.state = "prompt"; this.cells = []; this.render(); };
      actions.appendChild(regenBtn);
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "sci-nb-ai-rewrite-btn";
      cancelBtn.textContent = "Cancel"; cancelBtn.onclick = () => this.opts.onCancel();
      actions.appendChild(cancelBtn);
      div.appendChild(actions);
      this.el.appendChild(div);
    }
  }

  destroy() { this.el.remove(); }
}

// ── GhostText ──

export class GhostTextOverlay {
  private el: HTMLDivElement;
  private cleanup: (() => void) | null = null;

  constructor(
    private textarea: HTMLTextAreaElement,
    private text: string,
    private onAccept: () => void,
    private onDismiss: () => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-ghost-text";
    this.el.style.cssText = "position:absolute;pointer-events:none;white-space:pre;font-family:inherit;font-size:inherit;z-index:5";
    this.updatePosition();
    textarea.parentElement?.appendChild(this.el);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); onAccept(); }
      else if (e.key === "Escape") { e.preventDefault(); onDismiss(); }
    };
    textarea.addEventListener("keydown", handleKeyDown, true);
    this.cleanup = () => textarea.removeEventListener("keydown", handleKeyDown, true);
  }

  private updatePosition() {
    const ta = this.textarea;
    const cursorPos = ta.selectionStart;
    const before = ta.value.slice(0, cursorPos);
    const lines = before.split("\n");
    const lineHeight = 22;
    const charWidth = 7.8;
    const top = (lines.length - 1) * lineHeight;
    const left = lines[lines.length - 1].length * charWidth;
    const firstLine = this.text.split("\n")[0];
    const hasMore = this.text.includes("\n");
    this.el.style.top = `${top + 10}px`;
    this.el.style.left = `${left + 12}px`;
    this.el.style.lineHeight = `${lineHeight}px`;
    this.el.innerHTML = `${escapeHtml(firstLine)}${hasMore ? "..." : ""}<span style="font-size:10px;opacity:0.5;margin-left:8px">Tab ↹</span>`;
  }

  updateText(text: string) {
    this.text = text;
    this.updatePosition();
  }

  destroy() {
    this.cleanup?.();
    this.el.remove();
  }
}

// ── ImageResize ──

export class ImageResizeHandle {
  private el: HTMLDivElement;
  private imgEl: HTMLImageElement;
  private moveCleanup: (() => void) | null = null;

  constructor(
    container: HTMLElement,
    src: string,
    alt: string,
    initialWidth: string,
    maxWidth: string,
    private onResize: (newWidth: string) => void,
  ) {
    this.el = document.createElement("div");
    this.el.className = "sci-nb-image-resizable";
    this.el.style.cssText = `max-width:${maxWidth};width:${initialWidth};position:relative;display:inline-block`;

    this.imgEl = document.createElement("img");
    this.imgEl.src = src;
    this.imgEl.alt = alt;
    this.imgEl.style.cssText = "width:100%;height:auto;display:block";
    this.imgEl.draggable = false;
    this.el.appendChild(this.imgEl);

    const handle = document.createElement("div");
    handle.className = "sci-nb-image-resize-handle sci-nb-image-resize-handle--se";
    handle.onmousedown = (e) => this.startDrag(e);
    this.el.appendChild(handle);

    container.appendChild(this.el);
  }

  private startDrag(e: MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = this.imgEl.offsetWidth;
    let width: number | null = null;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      width = Math.max(50, startW + dx);
      this.el.style.width = `${width}px`;
    };
    const onUp = () => {
      if (width !== null) {
        const parentW = this.el.parentElement?.offsetWidth || 1;
        const pct = Math.round((width / parentW) * 100);
        this.onResize(`${Math.min(pct, 100)}%`);
      }
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    this.moveCleanup = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }

  destroy() {
    this.moveCleanup?.();
    this.el.remove();
  }
}
