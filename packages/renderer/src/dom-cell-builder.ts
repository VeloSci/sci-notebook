/**
 * Shared imperative DOM cell builder.
 *
 * Produces the exact same DOM structure and CSS class names as React's
 * Cell.tsx + CellRenderers.tsx so that all adapters (Vue, Svelte, Vanilla)
 * render identically.
 *
 * React keeps its JSX approach but uses the same class names.
 * All other adapters call these functions to build DOM elements.
 */
import type { Cell, CellType, EditorEngine } from "@velo-sci/notebook-core";
import { CELL_ICONS } from "@velo-sci/notebook-core";
import { RenderPipeline } from "./pipeline";
import { MATH_CATEGORIES, type MathBlock } from "./math-categories";

interface TableData {
  headers: string[];
  rows: string[][];
}

interface ImageData {
  src: string;
  alt: string;
  caption: string;
  width: string;
  align: "left" | "center" | "right";
}

interface EmbedData {
  url: string;
  height: string;
  sandbox: string;
  title: string;
}

// ── Constants ──────────────────────────────────────────────────────

const CELL_TYPES: { value: CellType; label: string; icon: string }[] = [
  { value: "markdown", label: "Markdown", icon: CELL_ICONS.markdown },
  { value: "code", label: "Code", icon: CELL_ICONS.code },
  { value: "latex", label: "LaTeX", icon: CELL_ICONS.latex },
  { value: "table", label: "Table", icon: CELL_ICONS.table },
  { value: "image", label: "Image", icon: CELL_ICONS.image },
  { value: "mermaid", label: "Diagram", icon: CELL_ICONS.mermaid },
  { value: "embed", label: "Embed", icon: CELL_ICONS.embed },
  { value: "component", label: "Component", icon: CELL_ICONS.component },
  { value: "raw", label: "Raw", icon: CELL_ICONS.raw },
  { value: "notebook", label: "Notebook", icon: CELL_ICONS.notebook || '<svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>' },
];

const PLACEHOLDERS: Record<string, string> = {
  markdown: "Write markdown here... (click to edit)",
  code: "Write code here...",
  raw: "Raw text...",
  latex: "Write LaTeX here... e.g. \\int_0^1 x^2 dx",
  image: "Click to add image",
  embed: "Click to add embedded content",
  table: "| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |",
  component: 'Enter component JSON config... { "name": "Chart", "props": {} }',
  notebook: "Nested Notebook (click to edit)",
};

// ── SVG Icons (same as React) ──────────────────────────────────────

const SVG_DRAG_HANDLE = `<svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor"><circle cx="3" cy="4" r="1.5"/><circle cx="9" cy="4" r="1.5"/><circle cx="3" cy="10" r="1.5"/><circle cx="9" cy="10" r="1.5"/><circle cx="3" cy="16" r="1.5"/><circle cx="9" cy="16" r="1.5"/></svg>`;

const SVG_MOVE_UP = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 11V3M7 3L3 7M7 3l4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_MOVE_DOWN = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 3v8M7 11l-4-4M7 11l4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_DUPLICATE = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M10 2H3.5A1.5 1.5 0 002 3.5V10"/></svg>`;

const SVG_DELETE = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M6 6.5v3M8 6.5v3M4 4l.5 7a1.5 1.5 0 001.5 1.5h2A1.5 1.5 0 0010 11l.5-7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_INSERT = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg>`;

const SVG_UNDO = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h6a3 3 0 010 6H7M3 7l3-3M3 7l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_REDO = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 7H5a3 3 0 000 6h2M11 7l-3-3M11 7l-3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const SVG_EMPTY = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="8" y="6" width="32" height="36" rx="4"/><line x1="14" y1="14" x2="34" y2="14"/><line x1="14" y1="22" x2="28" y2="22"/><line x1="14" y1="30" x2="22" y2="30"/></svg>`;

// ── DOMCellBuilder ─────────────────────────────────────────────────

export interface DOMCellBuilderOptions {
  engine: EditorEngine;
  pipeline: RenderPipeline;
  readOnly?: boolean;
  renderComponent?: (container: HTMLElement, cell: Cell) => void;
  renderNotebookHook?: (container: HTMLElement, cell: Cell, isEditing: boolean) => void;
  level?: number;
}

/**
 * Shared imperative DOM cell builder that produces the exact same
 * HTML structure and CSS classes as React's Cell component.
 */
export class DOMCellBuilder {
  private engine: EditorEngine;
  private pipeline: RenderPipeline;
  private readOnly: boolean;
  private renderComponentHook?: (container: HTMLElement, cell: Cell) => void;
  private renderNotebookHook?: (container: HTMLElement, cell: Cell, isEditing: boolean) => void;
  private level: number;

  constructor(opts: DOMCellBuilderOptions) {
    this.engine = opts.engine;
    this.pipeline = opts.pipeline;
    this.readOnly = opts.readOnly ?? false;
    this.renderComponentHook = opts.renderComponent;
    this.renderNotebookHook = opts.renderNotebookHook;
    this.level = opts.level ?? 0;
  }

  // ── Full cell element ──

  buildCell(cell: Cell, index: number, totalCells: number): HTMLElement {
    const el = document.createElement("div");
    const isEditing = !!cell.editing;

    el.className = [
      "sci-nb-cell",
      `sci-nb-cell--${cell.type}`,
      isEditing ? "sci-nb-cell--edit" : "sci-nb-cell--view",
    ].join(" ");

    el.setAttribute("data-testid", `cell-${cell.id}`);
    el.setAttribute("data-cell-id", cell.id);
    el.setAttribute("data-editing", String(isEditing));
    el.setAttribute("data-cell-type", cell.type);
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", `${cell.type} cell ${index + 1} of ${totalCells}${isEditing ? ", editing" : ""}`);
    el.setAttribute("aria-selected", String(isEditing));
    el.tabIndex = 0;
    el.draggable = !isEditing;

    // Hover
    el.addEventListener("mouseenter", () => el.classList.add("sci-nb-cell--hover"));
    el.addEventListener("mouseleave", () => el.classList.remove("sci-nb-cell--hover"));

    // Focus
    el.addEventListener("click", () => this.engine.focusCell(cell.id));

    // Drag & drop
    this.bindDragDrop(el, cell.id, index);

    // Build children
    el.appendChild(this.buildGutter(index));
    el.appendChild(this.buildBadge(cell));
    el.appendChild(this.buildContent(cell, isEditing));
    el.appendChild(this.buildActions(cell.id, index, totalCells));

    return el;
  }

  // ── Gutter (drag handle + index) ──

  private buildGutter(index: number): HTMLElement {
    const gutter = document.createElement("div");
    gutter.className = "sci-nb-cell-gutter";

    const handle = document.createElement("div");
    handle.className = "sci-nb-cell-handle";
    handle.title = "Drag to reorder";
    handle.innerHTML = SVG_DRAG_HANDLE;
    gutter.appendChild(handle);

    const idx = document.createElement("span");
    idx.className = "sci-nb-cell-index";
    idx.textContent = `[${index + 1}]`;
    gutter.appendChild(idx);

    return gutter;
  }

