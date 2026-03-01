---
name: sci-notebook
description: A complete, modular, framework-agnostic scientific block-editor for managing Markdown, LaTeX, Executable Code, Images, and dynamic Embeds.
---

# Sci-Notebook Skill

This skill allows agents to integrate and manage **sci-notebook**, a zero-server, modular block-editor designed specifically for scientific content creation.

## Quick Start (React Example)

To initialize a scientific notebook in a React app:

```tsx
import { SciNotebook } from '@velo-sci/notebook-react';
import '@velo-sci/notebook-core/styles/index.css'; // Critical for layout/toolbars

const myNotebookData = {
  id: 'notebook-001',
  title: 'My Research',
  version: 1,
  cells: [
    { id: 'c1', type: 'markdown', source: '# Introduction\n\nWrite here...', metadata: {} },
    { id: 'c2', type: 'latex', source: '$$E = mc^2$$', metadata: {} },
  ]
};

function Editor() {
  return (
    <div className="sci-editor-container">
      <SciNotebook
        notebook={myNotebookData}
        onChange={(updatedNotebook) => {
          // Send to state or API
          console.log('Notebook serialized state', updatedNotebook);
        }}
      />
    </div>
  );
}
```

## Core Concepts

- **Zero-Server Editor**: The state and history live in the browser. You pass an `onChange` prop to save it. 
- **The Core Engine**: `notebook-core` stores the immutable `Cell` data and controls the `HistoryManager` and Event Bus.
- **8-Cell Types**: Supported cell `types` are: `markdown`, `code`, `latex`, `table`, `image`, `embed`, `raw`, and `notebook`.
- **The Renderer**: `notebook-renderer` optimizes conversion from raw strings to markdown/HTML using LRU caching.
- **UI Integrations**: Native wrappers map the abstract `Cell` objects to React/Vue/Svelte components.

## Guidelines for Agents

1. **State Management Banning**: DO NOT attempt to write a React `useState` wrapper over individual cells or input characters. Mute and rewrite operations ONLY through the parent `onChange` hook or the `EditorEngine`.
2. **Adding a Cell Programmatically**: Injecting a cell requires appending a `cell object` to the `notebook.cells` array in the application state and syncing the new generic object back to `<SciNotebook notebook={newData} />`. Let the library figure out UI rendering.
3. **Core CSS**: Remember to include the core css, as standard dark mode and light mode theming rely heavily on global custom CSS properties (`--nb-bg`, `--nb-text`).
4. **Markdown Syntax Plugins**: Do not parse markdown manually in a Vue component. If standard markdown isn't enough, you must hook into the `notebook-renderer` with a `markdown-it` AST plugin.
5. **Event Bus Interaction**: If a component needs to behave outside typical UI flow (e.g., highlighting based on a keyboard press), use the `EventBus` exported by `notebook-core` to subscribe to events rather than prop-drilling heavily.

## Synthesis of Possibilities

- **Rich Math Editing**: Visual GUI math block builder capable of editing integrations, matrices, bounds, and limits via KaTeX.
- **Drag & Drop Images**: Drop an image, and the library provides a local URL structure, captions, and width adjustments.
- **Embeds**: Includes iframes for YouTube, CodePen, Desmos, and GeoGebra directly inside notebook lists.
- **Nested Notebooks**: Supports nesting a fully-functional embedded notebook up to 1 level deep inside a main notebook (`notebook` cell type). Includes explicit cross-notebook drag & drop support and `readOnly` configurations natively.
- **Ghost AI**: Supports `@velo-sci/notebook-plugin-ai` for inline LLM completions directly in typing blocks.
- **Context Toolbars**: Floating format bars appear elegantly when cell text is highlighted.

## Agent Implementation Checklist

When tasked with adding a block editor to a project:
1. **Container Layout**: Ensure the editor has space to breathe.
2. **CSS Imports**: Crucially, import `@velo-sci/notebook-core/styles/index.css`.
3. **Data Initialization**: Ensure the initial data implements the `Notebook` type structure correctly with `id` and an arrays of `cells`.
5. **Plugins Integration**: Determine if KaTeX plugins or AI plugins need to be mounted in the `plugins` prop array of `<SciNotebook>`.

## Comprehensive Guides
- [Renderer Architecture (Markdown-It AST)](./resources/renderer-architecture.md)
- [Plugin Engine Architecture (EventBus)](./resources/plugins-guide.md)
- [Framework Wrappers Architecture](./resources/framework-wrappers.md)

## Practical Examples
- [React Integration Setup](./examples/react-setup.tsx)
- [Vue Integration Setup](./examples/vue-setup.vue)
- [Custom Cell Definition Data Model](./examples/custom-cell-definition.ts)
- [EventBus Plugin Implementation](./examples/plugin-example.ts)
