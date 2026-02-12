import type { Notebook, Cell } from "@velo-sci/notebook-core";
import html2canvas from "html2canvas";

export interface DOCXExportOptions {
  title?: string;
  author?: string;
  includeMetadata?: boolean;
  renderCell?: (cell: Cell) => string;
}

// ── Main export ─────────────────────────────────────────────

export async function exportToDOCX(
  notebook: Readonly<Notebook>,
  options: DOCXExportOptions = {}
): Promise<{ content: string; mimeType: string; filename: string; blob: Blob }> {
  const title = options.title || notebook.title || "Untitled Notebook";
  const author = options.author || (notebook.metadata.author as string) || "";

  const parts: string[] = [];
  for (const cell of notebook.cells) {
    try { parts.push(await cellToWordML(cell, options)); }
    catch { parts.push(wPara(escXml(cell.source))); }
  }
  const paragraphs = parts.join("\n");

  const wordML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w10="urn:schemas-microsoft-com:office:word">
  <o:DocumentProperties>
    <o:Title>${escXml(title)}</o:Title>
    ${author ? `<o:Author>${escXml(author)}</o:Author>` : ""}
    <o:Created>${new Date().toISOString()}</o:Created>
  </o:DocumentProperties>
  <w:lists>
    <w:listDef w:listDefId="0">
      <w:lvl w:ilvl="0"><w:start w:val="1"/><w:nfc w:val="23"/><w:lvlText w:val="&#xF0B7;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr></w:lvl>
    </w:listDef>
    <w:listDef w:listDefId="1">
      <w:lvl w:ilvl="0"><w:start w:val="1"/><w:nfc w:val="0"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
    </w:listDef>
    <w:list w:ilfo="1"><w:ilst w:val="0"/></w:list>
    <w:list w:ilfo="2"><w:ilst w:val="1"/></w:list>
  </w:lists>
  <w:styles>
    <w:style w:type="paragraph" w:styleId="Heading1">
      <w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1A1A2E"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
      <w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1A1A2E"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
      <w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1A1A2E"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Code">
      <w:name w:val="Code"/>
      <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/><w:color w:val="1E293B"/></w:rPr>
      <w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:pPr>
    </w:style>
  </w:styles>
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>${escXml(title)}</w:t></w:r>
    </w:p>
    ${author ? `<w:p><w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>By ${escXml(author)}</w:t></w:r></w:p>` : ""}
    <w:p><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${new Date().toLocaleDateString()}</w:t></w:r></w:p>
    ${paragraphs}
  </w:body>
</w:wordDocument>`;

  const blob = new Blob([wordML], { type: "application/vnd.ms-word" });
  return { content: wordML, mimeType: "application/vnd.ms-word", filename: `${slug(title)}.doc`, blob };
}

export function downloadDOCX(result: { blob: Blob; filename: string }): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a"); a.href = url; a.download = result.filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Cell dispatcher ─────────────────────────────────────────

async function cellToWordML(cell: Cell, options: DOCXExportOptions): Promise<string> {
  if (options.renderCell) return wPara(escXml(options.renderCell(cell)));
  switch (cell.type) {
    case "markdown": return await markdownToWordML(cell.source);
    case "code": return codeToWordML(cell);
    case "latex": return await latexToWordML(cell.source);
    case "table": return tableToWordML(cell.source);
    case "mermaid": return await mermaidToWordML(cell.source);
    case "image": return await imageToWordML(cell);
    case "embed": return wPara(`<w:r><w:rPr><w:color w:val="8B5CF6"/><w:i/></w:rPr><w:t>[Embedded: ${escXml(cell.source)}]</w:t></w:r>`);
    case "raw": return cell.source.split("\n").map(l => `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:t xml:space="preserve">${escXml(l)}</w:t></w:r></w:p>`).join("\n");
    default: return wPara(inlineRuns(cell.source));
  }
}

// ── Markdown → WordML ───────────────────────────────────────

async function markdownToWordML(source: string): Promise<string> {
  const lines = source.split("\n");
  const result: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  const flushTable = () => {
    if (tableLines.length >= 2) result.push(tableToWordML(tableLines.join("\n")));
    tableLines = []; inTable = false;
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.includes("|") && !t.startsWith("#")) { if (!inTable) inTable = true; tableLines.push(t); continue; }
    else if (inTable) flushTable();

    if (!t) { result.push("<w:p/>"); continue; }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(t)) {
      result.push(`<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/></w:pBdr></w:pPr></w:p>`);
      continue;
    }

    // Headings
    const hm = t.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lv = Math.min(hm[1].length, 3);
      result.push(`<w:p><w:pPr><w:pStyle w:val="Heading${lv}"/></w:pPr>${inlineRuns(hm[2])}</w:p>`);
      continue;
    }

    // Blockquote
    if (t.startsWith("> ")) {
      result.push(`<w:p><w:pPr><w:ind w:left="720"/><w:pBdr><w:left w:val="single" w:sz="12" w:space="8" w:color="8B5CF6"/></w:pBdr></w:pPr><w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>${escXml(t.slice(2))}</w:t></w:r></w:p>`);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(t)) {
      result.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${inlineRuns(t.replace(/^[-*+]\s+/, ""))}</w:p>`);
      continue;
    }

    // Ordered list
    const olm = t.match(/^(\d+)[.)]\s+(.+)/);
    if (olm) {
      result.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>${inlineRuns(olm[2])}</w:p>`);
      continue;
    }

    // Display math $$...$$
    if (t.startsWith("$$") && t.endsWith("$$") && t.length > 4) {
      result.push(await latexToWordML(t));
      continue;
    }

    // Inline math in text — render as image
    if (/\$[^$]+\$/.test(t)) {
      result.push(await inlineLatexLineToWordML(t));
      continue;
    }

    result.push(`<w:p>${inlineRuns(t)}</w:p>`);
  }
  if (inTable) flushTable();
  return result.join("\n");
}

// ── Code → WordML ───────────────────────────────────────────

function codeToWordML(cell: Cell): string {
  const lang = (cell.metadata.language as string) || "";
  const header = lang
    ? `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="E8E8EC"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:b/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>${escXml(lang)}</w:t></w:r></w:p>`
    : "";
  const lines = cell.source.split("\n").map(l =>
    `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t xml:space="preserve">${escXml(l)}</w:t></w:r></w:p>`
  ).join("\n");
  return header + lines;
}

// ── LaTeX → WordML (as image) ───────────────────────────────

async function latexToWordML(source: string): Promise<string> {
  const tex = source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  const img = await renderKatexToBase64(tex, true);
  if (img) return vmlImage(img.data, img.w, img.h, true);
  // Fallback: italic text
  return `<w:p><w:pPr><w:jc w:val="center"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/><w:bottom w:val="single" w:sz="4" w:space="4" w:color="E2E8F0"/></w:pBdr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/><w:i/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve">${escXml(tex)}</w:t></w:r></w:p>`;
}

