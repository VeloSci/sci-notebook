import katex from "katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import "../../../packages/core/src/styles/index.css";
import "./index.css";
import { SciNotebookSvelte } from "@velo-sci/notebook-svelte";
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
import { SAMPLE_NOTEBOOK, simpleMarkdown } from "../../shared/sample-notebook";

(globalThis as any).katex = katex;
(globalThis as any).mermaid = mermaid;
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

// ── State ──
let theme: "light" | "dark" = "light";
let cellCount = SAMPLE_NOTEBOOK.cells.length;
let svelteNotebook: SciNotebookSvelte | null = null;
const versionHistory = new VersionHistory({ maxEntries: 50 });
let presentationEngine: PresentationEngine | null = null;

const app = document.getElementById("app")!;

// ── Build UI ──
function buildApp() {
  app.innerHTML = "";
  app.className = "app";
  app.setAttribute("data-app-theme", theme);

  // Header
  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <h1>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <line x1="6" y1="6" x2="14" y2="6" />
        <line x1="6" y1="10" x2="12" y2="10" />
        <line x1="6" y1="14" x2="10" y2="14" />
      </svg>
      Sci-Notebook <span class="app-framework-badge">Svelte</span>
      ${MobileAdapter.isTouchDevice() ? '<span class="app-badge">Touch</span>' : ""}
    </h1>
    <div class="app-header-actions">
      <div class="app-btn-group">
        <button class="app-btn" id="btn-json" title="Export as JSON">JSON</button>
        <button class="app-btn" id="btn-html" title="Export as HTML">HTML</button>
        <button class="app-btn" id="btn-md" title="Export as Markdown">MD</button>
        <button class="app-btn" id="btn-ipynb" title="Export as Jupyter Notebook">IPYNB</button>
        <button class="app-btn" id="btn-pdf" title="Export as PDF (print)">PDF</button>
      </div>
      <div class="app-btn-group">
        <button class="app-btn" id="btn-import" title="Import notebook from JSON">Import</button>
        <button class="app-btn" id="btn-save" title="Save a version snapshot">Save Version</button>
        <button class="app-btn" id="btn-history" title="Browse version history">History</button>
      </div>
      <div class="app-btn-group">
        <button class="app-btn app-btn--accent" id="btn-present" title="Start presentation mode">▶ Present</button>
        <button class="app-btn ${theme === "dark" ? "app-btn--active" : ""}" id="btn-theme">
          ${theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>
    </div>
  `;
  app.appendChild(header);

  // Notebook container
  const nbContainer = document.createElement("div");
  nbContainer.id = "notebook-root";
  app.appendChild(nbContainer);

  // Footer
  const footer = document.createElement("footer");
  footer.className = "app-status";
  footer.id = "app-footer";
  footer.innerHTML = `<span>${cellCount} cells</span><span>v${versionHistory.count} versions</span><span>sci-notebook v0.6.2 — Svelte</span>`;
  app.appendChild(footer);

  // Mount SciNotebookSvelte
  svelteNotebook = new SciNotebookSvelte({
    target: nbContainer,
    notebook: SAMPLE_NOTEBOOK as any,
    theme,
    onChange: (nb: Notebook) => {
      cellCount = nb.cells.length;
      updateFooter();
    },
    showTOC: true,
  });

  // Bind buttons
  header.querySelector("#btn-json")!.addEventListener("click", handleExportJSON);
  header.querySelector("#btn-html")!.addEventListener("click", handleExportHTML);
  header.querySelector("#btn-md")!.addEventListener("click", handleExportMD);
  header.querySelector("#btn-ipynb")!.addEventListener("click", handleExportIPYNB);
  header.querySelector("#btn-pdf")!.addEventListener("click", handleExportPDF);
  header.querySelector("#btn-import")!.addEventListener("click", handleImport);
  header.querySelector("#btn-save")!.addEventListener("click", handleSaveVersion);
  header.querySelector("#btn-history")!.addEventListener("click", handleShowHistory);
  header.querySelector("#btn-present")!.addEventListener("click", handlePresent);
  header.querySelector("#btn-theme")!.addEventListener("click", toggleTheme);
}

function updateFooter() {
  const footer = document.getElementById("app-footer");
  if (footer) footer.innerHTML = `<span>${cellCount} cells</span><span>v${versionHistory.count} versions</span><span>sci-notebook v0.6.2 — Svelte</span>`;
}

function getEngine(): EditorEngine | null {
  return svelteNotebook?.getEngine() ?? null;
}

// ── Handlers ──
function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  buildApp();
}

function handleExportJSON() {
  const engine = getEngine();
  if (!engine) return;
  showJsonModal(JSON.stringify(engine.getNotebook(), null, 2), true);
}

function handleExportHTML() {
  const engine = getEngine();
  if (!engine) return;
  downloadExport(exportToHTML(engine.getNotebook()));
}

function handleExportMD() {
  const engine = getEngine();
  if (!engine) return;
  downloadExport(exportToMarkdown(engine.getNotebook()));
}

function handleExportIPYNB() {
  const engine = getEngine();
  if (!engine) return;
  downloadExport(exportToIPYNB(engine.getNotebook()));
}

function handleExportPDF() {
  const engine = getEngine();
  if (!engine) return;
  const html = exportToHTML(engine.getNotebook());
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow popups for PDF export"); return; }
  w.document.write(html.content);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 400);
}

function handleImport() {
  showJsonModal("", false);
}

function handleSaveVersion() {
  const engine = getEngine();
  if (!engine) return;
  const nb = engine.getNotebook();
  const entry = versionHistory.save(nb, `Manual save — ${nb.cells.length} cells`);
  alert(`Version saved: ${entry.id}\n${versionHistory.count} versions stored.`);
  updateFooter();
}

function handleShowHistory() {
  showHistoryModal();
}

function handlePresent() {
  const engine = getEngine();
  if (!engine) return;
  const nb = engine.getNotebook();
  presentationEngine = new PresentationEngine(nb, { splitMode: "heading", transition: "fade" });
  let currentSlide = 0;
  presentationEngine.on((event) => {
    if (event.type === "slide:changed") { currentSlide = event.slide; updatePresentation(currentSlide); }
    if (event.type === "presentation:ended") closePresentation();
  });
  presentationEngine.start();
  showPresentation(currentSlide);
}

// ── Modals ──
function showJsonModal(content: string, readOnly: boolean) {
  const overlay = document.createElement("div");
  overlay.className = "json-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement("div");
  modal.className = "json-modal";
  modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = `<h2>${content ? "Notebook JSON" : "Import Notebook"}</h2>`;
  const ta = document.createElement("textarea");
  ta.value = content;
  ta.placeholder = "Paste notebook JSON here...";
  ta.readOnly = readOnly;
  modal.appendChild(ta);
  const actions = document.createElement("div");
  actions.className = "json-modal-actions";
  const closeBtn = document.createElement("button");
  closeBtn.className = "app-btn"; closeBtn.textContent = "Close";
  closeBtn.onclick = () => overlay.remove();
  actions.appendChild(closeBtn);
  if (readOnly && content) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "app-btn"; copyBtn.textContent = "Copy";
    copyBtn.onclick = () => navigator.clipboard.writeText(ta.value);
    actions.appendChild(copyBtn);
  }
  if (!readOnly) {
    const loadBtn = document.createElement("button");
    loadBtn.className = "app-btn app-btn--active"; loadBtn.textContent = "Load";
    loadBtn.onclick = () => {
      try {
        const nb = JSON.parse(ta.value);
        if (!nb.cells || !nb.id) { alert("Invalid JSON"); return; }
        overlay.remove();
        window.location.reload();
      } catch { alert("Error parsing JSON"); }
    };
    actions.appendChild(loadBtn);
  }
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showHistoryModal() {
  const overlay = document.createElement("div");
  overlay.className = "json-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement("div");
  modal.className = "json-modal";
  modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = "<h2>Version History</h2>";
  const list = document.createElement("div");
  list.className = "version-list";
  const entries = versionHistory.getEntries();
  if (entries.length === 0) {
    list.innerHTML = '<p class="version-empty">No versions saved yet. Click "Save Version" to create a snapshot.</p>';
  } else {
    for (const entry of [...entries].reverse()) {
      const item = document.createElement("div");
      item.className = "version-item";
      item.innerHTML = `<div class="version-item-header"><strong>${entry.description}</strong><span class="version-item-time">${new Date(entry.timestamp).toLocaleString()}</span></div><div class="version-item-meta">${entry.cellCount} cells · ID: ${entry.id}</div>`;
      list.appendChild(item);
    }
  }
  modal.appendChild(list);
  const actions = document.createElement("div");
  actions.className = "json-modal-actions";
  const closeBtn = document.createElement("button");
  closeBtn.className = "app-btn"; closeBtn.textContent = "Close";
  closeBtn.onclick = () => overlay.remove();
  actions.appendChild(closeBtn);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showPresentation(slide: number) {
  if (!presentationEngine) return;
  let overlay = document.getElementById("presentation-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "presentation-overlay";
    overlay.className = "presentation-overlay";
    const style = document.createElement("style");
    style.textContent = getPresentationCSS({ transition: "fade" });
    overlay.appendChild(style);
    document.body.appendChild(overlay);
  }
  updatePresentation(slide);
}

function updatePresentation(slide: number) {
  if (!presentationEngine) return;
  const overlay = document.getElementById("presentation-overlay");
  if (!overlay) return;
  const existing = overlay.querySelector(".sci-nb-presentation");
  if (existing) existing.remove();

  const pe = presentationEngine;
  const currentSlideData = pe.getCurrentSlide();
  const total = pe.getSlideCount();

  const pres = document.createElement("div");
  pres.className = "sci-nb-presentation";
  pres.innerHTML = `
    <div class="sci-nb-slide"><div class="sci-nb-slide-content">
      ${currentSlideData?.cells.map(cell => {
        if (cell.type === "markdown") return `<div class="sci-nb-slide-cell sci-nb-slide-cell--markdown">${simpleMarkdown(cell.source)}</div>`;
        if (cell.type === "code") return `<div class="sci-nb-slide-cell sci-nb-slide-cell--code"><pre><code>${escapeHtml(cell.source)}</code></pre></div>`;
        if (cell.type === "latex") return `<div class="sci-nb-slide-cell sci-nb-slide-cell--latex slide-latex">${escapeHtml(cell.source)}</div>`;
        return `<div class="sci-nb-slide-cell"><pre>${escapeHtml(cell.source)}</pre></div>`;
      }).join("") || ""}
    </div></div>
    <div class="sci-nb-presentation-controls">
      <button id="pres-prev" ${slide === 0 ? "disabled" : ""}>← Prev</button>
      <span class="sci-nb-slide-number">${slide + 1} / ${total}</span>
      <button id="pres-next" ${slide >= total - 1 ? "disabled" : ""}>Next →</button>
      <button id="pres-exit">✕ Exit</button>
    </div>
    <div class="sci-nb-progress-bar"><div class="sci-nb-progress-bar-fill" style="width:${((slide + 1) / total) * 100}%"></div></div>
  `;
  overlay.appendChild(pres);
  pres.querySelector("#pres-prev")!.addEventListener("click", () => pe.prev());
  pres.querySelector("#pres-next")!.addEventListener("click", () => pe.next());
  pres.querySelector("#pres-exit")!.addEventListener("click", closePresentation);
}

function closePresentation() {
  presentationEngine?.end();
  presentationEngine?.destroy();
  presentationEngine = null;
  document.getElementById("presentation-overlay")?.remove();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Init ──
buildApp();
