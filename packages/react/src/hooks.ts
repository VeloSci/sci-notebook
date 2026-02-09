import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { EditorEngine, Notebook, Cell, EventPayload } from "@velo-sci/notebook-core";

export const NotebookContext = createContext<EditorEngine | null>(null);

export function useSciNotebook(): EditorEngine {
  const engine = useContext(NotebookContext);
  if (!engine) {
    throw new Error("useSciNotebook must be used within a NotebookProvider or SciNotebook component");
  }
  return engine;
}

export function useNotebook(): Readonly<Notebook> {
  const engine = useSciNotebook();
  const [notebook, setNotebook] = useState(engine.getNotebook());

  useEffect(() => {
    return engine.on("notebook:updated", (payload: EventPayload) => {
      setNotebook({ ...payload.data.notebook });
    });
  }, [engine]);

  return notebook;
}

export function useCell(cellId: string): Readonly<Cell> | undefined {
  const engine = useSciNotebook();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = (payload: EventPayload) => {
      if (payload.data.cellId === cellId || payload.type === "notebook:updated") {
        forceUpdate(v => v + 1);
      }
    };

    const unsubUpdated = engine.on("cell:updated", handler);
    const unsubMode = engine.on("cell:mode-changed", handler);
    const unsubNb = engine.on("notebook:updated", handler);

    return () => {
      unsubUpdated();
      unsubMode();
      unsubNb();
    };
  }, [engine, cellId]);

  return engine.getCell(cellId);
}

export function useFocusedCell(): string | null {
  const engine = useSciNotebook();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    return engine.on("cell:focused", (payload: EventPayload) => {
      setFocusedId(payload.data.cellId);
    });
  }, [engine]);

  return focusedId;
}

export function useNotebookEvent(
  type: string,
  handler: (payload: EventPayload) => void
): void {
  const engine = useSciNotebook();

  useEffect(() => {
    return engine.on(type, handler);
  }, [engine, type, handler]);
}
