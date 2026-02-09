# API Reference

Welcome to the SciNotebook API documentation. The library is divided into several specialized packages, each handling a specific part of the notebook lifecycle.

## Packages

### [Core API](/api/core)
The fundamental data models and the `EditorEngine` for state management, history, and events.

### [Renderer API](/api/renderer)
The extensible rendering pipeline that transforms Markdown and custom cell types into HTML.

### [React API](/api/react)
High-level React components and hooks for building interactive notebook UIs.

### [Plugin System](/api/plugins)
Guidelines and interfaces for extending the engine with custom behaviors and cell types.

---

## Architecture Overview

SciNotebook follows a unidirectional data flow pattern:

1. **User Interaction**: Triggers a command in the `EditorEngine`.
2. **State Mutation**: The engine updates the internal immutable `Notebook` state.
3. **Event Emission**: The engine emits a `notebook:updated` event.
4. **Reactive Update**: React hooks (`useNotebook`) catch the event and trigger a re-render.
5. **Rendering Pipeline**: The `RenderPipeline` processes the updated cells (utilizing caching) to generate the final HTML.
