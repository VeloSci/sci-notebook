import { defineComponent, h, ref, onMounted, onUnmounted, type PropType } from "vue";

export const ImageResize = defineComponent({
  name: "ImageResize",
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
    initialWidth: { type: String, required: true },
    maxWidth: { type: String, default: "100%" },
    onResize: { type: Function as PropType<(newWidth: string) => void>, required: true },
  },
  setup(props, { slots }) {
    const containerEl = ref<HTMLDivElement | null>(null);
    const imgEl = ref<HTMLImageElement | null>(null);
    const dragging = ref(false);
    const width = ref<number | null>(null);
    const startRef = { x: 0, w: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const img = imgEl.value;
      if (!img) return;
      startRef.x = e.clientX;
      startRef.w = img.offsetWidth;
      dragging.value = true;
    };

    let moveCleanup: (() => void) | null = null;

    const startDrag = () => {
      if (!dragging.value) return;
      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startRef.x;
        const newW = Math.max(50, startRef.w + dx);
        width.value = newW;
      };
      const handleMouseUp = () => {
        dragging.value = false;
        if (width.value !== null && containerEl.value) {
          const parentW = containerEl.value.parentElement?.offsetWidth || 1;
          const pct = Math.round((width.value / parentW) * 100);
          props.onResize!(`${Math.min(pct, 100)}%`);
        }
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      moveCleanup = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    };

    onUnmounted(() => { moveCleanup?.(); });

    return () => {
      if (dragging.value) startDrag();

      return h("div", {
        ref: containerEl,
        class: "sci-nb-image-resizable",
        style: {
          maxWidth: props.maxWidth,
          width: width.value !== null ? `${width.value}px` : props.initialWidth,
          position: "relative",
          display: "inline-block",
        },
      }, [
        h("img", {
          ref: imgEl,
          src: props.src,
          alt: props.alt,
          style: { width: "100%", height: "auto", display: "block" },
          draggable: false,
        }),
        slots.default?.(),
        h("div", {
          class: "sci-nb-image-resize-handle sci-nb-image-resize-handle--se",
          onMousedown: handleMouseDown,
        }),
      ]);
    };
  },
});
