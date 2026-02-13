import { Cur, SP, COL, FZ } from "./cursor";
import { writeTbl, writeHead, writeBq, writeLi, writePara, writePlain } from "./primitives";
import { writeCode, writeTex, writeTexInline } from "./writers-cells";
import { strip } from "../utils/text";

export async function writeMd(c: Cur, src: string) {
  const lines = src.split("\n");
  let tbl: string[] = [];
  const flTbl = () => { if (tbl.length >= 2) writeTbl(c, tbl.join("\n")); tbl = []; };

  let inCodeFence = false;
  let codeFenceLang = "";
  let codeFenceLines: string[] = [];

  for (const line of lines) {
    const t = line.trim();

    // Fenced code blocks: ```lang ... ```
    if (t.startsWith("```")) {
      if (!inCodeFence) {
        if (tbl.length) flTbl();
        inCodeFence = true;
        codeFenceLang = t.slice(3).trim();
        codeFenceLines = [];
        continue;
      } else {
        // End of code fence — render as code block
        inCodeFence = false;
        const fakeCell = { source: codeFenceLines.join("\n"), metadata: { language: codeFenceLang } } as any;
        writeCode(c, fakeCell);
        codeFenceLines = [];
        codeFenceLang = "";
        continue;
      }
    }
    if (inCodeFence) { codeFenceLines.push(line); continue; }

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
  // Flush unclosed code fence
  if (inCodeFence && codeFenceLines.length) {
    const fakeCell = { source: codeFenceLines.join("\n"), metadata: { language: codeFenceLang } } as any;
    writeCode(c, fakeCell);
  }
  if (tbl.length) flTbl();
}
