import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/sci-notebook/example/',
  plugins: [react()],
  resolve: {
    alias: {
      '@velo-sci/notebook-core': path.resolve(__dirname, '../core/src'),
      '@velo-sci/notebook-renderer': path.resolve(__dirname, '../renderer/src'),
      '@velo-sci/notebook-react': path.resolve(__dirname, '../react/src'),
    },
  },
})
