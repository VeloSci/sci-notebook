<script setup>
import { cellTypesNotebook } from '../.vitepress/theme/notebooks/cell-types'
</script>

# Cell Types

<InteractiveDoc :notebook="cellTypesNotebook" title="Cell Types — Interactive Notebook" />

sci-notebook supports 8 built-in cell types. Each type has its own specialized editor and view mode.

---

## Markdown

The most versatile type. Supports the full CommonMark standard via markdown-it.

### Editing
- **Click** on the cell to enter edit mode
- **Floating toolbar**: select text to see formatting options (Bold, Italic, Strikethrough, Code, H1, H2, Link, List)
- **Shortcuts**: `Ctrl+B` (bold), `Ctrl+I` (italic), `Tab` (indent), `Shift+Tab` (outdent)

### Supported Syntax

```markdown
# Heading 1
## Heading 2

**Bold**, *italic*, ~~strikethrough~~, `inline code`

> Blockquote

- Unordered list
1. Ordered list

| Col A | Col B |
|-------|-------|
| data  | data  |

[Link](https://example.com)
![Image](url)

---

```code block```
```

### Cell Example

```json
{
  "id": "cell-1",
  "type": "markdown",
  "source": "# Title\n\nText with **formatting** and `code`.",
  "metadata": {}
}
```

---

## Code

Code blocks with language metadata. In view mode they render with `<pre><code>` and a language class for syntax highlighting via Shiki (30+ languages).

### Editing
- Textarea with monospaced font
- `Tab` inserts 2 spaces (does not change focus)
- `Shift+Enter` moves to the next cell

### Metadata

| Field | Type | Description |
|-------|------|-------------|
| `language` | `string` | Code language (e.g. `"javascript"`, `"python"`, `"rust"`) |

### Example

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

Mathematical formula cells with an **interactive visual editor**.

### Visual Editor (MathEditor)

Clicking on a LaTeX cell opens the MathEditor with:

1. **Block palette** organized in 9 categories:

| Category | Blocks | Example |
|----------|--------|---------|
| **Structures** | Fraction, root, superscript, subscript, hat, bar, vec, tilde, dot | `\frac{a}{b}`, `\sqrt{x}` |
| **Integrals** | Integral, definite integral, double, triple, contour | `\int_a^b`, `\oint` |
| **Summations** | Summation, product, limit | `\sum_{i=0}^{n}`, `\lim_{x\to 0}` |
| **Matrices** | 2×2, 3×3 in pmatrix, bmatrix, vmatrix, cases | `\begin{pmatrix}...\end{pmatrix}` |
| **Greek** | 25 symbols: α, β, γ, δ, ε, θ, λ, μ, π, σ, φ, ω, Γ, Δ, Θ, Λ, Σ, Φ, Ψ, Ω... | `\alpha`, `\Omega` |
| **Operators** | 26 symbols: ±, ×, ÷, ∂, ∇, ∞, ≈, ≠, ≤, ≥, ∈, ⊂, ∪, ∩, ∀, ∃... | `\pm`, `\nabla` |
| **Arrows** | →, ←, ↔, ⇒, ⇐, ⇔, ↦ | `\rightarrow`, `\Leftrightarrow` |
| **Functions** | sin, cos, tan, log, ln, exp, lim, max, min, det | `\sin(x)`, `\det(A)` |
| **Delimiters** | Parentheses, brackets, braces, absolute value, norm, floor, ceiling | `\left( ... \right)` |

2. **Dual mode**:
   - **Preview**: Shows the formula rendered with KaTeX in real time
   - **LaTeX**: Textarea for editing the LaTeX code directly

3. **Smart insertion**: Blocks are inserted at the cursor position. If text is selected, it replaces the first placeholder `▢`.

### Rendering

Formulas are rendered with KaTeX (if available) or as styled code as a fallback.

To enable KaTeX:
```ts
import katex from "katex";
import "katex/dist/katex.min.css";
(globalThis as any).katex = katex;
```

### Example

```json
{
  "id": "cell-3",
  "type": "latex",
  "source": "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
  "metadata": {}
}
```

---

## Table

Interactive table cells with a built-in editor.

### Editor (TableCell)
- Add/remove rows and columns
- Edit cells inline
- Renders as a Markdown table in view mode

### Example

```json
{
  "id": "cell-table",
  "type": "table",
  "source": "| Name | Value |\n|------|-------|\n| x | 42 |\n| y | 17 |",
  "metadata": {}
}
```

---

## Mermaid

Diagram cells rendered via the Mermaid library.

### Supported Diagram Types
- Flowcharts, sequence diagrams, Gantt charts, class diagrams, state diagrams, ER diagrams, pie charts

### Example

```json
{
  "id": "cell-mermaid",
  "type": "mermaid",
  "source": "graph TD\n    A[Start] --> B[Process]\n    B --> C[End]",
  "metadata": {}
}
```

---

## Image

Image cells with a full editor for upload, URL, and metadata.

### Editor (ImageCell)

- **Drag & drop**: Drag an image file onto the drop zone
- **File picker**: Click the drop zone to select a file
- **URL**: Enter the URL of a remote image
- **Controls**:

| Field | Type | Options |
|-------|------|---------|
| `alt` | `string` | Alt text (accessibility) |
| `caption` | `string` | Image caption |
| `width` | `string` | `"25%"`, `"50%"`, `"75%"`, `"100%"`, `"auto"` |
| `align` | `string` | `"left"`, `"center"`, `"right"` |

### Storage

- **Local files**: Converted to data URL (base64) and stored in `source`
- **Remote URLs**: Stored directly in `source`

### Example

```json
{
  "id": "cell-4",
  "type": "image",
  "source": "https://example.com/diagram.png",
  "metadata": {
    "alt": "Flow diagram",
    "caption": "System architecture",
    "width": "50%",
    "align": "center"
  }
}
```

---

## Embed

Embedded content via iframe with presets and sandbox configuration.

### Editor (EmbedCell)

1. **Quick presets**:

| Preset | URL Pattern |
|--------|-------------|
| YouTube | `https://www.youtube.com/embed/` |
| CodePen | `https://codepen.io/` |
| Observable | `https://observablehq.com/embed/` |
| Desmos | `https://www.desmos.com/calculator/` |
| GeoGebra | `https://www.geogebra.org/material/iframe/id/` |
| Custom | Any URL |

2. **Configuration**:

| Field | Type | Options |
|-------|------|---------|
| `title` | `string` | Title for accessibility |
| `height` | `string` | `"200px"` – `"600px"` |
| `sandbox` | `string` | `"allow-scripts allow-same-origin allow-popups"` (Standard), `"allow-scripts"` (Scripts only), `""` (Restricted) |

3. **Preview**: Toggle to show/hide the live iframe within the editor.

### Example

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

Unprocessed text. Displayed as-is in `<pre>`, without Markdown rendering or any other processing.

### Usage
- Raw data, logs, command output
- Content that should not be interpreted

### Example

```json
{
  "id": "cell-6",
  "type": "raw",
  "source": "2024-01-15 10:30:22 [INFO] Server started on port 3000\n2024-01-15 10:30:23 [INFO] Database connected",
  "metadata": {}
}
```

---

## Custom Types via Plugins

The plugin system allows registering additional cell types:

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

See [Plugin System](./plugin-system.md) for more details.
