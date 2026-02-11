import React, { useRef, useEffect, useCallback, useState } from "react";
import { highlightCodeTokens } from "@velo-sci/notebook-renderer";

interface CodeEditorProps {
  cellId: string;
  source: string;
  language: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
}

/**
 * Syntax-highlighted code editor using an overlay technique:
 * - A hidden <textarea> captures input and keyboard events
 * - A <pre><code> overlay renders the highlighted HTML on top
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  source,
  language,
  onChange,
  onKeyDown,
  placeholder,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlighted, setHighlighted] = useState("");

  // Sync highlighted output
  useEffect(() => {
    const html = highlightCodeTokens(source, language || "text");
    // Extract inner content from <pre><code>...</code></pre>
    const match = html.match(/<code[^>]*>([\s\S]*)<\/code>/);
    setHighlighted(match ? match[1] : html);
  }, [source, language]);

  // Sync scroll between textarea and pre overlay
  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${Math.max(40, ta.scrollHeight)}px`;
    }
  }, [source]);

  // Auto-focus
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="sci-nb-code-editor-wrap">
      <pre
        ref={preRef}
        className="sci-nb-code-editor-highlight sci-nb-code--highlighted"
        aria-hidden="true"
      >
        <code className={`language-${language || "text"}`}>
          <span dangerouslySetInnerHTML={{ __html: highlighted || "&nbsp;" }} />
          {/* Trailing newline so the pre matches textarea height */}
          {"\n"}
        </code>
      </pre>
      <textarea
        ref={textareaRef}
        className="sci-nb-code-editor-input"
        value={source}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        rows={1}
      />
    </div>
  );
};
