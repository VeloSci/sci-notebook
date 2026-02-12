import { defineComponent, h, ref, computed, watch, onMounted, onUnmounted, type PropType } from "vue";

const LATEX_COMMANDS: Array<{ cmd: string; desc: string; category: string }> = [
  // Structures
  { cmd: "\\frac{}{}", desc: "Fracción", category: "struct" },
  { cmd: "\\sqrt{}", desc: "Raíz cuadrada", category: "struct" },
  { cmd: "\\sqrt[]{}", desc: "Raíz n-ésima", category: "struct" },
  { cmd: "^{}", desc: "Superíndice", category: "struct" },
  { cmd: "_{}", desc: "Subíndice", category: "struct" },
  { cmd: "\\hat{}", desc: "Hat", category: "struct" },
  { cmd: "\\bar{}", desc: "Bar", category: "struct" },
  { cmd: "\\vec{}", desc: "Vector", category: "struct" },
  { cmd: "\\tilde{}", desc: "Tilde", category: "struct" },
  { cmd: "\\dot{}", desc: "Dot", category: "struct" },
  { cmd: "\\ddot{}", desc: "Double dot", category: "struct" },
  { cmd: "\\overline{}", desc: "Overline", category: "struct" },
  { cmd: "\\underline{}", desc: "Underline", category: "struct" },
  { cmd: "\\overbrace{}", desc: "Overbrace", category: "struct" },
  { cmd: "\\underbrace{}", desc: "Underbrace", category: "struct" },
  // Integrals
  { cmd: "\\int", desc: "Integral", category: "calc" },
  { cmd: "\\int_{}^{}", desc: "Integral definida", category: "calc" },
  { cmd: "\\iint", desc: "Integral doble", category: "calc" },
  { cmd: "\\iiint", desc: "Integral triple", category: "calc" },
  { cmd: "\\oint", desc: "Integral de contorno", category: "calc" },
  { cmd: "\\sum_{}^{}", desc: "Sumatoria", category: "calc" },
  { cmd: "\\prod_{}^{}", desc: "Productoria", category: "calc" },
  { cmd: "\\lim_{\\to}", desc: "Límite", category: "calc" },
  { cmd: "\\partial", desc: "Derivada parcial", category: "calc" },
  { cmd: "\\nabla", desc: "Nabla", category: "calc" },
  { cmd: "\\infty", desc: "Infinito", category: "calc" },
  // Greek
  { cmd: "\\alpha", desc: "α", category: "greek" },
  { cmd: "\\beta", desc: "β", category: "greek" },
  { cmd: "\\gamma", desc: "γ", category: "greek" },
  { cmd: "\\delta", desc: "δ", category: "greek" },
  { cmd: "\\epsilon", desc: "ε", category: "greek" },
  { cmd: "\\zeta", desc: "ζ", category: "greek" },
  { cmd: "\\eta", desc: "η", category: "greek" },
  { cmd: "\\theta", desc: "θ", category: "greek" },
  { cmd: "\\iota", desc: "ι", category: "greek" },
  { cmd: "\\kappa", desc: "κ", category: "greek" },
  { cmd: "\\lambda", desc: "λ", category: "greek" },
  { cmd: "\\mu", desc: "μ", category: "greek" },
  { cmd: "\\nu", desc: "ν", category: "greek" },
  { cmd: "\\xi", desc: "ξ", category: "greek" },
  { cmd: "\\pi", desc: "π", category: "greek" },
  { cmd: "\\rho", desc: "ρ", category: "greek" },
  { cmd: "\\sigma", desc: "σ", category: "greek" },
  { cmd: "\\tau", desc: "τ", category: "greek" },
  { cmd: "\\upsilon", desc: "υ", category: "greek" },
  { cmd: "\\phi", desc: "φ", category: "greek" },
  { cmd: "\\chi", desc: "χ", category: "greek" },
  { cmd: "\\psi", desc: "ψ", category: "greek" },
  { cmd: "\\omega", desc: "ω", category: "greek" },
  { cmd: "\\Gamma", desc: "Γ", category: "greek" },
  { cmd: "\\Delta", desc: "Δ", category: "greek" },
  { cmd: "\\Theta", desc: "Θ", category: "greek" },
  { cmd: "\\Lambda", desc: "Λ", category: "greek" },
  { cmd: "\\Sigma", desc: "Σ", category: "greek" },
  { cmd: "\\Phi", desc: "Φ", category: "greek" },
  { cmd: "\\Psi", desc: "Ψ", category: "greek" },
  { cmd: "\\Omega", desc: "Ω", category: "greek" },
  // Operators
  { cmd: "\\pm", desc: "±", category: "op" },
  { cmd: "\\mp", desc: "∓", category: "op" },
  { cmd: "\\times", desc: "×", category: "op" },
  { cmd: "\\div", desc: "÷", category: "op" },
  { cmd: "\\cdot", desc: "·", category: "op" },
  { cmd: "\\leq", desc: "≤", category: "op" },
  { cmd: "\\geq", desc: "≥", category: "op" },
  { cmd: "\\neq", desc: "≠", category: "op" },
  { cmd: "\\approx", desc: "≈", category: "op" },
  { cmd: "\\equiv", desc: "≡", category: "op" },
  { cmd: "\\in", desc: "∈", category: "op" },
  { cmd: "\\notin", desc: "∉", category: "op" },
  { cmd: "\\subset", desc: "⊂", category: "op" },
  { cmd: "\\supset", desc: "⊃", category: "op" },
  { cmd: "\\cup", desc: "∪", category: "op" },
  { cmd: "\\cap", desc: "∩", category: "op" },
  { cmd: "\\forall", desc: "∀", category: "op" },
  { cmd: "\\exists", desc: "∃", category: "op" },
  // Arrows
  { cmd: "\\rightarrow", desc: "→", category: "arrow" },
  { cmd: "\\leftarrow", desc: "←", category: "arrow" },
  { cmd: "\\leftrightarrow", desc: "↔", category: "arrow" },
  { cmd: "\\Rightarrow", desc: "⇒", category: "arrow" },
  { cmd: "\\Leftarrow", desc: "⇐", category: "arrow" },
  { cmd: "\\Leftrightarrow", desc: "⇔", category: "arrow" },
  { cmd: "\\mapsto", desc: "↦", category: "arrow" },
  // Functions
  { cmd: "\\sin", desc: "sin", category: "func" },
  { cmd: "\\cos", desc: "cos", category: "func" },
  { cmd: "\\tan", desc: "tan", category: "func" },
  { cmd: "\\log", desc: "log", category: "func" },
  { cmd: "\\ln", desc: "ln", category: "func" },
  { cmd: "\\exp", desc: "exp", category: "func" },
  { cmd: "\\max", desc: "max", category: "func" },
  { cmd: "\\min", desc: "min", category: "func" },
  { cmd: "\\det", desc: "det", category: "func" },
  // Environments
  { cmd: "\\begin{pmatrix}\\end{pmatrix}", desc: "Matriz ()", category: "env" },
  { cmd: "\\begin{bmatrix}\\end{bmatrix}", desc: "Matriz []", category: "env" },
  { cmd: "\\begin{vmatrix}\\end{vmatrix}", desc: "Determinante ||", category: "env" },
  { cmd: "\\begin{cases}\\end{cases}", desc: "Cases {", category: "env" },
  { cmd: "\\begin{aligned}\\end{aligned}", desc: "Aligned", category: "env" },
  // Delimiters
  { cmd: "\\left(\\right)", desc: "Paréntesis auto", category: "delim" },
  { cmd: "\\left[\\right]", desc: "Corchetes auto", category: "delim" },
  { cmd: "\\left\\{\\right\\}", desc: "Llaves auto", category: "delim" },
  { cmd: "\\left|\\right|", desc: "Valor absoluto", category: "delim" },
  { cmd: "\\lfloor\\rfloor", desc: "Piso", category: "delim" },
  { cmd: "\\lceil\\rceil", desc: "Techo", category: "delim" },
  // Misc
  { cmd: "\\text{}", desc: "Texto", category: "misc" },
  { cmd: "\\mathbb{}", desc: "Blackboard bold", category: "misc" },
  { cmd: "\\mathcal{}", desc: "Caligráfico", category: "misc" },
  { cmd: "\\mathrm{}", desc: "Roman", category: "misc" },
  { cmd: "\\mathbf{}", desc: "Bold", category: "misc" },
  { cmd: "\\quad", desc: "Espacio grande", category: "misc" },
  { cmd: "\\qquad", desc: "Espacio doble", category: "misc" },
  { cmd: "\\,", desc: "Espacio fino", category: "misc" },
  { cmd: "\\ldots", desc: "Puntos ...", category: "misc" },
  { cmd: "\\cdots", desc: "Puntos centrados", category: "misc" },
  { cmd: "\\vdots", desc: "Puntos verticales", category: "misc" },
  { cmd: "\\ddots", desc: "Puntos diagonales", category: "misc" },
];

