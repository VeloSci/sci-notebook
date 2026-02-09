/**
 * Ghost Text overlay for AI inline completions.
 *
 * Renders a semi-transparent suggestion after the cursor position
 * in a textarea. User presses Tab to accept, Escape to dismiss.
 */

import React, { useEffect, useCallback } from "react";

interface GhostTextProps {
  text: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onAccept: () => void;
  onDismiss: () => void;
}

export const GhostText: React.FC<GhostTextProps> = ({
  text,
  textareaRef,
  onAccept,
  onDismiss,
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onAccept();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
    }
  }, [onAccept, onDismiss]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.addEventListener("keydown", handleKeyDown, true);
    return () => ta.removeEventListener("keydown", handleKeyDown, true);
  }, [textareaRef, handleKeyDown]);

  if (!text) return null;

  // Render ghost text as an overlay positioned after the textarea content
  const ta = textareaRef.current;
  if (!ta) return null;

  const cursorPos = ta.selectionStart;
  const before = ta.value.slice(0, cursorPos);
  const lines = before.split("\n");
  const lineHeight = 22;
  const charWidth = 7.8;
  const top = (lines.length - 1) * lineHeight;
  const left = lines[lines.length - 1].length * charWidth;

  // Show only first line of ghost text
  const firstLine = text.split("\n")[0];
  const hasMore = text.includes("\n");

  return (
    <div
      className="sci-nb-ghost-text"
      style={{
        position: "absolute",
        top: `${top + 10}px`,
        left: `${left + 12}px`,
        pointerEvents: "none",
        whiteSpace: "pre",
        fontFamily: "inherit",
        fontSize: "inherit",
        lineHeight: `${lineHeight}px`,
        zIndex: 5,
      }}
    >
      {firstLine}{hasMore ? "..." : ""}
      <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 8 }}>Tab ↹</span>
    </div>
  );
};
