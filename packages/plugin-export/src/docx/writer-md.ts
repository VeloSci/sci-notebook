import { escapeXml } from "../utils/text";
import { renderKatex } from "../utils/render";
import { inlineRuns } from "./utils";
import { vmlImageInline } from "./templates";
import { codeToWordML, latexToWordML, tableToWordML } from "./writer-cells";

export async function markdownToWordML(source: string, counter: { val: number }): Promise<string> {
  const lines = source.split("\n");
  const result: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];
  let inCodeFence = false;
  let codeFenceLang = "";
  let codeFenceLines: string[] = [];

  const flushTable = () => {
    if (tableLines.length >= 2) result.push(tableToWordML(tableLines.join("\n")));
    tableLines = []; inTable = false;
  };

  for (const line of lines) {
    const t = line.trim();

    // Fenced code blocks
    if (t.startsWith("```")) {
      if (!inCodeFence) {
        if (inTable) flushTable();
        inCodeFence = true;
        codeFenceLang = t.slice(3).trim();
        codeFenceLines = [];
        continue;
      } else {
        inCodeFence = false;
        const fakeCell = { source: codeFenceLines.join("\n"), metadata: { language: codeFenceLang } } as any;
        result.push(codeToWordML(fakeCell));
        codeFenceLines = [];
        codeFenceLang = "";
        continue;
      }
    }
    if (inCodeFence) { codeFenceLines.push(line); continue; }

    if (t.includes("|") && !t.startsWith("#")) { if (!inTable) inTable = true; tableLines.push(t); continue; }
    else if (inTable) flushTable();

    if (!t) { result.push("<w:p/>"); continue; }

    // HR
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
      result.push(`<w:p><w:pPr><w:ind w:left="720"/><w:pBdr><w:left w:val="single" w:sz="12" w:space="8" w:color="8B5CF6"/></w:pBdr></w:pPr><w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>${escapeXml(t.slice(2))}</w:t></w:r></w:p>`);
      continue;
    }

    // Lists
    if (/^[-*+]\s+/.test(t)) {
      result.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${inlineRuns(t.replace(/^[-*+]\s+/, ""))}</w:p>`);
      continue;
    }
    const olm = t.match(/^(\d+)[.)]\s+(.+)/);
    if (olm) {
      result.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr>${inlineRuns(olm[2])}</w:p>`);
      continue;
    }

    // Math block
    if (t.startsWith("$$") && t.endsWith("$$") && t.length > 4) {
      result.push(await latexToWordML(t, counter));
      continue;
    }

    // Inline math line
    if (/\$[^$]+\$/.test(t)) {
      result.push(await inlineLatexLineToWordML(t, counter));
      continue;
    }

    result.push(`<w:p>${inlineRuns(t)}</w:p>`);
  }
  if (inCodeFence && codeFenceLines.length) {
    const fakeCell = { source: codeFenceLines.join("\n"), metadata: { language: codeFenceLang } } as any;
    result.push(codeToWordML(fakeCell));
  }
  if (inTable) flushTable();
  return result.join("\n");
}

async function inlineLatexLineToWordML(line: string, counter: { val: number }): Promise<string> {
  const katex = (globalThis as any).katex;
  if (!katex) return `<w:p>${inlineRuns(line)}</w:p>`;

  const parts: string[] = [];
  let last = 0;
  const re = /\$([^$]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(inlineRuns(line.slice(last, m.index)));
    const img = await renderKatex(m[1], 180, false);
    if (img) {
      parts.push(vmlImageInline(img.url.split(",")[1], img.w, img.h, counter));
    } else {
      parts.push(`<w:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/><w:i/></w:rPr><w:t>${escapeXml(m[1])}</w:t></w:r>`);
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(inlineRuns(line.slice(last)));
  return `<w:p>${parts.join("")}</w:p>`;
}
