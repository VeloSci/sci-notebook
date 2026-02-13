import type { Notebook, Cell } from "@velo-sci/notebook-core";
import { escapeXml, slug } from "../utils/text";
import { cellToWordML } from "./writer-cells";
import { markdownToWordML } from "./writer-md";
import { SHAPE_TYPE_DEF, wPara } from "./templates";

export interface DOCXExportOptions {
  title?: string;
  author?: string;
  includeMetadata?: boolean;
  renderCell?: (cell: Cell) => string;
}

export async function exportToDOCX(
  notebook: Readonly<Notebook>,
  options: DOCXExportOptions = {}
): Promise<{ content: string; mimeType: string; filename: string; blob: Blob }> {
  const counter = { val: 0 };
  const title = options.title || notebook.title || "Untitled Notebook";
  const author = options.author || (notebook.metadata.author as string) || "";

  const parts: string[] = [];
  for (const cell of notebook.cells) {
    try {
      if (cell.type === "markdown") {
        // Special handling if we want markdown logic specifically, 
        // but cellToWordML already calls markdownToWordML.
        // Wait, cellToWordML in writer-cells calls wPara(escapeXml(source)) for markdown currently?
        // Let's check writer-cells.ts content I wrote.
        // case "markdown": return wPara(escapeXml(cell.source)); // Should be called from writer-md
        // Ah, I wrote a comment "Should be called from writer-md" but implemented the fallback.
        // I should call markdownToWordML here or update writer-cells.
        // Better to update writer-cells to import markdownToWordML? Circular dependency: writer-md -> writer-cells -> writer-md.
        // So index.ts should dispatch markdown cells to markdownToWordML directly.
        
        parts.push(await markdownToWordML(cell.source, counter));
      } else {
        parts.push(await cellToWordML(cell, counter, options));
      }
    }
    catch { parts.push(wPara(escapeXml(cell.source))); }
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
    <o:Title>${escapeXml(title)}</o:Title>
    ${author ? `<o:Author>${escapeXml(author)}</o:Author>` : ""}
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
      <w:pPr>
        <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
        <w:ind w:left="360" w:right="360"/>
        <w:spacing w:before="120" w:after="120" w:line="240"/>
      </w:pPr>
    </w:style>
  </w:styles>
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>${escapeXml(title)}</w:t></w:r>
    </w:p>
    ${author ? `<w:p><w:r><w:rPr><w:i/><w:color w:val="64748B"/></w:rPr><w:t>By ${escapeXml(author)}</w:t></w:r></w:p>` : ""}
    <w:p><w:r><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr><w:t>${new Date().toLocaleDateString()}</w:t></w:r></w:p>
    ${SHAPE_TYPE_DEF}
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
