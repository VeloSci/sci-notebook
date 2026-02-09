# Tipos de Celda

sci-notebook soporta 6 tipos de celda built-in. Cada tipo tiene su propio editor especializado y modo de visualización.

---

## Markdown

El tipo más versátil. Soporta el estándar CommonMark completo vía markdown-it.

### Edición
- **Click** en la celda para entrar en modo edición
- **Toolbar flotante**: selecciona texto para ver opciones de formato (Bold, Italic, Strikethrough, Code, H1, H2, Link, List)
- **Atajos**: `Ctrl+B` (bold), `Ctrl+I` (italic), `Tab` (indentar), `Shift+Tab` (des-indentar)

### Sintaxis soportada

```markdown
# Heading 1
## Heading 2

**Bold**, *italic*, ~~strikethrough~~, `inline code`

> Blockquote

- Lista no ordenada
1. Lista ordenada

| Col A | Col B |
|-------|-------|
| dato  | dato  |

[Link](https://example.com)
![Imagen](url)

---

```code block```
```

### Ejemplo de celda

```json
{
  "id": "cell-1",
  "type": "markdown",
  "source": "# Título\n\nTexto con **formato** y `código`.",
  "metadata": {}
}
```

---

## Code

Bloques de código con metadata de lenguaje. En modo vista se renderizan con `<pre><code>` y clase de lenguaje para syntax highlighting.

### Edición
- Textarea con fuente monoespaciada
- `Tab` inserta 2 espacios (no cambia foco)
- `Shift+Enter` pasa a la siguiente celda

### Metadata

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `language` | `string` | Lenguaje del código (e.g. `"javascript"`, `"python"`, `"rust"`) |

### Ejemplo

```json
{
  "id": "cell-2",
  "type": "code",
  "source": "function hello() {\n  console.log('Hello!');\n}",
  "metadata": { "language": "javascript" }
}
```

---

## LaTeX

Celdas de fórmulas matemáticas con **editor visual interactivo**.

### Editor Visual (MathEditor)

Al hacer click en una celda LaTeX se abre el MathEditor con:

1. **Paleta de bloques** organizada en 9 categorías:

| Categoría | Bloques | Ejemplo |
|-----------|---------|---------|
| **Estructuras** | Fracción, raíz, superíndice, subíndice, hat, bar, vec, tilde, dot | `\frac{a}{b}`, `\sqrt{x}` |
| **Integrales** | Integral, integral definida, doble, triple, contorno | `\int_a^b`, `\oint` |
| **Sumatorias** | Sumatoria, productoria, límite | `\sum_{i=0}^{n}`, `\lim_{x\to 0}` |
| **Matrices** | 2×2, 3×3 en pmatrix, bmatrix, vmatrix, cases | `\begin{pmatrix}...\end{pmatrix}` |
| **Griegos** | 25 símbolos: α, β, γ, δ, ε, θ, λ, μ, π, σ, φ, ω, Γ, Δ, Θ, Λ, Σ, Φ, Ψ, Ω... | `\alpha`, `\Omega` |
| **Operadores** | 26 símbolos: ±, ×, ÷, ∂, ∇, ∞, ≈, ≠, ≤, ≥, ∈, ⊂, ∪, ∩, ∀, ∃... | `\pm`, `\nabla` |
| **Flechas** | →, ←, ↔, ⇒, ⇐, ⇔, ↦ | `\rightarrow`, `\Leftrightarrow` |
| **Funciones** | sin, cos, tan, log, ln, exp, lim, max, min, det | `\sin(x)`, `\det(A)` |
| **Delimitadores** | Paréntesis, corchetes, llaves, valor absoluto, norma, piso, techo | `\left( ... \right)` |

2. **Modo dual**:
   - **Preview**: Muestra la fórmula renderizada con KaTeX en tiempo real
   - **LaTeX**: Textarea para editar el código LaTeX directamente

3. **Inserción inteligente**: Los bloques se insertan en la posición del cursor. Si hay texto seleccionado, reemplaza el primer placeholder `▢`.

### Rendering

Las fórmulas se renderizan con KaTeX (si está disponible) o como código estilizado como fallback.

