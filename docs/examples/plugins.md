# Plugin Integration Example

This example demonstrates how to create and register a custom plugin to extend the notebook's functionality.

## Creating a Plugin

A plugin can add new cell types, modify the rendering pipeline, or listen to engine events.

```typescript
// word-counter-plugin.ts
import { SciNotebookPlugin, PluginContext } from '@sci-notebook/core';

export const wordCounterPlugin: SciNotebookPlugin = {
  id: 'word-counter',
  name: 'Word Counter',
  version: '1.0.0',
  setup(ctx: PluginContext) {
    // Listen to notebook updates
    ctx.on('notebook:updated', (payload) => {
      const notebook = payload.data.notebook;
      let totalWords = 0;
      
      notebook.cells.forEach(cell => {
        totalWords += cell.source.split(/\s+/).filter(Boolean).length;
      });
      
      console.log(`[WordCounter] Total words in notebook: ${totalWords}`);
    });
  }
};
```

## Registering the Plugin

Register the plugin with the engine before passing it to the component.

```tsx
import React, { useMemo } from 'react';
import { EditorEngine, createNotebook } from '@sci-notebook/core';
import { SciNotebook } from '@sci-notebook/react';
import { wordCounterPlugin } from './word-counter-plugin';

export const MyNotebookApp = () => {
  const engine = useMemo(() => {
    const eng = createNotebook({ notebook: initialData });
    // Register the custom plugin
    eng.registerPlugin(wordCounterPlugin);
    return eng;
  }, []);

  return <SciNotebook engine={engine} />;
};
```

## Advanced Extension: Custom Rendering

Plugins can also hook into the rendering pipeline to add custom behaviors like syntax highlighting for new languages or auto-linking.

```typescript
setup(ctx) {
  ctx.addPostprocessor((html, cell) => {
    // Replace all instances of 'TODO' with a stylized badge
    return html.replace(/TODO/g, '<span class="todo-badge">TODO</span>');
  }, 10); // Priority 10
}
```
