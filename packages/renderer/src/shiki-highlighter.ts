/**
 * Shiki-based syntax highlighter for code cells.
 *
 * Uses lazy initialization — the highlighter is created on first use.
 * Supports both light and dark themes simultaneously via dual-theme mode.
 */

import type { Cell } from "@velo-sci/notebook-core";
import type { Highlighter, BundledLanguage, BundledTheme } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;
let highlighterInstance: Highlighter | null = null;

export interface ShikiHighlighterOptions {
  themes?: { light: BundledTheme; dark: BundledTheme };
  defaultLanguage?: string;
  preloadLanguages?: BundledLanguage[];
}

const DEFAULT_OPTIONS: Required<ShikiHighlighterOptions> = {
  themes: { light: "github-light", dark: "github-dark" },
  defaultLanguage: "text",
  preloadLanguages: [
    "javascript", "typescript", "python", "html", "css", "json",
    "markdown", "bash", "sql", "rust", "c", "cpp", "java", "go",
    "ruby", "php", "swift", "kotlin", "r", "julia", "latex",
  ] as BundledLanguage[],
};

/**
 * Initialize the Shiki highlighter (lazy, singleton).
 * Call this early (e.g., on app mount) for faster first highlight.
 */
export async function initShikiHighlighter(
  options: ShikiHighlighterOptions = {}
): Promise<Highlighter> {
  if (highlighterInstance) return highlighterInstance;

  if (!highlighterPromise) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    highlighterPromise = (async () => {
      const { createHighlighter } = await import("shiki");
      const h = await createHighlighter({
        themes: [opts.themes.light, opts.themes.dark],
        langs: opts.preloadLanguages,
      });
      highlighterInstance = h;
      return h;
    })();
  }

  return highlighterPromise;
}

/**
 * Highlight code synchronously if the highlighter is ready,
 * otherwise return null (caller should use fallback).
 */
export function highlightCodeSync(
  code: string,
  language: string,
  theme?: "light" | "dark"
): string | null {
  if (!highlighterInstance) return null;

  const lang = normalizeLanguage(language);
  const loadedLangs = highlighterInstance.getLoadedLanguages();

  if (!loadedLangs.includes(lang as any)) {
    // Queue language load for next time
    highlighterInstance.loadLanguage(lang as BundledLanguage).catch(() => {});
    return null;
  }

  try {
    return highlighterInstance.codeToHtml(code, {
      lang,
      theme: theme === "dark" ? "github-dark" : "github-light",
    });
  } catch {
    return null;
  }
}

/**
 * Highlight code asynchronously — loads language if needed.
 */
export async function highlightCode(
  code: string,
  language: string,
  theme?: "light" | "dark"
): Promise<string> {
  const h = await initShikiHighlighter();
  const lang = normalizeLanguage(language);
  const loadedLangs = h.getLoadedLanguages();

  if (!loadedLangs.includes(lang as any)) {
    try {
      await h.loadLanguage(lang as BundledLanguage);
    } catch {
      // Language not available, fall back to text
      return h.codeToHtml(code, {
        lang: "text",
        theme: theme === "dark" ? "github-dark" : "github-light",
      });
    }
  }

  return h.codeToHtml(code, {
    lang,
    theme: theme === "dark" ? "github-dark" : "github-light",
  });
}

/**
 * Highlight code to tokens (text + color) for custom rendering (e.g. PDF).
 */
export async function highlightToTokens(
  code: string,
  language: string,
  theme?: "light" | "dark"
) {
  const h = await initShikiHighlighter();
  const lang = normalizeLanguage(language);
  const loadedLangs = h.getLoadedLanguages();

  if (!loadedLangs.includes(lang as any)) {
    try {
      await h.loadLanguage(lang as BundledLanguage);
    } catch {
      // ignore
    }
  }

  return h.codeToTokens(code, {
    lang: lang as any,
    theme: theme === "dark" ? "github-dark" : "github-light",
  });
}

/**
 * Create a RenderPipeline postprocessor that replaces code blocks
 * with Shiki-highlighted versions (sync — uses cached highlighter).
 */
export function createShikiPostprocessor(theme?: "light" | "dark") {
  return (html: string, cell: Cell): string => {
    if (cell.type !== "code") return html;

    const lang = (cell.metadata.language as string) || "text";
    const highlighted = highlightCodeSync(cell.source, lang, theme);

    if (highlighted) {
      return `<div class="sci-nb-shiki">${highlighted}</div>`;
    }

    // Fallback: return original HTML (un-highlighted)
    return html;
  };
}

/**
 * Dispose the highlighter instance (for cleanup).
 */
export function disposeShikiHighlighter(): void {
  if (highlighterInstance) {
    highlighterInstance.dispose();
    highlighterInstance = null;
    highlighterPromise = null;
  }
}

// ── Helpers ──────────────────────────────────────────────────

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  kt: "kotlin",
  rs: "rust",
  tex: "latex",
  md: "markdown",
  plaintext: "text",
  plain: "text",
  txt: "text",
  "": "text",
};

function normalizeLanguage(lang: string): string {
  const lower = (lang || "").toLowerCase().trim();
  return LANGUAGE_ALIASES[lower] || lower || "text";
}
