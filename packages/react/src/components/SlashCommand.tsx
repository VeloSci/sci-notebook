import React, { useState, useEffect, useRef, useCallback } from "react";
import { CellType, CELL_ICONS } from "@velo-sci/notebook-core";


// Helper to convert SVG strings safely (mirrored from Cell.tsx)
function svgStringToReactNode(svgStr: string): React.ReactNode {
  if (typeof document === "undefined") return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgStr, "image/svg+xml");
  const svgNode = doc.querySelector("svg");
  if (!svgNode) return null;
  const domToReact = (node: Element, key: number): React.ReactNode => {
    const tagName = node.tagName.toLowerCase();
    if (tagName === "style") return React.createElement("style", { key, dangerouslySetInnerHTML: { __html: node.textContent || "" } });
    const props: Record<string, any> = { key };
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      let name = attr.name;
      const camelCaseMap: Record<string, string> = { "class": "className", "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin", "stroke-dasharray": "strokeDasharray", "stroke-dashoffset": "strokeDashoffset", "viewbox": "viewBox", "fill-rule": "fillRule", "clip-rule": "clipRule" };
      if (camelCaseMap[name.toLowerCase()]) name = camelCaseMap[name.toLowerCase()];
      props[name] = attr.value;
    }
    const children = Array.from(node.children).map((child, childIdx) => domToReact(child, childIdx));
    return React.createElement(tagName, props, children.length > 0 ? children : undefined);
  };
  return domToReact(svgNode, 0);
}

export interface SlashCommandItem {
  type: CellType;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

const DEFAULT_COMMANDS: SlashCommandItem[] = [
  { type: "markdown", label: "Markdown", description: "Markdown text block", icon: svgStringToReactNode(CELL_ICONS.markdown), keywords: ["text", "markdown", "paragraph"] },
  { type: "code", label: "Code", description: "Code block", icon: svgStringToReactNode(CELL_ICONS.code), keywords: ["code", "script", "program"] },
  { type: "latex", label: "LaTeX", description: "LaTeX formula", icon: svgStringToReactNode(CELL_ICONS.latex), keywords: ["latex", "math", "formula", "equation"] },
  { type: "image", label: "Image", description: "Image block", icon: svgStringToReactNode(CELL_ICONS.image), keywords: ["image", "picture", "photo", "img"] },
  { type: "embed", label: "Embed", description: "External content", icon: svgStringToReactNode(CELL_ICONS.embed), keywords: ["embed", "iframe", "youtube", "video", "codepen"] },
  { type: "table", label: "Table", description: "Table block", icon: svgStringToReactNode(CELL_ICONS.table), keywords: ["table", "grid", "spreadsheet"] },
  { type: "mermaid", label: "Diagram", description: "Mermaid diagram", icon: svgStringToReactNode(CELL_ICONS.mermaid), keywords: ["mermaid", "diagram", "flowchart", "chart"] },
  { type: "raw", label: "Raw", description: "Unformatted text", icon: svgStringToReactNode(CELL_ICONS.raw), keywords: ["raw", "plain", "text"] },
  { type: "notebook", label: "Notebook", description: "Nested notebook", icon: svgStringToReactNode(CELL_ICONS.notebook || '<svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>'), keywords: ["notebook", "nested", "sub"] },
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
  /** Depth level of the current notebook */
  level?: number;
}

export const SlashCommand: React.FC<SlashCommandProps> = ({
  position,
  query,
  onSelect,
  onClose,
  extraCommands,
  level = 0,
}) => {
  let allCommands = extraCommands
    ? [...DEFAULT_COMMANDS, ...extraCommands]
    : DEFAULT_COMMANDS;

  if (level > 0) {
    allCommands = allCommands.filter(c => c.type !== "notebook");
  }

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
