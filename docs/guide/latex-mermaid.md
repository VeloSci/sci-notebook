# 06 — LaTeX, Mermaid & Embeds

## Overview

These three capabilities are the most requested features for scientific notebooks.
Each is implemented as an independent plugin that hooks into the rendering pipeline.

---

## Part A: LaTeX Support (`plugin-latex`)

### Scope

- Inline math: `$E = mc^2$` renders inline.
- Display math: `$$\int_0^\infty e^{-x} dx = 1$$` renders as a centered block.
- Dedicated `latex` cell type for full-cell LaTeX content.
- Error display: invalid LaTeX shows the error message inline (red text)
  instead of crashing the renderer.

### Engine: KaTeX

KaTeX is chosen over MathJax for performance:
- ~10x faster rendering than MathJax v3.
- No layout reflows (renders to static HTML + CSS).
- ~300 KB gzipped (loaded lazily on first use).

### Implementation

```typescript
import type { SciNotebookPlugin, PluginContext, Cell } from "@sci-notebook/core";
import katex from "katex";

export interface LatexPluginOptions {
  /** KaTeX rendering options */
  katexOptions?: katex.KatexOptions;

  /** Whether to render in display mode by default for latex cells */
  displayMode?: boolean;

  /** Custom macro definitions */
  macros?: Record<string, string>;

  /** Whether to throw on parse errors (default: false, shows error inline) */
  throwOnError?: boolean;

  /** Trust callback for potentially dangerous commands */
  trust?: boolean | ((context: { command: string }) => boolean);
}

export function latexPlugin(options?: LatexPluginOptions): SciNotebookPlugin {
  const opts: LatexPluginOptions = {
    throwOnError: false,
    displayMode: false,
    macros: {},
    ...options,
  };

  return {
    id: "sci-nb-latex",
    name: "LaTeX (KaTeX)",
    version: "1.0.0",

    cellTypes: [
      {
        type: "latex",
        displayName: "LaTeX Block",
        icon: "Σ",
        defaultSource: "$$\n\\int_0^1 f(x)\\,dx\n$$",
        supportsDualMode: true,
      },
    ],

    rendering: {
      // AST transform: find math delimiters and render via KaTeX
      transformAST: (tokens, cell) => {
        return tokens.map((token) => {
          if (token.type === "inline") {
            token.content = renderInlineMath(token.content);
          }
          if (token.type === "fence" && token.info === "latex") {
            token.content = renderDisplayMath(token.content);
            token.type = "html_block";
          }
          return token;
        });
      },

      // Preprocessor: handle $...$ and $$...$$ delimiters
      preprocess: (source, cell) => {
        if (cell.type === "latex") {
          return renderDisplayMath(source);
        }
        return source;
      },

      priority: 10, // Run before most other plugins
    },

    styles: [
      "https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css",
    ],

    setup(ctx) {
      ctx.addKeybinding("cmd+shift+m", "insert-math", () => {
        const nb = ctx.getNotebook();
        ctx.insertCell(nb.cells.length, "latex");
      });

      ctx.addToolbarItem({
        id: "insert-latex",
        label: "LaTeX",
        icon: "Σ",
        tooltip: "Insert LaTeX math block (Cmd+Shift+M)",
        group: "insert",
        shortcut: "⌘⇧M",
        action: () => {
          const nb = ctx.getNotebook();
          ctx.insertCell(nb.cells.length, "latex");
        },
      });

      ctx.log.info("LaTeX plugin ready");
    },
  };

  function renderInlineMath(content: string): string {
    return content.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex, {
          ...opts.katexOptions,
          displayMode: false,
          throwOnError: opts.throwOnError,
          macros: opts.macros,
        });
      } catch (e) {
        return `<span class="sci-nb-latex-error" title="${escape(String(e))}">${escape(tex)}</span>`;
      }
    });
  }

  function renderDisplayMath(content: string): string {
    const cleaned = content.replace(/^\$\$\s*|\s*\$\$$/g, "").trim();
    try {
      return `<div class="sci-nb-latex-display">${katex.renderToString(cleaned, {
        ...opts.katexOptions,
        displayMode: true,
        throwOnError: opts.throwOnError,
        macros: opts.macros,
      })}</div>`;
    } catch (e) {
      return `<div class="sci-nb-latex-error" title="${escape(String(e))}">${escape(cleaned)}</div>`;
    }
  }

  function escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
```

### LaTeX Macros

Users can define custom macros at the notebook level:

```json
{
  "metadata": {
    "pluginData": {
      "sci-nb-latex": {
        "macros": {
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\vec": "\\mathbf{#1}",
          "\\deriv": "\\frac{d#1}{d#2}"
        }
      }
    }
  }
}
```

