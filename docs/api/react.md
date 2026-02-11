# React API Reference

The `@velo-sci/notebook-react` package provides React components and hooks for integrating the notebook editor.

---

## Components

### `SciNotebook`

Main component that renders a full notebook with toolbar, cells, insert handles, and empty state.

```tsx
import { SciNotebook } from '@velo-sci/notebook-react';
import '@velo-sci/notebook-core/styles/index.css';

<SciNotebook
  notebook={initialNotebook}
  theme="dark"
  onChange={(nb) => console.log('Updated', nb)}
  onCellFocus={(cellId) => console.log('Focused:', cellId)}
  engineRef={engineRef}
  readOnly={false}
  showToolbar={true}
  plugins={[latexPlugin]}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notebook` | `Notebook` | — | Initial notebook data |
| `theme` | `"light" \| "dark"` | `"light"` | Visual theme |
| `onChange` | `(nb: Notebook) => void` | — | Callback on every change |
| `onCellFocus` | `(cellId: string) => void` | — | Callback when a cell is focused |
| `engineRef` | `MutableRefObject<EditorEngine>` | — | Ref for imperative engine access |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `showToolbar` | `boolean` | `true` | Show/hide toolbar |
| `showTOC` | `boolean` | `false` | Show/hide table of contents sidebar |
| `plugins` | `SciNotebookPlugin[]` | `[]` | Plugins to register |

---

### `Cell`

Renders an individual cell. Automatically dispatches to specialized editors based on type:

- `markdown` → Textarea + FloatingToolbar
- `code` → Monospaced textarea
- `latex` → MathEditor (visual formula editor)
- `table` → TableCell (interactive table editor)
- `mermaid` → MermaidPreview (diagram rendering)
- `image` → ImageCell (upload, URL, resize, caption)
- `embed` → EmbedCell (presets, iframe, sandbox)
- `raw` → Simple textarea

```tsx
interface CellProps {
  cellId: string;
  pipeline: RenderPipeline;
  index: number;
  totalCells: number;
}
```

You normally don't need to use `Cell` directly — `SciNotebook` handles it internally.

---

### `MathEditor`

Visual LaTeX formula editor with block palette and real-time preview.

```tsx
interface MathEditorProps {
  cellId: string;       // Cell ID
  source: string;       // LaTeX code (with $$ wrappers)
  onExit: () => void;   // Callback when exiting
}
```

**Features:**
- 9 block categories (100+ symbols and structures)
- Dual mode: Visual preview (KaTeX) + raw LaTeX mode
- Smart insertion at cursor position
- Shortcuts: `Escape` (exit), `Shift+Enter` (next cell)

See [Visual Formula Editor Guide](../guide/math-editor.md) for full documentation.

---

### `ImageCell`

Image cell editor with upload and metadata controls.

```tsx
interface ImageCellProps {
  cellId: string;
  source: string;                    // URL or data URL of the image
  metadata: Record<string, unknown>; // alt, caption, width, align
  onExit: () => void;
}
```

**Features:**
- Drag & drop file upload (converts to data URL)
- URL input for remote images
- Controls: alt text, caption, width (25%–100%), alignment (left/center/right)
- Clear image button

**Helper function:**
```tsx
// Generates HTML for view mode
renderImagePreview(source: string, metadata: Record<string, unknown>): string
```

---

### `EmbedCell`

Embedded content editor via iframe.

```tsx
interface EmbedCellProps {
  cellId: string;
  source: string;                    // iframe URL
  metadata: Record<string, unknown>; // title, height, sandbox
  onExit: () => void;
}
```

**Features:**
- Presets: YouTube, CodePen, Observable, Desmos, GeoGebra
- Custom URL input
- Live iframe preview toggle
- Configuration: title, height (200–600px), sandbox level

**Helper function:**
```tsx
renderEmbedPreview(source: string, metadata: Record<string, unknown>): string
```

---

### `FloatingToolbar`

Contextual toolbar that appears when selecting text in Markdown cells.

```tsx
interface FloatingToolbarProps {
  cellId: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}
```

**Available actions:**
- **B** — Bold (`**text**`)
- **I** — Italic (`*text*`)
- **S** — Strikethrough (`~~text~~`)
- **<>** — Inline code (`` `text` ``)
- **H1** — Heading 1 (`# `)
- **H2** — Heading 2 (`## `)
- **🔗** — Link (`[text](url)`)
- **•** — List (`- `)

---

### `InsertHandle`

`+` button that appears between cells on hover. Shows a menu with all 8 available cell types.

```tsx
interface InsertHandleProps {
  index: number; // Position where the new cell will be inserted
}
```

**Available types in the menu:**
Markdown, Code, LaTeX, Table, Mermaid, Image, Embed, Raw

---

## Hooks

### `useSciNotebook()`

Returns the `EditorEngine` instance from context. Must be used within `SciNotebook`.

```tsx
const engine = useSciNotebook();
engine.insertCell(0, 'markdown', '# New Cell');
engine.undo();
```

### `useNotebook()`

Returns the current `Notebook` object. Re-renders automatically when the notebook changes.

```tsx
const notebook = useNotebook();
console.log(notebook.cells.length);
```

### `useCell(cellId: string)`

Returns the data for a specific cell. Optimized to only re-render when that cell changes.

```tsx
const cell = useCell('cell-1');
console.log(cell.type, cell.source);
```

### `useFocusedCell()`

Returns the ID of the currently focused cell.

```tsx
const focusedId = useFocusedCell();
```

### `useNotebookEvent(event, handler)`

Subscribes to an engine event. Automatically cleans up on unmount.

```tsx
useNotebookEvent('cell:updated', (payload) => {
  console.log('Cell changed:', payload.data.cellId);
});
```

---

## Exports

```typescript
// Components
export { SciNotebook } from './components/SciNotebook';
export { Cell } from './components/Cell';
export { MathEditor } from './components/MathEditor';
export { ImageCell, renderImagePreview } from './components/ImageCell';
export { EmbedCell, renderEmbedPreview } from './components/EmbedCell';
export { FloatingToolbar } from './components/FloatingToolbar';
export { InsertHandle } from './components/InsertHandle';
export { MermaidPreview, initMermaid } from './components/MermaidCell';
export { AIRewrite } from './components/AIRewrite';
export { AICellGenerate } from './components/AICellGenerate';

// Hooks
export { useSciNotebook, useNotebook, useCell, useFocusedCell, useNotebookEvent } from './hooks';
```
