import type { EditorEngine, Notebook, Cell, EventPayload } from "@velo-sci/notebook-core";

/**
 * Svelte-compatible store interface (subscribe pattern).
 * Works with Svelte's `$store` syntax.
 */
export interface Readable<T> {
  subscribe(run: (value: T) => void): () => void;
}

export interface NotebookStore {
  notebook: Readable<Readonly<Notebook>>;
  cells: Readable<ReadonlyArray<Cell>>;
  focusedCellId: Readable<string | null>;
  engine: EditorEngine;
}

/**
 * Create a Svelte-compatible store from an EditorEngine.
 *
 * Usage in Svelte:
 * ```svelte
 * <script>
 *   import { createNotebookStore } from '@velo-sci/notebook-svelte';
 *   const { notebook, cells, focusedCellId, engine } = createNotebookStore(myEngine);
 * </script>
 *
 * <p>{$notebook.title}</p>
 * {#each $cells as cell}
 *   <div>{cell.source}</div>
 * {/each}
 * ```
 */
export function createNotebookStore(engine: EditorEngine): NotebookStore {
  const notebook = createReadable<Readonly<Notebook>>(engine.getNotebook(), (set) => {
    return engine.on("notebook:updated", (payload: EventPayload) => {
      set(payload.data.notebook);
    });
  });

  const cells = createReadable<ReadonlyArray<Cell>>([...engine.getCells()], (set) => {
    return engine.on("notebook:updated", (payload: EventPayload) => {
      set([...payload.data.notebook.cells]);
    });
  });

  const focusedCellId = createReadable<string | null>(null, (set) => {
    return engine.on("cell:focused", (payload: EventPayload) => {
      set(payload.data.cellId);
    });
  });

  return { notebook, cells, focusedCellId, engine };
}

/**
 * Minimal readable store implementation compatible with Svelte's store contract.
 */
function createReadable<T>(
  initialValue: T,
  start: (set: (value: T) => void) => (() => void)
): Readable<T> {
  let value = initialValue;
  const subscribers = new Set<(value: T) => void>();
  let stop: (() => void) | null = null;

  function set(newValue: T): void {
    value = newValue;
    for (const sub of subscribers) {
      sub(value);
    }
  }

  return {
    subscribe(run: (value: T) => void): () => void {
      subscribers.add(run);
      run(value);

      if (subscribers.size === 1) {
        stop = start(set);
      }

      return () => {
        subscribers.delete(run);
        if (subscribers.size === 0 && stop) {
          stop();
          stop = null;
        }
      };
    },
  };
}
