import { jsPDF } from "jspdf";
import { Cur, COL, FZ, SP } from "./cursor";
import { placeImg, writePlain, writePara } from "./primitives";
import { Cell } from "@velo-sci/notebook-core";
import { renderKatex, renderMermaid } from "../utils/render";
import { normalizeSvgUrl, fetchSvgAsData, fetchImgAsData } from "../utils/image";
import { strip, escapeHtml } from "../utils/text";
import { MM2PX } from "../utils/common";

import { writeShikiCode } from "../utils/shiki-pdf-text";

export async function writeCode(c: Cur, cell: Cell) {
  const d = c.doc;
  const lang = (cell.metadata.language as string) || "";
  
  // High-fidelity vector text rendering using Shiki tokens
  if (await writeShikiCode(c, cell.source, lang)) {
    return;
  }

  // Fallback to plain text if Shiki fails
  const lines = cell.source.split("\n");
  const headerH = lang ? 5 : 0;
  const totalH = lines.length * SP.codeLn + headerH + 2;
  // ... (rest of old sync logic)
  if (c.y + totalH <= c.maxY) {
    c.fit(totalH);
    const sy = c.y;
    codeBg(d, c.L, sy, c.cw, totalH);
    if (lang) { d.setFontSize(FZ.sm); d.setFont("courier", "bold"); d.setTextColor(...COL.dim); d.text(lang, c.L + 3, c.y + 3.5); c.adv(5); }
    d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.codeFg);
    for (const l of lines) { d.text(l || " ", c.L + 3, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn); }
    c.adv(2);
  } else {
    let sy = c.y;
    if (lang) {
      c.fit(5);
      sy = c.y;
      codeBg(d, c.L, sy, c.cw, Math.min(totalH, c.maxY - sy));
      d.setFontSize(FZ.sm); d.setFont("courier", "bold"); d.setTextColor(...COL.dim); d.text(lang, c.L + 3, c.y + 3.5); c.adv(5);
    }
    d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.codeFg);
    const remainH = c.maxY - c.y;
    if (!lang) codeBg(d, c.L, sy, c.cw, Math.min(remainH + 2, totalH));
    for (const l of lines) {
      if (c.y + SP.codeLn > c.maxY) {
        c.np(); sy = c.y;
        const idx = lines.indexOf(l);
        const remLines = lines.length - idx;
        const remH = Math.min(remLines * SP.codeLn + 2, c.maxY - c.y);
        codeBg(d, c.L, sy, c.cw, remH);
        d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.codeFg);
      }
      d.text(l || " ", c.L + 3, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn);
    }
    c.adv(2);
  }
  d.setFont("helvetica", "normal");
}

function codeBg(d: jsPDF, x: number, y: number, w: number, h: number) {
  d.setFillColor(...COL.codeBg); d.setDrawColor(...COL.rule); d.setLineWidth(0.2);
  d.roundedRect(x, y, w, h, 1.5, 1.5, "FD");
}

export function writeRaw(c: Cur, src: string) {
  const d = c.doc; const lines = src.split("\n");
  d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.codeFg);
  c.fit(Math.min(lines.length * SP.codeLn, 30));
  for (const l of lines) { if (c.y + SP.codeLn > c.maxY) c.np(); d.text(l || " ", c.L, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn); }
  d.setFont("helvetica", "normal");
}

