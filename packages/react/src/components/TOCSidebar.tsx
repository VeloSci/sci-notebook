import React, { useMemo, useCallback } from "react";
import { useNotebook, useSciNotebook } from "../hooks";

export interface TOCItem {
  cellId: string;
  level: number;
  text: string;
}

export const TOCSidebar: React.FC<{ focusedCellId?: string | null }> = ({ focusedCellId }) => {
  const notebook = useNotebook();
  const engine = useSciNotebook();

  const items = useMemo<TOCItem[]>(() => {
    if (!notebook) return [];
    const result: TOCItem[] = [];
    for (const cell of notebook.cells) {
      if (cell.type !== "markdown") continue;
      const lines = cell.source.split("\n");
      for (const line of lines) {
        const match = line.match(/^(#{1,3})\s+(.+)/);
        if (match) {
          result.push({
            cellId: cell.id,
            level: match[1].length,
            text: match[2].replace(/[*_`~#]/g, "").trim(),
          });
        }
      }
    }
    return result;
  }, [notebook]);

  const handleClick = useCallback((cellId: string) => {
    engine.focusCell(cellId);
    engine.setEditMode(cellId);
    // Scroll to cell
    const el = document.querySelector(`[data-testid="cell-${cellId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [engine]);

  if (items.length === 0) return null;

  return (
    <nav className="sci-nb-toc">
      <div className="sci-nb-toc-title">Contenido</div>
      {items.map((item, i) => (
        <button
          key={`${item.cellId}-${i}`}
          className={[
            "sci-nb-toc-item",
            `sci-nb-toc-item--h${item.level}`,
            item.cellId === focusedCellId ? "sci-nb-toc-item--active" : "",
          ].join(" ")}
          onClick={() => handleClick(item.cellId)}
          title={item.text}
        >
          {item.text}
        </button>
      ))}
    </nav>
  );
};
