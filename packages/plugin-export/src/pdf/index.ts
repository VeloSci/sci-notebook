import type { Notebook, Cell } from "@velo-sci/notebook-core";
import { exportToHTML } from "@velo-sci/notebook-core";
import { jsPDF } from "jspdf";
import { Cur, COL, FZ, SP } from "./cursor";
import { writeMd } from "./writers-md";
import { writeCode, writeTex, writeMm, writeImg, writeRaw } from "./writers-cells";
import { writePlain, writePara, writeTbl } from "./primitives";
import { slug } from "../utils/text";

export const PAGE: Record<string, [number, number]> = {
  a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6],
};

export interface PDFExportOptions {
  pageSize?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  margins?: { top: number; right: number; bottom: number; left: number };
  pageNumbers?: boolean;
  filename?: string;
  title?: string;
  author?: string;
}

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
    try { await writeCell(c, cell); } catch (e) { console.warn("PDF cell error:", e); }
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

async function writeCell(c: Cur, cell: Cell) {
  switch (cell.type) {
    case "markdown": await writeMd(c, cell.source); break;
    case "code": await writeCode(c, cell); break;
    case "latex": await writeTex(c, cell.source); break;
    case "table": await writeTbl(c, cell.source); break;
    case "mermaid": await writeMm(c, cell.source); break;
    case "image": await writeImg(c, cell); break;
    case "embed": writePlain(c, `[Embedded: ${cell.source}]`); break;
    case "raw": writeRaw(c, cell.source); break;
    default: writePara(c, cell.source);
  }
}

export function generatePrintHTML(notebook: Readonly<Notebook>, options: PDFExportOptions = {}): string {
  const r = exportToHTML(notebook, { ...options, customCSS: `body{background:#fff;color:#000;font-size:11pt}.sci-nb--export{max-width:100%;margin:0;padding:0}` });
  return r.content;
}
