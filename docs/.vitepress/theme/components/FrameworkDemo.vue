<script setup>
import { onMounted, ref, onBeforeUnmount, watch } from 'vue'
import { useData } from 'vitepress'

const props = defineProps({
  notebook: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: 'Framework Integration'
  }
})

const currentFramework = ref('react')
const container = ref(null)
const { isDark } = useData()
const exporting = ref('')

let currentInstance = null
let currentRoot = null
let currentEngine = null
let libsLoaded = false

async function handleExport(format) {
  if (!currentEngine || exporting.value) return
  exporting.value = format
  try {
    const nb = currentEngine.getNotebook()
    if (format === 'pdf') {
      const { exportToPDF } = await import('@velo-sci/notebook-plugin-export')
      await exportToPDF(nb)
    } else if (format === 'docx') {
      const { exportToDOCX, downloadDOCX } = await import('@velo-sci/notebook-plugin-export')
      const result = await exportToDOCX(nb)
      downloadDOCX(result)
    }
  } catch (e) {
    console.error(`[FrameworkDemo] Export ${format} failed:`, e)
  } finally {
    exporting.value = ''
  }
}

// Tab options
const FRAMEWORKS = [
  { id: 'react', label: 'React 18+', icon: '⚛️' },
  { id: 'vue', label: 'Vue 3+', icon: '🖖' },
  { id: 'svelte', label: 'Svelte 5+', icon: '🔥' },
  { id: 'vanilla', label: 'Vanilla JS', icon: '🍦' }
]

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
      console.warn('[FrameworkDemo] KaTeX not available:', e)
    }
  }

  // Load Mermaid
  if (!globalThis.mermaid || typeof globalThis.mermaid.render !== 'function') {
    try {
      const mermaidModule = await import('mermaid')
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
        console.warn('[FrameworkDemo] Mermaid loaded but missing .initialize')
      }
    } catch (e) {
      console.warn('[FrameworkDemo] Mermaid not available:', e)
    }
  }

  libsLoaded = true
}

async function mountFramework(framework) {
  if (!container.value) return

  // Ensure KaTeX and Mermaid are loaded before rendering
  await ensureLibsLoaded()

  // Cleanup previous instance
  if (currentInstance && typeof currentInstance.destroy === 'function') {
    currentInstance.destroy()
  }
  if (currentRoot) {
    currentRoot.unmount()
    currentRoot = null
  }
  container.value.innerHTML = ''
  container.value.className = 'framework-demo-container'
  currentInstance = null

  const theme = isDark.value ? 'dark' : 'light'
  const notebookData = JSON.parse(JSON.stringify(props.notebook))

  // Update mermaid theme if loaded
  if (globalThis.mermaid && typeof globalThis.mermaid.initialize === 'function') {
    try {
      globalThis.mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
      })
    } catch {}
  }

  switch (framework) {
    case 'react': {
      const React = await import('react')
      const { createRoot } = await import('react-dom/client')
      const { SciNotebook } = await import('@velo-sci/notebook-react')
      currentRoot = createRoot(container.value)
      let engineRef = null
      currentRoot.render(
        React.createElement(SciNotebook, {
          notebook: notebookData,
          theme,
          showToolbar: true,
          className: 'framework-demo-notebook',
          onReady: (engine) => { engineRef = engine; currentEngine = engine }
        })
      )
      // Fallback: try to get engine from the instance after a tick
      if (!engineRef) {
        await new Promise(r => setTimeout(r, 100))
      }
      break
    }
    case 'vue': {
      const { createApp, h } = await import('vue')
      const { SciNotebook } = await import('@velo-sci/notebook-vue')
      const app = createApp({
        render: () => h(SciNotebook, {
          notebook: notebookData,
          theme,
          showToolbar: true,
          onReady: (engine) => { currentEngine = engine }
        })
      })
      currentInstance = { destroy: () => app.unmount() }
      app.mount(container.value)
      break
    }
    case 'svelte': {
      const { SciNotebookSvelte } = await import('@velo-sci/notebook-svelte')
      currentInstance = new SciNotebookSvelte({
        target: container.value,
        notebook: notebookData,
        theme,
        showToolbar: true
      })
      currentEngine = currentInstance.getEngine()
      break
    }
    case 'vanilla': {
      const { SciNotebookVanilla } = await import('@velo-sci/notebook-vanilla')
      currentInstance = new SciNotebookVanilla({
        target: container.value,
        notebook: notebookData,
        theme,
        showToolbar: true
      })
      currentEngine = currentInstance.getEngine()
      break
    }
  }
}

onMounted(() => {
  mountFramework(currentFramework.value)
})

watch([currentFramework, isDark], () => {
  mountFramework(currentFramework.value)
})

onBeforeUnmount(() => {
  if (currentInstance && typeof currentInstance.destroy === 'function') {
    currentInstance.destroy()
  }
  if (currentRoot) {
    currentRoot.unmount()
  }
})
</script>

<template>
  <div class="framework-demo-wrapper">
    <div class="framework-demo-header">
      <div class="demo-title">{{ title }}</div>
      <div class="demo-actions">
        <button class="export-btn" :disabled="!!exporting" @click="handleExport('pdf')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12.5h8M7 1.5v8M7 9.5l-3-3M7 9.5l3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ exporting === 'pdf' ? 'Exporting...' : 'PDF' }}
        </button>
      </div>
      <div class="framework-tabs">
        <button 
          v-for="fw in FRAMEWORKS" 
          :key="fw.id"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentFramework === fw.id }"
          @click="currentFramework = fw.id"
        >
          <span class="tab-icon">{{ fw.icon }}</span>
          <span class="tab-label">{{ fw.label }}</span>
        </button>
      </div>
    </div>
    <div ref="container" class="framework-demo-container"></div>
  </div>
</template>

<style scoped>
.framework-demo-wrapper {
  margin: 2rem 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--sci-glass-border);
  background: var(--sci-surface-2);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.framework-demo-header {
  padding: 1rem;
  background: var(--sci-surface-3);
  border-bottom: 1px solid var(--sci-glass-border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
}

.demo-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--sci-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.framework-tabs {
  display: flex;
  background: var(--sci-surface-1);
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
  border: 1px solid var(--sci-glass-border);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--sci-text-secondary);
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--sci-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn--active {
  background: var(--vp-c-brand) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.demo-actions {
  display: flex;
  gap: 6px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sci-text-primary);
  background: var(--sci-surface-1);
  border: 1px solid var(--sci-glass-border);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.export-btn:hover:not(:disabled) {
  background: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.framework-demo-container {
  min-height: 500px;
}

:deep(.sci-nb) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* Tables should fill the full cell width */
:deep(.sci-nb-rendered-table) {
  width: 100% !important;
}

/* Mermaid diagrams: auto-height, no fixed small height */
:deep(.sci-nb-mermaid-preview) {
  min-height: 80px;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

:deep(.sci-nb-mermaid-preview svg) {
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
}
</style>
