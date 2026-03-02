import { defineComponent, h, computed } from "vue";
import type { PropType } from "vue";
import type { Notebook } from "@velo-sci/notebook-core";
import { SciNotebook } from "./SciNotebook";

export const NestedNotebook = defineComponent({
  name: "NestedNotebook",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    metadata: { type: Object as PropType<Record<string, any>>, required: true },
    readOnly: { type: Boolean, default: false },
    engine: { type: Object as PropType<any>, required: true },
    onExit: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const isReadOnly = computed(() => props.metadata?.readOnly || props.readOnly);

    const nestedNotebook = computed<Notebook>(() => {
      try {
        if (props.source) {
          return JSON.parse(props.source) as Notebook;
        }
      } catch (e) {}
      
      return {
        id: `nested-${props.cellId}`,
        title: "Nested Notebook",
        cells: [],
        metadata: {},
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    const handleNestedChange = (updated: Notebook) => {
      if (props.engine && props.engine.updateCellSource) {
        props.engine.updateCellSource(props.cellId, JSON.stringify(updated));
      }
    };

    const toggleReadOnly = () => {
      if (props.engine && props.engine.updateCellMetadata) {
        props.engine.updateCellMetadata(props.cellId, { readOnly: !props.metadata?.readOnly });
      }
    };

    return () => {
      const topBar = (!props.readOnly && props.engine)
        ? h("div", {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              borderBottom: "1px solid var(--sci-nb-border, #e5e7eb)",
              background: "var(--sci-nb-bg-toolbar, #f1f5f9)",
              borderTopLeftRadius: "5px",
              borderTopRightRadius: "5px",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--sci-nb-text, #333)",
            },
          }, [
            h("div", null, "Nested Notebook (Level 1)"),
            h("div", { style: { display: "flex", gap: "12px" } }, [
              h("label", { style: { display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" } }, [
                h("input", {
                  type: "checkbox",
                  checked: !!props.metadata?.readOnly,
                  onChange: toggleReadOnly,
                }),
                "Read-Only for users",
              ]),
              props.onExit ? h("button", {
                onClick: props.onExit,
                style: {
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--sci-nb-text-dim, #64748b)",
                },
                title: "Exit Edit Mode",
              }, "Done") : null,
            ]),
          ])
        : null;

      return h("div", {
        class: "sci-nb-nested",
        style: {
          border: "1px solid var(--sci-nb-border, #e5e7eb)",
          borderRadius: "6px",
          padding: "1px",
          background: "var(--sci-nb-bg, #fafafa)",
          marginTop: "8px",
          marginBottom: "8px",
          display: "flex",
          flexDirection: "column",
        },
      }, [
        topBar,
        h("div", { style: { padding: "8px" } }, [
          h(SciNotebook, {
            notebook: nestedNotebook.value,
            level: 1,
            onChange: handleNestedChange,
            readOnly: isReadOnly.value,
            showToolbar: false,
            showTOC: false,
            theme: "inherit",
            onExit: props.onExit,
          }),

        ]),
      ]);
    };
  },
});
