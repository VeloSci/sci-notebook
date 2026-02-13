import type { SciNotebookPlugin, PluginContext } from "@velo-sci/notebook-core";
import { exportToPDF, type PDFExportOptions } from "./pdf-export";

export interface ExportPluginOptions {
  pdf?: PDFExportOptions;
}

/**
 * Create the export plugin for sci-notebook.
 *
 * Registers an event handler for the 'export:pdf' event.
 *
 * Usage:
 * ```ts
 * const engine = createNotebook({
 *   config: { plugins: [createExportPlugin()] }
 * });
 *
 * // Trigger PDF export
 * engine.emit('export:pdf', {});
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
    },
  };
}
