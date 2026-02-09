# React API Reference

El paquete `@velo-sci/notebook-react` provee componentes React y hooks para integrar el editor de notebooks.

---

## Componentes

### `SciNotebook`

Componente principal que renderiza un notebook completo con toolbar, celdas, insert handles, y empty state.

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

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `notebook` | `Notebook` | — | Datos iniciales del notebook |
| `theme` | `"light" \| "dark"` | `"light"` | Tema visual |
| `onChange` | `(nb: Notebook) => void` | — | Callback en cada cambio |
| `onCellFocus` | `(cellId: string) => void` | — | Callback al enfocar celda |
| `engineRef` | `MutableRefObject<EditorEngine>` | — | Ref para acceso imperativo al engine |
| `readOnly` | `boolean` | `false` | Modo solo lectura |
| `showToolbar` | `boolean` | `true` | Mostrar/ocultar toolbar |
| `plugins` | `SciNotebookPlugin[]` | `[]` | Plugins a registrar |

---

### `Cell`

Renderiza una celda individual. Maneja automáticamente el dispatch a editores especializados según el tipo:

- `markdown` → Textarea + FloatingToolbar
- `code` → Textarea monoespaciada
- `latex` → MathEditor (editor visual de fórmulas)
- `image` → ImageCell (upload, URL, resize, caption)
- `embed` → EmbedCell (presets, iframe, sandbox)
- `raw` → Textarea simple

```tsx
interface CellProps {
  cellId: string;
  pipeline: RenderPipeline;
  index: number;
  totalCells: number;
}
```

Normalmente no necesitas usar `Cell` directamente — `SciNotebook` lo maneja internamente.

---

### `MathEditor`

Editor visual de fórmulas LaTeX con paleta de bloques y preview en tiempo real.

```tsx
interface MathEditorProps {
  cellId: string;       // ID de la celda
  source: string;       // Código LaTeX (con $$ wrappers)
  onExit: () => void;   // Callback al salir
}
```

**Features:**
- 9 categorías de bloques (100+ símbolos y estructuras)
- Modo dual: Preview visual (KaTeX) + modo raw LaTeX
- Inserción inteligente en posición del cursor
- Atajos: `Escape` (salir), `Shift+Enter` (siguiente celda)

Ver [Guía del Math Editor](../guide/math-editor.md) para documentación completa.

---

### `ImageCell`

Editor de celdas de imagen con upload y metadatos.

```tsx
interface ImageCellProps {
  cellId: string;
  source: string;                    // URL o data URL de la imagen
  metadata: Record<string, unknown>; // alt, caption, width, align
  onExit: () => void;
}
```

**Features:**
- Drag & drop de archivos (convierte a data URL)
- Input de URL para imágenes remotas
- Controles: alt text, caption, ancho (25%–100%), alineación (izq/centro/der)
- Botón para limpiar imagen

**Función auxiliar:**
```tsx
// Genera HTML para modo vista
renderImagePreview(source: string, metadata: Record<string, unknown>): string
```

---

### `EmbedCell`

Editor de contenido embebido vía iframe.

```tsx
interface EmbedCellProps {
  cellId: string;
  source: string;                    // URL del iframe
  metadata: Record<string, unknown>; // title, height, sandbox
  onExit: () => void;
}
```

**Features:**
- Presets: YouTube, CodePen, Observable, Desmos, GeoGebra
- Input de URL personalizada
- Toggle de preview con iframe en vivo
- Configuración: título, altura (200–600px), nivel de sandbox

**Función auxiliar:**
```tsx
renderEmbedPreview(source: string, metadata: Record<string, unknown>): string
```

---

### `FloatingToolbar`

Toolbar contextual que aparece al seleccionar texto en celdas Markdown.

```tsx
interface FloatingToolbarProps {
  cellId: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}
```

**Acciones disponibles:**
- **B** — Bold (`**texto**`)
- **I** — Italic (`*texto*`)
- **S** — Strikethrough (`~~texto~~`)
- **\<\>** — Inline code (`` `texto` ``)
- **H1** — Heading 1 (`# `)
- **H2** — Heading 2 (`## `)
- **🔗** — Link (`[texto](url)`)
- **•** — Lista (`- `)

---

### `InsertHandle`

Botón `+` que aparece entre celdas al hacer hover. Muestra un menú con los 6 tipos de celda disponibles.

```tsx
interface InsertHandleProps {
  index: number; // Posición donde insertar la nueva celda
}
```

**Tipos disponibles en el menú:**
Markdown, Code, LaTeX, Imagen, Embed, Raw

---

## Hooks

### `useSciNotebook()`

Retorna la instancia de `EditorEngine` del contexto. Debe usarse dentro de `SciNotebook`.

```tsx
const engine = useSciNotebook();
engine.insertCell(0, 'markdown', '# Nuevo');
engine.undo();
```

### `useNotebook()`

Retorna el objeto `Notebook` actual. Se re-renderiza automáticamente cuando el notebook cambia.

```tsx
const notebook = useNotebook();
console.log(notebook.cells.length);
```

### `useCell(cellId: string)`

Retorna los datos de una celda específica. Optimizado para solo re-renderizar cuando esa celda cambia.

```tsx
const cell = useCell('cell-1');
console.log(cell.type, cell.source);
```

### `useFocusedCell()`

Retorna el ID de la celda enfocada actualmente.

```tsx
const focusedId = useFocusedCell();
```

### `useNotebookEvent(event, handler)`

Suscribe a un evento del engine. Se limpia automáticamente al desmontar.

```tsx
useNotebookEvent('cell:updated', (payload) => {
  console.log('Cell changed:', payload.data.cellId);
});
```

---

## Exports

```typescript
// Componentes
export { SciNotebook } from './components/SciNotebook';
export { Cell } from './components/Cell';
export { MathEditor } from './components/MathEditor';
export { ImageCell, renderImagePreview } from './components/ImageCell';
export { EmbedCell, renderEmbedPreview } from './components/EmbedCell';
export { FloatingToolbar } from './components/FloatingToolbar';
export { InsertHandle } from './components/InsertHandle';

// Hooks
export { useSciNotebook, useNotebook, useCell, useFocusedCell, useNotebookEvent } from './hooks';
```
