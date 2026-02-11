import type { Notebook, Cell } from "@velo-sci/notebook-core";

export interface DOCXExportOptions {
  /** Title override */
  title?: string;
  /** Author */
  author?: string;
  /** Include cell metadata */
  includeMetadata?: boolean;
  /** Custom cell renderer */
  renderCell?: (cell: Cell) => string;
}

/**
 * Export notebook to DOCX-compatible XML (Office Open XML).
 *
 * Generates a flat OPC (Office Open XML) document that can be opened
 * by Microsoft Word, LibreOffice, and Google Docs.
 *
 * For full-featured DOCX with images and complex formatting,
 * use a library like docx.js on top of this.
 */
export function exportToDOCX(
  notebook: Readonly<Notebook>,
  options: DOCXExportOptions = {}
): { content: string; mimeType: string; filename: string; blob: Blob } {
  const title = options.title || notebook.title || "Untitled Notebook";
  const author = options.author || (notebook.metadata.author as string) || "";

  const paragraphs = notebook.cells.map(cell => cellToWordML(cell, options)).join("\n");

  const wordML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint"
  xmlns:o="urn:schemas-microsoft-com:office:office">
  <o:DocumentProperties>
    <o:Title>${escapeXml(title)}</o:Title>
    ${author ? `<o:Author>${escapeXml(author)}</o:Author>` : ""}
    <o:Created>${new Date().toISOString()}</o:Created>
  </o:DocumentProperties>
  <w:styles>
    <w:style w:type="paragraph" w:styleId="Heading1">
      <w:name w:val="heading 1"/>
      <w:rPr><w:b/><w:sz w:val="48"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading2">
      <w:name w:val="heading 2"/>
      <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Heading3">
      <w:name w:val="heading 3"/>
      <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
    </w:style>
    <w:style w:type="paragraph" w:styleId="Code">
      <w:name w:val="Code"/>
      <w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="20"/></w:rPr>
      <w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F4F4F8"/></w:pPr>
    </w:style>
  </w:styles>
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    ${author ? `<w:p><w:r><w:rPr><w:i/><w:color w:val="666666"/></w:rPr><w:t>By ${escapeXml(author)}</w:t></w:r></w:p>` : ""}
    <w:p><w:r><w:rPr><w:color w:val="999999"/><w:sz w:val="18"/></w:rPr><w:t>${new Date().toLocaleDateString()}</w:t></w:r></w:p>
    ${paragraphs}
  </w:body>
</w:wordDocument>`;

  const blob = new Blob([wordML], {
    type: "application/vnd.ms-word",
  });

  return {
    content: wordML,
    mimeType: "application/vnd.ms-word",
    filename: `${slugify(title)}.doc`,
    blob,
  };
}

/**
 * Download a DOCX export result.
 */
export function downloadDOCX(result: { blob: Blob; filename: string }): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function cellToWordML(cell: Cell, options: DOCXExportOptions): string {
  if (options.renderCell) {
    const custom = options.renderCell(cell);
    return `<w:p><w:r><w:t>${escapeXml(custom)}</w:t></w:r></w:p>`;
  }

  switch (cell.type) {
    case "markdown":
      return markdownToWordML(cell.source);
    case "code": {
      const lines = cell.source.split("\n");
      return lines.map(line =>
        `<w:p><w:pPr><w:pStyle w:val="Code"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
      ).join("\n");
    }
    case "latex":
      return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/></w:rPr><w:t>${escapeXml(cell.source)}</w:t></w:r></w:p>`;
    case "raw":
      return cell.source.split("\n").map(line =>
        `<w:p><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
      ).join("\n");
    case "image":
      return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>[Image: ${escapeXml(cell.source)}]</w:t></w:r></w:p>`;
    default:
      return `<w:p><w:r><w:t>${escapeXml(cell.source)}</w:t></w:r></w:p>`;
  }
}

function markdownToWordML(source: string): string {
  const lines = source.split("\n");
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push("<w:p/>");
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 3);
      result.push(`<w:p><w:pPr><w:pStyle w:val="Heading${level}"/></w:pPr><w:r><w:t>${escapeXml(headingMatch[2])}</w:t></w:r></w:p>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      result.push(`<w:p><w:pPr><w:ind w:left="720"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="555555"/></w:rPr><w:t>${escapeXml(trimmed.slice(2))}</w:t></w:r></w:p>`);
      continue;
    }

    // List items
    if (trimmed.match(/^[-*]\s+/)) {
      const text = trimmed.replace(/^[-*]\s+/, "");
      result.push(`<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>`);
      continue;
    }

    // Regular paragraph with inline formatting
    result.push(`<w:p>${inlineToWordML(trimmed)}</w:p>`);
  }

  return result.join("\n");
}

function inlineToWordML(text: string): string {
  // Simple inline formatting: **bold**, *italic*, `code`
  let result = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "`" && i + 1 < text.length) {
      const end = text.indexOf("`", i + 1);
      if (end !== -1) {
        const code = text.slice(i + 1, end);
        result += `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:shd w:val="clear" w:fill="F0F0F4"/></w:rPr><w:t>${escapeXml(code)}</w:t></w:r>`;
        i = end + 1;
        continue;
      }
    }

    if (text.slice(i, i + 2) === "**") {
      const end = text.indexOf("**", i + 2);
      if (end !== -1) {
        const bold = text.slice(i + 2, end);
        result += `<w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(bold)}</w:t></w:r>`;
        i = end + 2;
        continue;
      }
    }

    if (text[i] === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") {
      const end = text.indexOf("*", i + 1);
      if (end !== -1 && text[end + 1] !== "*") {
        const italic = text.slice(i + 1, end);
        result += `<w:r><w:rPr><w:i/></w:rPr><w:t>${escapeXml(italic)}</w:t></w:r>`;
        i = end + 1;
        continue;
      }
    }

    // Accumulate plain text
    let plain = "";
    while (i < text.length && text[i] !== "`" && text[i] !== "*") {
      plain += text[i];
      i++;
    }
    if (plain) {
      result += `<w:r><w:t xml:space="preserve">${escapeXml(plain)}</w:t></w:r>`;
    }
  }

  return result || `<w:r><w:t>${escapeXml(text)}</w:t></w:r>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "notebook";
}
