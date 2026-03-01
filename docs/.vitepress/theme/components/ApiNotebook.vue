<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useData } from 'vitepress'
import { SciNotebook } from '@velo-sci/notebook-vue'

const props = defineProps({
  notebook: {
    type: Object,
    required: true
  },
  title: {
    type: String,
    default: 'API Example'
  },
  readOnly: {
    type: Boolean,
    default: true
  },
  showToolbar: {
    type: Boolean,
    default: false
  },
  components: {
    type: Object,
    default: () => ({})
  },
  maxHeight: {
    type: String,
    default: 'auto'
  }
})

const { isDark } = useData()
const theme = computed(() => isDark.value ? 'dark' : 'light')

let libsLoaded = false

async function ensureLibsLoaded() {
  if (libsLoaded) return

  // Load KaTeX
  if (!globalThis.katex) {
    try {
      const katexModule = await import('katex')
      globalThis.katex = katexModule.default || katexModule

      if (!document.querySelector('link[href*="katex"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css'
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }
    } catch (e) {
      console.warn('[ApiNotebook] KaTeX not available:', e)
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
        console.warn('[ApiNotebook] Mermaid loaded but missing .initialize')
      }
    } catch (e) {
      console.warn('[ApiNotebook] Mermaid not available:', e)
    }
  }

  libsLoaded = true
}

onMounted(async () => {
  await ensureLibsLoaded()
})

watch(isDark, (dark) => {
  if (globalThis.mermaid && typeof globalThis.mermaid.initialize === 'function') {
    try {
      globalThis.mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'default',
        securityLevel: 'loose',
      })
    } catch {}
  }
})

// We use the notebook from props directly.
// In a real app we might want to clone it if we want to avoid mutating props,
// but for documentation demos, the SciNotebook component handles its own state
// once it initializes the engine if a notebook object is passed.
const notebookData = computed(() => props.notebook)
</script>

<template>
  <div class="api-notebook-wrapper" :style="{ maxHeight: maxHeight !== 'auto' ? maxHeight : 'none' }">
    <div class="api-notebook-chrome">
      <div class="chrome-dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="chrome-title">{{ title }}</div>
      <div class="chrome-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        {{ readOnly ? 'Reference' : 'Live' }}
      </div>
    </div>
    <div class="api-notebook-container">
      <SciNotebook 
        :notebook="notebookData"
        :theme="theme"
        :readOnly="readOnly"
        :showToolbar="showToolbar"
        :components="components"
        class="api-nb-instance"
      />
    </div>
  </div>
</template>

<style scoped>
.api-notebook-wrapper {
  margin: 1.5rem 0 2.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--sci-glass-border);
  background: var(--sci-surface-2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.api-notebook-chrome {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  background: var(--sci-surface-3);
  border-bottom: 1px solid var(--sci-glass-border);
  user-select: none;
}

.chrome-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.red { background: #ff5f56; }
.yellow { background: #ffbd2e; }
.green { background: #27c93f; }

.chrome-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--sci-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chrome-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--vp-c-brand);
  background: rgba(139, 92, 246, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.api-notebook-container {
  flex: 1;
  min-height: 200px;
  background: transparent;
}

/* Custom styles for embedded notebook in docs */
:deep(.api-nb-instance) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.sci-nb-cell) {
  margin-bottom: 0.5rem !important;
  border-radius: 8px !important;
}

:deep(.sci-nb-cell--view) {
  background: transparent !important;
  border: 1px solid transparent !important;
}

:deep(.sci-nb-cell--view:hover) {
  background: var(--sci-surface-3) !important;
  border-color: var(--sci-glass-border) !important;
}

:deep(.sci-nb-toolbar) {
  border-top: none !important;
  border-left: none !important;
  border-right: none !important;
  background: var(--sci-surface-1) !important;
}

/* Mermaid diagrams: auto-height, no fixed small height */
:deep(.sci-nb-mermaid-preview) {
  height: auto !important;
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.sci-nb-mermaid-preview svg) {
  max-width: 100%;
  height: auto !important;
}
</style>
