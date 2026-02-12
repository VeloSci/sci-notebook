import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: '/sci-notebook/example-vue/',
  plugins: [vue()],
  server: {
    port: 5176,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@velo-sci/notebook-core': path.resolve(__dirname, '../../packages/core/src'),
      '@velo-sci/notebook-renderer': path.resolve(__dirname, '../../packages/renderer/src'),
      '@velo-sci/notebook-vue': path.resolve(__dirname, '../../packages/vue/src'),
    },
  },
})
