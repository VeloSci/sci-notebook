import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/sci-notebook/example-vanilla/',
  server: {
    port: 5178,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@velo-sci/notebook-core': path.resolve(__dirname, '../../packages/core/src'),
      '@velo-sci/notebook-renderer': path.resolve(__dirname, '../../packages/renderer/src'),
      '@velo-sci/notebook-vanilla': path.resolve(__dirname, '../../packages/vanilla/src'),
    },
  },
})
