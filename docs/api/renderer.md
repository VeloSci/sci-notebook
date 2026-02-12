# Renderer API Reference

The `@velo-sci/notebook-renderer` package provides a highly extensible pipeline for transforming raw cell data into rich HTML.

## RenderPipeline

The `RenderPipeline` is the main entry point for rendering. It manages a sequence of transformations: **Preprocessing** → **Parsing (AST)** → **AST Transformation** → **Rendering** → **Postprocessing**.

### Constructor

```typescript
const pipeline = new RenderPipeline(parser?: MarkdownParser, cacheSize?: number);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `parser` | `MarkdownParser` | `new MarkdownItParser()` | Custom markdown parser implementation |
| `cacheSize` | `number` | `200` | Maximum entries in the LRU render cache |

The constructor automatically registers two built-in postprocessors:
- **`builtin:math`** (priority -10) — Renders inline/display math in markdown cells
- **`builtin:code-highlight`** (priority -5) — Syntax-highlights code cells

### Types

```typescript
interface RenderedCell {
  cellId: string;
  html: string;
  renderTime: number; // in milliseconds
  cached: boolean;    // whether it was a cache hit
}

type Preprocessor = (source: string, cell: Cell) => string;
type ASTTransformer = (tokens: Token[], cell: Cell) => Token[];
type PostProcessor = (html: string, cell: Cell) => string;
```

### Methods

#### `render(cell: Cell): RenderedCell`
The primary method to render a cell. Returns a `RenderedCell` object with the HTML output and performance metrics.

#### `addPreprocessor(id: string, fn: Preprocessor, priority?: number): void`
Adds a function to modify the raw source before parsing. Higher priority runs first.

#### `addASTTransformer(id: string, fn: ASTTransformer, priority?: number): void`
Adds a function to modify the Markdown-It tokens (AST) before rendering.

#### `addRenderer(renderer: CellRenderer): void`
Adds a custom renderer for specific cell types or language tags.

#### `addPostprocessor(id: string, fn: PostProcessor, priority?: number): void`
Adds a function to modify the final HTML string.

#### `remove(id: string): void`
Removes a preprocessor, AST transformer, renderer, or postprocessor by its ID.

#### `invalidateCache(cellId?: string): void`
Clears the render cache. If `cellId` is provided, only that cell's cache entry is removed.

---

## Custom Renderers

To support new cell types, implement the `CellRenderer` interface:

```typescript
interface CellRenderer {
  id: string;
  cellTypes: CellType[];
  renderToHTML?(tokens: Token[], cell: Cell): string | null;
  priority?: number;
}
```

Example — custom LaTeX renderer:

```typescript
pipeline.addRenderer({
  id: 'latex-renderer',
  cellTypes: ['latex'],
  renderToHTML: (tokens, cell) => {
    return katex.renderToString(cell.source);
  }
});
```

---

## Caching Strategy

The pipeline includes an internal **LRU Cache** (Least Recently Used). Cells are cached based on a FNV-1a hash of their `type`, `source`, and `metadata`. This ensures that expensive renders (like large Mermaid diagrams or complex LaTeX) are only performed when necessary.

---

## Additional Exports

The renderer package also exports:

- **`MarkdownItParser`** — Default markdown-it based parser implementation
- **`LRUCache`** — Generic LRU cache with `get`, `set`, `delete`, `clear`
- **`hashString`** — FNV-1a string hashing utility
- **`highlightCodeTokens`** — Basic code syntax highlighting
- **`initShikiHighlighter` / `highlightWithShiki`** — Shiki-based syntax highlighting (30+ languages, dual theme)
- **`ensureKaTeX` / `isKaTeXAvailable` / `createLazyKaTeXPostprocessor`** — Lazy KaTeX loading utilities
- **`DOMCellBuilder`** — DOM-based cell rendering for vanilla/non-React adapters
- **`mathCategories`** — 9 categories of math symbols/structures for the visual formula editor