async function inlineLatexLineToWordML(line: string): Promise<string> {
  // Try to render each $...$ as an inline image
  const katex = (globalThis as any).katex;
  if (!katex) return `<w:p>${inlineRuns(line)}</w:p>`;

  const parts: string[] = [];
  let last = 0;
  const re = /\$([^$]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(inlineRuns(line.slice(last, m.index)));
    const img = await renderKatexToBase64(m[1], false);
    if (img) {
      parts.push(vmlImageInline(img.data, img.w, img.h));
    } else {
      parts.push(`<w:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/><w:i/></w:rPr><w:t>${escXml(m[1])}</w:t></w:r>`);
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(inlineRuns(line.slice(last)));
  return `<w:p>${parts.join("")}</w:p>`;
}

// ── Mermaid → WordML (as image) ─────────────────────────────

async function mermaidToWordML(source: string): Promise<string> {
  const img = await renderMermaidToBase64(source);
  if (img) return vmlImage(img.data, img.w, img.h, true);
  // Fallback
  const lines = source.trim().split("\n");
  return `<w:p><w:pPr><w:jc w:val="center"/><w:shd w:val="clear" w:color="auto" w:fill="F0F4FF"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="8B5CF6"/></w:rPr><w:t>[Diagram: ${escXml(lines[0] || "mermaid")}]</w:t></w:r></w:p>\n` +
    lines.map(l => `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F0F4FF"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t xml:space="preserve">${escXml(l)}</w:t></w:r></w:p>`).join("\n");
}

// ── Image → WordML ──────────────────────────────────────────

async function imageToWordML(cell: Cell): Promise<string> {
  const src = cell.source;
  const alt = (cell.metadata.alt as string) || "image";
  const caption = (cell.metadata.caption as string) || "";

  if (src && typeof document !== "undefined") {
    const img = await fetchImageBase64(src);
    if (img) {
      let result = vmlImage(img.data, img.w, img.h, true);
      if (caption) {
        result += `\n<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>${escXml(caption)}</w:t></w:r></w:p>`;
      }
      return result;
    }
  }

  let r = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="8B5CF6"/><w:i/></w:rPr><w:t>[Image: ${escXml(alt)}]</w:t></w:r></w:p>`;
  if (caption) r += `\n<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="64748B"/></w:rPr><w:t>${escXml(caption)}</w:t></w:r></w:p>`;
  return r;
}

// ── Table → WordML ──────────────────────────────────────────

function tableToWordML(source: string): string {
  const lines = source.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return wPara(escXml(source));
  const pr = (l: string) => l.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  const hd = pr(lines[0]), dr = lines.slice(2).map(pr);
  const nc = hd.length; if (!nc) return wPara(escXml(source));
  const cw = Math.floor(9000 / nc);

  let t = `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders>`;
  for (const s of ["top", "left", "bottom", "right", "insideH", "insideV"])
    t += `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>`;
  t += `</w:tblBorders></w:tblPr>`;
  t += `<w:tblGrid>${hd.map(() => `<w:gridCol w:w="${cw}"/>`).join("")}</w:tblGrid>`;
  t += `<w:tr>${hd.map(h => `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escXml(h)}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`;
  for (const row of dr) {
    t += `<w:tr>${Array.from({ length: nc }, (_, i) => `<w:tc><w:p>${inlineRuns(row[i] || "")}</w:p></w:tc>`).join("")}</w:tr>`;
  }
  t += `</w:tbl>`;
  return t;
}

// ══════════════════════════════════════════════════════════════
// Image rendering utilities
// ══════════════════════════════════════════════════════════════

function loadImg(src: string, useCors = false): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const i = new Image();
    if (useCors) i.crossOrigin = "anonymous";
    i.onload = () => ok(i);
    i.onerror = (e) => { console.warn('[DOCX] Image load failed:', src.slice(0, 80), e); fail(e); };
    i.src = src;
  });
}

async function svgToCanvas(svg: string, maxW: number): Promise<{ canvas: HTMLCanvasElement; w: number; h: number } | null> {
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
    el.querySelectorAll("foreignObject").forEach(fo => fo.remove());
    const scale = Math.min(maxW / sw, 3);
    const cw = Math.round(sw * scale), ch = Math.round(sh * scale);
    const svgData = new XMLSerializer().serializeToString(el);
    const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    const img = await loadImg(dataUrl);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    return { canvas: c, w: cw, h: ch };
  } catch (e) { console.warn('[DOCX] svgToCanvas failed:', e); return null; }
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

async function renderKatexToBase64(tex: string, display: boolean): Promise<{ data: string; w: number; h: number } | null> {
  const katex = (globalThis as any).katex;
  if (!katex?.renderToString || typeof document === "undefined") return null;
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:auto;height:auto;overflow:visible;z-index:99999;pointer-events:none;`;
  const el = document.createElement("div");
  try {
    const html = katex.renderToString(tex, { displayMode: display, throwOnError: false });
    el.style.cssText = `background:#fff;color:#1a1a2e;font-size:${display ? 22 : 16}px;line-height:1.5;padding:${display ? "12px 16px" : "4px 6px"};display:inline-block;`;
    el.innerHTML = html;
    wrapper.appendChild(el);
    document.body.appendChild(wrapper);
    await new Promise(r => setTimeout(r, 150));
    sanitizeColors(el);
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: "#ffffff", logging: false, useCORS: true });
    document.body.removeChild(wrapper);
    if (canvas.width < 2 || canvas.height < 2) return null;
    const dataUrl = canvas.toDataURL("image/png");
    return { data: dataUrl.split(",")[1], w: Math.round(canvas.width / 3), h: Math.round(canvas.height / 3) };
  } catch (e) {
    console.warn('[DOCX] renderKatexToBase64 failed:', e);
    try { document.body.removeChild(wrapper); } catch {}
    return null;
  }
}

