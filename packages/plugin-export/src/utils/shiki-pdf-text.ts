import { highlightToTokens } from "@velo-sci/notebook-renderer";
import { Cur, FZ, SP, COL } from "../pdf/cursor";

export async function writeShikiCode(c: Cur, code: string, lang: string) {
  const d = c.doc;
  const result = await highlightToTokens(code, lang, "light");
  if (!result || !result.tokens) return false;

  const tokens = result.tokens;
  const bgX = c.L;
  let sy = c.y;
  
  d.setFont("courier", "normal");
  d.setFontSize(FZ.code);

  // Calculate total height
  const totalH = tokens.length * SP.codeLn + 4;
  
  // Draw block background
  d.setFillColor(248, 250, 252); // #f8fafc
  d.setDrawColor(226, 232, 240); // #e2e8f0
  d.setLineWidth(0.2);
  
  // If fits on page
  if (c.y + totalH <= c.maxY) {
    d.roundedRect(c.L, c.y, c.cw, totalH, 1.5, 1.5, "FD");
    c.adv(2);
    
    for (const line of tokens) {
      let curX = c.L + 4;
      for (const token of line as any[]) {
        const rgb = hexToRgb(token.color || "#000000");
        d.setTextColor(rgb.r, rgb.g, rgb.b);
        d.text(token.content, curX, c.y + SP.codeLn * 0.75);
        curX += d.getStringUnitWidth(token.content) * FZ.code * 25.4 / 72;
      }
      c.adv(SP.codeLn);
    }
    c.adv(2);
  } else {
    // Multi-page handling
    let currentY = c.y;
    const initialH = Math.min(tokens.length * SP.codeLn + 4, c.maxY - currentY);
    d.roundedRect(c.L, currentY, c.cw, initialH, 1.5, 1.5, "FD");
    c.adv(2);

    for (let i = 0; i < tokens.length; i++) {
      const line = tokens[i];
      if (c.y + SP.codeLn > c.maxY) {
        c.np();
        // New page background
        const remainLines = tokens.length - i;
        const h = Math.min(remainLines * SP.codeLn + 4, c.maxY - c.y);
        d.setFillColor(248, 250, 252);
        d.setDrawColor(226, 232, 240);
        d.setLineWidth(0.2);
        d.roundedRect(c.L, c.y, c.cw, h, 1.5, 1.5, "FD");
        c.adv(2);
        d.setFont("courier", "normal");
        d.setFontSize(FZ.code);
      }
      
      let curX = c.L + 4;
      for (const token of line as any[]) {
        const rgb = hexToRgb(token.color || "#000000");
        d.setTextColor(rgb.r, rgb.g, rgb.b);
        d.text(token.content, curX, c.y + SP.codeLn * 0.75);
        curX += d.getStringUnitWidth(token.content) * FZ.code * 25.4 / 72;
      }
      c.adv(SP.codeLn);
    }
    c.adv(2);
  }

  d.setTextColor(...COL.text);
  d.setFont("helvetica", "normal");
  return true;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}
