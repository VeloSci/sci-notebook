import type { Notebook, Cell } from "@velo-sci/notebook-core";
import { exportToHTML } from "@velo-sci/notebook-core";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface PDFExportOptions {
  pageSize?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  margins?: { top: number; right: number; bottom: number; left: number };
  pageNumbers?: boolean;
  filename?: string;
  title?: string;
  author?: string;
}

const PAGE: Record<string, [number, number]> = {
  a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6],
};

const DPI = 300;
const MM2PX = DPI / 25.4;

const COL = {
  text: [26, 26, 46] as const,
  dim: [100, 116, 139] as const,
  accent: [139, 92, 246] as const,
  codeBg: [241, 245, 249] as const,
  codeFg: [30, 41, 59] as const,
  tblBorder: [203, 213, 225] as const,
  tblHead: [248, 250, 252] as const,
  white: [255, 255, 255] as const,
  rule: [226, 232, 240] as const,
};

const FZ = { body: 10, h1: 20, h2: 16, h3: 13, code: 8.5, sm: 8 };
const SP = { ln: 4.5, para: 3, gap: 5, codeLn: 3.5, tblRow: 6 };

// ── Cursor ──────────────────────────────────────────────────

class Cur {
  y: number; pg = 1; total = 0;
  constructor(public doc: jsPDF, public W: number, public H: number,
    public m: { top: number; right: number; bottom: number; left: number },
    public pgNum: boolean) { this.y = m.top; }
  get cw() { return this.W - this.m.left - this.m.right; }
  get maxY() { return this.H - this.m.bottom; }
  get L() { return this.m.left; }
  get R() { return this.W - this.m.right; }
  fit(h: number) { if (this.y + h > this.maxY) this.np(); }
  np() { this.footer(); this.doc.addPage(); this.pg++; this.y = this.m.top; }
  adv(h: number) { this.y += h; }
  footer() {
    if (!this.pgNum) return;
    this.doc.setFontSize(FZ.sm); this.doc.setTextColor(...COL.dim);
    this.doc.text(`${this.pg}`, this.W / 2, this.H - 5, { align: "center" });
  }
  done() { this.footer(); }
}

// ── Image helpers ───────────────────────────────────────────

function loadImg(src: string, useCors = false): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const i = new Image();
    if (useCors) i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = (e) => { console.warn('[PDF] Image load failed:', src.slice(0, 80), e); fail(e); };
    i.src = src;
  });
}

/** Pure SVG string → PNG dataURL at 300dpi. Uses data: URL (no CORS issues). */
async function svgToPng(svg: string, maxMm: number): Promise<{ url: string; w: number; h: number } | null> {
  if (typeof document === "undefined") return null;
  try {
    const d = document.createElement("div"); d.innerHTML = svg.trim();
    const el = d.querySelector("svg"); if (!el) return null;
    let sw = parseFloat(el.getAttribute("width") || "0");
    let sh = parseFloat(el.getAttribute("height") || "0");
    const vb = el.getAttribute("viewBox");
    if ((!sw || !sh) && vb) { const p = vb.split(/[\s,]+/).map(Number); if (p.length === 4) { sw = p[2]; sh = p[3]; } }
    if (!sw || !sh) { sw = 400; sh = 300; }
    el.setAttribute("width", String(sw)); el.setAttribute("height", String(sh));
    // Remove foreignObject elements that taint the canvas
    el.querySelectorAll("foreignObject").forEach(fo => fo.remove());
    const scale = Math.min((maxMm * MM2PX) / sw, 4);
    const cw = Math.round(sw * scale), ch = Math.round(sh * scale);
    // Use data: URL to avoid CORS/crossOrigin issues with blob: URLs
    const svgData = new XMLSerializer().serializeToString(el);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    const img = await loadImg(dataUrl);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    return { url: c.toDataURL("image/png"), w: cw / MM2PX, h: ch / MM2PX };
  } catch (e) { console.warn("[PDF] svgToPng failed:", e); return null; }
}

