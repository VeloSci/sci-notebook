import DefaultTheme from 'vitepress/theme'
import './style.css'
import '../../../packages/core/src/styles/index.css'
import { h } from 'vue'
import NotebookDemo from './components/NotebookDemo.vue'
import InteractiveDoc from './components/InteractiveDoc.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }: any) {
    app.component('NotebookDemo', NotebookDemo)
    app.component('InteractiveDoc', InteractiveDoc)
  }
}
