# 04 — Rendering Pipeline

## Overview

The rendering pipeline transforms a cell's raw `source` string into rendered
output (HTML string or virtual DOM nodes). It is designed as a chain of
composable stages so plugins can hook in at any point.

```
source (string)
  │
  ▼
┌──────────────┐
│  Pre-process │  ← plugins can transform source before parsing
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Parse     │  ← markdown-it (or swappable parser) → AST (token stream)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  AST Transforms │  ← plugins modify/annotate tokens (LaTeX, Mermaid, etc.)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Render     │  ← tokens → HTML string (or framework VDOM)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Post-process │  ← plugins can modify final HTML (sanitize, highlight, etc.)
└──────┬───────┘
       │
       ▼
rendered output (string | VNode)
```

---

## Pipeline Stages

### 1. Pre-process

Plugins register `preprocess(source: string, cell: Cell): string` hooks.
These run in registration order and can modify the raw source before parsing.

**Use cases:**
- Expand custom shortcodes (e.g., `::warning[text]` → admonition HTML).
- Strip or transform front-matter.
- Inject variables from notebook metadata.

### 2. Parse

The default parser is **markdown-it** configured with:
- CommonMark mode (strict).
- HTML enabled (for embed cells).
- Linkify enabled.
- Typographer enabled.

The parser is swappable. Any object implementing `MarkdownParser` can replace it:

```typescript
interface MarkdownParser {
  /** Parse source into a token stream */
  parse(source: string): Token[];

  /** Render a token stream to HTML */
  render(tokens: Token[]): string;

  /** Register a plugin/extension on the parser */
  use(plugin: MarkdownParserPlugin): void;
}
```

### 3. AST Transforms

After parsing, the token stream is passed through registered AST transformers.
Each transformer receives the full token array and the cell, and returns a
(possibly modified) token array.

```typescript
type ASTTransformer = (tokens: Token[], cell: Cell) => Token[];
```

**Use cases:**
- **LaTeX plugin**: Finds `$...$` and `$$...$$` tokens, replaces them with
  `<span class="katex">...</span>` rendered by KaTeX.
- **Mermaid plugin**: Finds fenced code blocks with `mermaid` language,
  replaces them with `<div class="mermaid">...</div>` placeholder.
- **Embed plugin**: Finds `:::embed` blocks, replaces with component mount points.
- **Table plugin**: Enhances table tokens with sortable/editable attributes.

### 4. Render

Tokens are rendered to HTML (default) or to framework-specific virtual DOM
nodes (via adapter).

```typescript
interface CellRenderer {
  /** Unique renderer ID */
  id: string;

  /** Cell types this renderer handles */
  cellTypes: CellType[];

  /** Render tokens to HTML string */
  renderToHTML?(tokens: Token[], cell: Cell): string;

  /** Render to framework VDOM (React, Vue, etc.) — provided by adapter */
  renderToVDOM?(tokens: Token[], cell: Cell): unknown;

  /** Priority — higher priority renderers run first (default: 0) */
  priority?: number;
}
```

Multiple renderers can be registered for the same cell type. The first one
that returns a non-null result wins (chain of responsibility).

### 5. Post-process

After rendering, plugins can apply final transformations to the HTML string.

```typescript
type PostProcessor = (html: string, cell: Cell) => string;
```

**Use cases:**
- **Sanitization**: Strip dangerous tags/attributes (DOMPurify).
- **Syntax highlighting**: Apply Shiki/Prism to `<code>` blocks.
- **Link rewriting**: Add `target="_blank"` to external links.
- **Image lazy loading**: Add `loading="lazy"` to `<img>` tags.

---

## RenderPipeline Class

```typescript
class RenderPipeline {
  private preprocessors: Array<{
    id: string;
    fn: (source: string, cell: Cell) => string;
    priority: number;
  }>;

  private parser: MarkdownParser;

  private astTransformers: Array<{
    id: string;
    fn: ASTTransformer;
    priority: number;
  }>;

  private renderers: CellRenderer[];

  private postprocessors: Array<{
    id: string;
    fn: PostProcessor;
    priority: number;
  }>;

  constructor(parser?: MarkdownParser);

  /** Register a preprocessor */
  addPreprocessor(id: string, fn: (s: string, c: Cell) => string, priority?: number): void;

  /** Register an AST transformer */
  addASTTransformer(id: string, fn: ASTTransformer, priority?: number): void;

  /** Register a cell renderer */
  addRenderer(renderer: CellRenderer): void;

  /** Register a postprocessor */
  addPostprocessor(id: string, fn: PostProcessor, priority?: number): void;

  /** Remove any hook by ID */
  remove(id: string): void;

  /** Run the full pipeline for a cell */
  render(cell: Cell): RenderedCell;

  /** Run the full pipeline for all cells in a notebook */
  renderAll(notebook: Notebook): RenderedCell[];
}

interface RenderedCell {
  cellId: string;
  html: string;
  /** Time taken to render in ms (for performance monitoring) */
  renderTime: number;
  /** Whether the result was served from cache */
  cached: boolean;
}
```