/** Fetch a web image and return as PNG dataURL with dimensions in mm */
async function fetchImgAsData(src: string, maxMm: number): Promise<{ url: string; w: number; h: number } | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = await loadImg(src, true);
    const scale = Math.min((maxMm * MM2PX) / img.naturalWidth, 1);
    const cw = Math.round(img.naturalWidth * scale);
    const ch = Math.round(img.naturalHeight * scale);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    return { url: c.toDataURL("image/png"), w: cw / MM2PX, h: ch / MM2PX };
  } catch (e) { console.warn("[PDF] fetchImg failed:", e); return null; }
}

/** Render Mermaid source → PNG (forces light theme) */
async function mermaidPng(src: string, maxMm: number): Promise<{ url: string; w: number; h: number } | null> {
  const mm = (globalThis as any).mermaid;
  if (!mm?.render) { console.warn('[PDF] mermaid not available'); return null; }
  try {
    // Force light theme for export
    try { mm.initialize({ theme: 'default', startOnLoad: false }); } catch {}
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const r = await mm.render(id, src.trim());
    if (!r?.svg) { console.warn('[PDF] mermaid.render returned no svg'); return null; }
    return svgToPng(r.svg, maxMm);
  } catch (e) { console.warn('[PDF] mermaidPng failed:', e); return null; }
}

/**
 * Recursively replace unsupported CSS color functions (oklch, lab, lch, etc.)
 * that crash html2canvas's color parser.
 */