### CSS Classes

| Class                      | Purpose                          |
|----------------------------|----------------------------------|
| `.sci-nb-latex-display`    | Display math container           |
| `.sci-nb-latex-inline`     | Inline math span                 |
| `.sci-nb-latex-error`      | Error display (red, monospace)   |

---

## Part B: Mermaid Diagrams (`plugin-mermaid`)

### Scope

- Fenced code blocks with language `mermaid` render as SVG diagrams.
- Dedicated `mermaid` cell type for full-cell diagrams.
- Supported diagram types: flowchart, sequence, class, state, ER, gantt, pie,
  git graph, mindmap, timeline, and any future Mermaid additions.
- Theme integration: diagrams match the notebook theme (dark/light).
- Error display: invalid Mermaid syntax shows the error inline.

### Implementation Strategy

Mermaid is heavy (~1.5 MB). It is loaded lazily on first use:

```typescript
let mermaidInstance: typeof import("mermaid") | null = null;

async function getMermaid() {
  if (!mermaidInstance) {
    mermaidInstance = await import("mermaid");
    mermaidInstance.default.initialize({
      startOnLoad: false,
      theme: "dark", // overridden per-render
      securityLevel: "strict",
    });
  }
  return mermaidInstance.default;
}
```

### Plugin Structure

```typescript
export interface MermaidPluginOptions {
  /** Mermaid theme ("default" | "dark" | "forest" | "neutral") */
  theme?: string;

  /** Maximum render time in ms before timeout (default: 5000) */
  timeout?: number;

  /** Security level ("strict" | "loose" | "antiscript" | "sandbox") */
  securityLevel?: string;

  /** Custom Mermaid configuration */
  mermaidConfig?: Record<string, unknown>;
}

export function mermaidPlugin(options?: MermaidPluginOptions): SciNotebookPlugin {
  return {
    id: "sci-nb-mermaid",
    name: "Mermaid Diagrams",
    version: "1.0.0",

    cellTypes: [
      {
        type: "mermaid",
        displayName: "Mermaid Diagram",
        icon: "◇",
        defaultSource: "graph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[OK]\n  B -->|No| D[End]",
        supportsDualMode: true,
      },
    ],

    rendering: {
      transformAST: (tokens, cell) => {
        // Replace ```mermaid fenced blocks with placeholder divs
        return tokens.map((token) => {
          if (token.type === "fence" && token.info === "mermaid") {
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            token.type = "html_block";
            token.content = `<div class="sci-nb-mermaid" data-mermaid-id="${id}" data-source="${encodeURIComponent(token.content)}"></div>`;
          }
          return token;
        });
      },
      priority: 10,
    },

    setup(ctx) {
      // Post-render hook: hydrate mermaid placeholders
      // This is done by the framework adapter after DOM insertion

      ctx.addToolbarItem({
        id: "insert-mermaid",
        label: "Diagram",
        icon: "◇",
        tooltip: "Insert Mermaid diagram",
        group: "insert",
        action: () => {
          const nb = ctx.getNotebook();
          ctx.insertCell(nb.cells.length, "mermaid");
        },
      });

      ctx.log.info("Mermaid plugin ready");
    },
  };
}
```

### Hydration

Mermaid renders asynchronously (it needs DOM access). The framework adapter
calls a hydration function after inserting rendered HTML into the DOM:

```typescript
async function hydrateMermaidElements(container: HTMLElement, theme: string) {
  const mermaid = await getMermaid();
  const elements = container.querySelectorAll(".sci-nb-mermaid[data-source]");

  for (const el of elements) {
    const source = decodeURIComponent(el.getAttribute("data-source") || "");
    const id = el.getAttribute("data-mermaid-id") || `m-${Date.now()}`;

    try {
      const { svg } = await mermaid.render(id, source);
      el.innerHTML = svg;
      el.classList.add("sci-nb-mermaid--rendered");
    } catch (err) {
      el.innerHTML = `<pre class="sci-nb-mermaid-error">${escapeHtml(String(err))}</pre>`;
      el.classList.add("sci-nb-mermaid--error");
    }
  }
}
```

---

## Part C: Embeds (`plugin-embeds`)

### Scope

Three embedding strategies:

1. **Raw HTML** — Inline HTML rendered directly (sanitized by default).
2. **Iframe** — External content loaded in a sandboxed iframe.
3. **Component** — Framework-specific components mounted into the cell.

### Embed Cell Source Format

```json
{
  "strategy": "html",
  "html": "<div class='custom-widget'>...</div>"
}
```

```json
{
  "strategy": "iframe",
  "url": "https://example.com/widget",
  "height": 400,
  "sandbox": "allow-scripts allow-same-origin"
}
```

```json
{
  "strategy": "component",
  "componentId": "my-chart-widget",
  "props": { "data": [1, 2, 3], "title": "Sample" }
}
```

### Component Registry

Plugins or the host application register components:

```typescript
interface ComponentRegistry {
  /** Register a component for embedding */
  register(id: string, descriptor: ComponentDescriptor): void;

