/**
 * AI Rewrite Flow for sci-notebook.
 *
 * Flow: select text → prompt → preview diff → accept/reject
 *
 * This component renders as a floating panel near the selected text,
 * allowing the user to provide a rewrite instruction and preview the result.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";

export interface AIRewriteProps {
  /** The currently selected text to rewrite */
  selectedText: string;
  /** Position to render the panel */
  position: { top: number; left: number };
  /** Called with the rewrite instruction; should return rewritten text */
  onRewrite: (instruction: string, selectedText: string) => Promise<string>;
  /** Called when user accepts the rewrite */
  onAccept: (newText: string) => void;
  /** Called when user rejects / closes */
  onReject: () => void;
}

type RewriteState = "prompt" | "loading" | "preview";

export const AIRewrite: React.FC<AIRewriteProps> = ({
  selectedText,
  position,
  onRewrite,
  onAccept,
  onReject,
}) => {
  const [state, setState] = useState<RewriteState>("prompt");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!instruction.trim()) return;
    setState("loading");
    setError(null);

    try {
      const rewritten = await onRewrite(instruction, selectedText);
      setResult(rewritten);
      setState("preview");
    } catch (e: any) {
      setError(e.message || "Rewrite failed");
      setState("prompt");
    }
  }, [instruction, selectedText, onRewrite]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onReject();
    }
  }, [handleSubmit, onReject]);

  const handleAccept = useCallback(() => {
    onAccept(result);
  }, [result, onAccept]);

  const handleRetry = useCallback(() => {
    setState("prompt");
    setResult("");
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="sci-nb-ai-rewrite"
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        zIndex: 100,
      }}
    >
      {state === "prompt" && (
        <div className="sci-nb-ai-rewrite-prompt">
          <div className="sci-nb-ai-rewrite-selected">
            <span className="sci-nb-ai-rewrite-label">Selected:</span>
            <span className="sci-nb-ai-rewrite-text">
              {selectedText.length > 80 ? selectedText.slice(0, 80) + "..." : selectedText}
            </span>
          </div>
          <div className="sci-nb-ai-rewrite-input-row">
            <input
              ref={inputRef}
              type="text"
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How should I rewrite this?"
              className="sci-nb-ai-rewrite-input"
            />
            <button
              onClick={handleSubmit}
              disabled={!instruction.trim()}
              className="sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary"
            >
              Rewrite
            </button>
            <button onClick={onReject} className="sci-nb-ai-rewrite-btn">
              Cancel
            </button>
          </div>
          {error && <div className="sci-nb-ai-rewrite-error">{error}</div>}
        </div>
      )}

      {state === "loading" && (
        <div className="sci-nb-ai-rewrite-loading">
          <span>Rewriting...</span>
        </div>
      )}

      {state === "preview" && (
        <div className="sci-nb-ai-rewrite-preview">
          <div className="sci-nb-ai-rewrite-diff">
            <div className="sci-nb-ai-rewrite-diff-old">
              <span className="sci-nb-ai-rewrite-diff-label">Original:</span>
              <pre>{selectedText}</pre>
            </div>
            <div className="sci-nb-ai-rewrite-diff-new">
              <span className="sci-nb-ai-rewrite-diff-label">Rewritten:</span>
              <pre>{result}</pre>
            </div>
          </div>
          <div className="sci-nb-ai-rewrite-actions">
            <button
              onClick={handleAccept}
              className="sci-nb-ai-rewrite-btn sci-nb-ai-rewrite-btn--primary"
            >
              Accept
            </button>
            <button onClick={handleRetry} className="sci-nb-ai-rewrite-btn">
              Retry
            </button>
            <button onClick={onReject} className="sci-nb-ai-rewrite-btn">
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
