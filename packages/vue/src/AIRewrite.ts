import { defineComponent, h, ref, onMounted, type PropType } from "vue";

export interface AIRewriteProps {
  selectedText: string;
  position: { top: number; left: number };
  onRewrite: (instruction: string, selectedText: string) => Promise<string>;
  onAccept: (newText: string) => void;
  onReject: () => void;
}

type RewriteState = "prompt" | "loading" | "preview";

export const AIRewrite = defineComponent({
  name: "AIRewrite",
  props: {
    selectedText: { type: String, required: true },
    position: { type: Object as PropType<{ top: number; left: number }>, required: true },
    onRewrite: { type: Function as PropType<(instruction: string, selectedText: string) => Promise<string>>, required: true },
    onAccept: { type: Function as PropType<(newText: string) => void>, required: true },
    onReject: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const state = ref<RewriteState>("prompt");
    const instruction = ref("");
    const result = ref("");
    const error = ref<string | null>(null);
    const inputEl = ref<HTMLInputElement | null>(null);

    onMounted(() => { inputEl.value?.focus(); });

    const handleSubmit = async () => {
      if (!instruction.value.trim()) return;
      state.value = "loading";
      error.value = null;
      try {
        const rewritten = await props.onRewrite!(instruction.value, props.selectedText);
        result.value = rewritten;
        state.value = "preview";
      } catch (e: any) {
        error.value = e.message || "Rewrite failed";
        state.value = "prompt";
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
      else if (e.key === "Escape") { e.preventDefault(); props.onReject!(); }
    };

    const handleRetry = () => {
      state.value = "prompt";
      result.value = "";
      inputEl.value?.focus();
    };

    return () => {
      const children: any[] = [];

      if (state.value === "prompt") {
        children.push(
          h("div", { class: "sci-nb-ai-rewrite-prompt" }, [
            h("div", { class: "sci-nb-ai-rewrite-selected" }, [
              h("span", { class: "sci-nb-ai-rewrite-label" }, "Selected:"),
              h("span", { class: "sci-nb-ai-rewrite-text" },
                props.selectedText.length > 80 ? props.selectedText.slice(0, 80) + "..." : props.selectedText
              ),
            ]),
            h("div", { class: "sci-nb-ai-rewrite-input-row" }, [
              h("input", {
                ref: inputEl,
                type: "text",
                value: instruction.value,
                onInput: (e: Event) => { instruction.value = (e.target as HTMLInputElement).value; },
                onKeydown: handleKeyDown,
                placeholder: "How should I rewrite this?",
                class: "sci-nb-ai-rewrite-input",
              }),
              h("button", {
                onClick: handleSubmit,
                disabled: !instruction.value.trim(),
                class: "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary",
              }, "Rewrite"),
              h("button", {
                onClick: () => props.onReject!(),
                class: "sci-nb-ai-rewrite-btn",
              }, "Cancel"),
            ]),
            error.value ? h("div", { class: "sci-nb-ai-rewrite-error" }, error.value) : null,
          ])
        );
      }

      if (state.value === "loading") {
        children.push(
          h("div", { class: "sci-nb-ai-rewrite-loading" }, [h("span", null, "Rewriting...")])
        );
      }

      if (state.value === "preview") {
        children.push(
          h("div", { class: "sci-nb-ai-rewrite-preview" }, [
            h("div", { class: "sci-nb-ai-rewrite-diff" }, [
              h("div", { class: "sci-nb-ai-rewrite-diff-old" }, [
                h("span", { class: "sci-nb-ai-rewrite-diff-label" }, "Original:"),
                h("pre", null, props.selectedText),
              ]),
              h("div", { class: "sci-nb-ai-rewrite-diff-new" }, [
                h("span", { class: "sci-nb-ai-rewrite-diff-label" }, "Rewritten:"),
                h("pre", null, result.value),
              ]),
            ]),
            h("div", { class: "sci-nb-ai-rewrite-actions" }, [
              h("button", {
                onClick: () => props.onAccept!(result.value),
                class: "sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary",
              }, "Accept"),
              h("button", { onClick: handleRetry, class: "sci-nb-ai-rewrite-btn" }, "Retry"),
              h("button", { onClick: () => props.onReject!(), class: "sci-nb-ai-rewrite-btn" }, "Reject"),
            ]),
          ])
        );
      }

      return h("div", {
        class: "sci-nb-ai-rewrite",
        style: {
          position: "absolute",
          top: `${props.position.top}px`,
          left: `${props.position.left}px`,
          zIndex: 100,
        },
      }, children);
    };
  },
});
