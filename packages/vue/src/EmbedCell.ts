import { defineComponent, h, ref, type PropType } from "vue";
import { useNotebookEngine } from "./composables";

interface EmbedData {
  url: string;
  height: string;
  sandbox: string;
  title: string;
}

const EMBED_PRESETS = [
  { label: "YouTube", pattern: "https://www.youtube.com/embed/", icon: "▶" },
  { label: "CodePen", pattern: "https://codepen.io/", icon: "⌨" },
  { label: "Observable", pattern: "https://observablehq.com/embed/", icon: "◉" },
  { label: "Desmos", pattern: "https://www.desmos.com/calculator/", icon: "📈" },
  { label: "GeoGebra", pattern: "https://www.geogebra.org/material/iframe/id/", icon: "📐" },
  { label: "Custom URL", pattern: "", icon: "🔗" },
];

function parseEmbedSource(source: string, metadata: Record<string, unknown>): EmbedData {
  return {
    url: source || "",
    height: (metadata.height as string) || "400px",
    sandbox: (metadata.sandbox as string) || "allow-scripts allow-same-origin allow-popups",
    title: (metadata.title as string) || "",
  };
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderEmbedPreview(source: string, metadata: Record<string, unknown>): string {
  const data = parseEmbedSource(source, metadata);
  if (!data.url) {
    return '<div class="sci-nb-embed-empty"><span class="sci-nb-placeholder">Click to add embedded content</span></div>';
  }
  const titleAttr = data.title ? ` title="${escapeAttr(data.title)}"` : "";
  return `<div class="sci-nb-embed-view" style="height:${data.height}">
    <iframe src="${escapeAttr(data.url)}"${titleAttr} sandbox="${escapeAttr(data.sandbox)}" style="width:100%;height:100%;border:none;border-radius:6px" loading="lazy" allowfullscreen></iframe>
  </div>`;
}

export const EmbedCell = defineComponent({
  name: "EmbedCell",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    metadata: { type: Object as PropType<Record<string, unknown>>, required: true },
    onExit: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const data = ref<EmbedData>(parseEmbedSource(props.source, props.metadata));
    const showPreview = ref(!!data.value.url);

    const save = (updates: Partial<EmbedData>) => {
      const next = { ...data.value, ...updates };
      data.value = next;
      engine.updateCellSource(props.cellId, next.url);
      engine.updateCellMetadata(props.cellId, {
        height: next.height,
        sandbox: next.sandbox,
        title: next.title,
      });
    };

    return () => {
      const hasUrl = !!data.value.url.trim();

      const presets = h("div", { class: "sci-nb-embed-presets" },
        EMBED_PRESETS.map(preset =>
          h("button", {
            key: preset.label,
            class: "sci-nb-embed-preset",
            onClick: () => { if (preset.pattern) save({ url: preset.pattern }); },
            title: preset.label,
          }, [h("span", null, preset.icon), h("span", null, preset.label)])
        )
      );

      const urlRow = h("div", { class: "sci-nb-embed-url-row" }, [
        h("input", {
          type: "text",
          class: "sci-nb-embed-url",
          value: data.value.url,
          onInput: (e: Event) => save({ url: (e.target as HTMLInputElement).value }),
          placeholder: "https://www.youtube.com/embed/dQw4w9WgXcQ",
          autofocus: true,
        }),
        h("button", {
          class: `sci-nb-embed-preview-btn ${showPreview.value ? "sci-nb-embed-preview-btn--active" : ""}`,
          onClick: () => { showPreview.value = !showPreview.value; },
          disabled: !hasUrl,
        }, showPreview.value ? "Ocultar" : "Preview"),
      ]);

      const iframe = showPreview.value && hasUrl
        ? h("div", { class: "sci-nb-embed-frame-wrap", style: { height: data.value.height } }, [
            h("iframe", {
              src: data.value.url,
              title: data.value.title || "Embedded content",
              sandbox: data.value.sandbox,
              style: { width: "100%", height: "100%", border: "none", borderRadius: "6px" },
              loading: "lazy",
              allowfullscreen: true,
            }),
          ])
        : null;

      const settings = h("div", { class: "sci-nb-embed-settings" }, [
        h("div", { class: "sci-nb-embed-field" }, [
          h("label", null, "Titulo"),
          h("input", {
            type: "text",
            value: data.value.title,
            onInput: (e: Event) => save({ title: (e.target as HTMLInputElement).value }),
            placeholder: "Titulo del embed (accesibilidad)",
          }),
        ]),
        h("div", { class: "sci-nb-embed-row" }, [
          h("div", { class: "sci-nb-embed-field sci-nb-embed-field--small" }, [
            h("label", null, "Altura"),
            h("select", {
              value: data.value.height,
              onChange: (e: Event) => save({ height: (e.target as HTMLSelectElement).value }),
            }, [
              h("option", { value: "200px" }, "200px"),
              h("option", { value: "300px" }, "300px"),
              h("option", { value: "400px" }, "400px"),
              h("option", { value: "500px" }, "500px"),
              h("option", { value: "600px" }, "600px"),
            ]),
          ]),
          h("div", { class: "sci-nb-embed-field sci-nb-embed-field--small" }, [
            h("label", null, "Sandbox"),
            h("select", {
              value: data.value.sandbox,
              onChange: (e: Event) => save({ sandbox: (e.target as HTMLSelectElement).value }),
            }, [
              h("option", { value: "allow-scripts allow-same-origin allow-popups" }, "Standard"),
              h("option", { value: "allow-scripts" }, "Scripts only"),
              h("option", { value: "" }, "Restricted"),
            ]),
          ]),
        ]),
      ]);

      return h("div", {
        class: "sci-nb-embed-editor",
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === "Escape") { e.preventDefault(); props.onExit!(); }
        },
      }, [presets, urlRow, iframe, settings, h("div", { class: "sci-nb-cell-hint" }, [h("kbd", null, "Esc"), " exit"])]);
    };
  },
});
