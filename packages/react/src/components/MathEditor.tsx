import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSciNotebook } from "../hooks";

interface MathEditorProps {
  cellId: string;
  source: string;
  onExit: () => void;
}

// ── Symbol categories ──────────────────────────────────────────

interface MathBlock {
  label: string;
  latex: string;
  cursor?: number; // offset from start of latex where cursor should go
}

interface MathCategory {
  name: string;
  icon: string;
  blocks: MathBlock[];
}

const MATH_CATEGORIES: MathCategory[] = [
  {
    name: "Estructuras",
    icon: "⬚",
    blocks: [
      { label: "a/b", latex: "\\frac{▢}{▢}", cursor: 6 },
      { label: "√", latex: "\\sqrt{▢}", cursor: 6 },
      { label: "ⁿ√", latex: "\\sqrt[▢]{▢}", cursor: 6 },
      { label: "xⁿ", latex: "{▢}^{▢}", cursor: 1 },
      { label: "xₙ", latex: "{▢}_{▢}", cursor: 1 },
      { label: "x̂", latex: "\\hat{▢}", cursor: 5 },
      { label: "x̄", latex: "\\bar{▢}", cursor: 5 },
      { label: "x⃗", latex: "\\vec{▢}", cursor: 5 },
      { label: "x̃", latex: "\\tilde{▢}", cursor: 7 },
      { label: "ẋ", latex: "\\dot{▢}", cursor: 5 },
      { label: "ẍ", latex: "\\ddot{▢}", cursor: 6 },
    ],
  },
  {
    name: "Integrales",
    icon: "∫",
    blocks: [
      { label: "∫", latex: "\\int{▢}\\,d{▢}", cursor: 5 },
      { label: "∫ₐᵇ", latex: "\\int_{▢}^{▢}{▢}\\,d{▢}", cursor: 5 },
      { label: "∬", latex: "\\iint{▢}", cursor: 6 },
      { label: "∭", latex: "\\iiint{▢}", cursor: 7 },
      { label: "∮", latex: "\\oint{▢}", cursor: 6 },
    ],
  },
  {
    name: "Sumatorias",
    icon: "∑",
    blocks: [
      { label: "∑", latex: "\\sum_{▢}^{▢}{▢}", cursor: 5 },
      { label: "∏", latex: "\\prod_{▢}^{▢}{▢}", cursor: 6 },
      { label: "lim", latex: "\\lim_{▢ \\to ▢}{▢}", cursor: 5 },
      { label: "∑ₙ", latex: "\\sum_{n=▢}^{▢}{▢}", cursor: 7 },
    ],
  },
  {
    name: "Matrices",
    icon: "[ ]",
    blocks: [
      { label: "2×2", latex: "\\begin{pmatrix} ▢ & ▢ \\\\ ▢ & ▢ \\end{pmatrix}", cursor: 16 },
      { label: "3×3", latex: "\\begin{pmatrix} ▢ & ▢ & ▢ \\\\ ▢ & ▢ & ▢ \\\\ ▢ & ▢ & ▢ \\end{pmatrix}", cursor: 16 },
      { label: "[2×2]", latex: "\\begin{bmatrix} ▢ & ▢ \\\\ ▢ & ▢ \\end{bmatrix}", cursor: 16 },
      { label: "|2×2|", latex: "\\begin{vmatrix} ▢ & ▢ \\\\ ▢ & ▢ \\end{vmatrix}", cursor: 16 },
      { label: "cases", latex: "\\begin{cases} ▢ & \\text{si } ▢ \\\\ ▢ & \\text{si } ▢ \\end{cases}", cursor: 14 },
    ],
  },
  {
    name: "Griegos",
    icon: "α",
    blocks: [
      { label: "α", latex: "\\alpha" },
      { label: "β", latex: "\\beta" },
      { label: "γ", latex: "\\gamma" },
      { label: "δ", latex: "\\delta" },
      { label: "ε", latex: "\\epsilon" },
      { label: "ζ", latex: "\\zeta" },
      { label: "η", latex: "\\eta" },
      { label: "θ", latex: "\\theta" },
      { label: "λ", latex: "\\lambda" },
      { label: "μ", latex: "\\mu" },
      { label: "π", latex: "\\pi" },
      { label: "ρ", latex: "\\rho" },
      { label: "σ", latex: "\\sigma" },
      { label: "τ", latex: "\\tau" },
      { label: "φ", latex: "\\phi" },
      { label: "ψ", latex: "\\psi" },
      { label: "ω", latex: "\\omega" },
      { label: "Γ", latex: "\\Gamma" },
      { label: "Δ", latex: "\\Delta" },
      { label: "Θ", latex: "\\Theta" },
      { label: "Λ", latex: "\\Lambda" },
      { label: "Σ", latex: "\\Sigma" },
      { label: "Φ", latex: "\\Phi" },
      { label: "Ψ", latex: "\\Psi" },
      { label: "Ω", latex: "\\Omega" },
    ],
  },
  {
    name: "Operadores",
    icon: "±",
    blocks: [
      { label: "±", latex: "\\pm" },
      { label: "∓", latex: "\\mp" },
      { label: "×", latex: "\\times" },
      { label: "÷", latex: "\\div" },
      { label: "·", latex: "\\cdot" },
      { label: "∘", latex: "\\circ" },
      { label: "⊗", latex: "\\otimes" },
      { label: "⊕", latex: "\\oplus" },
      { label: "∂", latex: "\\partial" },
      { label: "∇", latex: "\\nabla" },
      { label: "∞", latex: "\\infty" },
      { label: "≈", latex: "\\approx" },
      { label: "≠", latex: "\\neq" },
      { label: "≤", latex: "\\leq" },
      { label: "≥", latex: "\\geq" },
      { label: "≡", latex: "\\equiv" },
      { label: "∝", latex: "\\propto" },
      { label: "∈", latex: "\\in" },
      { label: "∉", latex: "\\notin" },
      { label: "⊂", latex: "\\subset" },
      { label: "⊃", latex: "\\supset" },
      { label: "∪", latex: "\\cup" },
      { label: "∩", latex: "\\cap" },
      { label: "∅", latex: "\\emptyset" },
      { label: "∀", latex: "\\forall" },
      { label: "∃", latex: "\\exists" },
    ],
  },
  {
    name: "Flechas",
    icon: "→",
    blocks: [
      { label: "→", latex: "\\rightarrow" },
      { label: "←", latex: "\\leftarrow" },
      { label: "↔", latex: "\\leftrightarrow" },
      { label: "⇒", latex: "\\Rightarrow" },
      { label: "⇐", latex: "\\Leftarrow" },
      { label: "⇔", latex: "\\Leftrightarrow" },
      { label: "↦", latex: "\\mapsto" },
      { label: "↑", latex: "\\uparrow" },
      { label: "↓", latex: "\\downarrow" },
    ],
  },
  {
    name: "Funciones",
    icon: "f(x)",
    blocks: [
      { label: "sin", latex: "\\sin{▢}", cursor: 5 },
      { label: "cos", latex: "\\cos{▢}", cursor: 5 },
      { label: "tan", latex: "\\tan{▢}", cursor: 5 },
      { label: "log", latex: "\\log{▢}", cursor: 5 },
      { label: "ln", latex: "\\ln{▢}", cursor: 4 },
      { label: "exp", latex: "\\exp{▢}", cursor: 5 },
      { label: "lim", latex: "\\lim_{▢}{▢}", cursor: 5 },
      { label: "max", latex: "\\max{▢}", cursor: 5 },
      { label: "min", latex: "\\min{▢}", cursor: 5 },
      { label: "det", latex: "\\det{▢}", cursor: 5 },
    ],
  },
  {
    name: "Delimitadores",
    icon: "()",
    blocks: [
      { label: "(…)", latex: "\\left( ▢ \\right)", cursor: 7 },
      { label: "[…]", latex: "\\left[ ▢ \\right]", cursor: 7 },
      { label: "{…}", latex: "\\left\\{ ▢ \\right\\}", cursor: 8 },
      { label: "|…|", latex: "\\left| ▢ \\right|", cursor: 7 },
      { label: "‖…‖", latex: "\\left\\| ▢ \\right\\|", cursor: 8 },
      { label: "⌊…⌋", latex: "\\lfloor ▢ \\rfloor", cursor: 8 },
      { label: "⌈…⌉", latex: "\\lceil ▢ \\rceil", cursor: 7 },
    ],
  },
];

