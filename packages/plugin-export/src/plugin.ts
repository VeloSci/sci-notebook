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
      ctx.on("export:pdf", async () => {
        try {
          const notebook = ctx.getNotebook();
          await exportToPDF(notebook, options.pdf);
          ctx.log.info("PDF export completed");
        } catch (e: any) {
          ctx.log.error("PDF export failed: " + (e.message || String(e)));
        }
      });

      ctx.on("export:docx", async () => {
        try {
          const notebook = ctx.getNotebook();
          const result = await exportToDOCX(notebook, options.docx);
          downloadDOCX(result);
          ctx.log.info("DOCX export completed");
        } catch (e: any) {
          ctx.log.error("DOCX export failed: " + (e.message || String(e)));
        }
      });
    },
  };
}
