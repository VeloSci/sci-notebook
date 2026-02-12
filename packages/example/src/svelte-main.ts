import katex from "katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import "@velo-sci/notebook-core/styles/index.css";
import "./shared-app.css";
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
  downloadExport,
} from "@velo-sci/notebook-core";
import { SAMPLE_NOTEBOOK, simpleMarkdown } from "@example/shared/sample-notebook";

(globalThis as any).katex = katex;
(globalThis as any).mermaid = mermaid;
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

let theme: "light" | "dark" = "light";
let cellCount = SAMPLE_NOTEBOOK.cells.length;
let svelteNotebook: SciNotebookSvelte | null = null;
const versionHistory = new VersionHistory({ maxEntries: 50 });
let presentationEngine: PresentationEngine | null = null;

const app = document.getElementById("app")!;

function buildApp() {
  app.innerHTML = "";
  app.className = "app";
  app.setAttribute("data-app-theme", theme);

  const header = document.createElement("header");
  header.className = "app-header";
  header.innerHTML = `
    <h1>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="2" width="14" height="16" rx="2" />
        <line x1="6" y1="6" x2="14" y2="6" /><line x1="6" y1="10" x2="12" y2="10" /><line x1="6" y1="14" x2="10" y2="14" />
      </svg>
      Sci-Notebook <span class="app-framework-badge">Svelte</span>
      ${MobileAdapter.isTouchDevice() ? '<span class="app-badge">Touch</span>' : ""}
    </h1>
    <div class="app-header-actions">
      <div class="app-btn-group">
        <button class="app-btn" id="btn-json">JSON</button>
        <button class="app-btn" id="btn-html">HTML</button>
        <button class="app-btn" id="btn-md">MD</button>
        <button class="app-btn" id="btn-ipynb">IPYNB</button>
        <button class="app-btn" id="btn-pdf">PDF</button>
      </div>
      <div class="app-btn-group">
        <button class="app-btn" id="btn-import">Import</button>
        <button class="app-btn" id="btn-save">Save Version</button>
        <button class="app-btn" id="btn-history">History</button>
      </div>
      <div class="app-btn-group">
        <button class="app-btn app-btn--accent" id="btn-present">▶ Present</button>
        <button class="app-btn ${theme === "dark" ? "app-btn--active" : ""}" id="btn-theme">
          ${theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>
    </div>
  `;
  app.appendChild(header);

  const nbContainer = document.createElement("div");
  nbContainer.id = "notebook-root";
  app.appendChild(nbContainer);

  const footer = document.createElement("footer");
  footer.className = "app-status";
  footer.id = "app-footer";
  footer.innerHTML = `<span>${cellCount} cells</span><span>v${versionHistory.count} versions</span><span>sci-notebook v0.6.2 — Svelte</span>`;
  app.appendChild(footer);

  svelteNotebook = new SciNotebookSvelte({
    target: nbContainer,
    notebook: SAMPLE_NOTEBOOK as any,
    theme,
    onChange: (nb: Notebook) => { 
      cellCount = nb.cells.length; 
      updateFooter();
      requestAnimationFrame(() => mermaid.run()); 
    },
    showTOC: true,
  });

  // Initial mermaid run
  requestAnimationFrame(() => mermaid.run());

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
  const f = document.getElementById("app-footer");
  if (f) f.innerHTML = `<span>${cellCount} cells</span><span>v${versionHistory.count} versions</span><span>sci-notebook v0.6.2 — Svelte</span>`;
}

function getEngine(): EditorEngine | null { return svelteNotebook?.getEngine() ?? null; }
function toggleTheme() { theme = theme === "light" ? "dark" : "light"; svelteNotebook?.setTheme(theme); app.setAttribute("data-app-theme", theme); const btn = document.getElementById("btn-theme"); if (btn) { btn.textContent = theme === "dark" ? "☀ Light" : "🌙 Dark"; btn.classList.toggle("app-btn--active", theme === "dark"); } }

function handleExportJSON() { const e = getEngine(); if (!e) return; showJsonModal(JSON.stringify(e.getNotebook(), null, 2), true); }
function handleExportHTML() { const e = getEngine(); if (!e) return; downloadExport(exportToHTML(e.getNotebook())); }
function handleExportMD() { const e = getEngine(); if (!e) return; downloadExport(exportToMarkdown(e.getNotebook())); }
function handleExportIPYNB() { const e = getEngine(); if (!e) return; downloadExport(exportToIPYNB(e.getNotebook())); }
function handleExportPDF() { const e = getEngine(); if (!e) return; const html = exportToHTML(e.getNotebook()); const w = window.open("", "_blank"); if (!w) return; w.document.write(html.content); w.document.close(); w.onload = () => setTimeout(() => w.print(), 400); }
function handleImport() { showJsonModal("", false); }
function handleSaveVersion() { const e = getEngine(); if (!e) return; const nb = e.getNotebook(); versionHistory.save(nb, `Manual save — ${nb.cells.length} cells`); updateFooter(); }
function handleShowHistory() { showHistoryModal(); }
function handlePresent() { const e = getEngine(); if (!e) return; const nb = e.getNotebook(); presentationEngine = new PresentationEngine(nb, { splitMode: "heading", transition: "fade" }); let slide = 0; presentationEngine.on((ev) => { if (ev.type === "slide:changed") { slide = ev.slide; updatePresentation(slide); } if (ev.type === "presentation:ended") closePresentation(); }); presentationEngine.start(); showPresentation(slide); }

