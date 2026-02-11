import React, { useState, useCallback } from "react";
import { useSciNotebook } from "../hooks";

interface EmbedCellProps {
  cellId: string;
  source: string;
  metadata: Record<string, unknown>;
  onExit: () => void;
}

interface EmbedData {
  url: string;
  height: string;
  sandbox: string;
  title: string;
}

const EMBED_PRESETS = [
  { label: "YouTube", pattern: "https://www.youtube.com/embed/", icon: "▶" },
  { label: "CodePen", pattern: "https://codepen.io/", icon: "⌨" },
  { label: "Observable", pattern: "https://observablehq.com/embed/", icon: "◉" },
  { label: "Desmos", pattern: "https://www.desmos.com/calculator/", icon: "📈" },
  { label: "GeoGebra", pattern: "https://www.geogebra.org/material/iframe/id/", icon: "📐" },
  { label: "Custom URL", pattern: "", icon: "🔗" },
];

function parseEmbedSource(source: string, metadata: Record<string, unknown>): EmbedData {
  return {
    url: source || "",
    height: (metadata.height as string) || "400px",
    sandbox: (metadata.sandbox as string) || "allow-scripts allow-same-origin allow-popups",
    title: (metadata.title as string) || "",
  };
}

export const EmbedCell: React.FC<EmbedCellProps> = ({ cellId, source, metadata, onExit }) => {
  const engine = useSciNotebook();
  const [data, setData] = useState<EmbedData>(() => parseEmbedSource(source, metadata));
  const [showPreview, setShowPreview] = useState(!!data.url);

  const save = useCallback((updates: Partial<EmbedData>) => {
    const next = { ...data, ...updates };
    setData(next);
    engine.updateCellSource(cellId, next.url);
    engine.updateCellMetadata(cellId, {
      height: next.height,
      sandbox: next.sandbox,
      title: next.title,
    });
  }, [engine, cellId, data]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    }
  }, [onExit]);

  const hasUrl = !!data.url.trim();

  return (
    <div className="sci-nb-embed-editor" onKeyDown={handleKeyDown}>
      {/* Presets */}
      <div className="sci-nb-embed-presets">
        {EMBED_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className="sci-nb-embed-preset"
            onClick={() => {
              if (preset.pattern) {
                save({ url: preset.pattern });
              }
            }}
            title={preset.label}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* URL input */}
      <div className="sci-nb-embed-url-row">
        <input
          type="text"
          className="sci-nb-embed-url"
          value={data.url}
          onChange={(e) => save({ url: e.target.value })}
          placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
          autoFocus
        />
        <button
          className={`sci-nb-embed-preview-btn ${showPreview ? "sci-nb-embed-preview-btn--active" : ""}`}
          onClick={() => setShowPreview(!showPreview)}
          disabled={!hasUrl}
        >
          {showPreview ? "Ocultar" : "Preview"}
        </button>
      </div>

      {/* Preview iframe */}
      {showPreview && hasUrl && (
        <div className="sci-nb-embed-frame-wrap" style={{ height: data.height }}>
          <iframe
            src={data.url}
            title={data.title || "Embedded content"}
            sandbox={data.sandbox}
            style={{ width: "100%", height: "100%", border: "none", borderRadius: "6px" }}
            loading="lazy"
            allowFullScreen
          />
        </div>
      )}

      {/* Settings */}
      <div className="sci-nb-embed-settings">
        <div className="sci-nb-embed-field">
          <label>Titulo</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => save({ title: e.target.value })}
            placeholder="Titulo del embed (accesibilidad)"
          />
        </div>
        <div className="sci-nb-embed-row">
          <div className="sci-nb-embed-field sci-nb-embed-field--small">
            <label>Altura</label>
            <select value={data.height} onChange={(e) => save({ height: e.target.value })}>
              <option value="200px">200px</option>
              <option value="300px">300px</option>
              <option value="400px">400px</option>
              <option value="500px">500px</option>
              <option value="600px">600px</option>
            </select>
          </div>
          <div className="sci-nb-embed-field sci-nb-embed-field--small">
            <label>Sandbox</label>
            <select value={data.sandbox} onChange={(e) => save({ sandbox: e.target.value })}>
              <option value="allow-scripts allow-same-origin allow-popups">Standard</option>
              <option value="allow-scripts">Scripts only</option>
              <option value="">Restricted</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sci-nb-cell-hint">
        <kbd>Esc</kbd> exit
      </div>
    </div>
  );
};

export function renderEmbedPreview(source: string, metadata: Record<string, unknown>): string {
  const data = parseEmbedSource(source, metadata);
  if (!data.url) {
    return '<div class="sci-nb-embed-empty"><span class="sci-nb-placeholder">Click to add embedded content</span></div>';
  }
  const titleAttr = data.title ? ` title="${escapeAttr(data.title)}"` : "";
  return `<div class="sci-nb-embed-view" style="height:${data.height}">
    <iframe src="${escapeAttr(data.url)}"${titleAttr} sandbox="${escapeAttr(data.sandbox)}" style="width:100%;height:100%;border:none;border-radius:6px" loading="lazy" allowfullscreen></iframe>
  </div>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
