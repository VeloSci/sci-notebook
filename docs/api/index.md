# API Reference

Welcome to the SciNotebook API documentation. The library is divided into several specialized packages, each handling a specific part of the notebook lifecycle.

## Quick Start

### React
```tsx
import { SciNotebook } from '@velo-sci/notebook-react';
import '@velo-sci/notebook-core/styles/index.css';

<SciNotebook notebook={myNotebook} theme="dark" onChange={console.log} />
```

### Vue
```ts
import { SciNotebook } from '@velo-sci/notebook-vue';
import '@velo-sci/notebook-core/styles/index.css';

// In your template
<SciNotebook :notebook="myNotebook" theme="dark" @change="handleChange" />
```

### Vanilla JS
```ts
import { SciNotebookVanilla } from '@velo-sci/notebook-vanilla';
import '@velo-sci/notebook-core/styles/index.css';

const notebook = new SciNotebookVanilla({
  target: document.getElementById('app'),
  notebook: myData,
  theme: 'dark'
});
```

## Packages

### [Core API](/api/core)
Factory functions (`createNotebook`, `loadNotebook`, `saveNotebook`), data models (`Notebook`, `Cell`), and the `EditorEngine` for state management, undo/redo history, selection, clipboard, split/merge, keybindings, and events.

### [Renderer API](/api/renderer)
The extensible `RenderPipeline` that transforms Markdown and custom cell types into HTML, with LRU caching, Shiki syntax highlighting, and lazy KaTeX loading.

### [React API](/api/react)
High-level React components (`SciNotebook`, `Cell`, etc.) and hooks (`useSciNotebook`, `useNotebook`).

### [Vue API](/api/vue)
Vue 3 components and composables for seamless integration.

### [Svelte API](/api/svelte)
Modern Svelte 5+ adapter using runes and optimized rendering.

### [Vanilla API](/api/vanilla)
Pure JavaScript adapter for any framework or no framework at all.

### [Plugin System](/api/plugins)
The `SciNotebookPlugin` interface and `PluginContext` for extending the engine.

---

## Architecture Overview

SciNotebook follows a unidirectional data flow pattern:

1. **User Interaction** — Triggers a command in the `EditorEngine`.
2. **State Mutation** — The engine updates the internal immutable `Notebook` state (with undo/redo support).
3. **Event Emission** — The engine emits a `notebook:updated` event.
4. **Reactive Update** — Framework hooks (`useNotebook` in React, `useNotebook()` composable in Vue, `$store` in Svelte) catch the event and trigger a re-render.
5. **Rendering Pipeline** — The `RenderPipeline` processes the updated cells (utilizing LRU caching) to generate the final HTML.
