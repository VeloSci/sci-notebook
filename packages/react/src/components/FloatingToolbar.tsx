import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSciNotebook } from "../hooks";

interface FloatingToolbarProps {
  cellId: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface ToolbarPosition {
  top: number;
  left: number;
  visible: boolean;
}

const FORMAT_ACTIONS = [
  { label: "B", title: "Bold (Ctrl+B)", wrap: ["**", "**"], style: "font-weight:700" },
  { label: "I", title: "Italic (Ctrl+I)", wrap: ["*", "*"], style: "font-style:italic" },
  { label: "S", title: "Strikethrough", wrap: ["~~", "~~"], style: "text-decoration:line-through" },
  { label: "<>", title: "Inline code", wrap: ["`", "`"], style: "font-family:monospace;font-size:12px" },
  { label: "H1", title: "Heading 1", prefix: "# ", wrap: null, style: "font-weight:700;font-size:12px" },
  { label: "H2", title: "Heading 2", prefix: "## ", wrap: null, style: "font-weight:700;font-size:11px" },
  { label: "🔗", title: "Link", wrap: ["[", "](url)"], style: "" },
  { label: "•", title: "Bullet list", prefix: "- ", wrap: null, style: "font-size:16px" },
] as const;

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ cellId, textareaRef }) => {
  const engine = useSciNotebook();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<ToolbarPosition>({ top: 0, left: 0, visible: false });

  const updatePosition = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    if (start === end) {
      setPos(p => ({ ...p, visible: false }));
      return;
    }

    // Get position relative to textarea
    const taRect = ta.getBoundingClientRect();
    // Approximate: use textarea top and center horizontally
    setPos({
      top: taRect.top - 44,
      left: taRect.left + taRect.width / 2,
      visible: true,
    });
  }, [textareaRef]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const onSelect = () => {
      requestAnimationFrame(updatePosition);
    };

    ta.addEventListener("select", onSelect);
    ta.addEventListener("mouseup", onSelect);
    ta.addEventListener("keyup", onSelect);
    document.addEventListener("mousedown", (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node) && e.target !== ta) {
        setPos(p => ({ ...p, visible: false }));
      }
    });

    return () => {
      ta.removeEventListener("select", onSelect);
      ta.removeEventListener("mouseup", onSelect);
      ta.removeEventListener("keyup", onSelect);
    };
  }, [textareaRef, updatePosition]);

  const applyFormat = useCallback((action: typeof FORMAT_ACTIONS[number]) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const source = ta.value;
    const selected = source.slice(start, end);

    let newSource: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (action.wrap) {
      const [before, after] = action.wrap;
      newSource = source.slice(0, start) + before + selected + after + source.slice(end);
      newCursorStart = start + before.length;
      newCursorEnd = end + before.length;
    } else if ("prefix" in action && action.prefix) {
      // Line prefix — apply to each selected line
      const lineStart = source.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = source.indexOf("\n", end);
      const actualEnd = lineEnd === -1 ? source.length : lineEnd;
      const lines = source.slice(lineStart, actualEnd).split("\n");
      const prefixed = lines.map(l => action.prefix + l).join("\n");
      newSource = source.slice(0, lineStart) + prefixed + source.slice(actualEnd);
      newCursorStart = start + action.prefix.length;
      newCursorEnd = end + action.prefix.length * lines.length;
    } else {
      return;
    }

    engine.updateCellSource(cellId, newSource);

    // Restore selection after React re-render
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.setSelectionRange(newCursorStart, newCursorEnd);
      }
    });
  }, [engine, cellId, textareaRef]);

  if (!pos.visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="sci-nb-floating-toolbar"
      style={{
        position: "fixed",
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {FORMAT_ACTIONS.map((action, i) => (
        <button
          key={i}
          className="sci-nb-ft-btn"
          title={action.title}
          style={action.style ? { ...parseInlineStyle(action.style) } : undefined}
          onClick={() => applyFormat(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};

function parseInlineStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  css.split(";").forEach(pair => {
    const [key, val] = pair.split(":");
    if (key && val) {
      const camelKey = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[camelKey] = val.trim();
    }
  });
  return style as React.CSSProperties;
}
