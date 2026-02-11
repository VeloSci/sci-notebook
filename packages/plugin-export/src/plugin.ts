import type { SciNotebookPlugin, PluginContext } from "@velo-sci/notebook-core";
import { exportToPDF, type PDFExportOptions } from "./pdf-export";
import { exportToDOCX, downloadDOCX, type DOCXExportOptions } from "./docx-export";

export interface ExportPluginOptions {
  pdf?: PDFExportOptions;
  docx?: DOCXExportOptions;
}

/**
 * Create the export plugin for sci-notebook.
 *
 * Registers event handlers for 'export:pdf' and 'export:docx' events.
 *
 * Usage:
 * ```ts
 * const engine = createNotebook({
 *   config: { plugins: [createExportPlugin()] }
 * });
 *
 * // Trigger PDF export
 * engine.emit('export:pdf', {});
 *
 * // Trigger DOCX export
 * engine.emit('export:docx', {});
 * ```
 */
export function createExportPlugin(options: ExportPluginOptions = {}): SciNotebookPlugin {
  return {
    id: "sci-notebook-export",
    name: "Export Plugin",
    version: "0.6.1",
    apiVersion: "1",

    setup(ctx: PluginContext) {
      ctx.on("export:pdf", () => {
        const notebook = ctx.getNotebook();
        exportToPDF(notebook, options.pdf);
        ctx.log.info("PDF export triggered");
      });

      ctx.on("export:docx", () => {
        const notebook = ctx.getNotebook();
        const result = exportToDOCX(notebook, options.docx);
        downloadDOCX(result);
        ctx.log.info("DOCX export triggered");
      });
    },
  };
}
