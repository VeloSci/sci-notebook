import { defineComponent, h, ref, onMounted, onUnmounted, computed, provide, type PropType } from "vue";
import {
  EditorEngine,
  createNotebook,
  type Notebook,
  type SciNotebookPlugin,
} from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { NotebookEngineKey } from "./composables";
import { NotebookCell } from "./NotebookCell";
import { InsertHandle } from "./InsertHandle";

export interface SciNotebookProps {
  notebook?: Notebook;
  engine?: EditorEngine;
  plugins?: SciNotebookPlugin[];
  theme?: "light" | "dark" | string;
  onChange?: (notebook: Notebook) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  showTOC?: boolean;
}

export const SciNotebook = defineComponent({
  name: "SciNotebook",
  props: {
    notebook: { type: Object as PropType<Notebook>, default: undefined },
    engine: { type: Object as PropType<EditorEngine>, default: undefined },
    plugins: { type: Array as PropType<SciNotebookPlugin[]>, default: () => [] },
    theme: { type: String, default: "light" },
    onChange: { type: Function as PropType<(nb: Notebook) => void>, default: undefined },
    readOnly: { type: Boolean, default: false },
    showToolbar: { type: Boolean, default: true },
    showTOC: { type: Boolean, default: false },
  },
  setup(props, { expose }) {
    const engineInstance = props.engine || createNotebook({
      notebook: props.notebook,
      config: { plugins: props.plugins },
    });

    provide(NotebookEngineKey, engineInstance);

    const pipeline = new RenderPipeline();
    const cells = ref(engineInstance.getCells());
    const title = ref(engineInstance.getNotebook().title);

    const unsubs: Array<() => void> = [];

    onMounted(() => {
      unsubs.push(
        engineInstance.on("notebook:updated", (payload) => {
          cells.value = [...payload.data.notebook.cells];
          title.value = payload.data.notebook.title;
          if (props.onChange) props.onChange(payload.data.notebook);
        })
      );
    });

    onUnmounted(() => {
      for (const u of unsubs) u();
    });

    expose({ engine: engineInstance });

    return () => {
      const cellList = cells.value;

      const toolbarNode = props.showToolbar
        ? h("div", { class: "sci-nb-toolbar" }, [
            h("div", { class: "sci-nb-toolbar-group" }, [
              h("span", { class: "sci-nb-toolbar-title" }, title.value),
            ]),
            h("div", { class: "sci-nb-toolbar-group" }, [
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.undo(),
                disabled: !engineInstance.canUndo(),
                title: "Undo (Ctrl+Z)",
              }, "Undo"),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.redo(),
                disabled: !engineInstance.canRedo(),
                title: "Redo (Ctrl+Shift+Z)",
              }, "Redo"),
              h("span", { class: "sci-nb-toolbar-sep" }),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.setAllEditMode(),
              }, "Edit All"),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.setAllViewMode(),
              }, "View All"),
            ]),
          ])
        : null;

      const emptyNode = cellList.length === 0
        ? h("div", { class: "sci-nb-empty" }, [
            h("p", null, "Empty notebook. Add a cell to get started."),
            h(InsertHandle, { index: 0 }),
          ])
        : null;

      const cellNodes = cellList.length > 0
        ? [
            h(InsertHandle, { index: 0, key: "insert-0" }),
            ...cellList.flatMap((cell, idx) => [
              h(NotebookCell, {
                cellId: cell.id,
                pipeline,
                index: idx,
                totalCells: cellList.length,
                key: cell.id,
              }),
              h(InsertHandle, { index: idx + 1, key: `insert-${idx + 1}` }),
            ]),
          ]
        : null;

      return h(
        "div",
        {
          class: "sci-nb",
          "data-theme": props.theme,
          tabindex: 0,
          onKeydown: (e: KeyboardEvent) => {
            if (props.readOnly) return;
            engineInstance.handleKeyDown(e);
          },
        },
        [
          toolbarNode,
          h("div", { class: "sci-nb-layout", style: { display: "flex", gap: "16px" } }, [
            h("div", { class: "sci-nb-cells", style: { flex: "1" } }, [
              emptyNode,
              ...(cellNodes || []),
            ]),
          ]),
        ]
      );
    };
  },
});
