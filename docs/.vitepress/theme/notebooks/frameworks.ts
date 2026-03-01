export const reactDocNotebook = {
  id: "react-api-demo",
  title: "React Integration",
  cells: [
    {
      id: "r1",
      type: "markdown",
      source: "# React Adapter\n\nThe `@velo-sci/notebook-react` package provides a seamless integration with React 18+.",
      metadata: {}
    },
    {
      id: "r-usage-title",
      type: "markdown",
      source: "## Usage",
      metadata: {}
    },
    {
      id: "r-usage-code",
      type: "code",
      source: "import { SciNotebook } from '@velo-sci/notebook-react';\nimport '@velo-sci/notebook-core/styles/index.css';\n\n<SciNotebook\n  notebook={initialNotebook}\n  theme=\"dark\"\n  onChange={(nb) => console.log('Updated', nb)}\n  onCellFocus={(cellId) => console.log('Focused:', cellId)}\n  engineRef={engineRef}\n  readOnly={false}\n  showToolbar={true}\n  plugins={[latexPlugin]}\n/>",
      metadata: { language: "tsx" }
    },
    {
      id: "r-hooks-title",
      type: "markdown",
      source: "## Available Hooks",
      metadata: {}
    },
    {
      id: "r-hooks-list",
      type: "markdown",
      source: "- `useSciNotebook()`: Access the engine instance\n- `useNotebook()`: Reactive notebook state\n- `useCell(cellId)`: Reactive cell state\n- `useFocusedCell()`: Currently focused cell ID\n- `useNotebookEvent(event, handler)`: Subscribe to engine events",
      metadata: {}
    }
  ],
  version: 1,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const vueDocNotebook = {
  id: "vue-api-demo",
  title: "Vue 3 Integration",
  cells: [
    {
      id: "v1",
      type: "markdown",
      source: "# Vue Adapter\n\nThe `@velo-sci/notebook-vue` package provides components and composables for Vue 3.",
      metadata: {}
    },
    {
      id: "v-usage-title",
      type: "markdown",
      source: "## Usage",
      metadata: {}
    },
    {
      id: "v-usage-code",
      type: "code",
      source: "<template>\n  <SciNotebook\n    :notebook=\"initialData\"\n    theme=\"dark\"\n    :showToolbar=\"true\"\n    @change=\"handleChange\"\n    :engineRef=\"engineRef\"\n  />\n</template>\n\n<script setup>\nimport { SciNotebook } from '@velo-sci/notebook-vue';\nimport { ref } from 'vue';\n\nconst initialData = ref({ /* ... */ });\nconst engineRef = ref(null);\n\nconst handleChange = (nb) => {\n  console.log('Notebook updated', nb);\n};\n</script>",
      metadata: { language: "vue" }
    },
    {
      id: "v-composables-title",
      type: "markdown",
      source: "## Composables",
      metadata: {}
    },
    {
      id: "v-composables-list",
      type: "markdown",
      source: "- `useNotebook()`: Reactive reference to current state\n- `useCell(cellId)`: Reactive reference to a specific cell\n- `useSciNotebook()`: Imperative engine access",
      metadata: {}
    }
  ],
  version: 1,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const svelteDocNotebook = {
  id: "svelte-api-demo",
  title: "Svelte 5 Integration",
  cells: [
    {
      id: "s1",
      type: "markdown",
      source: "# Svelte Adapter\n\nThe `@velo-sci/notebook-svelte` package is optimized for Svelte 5+ runes.",
      metadata: {}
    },
    {
      id: "s-usage-title",
      type: "markdown",
      source: "## Usage",
      metadata: {}
    },
    {
      id: "s-usage-code",
      type: "code",
      source: "<script>\n  import { SciNotebookSvelte } from '@velo-sci/notebook-svelte';\n  import { onMount } from 'svelte';\n\n  let container;\n  let notebook;\n\n  onMount(() => {\n    notebook = new SciNotebookSvelte({\n      target: container,\n      notebook: initialData,\n      theme: 'light',\n      onChange: (nb) => { console.log(nb); }\n    });\n\n    return () => notebook.destroy();\n  });\n</script>\n\n<div bind:this={container}></div>",
      metadata: { language: "svelte" }
    }
  ],
  version: 1,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const vanillaDocNotebook = {
  id: "vanilla-api-demo",
  title: "Vanilla JS Integration",
  cells: [
    {
      id: "van1",
      type: "markdown",
      source: "# Vanilla JS Adapter\n\nThe `@velo-sci/notebook-vanilla` package can be used in any environment.",
      metadata: {}
    },
    {
      id: "van-install-title",
      type: "markdown",
      source: "## Installation",
      metadata: {}
    },
    {
      id: "van-install-code",
      type: "code",
      source: "npm install @velo-sci/notebook-vanilla",
      metadata: { language: "bash" }
    },
    {
      id: "van-usage-title",
      type: "markdown",
      source: "## Usage",
      metadata: {}
    },
    {
      id: "van-usage-code",
      type: "code",
      source: "import { SciNotebookVanilla } from '@velo-sci/notebook-vanilla';\nimport '@velo-sci/notebook-core/styles/index.css';\n\nconst app = document.getElementById('app');\n\nconst notebook = new SciNotebookVanilla({\n  target: app,\n  notebook: myInitialData,\n  theme: 'light',\n  showToolbar: true,\n  onChange: (updatedNotebook) => {\n    console.log('Notebook changed:', updatedNotebook);\n  }\n});\n\n// Imperative access to the engine\nconst engine = notebook.getEngine();\nengine.insertCell(0, 'markdown', '# New Cell');\n\n// Cleanup\n// notebook.destroy();",
      metadata: { language: "typescript" }
    },
    {
      id: "van-options-title",
      type: "markdown",
      source: "## Configuration Options",
      metadata: {}
    },
    {
      id: "van-options-table",
      type: "markdown",
      source: "| Option | Type | Default | Description |\n|--------|------|---------|-------------|\n| `target` | `HTMLElement` | — | Required hook for mounting |\n| `notebook` | `Notebook` | — | Initial notebook state |\n| `theme` | `string` | `\"light\"` | Visual theme |\n| `showToolbar`| `boolean` | `true` | UI visibility |\n| `onChange` | `Function` | — | Change listener |",
      metadata: {}
    }
  ],
  version: 1,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
