import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { Cell as ICell, CellType } from "@velo-sci/notebook-core";
import { RenderPipeline } from "@velo-sci/notebook-renderer";
import { useSciNotebook, useCell } from "../hooks";
import { renderEditMode, renderViewMode } from "./CellRenderers";
import { CellOutputDisplay } from "./CellOutput";

export interface CellProps {
  cellId: string;
  pipeline: RenderPipeline;
  index: number;
  totalCells: number;
}

const CELL_TYPES: { value: CellType; label: string; icon: string }[] = [
  { value: "markdown", label: "Markdown", icon: "M" },
  { value: "code", label: "Code", icon: "</>" },
  { value: "raw", label: "Raw", icon: "T" },
  { value: "latex", label: "LaTeX", icon: "∑" },
  { value: "image", label: "Image", icon: "🖼" },
  { value: "embed", label: "Embed", icon: "⧉" },
];

const PLACEHOLDERS: Record<string, string> = {
  markdown: "Write markdown here... (click to edit)",
  code: "Write code here...",
  raw: "Raw text...",
  latex: "Write LaTeX here... e.g. \\int_0^1 x^2 dx",
  image: "Click to add image",
  embed: "Click to add embedded content",
};

export const Cell: React.FC<CellProps> = ({ cellId, pipeline, index, totalCells }) => {
  const cell = useCell(cellId);
  const engine = useSciNotebook();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [slashState, setSlashState] = useState<{ query: string; pos: { top: number; left: number } } | null>(null);
  const [dragOver, setDragOver] = useState<"top" | "bottom" | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const rendered = useMemo(() => {
    if (!cell) return { html: "", cellId: "", renderTime: 0, cached: false };
    return pipeline.render(cell);
  }, [cell?.source, cell?.type, cell?.metadata, pipeline]);

  useEffect(() => {
    if (cell?.editing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${Math.max(40, ta.scrollHeight)}px`;
    }
  }, [cell?.source, cell?.editing]);

  useEffect(() => {
    if (cell?.editing && textareaRef.current) textareaRef.current.focus();
  }, [cell?.editing]);

  useEffect(() => {
    if (!showTypeMenu) return;
    const handler = (e: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(e.target as Node)) setShowTypeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTypeMenu]);

  const handleSourceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    engine.updateCellSource(cellId, val);
    const ta = e.target;
    const cursor = ta.selectionStart;
    const textBefore = val.slice(0, cursor);
    const lastNewline = textBefore.lastIndexOf("\n");
    const currentLine = textBefore.slice(lastNewline + 1);

    if (currentLine.startsWith("/")) {
      const rect = ta.getBoundingClientRect();
      const lines = textBefore.split("\n").length;
      setSlashState({ query: currentLine.slice(1), pos: { top: rect.top + lines * 22 + 4 - ta.scrollTop, left: rect.left + 8 } });
    } else {
      setSlashState(null);
    }
  }, [engine, cellId]);

  const enterEdit = useCallback(() => { engine.setEditMode(cellId); engine.focusCell(cellId); }, [engine, cellId]);
  const exitEdit = useCallback(() => { engine.setViewMode(cellId); }, [engine, cellId]);

  const handleSlashSelect = useCallback((type: CellType) => {
    const val = cell?.source || "";
    const ta = textareaRef.current;
    if (ta) {
      const cursor = ta.selectionStart;
      const textBefore = val.slice(0, cursor);
      const lineStart = textBefore.lastIndexOf("\n") + 1;
      engine.updateCellSource(cellId, (val.slice(0, lineStart) + val.slice(cursor)).trim());
    }
    engine.setCellType(cellId, type);
    setSlashState(null);
  }, [engine, cellId, cell?.source]);

  const wrapSelection = useCallback((before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end, value: val } = ta;
    engine.updateCellSource(cellId, val.substring(0, start) + before + val.substring(start, end) + after + val.substring(end));
    requestAnimationFrame(() => {
      if (textareaRef.current) { textareaRef.current.selectionStart = start + before.length; textareaRef.current.selectionEnd = end + before.length; }
    });
  }, [engine, cellId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashState && ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
    if (slashState && e.key === "Escape") { e.preventDefault(); setSlashState(null); return; }
    if (e.key === "Escape") { e.preventDefault(); exitEdit(); }
    else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault(); exitEdit();
      const cells = engine.getCells(); const idx = cells.findIndex(c => c.id === cellId);
      if (idx < cells.length - 1) { engine.focusCell(cells[idx + 1].id); engine.setEditMode(cells[idx + 1].id); }
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); exitEdit(); }
    else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault(); const ta = e.currentTarget; const start = ta.selectionStart;
      engine.updateCellSource(cellId, ta.value.substring(0, start) + "  " + ta.value.substring(ta.selectionEnd));
      requestAnimationFrame(() => { if (textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2; } });
    } else if (e.key === "Tab" && e.shiftKey) {
      e.preventDefault(); const ta = e.currentTarget; const start = ta.selectionStart;
      const before = ta.value.substring(0, start); const trimmed = before.replace(/  $/, "");
      if (trimmed !== before) { const diff = before.length - trimmed.length; engine.updateCellSource(cellId, trimmed + ta.value.substring(start));
        requestAnimationFrame(() => { if (textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - diff; } }); }
    } else if (e.key === "b" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); wrapSelection("**", "**"); }
    else if (e.key === "i" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); wrapSelection("*", "*"); }
  }, [engine, cellId, exitEdit, slashState, wrapSelection]);

  if (!cell) return null;
  const isEditing = !!cell.editing;
  const isEmpty = !cell.source.trim();
  const placeholder = PLACEHOLDERS[cell.type] || "Click to edit...";

  return (
    <div
      ref={cellRef}
      className={["sci-nb-cell", `sci-nb-cell--${cell.type}`, isEditing ? "sci-nb-cell--edit" : "sci-nb-cell--view",
        hovered ? "sci-nb-cell--hover" : "", isDragging ? "sci-nb-cell--dragging" : "",
        dragOver === "top" ? "sci-nb-cell--drag-over-top" : "", dragOver === "bottom" ? "sci-nb-cell--drag-over-bottom" : "",
      ].filter(Boolean).join(" ")}
      draggable={!isEditing}
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", cellId); e.dataTransfer.effectAllowed = "move"; setIsDragging(true); }}
      onDragEnd={() => { setIsDragging(false); setDragOver(null); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setDragOver(e.clientY < rect.top + rect.height / 2 ? "top" : "bottom"); }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => { e.preventDefault(); const did = e.dataTransfer.getData("text/plain"); setDragOver(null); if (did && did !== cellId) engine.moveCell(did, dragOver === "top" ? index : index + 1); }}
      data-testid={`cell-${cell.id}`} data-editing={String(isEditing)} data-cell-type={cell.type}
      role="region" aria-label={`${cell.type} cell ${index + 1} of ${totalCells}${isEditing ? ", editing" : ""}`}
      aria-selected={isEditing} tabIndex={0}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => engine.focusCell(cellId)}
    >
      <div className="sci-nb-cell-gutter">
        <div className="sci-nb-cell-handle" title="Drag to reorder">
          <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
            <circle cx="3" cy="4" r="1.5" /><circle cx="9" cy="4" r="1.5" />
            <circle cx="3" cy="10" r="1.5" /><circle cx="9" cy="10" r="1.5" />
            <circle cx="3" cy="16" r="1.5" /><circle cx="9" cy="16" r="1.5" />
          </svg>
        </div>
        <span className="sci-nb-cell-index">[{index + 1}]</span>
      </div>

      {/* Type badge — upper-right corner */}
      <div className="sci-nb-cell-badge-wrap">
        <button className="sci-nb-cell-badge" onClick={(e) => { e.stopPropagation(); setShowTypeMenu(!showTypeMenu); }} title="Change cell type">
          {CELL_TYPES.find(ct => ct.value === cell.type)?.icon || cell.type.slice(0, 2).toUpperCase()}
        </button>
        {showTypeMenu && (
          <div className="sci-nb-type-menu">
            {CELL_TYPES.map(ct => (
              <button key={ct.value} className={`sci-nb-type-option ${cell.type === ct.value ? "sci-nb-type-option--active" : ""}`}
                onClick={(e) => { e.stopPropagation(); engine.setCellType(cellId, ct.value); setShowTypeMenu(false); }}>
                <span className="sci-nb-type-option-icon">{ct.icon}</span>{ct.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sci-nb-cell-content">
        {isEditing
          ? renderEditMode(cell, cellId, engine, textareaRef, handleSourceChange, handleKeyDown, placeholder, exitEdit, slashState, handleSlashSelect, () => setSlashState(null))
          : renderViewMode(cell, rendered.html, isEmpty, placeholder, enterEdit)}
        {cell.outputs && cell.outputs.length > 0 && <CellOutputDisplay outputs={cell.outputs} />}
      </div>

      <div className="sci-nb-cell-actions">
        <button className="sci-nb-btn" onClick={(e) => { e.stopPropagation(); engine.moveCell(cellId, index - 1); }} disabled={index === 0} title="Move up">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 11V3M7 3L3 7M7 3l4 4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="sci-nb-btn" onClick={(e) => { e.stopPropagation(); engine.moveCell(cellId, index + 1); }} disabled={index >= totalCells - 1} title="Move down">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 3v8M7 11l-4-4M7 11l4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="sci-nb-btn" onClick={(e) => { e.stopPropagation(); engine.duplicateCell(cellId); }} title="Duplicate cell">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M10 2H3.5A1.5 1.5 0 002 3.5V10" /></svg>
        </button>
        <button className="sci-nb-btn sci-nb-btn--danger" onClick={(e) => { e.stopPropagation(); engine.deleteCell(cellId); }} title="Delete cell">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M6 6.5v3M8 6.5v3M4 4l.5 7a1.5 1.5 0 001.5 1.5h2A1.5 1.5 0 0010 11l.5-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
    </div>
  );
};
