import { defineComponent, h, ref, onMounted, type PropType } from "vue";
import type { CellType } from "@velo-sci/notebook-core";

export interface GeneratedCell {
  type: CellType;
  source: string;
}

export interface AICellGenerateProps {
  onGenerate: (prompt: string) => Promise<GeneratedCell[]>;
  onAccept: (cells: GeneratedCell[]) => void;
  onCancel: () => void;
  insertIndex: number;
}

type GenState = "prompt" | "loading" | "preview";

const CELL_TYPE_LABELS: Record<string, string> = {
  markdown: "Markdown",
  code: "Code",
  latex: "LaTeX",
  table: "Table",
  mermaid: "Mermaid",
  raw: "Raw",
};

export const AICellGenerate = defineComponent({
  name: "AICellGenerate",
  props: {
    onGenerate: { type: Function as PropType<(prompt: string) => Promise<GeneratedCell[]>>, required: true },
    onAccept: { type: Function as PropType<(cells: GeneratedCell[]) => void>, required: true },
    onCancel: { type: Function as PropType<() => void>, required: true },
    insertIndex: { type: Number, required: true },
  },
  setup(props) {
    const state = ref<GenState>("prompt");
    const prompt = ref("");
    const cells = ref<GeneratedCell[]>([]);
    const error = ref<string | null>(null);
    const textareaEl = ref<HTMLTextAreaElement | null>(null);

    onMounted(() => { textareaEl.value?.focus(); });

    const handleGenerate = async () => {
      if (!prompt.value.trim()) return;
      state.value = "loading";
      error.value = null;
      try {
        const generated = await props.onGenerate!(prompt.value);
        cells.value = generated;
        state.value = "preview";
      } catch (e: any) {
        error.value = e.message || "Generation failed";
        state.value = "prompt";
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleGenerate();
      } else if (e.key === "Escape") {
        e.preventDefault();
        props.onCancel!();
      }
    };

    const handleRegenerate = () => {
      state.value = "prompt";
      cells.value = [];
      textareaEl.value?.focus();
    };

    return () => {
      const children: any[] = [];

      if (state.value === "prompt") {
        children.push(
          h("div", { class: "sci-nb-ai-generate-prompt" }, [
            h("div", { class: "sci-nb-ai-generate-header" }, [
              h("svg", {
                width: "16", height: "16", viewBox: "0 0 16 16",
                fill: "none", stroke: "currentColor", "stroke-width": "1.5",
                innerHTML: '<path d="M8 1v14M1 8h14" stroke-linecap="round" />',
              }),
              h("span", null, "Generate cells with AI"),
            ]),
            h("textarea", {
              ref: textareaEl,
              value: prompt.value,
              onInput: (e: Event) => { prompt.value = (e.target as HTMLTextAreaElement).value; },
              onKeydown: handleKeyDown,
              placeholder: "Describe what you want to generate...\ne.g. 'Create a markdown cell explaining Newton's second law with a LaTeX formula'",
              class: "sci-nb-ai-generate-textarea",
              rows: 3,
            }),
            h("div", { class: "sci-nb-ai-generate-actions" }, [
              h("button", {
                onClick: handleGenerate,
                disabled: !prompt.value.trim(),
                class: "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary",
              }, "Generate (Ctrl+Enter)"),
              h("button", {
                onClick: () => props.onCancel!(),
                class: "sci-nb-ai-rewrite-btn",
              }, "Cancel"),
            ]),
            error.value ? h("div", { class: "sci-nb-ai-rewrite-error" }, error.value) : null,
          ])
        );
      }

      if (state.value === "loading") {
        children.push(
          h("div", { class: "sci-nb-ai-generate-loading" }, [h("span", null, "Generating cells...")])
        );
      }

      if (state.value === "preview") {
        children.push(
          h("div", { class: "sci-nb-ai-generate-preview" }, [
            h("div", { class: "sci-nb-ai-generate-header" }, [
              h("span", null, `Generated ${cells.value.length} cell${cells.value.length !== 1 ? "s" : ""}`),
            ]),
            h("div", { class: "sci-nb-ai-generate-cells" },
              cells.value.map((cell, i) =>
                h("div", { key: i, class: "sci-nb-ai-generate-cell" }, [
                  h("div", { class: "sci-nb-ai-generate-cell-badge" },
                    CELL_TYPE_LABELS[cell.type] || cell.type
                  ),
                  h("pre", { class: "sci-nb-ai-generate-cell-source" },
                    cell.source.length > 200 ? cell.source.slice(0, 200) + "..." : cell.source
                  ),
                ])
              )
            ),
            h("div", { class: "sci-nb-ai-generate-actions" }, [
              h("button", {
                onClick: () => props.onAccept!(cells.value),
                class: "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary",
              }, `Insert ${cells.value.length} cell${cells.value.length !== 1 ? "s" : ""}`),
              h("button", {
                onClick: handleRegenerate,
                class: "sci-nb-ai-rewrite-btn",
              }, "Regenerate"),
              h("button", {
                onClick: () => props.onCancel!(),
                class: "sci-nb-ai-rewrite-btn",
              }, "Cancel"),
            ]),
          ])
        );
      }

      return h("div", { class: "sci-nb-ai-generate" }, children);
    };
  },
});