---

## Caching Strategy

Rendering can be expensive (especially LaTeX and Mermaid). The pipeline
implements a content-addressed cache:

```typescript
interface RenderCache {
  /** Get cached render result */
  get(key: string): string | null;

  /** Store render result */
  set(key: string, html: string): void;

  /** Invalidate a specific key */
  invalidate(key: string): void;

  /** Clear entire cache */
  clear(): void;

  /** Current cache size */
  size(): number;
}
```

**Cache key** = `hash(cell.type + cell.source + relevantMetadata)`.

The cache is an LRU map with configurable max size (default: 200 entries).
When a cell's source changes, only that cell's cache entry is invalidated.

---

## Incremental Rendering

For large notebooks (100+ cells), rendering all cells on every change is
wasteful. The pipeline supports incremental rendering:

1. **Dirty tracking**: When `cell:updated` fires, mark only that cell as dirty.
2. **Viewport rendering**: Only render cells currently visible in the viewport
   (determined by the framework adapter's scroll position).
3. **Background rendering**: Off-screen cells are rendered in idle callbacks
   (`requestIdleCallback`) or in a Web Worker.

```typescript
interface IncrementalRenderer {
  /** Mark a cell as needing re-render */
  markDirty(cellId: string): void;

  /** Set the visible cell ID range */
  setViewport(startIndex: number, endIndex: number): void;

  /** Trigger a render pass (renders dirty + visible cells) */
  flush(): RenderedCell[];

  /** Get the current rendered HTML for a cell (may be stale) */
  getCachedRender(cellId: string): string | null;
}
```

---

## Markdown-it Configuration

Default plugins loaded on the parser:

| Plugin                  | Purpose                              |
|-------------------------|--------------------------------------|
| `markdown-it-footnote`  | Footnote syntax `[^1]`               |
| `markdown-it-task-lists`| Checkbox lists `- [x]`               |
| `markdown-it-anchor`    | Heading anchors for TOC              |
| `markdown-it-toc`       | Table of contents generation         |
| `markdown-it-attrs`     | Custom attributes `{.class #id}`     |
| `markdown-it-container` | Custom containers `:::name`          |
| `markdown-it-sub`       | Subscript `~sub~`                    |
| `markdown-it-sup`       | Superscript `^sup^`                  |
| `markdown-it-mark`      | Highlighted text `==mark==`          |

All of these are optional and loaded only if the user opts in (tree-shakeable).

---

## Sanitization

By default, rendered HTML is passed through a sanitizer before being injected
into the DOM. The default sanitizer is **DOMPurify** with a permissive
scientific config:

```typescript
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
    "ul", "ol", "li", "blockquote", "pre", "code",
    "table", "thead", "tbody", "tr", "th", "td",
    "a", "img", "em", "strong", "del", "mark", "sub", "sup",
    "span", "div", "figure", "figcaption", "details", "summary",
    "input", // for checkboxes
    "svg", "path", "circle", "rect", "line", "polyline", "polygon",
    "math", "mi", "mo", "mn", "msup", "msub", "mfrac", "mrow", "mtext",
  ],
  ALLOWED_ATTR: [
    "href", "src", "alt", "title", "class", "id", "style",
    "width", "height", "align", "colspan", "rowspan",
    "type", "checked", "disabled",
    "viewBox", "xmlns", "d", "fill", "stroke", "stroke-width",
    "data-*",
  ],
  ALLOW_DATA_ATTR: true,
};
```

Sanitization can be disabled per-cell via `metadata.trusted = true` for
embed cells that need full HTML access.

---

## Syntax Highlighting for Code Blocks

Code blocks (`type: "code"` or fenced blocks in markdown cells) are
highlighted using a lazy-loaded highlighter:

```typescript
interface SyntaxHighlighter {
  /** Highlight code and return HTML */
  highlight(code: string, language: string): string | Promise<string>;

  /** List of supported languages */
  languages(): string[];

  /** Load a language grammar on demand */
  loadLanguage(lang: string): Promise<void>;
}
```

The default implementation uses **Shiki** (TextMate grammars, same as VS Code)
loaded lazily per-language. A lighter **Prism.js** adapter is also available.
