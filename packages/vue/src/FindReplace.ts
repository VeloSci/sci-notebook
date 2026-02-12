import { defineComponent, h, ref, computed, watch, onMounted, type PropType } from "vue";
import { useNotebookEngine, useNotebook } from "./composables";

export interface FindMatch {
  cellId: string;
  index: number;
  length: number;
}

export const FindReplace = defineComponent({
  name: "FindReplace",
  props: {
    onClose: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const notebook = useNotebook();
    const engine = useNotebookEngine();
    const query = ref("");
    const replacement = ref("");
    const showReplace = ref(false);
    const caseSensitive = ref(false);
    const currentIdx = ref(0);
    const inputEl = ref<HTMLInputElement | null>(null);

    onMounted(() => { inputEl.value?.focus(); });

    const matches = computed<FindMatch[]>(() => {
      if (!query.value || !notebook.value) return [];
      const result: FindMatch[] = [];
      const q = caseSensitive.value ? query.value : query.value.toLowerCase();
      for (const cell of notebook.value.cells) {
        const src = caseSensitive.value ? cell.source : cell.source.toLowerCase();
        let pos = 0;
        while (true) {
          const idx = src.indexOf(q, pos);
          if (idx === -1) break;
          result.push({ cellId: cell.id, index: idx, length: query.value.length });
          pos = idx + 1;
        }
      }
      return result;
    });

    watch([query, caseSensitive], () => { currentIdx.value = 0; });

    const navigateToMatch = (match: FindMatch) => {
      engine.focusCell(match.cellId);
      const el = document.querySelector(`[data-testid="cell-${match.cellId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const goNext = () => {
      if (matches.value.length === 0) return;
      const next = (currentIdx.value + 1) % matches.value.length;
      currentIdx.value = next;
      navigateToMatch(matches.value[next]);
    };

    const goPrev = () => {
      if (matches.value.length === 0) return;
      const prev = (currentIdx.value - 1 + matches.value.length) % matches.value.length;
      currentIdx.value = prev;
      navigateToMatch(matches.value[prev]);
    };

    const replaceCurrent = () => {
      if (matches.value.length === 0) return;
      const match = matches.value[currentIdx.value];
      if (!match) return;
      const cell = notebook.value?.cells.find(c => c.id === match.cellId);
      if (!cell) return;
      const newSource =
        cell.source.slice(0, match.index) +
        replacement.value +
        cell.source.slice(match.index + match.length);
      engine.updateCellSource(match.cellId, newSource);
    };

    const replaceAll = () => {
      if (matches.value.length === 0 || !notebook.value) return;
      const byCellId = new Map<string, FindMatch[]>();
      for (const m of matches.value) {
        const arr = byCellId.get(m.cellId) || [];
        arr.push(m);
        byCellId.set(m.cellId, arr);
      }
      for (const [cellId, cellMatches] of byCellId) {
        const cell = notebook.value.cells.find(c => c.id === cellId);
        if (!cell) continue;
        let src = cell.source;
        for (let i = cellMatches.length - 1; i >= 0; i--) {
          const m = cellMatches[i];
          src = src.slice(0, m.index) + replacement.value + src.slice(m.index + m.length);
        }
        engine.updateCellSource(cellId, src);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); props.onClose!(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) goPrev(); else goNext();
      } else if (e.key === "h" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        showReplace.value = !showReplace.value;
      }
    };

    return () => {
      const children = [
        h("input", {
          ref: inputEl,
          type: "text",
          value: query.value,
          onInput: (e: Event) => { query.value = (e.target as HTMLInputElement).value; },
          placeholder: "Search...",
        }),
        h("span", { class: "sci-nb-find-count" },
          matches.value.length > 0
            ? `${currentIdx.value + 1}/${matches.value.length}`
            : query.value ? "0" : ""
        ),
        h("button", { onClick: goPrev, title: "Previous (Shift+Enter)" }, "▲"),
        h("button", { onClick: goNext, title: "Next (Enter)" }, "▼"),
        h("button", {
          onClick: () => { caseSensitive.value = !caseSensitive.value; },
          title: "Aa: Case sensitive",
          style: { fontWeight: caseSensitive.value ? 700 : 400 },
        }, "Aa"),
        h("button", {
          onClick: () => { showReplace.value = !showReplace.value; },
          title: "Replace (Ctrl+H)",
        }, `${showReplace.value ? "▾" : "▸"} Replace`),
      ];

      if (showReplace.value) {
        children.push(
          h("input", {
            type: "text",
            value: replacement.value,
            onInput: (e: Event) => { replacement.value = (e.target as HTMLInputElement).value; },
            placeholder: "Replace with...",
          }),
          h("button", { onClick: replaceCurrent, title: "Replace current" }, "1"),
          h("button", { onClick: replaceAll, title: "Replace all" }, "∀"),
        );
      }

      children.push(
        h("button", { onClick: () => props.onClose!(), title: "Close (Esc)" }, "✕"),
      );

      return h("div", { class: "sci-nb-find-bar", onKeydown: handleKeyDown }, children);
    };
  },
});
