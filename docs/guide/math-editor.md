<script setup>
import { mathEditorNotebook } from '../.vitepress/theme/notebooks/math-editor'
</script>

# Visual Formula Editor (MathEditor)

<InteractiveDoc :notebook="mathEditorNotebook" title="Visual Formula Editor — Interactive Notebook" />

The MathEditor is the flagship component of sci-notebook: a visual mathematical formula editor (similar to Word/Mathcha) that lets you build complex expressions without needing to know LaTeX.

---

## How It Works

1. **Create a LaTeX cell** (from the `+` menu between cells or by changing an existing cell's type)
2. **Click** on the cell to open the MathEditor
3. **Select a category** from the tab bar
4. **Click a block** to insert it into the formula
5. **Toggle** between Preview (visual) and LaTeX (raw) mode
6. **Escape** to exit and see the rendered result

---

## Block Categories

### Structures
The fundamental blocks for building expressions:

| Block | LaTeX | Result |
|-------|-------|--------|
| Fraction | `\frac{▢}{▢}` | a/b |
| Root | `\sqrt{▢}` | √x |
| Superscript | `^{▢}` | x² |
| Subscript | `_{▢}` | xᵢ |
| Hat | `\hat{▢}` | x̂ |
| Bar | `\bar{▢}` | x̄ |
| Vec | `\vec{▢}` | x⃗ |
| Tilde | `\tilde{▢}` | x̃ |
| Dot | `\dot{▢}` | ẋ |

### Integrals

| Block | LaTeX |
|-------|-------|
| Integral | `\int ▢` |
| Definite integral | `\int_{▢}^{▢} ▢` |
| Double integral | `\iint ▢` |
| Triple integral | `\iiint ▢` |
| Contour integral | `\oint ▢` |

### Summations

| Block | LaTeX |
|-------|-------|
| Summation | `\sum_{▢}^{▢} ▢` |
| Product | `\prod_{▢}^{▢} ▢` |
| Limit | `\lim_{▢ \to ▢} ▢` |

### Matrices

| Block | LaTeX | Type |
|-------|-------|------|
| 2×2 parentheses | `\begin{pmatrix}...` | ( ) |
| 3×3 parentheses | `\begin{pmatrix}...` | ( ) |
| 2×2 brackets | `\begin{bmatrix}...` | [ ] |
| 2×2 bars | `\begin{vmatrix}...` | \| \| |
| Cases | `\begin{cases}...` | { |

### Greek Letters (25 symbols)

**Lowercase:** α β γ δ ε ζ η θ ι κ λ μ ν ξ π ρ σ τ υ φ χ ψ ω

**Uppercase:** Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω

### Operators (26 symbols)

± × ÷ · ∘ ⊕ ⊗ ∂ ∇ ∞ ≈ ≠ ≡ ≤ ≥ ≪ ≫ ∈ ∉ ⊂ ⊃ ⊆ ∪ ∩ ∀ ∃

### Arrows

→ ← ↔ ⇒ ⇐ ⇔ ↦ ↑ ↓

### Functions

sin cos tan log ln exp lim max min det

### Delimiters

| Block | LaTeX |
|-------|-------|
| Parentheses | `\left( ▢ \right)` |
| Brackets | `\left[ ▢ \right]` |
| Braces | `\left\{ ▢ \right\}` |
| Absolute value | `\left\| ▢ \right\|` (single) |
| Norm | `\left\| ▢ \right\|` (double) |
| Floor | `\lfloor ▢ \rfloor` |
| Ceiling | `\lceil ▢ \rceil` |

---

## Dual Mode

### Preview (Visual)
- Shows the formula rendered with KaTeX in real time
- Updates automatically when blocks are inserted
- Ideal for seeing the result as you build

### LaTeX (Raw)
- Editable textarea with the LaTeX code
- Monospaced font
- Ideal for fine-tuning or pasting existing LaTeX
- Palette blocks are inserted at the cursor position

---

## Smart Insertion

When you click a block in the palette:

1. **No selection**: The block is inserted at the cursor position (raw mode) or appended to the end (preview mode)
2. **With selection**: The selected text replaces the first placeholder `▢` in the block
3. **Auto-cursor**: After insertion, the cursor is positioned at the first empty placeholder

### Example

If you have `x + y` selected and click "Fraction":
- Result: `\frac{x + y}{}`
- The cursor is placed in the empty denominator

---

## KaTeX Integration

The MathEditor uses KaTeX for real-time preview. To enable it:

```typescript
// In your entry point (main.tsx)
import katex from "katex";
import "katex/dist/katex.min.css";
(globalThis as any).katex = katex;
```

Without KaTeX, the preview shows the LaTeX code in a styled font as a fallback.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Exit the editor |
| `Shift+Enter` | Exit and move to the next cell |

---

## Component API

```typescript
interface MathEditorProps {
  cellId: string;       // Cell ID
  source: string;       // LaTeX code (with $$ wrappers)
  onExit: () => void;   // Callback when exiting the editor
}
```

The MathEditor integrates automatically when a `latex` cell enters edit mode. You don't need to instantiate it manually.

---

## Data Format

LaTeX cells store the code with `$$` delimiters:

```json
{
  "type": "latex",
  "source": "$$\n\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$"
}
```

The MathEditor automatically:
- **Strips** the `$$` when entering edit mode
- **Adds** the `$$` when saving changes
- Handles whitespace and newlines correctly

---

## Formula Examples

### Quadratic Equation
```latex
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Gaussian Integral
```latex
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### Taylor Series
```latex
$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$
```

### Schrödinger Equation
```latex
$$
i\hbar\frac{\partial}{\partial t}\Psi(\vec{r},t) = \hat{H}\Psi(\vec{r},t)
$$
```

### Euler's Identity
```latex
$$
e^{i\pi} + 1 = 0
$$
```

### Fourier Transform
```latex
$$
\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} dx
$$
```

### Rotation Matrix
```latex
$$
R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
$$
```

### Maxwell's Equations
```latex
$$
\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}
$$
```
