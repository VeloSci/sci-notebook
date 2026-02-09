# Editor Visual de Fórmulas (MathEditor)

El MathEditor es el componente estrella de sci-notebook: un editor visual de fórmulas matemáticas tipo Word/Mathcha que permite construir expresiones complejas sin necesidad de saber LaTeX.

---

## Cómo Funciona

1. **Crea una celda LaTeX** (desde el menú `+` entre celdas o cambiando el tipo de una celda existente)
2. **Click** en la celda para abrir el MathEditor
3. **Selecciona una categoría** de la barra de tabs
4. **Click en un bloque** para insertarlo en la fórmula
5. **Alterna** entre modo Preview (visual) y modo LaTeX (raw)
6. **Escape** para salir y ver el resultado renderizado

---

## Categorías de Bloques

### Estructuras
Los bloques fundamentales para construir expresiones:

| Bloque | LaTeX | Resultado |
|--------|-------|-----------|
| Fracción | `\frac{▢}{▢}` | a/b |
| Raíz | `\sqrt{▢}` | √x |
| Superíndice | `^{▢}` | x² |
| Subíndice | `_{▢}` | xᵢ |
| Hat | `\hat{▢}` | x̂ |
| Bar | `\bar{▢}` | x̄ |
| Vec | `\vec{▢}` | x⃗ |
| Tilde | `\tilde{▢}` | x̃ |
| Dot | `\dot{▢}` | ẋ |

### Integrales

| Bloque | LaTeX |
|--------|-------|
| Integral | `\int ▢` |
| Integral definida | `\int_{▢}^{▢} ▢` |
| Integral doble | `\iint ▢` |
| Integral triple | `\iiint ▢` |
| Integral de contorno | `\oint ▢` |

### Sumatorias

| Bloque | LaTeX |
|--------|-------|
| Sumatoria | `\sum_{▢}^{▢} ▢` |
| Productoria | `\prod_{▢}^{▢} ▢` |
| Límite | `\lim_{▢ \to ▢} ▢` |

### Matrices

| Bloque | LaTeX | Tipo |
|--------|-------|------|
| 2×2 paréntesis | `\begin{pmatrix}...` | ( ) |
| 3×3 paréntesis | `\begin{pmatrix}...` | ( ) |
| 2×2 corchetes | `\begin{bmatrix}...` | [ ] |
| 2×2 barras | `\begin{vmatrix}...` | \| \| |
| Cases | `\begin{cases}...` | \{ |

### Griegos (25 símbolos)

**Minúsculas:** α β γ δ ε ζ η θ ι κ λ μ ν ξ π ρ σ τ υ φ χ ψ ω

**Mayúsculas:** Γ Δ Θ Λ Ξ Π Σ Φ Ψ Ω

### Operadores (26 símbolos)

± × ÷ · ∘ ⊕ ⊗ ∂ ∇ ∞ ≈ ≠ ≡ ≤ ≥ ≪ ≫ ∈ ∉ ⊂ ⊃ ⊆ ∪ ∩ ∀ ∃

### Flechas

→ ← ↔ ⇒ ⇐ ⇔ ↦ ↑ ↓

### Funciones

sin cos tan log ln exp lim max min det

### Delimitadores

| Bloque | LaTeX |
|--------|-------|
| Paréntesis | `\left( ▢ \right)` |
| Corchetes | `\left[ ▢ \right]` |
| Llaves | `\left\{ ▢ \right\}` |
| Valor absoluto | `\left\| ▢ \right\|` (single) |
| Norma | `\left\| ▢ \right\|` (double) |
| Piso | `\lfloor ▢ \rfloor` |
| Techo | `\lceil ▢ \rceil` |

---

## Modo Dual

### Preview (Visual)
- Muestra la fórmula renderizada con KaTeX en tiempo real
- Se actualiza automáticamente al insertar bloques
- Ideal para ver el resultado mientras construyes

### LaTeX (Raw)
- Textarea editable con el código LaTeX
- Fuente monoespaciada
- Ideal para ajustes finos o copiar/pegar LaTeX existente
- Los bloques de la paleta se insertan en la posición del cursor

---

## Inserción Inteligente

Cuando haces click en un bloque de la paleta:

1. **Sin selección**: El bloque se inserta en la posición del cursor (modo raw) o se agrega al final (modo preview)
2. **Con selección**: El texto seleccionado reemplaza el primer placeholder `▢` del bloque
3. **Cursor automático**: Después de insertar, el cursor se posiciona en el primer placeholder vacío

### Ejemplo

Si tienes `x + y` seleccionado y haces click en "Fracción":
- Resultado: `\frac{x + y}{}`
- El cursor queda en el denominador vacío

---

## Integración con KaTeX

El MathEditor usa KaTeX para el preview en tiempo real. Para habilitarlo:

```typescript
// En tu entry point (main.tsx)
import katex from "katex";
import "katex/dist/katex.min.css";
(globalThis as any).katex = katex;
```

Sin KaTeX, el preview muestra el código LaTeX en una fuente estilizada como fallback.

---

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Escape` | Salir del editor |
| `Shift+Enter` | Salir y pasar a la siguiente celda |

---

## API del Componente

```typescript
interface MathEditorProps {
  cellId: string;       // ID de la celda
  source: string;       // Código LaTeX (con $$ wrappers)
  onExit: () => void;   // Callback al salir del editor
}
```

El MathEditor se integra automáticamente cuando una celda de tipo `latex` entra en modo edición. No necesitas instanciarlo manualmente.

---

## Formato de Datos

Las celdas LaTeX almacenan el código con delimitadores `$$`:

```json
{
  "type": "latex",
  "source": "$$\n\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$"
}
```

El MathEditor automáticamente:
- **Quita** los `$$` al entrar en edición
- **Agrega** los `$$` al guardar cambios
- Maneja whitespace y newlines correctamente

---

## Ejemplos de Fórmulas

### Ecuación cuadrática
```latex
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Integral gaussiana
```latex
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

### Serie de Taylor
```latex
$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$
```

### Ecuación de Schrödinger
```latex
$$
i\hbar\frac{\partial}{\partial t}\Psi(\vec{r},t) = \hat{H}\Psi(\vec{r},t)
$$
```

### Identidad de Euler
```latex
$$
e^{i\pi} + 1 = 0
$$
```

### Transformada de Fourier
```latex
$$
\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} dx
$$
```

### Matriz de rotación
```latex
$$
R(\theta) = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
$$
```

### Ecuaciones de Maxwell
```latex
$$
\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}
$$
```
