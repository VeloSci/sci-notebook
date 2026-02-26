<script setup>
import { frameworkAdaptersNotebook } from '../.vitepress/theme/notebooks'
</script>

# Vanilla JS API Reference

The `@velo-sci/notebook-vanilla` package is a framework-agnostic wrapper that can be used in any environment.

<FrameworkDemo :notebook="frameworkAdaptersNotebook" title="Vanilla JS Integration" />

---

## Installation

```bash
npm install @velo-sci/notebook-vanilla
```

## Usage

```typescript
import { SciNotebookVanilla } from '@velo-sci/notebook-vanilla';
import '@velo-sci/notebook-core/styles/index.css';

const app = document.getElementById('app');

const notebook = new SciNotebookVanilla({
  target: app,
  notebook: myInitialData,
  theme: 'light',
  showToolbar: true,
  onChange: (updatedNotebook) => {
    console.log('Notebook changed:', updatedNotebook);
  }
});

// Imperative access to the engine
const engine = notebook.getEngine();
engine.insertCell(0, 'markdown', '# New Cell');

// Cleanup
// notebook.destroy();
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `target` | `HTMLElement` | — | Required hook for mounting |
| `notebook` | `Notebook` | — | Initial notebook state |
| `theme` | `string` | `"light"` | Visual theme |
| `showToolbar`| `boolean` | `true` | UI visibility |
| `onChange` | `Function` | — | Change listener |
