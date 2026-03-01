---
description: Customizing notebook functionalities via the Plugin Engine
---
# Action Plugins Architecture

`sci-notebook` supports an advanced Plugin Engine that hooks into the central EventBus before or after state changes occur. This allows features like AI Auto-completion or Auto-saving.

## The Plugin Interface
A plugin is just a class that receives the `EditorEngine` and mounts listeners.

```typescript
export interface NotebookPlugin {
   mount(engine: EditorEngine): void;
   unmount(): void;
}
```

## Example: AI Completion Plugin
```typescript
class AIPlugin implements NotebookPlugin {
    mount(engine) {
        engine.getEventBus().on('cell:focus', async (cellPayload) => {
            if (cellPayload.type === 'markdown') {
               const suggestion = await this.fetchLLMSuggestion(cellPayload.source);
               engine.dispatch({ type: 'UPDATE_CELL', id: cellPayload.id, source: suggestion });
            }
        });
    }
}
```
**Constraint**: Never modify `cellPayload.source` directly. Always use `engine.dispatch` to push an immutable change to the History Transaction Stack, ensuring Undo/Redo works flawlessly.
