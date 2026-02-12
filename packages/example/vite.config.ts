import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: '/sci-notebook/example/',
  plugins: [react(), vue()],
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@velo-sci/notebook-core': path.resolve(__dirname, '../core/src'),
      '@velo-sci/notebook-renderer': path.resolve(__dirname, '../renderer/src'),
      '@velo-sci/notebook-react': path.resolve(__dirname, '../react/src'),
      '@velo-sci/notebook-vue': path.resolve(__dirname, '../vue/src'),
      '@velo-sci/notebook-svelte': path.resolve(__dirname, '../svelte/src'),
      '@velo-sci/notebook-vanilla': path.resolve(__dirname, '../vanilla/src'),
      '@example/shared': path.resolve(__dirname, '../../examples/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        react: path.resolve(__dirname, 'react/index.html'),
        vue: path.resolve(__dirname, 'vue/index.html'),
        svelte: path.resolve(__dirname, 'svelte/index.html'),
        vanilla: path.resolve(__dirname, 'vanilla/index.html'),
      },
    },
  },
})