export const LatexAutocomplete = defineComponent({
  name: "LatexAutocomplete",
  props: {
    query: { type: String, required: true },
    position: { type: Object as PropType<{ top: number; left: number }>, required: true },
    onSelect: { type: Function as PropType<(cmd: string) => void>, required: true },
    onClose: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const selectedIndex = ref(0);
    const menuEl = ref<HTMLDivElement | null>(null);

    const filtered = computed(() => {
      if (!props.query) return LATEX_COMMANDS.slice(0, 12);
      const q = props.query.toLowerCase();
      return LATEX_COMMANDS.filter(c =>
        c.cmd.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
      ).slice(0, 10);
    });

    watch(() => props.query, () => { selectedIndex.value = 0; });

    let keyCleanup: (() => void) | null = null;

    onMounted(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown") {
          e.preventDefault(); e.stopPropagation();
          selectedIndex.value = (selectedIndex.value + 1) % Math.max(filtered.value.length, 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault(); e.stopPropagation();
          selectedIndex.value = (selectedIndex.value - 1 + filtered.value.length) % Math.max(filtered.value.length, 1);
        } else if (e.key === "Enter" || e.key === "Tab") {
          if (filtered.value.length > 0) {
            e.preventDefault(); e.stopPropagation();
            props.onSelect!(filtered.value[selectedIndex.value]?.cmd || "");
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          props.onClose!();
        }
      };
      document.addEventListener("keydown", handleKey, true);
      keyCleanup = () => document.removeEventListener("keydown", handleKey, true);
    });

    onUnmounted(() => { keyCleanup?.(); });

    return () => {
      if (filtered.value.length === 0) return null;

      return h("div", {
        ref: menuEl,
        class: "sci-nb-slash-menu",
        style: { top: `${props.position.top}px`, left: `${props.position.left}px`, minWidth: "220px" },
      },
        filtered.value.map((item, i) =>
          h("button", {
            key: item.cmd,
            class: `sci-nb-slash-item ${i === selectedIndex.value ? "sci-nb-slash-item--active" : ""}`,
            onMouseenter: () => { selectedIndex.value = i; },
            onClick: () => props.onSelect!(item.cmd),
          }, [
            h("span", {
              class: "sci-nb-slash-icon",
              style: { fontFamily: "monospace", fontSize: "11px" },
            }, item.desc.length <= 2 ? item.desc : item.cmd.slice(0, 4)),
            h("div", { class: "sci-nb-slash-text" }, [
              h("span", {
                class: "sci-nb-slash-label",
                style: { fontFamily: "monospace", fontSize: "12px" },
              }, item.cmd),
              h("span", { class: "sci-nb-slash-desc" }, item.desc),
            ]),
          ])
        )
      );
    };
  },
});

export { LATEX_COMMANDS };
