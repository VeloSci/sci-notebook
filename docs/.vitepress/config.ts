import { defineConfig } from 'vitepress'
import { resolve } from 'path'

export default defineConfig({
  title: 'SciNotebook',
  description: 'Interactive scientific notebook engine for the modern web',
  base: '/sci-notebook/',
  outDir: './dist',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/sci-notebook/favicon.ico' }]
  ],
  markdown: {
    math: true
  },
  vite: {
    resolve: {
      alias: [
        { find: '@velo-sci/notebook-core', replacement: resolve(__dirname, '../../packages/core/src/index.ts') },
        { find: '@velo-sci/notebook-react', replacement: resolve(__dirname, '../../packages/react/src/index.ts') },
        { find: '@velo-sci/notebook-renderer', replacement: resolve(__dirname, '../../packages/renderer/src/index.ts') }
      ]
    },
    server: {
      proxy: {
        '/sci-notebook/example': {
          target: 'http://localhost:5174',
          changeOrigin: true,
        }
      }
    }
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/overview' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/basic-usage' },
      { text: 'Full Demo', link: '/example/', target: '_blank' },
      { text: 'Roadmap', link: '/roadmap' }
    ],
    logo: '/sci-notebook/logo.svg',
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Overview', link: '/guide/overview' },
            { text: 'Data Model', link: '/guide/data-model' },
            { text: 'Editor Engine', link: '/guide/editor-engine' },
          ]
        },
        {
          text: 'Core Features',
          items: [
            { text: 'Cell Types', link: '/guide/cell-types' },
            { text: 'Visual Formula Editor', link: '/guide/math-editor' },
            { text: 'Rendering Pipeline', link: '/guide/rendering-pipeline' },
            { text: 'Plugin System', link: '/guide/plugin-system' },
            { text: 'LaTeX & Mermaid', link: '/guide/latex-mermaid' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Framework Adapters', link: '/guide/framework-adapters' },
            { text: 'Presentation Mode', link: '/guide/presentation-mode' },
            { text: 'Mobile & Touch', link: '/guide/mobile-support' },
            { text: 'Export (PDF/DOCX)', link: '/guide/export-plugins' },
            { text: 'Performance', link: '/guide/performance' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Core API', link: '/api/core' },
            { text: 'Renderer API', link: '/api/renderer' },
            { text: 'React API', link: '/api/react' },
            { text: 'Plugin System', link: '/api/plugins' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Live Examples',
          items: [
            { text: 'Interactive Playground', link: '/examples/playground' },
            { text: 'Basic Usage', link: '/examples/basic-usage' },
            { text: 'Theming & Layout', link: '/examples/theming' },
            { text: 'Plugin Integration', link: '/examples/plugins' },
          ]
        }
      ]
    },
    footer: {
      message: 'Integrated under the Sci DNA / VeloSci Ecosystem',
      copyright: '© 2026 VeloSci Instrumentation Services'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/VeloSci/sci-notebook' }
    ]
  }
})
