/**
 * Lazy KaTeX loader for sci-notebook.
 *
 * Loads KaTeX on-demand when the first LaTeX cell is encountered,
 * instead of requiring it upfront. This reduces initial bundle size
 * for notebooks that don't use LaTeX.
 *
 * Usage:
 *   import { ensureKaTeX, createLazyKaTeXPostprocessor } from "@sci-notebook/renderer";
 *
 *   // Option 1: Preload KaTeX eagerly
 *   await ensureKaTeX();
 *
 *   // Option 2: Use as pipeline postprocessor (auto-loads on first latex cell)
 *   pipeline.addPostprocessor(createLazyKaTeXPostprocessor());
 */

let katexPromise: Promise<any> | null = null;
let katexInstance: any = null;

/**
 * Ensure KaTeX is loaded. Returns the katex instance.
 * If already loaded (globally or via previous call), returns immediately.
 */
export async function ensureKaTeX(): Promise<any> {
  // Already available globally
  if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
    katexInstance = (globalThis as any).katex;
    return katexInstance;
  }

  // Already loaded by us
  if (katexInstance) return katexInstance;

  // Loading in progress
  if (katexPromise) return katexPromise;

  // Lazy import — use variable to avoid static TS resolution
  katexPromise = (async () => {
    try {
      const modName = "katex";
      const mod = await (Function("m", "return import(m)")(modName) as Promise<any>);
      katexInstance = mod.default || mod;
      (globalThis as any).katex = katexInstance;
      return katexInstance;
    } catch (e) {
      katexPromise = null;
      throw new Error("Failed to load KaTeX. Install it with: npm install katex");
    }
  })();

  return katexPromise;
}

/**
 * Check if KaTeX is currently available (sync check, no loading).
 */
export function isKaTeXAvailable(): boolean {
  return !!(katexInstance || (typeof globalThis !== "undefined" && (globalThis as any).katex));
}

/**
 * Render LaTeX to HTML string (sync — requires KaTeX to be already loaded).
 * Returns null if KaTeX is not available.
 */
export function renderKaTeXSync(
  tex: string,
  options?: { displayMode?: boolean; macros?: Record<string, string> }
): string | null {
  const k = katexInstance || (typeof globalThis !== "undefined" && (globalThis as any).katex);
  if (!k) return null;

  try {
    return k.renderToString(tex, {
      displayMode: options?.displayMode ?? false,
      throwOnError: false,
      macros: options?.macros,
    });
  } catch {
    return null;
  }
}

/**
 * Create a pipeline postprocessor that lazy-loads KaTeX for latex cells.
 * On first encounter of a latex cell, triggers async load.
 * Subsequent renders use the cached instance.
 */
export function createLazyKaTeXPostprocessor() {
  let loadTriggered = false;

  return (html: string, cell: { type: string; source: string; metadata: Record<string, unknown> }): string => {
    // Only process latex cells or cells with inline math
    if (cell.type !== "latex" && !cell.source.includes("$")) return html;

    // If KaTeX is available, it's already handled by the plugin or pipeline
    if (isKaTeXAvailable()) return html;

    // Trigger lazy load (async, won't affect this render)
    if (!loadTriggered) {
      loadTriggered = true;
      ensureKaTeX().catch(() => {});
    }

    return html;
  };
}
