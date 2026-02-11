import type { SciNotebookPlugin, PluginContext, Cell } from "@velo-sci/notebook-core";
import katex from "katex";

export interface LatexPluginOptions {
  katexOptions?: katex.KatexOptions;
  displayMode?: boolean;
  /** Global custom macros, e.g. { "\\R": "\\mathbb{R}" } */
  macros?: Record<string, string>;
}

export function latexPlugin(options: LatexPluginOptions = {}): SciNotebookPlugin {
  const opts = {
    displayMode: false,
    ...options,
  };
  const globalMacros: Record<string, string> = opts.macros || {};

  return {
    id: "sci-nb-latex",
    name: "LaTeX (KaTeX)",
    version: "1.0.0",

    cellTypes: [
      {
        type: "latex",
        displayName: "LaTeX Block",
        icon: "\u03A3",
        defaultSource: "$$\n\\int_0^1 f(x)\\,dx\n$$",
        supportsDualMode: true,
      },
    ],

    rendering: {
      preprocess: (source: string, cell: Cell) => {
        if (cell.type === "latex") {
          const cellMacros = (cell.metadata.latexMacros as Record<string, string>) || {};
          const mergedOpts = {
            ...opts.katexOptions,
            macros: { ...globalMacros, ...cellMacros },
          };
          return renderDisplayMath(source, mergedOpts);
        }
        return source;
      },
      transformAST: (tokens: any[], cell: Cell) => {
        const cellMacros = (cell.metadata.latexMacros as Record<string, string>) || {};
        const mergedOpts = {
          ...opts.katexOptions,
          macros: { ...globalMacros, ...cellMacros },
        };
        // Find inline math $...$ and render it
        tokens.forEach((token: any) => {
          if (token.type === "inline") {
            token.content = renderInlineMath(token.content, mergedOpts);
          }
        });
        return tokens;
      },
      priority: 10,
    },

    setup(ctx: PluginContext) {
      ctx.log.info("LaTeX plugin initialized");
    },
  };
}

function renderInlineMath(content: string, options?: katex.KatexOptions): string {
  return content.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex, {
        ...options,
        displayMode: false,
        throwOnError: false,
      });
    } catch (e) {
      return `<span class="sci-nb-latex-error">${tex}</span>`;
    }
  });
}

function renderDisplayMath(content: string, options?: katex.KatexOptions): string {
  const cleaned = content.replace(/^\$\$\s*|\s*\$\$$/g, "").trim();
  try {
    return `<div class="sci-nb-latex-display">${katex.renderToString(cleaned, {
      ...options,
      displayMode: true,
      throwOnError: false,
    })}</div>`;
  } catch (e) {
    return `<div class="sci-nb-latex-error">${cleaned}</div>`;
  }
}
