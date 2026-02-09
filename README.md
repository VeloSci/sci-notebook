# Sci-Notebook

**El editor científico de notebooks más completo, modular y moderno.**

Framework-agnostic · Open Source · Zero-server · Plugin-first

---

## Qué es sci-notebook

Una librería TypeScript para crear editores de notebooks científicos con:

- **6 tipos de celda**: Markdown, Code, LaTeX, Image, Embed, Raw
- **Editor visual de fórmulas** con 100+ bloques pre-armados (fracciones, integrales, matrices, griegos, operadores...)
- **Rendering LaTeX** en tiempo real vía KaTeX
- **Celdas de imagen** con drag & drop, URL, resize, caption, alt text
- **Contenido embebido** (YouTube, CodePen, Desmos, GeoGebra, iframes)
- **Toolbar flotante** contextual para formato de texto
- **Insert handles** entre celdas para inserción rápida
- **Temas** light/dark con CSS custom properties
- **Undo/Redo** ilimitado con command pattern
- **Sistema de plugins** extensible en cada capa
- **AI integration** layer para completions y rewrites
- **66 tests** pasando, 5 paquetes, ~100KB total

---

## Quick Start

```bash
# 1. Instalar
pnpm add @sci-notebook/core @sci-notebook/react @sci-notebook/renderer

# 2. Opcional: LaTeX rendering
pnpm add katex
```

```tsx
import { SciNotebook } from '@sci-notebook/react';
import '@sci-notebook/core/styles/index.css';

const notebook = {
  id: 'my-notebook',
  title: 'Mi Notebook',
  cells: [
    { id: 'c1', type: 'markdown', source: '# Hola Mundo\n\nEscribe **aquí**...', metadata: {} },
    { id: 'c2', type: 'latex', source: '$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$', metadata: {} },
    { id: 'c3', type: 'code', source: 'console.log("Hello!");', metadata: { language: 'javascript' } },
  ],
  metadata: {},
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function App() {
  return (
    <SciNotebook
      notebook={notebook}
      onChange={(nb) => console.log('Updated:', nb)}
    />
  );
}
```

---

## Paquetes

| Paquete | Tamaño | Descripción |
|---------|--------|-------------|
| `@sci-notebook/core` | ~25KB | Modelo de datos, EditorEngine, EventBus, KeybindingManager, HistoryManager |
| `@sci-notebook/renderer` | ~5KB | Pipeline de rendering: Markdown → AST → HTML, LRU cache |
| `@sci-notebook/react` | ~54KB | Componentes React: SciNotebook, Cell, MathEditor, ImageCell, EmbedCell, FloatingToolbar, InsertHandle |
| `@sci-notebook/plugin-latex` | ~2KB | Rendering LaTeX inline/display vía KaTeX |
| `@sci-notebook/plugin-ai` | ~9KB | Inline completions, ghost text, OpenAI provider |

---

## Estructura del Monorepo

```
sci-notebook/
├── packages/
│   ├── core/           # Modelo, engine, eventos, tipos, CSS
│   ├── renderer/       # Pipeline Markdown → HTML
│   ├── react/          # Componentes React + hooks
│   ├── plugin-latex/   # KaTeX rendering
│   ├── plugin-ai/      # AI completions
│   └── example/        # App de ejemplo completa
├── docs/               # Documentación (VitePress)
└── vitest.config.ts
```

---

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Build todos los paquetes
pnpm -r build

# Correr tests
pnpm test

# Correr ejemplo (dev server en localhost:5180)
pnpm --filter @sci-notebook/example dev
```

---

## Tipos de Celda

### Markdown
Click para editar, toolbar flotante para formato (Bold, Italic, Code, Headings, Links, Lists). Rendering completo con markdown-it.

### Code
Bloques de código con metadata de lenguaje. Syntax highlighting vía pipeline.

### LaTeX
**Editor visual de fórmulas** con 9 categorías de bloques:
- Estructuras (fracciones, raíces, super/subíndices)
- Integrales (∫, ∬, ∭, ∮)
- Sumatorias (∑, ∏, lim)
- Matrices (2×2, 3×3, pmatrix, bmatrix, vmatrix, cases)
- Griegos (25 símbolos)
- Operadores (26 símbolos)
- Flechas, Funciones, Delimitadores

Modo dual: Preview visual con KaTeX + modo raw LaTeX.

### Image
Drag & drop de archivos, URL remota, alt text, caption, ancho configurable (25%-100%), alineación (izq/centro/der).

### Embed
Presets para YouTube, CodePen, Observable, Desmos, GeoGebra. URL personalizada, sandbox configurable, altura ajustable.

### Raw
Texto sin formato, tal cual.

---

## Interacciones

| Acción | Atajo |
|--------|-------|
| Editar celda | Click |
| Salir de edición | `Escape` |
| Siguiente celda | `Shift+Enter` |
| Bold | `Ctrl+B` |
| Italic | `Ctrl+I` |
| Indentar | `Tab` |
| Des-indentar | `Shift+Tab` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Shift+Z` |
| Insertar celda | Hover entre celdas → `+` |

---

## Documentación

Ver [`docs/`](./docs/) para:
- [Estudio competitivo](./docs/COMPETITIVE_STUDY.md) — Análisis de Jupyter, Notion, Overleaf, Mathcha, Observable, Quarto, Typst, CoCalc
- [Guía de arquitectura](./docs/guide/overview.md)
- [API Reference](./docs/api/)
- [Ejemplos](./docs/examples/)
- [Roadmap](./docs/roadmap.md)

---

## Licencia

MIT