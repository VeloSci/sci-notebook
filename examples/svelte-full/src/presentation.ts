import { PresentationEngine, getPresentationCSS } from "@velo-sci/notebook-core";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function startPresentation(nb: any, simpleMarkdown: (s: string) => string) {
  const presentationEngine = new PresentationEngine(nb, { splitMode: "heading", transition: "fade" });
  
  const closePresentation = () => {
    presentationEngine.end();
    presentationEngine.destroy();
    document.getElementById("presentation-overlay")?.remove();
  };

  presentationEngine.on((event) => {
    if (event.type === "slide:changed") updatePresentation(event.slide, presentationEngine, simpleMarkdown, closePresentation);
    if (event.type === "presentation:ended") closePresentation();
  });

  presentationEngine.start();
  showPresentation(0, presentationEngine, simpleMarkdown, closePresentation);
  return presentationEngine;
}

function showPresentation(slide: number, pe: PresentationEngine, simpleMarkdown: (s: string) => string, closePresentation: () => void) {
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
  updatePresentation(slide, pe, simpleMarkdown, closePresentation);
}

function updatePresentation(slide: number, pe: PresentationEngine, simpleMarkdown: (s: string) => string, closePresentation: () => void) {
  const overlay = document.getElementById("presentation-overlay");
  if (!overlay) return;
  const existing = overlay.querySelector(".sci-nb-presentation");
  if (existing) existing.remove();

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
