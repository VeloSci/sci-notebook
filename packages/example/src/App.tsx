import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SciNotebook } from "@velo-sci/notebook-react";
import {
  EditorEngine,
  Notebook,
  VersionHistory,
  PresentationEngine,
  getPresentationCSS,
  MobileAdapter,
  exportToHTML,
  exportToMarkdown,
  exportToIPYNB,
  exportToJSON,
  downloadExport,
} from "@velo-sci/notebook-core";
import { SAMPLE_NOTEBOOK, simpleMarkdown } from "@example/shared/sample-notebook";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cellCount, setCellCount] = useState(SAMPLE_NOTEBOOK.cells.length);
  const [showJson, setShowJson] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const engineRef = useRef<EditorEngine | null>(null);
  const versionHistory = useRef(new VersionHistory({ maxEntries: 50 }));
  const presentationRef = useRef<PresentationEngine | null>(null);

  useEffect(() => {
    setIsMobile(MobileAdapter.isTouchDevice());
  }, []);

  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  const handleChange = useCallback((nb: Notebook) => {
    setCellCount(nb.cells.length);
  }, []);

  // --- Export handlers ---
  const handleExportJSON = () => {
    if (!engineRef.current) return;
    const nb = engineRef.current.getNotebook();
    setJsonContent(JSON.stringify(nb, null, 2));
    setShowJson(true);
  };

  const handleExportHTML = () => {
    if (!engineRef.current) return;
    downloadExport(exportToHTML(engineRef.current.getNotebook()));
  };

  const handleExportMD = () => {
    if (!engineRef.current) return;
    downloadExport(exportToMarkdown(engineRef.current.getNotebook()));
  };

  const handleExportIPYNB = () => {
    if (!engineRef.current) return;
    downloadExport(exportToIPYNB(engineRef.current.getNotebook()));
  };

  const handleExportPDF = () => {
    if (!engineRef.current) return;
    const nb = engineRef.current.getNotebook();
    const html = exportToHTML(nb);
    const w = window.open("", "_blank");
    if (!w) { alert("Please allow popups for PDF export"); return; }
    w.document.write(html.content);
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 400);
  };

  const handleImport = () => {
    setJsonContent("");
    setShowJson(true);
  };

  const handleJsonLoad = () => {
    try {
      const nb = JSON.parse(jsonContent) as Notebook;
      if (!nb.cells || !nb.id) {
        alert("Invalid JSON: must have 'id' and 'cells'");
        return;
      }
      setShowJson(false);
      window.location.reload();
    } catch {
      alert("Error parsing JSON");
    }
  };

  // --- Version history ---
  const handleSaveVersion = () => {
    if (!engineRef.current) return;
    const nb = engineRef.current.getNotebook();
    const entry = versionHistory.current.save(nb, `Manual save — ${nb.cells.length} cells`);
    alert(`Version saved: ${entry.id}\n${versionHistory.current.count} versions stored.`);
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  // --- Presentation mode ---
  const handlePresent = () => {
    if (!engineRef.current) return;
    const nb = engineRef.current.getNotebook();
    const pe = new PresentationEngine(nb, { splitMode: "heading", transition: "fade" });
    presentationRef.current = pe;
    pe.on((event) => {
      if (event.type === "slide:changed") setCurrentSlide(event.slide);
      if (event.type === "presentation:ended") setPresenting(false);
    });
    pe.start();
    setPresenting(true);
    setCurrentSlide(0);
  };

  const handleEndPresentation = () => {
    presentationRef.current?.end();
    presentationRef.current?.destroy();
    presentationRef.current = null;
    setPresenting(false);
  };

  return (
    <div className="app" data-app-theme={theme}>
      <header className="app-header">
        <h1>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="2" width="14" height="16" rx="2" />
            <line x1="6" y1="6" x2="14" y2="6" />
            <line x1="6" y1="10" x2="12" y2="10" />
            <line x1="6" y1="14" x2="10" y2="14" />
          </svg>
          Sci-Notebook <span className="app-framework-badge">React</span>
          {isMobile && <span className="app-badge">Touch</span>}
        </h1>
        <div className="app-header-actions">
          <div className="app-btn-group">
            <button className="app-btn" onClick={handleExportJSON} title="Export as JSON">JSON</button>
            <button className="app-btn" onClick={handleExportHTML} title="Export as HTML">HTML</button>
            <button className="app-btn" onClick={handleExportMD} title="Export as Markdown">MD</button>
            <button className="app-btn" onClick={handleExportIPYNB} title="Export as Jupyter Notebook">IPYNB</button>
            <button className="app-btn" onClick={handleExportPDF} title="Export as PDF (print)">PDF</button>
          </div>
          <div className="app-btn-group">
            <button className="app-btn" onClick={handleImport} title="Import notebook from JSON">Import</button>
            <button className="app-btn" onClick={handleSaveVersion} title="Save a version snapshot">Save Version</button>
            <button className="app-btn" onClick={handleShowHistory} title="Browse version history">History</button>
          </div>
          <div className="app-btn-group">
            <button className="app-btn app-btn--accent" onClick={handlePresent} title="Start presentation mode">
              ▶ Present
            </button>
            <button
              className={`app-btn ${theme === "dark" ? "app-btn--active" : ""}`}
              onClick={toggleTheme}
            >
              {theme === "dark" ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      <SciNotebook
        notebook={SAMPLE_NOTEBOOK}
        theme={theme}
        onChange={handleChange}
        engineRef={engineRef}
        showTOC={true}
      />

      <footer className="app-status">
        <span>{cellCount} cells</span>
        <span>v{versionHistory.current.count} versions</span>
        <span>sci-notebook v0.6.2 — React</span>
      </footer>

      {/* JSON Modal */}
      {showJson && (
        <div className="json-modal-overlay" onClick={() => setShowJson(false)}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{jsonContent ? "Notebook JSON" : "Import Notebook"}</h2>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              placeholder='Paste notebook JSON here...'
              readOnly={!!jsonContent && jsonContent.length > 10}
            />
            <div className="json-modal-actions">
              <button className="app-btn" onClick={() => setShowJson(false)}>Close</button>
              {jsonContent && jsonContent.length > 10 && (
                <button className="app-btn" onClick={() => navigator.clipboard.writeText(jsonContent)}>Copy</button>
              )}
              {(!jsonContent || jsonContent.length <= 10) && (
                <button className="app-btn app-btn--active" onClick={handleJsonLoad}>Load</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistory && (
        <div className="json-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Version History</h2>
            <div className="version-list">
              {versionHistory.current.getEntries().length === 0 ? (
                <p className="version-empty">No versions saved yet. Click "Save Version" to create a snapshot.</p>
              ) : (
                versionHistory.current.getEntries().slice().reverse().map((entry, i, arr) => (
                  <div key={entry.id} className="version-item">
                    <div className="version-item-header">
                      <strong>{entry.description}</strong>
                      <span className="version-item-time">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="version-item-meta">
                      {entry.cellCount} cells · ID: {entry.id}
                      {i < arr.length - 1 && (() => {
                        const prev = arr[i + 1];
                        const summary = versionHistory.current.diffSummary(prev.id, entry.id);
                        return summary ? <span className="version-diff"> · {summary}</span> : null;
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="json-modal-actions">
              <button className="app-btn" onClick={() => setShowHistory(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Mode Overlay */}
      {presenting && presentationRef.current && (
        <div className="presentation-overlay">
          <style>{getPresentationCSS({ transition: "fade" })}</style>
          <div className="sci-nb-presentation">
            <div className="sci-nb-slide">
              <div className="sci-nb-slide-content">
                {presentationRef.current.getCurrentSlide()?.cells.map(cell => (
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
              <button onClick={() => presentationRef.current?.prev()} disabled={currentSlide === 0}>
                ← Prev
              </button>
              <span className="sci-nb-slide-number">
                {currentSlide + 1} / {presentationRef.current.getSlideCount()}
              </span>
              <button onClick={() => presentationRef.current?.next()} disabled={currentSlide >= presentationRef.current.getSlideCount() - 1}>
                Next →
              </button>
              <button onClick={handleEndPresentation}>✕ Exit</button>
            </div>
            <div className="sci-nb-progress-bar">
              <div
                className="sci-nb-progress-bar-fill"
                style={{ width: `${((currentSlide + 1) / presentationRef.current.getSlideCount()) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default App;
