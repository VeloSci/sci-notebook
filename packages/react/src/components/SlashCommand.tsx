import React, { useState, useEffect, useRef, useCallback } from "react";
import { CellType } from "@velo-sci/notebook-core";

export interface SlashCommandItem {
  type: CellType;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
}

const DEFAULT_COMMANDS: SlashCommandItem[] = [
  { type: "markdown", label: "Text", description: "Markdown formatted text block", icon: "M", keywords: ["text", "markdown", "paragraph"] },
  { type: "code", label: "Code", description: "Code block with syntax highlighting", icon: "</>", keywords: ["code", "script", "program"] },
  { type: "latex", label: "Formula", description: "Visual LaTeX formula editor", icon: "∑", keywords: ["latex", "math", "formula", "equation"] },
  { type: "image", label: "Image", description: "Image with drag & drop, URL, caption", icon: "🖼", keywords: ["image", "picture", "photo", "img"] },
  { type: "embed", label: "Embed", description: "YouTube, CodePen, Desmos, iframe", icon: "⧉", keywords: ["embed", "iframe", "youtube", "video", "codepen"] },
  { type: "table", label: "Table", description: "Editable table with rows and columns", icon: "▦", keywords: ["table", "grid", "spreadsheet"] },
  { type: "mermaid", label: "Diagram", description: "Mermaid diagram (flowchart, sequence, etc.)", icon: "◇", keywords: ["mermaid", "diagram", "flowchart", "chart"] },
  { type: "raw", label: "Raw", description: "Plain unformatted text", icon: "T", keywords: ["raw", "plain", "text"] },
];

interface SlashCommandProps {
  /** Position relative to the textarea */
  position: { top: number; left: number };
  /** Filter query (text after /) */
  query: string;
  /** Called when a command is selected */
  onSelect: (type: CellType) => void;
  /** Called when the menu should close */
  onClose: () => void;
  /** Custom commands (optional, extends defaults) */
  extraCommands?: SlashCommandItem[];
}

export const SlashCommand: React.FC<SlashCommandProps> = ({
  position,
  query,
  onSelect,
  onClose,
  extraCommands,
}) => {
  const allCommands = extraCommands
    ? [...DEFAULT_COMMANDS, ...extraCommands]
    : DEFAULT_COMMANDS;

  const filtered = query
    ? allCommands.filter(cmd => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.type.toLowerCase().includes(q) ||
          cmd.keywords.some(k => k.includes(q))
        );
      })
    : allCommands;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        onSelect(filtered[selectedIndex]?.type || "markdown");
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (filtered.length === 0) {
    return (
      <div
        ref={menuRef}
        className="sci-nb-slash-menu"
        style={{ top: position.top, left: position.left }}
      >
        <div className="sci-nb-slash-empty">No results for "/{query}"</div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="sci-nb-slash-menu"
      style={{ top: position.top, left: position.left }}
    >
      <div className="sci-nb-slash-header">Insert block</div>
      {filtered.map((cmd, i) => (
        <button
          key={cmd.type + cmd.label}
          className={`sci-nb-slash-item ${i === selectedIndex ? "sci-nb-slash-item--active" : ""}`}
          onMouseEnter={() => setSelectedIndex(i)}
          onClick={() => onSelect(cmd.type)}
        >
          <span className="sci-nb-slash-icon">{cmd.icon}</span>
          <div className="sci-nb-slash-text">
            <span className="sci-nb-slash-label">{cmd.label}</span>
            <span className="sci-nb-slash-desc">{cmd.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export { DEFAULT_COMMANDS };
