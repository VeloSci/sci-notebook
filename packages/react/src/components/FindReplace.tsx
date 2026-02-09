import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useNotebook, useSciNotebook } from "../hooks";

export interface FindMatch {
  cellId: string;
  index: number;
  length: number;
}

interface FindReplaceProps {
  onClose: () => void;
}

export const FindReplace: React.FC<FindReplaceProps> = ({ onClose }) => {
  const notebook = useNotebook();
  const engine = useSciNotebook();
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matches = useMemo<FindMatch[]>(() => {
    if (!query || !notebook) return [];
    const result: FindMatch[] = [];
    const q = caseSensitive ? query : query.toLowerCase();

    for (const cell of notebook.cells) {
      const src = caseSensitive ? cell.source : cell.source.toLowerCase();
      let pos = 0;
      while (true) {
        const idx = src.indexOf(q, pos);
        if (idx === -1) break;
        result.push({ cellId: cell.id, index: idx, length: query.length });
        pos = idx + 1;
      }
    }
    return result;
  }, [query, notebook, caseSensitive]);

  useEffect(() => {
    setCurrentIdx(0);
  }, [query, caseSensitive]);

  const navigateToMatch = useCallback((match: FindMatch) => {
    engine.focusCell(match.cellId);
    const el = document.querySelector(`[data-testid="cell-${match.cellId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [engine]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentIdx + 1) % matches.length;
    setCurrentIdx(next);
    navigateToMatch(matches[next]);
  }, [matches, currentIdx, navigateToMatch]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentIdx - 1 + matches.length) % matches.length;
    setCurrentIdx(prev);
    navigateToMatch(matches[prev]);
  }, [matches, currentIdx, navigateToMatch]);

  const replaceCurrent = useCallback(() => {
    if (matches.length === 0) return;
    const match = matches[currentIdx];
    if (!match) return;
    const cell = notebook?.cells.find(c => c.id === match.cellId);
    if (!cell) return;

    const newSource =
      cell.source.slice(0, match.index) +
      replacement +
      cell.source.slice(match.index + match.length);
    engine.updateCellSource(match.cellId, newSource);
  }, [matches, currentIdx, replacement, notebook, engine]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0 || !notebook) return;
    // Group matches by cell, process in reverse order to preserve indices
    const byCellId = new Map<string, FindMatch[]>();
    for (const m of matches) {
      const arr = byCellId.get(m.cellId) || [];
      arr.push(m);
      byCellId.set(m.cellId, arr);
    }

    for (const [cellId, cellMatches] of byCellId) {
      const cell = notebook.cells.find(c => c.id === cellId);
      if (!cell) continue;
      let src = cell.source;
      // Process in reverse order
      for (let i = cellMatches.length - 1; i >= 0; i--) {
        const m = cellMatches[i];
        src = src.slice(0, m.index) + replacement + src.slice(m.index + m.length);
      }
      engine.updateCellSource(cellId, src);
    }
  }, [matches, replacement, notebook, engine]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) goPrev();
      else goNext();
    } else if (e.key === "h" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setShowReplace(v => !v);
    }
  }, [onClose, goNext, goPrev]);

  return (
    <div className="sci-nb-find-bar" onKeyDown={handleKeyDown}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar..."
      />
      <span className="sci-nb-find-count">
        {matches.length > 0 ? `${currentIdx + 1}/${matches.length}` : query ? "0" : ""}
      </span>
      <button onClick={goPrev} title="Anterior (Shift+Enter)">▲</button>
      <button onClick={goNext} title="Siguiente (Enter)">▼</button>
      <button
        onClick={() => setCaseSensitive(v => !v)}
        title="Aa: Case sensitive"
        style={{ fontWeight: caseSensitive ? 700 : 400 }}
      >
        Aa
      </button>
      <button onClick={() => setShowReplace(v => !v)} title="Reemplazar (Ctrl+H)">
        {showReplace ? "▾" : "▸"} Reemplazar
      </button>
      {showReplace && (
        <>
          <input
            type="text"
            value={replacement}
            onChange={e => setReplacement(e.target.value)}
            placeholder="Reemplazar con..."
          />
          <button onClick={replaceCurrent} title="Reemplazar actual">1</button>
          <button onClick={replaceAll} title="Reemplazar todos">∀</button>
        </>
      )}
      <button onClick={onClose} title="Cerrar (Esc)">✕</button>
    </div>
  );
};
