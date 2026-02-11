<script setup>
import { onMounted, ref, onBeforeUnmount, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  /** Notebook data object */
  notebook: {
    type: Object,
    required: true
  },
  /** Title shown in the chrome header */
  title: {
    type: String,
    default: 'Interactive Documentation'
  },
  /** Max height with scroll, or 'auto' for full height */
  maxHeight: {
    type: String,
    default: 'auto'
  }
})

const container = ref(null)
const { isDark } = useData()
let root = null
let currentTheme = isDark.value ? 'dark' : 'light'
let libsLoaded = false

/**
 * Load KaTeX and Mermaid globally so the RenderPipeline can use them.
 * These are loaded once and cached on globalThis.
 */
async function ensureLibsLoaded() {
  if (libsLoaded) return

  // Load KaTeX
  if (!globalThis.katex) {
    try {
      const katexModule = await import('katex')
      globalThis.katex = katexModule.default || katexModule

      // Load KaTeX CSS
      if (!document.querySelector('link[href*="katex"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }
    } catch (e) {
      console.warn('[InteractiveDoc] KaTeX not available:', e)
    }
  }

  // Load Mermaid
  if (!globalThis.mermaid || typeof globalThis.mermaid.render !== 'function') {
    try {
      const mermaidModule = await import('mermaid')
      // ESM default export unwrapping — may be nested
      let mermaid = mermaidModule.default || mermaidModule
      if (mermaid.default) mermaid = mermaid.default
      if (typeof mermaid.initialize === 'function') {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark.value ? 'dark' : 'default',
          securityLevel: 'loose',
        })
        globalThis.mermaid = mermaid
      } else {
        console.warn('[InteractiveDoc] Mermaid loaded but missing .initialize')
      }
    } catch (e) {
      console.warn('[InteractiveDoc] Mermaid not available:', e)
    }
  }

  libsLoaded = true
}

async function mountNotebook() {
  if (!container.value) return

  // Ensure KaTeX and Mermaid are loaded before rendering
  await ensureLibsLoaded()

  const React = await import('react')
  const { createRoot } = await import('react-dom/client')
  const { SciNotebook } = await import('@velo-sci/notebook-react')

  if (root) {
    root.unmount()
  }

  root = createRoot(container.value)
  currentTheme = isDark.value ? 'dark' : 'light'

  // Update mermaid theme if loaded
  if (globalThis.mermaid) {
    try {
      globalThis.mermaid.initialize({
        startOnLoad: false,
        theme: currentTheme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
      })
    } catch {}
  }

  root.render(
    React.createElement(SciNotebook, {
      notebook: JSON.parse(JSON.stringify(props.notebook)),
      theme: currentTheme,
      readOnly: true,
      showToolbar: false,
      showTOC: false,
      className: 'interactive-doc-notebook'
    })
  )
}

onMounted(() => {
  mountNotebook()
})

watch(isDark, () => {
  mountNotebook()
})

onBeforeUnmount(() => {
  if (root) {
    root.unmount()
    root = null
  }
})
</script>

<template>
  <div class="interactive-doc-wrapper" :class="{ 'interactive-doc--scrollable': maxHeight !== 'auto' }" :style="maxHeight !== 'auto' ? { '--doc-max-height': maxHeight } : {}">
    <div class="interactive-doc-chrome">
      <div class="chrome-dots">
        <span class="dot dot--red"></span>
        <span class="dot dot--yellow"></span>
        <span class="dot dot--green"></span>
      </div>
      <div class="chrome-title">{{ title }}</div>
      <div class="chrome-badge">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M7 1v12M1 7h12" stroke-linecap="round"/>
        </svg>
        Read-Only Notebook
      </div>
    </div>
    <div ref="container" class="interactive-doc-container"></div>
  </div>
</template>

<style scoped>
.interactive-doc-wrapper {
  margin: 2rem 0; border-radius: 16px; overflow: hidden;
  border: 1px solid var(--sci-glass-border); background: var(--sci-surface-2);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.03), 0 20px 50px -12px rgba(0,0,0,0.15);
}
.interactive-doc--scrollable .interactive-doc-container {
  max-height: var(--doc-max-height, 600px); overflow-y: auto; scrollbar-width: thin;
}
.interactive-doc-chrome {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.65rem 1rem; background: var(--sci-surface-3);
  border-bottom: 1px solid var(--sci-glass-border); user-select: none;
}
.chrome-dots { display: flex; gap: 6px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot--red { background: #ff5f56; }
.dot--yellow { background: #ffbd2e; }
.dot--green { background: #27c93f; }
.chrome-title {
  flex: 1; font-size: 0.78rem; font-weight: 600;
  color: var(--sci-text-secondary); text-transform: uppercase; letter-spacing: 0.08em;
}
.chrome-badge {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.7rem; font-weight: 600; color: var(--vp-c-brand);
  background: rgba(139, 92, 246, 0.08); padding: 0.2rem 0.6rem;
  border-radius: 20px; letter-spacing: 0.03em;
}
.interactive-doc-container { padding: 0.25rem; min-height: 200px; }

/* Override notebook styles for docs embedding */
:deep(.interactive-doc-notebook) {
  background: transparent !important;
  padding: 0.5rem 0.75rem !important;
}

:deep(.interactive-doc-notebook .sci-nb-cell),
:deep(.interactive-doc-notebook .sci-nb-cell-badge),
:deep(.interactive-doc-notebook .sci-nb-cell-content) {
  cursor: default !important;
}

:deep(.interactive-doc-notebook .sci-nb-cell:hover) { transform: none !important; }

:deep(.interactive-doc-notebook .sci-nb-cell-badge) { pointer-events: none; }

:deep(.interactive-doc-notebook .sci-nb-cell-handle),
:deep(.interactive-doc-notebook .sci-nb-cell-actions),
:deep(.interactive-doc-notebook .sci-nb-cell-gutter),
:deep(.interactive-doc-notebook .sci-nb-add-cell),
:deep(.interactive-doc-notebook .sci-nb-insert-handle) {
  display: none !important;
}
/* Collapse grid to badge + content since gutter/actions are hidden */
:deep(.interactive-doc-notebook .sci-nb-cell) {
  grid-template-columns: auto 1fr !important;
}
/* Center LaTeX formulas */
:deep(.interactive-doc-notebook .sci-nb-cell--latex .sci-nb-cell-content) {
  text-align: center;
}
:deep(.interactive-doc-notebook .katex-display) { margin: 0; }
/* Code and table styling in docs context */
:deep(.interactive-doc-notebook .sci-nb-preview pre) {
  background: var(--sci-code-bg) !important;
  border: 1px solid var(--sci-glass-border);
  border-radius: 8px; padding: 1rem;
  overflow-x: auto; font-size: 0.85rem;
}
:deep(.interactive-doc-notebook .sci-nb-preview pre code) {
  background: transparent !important; padding: 0 !important; color: inherit !important;
}
:deep(.interactive-doc-notebook .sci-nb-preview table) {
  width: 100%; border-collapse: collapse; margin: 0.5rem 0;
}
:deep(.interactive-doc-notebook .sci-nb-preview th),
:deep(.interactive-doc-notebook .sci-nb-preview td) {
  border: 1px solid var(--sci-border); padding: 0.5rem 0.75rem; text-align: left;
}
:deep(.interactive-doc-notebook .sci-nb-preview th) {
  background: var(--sci-surface-3); font-weight: 600;
}
</style>
