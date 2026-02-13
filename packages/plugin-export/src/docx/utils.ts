import { escapeXml } from "../utils/text";

export function inlineRuns(text: string): string {
  let result = ""; let i = 0;
  while (i < text.length) {
    if (text[i] === "`" && i + 1 < text.length) {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        result += `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:shd w:val="clear" w:fill="F1F5F9"/></w:rPr><w:t>${escapeXml(text.slice(i + 1, end))}</w:t></w:r>`;
        i = end + 1; continue;
      }
    }
    if (text.slice(i, i + 2) === "**") {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        result += `<w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(text.slice(i + 2, end))}</w:t></w:r>`;
        i = end + 2; continue;
      }
    }
    if (text[i] === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1 && text[end + 1] !== "*") {
        result += `<w:r><w:rPr><w:i/></w:rPr><w:t>${escapeXml(text.slice(i + 1, end))}</w:t></w:r>`;
        i = end + 1; continue;
      }
    }
    let plain = "";
    while (i < text.length && text[i] !== "`" && text[i] !== "*") { plain += text[i]; i++; }
    if (plain) result += `<w:r><w:t xml:space="preserve">${escapeXml(plain)}</w:t></w:r>`;
  }
  return result || `<w:r><w:t>${escapeXml(text)}</w:t></w:r>`;
}
