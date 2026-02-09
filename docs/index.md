---
layout: home

hero:
  name: SciNotebook
  text: El Editor Científico de Notebooks Más Completo
  tagline: Framework-agnostic · Open Source · Zero-server · Plugin-first · 6 tipos de celda · Editor visual de fórmulas
  image:
    src: /logo.svg
    alt: SciNotebook Logo
  actions:
    - theme: brand
      text: Playground
      link: /examples/playground
    - theme: alt
      text: Quick Start
      link: /examples/basic-usage
    - theme: alt
      text: Full App Demo
      link: /example/
    - theme: alt
      text: Estudio Competitivo
      link: /COMPETITIVE_STUDY

features:
  - title: Editor Visual de Fórmulas
    details: 100+ bloques pre-armados en 9 categorías (fracciones, integrales, matrices, griegos, operadores). Preview en tiempo real con KaTeX. Modo dual visual/raw.
    icon: ∑
  - title: 6 Tipos de Celda
    details: Markdown con toolbar flotante, Code, LaTeX con editor visual, Image con drag & drop, Embed con presets (YouTube, Desmos, CodePen), Raw.
    icon: 📝
  - title: UX Moderna
    details: Click-to-edit, toolbar flotante contextual, insert handles entre celdas, animaciones suaves, temas light/dark, keyboard-first.
    icon: ✨
  - title: Zero-Server
    details: 100% TypeScript, funciona offline sin backend. Core ~25KB, React adapter ~54KB. Arranque instantáneo sin kernel ni compilación.
    icon: ⚡
  - title: Plugin System
    details: Cada feature es un plugin opt-in. Extensible en cada capa — custom cell types, renderers, toolbar actions, keybindings, AI providers.
    icon: 🔌
  - title: Framework Agnostic
    details: Core puro TypeScript sin dependencias de framework. Adapter React listo. Arquitectura preparada para Vue, Svelte, Solid, Vanilla JS.
    icon: ⚛️
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #4a9eff 0%, #6366f1 50%, #a855f7 100%);
}
</style>
