import { defineComponent, h, computed, type PropType } from "vue";
import { useNotebookEngine, useNotebook } from "./composables";

export interface TOCItem {
  cellId: string;
  level: number;
  text: string;
}

export const TOCSidebar = defineComponent({
  name: "TOCSidebar",
  props: {
    focusedCellId: { type: String as PropType<string | null>, default: null },
  },
  setup(props) {
    const notebook = useNotebook();
    const engine = useNotebookEngine();

    const items = computed<TOCItem[]>(() => {
      if (!notebook.value) return [];
      const result: TOCItem[] = [];
      for (const cell of notebook.value.cells) {
        if (cell.type !== "markdown") continue;
        const lines = cell.source.split("\n");
        for (const line of lines) {
          const match = line.match(/^(#{1,3})\s+(.+)/);
          if (match) {
            result.push({
              cellId: cell.id,
              level: match[1].length,
              text: match[2].replace(/[*_`~#]/g, "").trim(),
            });
          }
        }
      }
      return result;
    });

    const handleClick = (cellId: string) => {
      engine.focusCell(cellId);
      engine.setEditMode(cellId);
      const el = document.querySelector(`[data-testid="cell-${cellId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    return () => {
      if (items.value.length === 0) return null;

      return h("nav", { class: "sci-nb-toc" }, [
        h("div", { class: "sci-nb-toc-title" }, "Contenido"),
        ...items.value.map((item, i) =>
          h("button", {
            key: `${item.cellId}-${i}`,
            class: [
              "sci-nb-toc-item",
              `sci-nb-toc-item--h${item.level}`,
              item.cellId === props.focusedCellId ? "sci-nb-toc-item--active" : "",
            ].join(" "),
            onClick: () => handleClick(item.cellId),
            title: item.text,
          }, item.text)
        ),
      ]);
    };
  },
});