  /** Get a registered component */
  get(id: string): ComponentDescriptor | undefined;

  /** List all registered components */
  list(): Array<{ id: string; descriptor: ComponentDescriptor }>;

  /** Unregister a component */
  unregister(id: string): void;
}

interface ComponentDescriptor {
  /** Display name */
  name: string;

  /** The component itself (React element factory, Vue component, etc.) */
  component: unknown;

  /** Default props */
  defaultProps?: Record<string, unknown>;

  /** Prop schema for validation / UI generation */
  propSchema?: Record<string, PropSchemaEntry>;
}

interface PropSchemaEntry {
  type: "string" | "number" | "boolean" | "object" | "array";
  label?: string;
  default?: unknown;
  required?: boolean;
  options?: unknown[]; // for enum-like props
}
```

### Rendering

```typescript
export function embedsPlugin(): SciNotebookPlugin {
  const registry: Map<string, ComponentDescriptor> = new Map();

  return {
    id: "sci-nb-embeds",
    name: "Embeds",
    version: "1.0.0",

    cellTypes: [
      {
        type: "embed",
        displayName: "Embed",
        icon: "⧉",
        defaultSource: JSON.stringify({ strategy: "html", html: "<p>Hello</p>" }, null, 2),
        supportsDualMode: true,
      },
    ],

    rendering: {
      renderers: [
        {
          id: "embed-renderer",
          cellTypes: ["embed"],
          renderToHTML(tokens, cell) {
            try {
              const data = JSON.parse(cell.source);
              switch (data.strategy) {
                case "html":
                  return `<div class="sci-nb-embed sci-nb-embed--html">${data.html}</div>`;
                case "iframe":
                  return `<div class="sci-nb-embed sci-nb-embed--iframe">
                    <iframe src="${escapeAttr(data.url)}" height="${data.height || 300}"
                      sandbox="${data.sandbox || 'allow-scripts'}"
                      style="width:100%;border:none;"></iframe>
                  </div>`;
                case "component":
                  // Component mount point — hydrated by framework adapter
                  return `<div class="sci-nb-embed sci-nb-embed--component"
                    data-component-id="${escapeAttr(data.componentId)}"
                    data-props="${encodeURIComponent(JSON.stringify(data.props || {}))}">
                  </div>`;
                default:
                  return `<div class="sci-nb-embed-error">Unknown strategy: ${data.strategy}</div>`;
              }
            } catch {
              return `<div class="sci-nb-embed-error">Invalid embed JSON</div>`;
            }
          },
        },
      ],
    },

    setup(ctx) {
      // Expose component registry via plugin data
      ctx.setPluginData("componentRegistry", {
        register: (id: string, desc: ComponentDescriptor) => registry.set(id, desc),
        get: (id: string) => registry.get(id),
        list: () => Array.from(registry.entries()).map(([id, d]) => ({ id, descriptor: d })),
        unregister: (id: string) => registry.delete(id),
      });

      ctx.addToolbarItem({
        id: "insert-embed",
        label: "Embed",
        icon: "⧉",
        tooltip: "Insert embedded content",
        group: "insert",
        action: () => {
          const nb = ctx.getNotebook();
          ctx.insertCell(nb.cells.length, "embed");
        },
      });
    },
  };
}
```

### Security Considerations

| Strategy    | Sanitized? | Sandboxed? | Notes                              |
|-------------|------------|------------|------------------------------------|
| `html`      | Yes        | No         | DOMPurify by default               |
| `iframe`    | N/A        | Yes        | `sandbox` attribute enforced       |
| `component` | N/A        | No         | Trusted — registered by host app   |

- HTML embeds are sanitized unless `cell.metadata.trusted === true`.
- Iframe embeds always have a `sandbox` attribute (configurable).
- Component embeds are inherently trusted (the host app registers them).

---

## Integration with Dual Mode

All three plugins follow the same dual-mode pattern:

| Mode   | LaTeX                     | Mermaid                   | Embed                     |
|--------|---------------------------|---------------------------|---------------------------|
| Edit   | Raw `$$...$$` source      | Raw Mermaid DSL           | Raw JSON source           |
| View   | Rendered formula          | Rendered SVG diagram      | Rendered HTML/iframe/comp |

Switching from view → edit shows the raw source.
Switching from edit → view triggers the rendering pipeline.
