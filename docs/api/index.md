# API Reference

Welcome to the SciNotebook API documentation. The library is divided into several specialized packages, each handling a specific part of the notebook lifecycle.

## Quick Start

```typescript
import { createNotebook } from '@velo-sci/notebook-core';
import { SciNotebook } from '@velo-sci/notebook-react';
import '@velo-sci/notebook-core/styles/index.css';

// Option A: Pass a Notebook object
<SciNotebook notebook={myNotebook} theme="dark" onChange={console.log} />

// Option B: Zero-config with markdown string
<SciNotebook initialContent="# Hello World" />

// Option C: Pre-built engine for full control
const engine = createNotebook({ notebook: myData, config: { plugins: [] } });
<SciNotebook engine={engine} />
```

## Packages

### [Core API](/api/core)
Factory functions (`createNotebook`, `loadNotebook`, `saveNotebook`), data models (`Notebook`, `Cell`), and the `EditorEngine` for state management, undo/redo history, selection, clipboard, split/merge, keybindings, and events.

### [Renderer API](/api/renderer)
The extensible `RenderPipeline` that transforms Markdown and custom cell types into HTML, with LRU caching, Shiki syntax highlighting, and lazy KaTeX loading.

### [React API](/api/react)
High-level React components (`SciNotebook`, `Cell`, `MathEditor`, `ImageCell`, `EmbedCell`, `TableCell`, `MermaidCell`, etc.) and hooks (`useSciNotebook`, `useNotebook`, `useCell`, `useFocusedCell`, `useNotebookEvent`).

### [Plugin System](/api/plugins)
The `SciNotebookPlugin` interface and `PluginContext` for extending the engine with custom cell types, rendering hooks, and event listeners.

---

## Architecture Overview

SciNotebook follows a unidirectional data flow pattern:

1. **User Interaction** — Triggers a command in the `EditorEngine`.
2. **State Mutation** — The engine updates the internal immutable `Notebook` state (with undo/redo support).
3. **Event Emission** — The engine emits a `notebook:updated` event.
4. **Reactive Update** — Framework hooks (`useNotebook` in React, `useNotebook()` composable in Vue, `$store` in Svelte) catch the event and trigger a re-render.
5. **Rendering Pipeline** — The `RenderPipeline` processes the updated cells (utilizing LRU caching) to generate the final HTML.
