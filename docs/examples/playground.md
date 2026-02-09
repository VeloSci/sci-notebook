# Playground Interactivo

Experimenta sci-notebook directamente en tu browser. El ejemplo incluye los 6 tipos de celda, tema light/dark, y export/import JSON.

## Correr el Playground

```bash
# Desde la raíz del monorepo
pnpm install
pnpm -r build
pnpm --filter@velo-sci/notebook-example dev
```

Abre **http://localhost:5180** en tu browser.

---

## Qué Puedes Hacer

### Edición
- **Click** en cualquier celda para editarla
- **Escape** para salir del modo edición
- **Shift+Enter** para pasar a la siguiente celda

### Markdown
- Escribe Markdown con formato completo (headings, bold, italic, tablas, listas, links)
- **Selecciona texto** para ver la toolbar flotante con opciones de formato
- Atajos: `Ctrl+B` (bold), `Ctrl+I` (italic), `Tab` (indentar)

### Fórmulas LaTeX
- Click en una celda LaTeX para abrir el **editor visual de fórmulas**
- Usa la **paleta de bloques** para insertar fracciones, integrales, matrices, griegos, etc.
- Alterna entre **modo Preview** (visual) y **modo LaTeX** (raw)
- La fórmula se renderiza en tiempo real con KaTeX

### Imágenes
- **Drag & drop** un archivo de imagen sobre la celda
- O ingresa una **URL** de imagen remota
- Configura: alt text, caption, ancho, alineación

### Embeds
- Elige un **preset** (YouTube, CodePen, Desmos, GeoGebra, Observable)
- O ingresa cualquier **URL** para iframe
- Configura: título, altura, nivel de sandbox

### Gestión de Celdas
- **Hover entre celdas** → botón `+` para insertar nueva celda
- **Botones laterales**: mover arriba/abajo, duplicar, eliminar
- **Toolbar**: undo/redo, agregar celda, cambiar modo (edit all / view all)

### Temas y Export
- **Toggle light/dark** en el header
- **Export JSON**: descarga el notebook como JSON
- **Import JSON**: carga un notebook desde JSON

---

## Stack Técnico

El playground usa exactamente el mismo código que usarías en producción:

| Capa | Paquete | Rol |
|------|---------|-----|
| **Engine** | `@velo-sci/notebook-core` | Estado, undo/redo, eventos, keybindings |
| **Rendering** | `@velo-sci/notebook-renderer` | Markdown → AST → HTML, LRU cache |
| **UI** | `@velo-sci/notebook-react` | SciNotebook, Cell, MathEditor, ImageCell, EmbedCell |
| **LaTeX** | `katex` | Rendering de fórmulas en tiempo real |
| **Build** | `vite` | Dev server con HMR |

---

## Contenido del Demo

El notebook de ejemplo incluye 10 celdas:

1. **Markdown** — Bienvenida con formato
2. **Markdown** — Tabla de features
3. **Code** — Función Fibonacci en JavaScript
4. **Markdown** — Guía de interacciones
5. **LaTeX** — Integral gaussiana (∫₀^∞ e^{-x²} dx)
6. **Markdown** — Descripción del editor de fórmulas
7. **Image** — Fórmula de Euler (Wikipedia)
8. **Embed** — Video de 3Blue1Brown (YouTube)
9. **Raw** — Texto sin formato
10. **Markdown** — Tabla resumen de tipos de celda
