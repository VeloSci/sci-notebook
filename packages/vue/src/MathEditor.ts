import { defineComponent, h, ref, onMounted, onUnmounted, computed, type PropType } from "vue";
import { useNotebookEngine } from "./composables";
import { MATH_CATEGORIES, type MathBlock } from "./math-categories";

function renderLatexPreview(latex: string): string {
  const clean = latex.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  if (!clean) return '<span class="sci-nb-math-preview-empty">Empty formula</span>';
  if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
    try {
      return (globalThis as any).katex.renderToString(clean, {
        displayMode: true,
        throwOnError: false,
      });
    } catch { /* fall through */ }
  }
  const escaped = clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<code class="sci-nb-math-preview-code">${escaped}</code>`;
}

export const MathEditor = defineComponent({
  name: "MathEditor",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    onExit: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const textareaEl = ref<HTMLTextAreaElement | null>(null);
    const containerEl = ref<HTMLDivElement | null>(null);
    const activeCategory = ref(0);
    const showRaw = ref(false);

    const innerLatex = computed(() =>
      props.source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim()
    );

    const updateSource = (newInner: string) => {
      engine.updateCellSource(props.cellId, `$$\n${newInner}\n$$`);
    };

    const insertBlock = (block: MathBlock) => {
      const ta = textareaEl.value;
      if (!ta) {
        updateSource(innerLatex.value + (innerLatex.value ? " " : "") + block.latex.replace(/▢/g, ""));
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const selected = val.slice(start, end);
      let inserted = block.latex;
      if (selected) inserted = inserted.replace("▢", selected);
      inserted = inserted.replace(/▢/g, "");
      const newVal = val.slice(0, start) + inserted + val.slice(end);
      updateSource(newVal);
      requestAnimationFrame(() => {
        if (textareaEl.value) {
          const cursorPos = block.cursor != null ? start + block.cursor : start + inserted.length;
          textareaEl.value.focus();
          textareaEl.value.setSelectionRange(cursorPos, cursorPos);
        }
      });
    };

    const exitAndNext = () => {
      props.onExit!();
      const cells = engine.getCells();
      const idx = cells.findIndex(c => c.id === props.cellId);
      if (idx < cells.length - 1) {
        engine.focusCell(cells[idx + 1].id);
        engine.setEditMode(cells[idx + 1].id);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); props.onExit!(); }
      else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); e.stopPropagation(); exitAndNext(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); props.onExit!(); }
    };

    onMounted(() => {
      if (containerEl.value) containerEl.value.focus();
    });

    return () => {
      const category = MATH_CATEGORIES[activeCategory.value];

      const tabs = h("div", { class: "sci-nb-math-tabs" },
        MATH_CATEGORIES.map((cat, i) =>
          h("button", {
            key: cat.name,
            class: `sci-nb-math-tab ${i === activeCategory.value ? "sci-nb-math-tab--active" : ""}`,
            onClick: () => { activeCategory.value = i; },
            title: cat.name,
            tabindex: -1,
          }, [
            h("span", { class: "sci-nb-math-tab-icon" }, cat.icon),
            h("span", { class: "sci-nb-math-tab-label" }, cat.name),
          ])
        )
      );

      const palette = h("div", { class: "sci-nb-math-palette" },
        category.blocks.map((block, i) =>
          h("button", {
            key: i,
            class: "sci-nb-math-block",
            onClick: () => insertBlock(block),
            title: block.latex,
            tabindex: -1,
          }, block.label)
        )
      );

      const editorArea = h("div", { class: "sci-nb-math-editor-area" }, [
        h("div", { class: "sci-nb-math-mode-toggle" }, [
          h("button", {
            class: `sci-nb-math-mode-btn ${!showRaw.value ? "sci-nb-math-mode-btn--active" : ""}`,
            onClick: () => { showRaw.value = false; },
            tabindex: -1,
          }, "Preview"),
          h("button", {
            class: `sci-nb-math-mode-btn ${showRaw.value ? "sci-nb-math-mode-btn--active" : ""}`,
            onClick: () => { showRaw.value = true; },
            tabindex: -1,
          }, "LaTeX"),
        ]),
        showRaw.value
          ? h("textarea", {
              ref: textareaEl,
              class: "sci-nb-math-raw",
              value: innerLatex.value,
              onInput: (e: Event) => updateSource((e.target as HTMLTextAreaElement).value),
              placeholder: "Type LaTeX here...",
              spellcheck: false,
              autofocus: true,
            })
          : h("div", { class: "sci-nb-math-visual" }, [
              h("div", {
                class: "sci-nb-math-preview",
                innerHTML: renderLatexPreview(props.source),
              }),
              h("p", { class: "sci-nb-math-visual-hint" }, [
                "Click the blocks above to build your formula. Switch to ",
                h("strong", null, "LaTeX"),
                " mode to edit directly.",
              ]),
            ]),
      ]);

      const hint = h("div", { class: "sci-nb-cell-hint" }, [
        h("kbd", null, "Esc"), " exit \u00B7 ",
        h("kbd", null, "Shift+Enter"), " next \u00B7 ",
        h("kbd", null, "Ctrl+Enter"), " render",
      ]);

      return h("div", {
        ref: containerEl,
        class: "sci-nb-math-editor",
        onKeydown: handleKeyDown,
        tabindex: -1,
      }, [tabs, palette, editorArea, hint]);
    };
  },
});

export { MATH_CATEGORIES };
export type { MathBlock, MathCategory } from "./math-categories";
