import { defineComponent, h, ref, watch, computed, onMounted, onUnmounted } from "vue";
import type { PropType } from "vue";
import type { Cell } from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { useNotebookEngine } from "./composables";

export const NotebookCell = defineComponent({
  name: "NotebookCell",
  props: {
    cellId: { type: String, required: true },
    pipeline: { type: Object as PropType<RenderPipeline>, required: true },
    index: { type: Number, required: true },
    totalCells: { type: Number, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const cell = ref<Readonly<Cell> | undefined>(engine.getCell(props.cellId));
    const editorValue = ref(cell.value?.source || "");

    const unsubs: Array<() => void> = [];

    onMounted(() => {
      const handler = () => {
        cell.value = engine.getCell(props.cellId);
        if (cell.value && !cell.value.editing) {
          editorValue.value = cell.value.source;
        }
      };
      unsubs.push(engine.on("cell:updated", handler));
      unsubs.push(engine.on("cell:mode-changed", handler));
      unsubs.push(engine.on("notebook:updated", handler));
    });

    onUnmounted(() => {
      for (const u of unsubs) u();
    });

    const renderedHtml = computed(() => {
      if (!cell.value) return "";
      return props.pipeline.render(cell.value).html;
    });

    const handleClick = () => {
      if (!cell.value) return;
      engine.focusCell(props.cellId);
      engine.setEditMode(props.cellId);
    };

    const handleEscape = () => {
      engine.setViewMode(props.cellId);
    };

    const handleInput = (e: Event) => {
      const val = (e.target as HTMLTextAreaElement).value;
      editorValue.value = val;
      engine.updateCellSource(props.cellId, val);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleEscape();
      }
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        engine.setViewMode(props.cellId);
        const cells = engine.getCells();
        const idx = cells.findIndex(c => c.id === props.cellId);
        if (idx < cells.length - 1) {
          engine.focusCell(cells[idx + 1].id);
        }
      }
    };

    return () => {
      if (!cell.value) return null;

      const isEditing = cell.value.editing;

      const content = isEditing
        ? h("textarea", {
            class: "sci-nb-cell-editor",
            value: editorValue.value,
            onInput: handleInput,
            onKeydown: handleKeydown,
            rows: Math.max(3, (cell.value.source || "").split("\n").length + 1),
          })
        : h("div", {
            class: "sci-nb-cell-rendered",
            innerHTML: renderedHtml.value,
            onClick: handleClick,
          });

      return h(
        "div",
        {
          class: `sci-nb-cell sci-nb-cell--${cell.value.type} ${isEditing ? "sci-nb-cell--editing" : ""}`,
          "data-cell-id": props.cellId,
          "data-cell-index": props.index,
          role: "article",
          "aria-label": `Cell ${props.index + 1}: ${cell.value.type}`,
          tabindex: 0,
        },
        [
          h("div", { class: "sci-nb-cell-handle", draggable: true }, "⠿"),
          h("div", { class: "sci-nb-cell-content" }, [content]),
        ]
      );
    };
  },
});
