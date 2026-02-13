import { jsPDF } from "jspdf";
import { Cur, COL, FZ, SP } from "./cursor";
import { strip } from "../utils/text";

export function placeImg(c: Cur, img: { url: string; w: number; h: number }, isDiagram = false) {
  let w = img.w, h = img.h;

  if (isDiagram) {
    // For diagrams, we want them to fill most of the page width if possible
    const targetW = c.cw * 0.95;
    const r = targetW / w;
    w = targetW;
    h *= r;
  }

  // If w is larger than content width, scale down
  if (w > c.cw) { const r = c.cw / w; w = c.cw; h *= r; }
  // If h is larger than 65% of page height, scale down
  const maxH = (c.maxY - c.m.top) * 0.65;
  if (h > maxH) { const r = maxH / h; h = maxH; w *= r; }
  
  c.fit(h + 2);
  // use SLOW (lossless) compression to maintain high-resolution detail
  c.doc.addImage(img.url, "PNG", c.L + (c.cw - w) / 2, c.y, w, h, undefined, "SLOW");
  c.adv(h + 2);
}

export function writeHead(c: Cur, txt: string, sz: number) {
  const d = c.doc; const lh = sz * 0.45;
  const w = d.splitTextToSize(strip(txt), c.cw);
  c.fit(w.length * lh + 2);
  d.setFontSize(sz); d.setFont("helvetica", "bold"); d.setTextColor(...COL.text);
  d.text(w, c.L, c.y + lh); c.adv(w.length * lh + 2); d.setFont("helvetica", "normal");
}

export function writePara(c: Cur, txt: string) {
  const d = c.doc;
  d.setFontSize(FZ.body); d.setFont("helvetica", "normal"); d.setTextColor(...COL.text);
  const w = d.splitTextToSize(txt, c.cw);
  c.fit(Math.min(w.length * SP.ln, 30));
  for (const l of w) { if (c.y + SP.ln > c.maxY) c.np(); d.text(l, c.L, c.y + SP.ln * 0.8); c.adv(SP.ln); }
}

export function writePlain(c: Cur, txt: string) {
  c.fit(6); c.doc.setFontSize(FZ.body); c.doc.setFont("helvetica", "italic");
  c.doc.setTextColor(...COL.accent);
  c.doc.text(txt, c.W / 2, c.y + 4, { align: "center" }); c.adv(6);
  c.doc.setFont("helvetica", "normal");
}

export function writeBq(c: Cur, txt: string) {
  const d = c.doc;
  d.setFontSize(FZ.body); d.setFont("helvetica", "italic"); d.setTextColor(...COL.dim);
  const w = d.splitTextToSize(strip(txt), c.cw - 8);
  c.fit(Math.min(w.length * SP.ln + 2, 25));
  const sy = c.y;
  for (const l of w) { if (c.y + SP.ln > c.maxY) c.np(); d.text(l, c.L + 6, c.y + SP.ln * 0.8); c.adv(SP.ln); }
  d.setDrawColor(...COL.accent); d.setLineWidth(0.8); d.line(c.L + 2, sy, c.L + 2, c.y);
  d.setFont("helvetica", "normal");
}

export function writeLi(c: Cur, txt: string, mk = "•") {
  const d = c.doc;
  d.setFontSize(FZ.body); d.setFont("helvetica", "normal"); d.setTextColor(...COL.text);
  const w = d.splitTextToSize(strip(txt), c.cw - 10);
  c.fit(SP.ln); d.text(mk, c.L + 2, c.y + SP.ln * 0.8);
  for (const l of w) { if (c.y + SP.ln > c.maxY) c.np(); d.text(l, c.L + 8, c.y + SP.ln * 0.8); c.adv(SP.ln); }
}

export async function writeTbl(c: Cur, src: string) {
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
    
    for (let i = 0; i < nc; i++) {
      const txt = (cells[i] || "").substring(0, 40);
      const x = c.L + i * cw + 2;
      const midY = ry + SP.tblRow * 0.65;
      
      if (txt.includes("✅")) {
        // Draw custom checkmark primitive
        drawCheckmark(d, x + 1, ry + 1.5, 3);
        if (txt.replace("✅", "").trim()) {
           d.text(strip(txt.replace("✅", "")), x + 6, midY);
        }
      } else {
        d.text(strip(txt), x, midY);
      }
    }
    
    d.setDrawColor(...COL.tblBorder); d.setLineWidth(0.2);
    d.line(c.L, ry + SP.tblRow, c.L + c.cw, ry + SP.tblRow);
    for (let i = 0; i <= nc; i++) {
      d.line(c.L + i * cw, ry, c.L + i * cw, ry + SP.tblRow);
    }
    c.adv(SP.tblRow);
  };
  d.setDrawColor(...COL.tblBorder); d.setLineWidth(0.2); d.line(c.L, c.y, c.L + c.cw, c.y);
  drawR(hd, true);
  for (const r of dr) drawR(r, false);
  d.setFont("helvetica", "normal");
}

function drawCheckmark(d: jsPDF, x: number, y: number, s: number) {
  // Green box
  d.setFillColor(34, 197, 94); // Tailwind green-500
  d.roundedRect(x, y, s, s, 0.5, 0.5, "F");
  // White check
  d.setDrawColor(255, 255, 255);
  d.setLineWidth(0.4);
  d.line(x + s*0.25, y + s*0.5, x + s*0.45, y + s*0.75);
  d.line(x + s*0.45, y + s*0.75, x + s*0.8, y + s*0.25);
}
