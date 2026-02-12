import { defineComponent, h, onMounted, onUnmounted, type PropType } from "vue";

export const GhostText = defineComponent({
  name: "GhostText",
  props: {
    text: { type: String, required: true },
    textareaRef: { type: Object as PropType<{ value: HTMLTextAreaElement | null }>, required: true },
    onAccept: { type: Function as PropType<() => void>, required: true },
    onDismiss: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    let cleanup: (() => void) | null = null;

    onMounted(() => {
      const ta = props.textareaRef.value;
      if (!ta) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab" && !e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          props.onAccept!();
        } else if (e.key === "Escape") {
          e.preventDefault();
          props.onDismiss!();
        }
      };
      ta.addEventListener("keydown", handleKeyDown, true);
      cleanup = () => ta.removeEventListener("keydown", handleKeyDown, true);
    });

    onUnmounted(() => { cleanup?.(); });

    return () => {
      if (!props.text) return null;
      const ta = props.textareaRef.value;
      if (!ta) return null;

      const cursorPos = ta.selectionStart;
      const before = ta.value.slice(0, cursorPos);
      const lines = before.split("\n");
      const lineHeight = 22;
      const charWidth = 7.8;
      const top = (lines.length - 1) * lineHeight;
      const left = lines[lines.length - 1].length * charWidth;

      const firstLine = props.text.split("\n")[0];
      const hasMore = props.text.includes("\n");

      return h("div", {
        class: "sci-nb-ghost-text",
        style: {
          position: "absolute",
          top: `${top + 10}px`,
          left: `${left + 12}px`,
          pointerEvents: "none",
          whiteSpace: "pre",
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: `${lineHeight}px`,
          zIndex: 5,
        },
      }, [
        firstLine, hasMore ? "..." : "",
        h("span", { style: { fontSize: "10px", opacity: 0.5, marginLeft: "8px" } }, "Tab ↹"),
      ]);
    };
  },
});