function showJsonModal(content: string, readOnly: boolean) {
  const overlay = document.createElement("div"); overlay.className = "json-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement("div"); modal.className = "json-modal"; modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = `<h2>${content ? "Notebook JSON" : "Import Notebook"}</h2>`;
  const ta = document.createElement("textarea"); ta.value = content; ta.placeholder = "Paste notebook JSON here..."; ta.readOnly = readOnly;
  modal.appendChild(ta);
  const actions = document.createElement("div"); actions.className = "json-modal-actions";
  const closeBtn = document.createElement("button"); closeBtn.className = "app-btn"; closeBtn.textContent = "Close"; closeBtn.onclick = () => overlay.remove(); actions.appendChild(closeBtn);
  if (readOnly && content) { const copyBtn = document.createElement("button"); copyBtn.className = "app-btn"; copyBtn.textContent = "Copy"; copyBtn.onclick = () => navigator.clipboard.writeText(ta.value); actions.appendChild(copyBtn); }
  modal.appendChild(actions); overlay.appendChild(modal); document.body.appendChild(overlay);
}

function showHistoryModal() {
  const overlay = document.createElement("div"); overlay.className = "json-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement("div"); modal.className = "json-modal"; modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = "<h2>Version History</h2>";
  const list = document.createElement("div"); list.className = "version-list";
  const entries = versionHistory.getEntries();
  if (entries.length === 0) { list.innerHTML = '<p class="version-empty">No versions saved yet. Click "Save Version" to create a snapshot.</p>'; }
  else { for (const entry of [...entries].reverse()) { const item = document.createElement("div"); item.className = "version-item"; item.innerHTML = `<div class="version-item-header"><strong>${entry.description}</strong><span class="version-item-time">${new Date(entry.timestamp).toLocaleString()}</span></div><div class="version-item-meta">${entry.cellCount} cells · ID: ${entry.id}</div>`; list.appendChild(item); } }
  modal.appendChild(list);
  const actions = document.createElement("div"); actions.className = "json-modal-actions";
  const closeBtn = document.createElement("button"); closeBtn.className = "app-btn"; closeBtn.textContent = "Close"; closeBtn.onclick = () => overlay.remove(); actions.appendChild(closeBtn);
  modal.appendChild(actions); overlay.appendChild(modal); document.body.appendChild(overlay);
}

function showPresentation(slide: number) {
  if (!presentationEngine) return;
  let overlay = document.getElementById("presentation-overlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.id = "presentation-overlay"; overlay.className = "presentation-overlay"; const style = document.createElement("style"); style.textContent = getPresentationCSS({ transition: "fade" }); overlay.appendChild(style); document.body.appendChild(overlay); }
  updatePresentation(slide);
}

function updatePresentation(slide: number) {
  if (!presentationEngine) return;
  const overlay = document.getElementById("presentation-overlay"); if (!overlay) return;
  const existing = overlay.querySelector(".sci-nb-presentation"); if (existing) existing.remove();
  const pe = presentationEngine; const currentSlideData = pe.getCurrentSlide(); const total = pe.getSlideCount();
  const pres = document.createElement("div"); pres.className = "sci-nb-presentation";
  pres.innerHTML = `<div class="sci-nb-slide"><div class="sci-nb-slide-content">${currentSlideData?.cells.map(cell => {
    const cls = `sci-nb-slide-cell sci-nb-slide-cell--${cell.type}`;
    if (cell.type === "markdown") return `<div class="${cls}">${simpleMarkdown(cell.source)}</div>`;
    if (cell.type === "code") return `<div class="${cls}"><pre><code>${cell.source.replace(/</g,"&lt;")}</code></pre></div>`;
    if (cell.type === "latex") return `<div class="${cls}"><div class="slide-latex">${cell.source.replace(/</g,"&lt;")}</div></div>`;
    return `<div class="${cls}"><pre>${cell.source.replace(/</g,"&lt;")}</pre></div>`;
  }).join("") || ""}</div></div><div class="sci-nb-presentation-controls"><button id="pres-prev" ${slide===0?"disabled":""}>← Prev</button><span class="sci-nb-slide-number">${slide+1} / ${total}</span><button id="pres-next" ${slide>=total-1?"disabled":""}>Next →</button><button id="pres-exit">✕ Exit</button></div><div class="sci-nb-progress-bar"><div class="sci-nb-progress-bar-fill" style="width: ${((slide+1)/total)*100}%"></div></div>`;
  overlay.appendChild(pres);
  pres.querySelector("#pres-prev")!.addEventListener("click", () => pe.prev());
  pres.querySelector("#pres-next")!.addEventListener("click", () => pe.next());
  pres.querySelector("#pres-exit")!.addEventListener("click", closePresentation);
}

function closePresentation() { presentationEngine?.end(); presentationEngine?.destroy(); presentationEngine = null; document.getElementById("presentation-overlay")?.remove(); }

buildApp();