  // ── Helpers ──
  
  private parseSvg(svgStr: string): SVGSVGElement | null {
    if (!svgStr.includes('xmlns=')) {
      svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgStr, "image/svg+xml");
    return doc.querySelector("svg");
  }

  // ── Type badge ──

  private buildBadge(cell: Cell): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "sci-nb-cell-badge-wrap";

    const badge = document.createElement("button");
    badge.className = "sci-nb-cell-badge";
    badge.title = "Change cell type";
    if (CELL_ICONS[cell.type]) {
      const svg = this.parseSvg(CELL_ICONS[cell.type]);
      if (svg) badge.appendChild(svg);
    } else {
      badge.textContent = cell.type.slice(0, 2).toUpperCase();
    }

    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = wrap.querySelector(".sci-nb-type-menu");
      if (existing) { existing.remove(); return; }

      const menu = document.createElement("div");
      menu.className = "sci-nb-type-menu";
      for (const ct of CELL_TYPES.filter(c => this.level === 0 || c.value !== "notebook")) {
        const opt = document.createElement("button");
        opt.className = `sci-nb-type-option ${cell.type === ct.value ? "sci-nb-type-option--active" : ""}`;
        
        const iconSpan = document.createElement("span");
        iconSpan.className = "sci-nb-type-option-icon";
        const svg = this.parseSvg(ct.icon);
        if (svg) iconSpan.appendChild(svg);
        
        const textNode = document.createTextNode(ct.label);
        
        opt.appendChild(iconSpan);
        opt.appendChild(textNode);

        opt.addEventListener("click", (ev) => {
          ev.stopPropagation();
          this.engine.setCellType(cell.id, ct.value as CellType);
          menu.remove();
        });
        menu.appendChild(opt);
      }
      wrap.appendChild(menu);

