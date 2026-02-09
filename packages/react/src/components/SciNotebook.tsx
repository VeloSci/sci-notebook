import React, { useMemo, useEffect, useState, useCallback } from "react";
import { EditorEngine, createNotebook, Notebook, Cell as ICell, CellType, SciNotebookPlugin } from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { NotebookContext } from "../hooks";
import { Cell } from "./Cell";
import { InsertHandle } from "./InsertHandle";
import { TOCSidebar } from "./TOCSidebar";
import { FindReplace } from "./FindReplace";

export interface SciNotebookProps {
  /** Pre-built notebook object */
  notebook?: Notebook;
  /** Pre-built engine (takes priority over notebook) */
  engine?: EditorEngine;
  /** Plugins to register */
  plugins?: SciNotebookPlugin[];
  /** Zero-config: just pass markdown content */
  initialContent?: string;
  /** Theme */
  theme?: "light" | "dark" | string;
  /** Callback when notebook changes */
  onChange?: (notebook: Notebook) => void;
  /** Callback when a cell is focused */
  onCellFocus?: (cellId: string | null) => void;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show/hide the top toolbar */
  showToolbar?: boolean;
  /** CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Imperative engine access */
  engineRef?: React.MutableRefObject<EditorEngine | null>;
  /** Show TOC sidebar */
  showTOC?: boolean;
}

export const SciNotebook: React.FC<SciNotebookProps> = ({
  notebook: initialNotebook,
  engine: providedEngine,
  plugins,
  initialContent,
  theme = "light",
  onChange,
  onCellFocus,
  readOnly = false,
  showToolbar = true,
  className,
  style,
  engineRef,
  showTOC: showTOCProp = false,
}) => {
  const engine = useMemo(() => {
    if (providedEngine) return providedEngine;

    // Zero-config: create notebook from initialContent string
    if (initialContent && !initialNotebook) {
      const cells = parseInitialContent(initialContent);
      return createNotebook({
        notebook: {
          id: "",
          title: "Untitled",
          cells,
          metadata: {},
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        config: { plugins },
      });
    }

    return createNotebook({ notebook: initialNotebook, config: { plugins } });
  }, [providedEngine]);

  // Expose engine via ref
  useEffect(() => {
    if (engineRef) engineRef.current = engine;
    return () => { if (engineRef) engineRef.current = null; };
  }, [engine, engineRef]);

  const [notebook, setNotebook] = useState<Notebook>(initialNotebook || engine.getNotebook());

  useEffect(() => {
    const unsub = engine.on("notebook:updated", (payload: any) => {
      setNotebook(payload.data.notebook);
      if (onChange) onChange(payload.data.notebook);
    });
    return unsub;
  }, [engine, onChange]);

  useEffect(() => {
    if (!onCellFocus) return;
    return engine.on("cell:focused", (payload: any) => {
      onCellFocus(payload.data.cellId);
    });
  }, [engine, onCellFocus]);

  const pipeline = useMemo(() => new RenderPipeline(), []);

  const cells = notebook.cells;
  const [showFind, setShowFind] = useState(false);
  const [showTOC, setShowTOC] = useState(showTOCProp);
  const [focusedCellId, setFocusedCellId] = useState<string | null>(null);

  useEffect(() => {
    return engine.on("cell:focused", (payload: any) => {
      setFocusedCellId(payload.data.cellId);
    });
  }, [engine]);

  const handleGlobalKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (readOnly) return;
    // Ctrl+F: open find bar
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      setShowFind(v => !v);
      return;
    }
    engine.handleKeyDown(e.nativeEvent);
  }, [engine, readOnly]);

  return (
    <NotebookContext.Provider value={engine}>
      <div
        className={`sci-nb ${className || ""}`}
        style={style}
        data-theme={theme}
        onKeyDown={handleGlobalKeyDown}
        tabIndex={0}
      >
        {showToolbar && (
          <div className="sci-nb-toolbar">
            <div className="sci-nb-toolbar-group">
              <span className="sci-nb-toolbar-title">{notebook.title}</span>
            </div>
            <div className="sci-nb-toolbar-group">
              <button
                className="sci-nb-toolbar-btn"
                onClick={() => engine.undo()}
                disabled={!engine.canUndo()}
                title="Undo (Ctrl+Z)"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 7h6a3 3 0 010 6H7M3 7l3-3M3 7l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Undo
              </button>
              <button
                className="sci-nb-toolbar-btn"
                onClick={() => engine.redo()}
                disabled={!engine.canRedo()}
                title="Redo (Ctrl+Shift+Z)"
              >
                Redo
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 7H5a3 3 0 000 6h2M11 7l-3-3M11 7l-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <span className="sci-nb-toolbar-sep" />
              <button
                className="sci-nb-toolbar-btn"
                onClick={() => engine.setAllEditMode()}
                title="Edit all cells"
              >Edit All</button>
              <button
                className="sci-nb-toolbar-btn"
                onClick={() => engine.setAllViewMode()}
                title="Preview all cells"
              >View All</button>
              <span className="sci-nb-toolbar-sep" />
              <button
                className="sci-nb-toolbar-btn"
                onClick={() => setShowFind(v => !v)}
                title="Find & Replace (Ctrl+F)"
              >Buscar</button>
              <button
                className={`sci-nb-toolbar-btn ${showTOC ? "sci-nb-toolbar-btn--active" : ""}`}
                onClick={() => setShowTOC(v => !v)}
                title="Table of Contents"
              >TOC</button>
            </div>
          </div>
        )}

        {showFind && <FindReplace onClose={() => setShowFind(false)} />}

        <div className="sci-nb-layout" style={{ display: "flex", gap: 16 }}>
        {showTOC && <TOCSidebar focusedCellId={focusedCellId} />}
        <div className="sci-nb-cells" style={{ flex: 1 }}>
          {cells.length === 0 && (
            <div className="sci-nb-empty">
              <div className="sci-nb-empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="8" y="6" width="32" height="36" rx="4" />
                  <line x1="14" y1="14" x2="34" y2="14" />
                  <line x1="14" y1="22" x2="28" y2="22" />
                  <line x1="14" y1="30" x2="22" y2="30" />
                </svg>
              </div>
              <p>Notebook vacio. Agrega una celda para comenzar.</p>
              <InsertHandle index={0} />
            </div>
          )}

          {/* Insert handle before first cell */}
          {cells.length > 0 && <InsertHandle index={0} />}

          {cells.map((cell, idx) => (
            <React.Fragment key={cell.id}>
              <Cell
                cellId={cell.id}
                pipeline={pipeline}
                index={idx}
                totalCells={cells.length}
              />
              {/* Insert handle between cells and after last */}
              <InsertHandle index={idx + 1} />
            </React.Fragment>
          ))}
        </div>
        </div>
      </div>
    </NotebookContext.Provider>
  );
};

/**
 * Parse a simple markdown string into cells.
 * Splits on --- or empty lines between headings.
 */
function parseInitialContent(content: string): ICell[] {
  const blocks = content.split(/\n---\n/).filter(b => b.trim());
  if (blocks.length === 0) {
    return [{ id: `cell_${Date.now()}`, type: "markdown", source: content, metadata: {} }];
  }
  return blocks.map((block, i) => ({
    id: `cell_${Date.now()}_${i}`,
    type: "markdown" as CellType,
    source: block.trim(),
    metadata: {},
  }));
}
