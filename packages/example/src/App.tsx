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

const SAMPLE_NOTEBOOK: Notebook = {
  id: "demo_nb_1",
  title: "Sci-Notebook Demo",
  cells: [
    {
      id: "c1",
      type: "markdown",
      source: "# Welcome to Sci-Notebook\n\nA modular, framework-agnostic scientific notebook editor. **Click** any cell to edit it.\n\n- Supports **Markdown**, code, LaTeX, tables, diagrams, and more\n- Undo/Redo with `Ctrl+Z` / `Ctrl+Shift+Z`\n- Navigate between cells with `Shift+Enter`\n- Type `/` to insert a new cell type\n- Drag cells to reorder\n- `Ctrl+F` to find and replace",
      metadata: {},
    },
    {
      id: "c2",
      type: "markdown",
      source: "## Features Overview\n\n| Feature | Status |\n|---------|--------|\n| Markdown (CommonMark) | ✅ |\n| Code cells (30+ languages) | ✅ |\n| LaTeX (visual editor, 100+ blocks) | ✅ |\n| Interactive tables | ✅ |\n| Mermaid diagrams | ✅ |\n| Image cells (drag & drop, resize) | ✅ |\n| Embed cells (YouTube, Desmos, CodePen) | ✅ |\n| Light / Dark themes | ✅ |\n| Slash commands | ✅ |\n| Drag & drop reorder | ✅ |\n| Find & Replace | ✅ |\n| TOC sidebar | ✅ |\n| Template engine | ✅ |\n| Export (HTML, MD, IPYNB, JSON) | ✅ |\n| **PDF / DOCX export** | ✅ NEW |\n| **Presentation mode** | ✅ NEW |\n| **Version history (git-like diff)** | ✅ NEW |\n| **Cloud sync** | ✅ NEW |\n| **Mobile / touch support** | ✅ NEW |\n| **Vue 3+ adapter** | ✅ NEW |\n| **Svelte 5+ adapter** | ✅ NEW |\n| **Vanilla JS adapter** | ✅ NEW |",
      metadata: {},
    },
    {
      id: "c3",
      type: "code",
      source: '// Fibonacci — syntax highlighted with Shiki (30+ languages)\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10)); // 55',
      metadata: { language: "javascript" },
    },
    {
      id: "c4",
      type: "table",
      source: "| Shortcut | Action |\n| --- | --- |\n| Click | Edit cell |\n| Escape | Exit edit mode |\n| Shift+Enter | Next cell |\n| Ctrl+B | Bold |\n| Ctrl+I | Italic |\n| Ctrl+F | Find & Replace |\n| / | Slash commands |\n| Drag handle | Reorder cells |\n| Ctrl+Z | Undo |\n| Ctrl+Shift+Z | Redo |",
      metadata: {},
    },
    {
      id: "c5",
      type: "latex",
      source: "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
      metadata: {},
    },
    {
      id: "c6",
      type: "markdown",
      source: "## Visual Formula Editor\n\nThe cell above is a **LaTeX cell**. Click it to open the visual editor:\n\n- **Block palette**: fractions, integrals, summations, matrices, Greek letters, operators\n- **Preview mode**: see the formula as you build it\n- **LaTeX mode**: edit the raw code directly\n- **100+ pre-built blocks** across 9 categories",
      metadata: {},
    },
    {
      id: "c7",
      type: "mermaid",
      source: "graph TD\n    A[Notebook] --> B[Core Engine]\n    A --> C[Renderer]\n    A --> D[React Adapter]\n    A --> E[Vue Adapter]\n    A --> F[Svelte Adapter]\n    A --> G[Vanilla Adapter]\n    B --> H[EditorEngine]\n    B --> I[PresentationEngine]\n    B --> J[VersionHistory]\n    B --> K[MobileAdapter]\n    C --> L[RenderPipeline]",
      metadata: {},
    },
    {
      id: "c8",
      type: "image",
      source: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Euler%27s_formula.svg/400px-Euler%27s_formula.svg.png",
      metadata: { alt: "Euler's formula", caption: "Graphical representation of Euler's formula", width: "50%", align: "center" },
    },
    {
      id: "c9",
      type: "embed",
      source: "https://www.youtube.com/embed/aircAruvnKk",
      metadata: { title: "3Blue1Brown - Neural Networks", height: "400px", sandbox: "allow-scripts allow-same-origin allow-popups" },
    },
    {
      id: "c10",
      type: "markdown",
      source: "## Template Engine\n\nThe `TemplateEngine` supports `{{variable}}` flags in cells:\n\n- `{{variable}}` — simple replacement\n- `{{obj.prop}}` — dot-notation access\n- `{{#table dataKey}}` — generate Markdown table from array\n- `{{#each items}}...{{/each}}` — loop\n- `{{#if cond}}...{{else}}...{{/if}}` — conditional\n- `{{#date YYYY-MM-DD}}` — formatted date\n- `{{value | uppercase}}` — filters (uppercase, currency, percent, etc.)\n\nIdeal for generating reports from databases.",
      metadata: {},
    },
    {
      id: "c11",
      type: "markdown",
      source: "## Presentation Mode ✨\n\nNotebooks can be turned into **slideshows**. The `PresentationEngine` supports:\n\n- **3 split modes**: `cell` (one cell per slide), `heading` (split on h1/h2), `manual` (custom breakpoints)\n- **Keyboard navigation**: Arrow keys, Space, PageUp/Down, Home/End, Escape\n- **Transitions**: fade, slide-left, slide-right (configurable duration)\n- **Auto-advance** with configurable interval\n- **Fullscreen** via the Fullscreen API\n\nClick the **Present** button in the header to try it!",
      metadata: {},
    },
    {
      id: "c12",
      type: "markdown",
      source: "## Version History & Diffing ✨\n\nThe `VersionHistory` class provides **git-like diffing**:\n\n- `save()` — snapshot the current notebook state\n- `restore()` — restore a previous version\n- `detailedDiff()` — per-cell, line-level diffs using LCS algorithm\n- `diffSummary()` — human-readable change summary\n- Auto-save at configurable intervals\n\nClick **Save Version** in the header to create a snapshot. Click **History** to browse versions.",
      metadata: {},
    },
    {
      id: "c13",
      type: "markdown",
      source: "## Export Options ✨\n\nExport your notebook in multiple formats:\n\n| Format | Description |\n|--------|-------------|\n| **JSON** | Native notebook format |\n| **HTML** | Standalone HTML with embedded styles |\n| **Markdown** | Plain Markdown text |\n| **IPYNB** | Jupyter Notebook format |\n| **PDF** | Print-to-PDF via browser (or headless browser) |\n| **DOCX** | Office Open XML for Word/LibreOffice |\n\nAll export buttons are in the header toolbar.",
      metadata: {},
    },
    {
      id: "c14",
      type: "markdown",
      source: "## Framework Adapters ✨\n\n| Package | Framework | Status |\n|---------|-----------|--------|\n| `@velo-sci/notebook-react` | React 18+ | ✅ Primary |\n| `@velo-sci/notebook-vue` | Vue 3+ | ✅ Implemented |\n| `@velo-sci/notebook-svelte` | Svelte 5+ | ✅ Implemented |\n| `@velo-sci/notebook-vanilla` | Vanilla JS | ✅ Primary |\n\nAll adapters share the same `@velo-sci/notebook-core` engine. The core is **100% framework-agnostic** — pure TypeScript with zero dependencies.",
      metadata: {},
    },
    {
      id: "c15",
      type: "raw",
      source: "This is a raw cell — displayed as-is, without any processing.\nUseful for raw data, logs, or content that should not be formatted.",
      metadata: {},
    },
    {
      id: "c16",
      type: "markdown",
      source: "## Cell Types\n\n| Type | Description |\n|------|-------------|\n| **Markdown** | Rich text with formatting, tables, lists, links |\n| **Code** | Syntax-highlighted code blocks (30+ languages) |\n| **LaTeX** | Formulas with visual editor (100+ blocks) |\n| **Table** | Interactive table editor |\n| **Mermaid** | Diagrams (flowchart, sequence, gantt, etc.) |\n| **Image** | Drag & drop, URL, caption, resize handles |\n| **Embed** | YouTube, CodePen, Desmos, GeoGebra, Observable |\n| **Raw** | Unformatted text |",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook" },
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

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
          Sci-Notebook
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
        <span>sci-notebook v0.6.1</span>
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

/** Minimal markdown-to-HTML for presentation slides */
function simpleMarkdown(src: string): string {
  return src
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\| (.+) \|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      return '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
    })
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default App;
