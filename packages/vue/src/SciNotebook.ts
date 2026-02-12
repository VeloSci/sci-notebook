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
import { TOCSidebar } from "./TOCSidebar";
import { FindReplace } from "./FindReplace";

export interface SciNotebookProps {
  notebook?: Notebook;
  engine?: EditorEngine;
  plugins?: SciNotebookPlugin[];
  theme?: "light" | "dark" | string;
  onChange?: (notebook: Notebook) => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  showTOC?: boolean;
  engineRef?: { value: EditorEngine | null };
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
    engineRef: { type: Object as PropType<{ value: EditorEngine | null }>, default: undefined },
  },
  setup(props, { expose }) {
    const engineInstance = props.engine || createNotebook({
      notebook: props.notebook,
      config: { plugins: props.plugins },
    });

    provide(NotebookEngineKey, engineInstance);

    // Expose engine via ref prop
    if (props.engineRef) props.engineRef.value = engineInstance;

    const pipeline = new RenderPipeline();
    const cells = ref(engineInstance.getCells());
    const title = ref(engineInstance.getNotebook().title);
    const showFind = ref(false);
    const showTOC = ref(props.showTOC);
    const focusedCellId = ref<string | null>(null);

    const unsubs: Array<() => void> = [];

    onMounted(() => {
      unsubs.push(
        engineInstance.on("notebook:updated", (payload) => {
          cells.value = [...payload.data.notebook.cells];
          title.value = payload.data.notebook.title;
          if (props.onChange) props.onChange(payload.data.notebook);
        })
      );
      unsubs.push(
        engineInstance.on("cell:focused", (payload: any) => {
          focusedCellId.value = payload.data.cellId;
        })
      );
    });

    onUnmounted(() => {
      for (const u of unsubs) u();
      if (props.engineRef) props.engineRef.value = null;
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
                innerHTML: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h6a3 3 0 010 6H7M3 7l3-3M3 7l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg> Undo',
              }),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.redo(),
                disabled: !engineInstance.canRedo(),
                title: "Redo (Ctrl+Shift+Z)",
                innerHTML: 'Redo <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 7H5a3 3 0 000 6h2M11 7l-3-3M11 7l-3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
              }),
              h("span", { class: "sci-nb-toolbar-sep" }),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.setAllEditMode(),
                title: "Edit all cells",
              }, "Edit All"),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => engineInstance.setAllViewMode(),
                title: "Preview all cells",
              }, "View All"),
              h("span", { class: "sci-nb-toolbar-sep" }),
              h("button", {
                class: "sci-nb-toolbar-btn",
                onClick: () => { showFind.value = !showFind.value; },
                title: "Find & Replace (Ctrl+F)",
              }, "Find"),
              h("button", {
                class: ["sci-nb-toolbar-btn", showTOC.value ? "sci-nb-toolbar-btn--active" : ""].filter(Boolean).join(" "),
                onClick: () => { showTOC.value = !showTOC.value; },
                title: "Table of Contents",
              }, "TOC"),
            ]),
          ])
        : null;

      const findNode = showFind.value
        ? h(FindReplace, { onClose: () => { showFind.value = false; } })
        : null;

      const emptyNode = cellList.length === 0
        ? h("div", { class: "sci-nb-empty" }, [
            h("div", { class: "sci-nb-empty-icon", innerHTML: '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="8" y="6" width="32" height="36" rx="4" /><line x1="14" y1="14" x2="34" y2="14" /><line x1="14" y1="22" x2="28" y2="22" /><line x1="14" y1="30" x2="22" y2="30" /></svg>' }),
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

      const tocNode = showTOC.value
        ? h(TOCSidebar, { focusedCellId: focusedCellId.value })
        : null;

      return h(
        "div",
        {
          class: "sci-nb",
          "data-theme": props.theme,
          tabindex: 0,
          onKeydown: (e: KeyboardEvent) => {
            if (props.readOnly) return;
            if ((e.ctrlKey || e.metaKey) && e.key === "f") {
              e.preventDefault();
              showFind.value = !showFind.value;
              return;
            }
            engineInstance.handleKeyDown(e);
          },
        },
        [
          toolbarNode,
          findNode,
          h("div", { class: "sci-nb-layout", style: { display: "flex", gap: "16px" } }, [
            tocNode,
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