Para habilitar KaTeX:
```ts
import katex from "katex";
import "katex/dist/katex.min.css";
(globalThis as any).katex = katex;
```

### Ejemplo

```json
{
  "id": "cell-3",
  "type": "latex",
  "source": "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
  "metadata": {}
}
```

---

## Image

Celdas de imagen con editor completo para upload, URL, y metadatos.

### Editor (ImageCell)

- **Drag & drop**: Arrastra un archivo de imagen sobre la zona de drop
- **File picker**: Click en la zona de drop para seleccionar archivo
- **URL**: Ingresa la URL de una imagen remota
- **Controles**:

| Campo | Tipo | Opciones |
|-------|------|----------|
| `alt` | `string` | Texto alternativo (accesibilidad) |
| `caption` | `string` | Pie de imagen |
| `width` | `string` | `"25%"`, `"50%"`, `"75%"`, `"100%"`, `"auto"` |
| `align` | `string` | `"left"`, `"center"`, `"right"` |

### Almacenamiento

- **Archivos locales**: Se convierten a data URL (base64) y se almacenan en `source`
- **URLs remotas**: Se almacenan directamente en `source`

### Ejemplo

```json
{
  "id": "cell-4",
  "type": "image",
  "source": "https://example.com/diagram.png",
  "metadata": {
    "alt": "Diagrama de flujo",
    "caption": "Arquitectura del sistema",
    "width": "50%",
    "align": "center"
  }
}
```

---

## Embed

Contenido embebido vía iframe con presets y configuración de sandbox.

### Editor (EmbedCell)

1. **Presets rápidos**:

| Preset | URL Pattern |
|--------|-------------|
| YouTube | `https://www.youtube.com/embed/` |
| CodePen | `https://codepen.io/` |
| Observable | `https://observablehq.com/embed/` |
| Desmos | `https://www.desmos.com/calculator/` |
| GeoGebra | `https://www.geogebra.org/material/iframe/id/` |
| Custom | Cualquier URL |

2. **Configuración**:

| Campo | Tipo | Opciones |
|-------|------|----------|
| `title` | `string` | Título para accesibilidad |
| `height` | `string` | `"200px"` – `"600px"` |
| `sandbox` | `string` | `"allow-scripts allow-same-origin allow-popups"` (Standard), `"allow-scripts"` (Solo scripts), `""` (Restringido) |

3. **Preview**: Toggle para ver/ocultar el iframe en vivo dentro del editor.

### Ejemplo

```json
{
  "id": "cell-5",
  "type": "embed",
  "source": "https://www.youtube.com/embed/aircAruvnKk",
  "metadata": {
    "title": "3Blue1Brown - Neural Networks",
    "height": "400px",
    "sandbox": "allow-scripts allow-same-origin allow-popups"
  }
}
```

---

## Raw

Texto sin procesar. Se muestra tal cual en `<pre>`, sin rendering de Markdown ni ningún otro procesamiento.

### Uso
- Datos crudos, logs, output de comandos
- Contenido que no debe ser interpretado

### Ejemplo

```json
{
  "id": "cell-6",
  "type": "raw",
  "source": "2024-01-15 10:30:22 [INFO] Server started on port 3000\n2024-01-15 10:30:23 [INFO] Database connected",
  "metadata": {}
}
```

---

## Tipos Custom vía Plugins

El sistema de plugins permite registrar tipos de celda adicionales:

```typescript
const myPlugin: SciNotebookPlugin = {
  id: 'sql-cells',
  name: 'SQL Cells',
  version: '1.0.0',
  cellTypes: [
    {
      type: 'sql',
      displayName: 'SQL Query',
      icon: 'database',
      supportsDualMode: true,
    }
  ],
  rendering: {
    renderers: [{
      id: 'sql-renderer',
      cellTypes: ['sql'],
      renderToHTML: (tokens, cell) => {
        return `<pre class="sql-cell"><code>${escapeHtml(cell.source)}</code></pre>`;
      }
    }]
  }
};
```

Ver [Plugin System](./plugin-system.md) para más detalles.
