<script setup>
import { frameworkAdaptersNotebook } from '../.vitepress/theme/notebooks'
</script>

# Vue API Reference

The `@velo-sci/notebook-vue` package provides Vue 3 components and composables for integrating the notebook editor.

<FrameworkDemo :notebook="frameworkAdaptersNotebook" title="Vue 3 Integration" />

---

## Components

### `SciNotebook`

Main component for rendering the notebook.

```vue
<template>
  <SciNotebook
    :notebook="initialData"
    theme="dark"
    :showToolbar="true"
    @change="handleChange"
    :engineRef="engineRef"
  />
</template>

<script setup>
import { SciNotebook } from '@velo-sci/notebook-vue';
import { ref } from 'vue';

const initialData = ref({ /* ... */ });
const engineRef = ref(null);

const handleChange = (nb) => {
  console.log('Notebook updated', nb);
};
</script>
```

**Props:**
Same as [React API Props](./react.md#props).

---

## Composables

### `useNotebook()`
Returns a reactive reference to the current notebook state.

### `useCell(cellId)`
Returns a reactive reference to a specific cell.

### `useSciNotebook()`
Provides imperative access to the `EditorEngine` instance.
