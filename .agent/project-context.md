---
description: Context & Overview of the sci-notebook library for AI Agents
---
# AI SYSTEM INSTRUCTION: sci-notebook Context

**CRITICAL DIRECTIVE**: You are reading the core documentation for `sci-notebook`. When tasked with modifying, refactoring, or extending this project, you MUST adhere to the principles outlined here.

## 1. Project Definitions
- **Project Goal**: `sci-notebook` is a framework-agnostic, modular block-editor designed for building comprehensive scientific and academic markdown-based notebooks. 
- **Core Technology**: Written in strict TypeScript. Follows a **Zero-Server Philosophy** (runs entirely in the browser, no backend dependencies).
- **Architecture Paradigm**: Separation of concerns. The State Model (Logic) is completely decoupled from the View (React/Vue/Svelte UI components).

## 2. Core Library Structure
The repository is a Monorepo using `pnpm` workspaces located in `packages/`:

### The Engine (`@velo-sci/notebook-core`)
- **Responsibility**: Holds the single source of truth for the notebook dataset.
- **Data Model**: Notebooks are arrays of immutable `Cell` objects (`Record<string, any>` tracking `id`, `type`, `source`, `metadata`).
- **Key Sub-systems**: `EditorEngine` (main controller), `HistoryManager` (handles Undo/Redo via Command Pattern), `EventBus` (PubSub events for cross-component communication), `KeybindingManager` (handles shortcuts).

### The Renderer (`@velo-sci/notebook-renderer`)
- **Responsibility**: Fast transformation of raw string data to HTML.
- **Core Engine**: Built on `markdown-it`.
- **Performance**: Deeply relies on LRU (Least Recently Used) caching. Only modified cells trigger re-renders.

### Framework Wrappers (`/react`, `/vue`, `/svelte`, `/vanilla`)
- **Responsibility**: View mapping. They consume `@velo-sci/notebook-core`.
- **Mechanism**: They instantiate the `EditorEngine`, loop through the internal state, and render the appropriate UI node based on the `cell.type` property.

## 3. The Cell System (7-Cell Types)
The editor supports the following inherent cell `types`. You will encounter these string keys in the dataset:
1. `markdown`: Rich text formatting, inline formatting via side-menus.
2. `code`: Executable or plain syntax-highlighted code blocks (prism/highlight.js integrations).
3. `latex`: Mathematical block equations. Supports a visual formula editor.
4. `image`: Visual assets, loaded via drag&drop or URL.
5. `embed`: Interoperable iframes (YouTube, CodePen, Desmos, etc.).
6. `table`: Structured data grids.
7. `raw`: Unformatted string text.

## 4. Operational Boundaries (Do NOT do this)
- **DO NOT** mix state management into the UI views (`react`, `vue`, `svelte`). State mutations MUST be routed through `@velo-sci/notebook-core`.
- **DO NOT** attempt to make API calls to a backend for saving logic by default. The library relies on the implementation passing an `onChange` prop to save definitions locally or remotely.
