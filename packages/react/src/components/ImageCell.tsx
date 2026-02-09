import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSciNotebook } from "../hooks";

interface ImageCellProps {
  cellId: string;
  source: string;
  metadata: Record<string, unknown>;
  onExit: () => void;
}

interface ImageData {
  src: string;
  alt: string;
  caption: string;
  width: string;
  align: "left" | "center" | "right";
}

function parseImageSource(source: string, metadata: Record<string, unknown>): ImageData {
  return {
    src: source || "",
    alt: (metadata.alt as string) || "",
    caption: (metadata.caption as string) || "",
    width: (metadata.width as string) || "100%",
    align: (metadata.align as "left" | "center" | "right") || "center",
  };
}

export const ImageCell: React.FC<ImageCellProps> = ({ cellId, source, metadata, onExit }) => {
  const engine = useSciNotebook();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ImageData>(() => parseImageSource(source, metadata));
  const [dragOver, setDragOver] = useState(false);

  const save = useCallback((updates: Partial<ImageData>) => {
    const next = { ...data, ...updates };
    setData(next);
    engine.updateCellSource(cellId, next.src);
    engine.updateCellMetadata(cellId, {
      alt: next.alt,
      caption: next.caption,
      width: next.width,
      align: next.align,
    });
  }, [engine, cellId, data]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      save({ src: dataUrl });
    };
    reader.readAsDataURL(file);
  }, [save]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    }
  }, [onExit]);

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFileSelect(file);
          return;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handleFileSelect]);

  const hasSrc = !!data.src.trim();

  return (
    <div className="sci-nb-image-editor" onKeyDown={handleKeyDown}>
      {hasSrc ? (
        <div className="sci-nb-image-preview" style={{ textAlign: data.align }}>
          <img
            src={data.src}
            alt={data.alt}
            style={{ maxWidth: data.width, width: "auto", maxHeight: "400px" }}
          />
          {data.caption && <p className="sci-nb-image-caption">{data.caption}</p>}
        </div>
      ) : (
        <div
          className={`sci-nb-image-dropzone ${dragOver ? "sci-nb-image-dropzone--active" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="4" width="24" height="24" rx="3" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M4 22l6-6 4 4 4-4 10 10" strokeLinejoin="round" />
          </svg>
          <p>Arrastra, pega (Ctrl+V) o haz click para seleccionar</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="sci-nb-image-controls">
        <div className="sci-nb-image-field">
          <label>URL</label>
          <input
            type="text"
            value={data.src.startsWith("data:") ? "(archivo local)" : data.src}
            onChange={(e) => save({ src: e.target.value })}
            placeholder="https://example.com/image.png"
            disabled={data.src.startsWith("data:")}
          />
        </div>
        <div className="sci-nb-image-field">
          <label>Alt text</label>
          <input
            type="text"
            value={data.alt}
            onChange={(e) => save({ alt: e.target.value })}
            placeholder="Descripcion de la imagen"
          />
        </div>
        <div className="sci-nb-image-field">
          <label>Caption</label>
          <input
            type="text"
            value={data.caption}
            onChange={(e) => save({ caption: e.target.value })}
            placeholder="Pie de imagen (opcional)"
          />
        </div>
        <div className="sci-nb-image-row">
          <div className="sci-nb-image-field sci-nb-image-field--small">
            <label>Ancho</label>
            <select value={data.width} onChange={(e) => save({ width: e.target.value })}>
              <option value="25%">25%</option>
              <option value="50%">50%</option>
              <option value="75%">75%</option>
              <option value="100%">100%</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="sci-nb-image-field sci-nb-image-field--small">
            <label>Alinear</label>
            <select value={data.align} onChange={(e) => save({ align: e.target.value as ImageData["align"] })}>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>
          {hasSrc && (
            <button className="sci-nb-image-clear" onClick={() => save({ src: "" })}>
              Quitar imagen
            </button>
          )}
        </div>
      </div>

      <div className="sci-nb-cell-hint">
        <kbd>Esc</kbd> salir
      </div>
    </div>
  );
};

export function renderImagePreview(source: string, metadata: Record<string, unknown>): string {
  const data = parseImageSource(source, metadata);
  if (!data.src) {
    return '<div class="sci-nb-image-empty"><span class="sci-nb-placeholder">Click para agregar imagen</span></div>';
  }
  const alignStyle = `text-align:${data.align}`;
  const widthStyle = `max-width:${data.width};width:auto;max-height:400px`;
  let html = `<div class="sci-nb-image-view" style="${alignStyle}">`;
  html += `<img src="${escapeAttr(data.src)}" alt="${escapeAttr(data.alt)}" style="${widthStyle}" />`;
  if (data.caption) {
    html += `<p class="sci-nb-image-caption">${escapeHtml(data.caption)}</p>`;
  }
  html += `</div>`;
  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
