---
description: How the Framework UI wraps the Core Engine Model
---
# Framework Wrappers Architecture

Because `sci-notebook` is zero-server and framework-agnostic, the actual React/Vue components you import (e.g. `<SciNotebook>`) are very thin.

## The Data Flow
1. **Core Data**: You pass `notebook={data}`.
2. **Engine Init**: The Wrapper instantiates `new EditorEngine(data)`.
3. **Template Rendering**: The wrapper maps over `engine.getState().cells` and renders the specific UI block (e.g., `<MarkdownCell>`).
4. **Mutations**: When a user types in a UI block, the block triggers `onChange(newVal)`. The wrapper translates this to `engine.dispatch({ type: 'UPDATE_CELL', source: newVal })`.
5. **Upward Sync**: The Engine processes the dispatch, pushes to the history stack, and fires `notebook:changed`. The Wrapper listens to this and calls your prop `<SciNotebook onChange={(newNotebook) => save_to_db(newNotebook)} />`.

## State Duplication Warning
If you are writing custom cells, DO NOT create local React state for the input values (`useState(cell.source)`). You must treat the `cell.source` prop as the single source of truth, and `onChange` as the only mutator. If you duplicate the state locally, the global Undo/Redo stack will break.
