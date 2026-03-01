/**
 * Shared animated SVG icons for cell types.
 * Each icon uses `currentColor` and contains built-in subtle animations
 * via `<animate>` or `<animateTransform>` tags to bring the interface to life.
 */

export const CELL_ICONS: Record<string, string> = {
  markdown: `<svg class="sci-icon sci-icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path class="md-path" d="M7 20V4l6 8 6-8v16" />
  </svg>`,

  code: `<svg class="sci-icon sci-icon-code" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path class="bracket-l" d="M8 6L2 12l6 6" />
    <path class="bracket-r" d="M16 6l6 6-6 6" />
    <path class="slash" d="M14 4l-4 16" />
  </svg>`,

  latex: `<svg class="sci-icon sci-icon-latex" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path class="sum" d="M18 6h-8a2 2 0 00-1.7.9l-3 4.1a2 2 0 000 2l3 4.1A2 2 0 0010 18h8" />
    <path class="cross" d="M12 10l4 4M16 10l-4 4" />
  </svg>`,

  image: `<svg class="sci-icon sci-icon-img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle class="sun" cx="8.5" cy="8.5" r="1.5" />
    <path class="mtn" d="M21 15l-5-5L5 21" />
  </svg>`,

  embed: `<svg class="sci-icon sci-icon-embed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path class="arrow" d="M10 8l4 4-4 4V8z" />
  </svg>`,

  table: `<svg class="sci-icon sci-icon-table" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18" />
    <path class="cols" d="M9 3v18M15 3v18" />
  </svg>`,

  mermaid: `<svg class="sci-icon sci-icon-mermaid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path class="diamond" d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
    <circle class="dot" cx="12" cy="12" r="2" />
  </svg>`,

  component: `<svg class="sci-icon sci-icon-comp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path class="draw" d="M12 2v6h6V2h-6zm0 10v10h10V12H12zM2 12v10h6V12H2zm0-10v6h6V2H2z" />
  </svg>`,

  raw: `<svg class="sci-icon sci-icon-raw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 7V4h16v3M9 20h6" />
    <path class="line" d="M12 4v16" />
  </svg>`,
};
