import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/sci-notebook/example-svelte/',
  server: {
    port: 5177,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@velo-sci/notebook-core': path.resolve(__dirname, '../../packages/core/src'),
      '@velo-sci/notebook-renderer': path.resolve(__dirname, '../../packages/renderer/src'),
      '@velo-sci/notebook-svelte': path.resolve(__dirname, '../../packages/svelte/src'),
    },
  },
})
