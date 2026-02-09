# Renderer API Reference

The `@sci-notebook/renderer` package provides a highly extensible pipeline for transforming raw cell data into rich HTML.

## RenderPipeline

The `RenderPipeline` is the main entry point for rendering. It manages a sequence of transformations: **Preprocessing** -> **Parsing (AST)** -> **AST Transformation** -> **Rendering** -> **Postprocessing**.

### Configuration

```typescript
const pipeline = new RenderPipeline();
```

### Methods

#### `render(cell: Cell): RenderedCell`
The primary method to render a cell. It returns a `RenderedCell` object containing the HTML and performance metrics.

```typescript
interface RenderedCell {
  cellId: string;
  html: string;
  renderTime: number; // in milliseconds
  cached: boolean;    // whether it was a cache hit
}
```

#### `addPreprocessor(id: string, fn: Preprocessor, priority?: number)`
Adds a function to modify the raw source before parsing.

#### `addASTTransformer(id: string, fn: ASTTransformer, priority?: number)`
Adds a function to modify the Markdown-It tokens (AST) before rendering.

#### `addRenderer(renderer: CellRenderer)`
Adds a custom renderer for specific cell types or language tags.

#### `addPostprocessor(id: string, fn: PostProcessor, priority?: number)`
Adds a function to modify the final HTML string.

---

## Custom Renderers

To support new cell types, you can implement the `CellRenderer` interface:

```typescript
interface CellRenderer {
  id: string;
  cellTypes: CellType[];
  renderToHTML?(tokens: Token[], cell: Cell): string | null;
  priority?: number;
}
```

Example of a custom LaTeX renderer:

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

The pipeline includes an internal **LRU Cache** (Least Recently Used). Cells are cached based on a hash of their `type`, `source`, and `metadata`. This ensures that expensive renders (like large Mermaid diagrams or complex LaTeX) are only performed when necessary.