function sanitizeColors(root: HTMLElement) {
  const unsupported = /oklch\(|lab\(|lch\(|oklab\(/i;
  const walk = (el: HTMLElement) => {
    const cs = getComputedStyle(el);
    for (const prop of ["color", "background-color", "border-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "outline-color"]) {
      const v = cs.getPropertyValue(prop);
      if (v && unsupported.test(v)) {
        const fallback = prop === "color" ? "#1a1a2e" : "transparent";
        el.style.setProperty(prop, fallback, "important");
      }
    }
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child instanceof HTMLElement) walk(child);
    }
  };
  walk(root);
}

/** Render KaTeX → PNG via html2canvas (reliable, no foreignObject) */
async function katexPng(tex: string, maxMm: number, display: boolean): Promise<{ url: string; w: number; h: number } | null> {
  const katex = (globalThis as any).katex;
  if (!katex?.renderToString || typeof document === "undefined") { console.warn('[PDF] katex not available'); return null; }
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:auto;height:auto;overflow:visible;z-index:99999;pointer-events:none;`;
  const el = document.createElement("div");
  try {
    const html = katex.renderToString(tex, { displayMode: display, throwOnError: false });
    el.style.cssText = `background:#fff;color:#1a1a2e;padding:${display ? "12px 16px" : "4px 6px"};font-size:${display ? 22 : 16}px;line-height:1.5;display:inline-block;`;
    el.innerHTML = html;
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    await new Promise(r => setTimeout(r, 150));
    sanitizeColors(el);
    const scale = DPI / 96;
    const canvas = await html2canvas(el, {
      scale,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    document.body.removeChild(wrapper);
    if (canvas.width < 2 || canvas.height < 2) return null;
    return { url: canvas.toDataURL("image/png"), w: canvas.width / MM2PX, h: canvas.height / MM2PX };
  } catch (e) {
    console.warn('[PDF] katexPng failed:', e);
    try { document.body.removeChild(wrapper); } catch {}
    return null;
  }
}

/** Place image centered in PDF */
function placeImg(c: Cur, img: { url: string; w: number; h: number }) {
  let w = img.w, h = img.h;
  if (w > c.cw) { const r = c.cw / w; w = c.cw; h *= r; }
  const maxH = (c.maxY - c.m.top) * 0.65;
  if (h > maxH) { const r = maxH / h; h = maxH; w *= r; }
  c.fit(h + 2);
  c.doc.addImage(img.url, "PNG", c.L + (c.cw - w) / 2, c.y, w, h);
  c.adv(h + 2);
}

// ── Main export ─────────────────────────────────────────────

export async function exportToPDF(
  notebook: Readonly<Notebook>, options: PDFExportOptions = {}
): Promise<void> {
  const title = options.title || notebook.title || "Notebook";
  const fname = options.filename || slug(title);
  const ps = options.pageSize || "a4";
  const ori = options.orientation || "portrait";
  const mar = options.margins || { top: 15, right: 15, bottom: 15, left: 15 };
  const [W, H] = ori === "landscape"
    ? [PAGE[ps]?.[1] || 297, PAGE[ps]?.[0] || 210]
    : [PAGE[ps]?.[0] || 210, PAGE[ps]?.[1] || 297];

  const doc = new jsPDF({ orientation: ori, unit: "mm", format: ps });
  const c = new Cur(doc, W, H, mar, options.pageNumbers !== false);

  // Title
  doc.setFontSize(FZ.h1); doc.setFont("helvetica", "bold"); doc.setTextColor(...COL.text);
  const tl = doc.splitTextToSize(title, c.cw);
  doc.text(tl, c.L, c.y + 7); c.adv(tl.length * 8 + 2);
  if (options.author) {
    doc.setFontSize(FZ.body); doc.setFont("helvetica", "italic"); doc.setTextColor(...COL.dim);
    doc.text(options.author, c.L, c.y + 4); c.adv(6);
  }
  doc.setFontSize(FZ.sm); doc.setTextColor(...COL.dim); doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), c.L, c.y + 4); c.adv(6);
  doc.setDrawColor(...COL.rule); doc.setLineWidth(0.3);
  doc.line(c.L, c.y, c.R, c.y); c.adv(SP.gap);

  // Cells
  for (const cell of notebook.cells) {
    try { await writeCell(c, cell); } catch (e) { console.warn("[PDF] cell error:", e); }
    c.adv(SP.gap);
  }

  // Page numbers second pass
  c.total = c.pg; c.done();
  if (c.total > 1) {
    for (let p = 1; p <= c.total; p++) {
      doc.setPage(p);
      doc.setFillColor(...COL.white); doc.rect(0, H - 8, W, 8, "F");
      doc.setFontSize(FZ.sm); doc.setTextColor(...COL.dim);
      doc.text(`${p} / ${c.total}`, W / 2, H - 5, { align: "center" });
    }
  }

  doc.save(`${fname}.pdf`);
}

// ── Cell writers ────────────────────────────────────────────

async function writeCell(c: Cur, cell: Cell) {
  switch (cell.type) {
    case "markdown": await writeMd(c, cell.source); break;
    case "code": writeCode(c, cell); break;
    case "latex": await writeTex(c, cell.source); break;
    case "table": writeTbl(c, cell.source); break;
    case "mermaid": await writeMm(c, cell.source); break;
    case "image": await writeImg(c, cell); break;
    case "embed": writePlain(c, `[Embedded: ${cell.source}]`); break;
    case "raw": writeRaw(c, cell.source); break;
    default: writePara(c, cell.source);
  }
}

// ── Markdown ────────────────────────────────────────────────

async function writeMd(c: Cur, src: string) {
  const lines = src.split("\n");
  let tbl: string[] = [];
  const flTbl = () => { if (tbl.length >= 2) writeTbl(c, tbl.join("\n")); tbl = []; };

  for (const line of lines) {
    const t = line.trim();
    if (t.includes("|") && !t.startsWith("#")) { tbl.push(t); continue; }
    if (tbl.length) flTbl();
    if (!t) { c.adv(SP.para); continue; }
    if (/^[-*_]{3,}$/.test(t)) { c.fit(4); c.doc.setDrawColor(...COL.rule); c.doc.setLineWidth(0.3); c.doc.line(c.L, c.y + 2, c.R, c.y + 2); c.adv(4); continue; }
    const hm = t.match(/^(#{1,6})\s+(.+)/);
    if (hm) { const lv = hm[1].length; writeHead(c, hm[2], lv === 1 ? FZ.h1 : lv === 2 ? FZ.h2 : FZ.h3); continue; }
    if (t.startsWith("> ")) { writeBq(c, t.slice(2)); continue; }
    if (/^[-*+]\s+/.test(t)) { writeLi(c, t.replace(/^[-*+]\s+/, "")); continue; }
    const ol = t.match(/^(\d+)[.)]\s+(.+)/);
    if (ol) { writeLi(c, ol[2], ol[1] + "."); continue; }
    // Display math $$...$$
    if (t.startsWith("$$") && t.endsWith("$$") && t.length > 4) { await writeTex(c, t); continue; }
    // Inline math
    if (/\$[^$]+\$/.test(t)) { await writeTexInline(c, t); continue; }
    writePara(c, strip(t));
  }
  if (tbl.length) flTbl();
}

// ── Text primitives ─────────────────────────────────────────

function writeHead(c: Cur, txt: string, sz: number) {
  const d = c.doc; const lh = sz * 0.45;
  const w = d.splitTextToSize(strip(txt), c.cw);
  c.fit(w.length * lh + 2);
  d.setFontSize(sz); d.setFont("helvetica", "bold"); d.setTextColor(...COL.text);
  d.text(w, c.L, c.y + lh); c.adv(w.length * lh + 2); d.setFont("helvetica", "normal");
}

function writePara(c: Cur, txt: string) {
  const d = c.doc;
  d.setFontSize(FZ.body); d.setFont("helvetica", "normal"); d.setTextColor(...COL.text);
  const w = d.splitTextToSize(txt, c.cw);
  c.fit(Math.min(w.length * SP.ln, 30));
  for (const l of w) { if (c.y + SP.ln > c.maxY) c.np(); d.text(l, c.L, c.y + SP.ln * 0.8); c.adv(SP.ln); }
}

function writePlain(c: Cur, txt: string) {
  c.fit(6); c.doc.setFontSize(FZ.body); c.doc.setFont("helvetica", "italic");
  c.doc.setTextColor(...COL.accent);
  c.doc.text(txt, c.W / 2, c.y + 4, { align: "center" }); c.adv(6);
  c.doc.setFont("helvetica", "normal");
}

function writeBq(c: Cur, txt: string) {
  const d = c.doc;
  d.setFontSize(FZ.body); d.setFont("helvetica", "italic"); d.setTextColor(...COL.dim);
  const w = d.splitTextToSize(strip(txt), c.cw - 8);
  c.fit(Math.min(w.length * SP.ln + 2, 25));
  const sy = c.y;
  for (const l of w) { if (c.y + SP.ln > c.maxY) c.np(); d.text(l, c.L + 6, c.y + SP.ln * 0.8); c.adv(SP.ln); }
  d.setDrawColor(...COL.accent); d.setLineWidth(0.8); d.line(c.L + 2, sy, c.L + 2, c.y);
  d.setFont("helvetica", "normal");
}

function writeLi(c: Cur, txt: string, mk = "•") {
  const d = c.doc;
  d.setFontSize(FZ.body); d.setFont("helvetica", "normal"); d.setTextColor(...COL.text);
  const w = d.splitTextToSize(strip(txt), c.cw - 10);
  c.fit(SP.ln); d.text(mk, c.L + 2, c.y + SP.ln * 0.8);
  for (const l of w) { if (c.y + SP.ln > c.maxY) c.np(); d.text(l, c.L + 8, c.y + SP.ln * 0.8); c.adv(SP.ln); }
}

// ── Code ────────────────────────────────────────────────────

function writeCode(c: Cur, cell: Cell) {
  const d = c.doc;
  const lang = (cell.metadata.language as string) || "";
  const lines = cell.source.split("\n");
  c.fit(Math.min(lines.length * SP.codeLn + 6 + (lang ? 5 : 0), 40));
  const sy = c.y;
  if (lang) { d.setFontSize(FZ.sm); d.setFont("courier", "bold"); d.setTextColor(...COL.dim); d.text(lang, c.L + 3, c.y + 3.5); c.adv(5); }
  d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.codeFg);
  for (const l of lines) {
    if (c.y + SP.codeLn > c.maxY) { codeBg(d, c.L, sy, c.cw, c.y - sy + 1); c.np(); }
    d.text(l || " ", c.L + 3, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn);
  }
  c.adv(2); codeBg(d, c.L, sy, c.cw, c.y - sy); d.setFont("helvetica", "normal");
}

function codeBg(d: jsPDF, x: number, y: number, w: number, h: number) {
  d.setFillColor(...COL.codeBg); d.setDrawColor(...COL.rule); d.setLineWidth(0.2);
  d.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
}

function writeRaw(c: Cur, src: string) {
  const d = c.doc; const lines = src.split("\n");
  d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.codeFg);
  c.fit(Math.min(lines.length * SP.codeLn, 30));
  for (const l of lines) { if (c.y + SP.codeLn > c.maxY) c.np(); d.text(l || " ", c.L, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn); }
  d.setFont("helvetica", "normal");
}

// ── LaTeX ───────────────────────────────────────────────────

async function writeTex(c: Cur, src: string) {
  const tex = src.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  const img = await katexPng(tex, c.cw, true);
  if (img) { placeImg(c, img); return; }
  // Fallback
  const d = c.doc;
  d.setFontSize(11); d.setFont("times", "italic"); d.setTextColor(...COL.text);
  const w = d.splitTextToSize(tex, c.cw - 20);
  const bh = w.length * 5 + 6; c.fit(bh);
  d.setDrawColor(...COL.rule); d.setLineWidth(0.2); d.rect(c.L, c.y, c.cw, bh);
  for (let i = 0; i < w.length; i++) d.text(w[i], c.W / 2, c.y + 4 + i * 5, { align: "center" });
  c.adv(bh); d.setFont("helvetica", "normal");
}

async function writeTexInline(c: Cur, line: string) {
  const katex = (globalThis as any).katex;
  if (!katex || typeof document === "undefined") { writePara(c, strip(line)); return; }
  let html = ""; let last = 0;
  const re = /\$([^$]+)\$/g; let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) html += esc(line.slice(last, m.index));
    try { html += katex.renderToString(m[1], { displayMode: false, throwOnError: false }); }
    catch { html += esc(m[0]); }
    last = m.index + m[0].length;
  }
  if (last < line.length) html += esc(line.slice(last));
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:auto;height:auto;overflow:visible;z-index:99999;pointer-events:none;`;
  const el = document.createElement("div");
  el.style.cssText = `background:#fff;color:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:1.6;padding:4px 2px;max-width:${Math.round(c.cw * MM2PX)}px;display:inline-block;`;
  el.innerHTML = html;
  wrapper.appendChild(el);
  document.body.appendChild(wrapper);
  try {
    await new Promise(r => setTimeout(r, 150));
    sanitizeColors(el);
    const scale = DPI / 96;
    const canvas = await html2canvas(el, { scale, backgroundColor: "#ffffff", logging: false, useCORS: true });
    document.body.removeChild(wrapper);
    if (canvas.width < 2 || canvas.height < 2) { writePara(c, strip(line)); return; }
    placeImg(c, { url: canvas.toDataURL("image/png"), w: canvas.width / MM2PX, h: canvas.height / MM2PX });
  } catch (e) {
    console.warn('[PDF] writeTexInline failed:', e);
    try { document.body.removeChild(wrapper); } catch {}
    writePara(c, strip(line));
  }
}

