import { Cell } from "@velo-sci/notebook-core";
import { escapeXml } from "../utils/text";
import { renderKatex, renderMermaid } from "../utils/render";
import { fetchImgAsData, normalizeSvgUrl, fetchSvgAsData } from "../utils/image";
import { vmlImage, vmlImageInline, wPara } from "./templates";
import { inlineRuns } from "./utils";

export async function cellToWordML(cell: Cell, counter: { val: number }, options: { renderCell?: (cell: Cell) => string }): Promise<string> {
  if (options.renderCell) return wPara(escapeXml(options.renderCell(cell)));
  switch (cell.type) {
    case "markdown": return wPara(escapeXml(cell.source)); // Should be called from writer-md
    case "code": return codeToWordML(cell);
    case "latex": return await latexToWordML(cell.source, counter);
    case "table": return tableToWordML(cell.source);
    case "mermaid": return await mermaidToWordML(cell.source, counter);
    case "image": return await imageToWordML(cell, counter);
    case "embed": return wPara(`<w:r><w:rPr><w:color w:val="8B5CF6"/><w:i/></w:rPr><w:t>[Embedded: ${escapeXml(cell.source)}]</w:t></w:r>`);
    case "raw": return cell.source.split("\n").map(l => `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(l)}</w:t></w:r></w:p>`).join("\n");
    default: return wPara(inlineRuns(cell.source));
  }
}

export function codeToWordML(cell: Cell): string {
  const lang = (cell.metadata.language as string) || "";
  const header = lang
    ? `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:b/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>${escapeXml(lang)}</w:t></w:r></w:p>`
    : "";
  const lines = cell.source.split("\n").map(l =>
    `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t xml:space="preserve">${escapeXml(l)}</w:t></w:r></w:p>`
  ).join("\n");
  return header + lines;
}

export async function latexToWordML(source: string, counter: { val: number }): Promise<string> {
  const tex = source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  const img = await renderKatex(tex, 180, true);
  if (img) return vmlImage(img.url.split(",")[1], img.w, img.h, true, counter);
  return `<w:p><w:pPr><w:jc w:val="center"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/><w:bottom w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/></w:pBdr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/><w:i/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">${escapeXml(tex)}</w:t></w:r></w:p>`;
}

export async function mermaidToWordML(source: string, counter: { val: number }): Promise<string> {
  const img = await renderMermaid(source, 180);
  if (img) return vmlImage(img.url.split(",")[1], img.w, img.h, true, counter);
  const lines = source.trim().split("\n");
  return `<w:p><w:pPr><w:jc w:val="center"/><w:shd w:val="clear" w:color="auto" w:fill="F0F4FF"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="8B5CF6"/></w:rPr><w:t>[Diagram: ${escapeXml(lines[0] || "mermaid")}]</w:t></w:r></w:p>\n` +
    lines.map(l => `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F0F4FF"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t xml:space="preserve">${escapeXml(l)}</w:t></w:r></w:p>`).join("\n");
}

export async function imageToWordML(cell: Cell, counter: { val: number }): Promise<string> {
  const src = cell.source;
  const alt = (cell.metadata.alt as string) || "image";
  const caption = (cell.metadata.caption as string) || "";

  if (src && typeof document !== "undefined") {
    if (src.includes(".svg")) {
      const svgUrl = normalizeSvgUrl(src);
      const svgImg = await fetchSvgAsData(svgUrl, 180);
      if (svgImg) {
        let res = vmlImage(svgImg.url.split(",")[1], svgImg.w, svgImg.h, true, counter);
        if (caption) res += `\n<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>${escapeXml(caption)}</w:t></w:r></w:p>`;
        return res;
      }
    }
    const img = await fetchImgAsData(src, 180); // Using fetchImgAsData, which returns base64 url
    if (img) {
      let result = vmlImage(img.url.split(",")[1], img.w, img.h, true, counter);
      if (caption) {
        result += `\n<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>${escapeXml(caption)}</w:t></w:r></w:p>`;
      }
      return result;
    }
  }

  let r = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="8B5CF6"/><w:i/></w:rPr><w:t>[Image: ${escapeXml(alt)}]</w:t></w:r></w:p>`;
  if (caption) r += `\n<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>${escapeXml(caption)}</w:t></w:r></w:p>`;
  return r;
}

export function tableToWordML(source: string): string {
  const lines = source.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return wPara(escapeXml(source));
  const pr = (l: string) => l.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  const hd = pr(lines[0]), dr = lines.slice(2).map(pr);
  const nc = hd.length; if (!nc) return wPara(escapeXml(source));
  const cw = Math.floor(9000 / nc);

  let t = `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>`;
  for (const s of ["top", "left", "bottom", "right", "insideH", "insideV"])
    t += `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>`;
  t += `</w:tblBorders></w:tblPr>`;
  t += `<w:tblGrid>${hd.map(() => `<w:gridCol w:w="${cw}"/>`).join("")}</w:tblGrid>`;
  t += `<w:tr>${hd.map(h => `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(h)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  for (const row of dr) {
    t += `<w:tr>${Array.from({ length: nc }, (_, i) => `<w:tc><w:p>${inlineRuns(row[i] || "")}</w:p></w:tc>`).join("")}</w:tr>`;
  }
  t += `</w:tbl>`;
  return t;
}
