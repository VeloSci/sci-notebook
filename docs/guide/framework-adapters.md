<script setup>
import { frameworkAdaptersNotebook } from '../.vitepress/theme/notebooks'
</script>

# Framework Adapters

Sci-Notebook is designed from the ground up to be framework-agnostic. While the core engine is pure TypeScript, we provide official adapters for the most popular web frameworks.

## Choose your Framework

<FrameworkDemo :notebook="frameworkAdaptersNotebook" />

### Support Matrix

| Framework | Status | Package |
|-----------|--------|---------|
| **React** | Stable | `@velo-sci/notebook-react` |
| **Vue 3** | Stable | `@velo-sci/notebook-vue` |
| **Svelte**| Stable | `@velo-sci/notebook-svelte` |
| **Vanilla**| Stable | `@velo-sci/notebook-vanilla` |

---

## Which one should I use?

- **React**: Best for complex web applications with rich ecosystems.
- **Vue**: Ideal for progressive enhancement and clean templates.
- **Svelte**: Perfect for performance-critical scientific tools.
- **Vanilla**: The ultimate choice for any environment without framework lock-in.