// ── Table ───────────────────────────────────────────────────

function writeTbl(c: Cur, src: string) {
  const d = c.doc;
  const rows = src.trim().split("\n").filter(l => l.trim());
  if (rows.length < 2) { writePara(c, src); return; }
  const pr = (l: string) => l.split("|").map(s => s.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  const hd = pr(rows[0]), dr = rows.slice(2).map(pr);
  const nc = hd.length; if (!nc) { writePara(c, src); return; }
  const cw = c.cw / nc;
  c.fit(Math.min((1 + dr.length) * SP.tblRow + 2, 50));

  const drawR = (cells: string[], hdr: boolean) => {
    if (c.y + SP.tblRow > c.maxY) c.np();
    const ry = c.y;
    if (hdr) { d.setFillColor(...COL.tblHead); d.rect(c.L, ry, c.cw, SP.tblRow, "F"); d.setFont("helvetica", "bold"); }
    else d.setFont("helvetica", "normal");
    d.setFontSize(FZ.body - 1); d.setTextColor(...COL.text);
    for (let i = 0; i < nc; i++) d.text(strip((cells[i] || "").substring(0, 40)), c.L + i * cw + 2, ry + SP.tblRow * 0.65);
    d.setDrawColor(...COL.tblBorder); d.setLineWidth(0.2);
    d.line(c.L, ry + SP.tblRow, c.L + c.cw, ry + SP.tblRow);
    for (let i = 0; i <= nc; i++) d.line(c.L + i * cw, ry, c.L + i * cw, ry + SP.tblRow);
    c.adv(SP.tblRow);
  };
  d.setDrawColor(...COL.tblBorder); d.setLineWidth(0.2); d.line(c.L, c.y, c.L + c.cw, c.y);
  drawR(hd, true);
  for (const r of dr) drawR(r, false);
  d.setFont("helvetica", "normal");
}

// ── Mermaid ─────────────────────────────────────────────────

async function writeMm(c: Cur, src: string) {
  const img = await mermaidPng(src, c.cw);
  if (img) { placeImg(c, img); return; }
  // Fallback: code block
  const d = c.doc; const lines = src.trim().split("\n");
  c.fit(Math.min(8 + lines.length * SP.codeLn + 4, 40));
  d.setFontSize(9); d.setFont("helvetica", "bold"); d.setTextColor(...COL.accent);
  d.text(`[Diagram: ${lines[0] || "mermaid"}]`, c.L + 3, c.y + 4); c.adv(6);
  d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.dim);
  for (const l of lines) { if (c.y + SP.codeLn > c.maxY) c.np(); d.text(l || " ", c.L + 3, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn); }
  c.adv(2); d.setFont("helvetica", "normal");
}

// ── Image (from web) ────────────────────────────────────────

async function writeImg(c: Cur, cell: Cell) {
  const src = cell.source;
  const alt = (cell.metadata.alt as string) || "image";
  const caption = (cell.metadata.caption as string) || "";
  if (src && typeof document !== "undefined") {
    const img = await fetchImgAsData(src, c.cw);
    if (img) { placeImg(c, img); if (caption) { writePlain(c, caption); } return; }
  }
  writePlain(c, `[Image: ${alt}]`);
  if (caption) writePlain(c, caption);
}

// ── Helpers ─────────────────────────────────────────────────

function strip(t: string): string {
  return t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1").replace(/_(.+?)_/g, "$1").replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/!\[([^\]]*)\]\([^)]+\)/g, "[$1]");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "notebook";
}

export function generatePrintHTML(notebook: Readonly<Notebook>, options: PDFExportOptions = {}): string {
  const r = exportToHTML(notebook, { ...options, customCSS: `body{background:#fff;color:#000;font-size:11pt}.sci-nb--export{max-width:100%;margin:0;padding:0}` });
  return r.content;
}