export async function writeTex(c: Cur, src: string) {
  const tex = src.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  const img = await renderKatex(tex, c.cw, true);
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

export async function writeTexInline(c: Cur, line: string) {
  const katex = (globalThis as any).katex;
  if (!katex || typeof document === "undefined") { writePara(c, strip(line)); return; }
  let html = ""; let last = 0;
  const re = /\$([^$]+)\$/g; let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) html += escapeHtml(line.slice(last, m.index));
    try { html += katex.renderToString(m[1], { displayMode: false, throwOnError: false }); }
    catch { html += escapeHtml(m[0]); }
    last = m.index + m[0].length;
  }
  if (last < line.length) html += escapeHtml(line.slice(last));
  
  // Create wrapper logic... similar to renderKatex but inline-specific?
  // Original code logic was inline within 'writeTexInline'.
  // We can duplicate the wrapper logic here or export a helper.
  // Given it's specific to this flow, I'll copy the logic but use safer dom utils if possible.
  // Actually, I can use a simpler approach: create element, html2canvas, then placeImg.
  // Wait, inline images in PDF?
  // The original code uses `placeImg` if `canvas` is returned.
  // `placeImg` places it as a block.
  // If `writeTexInline` was intended to be inline text + images, `placeImg` would break the flow (it advances Y).
  // Checking original code:
  // It calls `placeImg(c, ...)` at the end.
  // So it renders the WHOLE line (text + latex mixed) as a single IMAGE block.
  // Yes, that satisfies the requirement.
  
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:auto;height:auto;overflow:visible;z-index:99999;pointer-events:none;`;
  const el = document.createElement("div");
  // using system fonts to match PDF somewhat
  el.style.cssText = `background:#fff;color:#1a1a2e;font-family:Helvetica,sans-serif;font-size:10pt;line-height:1.4;padding:2px;max-width:${Math.round(c.cw * MM2PX)}px;display:inline-block;`;
  el.innerHTML = html;
  wrapper.appendChild(el);
  document.body.appendChild(wrapper);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise(r => setTimeout(r, 50));
    // Use html2canvas from global/import
    // We need to import html2canvas or use safeHtml2Canvas
    const { safeHtml2Canvas } = await import("../utils/dom");
    
    // DPI=300 -> scale = 300/96 ~ 3.125.
    const scale = 300 / 96;
    const canvas = await safeHtml2Canvas(el, { scale, backgroundColor: "#ffffff", logging: false, useCORS: true });
    document.body.removeChild(wrapper);
    
    if (canvas.width < 2 || canvas.height < 2) { writePara(c, strip(line)); return; }
    
    const pxToMm = 25.4 / (96 * scale);
    placeImg(c, { url: canvas.toDataURL("image/png"), w: canvas.width * pxToMm, h: canvas.height * pxToMm });
  } catch (e) {
    console.warn('writeTexInline failed:', e);
    try { document.body.removeChild(wrapper); } catch {}
    writePara(c, strip(line));
  }
}

export async function writeMm(c: Cur, src: string) {
  const img = await renderMermaid(src, c.cw);
  if (img) { placeImg(c, img, true); return; }
  // Fallback: code block
  const d = c.doc; const lines = src.trim().split("\n");
  c.fit(Math.min(8 + lines.length * SP.codeLn + 4, 40));
  d.setFontSize(9); d.setFont("helvetica", "bold"); d.setTextColor(...COL.accent);
  d.text(`[Diagram: ${lines[0] || "mermaid"}]`, c.L + 3, c.y + 4); c.adv(6);
  d.setFontSize(FZ.code); d.setFont("courier", "normal"); d.setTextColor(...COL.dim);
  for (const l of lines) { if (c.y + SP.codeLn > c.maxY) c.np(); d.text(l || " ", c.L + 3, c.y + SP.codeLn * 0.75); c.adv(SP.codeLn); }
  c.adv(2); d.setFont("helvetica", "normal");
}

export async function writeImg(c: Cur, cell: Cell) {
  const src = cell.source;
  const alt = (cell.metadata.alt as string) || "image";
  const caption = (cell.metadata.caption as string) || "";
  if (src && typeof document !== "undefined") {
    if (src.includes(".svg")) {
      const svgUrl = normalizeSvgUrl(src);
      const svgImg = await fetchSvgAsData(svgUrl, c.cw);
      if (svgImg) { placeImg(c, svgImg); if (caption) { writePlain(c, caption); } return; }
    }
    const img = await fetchImgAsData(src, c.cw);
    if (img) { placeImg(c, img); if (caption) { writePlain(c, caption); } return; }
  }
  writePlain(c, `[Image: ${alt}]`);
  if (caption) writePlain(c, caption);
}
