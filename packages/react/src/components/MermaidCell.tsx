/**
 * MermaidCell — Renders Mermaid diagrams asynchronously.
 *
 * Uses globalThis.mermaid (consumer must import and expose mermaid).
 * Handles async mermaid.render() from v10+.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

interface MermaidPreviewProps {
  source: string;
  onClick?: () => void;
}

let mermaidIdCounter = 0;

export const MermaidPreview: React.FC<MermaidPreviewProps> = ({ source, onClick }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = source.trim();
    if (!trimmed) {
      setSvg(null);
      setError(null);
      return;
    }

    const mermaid = (globalThis as any).mermaid;
    if (!mermaid) {
      setError(null);
      setSvg(null);
      return;
    }

    let cancelled = false;
    const id = `sci-mermaid-${++mermaidIdCounter}`;

    (async () => {
      try {
        // mermaid v10+ render() is async and returns { svg }
        const result = await mermaid.render(id, trimmed);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || String(e));
          setSvg(null);
        }
        // mermaid.render creates a temp element on error — clean it up
        const errEl = document.getElementById(`d${id}`);
        if (errEl) errEl.remove();
      }
    })();

    return () => { cancelled = true; };
  }, [source]);

  const mermaid = (globalThis as any).mermaid;

  if (!source.trim()) {
    return (
      <div className="sci-nb-mermaid-preview" onClick={onClick}>
        <span className="sci-nb-placeholder">Empty diagram — write Mermaid syntax</span>
      </div>
    );
  }

  if (!mermaid) {
    // No mermaid library — show code fallback
    return (
      <div className="sci-nb-mermaid-preview" onClick={onClick}>
        <pre className="sci-nb-code"><code className="language-mermaid">{source}</code></pre>
        <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: 4 }}>
          Mermaid not available. Import <code>mermaid</code> and expose it as <code>globalThis.mermaid</code>.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sci-nb-mermaid-error" onClick={onClick}>
        <strong>Mermaid error:</strong> {error}
      </div>
    );
  }

  if (svg) {
    return (
      <div
        ref={containerRef}
        className="sci-nb-mermaid-preview"
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  // Loading state
  return (
    <div className="sci-nb-mermaid-preview" onClick={onClick}>
      <span className="sci-nb-placeholder">Rendering diagram...</span>
    </div>
  );
};

/**
 * Initialize mermaid globally. Call this once in your app entry point.
 *
 * @example
 * ```ts
 * import mermaid from "mermaid";
 * import { initMermaid } from "@velo-sci/notebook-react";
 * initMermaid(mermaid);
 * ```
 */
export function initMermaid(mermaidLib: any, config?: Record<string, unknown>): void {
  (globalThis as any).mermaid = mermaidLib;
  mermaidLib.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    ...config,
  });
}
