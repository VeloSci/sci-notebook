---
layout: doc
title: Plugin Integration Example
outline: false
pageClass: full-width-page
---


# Plugin Integration Example

This example demonstrates how to create and register a custom plugin to extend the notebook's functionality.

## Creating a Plugin

A plugin can add new cell types, modify the rendering pipeline, or listen to engine events.

```typescript
// word-counter-plugin.ts
import { SciNotebookPlugin, PluginContext } from '@velo-sci/notebook-core';

export const wordCounterPlugin: SciNotebookPlugin = {
  id: 'word-counter',
  name: 'Word Counter',
  version: '1.0.0',
  setup(ctx: PluginContext) {
    // Listen to cell updates
    ctx.on('cell:updated', (payload) => {
      const cell = ctx.getCell(payload.data.cellId);
      if (!cell) return;
      const words = cell.source.split(/\s+/).filter(Boolean).length;
      ctx.log.info(`Cell ${cell.id} now has ${words} words`);
    });

    // Listen to notebook-level changes for total count
    ctx.on('notebook:updated', () => {
      const notebook = ctx.getNotebook();
      let totalWords = 0;
      notebook.cells.forEach(cell => {
        totalWords += cell.source.split(/\s+/).filter(Boolean).length;
      });
      ctx.log.info(`Total words in notebook: ${totalWords}`);
    });
  }
};
```

## Registering the Plugin

You can register plugins either via the `config` option at creation time, or imperatively after creation.

```tsx
import React, { useMemo } from 'react';
import { createNotebook } from '@velo-sci/notebook-core';
import { SciNotebook } from '@velo-sci/notebook-react';
import '@velo-sci/notebook-core/styles/index.css';
import { wordCounterPlugin } from './word-counter-plugin';

// Option A: Register via config (recommended)
export const MyNotebookApp = () => {
  const engine = useMemo(() => {
    return createNotebook({
      notebook: initialData,
      config: { plugins: [wordCounterPlugin] },
    });
  }, []);

  return <SciNotebook engine={engine} />;
};

// Option B: Register imperatively
export const MyNotebookAppB = () => {
  const engine = useMemo(() => {
    const eng = createNotebook({ notebook: initialData });
    eng.registerPlugin(wordCounterPlugin);
    return eng;
  }, []);

  return <SciNotebook engine={engine} />;
};
```

## Advanced Extension: Custom Rendering

Plugins can hook into the rendering pipeline to add custom behaviors like syntax highlighting for new languages or auto-linking.

```typescript
setup(ctx: PluginContext) {
  // Postprocessor: modify the final HTML output
  ctx.addPostprocessor((html: string, cell: Cell) => {
    return html.replace(/TODO/g, '<span class="todo-badge">TODO</span>');
  }, 10); // Priority 10 (higher = runs first)

  // Preprocessor: modify raw source before parsing
  ctx.addPreprocessor((source: string, cell: Cell) => {
    // Auto-link URLs in markdown cells
    if (cell.type !== 'markdown') return source;
    return source.replace(
      /(https?:\/\/[^\s)]+)/g,
      '[$1]($1)'
    );
  });
}
```

Alternatively, you can declare rendering hooks directly in the plugin definition without using `setup()`:

```typescript
const todoBadgePlugin: SciNotebookPlugin = {
  id: 'todo-badge',
  name: 'TODO Badge',
  version: '1.0.0',
  rendering: {
    postprocess: (html, cell) => {
      return html.replace(/TODO/g, '<span class="todo-badge">TODO</span>');
    },
    priority: 10,
  }
};
```
