import { defineComponent, h, ref, onMounted, onUnmounted, computed, type PropType } from "vue";
import type { Cell as ICell } from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { NotebookCell } from "./NotebookCell";
import { InsertHandle } from "./InsertHandle";

export const VirtualRenderer = defineComponent({
  name: "VirtualRenderer",
  props: {
    cells: { type: Array as PropType<ReadonlyArray<ICell>>, required: true },
    pipeline: { type: Object as PropType<RenderPipeline>, required: true },
    estimatedHeight: { type: Number, default: 120 },
    overscan: { type: Number, default: 5 },
  },
  setup(props) {
    const containerEl = ref<HTMLDivElement | null>(null);
    const visibleRange = ref({ start: 0, end: 20 });
    const cellHeights = new Map<number, number>();

    const getHeight = (index: number) => cellHeights.get(index) ?? props.estimatedHeight;

    const totalHeight = computed(() => {
      let h = 0;
      for (let i = 0; i < props.cells.length; i++) {
        h += getHeight(i) + 32;
      }
      return h;
    });

    const topOffset = computed(() => {
      let h = 0;
      for (let i = 0; i < visibleRange.value.start; i++) {
        h += getHeight(i) + 32;
      }
      return h;
    });

    let scrollCleanup: (() => void) | null = null;

    onMounted(() => {
      const container = containerEl.value;
      if (!container) return;

      const handleScroll = () => {
        const scrollTop = container.scrollTop;
        const viewportHeight = container.clientHeight;
        let accum = 0;
        let start = 0;
        let end = props.cells.length;

        for (let i = 0; i < props.cells.length; i++) {
          const ch = getHeight(i) + 32;
          if (accum + ch >= scrollTop && start === 0) {
            start = Math.max(0, i - props.overscan);
          }
          if (accum > scrollTop + viewportHeight) {
            end = Math.min(props.cells.length, i + props.overscan);
            break;
          }
          accum += ch;
        }

        if (visibleRange.value.start !== start || visibleRange.value.end !== end) {
          visibleRange.value = { start, end };
        }
      };

      handleScroll();
      container.addEventListener("scroll", handleScroll, { passive: true });
      scrollCleanup = () => container.removeEventListener("scroll", handleScroll);
    });

    onUnmounted(() => { scrollCleanup?.(); });

    return () => {
      const visibleCells = props.cells.slice(visibleRange.value.start, visibleRange.value.end);

      const cellNodes = visibleCells.flatMap((cell, i) => {
        const realIndex = visibleRange.value.start + i;
        return [
          h(NotebookCell, {
            cellId: cell.id,
            pipeline: props.pipeline,
            index: realIndex,
            totalCells: props.cells.length,
            key: cell.id,
          }),
          h(InsertHandle, { index: realIndex + 1, key: `insert-${realIndex + 1}` }),
        ];
      });

      return h("div", {
        ref: containerEl,
        class: "sci-nb-virtual-container",
        style: { height: "100%", overflow: "auto", position: "relative" },
      }, [
        h("div", { style: { height: `${totalHeight.value}px`, position: "relative" } }, [
          h("div", {
            style: { position: "absolute", top: `${topOffset.value}px`, left: "0", right: "0" },
          }, [
            visibleRange.value.start === 0 ? h(InsertHandle, { index: 0 }) : null,
            ...cellNodes,
          ]),
        ]),
      ]);
    };
  },
});