async function renderMermaidToBase64(source: string): Promise<{ data: string; w: number; h: number } | null> {
  const mm = (globalThis as any).mermaid;
  if (!mm?.render) { console.warn('[DOCX] mermaid not available'); return null; }
  try {
    // Force light theme for export
    try { mm.initialize({ theme: 'default', startOnLoad: false }); } catch {}
    const id = `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const r = await mm.render(id, source.trim());
    if (!r?.svg) { console.warn('[DOCX] mermaid.render returned no svg'); return null; }
    const res = await svgToCanvas(r.svg, 1200);
    if (!res) return null;
    const dataUrl = res.canvas.toDataURL("image/png");
    return { data: dataUrl.split(",")[1], w: res.w, h: res.h };
  } catch { return null; }
}

async function fetchImageBase64(src: string): Promise<{ data: string; w: number; h: number } | null> {
  if (typeof document === "undefined") return null;
  try {
    const img = await loadImg(src, true);
    const maxW = 600;
    const scale = Math.min(maxW / img.naturalWidth, 1);
    const cw = Math.round(img.naturalWidth * scale), ch = Math.round(img.naturalHeight * scale);
    const c = document.createElement("canvas"); c.width = cw; c.height = ch;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    const dataUrl = c.toDataURL("image/png");
    return { data: dataUrl.split(",")[1], w: cw, h: ch };
  } catch { return null; }
}

// ── VML image embedding for WordML ──────────────────────────

function vmlImage(base64: string, pxW: number, pxH: number, center: boolean): string {
  // Convert px to points (1px ≈ 0.75pt)
  const maxPt = 460; // ~6 inches
  let w = pxW * 0.75, h = pxH * 0.75;
  if (w > maxPt) { const r = maxPt / w; w = maxPt; h *= r; }
  const jc = center ? `<w:jc w:val="center"/>` : "";
  return `<w:p><w:pPr>${jc}</w:pPr><w:r><w:pict><v:shape style="width:${Math.round(w)}pt;height:${Math.round(h)}pt"><v:imagedata src="data:image/png;base64,${base64}"/></v:shape></w:pict></w:r></w:p>`;
}

function vmlImageInline(base64: string, pxW: number, pxH: number): string {
  let w = pxW * 0.75, h = pxH * 0.75;
  if (h > 18) { const r = 18 / h; h = 18; w *= r; }
  return `<w:r><w:pict><v:shape style="width:${Math.round(w)}pt;height:${Math.round(h)}pt"><v:imagedata src="data:image/png;base64,${base64}"/></v:shape></w:pict></w:r>`;
}

// ── Inline formatting ───────────────────────────────────────

function inlineRuns(text: string): string {
  let result = ""; let i = 0;
  while (i < text.length) {
    if (text[i] === "`" && i + 1 < text.length) {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        result += `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:shd w:val="clear" w:fill="F1F5F9"/></w:rPr><w:t>${escXml(text.slice(i + 1, end))}</w:t></w:r>`;
        i = end + 1; continue;
      }
    }
    if (text.slice(i, i + 2) === "**") {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        result += `<w:r><w:rPr><w:b/></w:rPr><w:t>${escXml(text.slice(i + 2, end))}</w:t></w:r>`;
        i = end + 2; continue;
      }
    }
    if (text[i] === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1 && text[end + 1] !== "*") {
        result += `<w:r><w:rPr><w:i/></w:rPr><w:t>${escXml(text.slice(i + 1, end))}</w:t></w:r>`;
        i = end + 1; continue;
      }
    }
    let plain = "";
    while (i < text.length && text[i] !== "`" && text[i] !== "*") { plain += text[i]; i++; }
    if (plain) result += `<w:r><w:t xml:space="preserve">${escXml(plain)}</w:t></w:r>`;
  }
  return result || `<w:r><w:t>${escXml(text)}</w:t></w:r>`;
}

// ── Helpers ─────────────────────────────────────────────────

function wPara(content: string): string { return `<w:p><w:r><w:t>${content}</w:t></w:r></w:p>`; }

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "notebook";
}
