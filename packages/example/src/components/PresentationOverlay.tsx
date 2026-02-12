import React from "react";
import { PresentationEngine, getPresentationCSS } from "@velo-sci/notebook-core";

interface PresentationOverlayProps {
  presenting: boolean;
  engine: PresentationEngine | null;
  currentSlide: number;
  onEnd: () => void;
  simpleMarkdown: (s: string) => string;
}

export const PresentationOverlay: React.FC<PresentationOverlayProps> = ({
  presenting,
  engine,
  currentSlide,
  onEnd,
  simpleMarkdown
}) => {
  if (!presenting || !engine) return null;

  return (
    <div className="presentation-overlay" onClick={(e) => e.stopPropagation()}>
      <style>{getPresentationCSS({ transition: "fade" })}</style>
      <div className="sci-nb-presentation">
        <div className="sci-nb-slide">
          <div className="sci-nb-slide-content">
            {engine.getCurrentSlide()?.cells.map(cell => (
              <div key={cell.id} className={`sci-nb-slide-cell sci-nb-slide-cell--${cell.type}`}>
                {cell.type === "markdown" ? (
                  <div dangerouslySetInnerHTML={{ __html: simpleMarkdown(cell.source) }} />
                ) : cell.type === "code" ? (
                  <pre><code>{cell.source}</code></pre>
                ) : cell.type === "latex" ? (
                  <div className="slide-latex">{cell.source}</div>
                ) : (
                  <pre>{cell.source}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="sci-nb-presentation-controls">
          <button onClick={() => engine.prev()} disabled={currentSlide === 0}>
            ← Prev
          </button>
          <span className="sci-nb-slide-number">
            {currentSlide + 1} / {engine.getSlideCount()}
          </span>
          <button onClick={() => engine.next()} disabled={currentSlide >= engine.getSlideCount() - 1}>
            Next →
          </button>
          <button onClick={onEnd}>✕ Exit</button>
        </div>
        <div className="sci-nb-progress-bar">
          <div
            className="sci-nb-progress-bar-fill"
            style={{ width: `${((currentSlide + 1) / engine.getSlideCount()) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
