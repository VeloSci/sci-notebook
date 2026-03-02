import { defineComponent, h, ref, onMounted, onUnmounted } from "vue";
import { type CellType, CELL_ICONS } from "@velo-sci/notebook-core";
import { useNotebookEngine } from "./composables";

const INSERT_TYPES: { type: CellType; label: string; icon: string }[] = [
  { type: "markdown", label: "Markdown", icon: CELL_ICONS.markdown },
  { type: "code", label: "Code", icon: CELL_ICONS.code },
  { type: "latex", label: "LaTeX", icon: CELL_ICONS.latex },
  { type: "image", label: "Imagen", icon: CELL_ICONS.image },
  { type: "embed", label: "Embed", icon: CELL_ICONS.embed },
  { type: "table", label: "Tabla", icon: CELL_ICONS.table },
  { type: "component", label: "Component", icon: CELL_ICONS.component },
  { type: "raw", label: "Raw", icon: CELL_ICONS.raw },
  { type: "notebook", label: "Notebook", icon: CELL_ICONS.notebook || '<svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>' },
];

export const InsertHandle = defineComponent({
  name: "InsertHandle",
  props: {
    index: { type: Number, required: true },
    level: { type: Number, default: 0 },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const open = ref(false);
    const handleRef = ref<HTMLElement | null>(null);

    const handleInsert = (type: CellType) => {
      const cell = engine.insertCell(props.index, type);
      open.value = false;
      requestAnimationFrame(() => {
        engine.setEditMode(cell.id);
        engine.focusCell(cell.id);
      });
    };

    const onClickOutside = (e: MouseEvent) => {
      if (handleRef.value && !handleRef.value.contains(e.target as Node)) {
        open.value = false;
      }
    };

    onMounted(() => document.addEventListener("mousedown", onClickOutside));
    onUnmounted(() => document.removeEventListener("mousedown", onClickOutside));

    return () =>
      h("div", { class: "sci-nb-insert-handle", ref: (el: any) => { handleRef.value = el; } }, [
        h("div", { class: "sci-nb-insert-line" }, [
          h("button", {
            class: "sci-nb-insert-btn",
            onClick: (e: MouseEvent) => { e.stopPropagation(); open.value = !open.value; },
            title: "Insert cell",
            "aria-label": `Insert cell at position ${props.index}`,
            innerHTML: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
          }),
        ]),
        ...(open.value ? [
          h("div", { class: "sci-nb-insert-menu" },
            INSERT_TYPES.filter(ct => props.level === 0 || ct.type !== "notebook").map(ct =>
              h("button", {
                class: "sci-nb-insert-option",
                key: ct.type,
                onClick: () => handleInsert(ct.type),
              }, [
                h("span", { class: "sci-nb-insert-option-icon", innerHTML: ct.icon }),
                h("span", null, ct.label),
              ])
            )
          ),
        ] : []),
      ]);
  },
});