// ── Render preview (simple KaTeX-like via dangerouslySetInnerHTML) ──

function renderLatexPreview(latex: string): string {
  const clean = latex.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  if (!clean) return '<span class="sci-nb-math-preview-empty">Formula vacia</span>';

  // Use KaTeX if available globally
  if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
    try {
      return (globalThis as any).katex.renderToString(clean, {
        displayMode: true,
        throwOnError: false,
      });
    } catch { /* fall through */ }
  }

  // Fallback: styled code
  return `<code class="sci-nb-math-preview-code">${escapeHtml(clean)}</code>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Component ──────────────────────────────────────────────────

export const MathEditor: React.FC<MathEditorProps> = ({ cellId, source, onExit }) => {
  const engine = useSciNotebook();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [showRaw, setShowRaw] = useState(false);

  // Strip $$ wrappers for editing
  const innerLatex = source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();

  const updateSource = useCallback((newInner: string) => {
    engine.updateCellSource(cellId, `$$\n${newInner}\n$$`);
  }, [engine, cellId]);

  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSource(e.target.value);
  }, [updateSource]);

  const insertBlock = useCallback((block: MathBlock) => {
    const ta = textareaRef.current;
    if (!ta) {
      // If raw mode is off, just append
      updateSource(innerLatex + (innerLatex ? " " : "") + block.latex.replace(/▢/g, ""));
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const selected = val.slice(start, end);

    // Replace first ▢ with selection, rest with empty
    let inserted = block.latex;
    if (selected) {
      inserted = inserted.replace("▢", selected);
    }
    inserted = inserted.replace(/▢/g, "");

    const newVal = val.slice(0, start) + inserted + val.slice(end);
    updateSource(newVal);

    // Position cursor
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const cursorPos = block.cursor != null
          ? start + block.cursor
          : start + inserted.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }, [innerLatex, updateSource]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      onExit();
    }
  }, [onExit]);

  // Auto-resize
  useEffect(() => {
    if (showRaw && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${Math.max(60, ta.scrollHeight)}px`;
    }
  }, [innerLatex, showRaw]);

  const category = MATH_CATEGORIES[activeCategory];

  return (
    <div className="sci-nb-math-editor" onKeyDown={handleKeyDown}>
      {/* Category tabs */}
      <div className="sci-nb-math-tabs">
        {MATH_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            className={`sci-nb-math-tab ${i === activeCategory ? "sci-nb-math-tab--active" : ""}`}
            onClick={() => setActiveCategory(i)}
            title={cat.name}
          >
            <span className="sci-nb-math-tab-icon">{cat.icon}</span>
            <span className="sci-nb-math-tab-label">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Block palette */}
      <div className="sci-nb-math-palette">
        {category.blocks.map((block, i) => (
          <button
            key={i}
            className="sci-nb-math-block"
            onClick={() => insertBlock(block)}
            title={block.latex}
          >
            {block.label}
          </button>
        ))}
      </div>

      {/* Editor area: toggle between visual preview and raw */}
      <div className="sci-nb-math-editor-area">
        <div className="sci-nb-math-mode-toggle">
          <button
            className={`sci-nb-math-mode-btn ${!showRaw ? "sci-nb-math-mode-btn--active" : ""}`}
            onClick={() => setShowRaw(false)}
          >Preview</button>
          <button
            className={`sci-nb-math-mode-btn ${showRaw ? "sci-nb-math-mode-btn--active" : ""}`}
            onClick={() => setShowRaw(true)}
          >LaTeX</button>
        </div>

        {showRaw ? (
          <textarea
            ref={textareaRef}
            className="sci-nb-math-raw"
            value={innerLatex}
            onChange={handleRawChange}
            placeholder="Escribe LaTeX aqui..."
            spellCheck={false}
            autoFocus
          />
        ) : (
          <div className="sci-nb-math-visual">
            <div
              className="sci-nb-math-preview"
              dangerouslySetInnerHTML={{ __html: renderLatexPreview(source) }}
            />
            <p className="sci-nb-math-visual-hint">
              Haz click en los bloques de arriba para construir tu formula.
              Cambia a modo <strong>LaTeX</strong> para editar directamente.
            </p>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="sci-nb-cell-hint">
        <kbd>Esc</kbd> salir &middot; <kbd>Shift+Enter</kbd> siguiente
      </div>
    </div>
  );
};
