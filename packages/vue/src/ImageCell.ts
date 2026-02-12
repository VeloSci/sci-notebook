import { defineComponent, h, ref, onMounted, onUnmounted, type PropType } from "vue";
import { useNotebookEngine } from "./composables";

interface ImageData {
  src: string;
  alt: string;
  caption: string;
  width: string;
  align: "left" | "center" | "right";
}

function parseImageSource(source: string, metadata: Record<string, unknown>): ImageData {
  return {
    src: source || "",
    alt: (metadata.alt as string) || "",
    caption: (metadata.caption as string) || "",
    width: (metadata.width as string) || "100%",
    align: (metadata.align as "left" | "center" | "right") || "center",
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderImagePreview(source: string, metadata: Record<string, unknown>): string {
  const data = parseImageSource(source, metadata);
  if (!data.src) {
    return '<div class="sci-nb-image-empty"><span class="sci-nb-placeholder">Click to add image</span></div>';
  }
  const alignStyle = `text-align:${data.align}`;
  const widthStyle = `max-width:${data.width};width:auto;max-height:400px`;
  let html = `<div class="sci-nb-image-view" style="${alignStyle}">`;
  html += `<img src="${escapeAttr(data.src)}" alt="${escapeAttr(data.alt)}" style="${widthStyle}" />`;
  if (data.caption) {
    html += `<p class="sci-nb-image-caption">${escapeHtml(data.caption)}</p>`;
  }
  html += `</div>`;
  return html;
}

export const ImageCell = defineComponent({
  name: "ImageCell",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    metadata: { type: Object as PropType<Record<string, unknown>>, required: true },
    onExit: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const fileInputEl = ref<HTMLInputElement | null>(null);
    const data = ref<ImageData>(parseImageSource(props.source, props.metadata));
    const dragOver = ref(false);

    const save = (updates: Partial<ImageData>) => {
      const next = { ...data.value, ...updates };
      data.value = next;
      engine.updateCellSource(props.cellId, next.src);
      engine.updateCellMetadata(props.cellId, {
        alt: next.alt,
        caption: next.caption,
        width: next.width,
        align: next.align,
      });
    };

    const handleFileSelect = (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        save({ src: dataUrl });
      };
      reader.readAsDataURL(file);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFileSelect(file);
          return;
        }
      }
    };

    onMounted(() => {
      document.addEventListener("paste", handlePaste);
    });

    onUnmounted(() => {
      document.removeEventListener("paste", handlePaste);
    });

    return () => {
      const hasSrc = !!data.value.src.trim();

      const preview = hasSrc
        ? h("div", { class: "sci-nb-image-preview", style: { textAlign: data.value.align } }, [
            h("img", {
              src: data.value.src,
              alt: data.value.alt,
              style: { maxWidth: data.value.width, width: "auto", maxHeight: "400px" },
            }),
            data.value.caption ? h("p", { class: "sci-nb-image-caption" }, data.value.caption) : null,
          ])
        : h("div", {
            class: `sci-nb-image-dropzone ${dragOver.value ? "sci-nb-image-dropzone--active" : ""}`,
            onDrop: (e: DragEvent) => {
              e.preventDefault();
              dragOver.value = false;
              const file = e.dataTransfer?.files[0];
              if (file) handleFileSelect(file);
            },
            onDragover: (e: DragEvent) => { e.preventDefault(); dragOver.value = true; },
            onDragleave: () => { dragOver.value = false; },
            onClick: () => fileInputEl.value?.click(),
          }, [
            h("p", null, "Drag, paste (Ctrl+V) or click to select"),
            h("input", {
              ref: fileInputEl,
              type: "file",
              accept: "image/*",
              style: { display: "none" },
              onChange: (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(file);
              },
            }),
          ]);

      const controls = h("div", { class: "sci-nb-image-controls" }, [
        h("div", { class: "sci-nb-image-field" }, [
          h("label", null, "URL"),
          h("input", {
            type: "text",
            value: data.value.src.startsWith("data:") ? "(archivo local)" : data.value.src,
            onInput: (e: Event) => save({ src: (e.target as HTMLInputElement).value }),
            placeholder: "https://example.com/image.png",
            disabled: data.value.src.startsWith("data:"),
          }),
        ]),
        h("div", { class: "sci-nb-image-field" }, [
          h("label", null, "Alt text"),
          h("input", {
            type: "text",
            value: data.value.alt,
            onInput: (e: Event) => save({ alt: (e.target as HTMLInputElement).value }),
            placeholder: "Image description",
          }),
        ]),
        h("div", { class: "sci-nb-image-field" }, [
          h("label", null, "Caption"),
          h("input", {
            type: "text",
            value: data.value.caption,
            onInput: (e: Event) => save({ caption: (e.target as HTMLInputElement).value }),
            placeholder: "Caption (optional)",
          }),
        ]),
        h("div", { class: "sci-nb-image-row" }, [
          h("div", { class: "sci-nb-image-field sci-nb-image-field--small" }, [
            h("label", null, "Width"),
            h("select", {
              value: data.value.width,
              onChange: (e: Event) => save({ width: (e.target as HTMLSelectElement).value }),
            }, [
              h("option", { value: "25%" }, "25%"),
              h("option", { value: "50%" }, "50%"),
              h("option", { value: "75%" }, "75%"),
              h("option", { value: "100%" }, "100%"),
              h("option", { value: "auto" }, "Auto"),
            ]),
          ]),
          h("div", { class: "sci-nb-image-field sci-nb-image-field--small" }, [
            h("label", null, "Align"),
            h("select", {
              value: data.value.align,
              onChange: (e: Event) => save({ align: (e.target as HTMLSelectElement).value as ImageData["align"] }),
            }, [
              h("option", { value: "left" }, "Left"),
              h("option", { value: "center" }, "Center"),
              h("option", { value: "right" }, "Right"),
            ]),
          ]),
          hasSrc
            ? h("button", { class: "sci-nb-image-clear", onClick: () => save({ src: "" }) }, "Remove image")
            : null,
        ]),
      ]);

      return h("div", {
        class: "sci-nb-image-editor",
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === "Escape") { e.preventDefault(); props.onExit!(); }
        },
      }, [preview, controls, h("div", { class: "sci-nb-cell-hint" }, [h("kbd", null, "Esc"), " exit"])]);
    };
  },
});
