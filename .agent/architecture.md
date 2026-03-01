---
description: Architecture of the sci-notebook Core and Engine layers for AI Agents
---
# AI SYSTEM INSTRUCTION: sci-notebook Architecture

**CRITICAL DIRECTIVE**: This document defines the exact architecture patterns you must follow when contributing to `sci-notebook`. Do not invent new architectural patterns that bypass the `EditorEngine`.

## 1. The Core State Pipeline (`packages/core/src/EditorEngine.ts`)

The notebook data is strictly managed. You will interact with the `EditorEngine`.
- **State Changes**: When a user types or a cell is added, you do NOT mutate the array directly. 
- **The Command Pattern**: You dispatch Commands. A typical flow: User types 'A' -> UI calls `engine.updateCellSource(id, newText)` -> Engine creates an `UpdateCellCommand` -> Command executes and pushes to `HistoryManager` -> Engine emits `notebook:changed` on the EventBus.
- **EventBus (`event-bus.ts`)**: The lifeblood of the system. Side-effects (like popping open a formatting menu when text is selected) are triggerd by listening to `EventBus` events (e.g., `selection:changed`), NOT by React Context or Vue injects.

## 2. Framework UI Implementation Pattern

If you are writing code in `@velo-sci/notebook-react`, `@velo-sci/notebook-vue`, or `@velo-sci/notebook-svelte`:

- **Rule 1 (Init)**: The root wrapper component (e.g., `<SciNotebook />`) creates a single instance of `EditorEngine`.
- **Rule 2 (Reactivity)**: The wrapper subscribes to the `EventBus` (`engine.on('changed')`). When fired, it forces a frame re-render of the relevant list items.
- **Rule 3 (Cell Mapping)**: The wrapper iterates over `notebook.cells`. It uses a dictionary/map of `Renderers` (e.g., `{ markdown: MarkdownCellComponent, latex: LatexCellComponent }`). If `cell.type === 'latex'`, it mounts the `LatexCellComponent` passing the `cell` object and an `onChange` callback downward.

## 3. The Rendering Pipeline (`packages/renderer`)

When dealing with formatting text to HTML:
- The engine uses `markdown-it`.
- **AST Generation**: Source code is parsed to an Abstract Syntax Tree.
- **Caching**: Results are cached using the cell's `source` hash. 
- **AI Task Note**: If you are asked to support a new markdown syntax (like a custom admonition or specific tag), you must write a `markdown-it` plugin inside the `/renderer` package, NOT a React/Vue UI component to parse the string.

## 4. The Plugin Ecosystem (`packages/plugin-*`)

Functionality extending the core system exists as Plugins.
- **AI Integration (`plugin-ai`)**: Tracks document selections via EventBus, captures context (previous cell, current line), queries LLMs (OpenAI/Anthropic), and emits Ghost Text overlay events.
- **Export (`plugin-export`)**: Listens for export commands, retrieves the current State from `EditorEngine`, and serializes it to PDF, HTML, or `.sci` JSON definitions.

## 5. CSS Strategy

- **No CSS-in-JS**: You MUST use standard CSS (`packages/core/styles`).
- **CSS Variables**: All coloring, spacing, and theming rely heavily on global CSS custom properties (e.g., `var(--sci-bg-primary)`). Do not hardcode HEX or RGB values in UI component styles. Support dark mode inherently by utilizing these variables.
