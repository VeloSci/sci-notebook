import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSciNotebook } from "../hooks";
import { MATH_CATEGORIES, MathBlock } from "./math-categories";

interface MathEditorProps {
  cellId: string;
  source: string;
  onExit: () => void;
}

// ── Render preview (simple KaTeX-like via dangerouslySetInnerHTML) ──

function renderLatexPreview(latex: string): string {
  const clean = latex.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  if (!clean) return '<span class="sci-nb-math-preview-empty">Empty formula</span>';

  // Use KaTeX if available globally
  if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
    try {
      return (globalThis as any).katex.renderToString(clean, {
        displayMode: true,
        throwOnError: false,
      });
    } catch { /* fall through */ }
  }

  // Fallback: styled code
  const escaped = clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<code class="sci-nb-math-preview-code">${escaped}</code>`;
}

// ── Component ──────────────────────────────────────────────────

export const MathEditor: React.FC<MathEditorProps> = ({ cellId, source, onExit }) => {
  const engine = useSciNotebook();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [showRaw, setShowRaw] = useState(false);

  // Strip $$ wrappers for editing
  const innerLatex = source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();

  const updateSource = useCallback((newInner: string) => {
    engine.updateCellSource(cellId, `$$\n${newInner}\n$$`);
  }, [engine, cellId]);

  const handleRawChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSource(e.target.value);
  }, [updateSource]);

  const insertBlock = useCallback((block: MathBlock) => {
    const ta = textareaRef.current;
    if (!ta) {
      // If raw mode is off, just append
      updateSource(innerLatex + (innerLatex ? " " : "") + block.latex.replace(/▢/g, ""));
      return;
    }

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const selected = val.slice(start, end);

    // Replace first ▢ with selection, rest with empty
    let inserted = block.latex;
    if (selected) {
      inserted = inserted.replace("▢", selected);
    }
    inserted = inserted.replace(/▢/g, "");

    const newVal = val.slice(0, start) + inserted + val.slice(end);
    updateSource(newVal);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const cursorPos = block.cursor != null
          ? start + block.cursor
          : start + inserted.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    });
  }, [innerLatex, updateSource]);

  // Navigate to next cell (Shift+Enter behavior)
  const exitAndNext = useCallback(() => {
    onExit();
    const cells = engine.getCells();
    const idx = cells.findIndex(c => c.id === cellId);
    if (idx < cells.length - 1) {
      engine.focusCell(cells[idx + 1].id);
      engine.setEditMode(cells[idx + 1].id);
    }
  }, [engine, cellId, onExit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onExit();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      exitAndNext();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      onExit();
    }
  }, [onExit, exitAndNext]);

  // Auto-focus the container so keyboard events are captured
  useEffect(() => {
    if (showRaw && textareaRef.current) {
      textareaRef.current.focus();
    } else if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [showRaw]);

  // Focus container on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Auto-resize
  useEffect(() => {
    if (showRaw && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${Math.max(60, ta.scrollHeight)}px`;
    }
  }, [innerLatex, showRaw]);

  const category = MATH_CATEGORIES[activeCategory];

  return (
    <div
      ref={containerRef}
      className="sci-nb-math-editor"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Category tabs */}
      <div className="sci-nb-math-tabs">
        {MATH_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            className={`sci-nb-math-tab ${i === activeCategory ? "sci-nb-math-tab--active" : ""}`}
            onClick={() => setActiveCategory(i)}
            title={cat.name}
            tabIndex={-1}
          >
            <span className="sci-nb-math-tab-icon">{cat.icon}</span>
            <span className="sci-nb-math-tab-label">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Block palette */}
      <div className="sci-nb-math-palette">
        {category.blocks.map((block, i) => (
          <button
            key={i}
            className="sci-nb-math-block"
            onClick={() => insertBlock(block)}
            title={block.latex}
            tabIndex={-1}
          >
            {block.label}
          </button>
        ))}
      </div>

      {/* Editor area: toggle between visual preview and raw */}
      <div className="sci-nb-math-editor-area">
        <div className="sci-nb-math-mode-toggle">
          <button
            className={`sci-nb-math-mode-btn ${!showRaw ? "sci-nb-math-mode-btn--active" : ""}`}
            onClick={() => setShowRaw(false)}
            tabIndex={-1}
          >Preview</button>
          <button
            className={`sci-nb-math-mode-btn ${showRaw ? "sci-nb-math-mode-btn--active" : ""}`}
            onClick={() => setShowRaw(true)}
            tabIndex={-1}
          >LaTeX</button>
        </div>

        {showRaw ? (
          <textarea
            ref={textareaRef}
            className="sci-nb-math-raw"
            value={innerLatex}
            onChange={handleRawChange}
            placeholder="Type LaTeX here..."
            spellCheck={false}
            autoFocus
          />
        ) : (
          <div className="sci-nb-math-visual">
            <div
              className="sci-nb-math-preview"
              dangerouslySetInnerHTML={{ __html: renderLatexPreview(source) }}
            />
            <p className="sci-nb-math-visual-hint">
              Click the blocks above to build your formula.
              Switch to <strong>LaTeX</strong> mode to edit directly.
            </p>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="sci-nb-cell-hint">
        <kbd>Esc</kbd> exit &middot; <kbd>Shift+Enter</kbd> next &middot; <kbd>Ctrl+Enter</kbd> render
      </div>
    </div>
  );
};
