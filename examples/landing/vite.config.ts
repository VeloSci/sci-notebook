import { defineConfig } from 'vite'

export default defineConfig({
  base: '/sci-notebook/examples/',
  server: {
    port: 5179,
    strictPort: true,
  },
})
