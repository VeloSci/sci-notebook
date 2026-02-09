import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@sci-notebook/core': path.resolve(__dirname, '../core/src'),
      '@sci-notebook/renderer': path.resolve(__dirname, '../renderer/src'),
      '@sci-notebook/react': path.resolve(__dirname, '../react/src'),
    },
  },
})
