# 09 — Performance & Optimization

## Performance Budget

| Metric                          | Target           | Notes                          |
|---------------------------------|------------------|--------------------------------|
| Initial load (core only)        | < 50 KB gzipped  | No plugins loaded              |
| Time to interactive             | < 200 ms         | Empty notebook, no plugins     |
| Cell render (markdown, cached)  | < 1 ms           | From cache hit                 |
| Cell render (markdown, cold)    | < 10 ms          | Parse + render + sanitize      |
| Cell render (LaTeX, cold)       | < 30 ms          | KaTeX render                   |
| Cell render (Mermaid, cold)     | < 200 ms         | SVG generation                 |
| Keystroke latency               | < 16 ms          | No frame drops during typing   |
| AI ghost text appearance        | < 600 ms         | Debounce + network             |
| Notebook with 500 cells         | Smooth scrolling | Virtual rendering              |
| Notebook with 2000 cells        | Usable           | Degraded but functional        |

---

## Virtual Rendering

For notebooks with many cells, rendering all cells to the DOM is wasteful.
The virtual renderer only mounts cells that are visible in the viewport
(plus a configurable overscan buffer).

### Architecture

```
┌─────────────────────────────────────┐
│          Scroll Container           │
│  ┌───────────────────────────────┐  │
│  │     Spacer (top)              │  │  ← height = sum of unmounted cells above
│  ├───────────────────────────────┤  │
│  │     Cell N (mounted)          │  │
│  │     Cell N+1 (mounted)        │  │  ← only visible cells + overscan
│  │     Cell N+2 (mounted)        │  │
│  │     ...                       │  │
│  │     Cell N+K (mounted)        │  │
│  ├───────────────────────────────┤  │
│  │     Spacer (bottom)           │  │  ← height = sum of unmounted cells below
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Cell Height Estimation

Since cells have variable heights, the virtual renderer needs height estimates:

1. **Initial estimate**: Based on cell type and source length.
   - Markdown: `max(40, lineCount * 24)` px.
   - Code: `max(60, lineCount * 20)` px.
   - LaTeX: `80` px (display block estimate).
   - Mermaid: `200` px.
2. **Measured height**: After a cell is mounted, its actual DOM height is
   recorded in a height cache.
3. **Cache persistence**: Heights are stored in memory (not persisted).
   On re-mount, measured heights are reused.

```typescript
interface VirtualRenderer {
  /** Total number of cells */
  totalCount: number;

  /** Set the scroll container element */
  setContainer(el: HTMLElement): void;

  /** Update the cell list */
  setCells(cells: ReadonlyArray<Cell>): void;

  /** Get the range of cells to mount */
  getVisibleRange(): { startIndex: number; endIndex: number };

  /** Report a cell's measured height after mount */
  reportHeight(index: number, height: number): void;

  /** Get the total estimated scroll height */
  getTotalHeight(): number;

  /** Get the top offset for a specific cell index */
  getOffsetForIndex(index: number): number;

  /** Scroll to a specific cell */
  scrollToCell(index: number, align?: "start" | "center" | "end"): void;

  /** Overscan count (cells to render above/below viewport) */
  overscan: number;

  /** Destroy and clean up listeners */
  destroy(): void;
}
```

### Activation Threshold

Virtual rendering is only activated when the notebook exceeds a configurable
cell count (default: 50 cells). Below that threshold, all cells are mounted
normally to avoid the complexity overhead.

---

## Incremental Parsing

When a cell's source changes, only that cell needs re-parsing. The rendering
pipeline tracks dirty cells and only re-renders them.

### Dirty Tracking

```typescript
class DirtyTracker {
  private dirty: Set<string>; // cell IDs

  markDirty(cellId: string): void;
  markClean(cellId: string): void;
  isDirty(cellId: string): boolean;
  getDirtyIds(): string[];
  clearAll(): void;
}
```

### Render Scheduling

Renders are batched using `requestAnimationFrame`:

```typescript
class RenderScheduler {
  private pending: boolean = false;
  private dirtyTracker: DirtyTracker;
  private pipeline: RenderPipeline;
  private onRender: (results: RenderedCell[]) => void;

  constructor(dirtyTracker: DirtyTracker, pipeline: RenderPipeline, onRender: (r: RenderedCell[]) => void);

  /** Schedule a render pass */
  schedule(): void;

  /** Force immediate render (bypasses RAF) */
  flush(): RenderedCell[];

  /** Cancel pending render */
  cancel(): void;
}
```

The scheduler coalesces multiple `markDirty` calls within the same frame
into a single render pass.

---

## Render Caching

### Content-Addressed Cache

```typescript
class LRUCache<K, V> {
  private map: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number);

  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  get size(): number;
}
```

Cache key generation:

```typescript
function cacheKey(cell: Cell): string {
  // Fast hash of type + source + relevant metadata
  return fnv1a(`${cell.type}:${cell.source}:${cell.metadata.language || ""}`);
}
```

Using FNV-1a hash (fast, non-cryptographic, good distribution).

### Cache Invalidation Rules

| Event                  | Invalidation                          |
|------------------------|---------------------------------------|
| Cell source changed    | Invalidate that cell's cache entry    |
| Cell type changed      | Invalidate that cell's cache entry    |
| Cell metadata changed  | Invalidate if rendering-relevant      |
| Plugin registered      | Clear entire cache                    |
| Plugin unregistered    | Clear entire cache                    |
| Theme changed          | Clear entire cache (Mermaid depends)  |
| Notebook replaced      | Clear entire cache                    |

---

## Lazy Plugin Loading

Plugins are loaded on demand to minimize initial bundle size.

### Dynamic Import Pattern

```typescript
// Instead of:
import { latexPlugin } from "@sci-notebook/plugin-latex";

