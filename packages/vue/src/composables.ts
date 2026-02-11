import { inject, provide, ref, onMounted, onUnmounted, type Ref, type InjectionKey } from "vue";
import type { EditorEngine, Notebook, Cell, EventPayload } from "@velo-sci/notebook-core";

export const NotebookEngineKey: InjectionKey<EditorEngine> = Symbol("NotebookEngine");

/**
 * Provide the EditorEngine to child components.
 */
export function provideNotebookEngine(engine: EditorEngine): void {
  provide(NotebookEngineKey, engine);
}

/**
 * Inject the EditorEngine from a parent SciNotebook component.
 */
export function useNotebookEngine(): EditorEngine {
  const engine = inject(NotebookEngineKey);
  if (!engine) {
    throw new Error("useNotebookEngine must be used within a <SciNotebook> component");
  }
  return engine;
}

/**
 * Reactive notebook state — updates on every notebook:updated event.
 */
export function useNotebook(): Ref<Readonly<Notebook>> {
  const engine = useNotebookEngine();
  const notebook = ref<Readonly<Notebook>>(engine.getNotebook()) as Ref<Readonly<Notebook>>;

  let unsub: (() => void) | null = null;

  onMounted(() => {
    unsub = engine.on("notebook:updated", (payload: EventPayload) => {
      notebook.value = { ...payload.data.notebook };
    });
  });

  onUnmounted(() => {
    unsub?.();
  });

  return notebook;
}

/**
 * Reactive cell state by ID.
 */
export function useCell(cellId: Ref<string> | string): Ref<Readonly<Cell> | undefined> {
  const engine = useNotebookEngine();
  const id = typeof cellId === "string" ? cellId : cellId.value;
  const cell = ref<Readonly<Cell> | undefined>(engine.getCell(id)) as Ref<Readonly<Cell> | undefined>;

  let unsubs: Array<() => void> = [];

  onMounted(() => {
    const handler = (payload: EventPayload) => {
      const cid = typeof cellId === "string" ? cellId : cellId.value;
      if (payload.data.cellId === cid || payload.type === "notebook:updated") {
        cell.value = engine.getCell(cid);
      }
    };

    unsubs.push(engine.on("cell:updated", handler));
    unsubs.push(engine.on("cell:mode-changed", handler));
    unsubs.push(engine.on("notebook:updated", handler));
  });

  onUnmounted(() => {
    for (const u of unsubs) u();
    unsubs = [];
  });

  return cell;
}

/**
 * Reactive focused cell ID.
 */
export function useFocusedCell(): Ref<string | null> {
  const engine = useNotebookEngine();
  const focusedId = ref<string | null>(null);

  let unsub: (() => void) | null = null;

  onMounted(() => {
    unsub = engine.on("cell:focused", (payload: EventPayload) => {
      focusedId.value = payload.data.cellId;
    });
  });

  onUnmounted(() => {
    unsub?.();
  });

  return focusedId;
}
