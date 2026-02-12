import { defineComponent, h, ref, onMounted, onUnmounted, type PropType } from "vue";
import { useNotebookEngine } from "./composables";

const FORMAT_ACTIONS = [
  { label: "B", title: "Bold (Ctrl+B)", wrap: ["**", "**"] as const, prefix: null, style: "font-weight:700" },
  { label: "I", title: "Italic (Ctrl+I)", wrap: ["*", "*"] as const, prefix: null, style: "font-style:italic" },
  { label: "S", title: "Strikethrough", wrap: ["~~", "~~"] as const, prefix: null, style: "text-decoration:line-through" },
  { label: "<>", title: "Inline code", wrap: ["`", "`"] as const, prefix: null, style: "font-family:monospace;font-size:12px" },
  { label: "H1", title: "Heading 1", wrap: null, prefix: "# ", style: "font-weight:700;font-size:12px" },
  { label: "H2", title: "Heading 2", wrap: null, prefix: "## ", style: "font-weight:700;font-size:11px" },
  { label: "\u{1F517}", title: "Link", wrap: ["[", "](url)"] as const, prefix: null, style: "" },
  { label: "\u2022", title: "Bullet list", wrap: null, prefix: "- ", style: "font-size:16px" },
] as const;

function parseInlineStyle(css: string): Record<string, string> {
  const style: Record<string, string> = {};
  css.split(";").forEach(pair => {
    const [key, val] = pair.split(":");
    if (key && val) {
      const camelKey = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[camelKey] = val.trim();
    }
  });
  return style;
}

export const FloatingToolbar = defineComponent({
  name: "FloatingToolbar",
  props: {
    cellId: { type: String, required: true },
    textareaRef: { type: Object as PropType<{ value: HTMLTextAreaElement | null }>, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const toolbarEl = ref<HTMLDivElement | null>(null);
    const pos = ref({ top: 0, left: 0, visible: false });

    const updatePosition = () => {
      const ta = props.textareaRef.value;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (start === end) {
        pos.value = { ...pos.value, visible: false };
        return;
      }
      const taRect = ta.getBoundingClientRect();
      pos.value = {
        top: taRect.top - 44,
        left: taRect.left + taRect.width / 2,
        visible: true,
      };
    };

    const applyFormat = (action: typeof FORMAT_ACTIONS[number]) => {
      const ta = props.textareaRef.value;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const source = ta.value;
      const selected = source.slice(start, end);
      let newSource: string;
      let newCursorStart: number;
      let newCursorEnd: number;

      if (action.wrap) {
        const [before, after] = action.wrap;
        newSource = source.slice(0, start) + before + selected + after + source.slice(end);
        newCursorStart = start + before.length;
        newCursorEnd = end + before.length;
      } else if (action.prefix) {
        const lineStart = source.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = source.indexOf("\n", end);
        const actualEnd = lineEnd === -1 ? source.length : lineEnd;
        const lines = source.slice(lineStart, actualEnd).split("\n");
        const prefixed = lines.map(l => action.prefix + l).join("\n");
        newSource = source.slice(0, lineStart) + prefixed + source.slice(actualEnd);
        newCursorStart = start + action.prefix.length;
        newCursorEnd = end + action.prefix.length * lines.length;
      } else {
        return;
      }

      engine.updateCellSource(props.cellId, newSource);
      requestAnimationFrame(() => {
        if (ta) {
          ta.focus();
          ta.setSelectionRange(newCursorStart, newCursorEnd);
        }
      });
    };

    let cleanups: Array<() => void> = [];

    onMounted(() => {
      const ta = props.textareaRef.value;
      if (!ta) return;
      const onSelect = () => requestAnimationFrame(updatePosition);
      ta.addEventListener("select", onSelect);
      ta.addEventListener("mouseup", onSelect);
      ta.addEventListener("keyup", onSelect);
      const onMouseDown = (e: MouseEvent) => {
        if (toolbarEl.value && !toolbarEl.value.contains(e.target as Node) && e.target !== ta) {
          pos.value = { ...pos.value, visible: false };
        }
      };
      document.addEventListener("mousedown", onMouseDown);
      cleanups.push(
        () => ta.removeEventListener("select", onSelect),
        () => ta.removeEventListener("mouseup", onSelect),
        () => ta.removeEventListener("keyup", onSelect),
        () => document.removeEventListener("mousedown", onMouseDown),
      );
    });

    onUnmounted(() => {
      for (const c of cleanups) c();
      cleanups = [];
    });

    return () => {
      if (!pos.value.visible) return null;
      return h(
        "div",
        {
          ref: toolbarEl,
          class: "sci-nb-floating-toolbar",
          style: {
            position: "fixed",
            top: `${pos.value.top}px`,
            left: `${pos.value.left}px`,
            transform: "translateX(-50%)",
          },
          onMousedown: (e: MouseEvent) => e.preventDefault(),
        },
        FORMAT_ACTIONS.map((action, i) =>
          h(
            "button",
            {
              key: i,
              class: "sci-nb-ft-btn",
              title: action.title,
              style: action.style ? parseInlineStyle(action.style) : undefined,
              onClick: () => applyFormat(action),
            },
            action.label
          )
        )
      );
    };
  },
});
