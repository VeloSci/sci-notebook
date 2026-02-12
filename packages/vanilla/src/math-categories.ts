// ── Math symbol categories for the visual formula builder ──
// Shared with @velo-sci/notebook-react

export interface MathBlock {
  label: string;
  latex: string;
  cursor?: number;
}

export interface MathCategory {
  name: string;
  icon: string;
  blocks: MathBlock[];
}

export const MATH_CATEGORIES: MathCategory[] = [
  {
    name: "Structures", icon: "⬚",
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
    name: "Integrals", icon: "∫",
    blocks: [
      { label: "∫", latex: "\\int{▢}\\,d{▢}", cursor: 5 },
      { label: "∫ₐᵇ", latex: "\\int_{▢}^{▢}{▢}\\,d{▢}", cursor: 5 },
      { label: "∬", latex: "\\iint{▢}", cursor: 6 },
      { label: "∭", latex: "\\iiint{▢}", cursor: 7 },
      { label: "∮", latex: "\\oint{▢}", cursor: 6 },
    ],
  },
  {
    name: "Summations", icon: "∑",
    blocks: [
      { label: "∑", latex: "\\sum_{▢}^{▢}{▢}", cursor: 5 },
      { label: "∏", latex: "\\prod_{▢}^{▢}{▢}", cursor: 6 },
      { label: "lim", latex: "\\lim_{▢ \\to ▢}{▢}", cursor: 5 },
      { label: "∑ₙ", latex: "\\sum_{n=▢}^{▢}{▢}", cursor: 7 },
    ],
  },
  {
    name: "Matrices", icon: "[ ]",
    blocks: [
      { label: "2×2", latex: "\\begin{pmatrix} ▢ & ▢ \\\\ ▢ & ▢ \\end{pmatrix}", cursor: 16 },
      { label: "3×3", latex: "\\begin{pmatrix} ▢ & ▢ & ▢ \\\\ ▢ & ▢ & ▢ \\\\ ▢ & ▢ & ▢ \\end{pmatrix}", cursor: 16 },
      { label: "[2×2]", latex: "\\begin{bmatrix} ▢ & ▢ \\\\ ▢ & ▢ \\end{bmatrix}", cursor: 16 },
      { label: "|2×2|", latex: "\\begin{vmatrix} ▢ & ▢ \\\\ ▢ & ▢ \\end{vmatrix}", cursor: 16 },
      { label: "cases", latex: "\\begin{cases} ▢ & \\text{if } ▢ \\\\ ▢ & \\text{if } ▢ \\end{cases}", cursor: 14 },
    ],
  },
  {
    name: "Greek", icon: "α",
    blocks: [
      { label: "α", latex: "\\alpha" }, { label: "β", latex: "\\beta" },
      { label: "γ", latex: "\\gamma" }, { label: "δ", latex: "\\delta" },
      { label: "ε", latex: "\\epsilon" }, { label: "ζ", latex: "\\zeta" },
      { label: "η", latex: "\\eta" }, { label: "θ", latex: "\\theta" },
      { label: "λ", latex: "\\lambda" }, { label: "μ", latex: "\\mu" },
      { label: "π", latex: "\\pi" }, { label: "ρ", latex: "\\rho" },
      { label: "σ", latex: "\\sigma" }, { label: "τ", latex: "\\tau" },
      { label: "φ", latex: "\\phi" }, { label: "ψ", latex: "\\psi" },
      { label: "ω", latex: "\\omega" }, { label: "Γ", latex: "\\Gamma" },
      { label: "Δ", latex: "\\Delta" }, { label: "Θ", latex: "\\Theta" },
      { label: "Λ", latex: "\\Lambda" }, { label: "Σ", latex: "\\Sigma" },
      { label: "Φ", latex: "\\Phi" }, { label: "Ψ", latex: "\\Psi" },
      { label: "Ω", latex: "\\Omega" },
    ],
  },
  {
    name: "Operators", icon: "±",
    blocks: [
      { label: "±", latex: "\\pm" }, { label: "∓", latex: "\\mp" },
      { label: "×", latex: "\\times" }, { label: "÷", latex: "\\div" },
      { label: "·", latex: "\\cdot" }, { label: "∘", latex: "\\circ" },
      { label: "⊗", latex: "\\otimes" }, { label: "⊕", latex: "\\oplus" },
      { label: "∂", latex: "\\partial" }, { label: "∇", latex: "\\nabla" },
      { label: "∞", latex: "\\infty" }, { label: "≈", latex: "\\approx" },
      { label: "≠", latex: "\\neq" }, { label: "≤", latex: "\\leq" },
      { label: "≥", latex: "\\geq" }, { label: "≡", latex: "\\equiv" },
      { label: "∝", latex: "\\propto" }, { label: "∈", latex: "\\in" },
      { label: "∉", latex: "\\notin" }, { label: "⊂", latex: "\\subset" },
      { label: "⊃", latex: "\\supset" }, { label: "∪", latex: "\\cup" },
      { label: "∩", latex: "\\cap" }, { label: "∅", latex: "\\emptyset" },
      { label: "∀", latex: "\\forall" }, { label: "∃", latex: "\\exists" },
    ],
  },
  {
    name: "Arrows", icon: "→",
    blocks: [
      { label: "→", latex: "\\rightarrow" }, { label: "←", latex: "\\leftarrow" },
      { label: "↔", latex: "\\leftrightarrow" }, { label: "⇒", latex: "\\Rightarrow" },
      { label: "⇐", latex: "\\Leftarrow" }, { label: "⇔", latex: "\\Leftrightarrow" },
      { label: "↦", latex: "\\mapsto" }, { label: "↑", latex: "\\uparrow" },
      { label: "↓", latex: "\\downarrow" },
    ],
  },
  {
    name: "Functions", icon: "f(x)",
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
    name: "Delimiters", icon: "()",
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
