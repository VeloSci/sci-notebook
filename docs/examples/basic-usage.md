# Ejemplo Completo — Todos los Tipos de Celda

Este ejemplo muestra cómo crear un notebook con los 6 tipos de celda disponibles, tema light/dark, y export/import JSON.

## Setup

```bash
pnpm add@velo-sci/notebook-core@velo-sci/notebook-react@velo-sci/notebook-renderer

# Opcional: rendering LaTeX con KaTeX
pnpm add katex
```

## Código Completo

```tsx
import React, { useState, useRef, useCallback } from "react";
import { SciNotebook } from "@velo-sci/notebook-react";
import { EditorEngine, Notebook } from "@velo-sci/notebook-core";
import "@velo-sci/notebook-core/styles/index.css";

// Opcional: KaTeX para rendering de fórmulas
import katex from "katex";
import "katex/dist/katex.min.css";
(globalThis as any).katex = katex;

const SAMPLE_NOTEBOOK: Notebook = {
  id: "demo_nb_1",
  title: "Sci-Notebook Demo",
  cells: [
    // ── Markdown ──
    {
      id: "c1",
      type: "markdown",
      source: "# Bienvenido a Sci-Notebook\n\nHaz **click** en cualquier celda para editarla.",
      metadata: {},
    },
    // ── Code ──
    {
      id: "c2",
      type: "code",
      source: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\nconsole.log(fibonacci(10)); // 55',
      metadata: { language: "javascript" },
    },
    // ── LaTeX ──
    {
      id: "c3",
      type: "latex",
      source: "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
      metadata: {},
    },
    // ── Image ──
    {
      id: "c4",
      type: "image",
      source: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Euler%27s_formula.svg/400px-Euler%27s_formula.svg.png",
      metadata: {
        alt: "Formula de Euler",
        caption: "Representación gráfica de la fórmula de Euler",
        width: "50%",
        align: "center",
      },
    },
    // ── Embed ──
    {
      id: "c5",
      type: "embed",
      source: "https://www.youtube.com/embed/aircAruvnKk",
      metadata: {
        title: "3Blue1Brown - Neural Networks",
        height: "400px",
        sandbox: "allow-scripts allow-same-origin allow-popups",
      },
    },
    // ── Raw ──
    {
      id: "c6",
      type: "raw",
      source: "Texto raw — se muestra tal cual, sin formato.",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook" },
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const engineRef = useRef<EditorEngine | null>(null);

  return (
    <div data-app-theme={theme}>
      <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <SciNotebook
        notebook={SAMPLE_NOTEBOOK}
        theme={theme}
        onChange={(nb) => console.log("Updated:", nb)}
        engineRef={engineRef}
      />
    </div>
  );
}
```

## Interacciones Disponibles

| Acción | Cómo |
|--------|------|
| **Editar celda** | Click en la celda |
| **Salir de edición** | `Escape` |
| **Siguiente celda** | `Shift+Enter` |
| **Bold / Italic** | `Ctrl+B` / `Ctrl+I` |
| **Indentar** | `Tab` / `Shift+Tab` |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Shift+Z` |
| **Insertar celda** | Hover entre celdas → click `+` |
| **Toolbar flotante** | Seleccionar texto en celda Markdown |

## Tipos de Celda

### Markdown
Rendering completo con markdown-it. Toolbar flotante para Bold, Italic, Strikethrough, Code, Headings, Links, Lists.

### Code
Bloques de código con metadata de lenguaje. Se muestra con `<pre><code>`.

### LaTeX
**Editor visual de fórmulas** con 9 categorías de bloques clickeables:
- Estructuras, Integrales, Sumatorias, Matrices, Griegos, Operadores, Flechas, Funciones, Delimitadores
- Modo dual: Preview visual (KaTeX) + modo raw LaTeX

### Image
- Drag & drop de archivos locales
- URL para imágenes remotas
- Alt text, caption, ancho (25%–100%), alineación

### Embed
- Presets: YouTube, CodePen, Observable, Desmos, GeoGebra
- URL personalizada con iframe sandboxed
- Altura y nivel de sandbox configurables

### Raw
Texto sin procesar, útil para datos crudos o logs.

## Correr el Ejemplo

```bash
# Desde la raíz del monorepo
pnpm --filter@velo-sci/notebook-example dev

# Abre http://localhost:5180
```
