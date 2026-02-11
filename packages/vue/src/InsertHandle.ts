import { defineComponent, h } from "vue";
import { useNotebookEngine } from "./composables";

export const InsertHandle = defineComponent({
  name: "InsertHandle",
  props: {
    index: { type: Number, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();

    const handleClick = () => {
      const cell = engine.insertCell(props.index, "markdown", "");
      engine.setEditMode(cell.id);
      engine.focusCell(cell.id);
    };

    return () =>
      h("div", { class: "sci-nb-insert-handle" }, [
        h(
          "button",
          {
            class: "sci-nb-insert-btn",
            onClick: handleClick,
            title: "Insert cell",
            "aria-label": `Insert cell at position ${props.index}`,
          },
          "+"
        ),
      ]);
  },
});