// Use lazy loading:
const latexPlugin = () => import("@sci-notebook/plugin-latex").then(m => m.latexPlugin());
```

### Plugin Loader

```typescript
type LazyPlugin = SciNotebookPlugin | (() => Promise<SciNotebookPlugin>);

class PluginLoader {
  /** Register a plugin (eager or lazy) */
  register(plugin: LazyPlugin): void;

  /** Load all lazy plugins that haven't been loaded yet */
  loadAll(): Promise<void>;

  /** Load a specific lazy plugin by ID */
  load(pluginId: string): Promise<SciNotebookPlugin>;

  /** Check if a plugin is loaded */
  isLoaded(pluginId: string): boolean;
}
```

### Load Triggers

Lazy plugins are loaded when:
1. A cell of the plugin's registered type is first encountered.
2. The user explicitly triggers a plugin action (toolbar button).
3. `loadAll()` is called (e.g., after initial render).

---

## Web Worker Offloading

Heavy operations can be offloaded to a Web Worker:

### Candidates for Worker Offloading

| Operation              | Worker?  | Rationale                            |
|------------------------|----------|--------------------------------------|
| Markdown parsing       | Optional | Fast enough on main thread usually   |
| KaTeX rendering        | No       | Needs DOM (uses `document.createElement`) |
| Mermaid rendering      | No       | Needs DOM                            |
| Syntax highlighting    | Yes      | Shiki can run in a worker            |
| AI request handling    | No       | Uses `fetch`, works on main thread   |
| Search across cells    | Yes      | Can be slow for large notebooks      |
| Notebook validation    | Yes      | Pure computation                     |
| JSON serialization     | Optional | Only for very large notebooks        |

### Worker Communication

```typescript
interface WorkerMessage {
  id: string;
  type: string;
  payload: unknown;
}

interface WorkerResponse {
  id: string;
  type: string;
  result?: unknown;
  error?: string;
}

class WorkerPool {
  private workers: Worker[];
  private pending: Map<string, { resolve: Function; reject: Function }>;
  private roundRobin: number;

  constructor(workerUrl: string, poolSize?: number);

  /** Send a task to a worker and get a promise for the result */
  execute<T>(type: string, payload: unknown): Promise<T>;

  /** Terminate all workers */
  destroy(): void;
}
```

---

## Memory Management

### Large Notebook Considerations

- **Cell source strings**: For a 2000-cell notebook with average 500 chars
  per cell, that's ~1 MB of source text. Acceptable.
- **Rendered HTML cache**: 200 entries × ~2 KB average = ~400 KB. Acceptable.
- **Undo history**: 100 snapshots × diff size. Using structural sharing
  (only changed cells are cloned), memory is proportional to edits, not
  notebook size.

### Structural Sharing for Undo

Instead of cloning the entire notebook on each edit:

```typescript
// Bad: full clone
history.push(structuredClone(notebook));

// Good: structural sharing
history.push({
  ...notebook,
  cells: notebook.cells.map((cell, i) =>
    i === changedIndex ? { ...cell, source: newSource } : cell
  ),
});
```

Only the modified cell object is new. All other cell references are shared.

---

## Benchmarking

The library includes a benchmark suite:

```typescript
// benchmarks/render.bench.ts
import { bench, describe } from "vitest";

describe("Rendering", () => {
  bench("markdown cell (short)", () => {
    pipeline.render(shortMarkdownCell);
  });

  bench("markdown cell (long, 500 lines)", () => {
    pipeline.render(longMarkdownCell);
  });

  bench("latex cell (complex formula)", () => {
    pipeline.render(complexLatexCell);
  });

  bench("100 cells sequential render", () => {
    cells.forEach(c => pipeline.render(c));
  });
});
```

Run with: `pnpm bench`

---

## Bundle Size Strategy

| Package              | Estimated gzipped | Strategy                    |
|----------------------|-------------------|-----------------------------|
| `core`               | ~15 KB            | Zero dependencies           |
| `renderer`           | ~25 KB            | markdown-it + DOMPurify     |
| `plugin-latex`       | ~90 KB            | KaTeX (lazy loaded)         |
| `plugin-mermaid`     | ~180 KB           | Mermaid (lazy loaded)       |
| `plugin-embeds`      | ~3 KB             | Minimal                     |
| `plugin-ai`          | ~8 KB             | Fetch-based, no heavy deps  |
| `plugin-images`      | ~5 KB             | Minimal                     |
| `plugin-tables`      | ~10 KB            | Minimal                     |
| `react`              | ~12 KB            | Thin adapter                |
| `vanilla`            | ~10 KB            | Thin adapter                |

**Total (core + renderer + react)**: ~52 KB gzipped — well under budget.
Plugins add weight only when used.
