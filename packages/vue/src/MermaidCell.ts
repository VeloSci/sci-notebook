import { defineComponent, h, ref, watch, onMounted } from "vue";

let mermaidIdCounter = 0;

export const MermaidPreview = defineComponent({
  name: "MermaidPreview",
  props: {
    source: { type: String, required: true },
    onClick: { type: Function, default: undefined },
  },
  setup(props) {
    const svg = ref<string | null>(null);
    const error = ref<string | null>(null);

    const renderMermaid = async (source: string) => {
      const trimmed = source.trim();
      if (!trimmed) {
        svg.value = null;
        error.value = null;
        return;
      }

      const mermaid = (globalThis as any).mermaid;
      if (!mermaid) {
        svg.value = null;
        error.value = null;
        return;
      }

      const id = `sci-mermaid-${++mermaidIdCounter}`;
      try {
        const result = await mermaid.render(id, trimmed);
        svg.value = result.svg;
        error.value = null;
      } catch (e: any) {
        error.value = e.message || String(e);
        svg.value = null;
        const errEl = document.getElementById(`d${id}`);
        if (errEl) errEl.remove();
      }
    };

    onMounted(() => { renderMermaid(props.source); });
    watch(() => props.source, (val) => { renderMermaid(val); });

    return () => {
      const clickHandler = props.onClick ? { onClick: props.onClick } : {};

      if (!props.source.trim()) {
        return h("div", { class: "sci-nb-mermaid-preview", ...clickHandler }, [
          h("span", { class: "sci-nb-placeholder" }, "Empty diagram \u2014 write Mermaid syntax"),
        ]);
      }

      const mermaid = (globalThis as any).mermaid;
      if (!mermaid) {
        return h("div", { class: "sci-nb-mermaid-preview", ...clickHandler }, [
          h("pre", { class: "sci-nb-code" }, [
            h("code", { class: "language-mermaid" }, props.source),
          ]),
          h("div", {
            style: { fontSize: "11px", color: "#94a3b8", textAlign: "center", padding: "4px" },
          }, [
            "Mermaid not available. Import ",
            h("code", null, "mermaid"),
            " and expose it as ",
            h("code", null, "globalThis.mermaid"),
            ".",
          ]),
        ]);
      }

      if (error.value) {
        return h("div", { class: "sci-nb-mermaid-error", ...clickHandler }, [
          h("strong", null, "Mermaid error:"),
          " ",
          error.value,
        ]);
      }

      if (svg.value) {
        return h("div", {
          class: "sci-nb-mermaid-preview",
          innerHTML: svg.value,
          ...clickHandler,
        });
      }

      return h("div", { class: "sci-nb-mermaid-preview", ...clickHandler }, [
        h("span", { class: "sci-nb-placeholder" }, "Rendering diagram..."),
      ]);
    };
  },
});

export function initMermaid(mermaidLib: any, config?: Record<string, unknown>): void {
  (globalThis as any).mermaid = mermaidLib;
  mermaidLib.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    ...config,
  });
}
