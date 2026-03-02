import { defineComponent, h, ref, onMounted, onUnmounted, watch, type PropType } from "vue";
import type { CellType } from "@velo-sci/notebook-core";
import { CELL_ICONS } from "@velo-sci/notebook-core";

export interface SlashCommandItem {
  type: CellType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
}

const DEFAULT_COMMANDS: SlashCommandItem[] = [
  { type: "markdown", label: "Markdown", description: "Markdown text block", icon: CELL_ICONS.markdown, keywords: ["text", "markdown", "paragraph"] },
  { type: "code", label: "Code", description: "Code block", icon: CELL_ICONS.code, keywords: ["code", "script", "program"] },
  { type: "latex", label: "LaTeX", description: "LaTeX formula", icon: CELL_ICONS.latex, keywords: ["latex", "math", "formula", "equation"] },
  { type: "image", label: "Image", description: "Image block", icon: CELL_ICONS.image, keywords: ["image", "picture", "photo", "img"] },
  { type: "embed", label: "Embed", description: "External content", icon: CELL_ICONS.embed, keywords: ["embed", "iframe", "youtube", "video", "codepen"] },
  { type: "table", label: "Table", description: "Table block", icon: CELL_ICONS.table, keywords: ["table", "grid", "spreadsheet"] },
  { type: "mermaid", label: "Diagram", description: "Mermaid diagram", icon: CELL_ICONS.mermaid, keywords: ["mermaid", "diagram", "flowchart", "chart"] },
  { type: "raw", label: "Raw", description: "Unformatted text", icon: CELL_ICONS.raw, keywords: ["raw", "plain", "text"] },
  { type: "notebook", label: "Notebook", description: "Nested notebook", icon: CELL_ICONS.notebook || '<svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>', keywords: ["notebook", "nested", "level"] },
];


export const SlashCommand = defineComponent({
  name: "SlashCommand",
  props: {
    position: { type: Object as PropType<{ top: number; left: number }>, required: true },
    query: { type: String, required: true },
    onSelect: { type: Function as PropType<(type: CellType) => void>, required: true },
    onClose: { type: Function as PropType<() => void>, required: true },
    extraCommands: { type: Array as PropType<SlashCommandItem[]>, default: undefined },
    level: { type: Number, default: 0 },
  },
  setup(props) {
    const selectedIndex = ref(0);
    const menuEl = ref<HTMLDivElement | null>(null);

    const getFiltered = () => {
      const all = props.extraCommands ? [...DEFAULT_COMMANDS, ...props.extraCommands] : DEFAULT_COMMANDS;
      const available = all.filter(c => props.level === 0 || c.type !== "notebook");
      if (!props.query) return available;
      const q = props.query.toLowerCase();
      return available.filter(cmd =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.type.toLowerCase().includes(q) ||
        cmd.keywords.some(k => k.includes(q))
      );
    };

    watch(() => props.query, () => { selectedIndex.value = 0; });

    let keyCleanup: (() => void) | null = null;
    let clickCleanup: (() => void) | null = null;

    onMounted(() => {
      const handleKey = (e: KeyboardEvent) => {
        const filtered = getFiltered();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          selectedIndex.value = (selectedIndex.value + 1) % Math.max(filtered.length, 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          selectedIndex.value = (selectedIndex.value - 1 + filtered.length) % Math.max(filtered.length, 1);
        } else if (e.key === "Enter" && filtered.length > 0) {
          e.preventDefault();
          props.onSelect!(filtered[selectedIndex.value]?.type || "markdown");
        } else if (e.key === "Escape") {
          e.preventDefault();
          props.onClose!();
        }
      };
      document.addEventListener("keydown", handleKey, true);
      keyCleanup = () => document.removeEventListener("keydown", handleKey, true);

      const handleClick = (e: MouseEvent) => {
        if (menuEl.value && !menuEl.value.contains(e.target as Node)) {
          props.onClose!();
        }
      };
      document.addEventListener("mousedown", handleClick);
      clickCleanup = () => document.removeEventListener("mousedown", handleClick);
    });

    onUnmounted(() => {
      keyCleanup?.();
      clickCleanup?.();
    });

    return () => {
      const filtered = getFiltered();

      if (filtered.length === 0) {
        return h("div", {
          ref: menuEl,
          class: "sci-nb-slash-menu",
          style: { top: `${props.position.top}px`, left: `${props.position.left}px` },
        }, [
          h("div", { class: "sci-nb-slash-empty" }, `No results for "/${props.query}"`),
        ]);
      }

      return h("div", {
        ref: menuEl,
        class: "sci-nb-slash-menu",
        style: { top: `${props.position.top}px`, left: `${props.position.left}px` },
      }, [
        h("div", { class: "sci-nb-slash-header" }, "Insert block"),
        ...filtered.map((cmd, i) =>
          h("button", {
            key: cmd.type + cmd.label,
            class: `sci-nb-slash-item ${i === selectedIndex.value ? "sci-nb-slash-item--active" : ""}`,
            onMouseenter: () => { selectedIndex.value = i; },
            onClick: () => props.onSelect!(cmd.type),
          }, [
            h("span", { class: "sci-nb-slash-icon", innerHTML: cmd.icon }),

            h("div", { class: "sci-nb-slash-text" }, [
              h("span", { class: "sci-nb-slash-label" }, cmd.label),
              h("span", { class: "sci-nb-slash-desc" }, cmd.description),
            ]),
          ])
        ),
      ]);
    };
  },
});

export { DEFAULT_COMMANDS };
