<script setup>
import { frameworkAdaptersNotebook } from '../.vitepress/theme/notebooks'
</script>

# Svelte API Reference

The `@velo-sci/notebook-svelte` package provides Svelte 5+ components and runes for the notebook editor.

<FrameworkDemo :notebook="frameworkAdaptersNotebook" title="Svelte 5 Integration" />

---

## Usage (Svelte 5)

SciNotebook for Svelte is built using Svelte 5 runes for maximum performance and efficiency.

```svelte
<script>
  import { SciNotebookSvelte } from '@velo-sci/notebook-svelte';
  import { onMount } from 'svelte';

  let container;
  let notebook;

  onMount(() => {
    notebook = new SciNotebookSvelte({
      target: container,
      notebook: initialData,
      theme: 'light',
      onChange: (nb) => { console.log(nb); }
    });

    return () => notebook.destroy();
  });
</script>

<div bind:this={container}></div>
```

---

## Options

The `SciNotebookSvelte` constructor accepts an options object:

- `target`: The DOM element to mount the notebook.
- `notebook`: Initial notebook data.
- `theme`: "light" | "dark".
- `showToolbar`: boolean.
- `onChange`: Callback function for state updates.
