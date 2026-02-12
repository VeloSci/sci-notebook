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

import { showJsonModal, showHistoryModal } from "./modals";
import { startPresentation } from "./presentation";

(globalThis as any).katex = katex;
(globalThis as any).mermaid = mermaid;
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

// ── State ──
let theme: "light" | "dark" = "light";
let cellCount = SAMPLE_NOTEBOOK.cells.length;
let svelteNotebook: SciNotebookSvelte | null = null;
const versionHistory = new VersionHistory({ maxEntries: 50 });

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
  header.querySelector("#btn-json")!.addEventListener("click", () => svelteNotebook && showJsonModal(JSON.stringify(svelteNotebook.getEngine().getNotebook(), null, 2), true));
  header.querySelector("#btn-html")!.addEventListener("click", () => svelteNotebook && downloadExport(exportToHTML(svelteNotebook.getEngine().getNotebook())));
  header.querySelector("#btn-md")!.addEventListener("click", () => svelteNotebook && downloadExport(exportToMarkdown(svelteNotebook.getEngine().getNotebook())));
  header.querySelector("#btn-ipynb")!.addEventListener("click", () => svelteNotebook && downloadExport(exportToIPYNB(svelteNotebook.getEngine().getNotebook())));
  header.querySelector("#btn-pdf")!.addEventListener("click", () => {
    if (!svelteNotebook) return;
    const html = exportToHTML(svelteNotebook.getEngine().getNotebook());
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html.content);
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 400);
  });
  header.querySelector("#btn-import")!.addEventListener("click", () => showJsonModal("", false));
  header.querySelector("#btn-save")!.addEventListener("click", () => {
    if (!svelteNotebook) return;
    const nb = svelteNotebook.getEngine().getNotebook();
    versionHistory.save(nb, `Manual save — ${nb.cells.length} cells`);
    updateFooter();
  });
  header.querySelector("#btn-history")!.addEventListener("click", () => showHistoryModal(versionHistory));
  header.querySelector("#btn-present")!.addEventListener("click", () => svelteNotebook && startPresentation(svelteNotebook.getEngine().getNotebook(), simpleMarkdown));
  header.querySelector("#btn-theme")!.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    buildApp();
  });
}

function updateFooter() {
  const footer = document.getElementById("app-footer");
  if (footer) footer.innerHTML = `<span>${cellCount} cells</span><span>v${versionHistory.count} versions</span><span>sci-notebook v0.6.2 — Svelte</span>`;
}

// ── Init ──
buildApp();
