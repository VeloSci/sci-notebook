import type { Notebook, Cell } from "@velo-sci/notebook-core";
import { exportToHTML, type ExportOptions } from "@velo-sci/notebook-core";

export interface PDFExportOptions extends ExportOptions {
  /** Page size (default: 'A4') */
  pageSize?: "A4" | "Letter" | "Legal";
  /** Orientation (default: 'portrait') */
  orientation?: "portrait" | "landscape";
  /** Margins in mm (default: { top: 20, right: 20, bottom: 20, left: 20 }) */
  margins?: { top: number; right: number; bottom: number; left: number };
  /** Include page numbers (default: true) */
  pageNumbers?: boolean;
  /** Header text */
  headerText?: string;
  /** Footer text */
  footerText?: string;
}

/**
 * Export notebook to PDF using the browser's print-to-PDF capability.
 *
 * Strategy: Generate a styled HTML document optimized for print,
 * then open it in a new window and trigger window.print().
 *
 * For server-side PDF generation, use the HTML export with a headless
 * browser like Puppeteer or Playwright.
 */
export function exportToPDF(
  notebook: Readonly<Notebook>,
  options: PDFExportOptions = {}
): void {
  if (typeof window === "undefined") {
    throw new Error("exportToPDF requires a browser environment. Use exportToHTML + headless browser for server-side.");
  }

  const pageSize = options.pageSize || "A4";
  const orientation = options.orientation || "portrait";
  const margins = options.margins || { top: 20, right: 20, bottom: 20, left: 20 };
  const pageNumbers = options.pageNumbers !== false;

  const printCSS = `
    @page {
      size: ${pageSize} ${orientation};
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    @media print {
      body { font-size: 11pt; color: #000; background: #fff; }
      .sci-nb--export { max-width: 100%; margin: 0; padding: 0; }
      .sci-nb-cell--code pre { break-inside: avoid; }
      .sci-nb-cell--image { break-inside: avoid; }
      .sci-nb-cell--latex { break-inside: avoid; }
      ${pageNumbers ? `
        @bottom-center {
          content: counter(page) " / " counter(pages);
          font-size: 9pt;
          color: #666;
        }
      ` : ""}
      ${options.headerText ? `
        @top-center {
          content: "${options.headerText}";
          font-size: 9pt;
          color: #666;
        }
      ` : ""}
      ${options.footerText ? `
        @bottom-left {
          content: "${options.footerText}";
          font-size: 8pt;
          color: #999;
        }
      ` : ""}
    }
    .page-break { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
  `;

  const htmlResult = exportToHTML(notebook, {
    ...options,
    customCSS: (options.customCSS || "") + printCSS,
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Failed to open print window. Check popup blocker settings.");
  }

  printWindow.document.write(htmlResult.content);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

/**
 * Generate a print-ready HTML string for PDF conversion.
 * Use this with headless browsers (Puppeteer, Playwright) for server-side PDF.
 */
export function generatePrintHTML(
  notebook: Readonly<Notebook>,
  options: PDFExportOptions = {}
): string {
  const pageSize = options.pageSize || "A4";
  const orientation = options.orientation || "portrait";
  const margins = options.margins || { top: 20, right: 20, bottom: 20, left: 20 };

  const printCSS = `
    @page {
      size: ${pageSize} ${orientation};
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }
    @media print {
      body { font-size: 11pt; }
      .sci-nb--export { max-width: 100%; margin: 0; padding: 0; }
      .sci-nb-cell--code pre { break-inside: avoid; }
    }
  `;

  const result = exportToHTML(notebook, {
    ...options,
    customCSS: (options.customCSS || "") + printCSS,
  });

  return result.content;
}
