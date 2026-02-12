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
import { JsonModal, HistoryModal } from "./components/Modals";
import { PresentationOverlay } from "./components/PresentationOverlay";

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
  const handleChange = useCallback((nb: Notebook) => setCellCount(nb.cells.length), []);

  const handleExportJSON = () => {
    if (!engineRef.current) return;
    setJsonContent(JSON.stringify(engineRef.current.getNotebook(), null, 2));
    setShowJson(true);
  };

  const handleExportHTML = () => engineRef.current && downloadExport(exportToHTML(engineRef.current.getNotebook()));
  const handleExportMD = () => engineRef.current && downloadExport(exportToMarkdown(engineRef.current.getNotebook()));
  const handleExportIPYNB = () => engineRef.current && downloadExport(exportToIPYNB(engineRef.current.getNotebook()));

  const handleExportPDF = () => {
    if (!engineRef.current) return;
    const html = exportToHTML(engineRef.current.getNotebook());
    const w = window.open("", "_blank");
    if (!w) { alert("Please allow popups for PDF export"); return; }
    w.document.write(html.content);
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 400);
  };

  const handleJsonLoad = () => {
    try {
      const nb = JSON.parse(jsonContent) as Notebook;
      if (!nb.cells || !nb.id) { alert("Invalid JSON"); return; }
      setShowJson(false);
      window.location.reload();
    } catch { alert("Error parsing JSON"); }
  };

  const handleSaveVersion = () => {
    if (!engineRef.current) return;
    const nb = engineRef.current.getNotebook();
    versionHistory.current.save(nb, `Manual save — ${nb.cells.length} cells`);
    alert("Version saved.");
  };

  const handlePresent = () => {
    if (!engineRef.current) return;
    const pe = new PresentationEngine(engineRef.current.getNotebook(), { splitMode: "heading", transition: "fade" });
    presentationRef.current = pe;
    pe.on((ev) => {
      if (ev.type === "slide:changed") setCurrentSlide(ev.slide);
      if (ev.type === "presentation:ended") setPresenting(false);
    });
    pe.start();
    setPresenting(true);
    setCurrentSlide(0);
  };

  const handleEndPresentation = () => {
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
            <line x1="6" y1="6" x2="14" y2="6" /><line x1="6" y1="10" x2="12" y2="10" /><line x1="6" y1="14" x2="10" y2="14" />
          </svg>
          Sci-Notebook <span className="app-framework-badge">React</span>
          {isMobile && <span className="app-badge">Touch</span>}
        </h1>
        <div className="app-header-actions">
          <div className="app-btn-group">
            <button className="app-btn" onClick={handleExportJSON}>JSON</button>
            <button className="app-btn" onClick={handleExportHTML}>HTML</button>
            <button className="app-btn" onClick={handleExportMD}>MD</button>
            <button className="app-btn" onClick={handleExportIPYNB}>IPYNB</button>
            <button className="app-btn" onClick={handleExportPDF}>PDF</button>
          </div>
          <div className="app-btn-group">
            <button className="app-btn" onClick={() => { setJsonContent(""); setShowJson(true); }}>Import</button>
            <button className="app-btn" onClick={handleSaveVersion}>Save Version</button>
            <button className="app-btn" onClick={() => setShowHistory(true)}>History</button>
          </div>
          <div className="app-btn-group">
            <button className="app-btn app-btn--accent" onClick={handlePresent}>▶ Present</button>
            <button className={`app-btn ${theme === "dark" ? "app-btn--active" : ""}`} onClick={toggleTheme}>
              {theme === "dark" ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
      </header>

      <SciNotebook notebook={SAMPLE_NOTEBOOK} theme={theme} onChange={handleChange} engineRef={engineRef} showTOC={true} />

      <footer className="app-status">
        <span>{cellCount} cells</span>
        <span>v{versionHistory.current.count} versions</span>
        <span>sci-notebook v0.6.2 — React</span>
      </footer>

      <JsonModal show={showJson} content={jsonContent} onContentChange={setJsonContent} onClose={() => setShowJson(false)} onLoad={handleJsonLoad} />
      <HistoryModal show={showHistory} history={versionHistory.current} onClose={() => setShowHistory(false)} simpleMarkdown={simpleMarkdown} />
      <PresentationOverlay presenting={presenting} engine={presentationRef.current} currentSlide={currentSlide} onEnd={handleEndPresentation} simpleMarkdown={simpleMarkdown} />
    </div>
  );
}

export default App;
