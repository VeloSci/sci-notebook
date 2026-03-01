import { defineComponent, h, computed, type PropType } from "vue";

export const ComponentCell = defineComponent({
  name: "ComponentCell",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    components: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  },
  setup(props) {
    const data = computed(() => {
      if (!props.source.trim()) return null;
      try {
        return JSON.parse(props.source);
      } catch (e) {
        return { __error: (e as Error).message };
      }
    });

    return () => {
      const d = data.value;
      if (!d) {
        return h("div", {
          class: "sci-nb-component-empty",
          style: { padding: "1rem", color: "var(--sci-text-muted)", fontStyle: "italic" },
        }, 'No component specified or empty JSON. Expected: {"name": "ComponentName", "props": {}}');
      }
      
      if (d.__error) {
        return h("div", {
          class: "sci-nb-component-error",
          style: { color: "red", padding: "1rem", border: "1px solid red", borderRadius: "8px" },
        }, `Invalid JSON: ${d.__error}`);
      }

      const compName = d.name;
      if (!compName) {
        return h("div", {
          class: "sci-nb-component-empty",
          style: { padding: "1rem", color: "var(--sci-text-muted)", fontStyle: "italic" },
        }, 'JSON must include a "name" property.');
      }

      const Component = props.components[compName];
      if (!Component) {
        return h("div", {
          class: "sci-nb-component-not-found",
          style: { padding: "1rem", color: "var(--sci-text-muted)" },
        }, [
          "Component ",
          h("strong", compName),
          " not found in the ",
          h("code", "components"),
          " registry."
        ]);
      }

      return h("div", { class: "sci-nb-component-wrapper" }, [
        h(Component, d.props || {})
      ]);
    };
  },
});
