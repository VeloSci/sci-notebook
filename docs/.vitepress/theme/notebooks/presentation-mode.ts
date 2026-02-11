export const presentationModeNotebook = {
  id: "doc-presentation",
  title: "Presentation Mode",
  cells: [
    {
      id: "pm-intro",
      type: "markdown",
      source: "# Presentation Mode\n\nTurn any notebook into a **slideshow** with the `PresentationEngine`. Supports 3 split modes, 4 transition types, keyboard navigation, fullscreen, and auto-advance.",
      metadata: {},
    },
    {
      id: "pm-quick",
      type: "code",
      source: "import { PresentationEngine, getPresentationCSS } from '@velo-sci/notebook-core';\n\nconst engine = new PresentationEngine(notebook, {\n  splitMode: 'heading',   // 'cell' | 'heading' | 'manual'\n  transition: 'fade',     // 'none' | 'fade' | 'slide-left' | 'slide-right'\n  transitionDuration: 300,\n});\n\n// Inject CSS\nconst style = document.createElement('style');\nstyle.textContent = getPresentationCSS({ transition: 'fade' });\ndocument.head.appendChild(style);\n\n// Start presenting\nengine.start();\nengine.next();     // Next slide\nengine.prev();     // Previous slide\nengine.goTo(3);    // Jump to slide 4\nengine.end();      // End presentation",
      metadata: { language: "typescript" },
    },
    {
      id: "pm-split-diagram",
      type: "mermaid",
      source: "graph LR\n  A[Notebook Cells] --> B{Split Mode}\n  B -->|cell| C[1 cell = 1 slide]\n  B -->|heading| D[Group by H1/H2]\n  B -->|manual| E[slideBreak metadata]",
      metadata: {},
    },
    {
      id: "pm-split",
      type: "markdown",
      source: "## Split Modes\n\n| Mode | Description |\n|------|-------------|\n| `cell` | One cell per slide. Every cell becomes its own slide. |\n| `heading` | Split on `h1`/`h2` headings. Cells between headings are grouped into a single slide. |\n| `manual` | Split on cells that have `metadata.slideBreak: true`. |\n\n### Example: Heading Mode\n\nGiven cells: `# Intro`, text, `## Methods`, code, `## Results`\n\nProduces 3 slides:\n- **Slide 1**: Intro + text\n- **Slide 2**: Methods + code\n- **Slide 3**: Results",
      metadata: {},
    },
    {
      id: "pm-keyboard",
      type: "markdown",
      source: "## Keyboard Navigation\n\n| Key | Action |\n|-----|--------|\n| `→` / `Space` / `PageDown` | Next slide |\n| `←` / `PageUp` | Previous slide |\n| `Home` | First slide |\n| `End` | Last slide |\n| `Escape` | End presentation |\n| `F` | Toggle fullscreen |",
      metadata: {},
    },
    {
      id: "pm-transitions",
      type: "markdown",
      source: "## Transitions\n\n| Transition | Effect |\n|------------|--------|\n| `none` | Instant switch, no animation |\n| `fade` | Smooth fade in/out (default) |\n| `slide-left` | Slide from right to left |\n| `slide-right` | Slide from left to right |",
      metadata: {},
    },
    {
      id: "pm-auto",
      type: "code",
      source: "// Auto-advance slides every 5 seconds\nengine.startAutoAdvance(5000);\nengine.stopAutoAdvance();\n\n// Fullscreen API integration\nengine.enterFullscreen();\nengine.exitFullscreen();",
      metadata: { language: "typescript" },
    },
    {
      id: "pm-events",
      type: "code",
      source: "// Listen to presentation events\nengine.on((event) => {\n  switch (event.type) {\n    case 'presentation:started':\n      console.log('Started with', event.slideCount, 'slides');\n      break;\n    case 'slide:changed':\n      console.log('Now on slide', event.slide);\n      break;\n    case 'presentation:ended':\n      console.log('Presentation ended');\n      break;\n  }\n});",
      metadata: { language: "typescript" },
    },
  ],
  metadata: { author: "sci-notebook-docs" },
  version: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
