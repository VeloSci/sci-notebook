/**
 * AI Cell Generation UI for sci-notebook.
 *
 * Flow: prompt → generate → preview → insert cells
 *
 * Renders as a modal/inline panel where the user types a prompt,
 * the AI generates one or more cells, and the user can accept or reject.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { Cell, CellType } from "@sci-notebook/core";

export interface GeneratedCell {
  type: CellType;
  source: string;
}

export interface AICellGenerateProps {
  /** Called with the prompt; should return generated cells */
  onGenerate: (prompt: string) => Promise<GeneratedCell[]>;
  /** Called when user accepts the generated cells */
  onAccept: (cells: GeneratedCell[]) => void;
  /** Called when user closes without accepting */
  onCancel: () => void;
  /** Insert position index */
  insertIndex: number;
}

type GenState = "prompt" | "loading" | "preview";

export const AICellGenerate: React.FC<AICellGenerateProps> = ({
  onGenerate,
  onAccept,
  onCancel,
}) => {
  const [state, setState] = useState<GenState>("prompt");
  const [prompt, setPrompt] = useState("");
  const [cells, setCells] = useState<GeneratedCell[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setState("loading");
    setError(null);

    try {
      const generated = await onGenerate(prompt);
      setCells(generated);
      setState("preview");
    } catch (e: any) {
      setError(e.message || "Generation failed");
      setState("prompt");
    }
  }, [prompt, onGenerate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }, [handleGenerate, onCancel]);

  const handleAccept = useCallback(() => {
    onAccept(cells);
  }, [cells, onAccept]);

  const handleRegenerate = useCallback(() => {
    setState("prompt");
    setCells([]);
    inputRef.current?.focus();
  }, []);

  const CELL_TYPE_LABELS: Record<string, string> = {
    markdown: "Markdown",
    code: "Code",
    latex: "LaTeX",
    table: "Table",
    mermaid: "Mermaid",
    raw: "Raw",
  };

  return (
    <div className="sci-nb-ai-generate">
      {state === "prompt" && (
        <div className="sci-nb-ai-generate-prompt">
          <div className="sci-nb-ai-generate-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1v14M1 8h14" strokeLinecap="round" />
            </svg>
            <span>Generate cells with AI</span>
          </div>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to generate...&#10;e.g. 'Create a markdown cell explaining Newton's second law with a LaTeX formula'"
            className="sci-nb-ai-generate-textarea"
            rows={3}
          />
          <div className="sci-nb-ai-generate-actions">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary"
            >
              Generate (Ctrl+Enter)
            </button>
            <button onClick={onCancel} className="sci-nb-ai-rewrite-btn">
              Cancel
            </button>
          </div>
          {error && <div className="sci-nb-ai-rewrite-error">{error}</div>}
        </div>
      )}

      {state === "loading" && (
        <div className="sci-nb-ai-generate-loading">
          <span>Generating cells...</span>
        </div>
      )}

      {state === "preview" && (
        <div className="sci-nb-ai-generate-preview">
          <div className="sci-nb-ai-generate-header">
            <span>Generated {cells.length} cell{cells.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="sci-nb-ai-generate-cells">
            {cells.map((cell, i) => (
              <div key={i} className="sci-nb-ai-generate-cell">
                <div className="sci-nb-ai-generate-cell-badge">
                  {CELL_TYPE_LABELS[cell.type] || cell.type}
                </div>
                <pre className="sci-nb-ai-generate-cell-source">
                  {cell.source.length > 200 ? cell.source.slice(0, 200) + "..." : cell.source}
                </pre>
              </div>
            ))}
          </div>
          <div className="sci-nb-ai-generate-actions">
            <button
              onClick={handleAccept}
              className="sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary"
            >
              Insert {cells.length} cell{cells.length !== 1 ? "s" : ""}
            </button>
            <button onClick={handleRegenerate} className="sci-nb-ai-rewrite-btn">
              Regenerate
            </button>
            <button onClick={onCancel} className="sci-nb-ai-rewrite-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
