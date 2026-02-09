import React, { useState, useRef, useEffect } from "react";
import { CellType } from "@sci-notebook/core";
import { useSciNotebook } from "../hooks";

interface InsertHandleProps {
  index: number;
}

const INSERT_TYPES: { type: CellType; label: string; icon: string }[] = [
  { type: "markdown", label: "Markdown", icon: "M" },
  { type: "code", label: "Code", icon: "</>" },
  { type: "latex", label: "LaTeX", icon: "∑" },
  { type: "image", label: "Imagen", icon: "🖼" },
  { type: "embed", label: "Embed", icon: "⧉" },
  { type: "raw", label: "Raw", icon: "T" },
];

export const InsertHandle: React.FC<InsertHandleProps> = ({ index }) => {
  const engine = useSciNotebook();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleInsert = (type: CellType) => {
    engine.insertCell(index, type);
    setOpen(false);
    // Focus the new cell after a tick
    requestAnimationFrame(() => {
      const cells = engine.getCells();
      if (cells[index]) {
        engine.setEditMode(cells[index].id);
        engine.focusCell(cells[index].id);
      }
    });
  };

  return (
    <div className="sci-nb-insert-handle" ref={menuRef}>
      <div className="sci-nb-insert-line">
        <button
          className="sci-nb-insert-btn"
          onClick={() => setOpen(!open)}
          title="Insert cell"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="8" y1="3" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="8" x2="13" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="sci-nb-insert-menu">
          {INSERT_TYPES.map(ct => (
            <button
              key={ct.type}
              className="sci-nb-insert-option"
              onClick={() => handleInsert(ct.type)}
            >
              <span className="sci-nb-insert-option-icon">{ct.icon}</span>
              <span>{ct.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
