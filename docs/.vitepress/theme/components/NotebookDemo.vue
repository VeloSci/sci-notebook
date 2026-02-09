<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { SciNotebook } from '@sci-notebook/react'

const props = defineProps({
  initialTitle: {
    type: String,
    default: 'Interactive Demo'
  },
  theme: {
    type: String,
    default: 'light'
  }
})

const container = ref(null)
let root = null

const initialNotebook = {
  id: 'demo-nb',
  title: props.initialTitle,
  cells: [
    {
      id: 'c1',
      type: 'markdown',
      source: '# Interactive Notebook\n\nYou can **double-click** this cell to edit the content and see it render in real-time.\n\n- Try adding a list\n- Or some `code` blocks!',
      metadata: {}
    },
    {
      id: 'c2',
      type: 'markdown',
      source: '### Second Cell\n\nClick the "+ Add Cell" button below to create more!',
      metadata: {}
    }
  ],
  metadata: {},
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

onMounted(() => {
  if (container.value) {
    root = createRoot(container.value)
    root.render(
      React.createElement(SciNotebook, {
        notebook: initialNotebook,
        theme: props.theme,
        className: 'docs-demo-notebook'
      })
    )
  }
})

onBeforeUnmount(() => {
  if (root) {
    root.unmount()
  }
})
</script>

<template>
  <div class="notebook-demo-wrapper">
    <div class="demo-header">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
      <span class="header-title">SciNotebook Interactive Playground</span>
    </div>
    <div ref="container" class="notebook-container"></div>
  </div>
</template>

<style scoped>
.notebook-demo-wrapper {
  margin: 2.5rem 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--sci-glass-border);
  background: var(--sci-surface-2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.demo-header {
  background: var(--sci-surface-3);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--sci-glass-border);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.red { background: #ff5f56; }
.yellow { background: #ffbd2e; }
.green { background: #27c93f; }

.header-title {
  margin-left: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--sci-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.notebook-container {
  min-height: 500px;
  padding: 0.5rem;
}

:deep(.docs-demo-notebook) {
  height: 500px;
}
</style>
