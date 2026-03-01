import React, { useState, useRef, useEffect } from "react";
import { CellType, CELL_ICONS } from "@velo-sci/notebook-core";
import { useSciNotebook } from "../hooks";

interface InsertHandleProps {
  index: number;
}

// Convert core SVG strings into React DOM safely without dangerouslySetInnerHTML
function svgStringToReactNode(svgStr: string): React.ReactNode {
  if (typeof document === "undefined") {
    // SSR fallback
    return null;
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgStr, "image/svg+xml");
  const svgNode = doc.querySelector("svg");
  
  if (!svgNode) return null;

  // Recursively map a DOM node to a React element
  const domToReact = (node: Element, key: number): React.ReactNode => {
    const tagName = node.tagName.toLowerCase();
    
    if (tagName === "style") {
      return React.createElement("style", { key, dangerouslySetInnerHTML: { __html: node.textContent || "" } });
    }

    // Convert DOM attributes to React camelCase equivalents
    const props: Record<string, any> = { key };
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      let name = attr.name;
      
      // Handle known React SVG attributes that need camelCase conversion
      const camelCaseMap: Record<string, string> = {
        "class": "className",
        "stroke-width": "strokeWidth",
        "stroke-linecap": "strokeLinecap",
        "stroke-linejoin": "strokeLinejoin",
        "stroke-dasharray": "strokeDasharray",
        "stroke-dashoffset": "strokeDashoffset",
        "viewbox": "viewBox",
        "fill-rule": "fillRule",
        "clip-rule": "clipRule",
      };
      
      if (camelCaseMap[name.toLowerCase()]) {
        name = camelCaseMap[name.toLowerCase()];
      }
      
      props[name] = attr.value;
    }

    const children = Array.from(node.children).map((child, childIdx) => 
      domToReact(child, childIdx)
    );

    return React.createElement(tagName, props, children.length > 0 ? children : undefined);
  };

  return domToReact(svgNode, 0);
}

const INSERT_TYPES: { type: CellType; label: string; icon: React.ReactNode }[] = [
  { type: "markdown", label: "Markdown", icon: svgStringToReactNode(CELL_ICONS.markdown) },
  { type: "code", label: "Code", icon: svgStringToReactNode(CELL_ICONS.code) },
  { type: "latex", label: "LaTeX", icon: svgStringToReactNode(CELL_ICONS.latex) },
  { type: "image", label: "Imagen", icon: svgStringToReactNode(CELL_ICONS.image) },
  { type: "embed", label: "Embed", icon: svgStringToReactNode(CELL_ICONS.embed) },
  { type: "table", label: "Tabla", icon: svgStringToReactNode(CELL_ICONS.table) },
  { type: "component", label: "Component", icon: svgStringToReactNode(CELL_ICONS.component) },
  { type: "raw", label: "Raw", icon: svgStringToReactNode(CELL_ICONS.raw) },
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