      // Close on outside click
      const close = (ev: MouseEvent) => {
        if (!wrap.contains(ev.target as Node)) { menu.remove(); document.removeEventListener("mousedown", close); }
      };
      setTimeout(() => document.addEventListener("mousedown", close), 0);
    });

    wrap.appendChild(badge);
    return wrap;
  }

  // ── Content (edit or view mode) ──

  private buildContent(cell: Cell, isEditing: boolean): HTMLElement {
    const content = document.createElement("div");
    content.className = "sci-nb-cell-content";

    if (isEditing) {
      content.appendChild(this.buildEditor(cell));
    } else {
      content.appendChild(this.buildPreview(cell));
    }

    return content;
  }

  // ── Editor (textarea — uses sci-nb-editor class like React) ──

  private buildEditor(cell: Cell): DocumentFragment {
    // Table cells get the visual table editor (same as React's TableCell)
    if (cell.type === "table") {
      return this.buildTableEditor(cell);
    }
    if (cell.type === "image") {
      return this.buildImageEditor(cell);
    }
    if (cell.type === "embed") {
      return this.buildEmbedEditor(cell);
    }
    if (cell.type === "notebook") {
      return this.buildNotebookInner(cell, true) as DocumentFragment;
    }

    const frag = document.createDocumentFragment();
    const placeholder = PLACEHOLDERS[cell.type] || "Click to edit...";

    const textarea = document.createElement("textarea");
    // Use the SAME class as React: "sci-nb-editor"
    textarea.className = "sci-nb-editor";
    textarea.value = cell.source;
    textarea.placeholder = placeholder;
    textarea.spellcheck = cell.type === "markdown";
    textarea.rows = 1;

    // Auto-resize
    const autoResize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(40, textarea.scrollHeight)}px`;
    };

    textarea.addEventListener("input", () => {
      this.engine.updateCellSource(cell.id, textarea.value);
      autoResize();
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.engine.setViewMode(cell.id);
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        this.engine.setViewMode(cell.id);
        const cells = this.engine.getCells();
        const idx = cells.findIndex(c => c.id === cell.id);
        if (idx < cells.length - 1) {
          this.engine.focusCell(cells[idx + 1].id);
          this.engine.setEditMode(cells[idx + 1].id);
        }
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.engine.setViewMode(cell.id);
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const start = textarea.selectionStart;
        const val = textarea.value;
        this.engine.updateCellSource(cell.id, val.substring(0, start) + "  " + val.substring(textarea.selectionEnd));
        requestAnimationFrame(() => { textarea.selectionStart = textarea.selectionEnd = start + 2; });
      } else if (e.key === "Tab" && e.shiftKey) {
        e.preventDefault();
        const start = textarea.selectionStart;
        const before = textarea.value.substring(0, start);
        const trimmed = before.replace(/  $/, "");
        if (trimmed !== before) {
          const diff = before.length - trimmed.length;
          this.engine.updateCellSource(cell.id, trimmed + textarea.value.substring(start));
          requestAnimationFrame(() => { textarea.selectionStart = textarea.selectionEnd = start - diff; });
        }
      } else if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.wrapSelection(textarea, cell.id, "**", "**");
      } else if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.wrapSelection(textarea, cell.id, "*", "*");
      }
    });

    frag.appendChild(textarea);

    // Hint bar (same as React)
    const hint = document.createElement("div");
    hint.className = "sci-nb-cell-hint";
    if (cell.type === "code") {
      hint.innerHTML = `<kbd>Shift+Enter</kbd> next · <kbd>Esc</kbd> exit`;
    } else {
      hint.innerHTML = `<kbd>/</kbd> commands · <kbd>Shift+Enter</kbd> next · <kbd>Esc</kbd> exit`;
    }
    frag.appendChild(hint);

    // Focus + auto-resize after mount (preventScroll avoids jumping to top)
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      autoResize();
    });

    return frag;
  }

  // ── Math Editor (visual LaTeX editor — same as React's MathEditor) ──

  private buildMathEditor(cell: Cell): DocumentFragment {
    const frag = document.createDocumentFragment();
    let activeCategory = 0;
    let showRaw = false;
    let textareaEl: HTMLTextAreaElement | null = null;

    // Read LIVE source from engine, not the stale cell snapshot
    const getSource = () => this.engine.getCell(cell.id)?.source ?? cell.source;
    const innerLatex = () => getSource().replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();

    const updateSource = (newInner: string) => {
      this.engine.updateCellSource(cell.id, `$$\n${newInner}\n$$`);
    };

    const exitEdit = () => this.engine.setViewMode(cell.id);

    const exitAndNext = () => {
      exitEdit();
      const cells = this.engine.getCells();
      const idx = cells.findIndex(c => c.id === cell.id);
      if (idx < cells.length - 1) {
        this.engine.focusCell(cells[idx + 1].id);
        this.engine.setEditMode(cells[idx + 1].id);
      }
    };

    const renderLatexPreview = (latex: string): string => {
      const clean = latex.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
      if (!clean) return '<span class="sci-nb-math-preview-empty">Empty formula</span>';
      if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
        try {
          return (globalThis as any).katex.renderToString(clean, { displayMode: true, throwOnError: false });
        } catch { /* fall through */ }
      }
      const escaped = clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<code class="sci-nb-math-preview-code">${escaped}</code>`;
    };

    const insertBlock = (block: MathBlock) => {
      const ta = textareaEl;
      const inner = innerLatex();

      if (!ta) {
        // Visual mode: append block and refresh preview
        const inserted = block.latex.replace(/▢/g, "");
        const newVal = inner + (inner ? " " : "") + inserted;
        updateSource(newVal);
        // Refresh the preview after engine updates
        requestAnimationFrame(() => renderEditorContent());
        return;
      }

      // LaTeX (raw) mode: insert at cursor
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const selected = val.slice(start, end);

      let inserted = block.latex;
      if (selected) inserted = inserted.replace("▢", selected);
      inserted = inserted.replace(/▢/g, "");

      const newVal = val.slice(0, start) + inserted + val.slice(end);

      // Update both engine AND DOM element
      ta.value = newVal;
      updateSource(newVal);

      // Trigger auto-resize and other listeners
      ta.dispatchEvent(new Event("input"));

      requestAnimationFrame(() => {
        if (textareaEl) {
          const cursorPos = block.cursor != null ? start + block.cursor : start + inserted.length;
          textareaEl.focus();
          textareaEl.setSelectionRange(cursorPos, cursorPos);
        }
      });
    };

    // Container
    const container = document.createElement("div");
    container.className = "sci-nb-math-editor";
    container.tabIndex = -1;

    container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); exitEdit(); }
      else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); e.stopPropagation(); exitAndNext(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); exitEdit(); }
    });

    // Category tabs
    const tabs = document.createElement("div");
    tabs.className = "sci-nb-math-tabs";

    const renderPalette = () => {
      palette.innerHTML = "";
      const cat = MATH_CATEGORIES[activeCategory];
      for (const block of cat.blocks) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sci-nb-math-block";
        btn.textContent = block.label;
        btn.title = block.latex;
        btn.tabIndex = -1;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          insertBlock(block);
        });
        palette.appendChild(btn);
      }
    };

    const renderTabs = () => {
      tabs.innerHTML = "";
      MATH_CATEGORIES.forEach((cat, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `sci-nb-math-tab ${i === activeCategory ? "sci-nb-math-tab--active" : ""}`;
        btn.title = cat.name;
        btn.tabIndex = -1;
        btn.innerHTML = `<span class="sci-nb-math-tab-icon">${cat.icon}</span><span class="sci-nb-math-tab-label">${cat.name}</span>`;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          activeCategory = i;
          renderTabs();
          renderPalette();
        });
        tabs.appendChild(btn);
      });
    };

    container.appendChild(tabs);

    // Block palette
    const palette = document.createElement("div");
    palette.className = "sci-nb-math-palette";
    container.appendChild(palette);

    // Editor area
    const editorArea = document.createElement("div");
    editorArea.className = "sci-nb-math-editor-area";

    const modeToggle = document.createElement("div");
    modeToggle.className = "sci-nb-math-mode-toggle";

    const renderEditorContent = () => {
      // Clear editor area content (keep toggle)
      while (editorArea.children.length > 1) editorArea.removeChild(editorArea.lastChild!);

      if (showRaw) {
        const ta = document.createElement("textarea");
        ta.className = "sci-nb-math-raw";
        ta.value = innerLatex();
        ta.placeholder = "Type LaTeX here...";
        ta.spellcheck = false;
        textareaEl = ta;
        ta.addEventListener("input", () => {
          updateSource(ta.value);
          ta.style.height = "auto";
          ta.style.height = `${Math.max(60, ta.scrollHeight)}px`;
        });
        editorArea.appendChild(ta);
        requestAnimationFrame(() => {
          ta.focus({ preventScroll: true });
          ta.style.height = "auto";
          ta.style.height = `${Math.max(60, ta.scrollHeight)}px`;
        });
      } else {
        textareaEl = null;
        const visual = document.createElement("div");
        visual.className = "sci-nb-math-visual";
        const preview = document.createElement("div");
        preview.className = "sci-nb-math-preview";
        preview.innerHTML = renderLatexPreview(getSource());
        visual.appendChild(preview);
        const hint = document.createElement("p");
        hint.className = "sci-nb-math-visual-hint";
        hint.innerHTML = 'Click the blocks above to build your formula. Switch to <strong>LaTeX</strong> mode to edit directly.';
        visual.appendChild(hint);
        editorArea.appendChild(visual);
      }
    };

    const renderModeToggle = () => {
      modeToggle.innerHTML = "";
      const previewBtn = document.createElement("button");
      previewBtn.className = `sci-nb-math-mode-btn ${!showRaw ? "sci-nb-math-mode-btn--active" : ""}`;
      previewBtn.textContent = "Preview";
      previewBtn.tabIndex = -1;
      previewBtn.addEventListener("click", () => { showRaw = false; renderModeToggle(); renderEditorContent(); });

      const latexBtn = document.createElement("button");
      latexBtn.className = `sci-nb-math-mode-btn ${showRaw ? "sci-nb-math-mode-btn--active" : ""}`;
      latexBtn.textContent = "LaTeX";
      latexBtn.tabIndex = -1;
      latexBtn.addEventListener("click", () => { showRaw = true; renderModeToggle(); renderEditorContent(); });

      modeToggle.appendChild(previewBtn);
      modeToggle.appendChild(latexBtn);
    };

    editorArea.appendChild(modeToggle);
    container.appendChild(editorArea);

    // Hint bar
    const hintBar = document.createElement("div");
    hintBar.className = "sci-nb-cell-hint";
    hintBar.innerHTML = `<kbd>Esc</kbd> exit &middot; <kbd>Shift+Enter</kbd> next &middot; <kbd>Ctrl+Enter</kbd> render`;
    container.appendChild(hintBar);

    // Initial render
    renderTabs();
    renderPalette();
    renderModeToggle();
    renderEditorContent();

    // Focus container on mount (preventScroll avoids jumping to top)
    requestAnimationFrame(() => container.focus({ preventScroll: true }));

    frag.appendChild(container);
    return frag;
  }

  private parseMarkdownTable(source: string): TableData {
    const lines = source.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) {
      return { headers: ["Col 1", "Col 2", "Col 3"], rows: [["", "", ""], ["", "", ""]] };
    }

    const parseLine = (line: string): string[] =>
      line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

    const headers = parseLine(lines[0]);
    const rows = lines.slice(2).filter(l => l.includes("|") && !l.includes("---")).map(parseLine);

    const colCount = headers.length;
    const normalizedRows = rows.map(row => {
      const r = [...row];
      while (r.length < colCount) r.push("");
      return r.slice(0, colCount);
    });

    if (normalizedRows.length === 0) {
      normalizedRows.push(new Array(colCount).fill(""));
    }

    return { headers, rows: normalizedRows };
  }

  private toMarkdownTable(data: TableData): string {
    const { headers, rows } = data;
    const headerLine = `| ${headers.join(" | ")} |`;
    const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
    const rowLines = rows.map(row => `| ${row.join(" | ")} |`);
    return [headerLine, sepLine, ...rowLines].join("\n");
  }

  // ── Image Editor (matches React ImageCell) ──

  private parseImageSource(source: string, metadata: Record<string, unknown>): ImageData {
    return {
      src: source || "",
      alt: (metadata.alt as string) || "",
      caption: (metadata.caption as string) || "",
      width: (metadata.width as string) || "100%",
      align: (metadata.align as "left" | "center" | "right") || "center",
    };
  }

  private buildImageEditor(cell: Cell): DocumentFragment {
    const frag = document.createDocumentFragment();
    let data = this.parseImageSource(cell.source, cell.metadata);

    const container = document.createElement("div");
    container.className = "sci-nb-image-editor";
    container.tabIndex = -1;

    const save = (updates: Partial<ImageData>) => {
      data = { ...data, ...updates };
      this.engine.updateCellSource(cell.id, data.src);
      this.engine.updateCellMetadata(cell.id, {
        alt: data.alt,
        caption: data.caption,
        width: data.width,
        align: data.align,
      });
      render();
    };

    const handleFileSelect = (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        save({ src: dataUrl });
      };
      reader.readAsDataURL(file);
    };

    const render = () => {
      container.innerHTML = "";
      const hasSrc = !!data.src.trim();

      // Preview / Dropzone
      if (hasSrc) {
        const preview = document.createElement("div");
        preview.className = "sci-nb-image-preview";
        preview.style.textAlign = data.align;
        const img = document.createElement("img");
        img.src = data.src;
        img.alt = data.alt;
        img.style.maxWidth = data.width;
        img.style.width = "auto";
        img.style.maxHeight = "400px";
        preview.appendChild(img);
        if (data.caption) {
          const cap = document.createElement("p");
          cap.className = "sci-nb-image-caption";
          cap.textContent = data.caption;
          preview.appendChild(cap);
        }
        container.appendChild(preview);
      } else {
        const zone = document.createElement("div");
        zone.className = "sci-nb-image-dropzone";
        zone.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="4" width="24" height="24" rx="3" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M4 22l6-6 4 4 4-4 10 10" stroke-linejoin="round" />
          </svg>
          <p>Drag, paste or click to select</p>
        `;
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.display = "none";
        fileInput.addEventListener("change", (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFileSelect(file);
        });
        zone.appendChild(fileInput);
        zone.addEventListener("click", () => fileInput.click());

        // Drag events
        zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("sci-nb-image-dropzone--active"); });
        zone.addEventListener("dragleave", () => zone.classList.remove("sci-nb-image-dropzone--active"));
        zone.addEventListener("drop", (e) => {
          e.preventDefault();
          zone.classList.remove("sci-nb-image-dropzone--active");
          const file = e.dataTransfer?.files[0];
          if (file) handleFileSelect(file);
        });
        container.appendChild(zone);
      }

      // Controls
      const controls = document.createElement("div");
      controls.className = "sci-nb-image-controls";

      // URL field
      const urlField = document.createElement("div");
      urlField.className = "sci-nb-image-field";
      urlField.innerHTML = `<label>URL</label>`;
      const urlInput = document.createElement("input");
      urlInput.type = "text";
      urlInput.value = data.src.startsWith("data:") ? "(local file)" : data.src;
      urlInput.placeholder = "https://example.com/image.png";
      urlInput.disabled = data.src.startsWith("data:");
      urlInput.addEventListener("input", (e) => save({ src: (e.target as HTMLInputElement).value }));
      urlField.appendChild(urlInput);
      controls.appendChild(urlField);

      // Alt text field
      const altField = document.createElement("div");
      altField.className = "sci-nb-image-field";
      altField.innerHTML = `<label>Alt text</label>`;
      const altInput = document.createElement("input");
      altInput.type = "text";
      altInput.value = data.alt;
      altInput.placeholder = "Image description";
      altInput.addEventListener("input", (e) => save({ alt: (e.target as HTMLInputElement).value }));
      altField.appendChild(altInput);
      controls.appendChild(altField);

      // Caption field
      const capField = document.createElement("div");
      capField.className = "sci-nb-image-field";
      capField.innerHTML = `<label>Caption</label>`;
      const capInput = document.createElement("input");
      capInput.type = "text";
      capInput.value = data.caption;
      capInput.placeholder = "Caption (optional)";
      capInput.addEventListener("input", (e) => save({ caption: (e.target as HTMLInputElement).value }));
      capField.appendChild(capInput);
      controls.appendChild(capField);

      // Row for width/align/clear
      const row = document.createElement("div");
      row.className = "sci-nb-image-row";

      const widthField = document.createElement("div");
      widthField.className = "sci-nb-image-field sci-nb-image-field--small";
      widthField.innerHTML = `<label>Width</label>`;
      const widthSelect = document.createElement("select");
      ["25%", "50%", "75%", "100%", "auto"].forEach(w => {
        const op = document.createElement("option");
        op.value = w; op.textContent = w;
        if (w === data.width) op.selected = true;
        widthSelect.appendChild(op);
      });
      widthSelect.addEventListener("change", (e) => save({ width: (e.target as HTMLSelectElement).value }));
      widthField.appendChild(widthSelect);
      row.appendChild(widthField);

      const alignField = document.createElement("div");
      alignField.className = "sci-nb-image-field sci-nb-image-field--small";
      alignField.innerHTML = `<label>Align</label>`;
      const alignSelect = document.createElement("select");
      ["left", "center", "right"].forEach(a => {
        const op = document.createElement("option");
        op.value = a; op.textContent = a.charAt(0).toUpperCase() + a.slice(1);
        if (a === data.align) op.selected = true;
        alignSelect.appendChild(op);
      });
      alignSelect.addEventListener("change", (e) => save({ align: (e.target as HTMLSelectElement).value as ImageData["align"] }));
      alignField.appendChild(alignSelect);
      row.appendChild(alignField);

      if (hasSrc) {
        const clearBtn = document.createElement("button");
        clearBtn.className = "sci-nb-image-clear";
        clearBtn.textContent = "Remove image";
        clearBtn.addEventListener("click", () => save({ src: "" }));
        row.appendChild(clearBtn);
      }

      controls.appendChild(row);
      container.appendChild(controls);

      const hint = document.createElement("div");
      hint.className = "sci-nb-cell-hint";
      hint.innerHTML = `<kbd>Esc</kbd> exit`;
      container.appendChild(hint);
    };

    // Paste handler
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFileSelect(file);
          return;
        }
      }
    };
    container.addEventListener("paste", onPaste);
    container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this.engine.setViewMode(cell.id); }
    });

    render();
    frag.appendChild(container);
    return frag;
  }

  // ── Embed Editor (matches React EmbedCell) ──

  private parseEmbedSource(source: string, metadata: Record<string, unknown>): EmbedData {
    return {
      url: source || "",
      height: (metadata.height as string) || "400px",
      sandbox: (metadata.sandbox as string) || "allow-scripts allow-same-origin allow-popups allow-presentation",
      title: (metadata.title as string) || "",
    };
  }

  private buildEmbedEditor(cell: Cell): DocumentFragment {
    const frag = document.createDocumentFragment();
    let data = this.parseEmbedSource(cell.source, cell.metadata);

    const container = document.createElement("div");
    container.className = "sci-nb-embed-editor";
    container.tabIndex = -1;

    const save = (updates: Partial<EmbedData>) => {
      data = { ...data, ...updates };
      this.engine.updateCellSource(cell.id, data.url);
      this.engine.updateCellMetadata(cell.id, {
        height: data.height,
        sandbox: data.sandbox,
        title: data.title,
      });
      render();
    };

    const render = () => {
      container.innerHTML = "";

      // Presets
      const presets = document.createElement("div");
      presets.className = "sci-nb-embed-presets";
      const items = [
        { label: "YouTube", url: "https://www.youtube.com/embed/" },
        { label: "Desmos", url: "https://www.desmos.com/calculator/" },
        { label: "GeoGebra", url: "https://www.geogebra.org/calculator/" },
        { label: "CodePen", url: "https://codepen.io/" },
      ];
      items.forEach(item => {
        const btn = document.createElement("button");
        btn.className = "sci-nb-embed-preset";
        btn.textContent = item.label;
        btn.addEventListener("click", () => save({ url: item.url }));
        presets.appendChild(btn);
      });
      container.appendChild(presets);

      // URL field
      const urlRow = document.createElement("div");
      urlRow.className = "sci-nb-embed-url-row";
      const input = document.createElement("input");
      input.className = "sci-nb-embed-url";
      input.value = data.url;
      input.placeholder = "Paste embed URL or iframe code...";
      input.addEventListener("input", (e) => save({ url: (e.target as HTMLInputElement).value }));
      urlRow.appendChild(input);
      container.appendChild(urlRow);

      // Preview
      if (data.url) {
        const wrap = document.createElement("div");
        wrap.className = "sci-nb-embed-frame-wrap";
        wrap.style.height = data.height;
        const ifr = document.createElement("iframe");
        ifr.src = data.url;
        ifr.sandbox = data.sandbox;
        ifr.title = data.title;
        ifr.style.width = "100%";
        ifr.style.height = "100%";
        ifr.style.border = "none";
        wrap.appendChild(ifr);
        container.appendChild(wrap);
      }

      // Settings
      const settings = document.createElement("div");
      settings.className = "sci-nb-embed-settings";
      settings.innerHTML = `
        <div class="sci-nb-embed-row">
          <div class="sci-nb-embed-field sci-nb-embed-field--small">
            <label>Height</label>
            <input type="text" value="${data.height}" placeholder="400px" />
          </div>
          <div class="sci-nb-embed-field">
            <label>Title</label>
            <input type="text" value="${data.title}" placeholder="Accessibility title" />
          </div>
        </div>
      `;
      const hInput = settings.querySelector('input[placeholder="400px"]') as HTMLInputElement;
      hInput.addEventListener("input", (e) => save({ height: (e.target as HTMLInputElement).value }));
      const tInput = settings.querySelector('input[placeholder="Accessibility title"]') as HTMLInputElement;
      tInput.addEventListener("input", (e) => save({ title: (e.target as HTMLInputElement).value }));
      container.appendChild(settings);

      const hint = document.createElement("div");
      hint.className = "sci-nb-cell-hint";
      hint.innerHTML = `<kbd>Esc</kbd> exit`;
      container.appendChild(hint);
    };

    container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); this.engine.setViewMode(cell.id); }
    });

    render();
    frag.appendChild(container);
    return frag;
  }

  private buildTableEditor(cell: Cell): DocumentFragment {
    const frag = document.createDocumentFragment();
    let data = this.parseMarkdownTable(cell.source);

    const container = document.createElement("div");
    container.className = "sci-nb-table-editor";
    container.tabIndex = -1;

    container.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.engine.setViewMode(cell.id);
      }
    });

    const sync = () => {
      this.engine.updateCellSource(cell.id, this.toMarkdownTable(data));
    };

    const render = () => {
      container.innerHTML = "";

      // Toolbar
      const toolbar = document.createElement("div");
      toolbar.className = "sci-nb-table-toolbar";

      const addRowBtn = document.createElement("button");
      addRowBtn.textContent = "+ Row";
      addRowBtn.onclick = () => {
        data.rows.push(new Array(data.headers.length).fill(""));
        sync();
        render();
      };

      const addColBtn = document.createElement("button");
      addColBtn.textContent = "+ Column";
      addColBtn.onclick = () => {
        data.headers.push(`Col ${data.headers.length + 1}`);
        data.rows.forEach(r => r.push(""));
        sync();
        render();
      };

      toolbar.appendChild(addRowBtn);
      toolbar.appendChild(addColBtn);
      container.appendChild(toolbar);

      // Table
      const table = document.createElement("table");

      // Header
      const thead = document.createElement("thead");
      const htr = document.createElement("tr");
      data.headers.forEach((h, ci) => {
        const th = document.createElement("th");
        th.className = "sci-nb-table-header-cell";

        const input = document.createElement("input");
        input.value = h;
        input.placeholder = `Col ${ci + 1}`;
        input.oninput = (e) => {
          data.headers[ci] = (e.target as HTMLInputElement).value;
          sync();
        };

        th.appendChild(input);

        let delBtn: HTMLButtonElement | null = null;
        th.onmouseenter = () => {
          if (data.headers.length <= 1) return;
          delBtn = document.createElement("button");
          delBtn.className = "sci-nb-table-delete-btn";
          delBtn.innerHTML = "✕";
          delBtn.title = "Delete column";
          delBtn.onclick = (e) => {
            e.stopPropagation();
            data.headers.splice(ci, 1);
            data.rows.forEach(r => r.splice(ci, 1));
            sync();
            render();
          };
          th.appendChild(delBtn);
        };
        th.onmouseleave = () => {
          if (delBtn) { delBtn.remove(); delBtn = null; }
        };

        htr.appendChild(th);
      });
      thead.appendChild(htr);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement("tbody");
      data.rows.forEach((row, ri) => {
        const tr = document.createElement("tr");
        row.forEach((cellVal, ci) => {
          const td = document.createElement("td");
          const isLastCol = ci === row.length - 1;
          if (isLastCol) td.className = "sci-nb-table-row-end";

          const input = document.createElement("input");
          input.value = cellVal;
          input.placeholder = "...";
          input.oninput = (e) => {
            data.rows[ri][ci] = (e.target as HTMLInputElement).value;
            sync();
          };
          td.appendChild(input);

          if (isLastCol) {
            let delBtn: HTMLButtonElement | null = null;
            tr.onmouseenter = () => {
              if (data.rows.length <= 1) return;
              delBtn = document.createElement("button");
              delBtn.className = "sci-nb-table-delete-btn";
              delBtn.innerHTML = "✕";
              delBtn.title = "Delete row";
              delBtn.onclick = (e) => {
                e.stopPropagation();
                data.rows.splice(ri, 1);
                sync();
                render();
              };
              td.appendChild(delBtn);
            };
            tr.onmouseleave = () => {
              if (delBtn) { delBtn.remove(); delBtn = null; }
            };
          }

          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);

      // Hint
      const hint = document.createElement("div");
      hint.className = "sci-nb-cell-hint";
      hint.innerHTML = `<kbd>Tab</kbd> next cell &middot; <kbd>Esc</kbd> exit`;
      container.appendChild(hint);
    };

    render();

    // Auto-focus first input or container
    requestAnimationFrame(() => {
      const firstInput = container.querySelector("input");
      if (firstInput) firstInput.focus();
      else container.focus({ preventScroll: true });
    });

    frag.appendChild(container);
    return frag;
  }

  // ── Preview (view mode — uses sci-nb-preview class like React) ──

  private buildPreview(cell: Cell): HTMLElement {
    if (cell.type === "notebook") {
      return this.buildNotebookInner(cell, false) as HTMLElement;
    }

    const rendered = this.pipeline.render(cell);
    const isEmpty = !cell.source.trim();
    const placeholder = PLACEHOLDERS[cell.type] || "Click to edit...";

    const preview = document.createElement("div");
    const classes = ["sci-nb-preview"];
    if (isEmpty) classes.push("sci-nb-preview--empty");
    if (cell.type === "embed") classes.push("sci-nb-preview--embed");
    if (cell.type === "component") classes.push("sci-nb-preview--component");
    preview.className = classes.join(" ");

    if (isEmpty) {
      preview.innerHTML = `<span class="sci-nb-placeholder">${placeholder}</span>`;
    } else if (cell.type === "component") {
      if (this.renderComponentHook) {
        this.renderComponentHook(preview, cell);
      } else {
        preview.innerHTML = `<div class="sci-nb-component-not-found" style="padding: 1rem; color: var(--sci-text-muted);">Component rendering not supported by adapter</div>`;
      }
    } else {
      preview.innerHTML = rendered.html;
    }

    if (!this.readOnly) {
      preview.addEventListener("click", () => {
        this.engine.focusCell(cell.id);
        this.engine.setEditMode(cell.id);
      });
    }

    return preview;
  }

  // ── Cell actions ──

  private buildActions(cellId: string, index: number, totalCells: number): HTMLElement {
    const actions = document.createElement("div");
    actions.className = "sci-nb-cell-actions";

    const mkBtn = (svg: string, title: string, disabled: boolean, onClick: () => void, danger = false) => {
      const btn = document.createElement("button");
      btn.className = `sci-nb-btn${danger ? " sci-nb-btn--danger" : ""}`;
      btn.title = title;
      btn.disabled = disabled;
      btn.innerHTML = svg;
      btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
      return btn;
    };

    actions.appendChild(mkBtn(SVG_MOVE_UP, "Move up", index === 0, () => this.engine.moveCell(cellId, index - 1)));
    actions.appendChild(mkBtn(SVG_MOVE_DOWN, "Move down", index >= totalCells - 1, () => this.engine.moveCell(cellId, index + 1)));
    actions.appendChild(mkBtn(SVG_DUPLICATE, "Duplicate cell", false, () => this.engine.duplicateCell(cellId)));
    actions.appendChild(mkBtn(SVG_DELETE, "Delete cell", false, () => this.engine.deleteCell(cellId), true));

    return actions;
  }

  // ── Notebook Inner Wrapper ──

  private buildNotebookInner(cell: Cell, isEditing: boolean): DocumentFragment | HTMLElement {
    const isFragment = isEditing ? document.createDocumentFragment() : null;
    
    const wrapper = document.createElement("div");
    wrapper.className = "sci-nb-nested";
    wrapper.style.cssText = "border: 1px solid var(--sci-nb-border, #e5e7eb); border-radius: 6px; padding: 1px; background: var(--sci-nb-bg, #fafafa); margin-top: 8px; margin-bottom: 8px; display: flex; flex-direction: column; cursor: default;";

    if (isEditing && !this.readOnly) {
      const topBar = document.createElement("div");
      topBar.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--sci-nb-border, #e5e7eb); background: var(--sci-nb-bg-toolbar, #f1f5f9); border-top-left-radius: 5px; border-top-right-radius: 5px; font-size: 12px; font-weight: 600; color: var(--sci-nb-text, #333);";
      topBar.innerHTML = `<div>Nested Notebook (Level 1)</div>`;
      
      const controls = document.createElement("div");
      controls.style.cssText = "display: flex; gap: 12px; align-items: center;";
      
      const lbl = document.createElement("label");
      lbl.style.cssText = "display: flex; align-items: center; gap: 4px; cursor: pointer;";
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !!cell.metadata?.readOnly;
      chk.addEventListener("change", () => {
        this.engine.updateCellMetadata(cell.id, { readOnly: chk.checked });
      });
      lbl.appendChild(chk);
      lbl.appendChild(document.createTextNode("Read-Only for users"));
      controls.appendChild(lbl);
      
      const btn = document.createElement("button");
      btn.style.cssText = "background: transparent; border: none; cursor: pointer; color: var(--sci-nb-text-dim, #64748b); padding: 0;";
      btn.title = "Exit Edit Mode";
      btn.textContent = "Done";
      btn.addEventListener("click", () => this.engine.setViewMode(cell.id));
      controls.appendChild(btn);

      topBar.appendChild(controls);
      wrapper.appendChild(topBar);
    } else if (!isEditing) {
       wrapper.addEventListener("click", (e) => {
         e.stopPropagation();
         this.engine.focusCell(cell.id);
         this.engine.setEditMode(cell.id);
       });
    }

    const inner = document.createElement("div");
    inner.style.padding = "8px";
    
    if (this.renderNotebookHook) {
      if (!isEditing && !cell.source.trim()) {
        inner.innerHTML = `<span class="sci-nb-placeholder">Nested Notebook (click to edit)</span>`;
      } else {
        this.renderNotebookHook(inner, cell, isEditing);
      }
    } else {
      inner.innerText = "No renderNotebookHook provided.";
    }

    if (isEditing) {
      // In edit mode we disable preview clicks turning it into edit mode
      inner.addEventListener("click", (e) => e.stopPropagation());
    }

    wrapper.appendChild(inner);
    
    if (isFragment) {
      isFragment.appendChild(wrapper);
      return isFragment;
    }
    return wrapper;
  }

  // ── Insert handle (matches React's InsertHandle exactly) ──

  buildInsertHandle(index: number): HTMLElement {
    const handle = document.createElement("div");
    handle.className = "sci-nb-insert-handle";

    const line = document.createElement("div");
    line.className = "sci-nb-insert-line";

    const btn = document.createElement("button");
    btn.className = "sci-nb-insert-btn";
    btn.title = "Insert cell";
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const existingMenu = handle.querySelector(".sci-nb-insert-menu-wrap");
      if (existingMenu) { existingMenu.remove(); return; }

      const wrap = document.createElement("div");
      wrap.className = "sci-nb-insert-menu-wrap sci-nb-insert-menu-wrap--renderer";

      const menu = document.createElement("div");
      menu.className = "sci-nb-insert-menu";

      for (const ct of CELL_TYPES.filter(c => this.level === 0 || c.value !== "notebook")) {
        const opt = document.createElement("button");
        opt.className = "sci-nb-insert-option";
        
        const iconSpan = document.createElement("span");
        iconSpan.className = "sci-nb-insert-option-icon";
        const svg = this.parseSvg(ct.icon);
        if (svg) iconSpan.appendChild(svg);
        
        const labelSpan = document.createElement("span");
        labelSpan.textContent = ct.label;
        
        opt.appendChild(iconSpan);
        opt.appendChild(labelSpan);

        opt.addEventListener("click", (ev) => {
          ev.stopPropagation();
          wrap.remove();
          const cell = this.engine.insertCell(index, ct.value as CellType);
          requestAnimationFrame(() => {
            this.engine.setEditMode(cell.id);
            this.engine.focusCell(cell.id);
          });
        });
        menu.appendChild(opt);
      }

      wrap.appendChild(menu);
      handle.appendChild(wrap);

      // Close on outside click
      const close = (ev: MouseEvent) => {
        if (!wrap.contains(ev.target as Node)) {
          wrap.remove();
          document.removeEventListener("mousedown", close);
        }
      };
      setTimeout(() => document.addEventListener("mousedown", close), 0);
    });

    line.appendChild(btn);
    handle.appendChild(line);
    return handle;
  }

  // ── Toolbar ──

  buildToolbar(opts: {
    onToggleFind?: () => void;
    onToggleTOC?: () => void;
    showTOC?: boolean;
  } = {}): HTMLElement {
    const toolbar = document.createElement("div");
    toolbar.className = "sci-nb-toolbar";

    const nb = this.engine.getNotebook();

    const titleGroup = document.createElement("div");
    titleGroup.className = "sci-nb-toolbar-group";
    const title = document.createElement("span");
    title.className = "sci-nb-toolbar-title";
    title.textContent = nb.title;
    titleGroup.appendChild(title);

    const actionsGroup = document.createElement("div");
    actionsGroup.className = "sci-nb-toolbar-group";

    const mkBtn = (text: string, title: string, onClick: () => void, extraClass = "") => {
      const btn = document.createElement("button");
      btn.className = `sci-nb-toolbar-btn ${extraClass}`.trim();
      btn.title = title;
      btn.textContent = text;
      btn.addEventListener("click", onClick);
      return btn;
    };

    const mkBtnHtml = (html: string, title: string, onClick: () => void) => {
      const btn = document.createElement("button");
      btn.className = "sci-nb-toolbar-btn";
      btn.title = title;
      btn.innerHTML = html;
      btn.addEventListener("click", onClick);
      return btn;
    };

    actionsGroup.appendChild(mkBtnHtml(`${SVG_UNDO} Undo`, "Undo (Ctrl+Z)", () => this.engine.undo()));
    actionsGroup.appendChild(mkBtnHtml(`Redo ${SVG_REDO}`, "Redo (Ctrl+Shift+Z)", () => this.engine.redo()));

    const sep1 = document.createElement("span");
    sep1.className = "sci-nb-toolbar-sep";
    actionsGroup.appendChild(sep1);

    actionsGroup.appendChild(mkBtn("Edit All", "Edit all cells", () => this.engine.setAllEditMode()));
    actionsGroup.appendChild(mkBtn("View All", "Preview all cells", () => this.engine.setAllViewMode()));

    const sep2 = document.createElement("span");
    sep2.className = "sci-nb-toolbar-sep";
    actionsGroup.appendChild(sep2);

    if (opts.onToggleFind) {
      actionsGroup.appendChild(mkBtn("Find", "Find & Replace (Ctrl+F)", opts.onToggleFind));
    }

    if (opts.onToggleTOC) {
      const tocBtn = mkBtn("TOC", "Table of Contents", opts.onToggleTOC, opts.showTOC ? "sci-nb-toolbar-btn--active" : "");
      tocBtn.setAttribute("data-toolbar", "toc");
      actionsGroup.appendChild(tocBtn);
    }

    toolbar.appendChild(titleGroup);
    toolbar.appendChild(actionsGroup);
    return toolbar;
  }

  // ── TOC sidebar ──

  buildTOC(focusedCellId?: string | null): HTMLElement {
    const nav = document.createElement("nav");
    nav.className = "sci-nb-toc";

    const titleEl = document.createElement("div");
    titleEl.className = "sci-nb-toc-title";
    titleEl.textContent = "Contenido";
    nav.appendChild(titleEl);

    const nb = this.engine.getNotebook();
    let hasItems = false;

    for (const cell of nb.cells) {
      if (cell.type !== "markdown") continue;
      for (const line of cell.source.split("\n")) {
        const match = line.match(/^(#{1,3})\s+(.+)/);
        if (match) {
          hasItems = true;
          const btn = document.createElement("button");
          const text = match[2].replace(/[*_`~#]/g, "").trim();
          btn.className = [
            "sci-nb-toc-item",
            `sci-nb-toc-item--h${match[1].length}`,
            cell.id === focusedCellId ? "sci-nb-toc-item--active" : "",
          ].filter(Boolean).join(" ");
          btn.textContent = text;
          btn.title = text;
          btn.addEventListener("click", () => {
            this.engine.focusCell(cell.id);
            this.engine.setEditMode(cell.id);
            const el = document.querySelector(`[data-testid="cell-${cell.id}"]`);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          nav.appendChild(btn);
        }
      }
    }

    if (!hasItems) nav.style.display = "none";
    return nav;
  }

  // ── Empty state ──

  buildEmpty(): HTMLElement {
    const empty = document.createElement("div");
    empty.className = "sci-nb-empty";

    const icon = document.createElement("div");
    icon.className = "sci-nb-empty-icon";
    icon.innerHTML = SVG_EMPTY;
    empty.appendChild(icon);

    const p = document.createElement("p");
    p.textContent = "Empty notebook. Add a cell to get started.";
    empty.appendChild(p);

    empty.appendChild(this.buildInsertHandle(0));
    return empty;
  }

  // ── Render all cells into a container (full rebuild) ──

  renderCells(container: HTMLElement): void {
    container.innerHTML = "";
    const cells = this.engine.getCells();

    if (cells.length === 0) {
      container.appendChild(this.buildEmpty());
      return;
    }

    container.appendChild(this.buildInsertHandle(0));
    cells.forEach((cell, idx) => {
      container.appendChild(this.buildCell(cell, idx, cells.length));
      container.appendChild(this.buildInsertHandle(idx + 1));
    });
  }

  // ── Patch cells in-place (smart diff — preserves focus) ──

  /**
   * Incrementally update the cells container.
   *
   * Key principle: **touch as few DOM nodes as possible**.
   * - Cells whose type AND edit-mode haven't changed are KEPT as-is (no rebuild).
   * - Only cells that switched mode (view↔edit) or type are rebuilt.
   * - The actively-edited cell is NEVER touched.
   * - Insert handles are never rebuilt (they use closures but are cheap to keep).
   * - Structural changes (add/remove/reorder) trigger a full rebuild.
   */
  patchCells(container: HTMLElement): void {
    const cells = this.engine.getCells();

    // Handle empty state
    if (cells.length === 0) {
      container.innerHTML = "";
      container.appendChild(this.buildEmpty());
      return;
    }

    // Remove empty-state placeholder if present
    const emptyEl = container.querySelector(".sci-nb-empty");
    if (emptyEl) { container.innerHTML = ""; }

    // If container is empty (first render), do full render
    if (container.children.length === 0) {
      this.renderCells(container);
      return;
    }

    // Build ordered list of existing cell IDs from the DOM
    const existingCellIds: string[] = [];
    const existingCellNodes = new Map<string, HTMLElement>();
    for (const child of Array.from(container.children)) {
      const el = child as HTMLElement;
      const id = el.getAttribute("data-cell-id");
      if (id) {
        existingCellIds.push(id);
        existingCellNodes.set(id, el);
      }
    }

    // Check if cell order/count changed (add/remove/reorder)
    const newCellIds = cells.map(c => c.id);
    const orderChanged = existingCellIds.length !== newCellIds.length
      || existingCellIds.some((id, i) => id !== newCellIds[i]);

    if (orderChanged) {
      // Structural change — full rebuild, but save & restore focus
      const activeEl = document.activeElement as HTMLElement | null;
      const activeCellId = activeEl?.closest?.("[data-cell-id]")?.getAttribute("data-cell-id");
      const isTextarea = activeEl?.tagName === "TEXTAREA";
      const cursorStart = isTextarea ? (activeEl as HTMLTextAreaElement).selectionStart : 0;
      const cursorEnd = isTextarea ? (activeEl as HTMLTextAreaElement).selectionEnd : 0;

      this.renderCells(container);

      // Restore focus
      if (activeCellId && isTextarea) {
        requestAnimationFrame(() => {
          const cellEl = container.querySelector(`[data-cell-id="${activeCellId}"]`);
          const ta = cellEl?.querySelector("textarea") as HTMLTextAreaElement | null;
          if (ta) { ta.focus(); ta.setSelectionRange(cursorStart, cursorEnd); }
        });
      }
      return;
    }

    // Same order/count — patch individual cells in-place
    const totalCells = cells.length;
    for (let idx = 0; idx < totalCells; idx++) {
      const cell = cells[idx];
      const existing = existingCellNodes.get(cell.id)!;

      const oldType = existing.getAttribute("data-cell-type");
      const oldEditing = existing.getAttribute("data-editing") === "true";
      const newEditing = !!cell.editing;
      const typeChanged = oldType !== cell.type;
      const modeChanged = oldEditing !== newEditing;

      if (!typeChanged && !modeChanged) {
        // Nothing structural changed — keep existing DOM node completely untouched.
        const idxLabel = existing.querySelector(".sci-nb-cell-index");
        if (idxLabel) idxLabel.textContent = `[${idx + 1}]`;
        continue;
      }

      // Type or mode changed — patch the cell IN-PLACE (no replaceWith = no flash)
      // 1. Update attributes on the existing node
      existing.className = [
        "sci-nb-cell",
        `sci-nb-cell--${cell.type}`,
        newEditing ? "sci-nb-cell--edit" : "sci-nb-cell--view",
      ].join(" ");
      existing.setAttribute("data-editing", String(newEditing));
      existing.setAttribute("data-cell-type", cell.type);
      existing.setAttribute("aria-label", `${cell.type} cell ${idx + 1} of ${totalCells}${newEditing ? ", editing" : ""}`);
      existing.setAttribute("aria-selected", String(newEditing));
      existing.draggable = !newEditing;

      // 2. Swap only the .sci-nb-cell-content child
      const oldContent = existing.querySelector(".sci-nb-cell-content");
      if (oldContent) {
        const newContent = this.buildContent(cell, newEditing);
        oldContent.replaceWith(newContent);
      }

      // 3. If type changed, update badge text
      if (typeChanged) {
        const badge = existing.querySelector(".sci-nb-cell-badge");
        if (badge) {
          badge.innerHTML = "";
          if (CELL_ICONS[cell.type]) {
            const svg = this.parseSvg(CELL_ICONS[cell.type]);
            if (svg) badge.appendChild(svg);
          } else {
            badge.textContent = cell.type.slice(0, 2).toUpperCase();
          }
        }
      }
    }
  }

  // ── Helpers ──

  private wrapSelection(textarea: HTMLTextAreaElement, cellId: string, before: string, after: string) {
    const { selectionStart: start, selectionEnd: end, value: val } = textarea;
    this.engine.updateCellSource(cellId, val.substring(0, start) + before + val.substring(start, end) + after + val.substring(end));
    requestAnimationFrame(() => {
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = end + before.length;
    });
  }

  private bindDragDrop(el: HTMLElement, cellId: string, index: number) {
    el.addEventListener("dragstart", (e) => {
      e.stopPropagation();
      e.dataTransfer!.setData("text/plain", cellId);
      const cell = this.engine.getCell(cellId);
      if (cell) {
        e.dataTransfer!.setData("application/sci-notebook-cell", JSON.stringify({
          srcNotebookId: this.engine.getNotebook().id,
          cellId: cellId,
          cell: cell
        }));
      }
      e.dataTransfer!.effectAllowed = "move";
      el.classList.add("sci-nb-cell--dragging");
    });
    el.addEventListener("dragend", () => {
      el.classList.remove("sci-nb-cell--dragging", "sci-nb-cell--drag-over-top", "sci-nb-cell--drag-over-bottom");
    });
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer!.dropEffect = "move";
      const rect = el.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      el.classList.toggle("sci-nb-cell--drag-over-top", isTop);
      el.classList.toggle("sci-nb-cell--drag-over-bottom", !isTop);
    });
    el.addEventListener("dragleave", () => {
      el.classList.remove("sci-nb-cell--drag-over-top", "sci-nb-cell--drag-over-bottom");
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("sci-nb-cell--drag-over-top", "sci-nb-cell--drag-over-bottom");
      
      const rect = el.getBoundingClientRect();
      const targetIdx = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
      
      try {
        const payloadStr = e.dataTransfer!.getData("application/sci-notebook-cell");
        if (payloadStr) {
          const payload = JSON.parse(payloadStr);
          if (payload.srcNotebookId === this.engine.getNotebook().id) {
            if (payload.cellId !== cellId) this.engine.moveCell(payload.cellId, targetIdx);
          } else {
            const newCell = this.engine.insertCell(targetIdx, payload.cell.type, payload.cell.source);
            this.engine.updateCellMetadata(newCell.id, payload.cell.metadata);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("sci-nb-remove-cell", { detail: { notebookId: payload.srcNotebookId, cellId: payload.cellId } }));
            }
          }
          return;
        }
      } catch (err) {}

      const draggedId = e.dataTransfer!.getData("text/plain");
      if (draggedId && draggedId !== cellId) {
        this.engine.moveCell(draggedId, targetIdx);
      }
    });
  }
}
