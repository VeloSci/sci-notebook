---
layout: home

hero:
  name: SciNotebook
  text: The Most Complete Scientific Notebook Editor
  tagline: Framework-agnostic · Open Source · Zero-server · Plugin-first · 8 cell types · Visual formula editor · 4 framework adapters
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
      text: Competitive Study
      link: /COMPETITIVE_STUDY

features:
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><text x="8" y="48" font-family="serif" font-size="48" font-weight="bold" fill="url(#g1)">∑</text></svg>'
    title: Visual Formula Editor
    details: 100+ pre-built blocks across 9 categories (fractions, integrals, matrices, Greek letters, operators). Real-time KaTeX preview. Dual visual/raw mode.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><rect x="8" y="6" width="48" height="52" rx="6" stroke="url(#g2)" stroke-width="3"/><line x1="16" y1="18" x2="48" y2="18" stroke="url(#g2)" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="28" x2="42" y2="28" stroke="url(#g2)" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="38" x2="36" y2="38" stroke="url(#g2)" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="48" x2="44" y2="48" stroke="url(#g2)" stroke-width="2.5" stroke-linecap="round"/></svg>'
    title: 8 Cell Types
    details: Markdown with floating toolbar, Code (30+ languages), LaTeX with visual editor, Image (drag & drop, resize), Table (interactive), Mermaid diagrams, Embed (YouTube, Desmos), Raw.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><circle cx="32" cy="32" r="24" stroke="url(#g3)" stroke-width="3"/><path d="M22 32l6 6 14-14" stroke="url(#g3)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="14" r="6" fill="url(#g3)" opacity="0.6"/><path d="M48 12l4 4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M52 12l-4 4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>'
    title: Modern UX
    details: Click-to-edit, contextual floating toolbar, insert handles between cells, smooth animations, light/dark themes, keyboard-first navigation.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><path d="M32 8l4 16h-8l4-16z" fill="url(#g4)"/><path d="M32 56l-4-16h8l-4 16z" fill="url(#g4)"/><path d="M32 20v24" stroke="url(#g4)" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="22" stroke="url(#g4)" stroke-width="2.5" stroke-dasharray="6 4"/></svg>'
    title: Zero-Server
    details: 100% TypeScript, works offline with no backend. Core ~45KB, React adapter ~80KB. Instant startup with no kernel or compilation.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><rect x="12" y="20" width="40" height="24" rx="12" stroke="url(#g5)" stroke-width="3"/><circle cx="24" cy="32" r="6" fill="url(#g5)" opacity="0.3"/><circle cx="40" cy="32" r="6" fill="url(#g5)"/><path d="M8 32h4M52 32h4" stroke="url(#g5)" stroke-width="3" stroke-linecap="round"/><path d="M32 8v8M32 48v8" stroke="url(#g5)" stroke-width="2" stroke-linecap="round" opacity="0.5"/></svg>'
    title: Plugin System
    details: Every feature is an opt-in plugin. Extensible at every layer — custom cell types, renderers, toolbar actions, keybindings, export formats.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><ellipse cx="32" cy="32" rx="26" ry="10" stroke="url(#g6)" stroke-width="2.5" transform="rotate(0 32 32)"/><ellipse cx="32" cy="32" rx="26" ry="10" stroke="url(#g6)" stroke-width="2.5" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="26" ry="10" stroke="url(#g6)" stroke-width="2.5" transform="rotate(-60 32 32)"/><circle cx="32" cy="32" r="5" fill="url(#g6)"/></svg>'
    title: Framework Agnostic
    details: Pure TypeScript core with zero framework dependencies. Adapters ready for React 18+, Vue 3+, Svelte 5+, and Vanilla JS. 12 packages in the ecosystem.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><rect x="8" y="12" width="48" height="36" rx="4" stroke="url(#g7)" stroke-width="3"/><path d="M8 22h48" stroke="url(#g7)" stroke-width="2"/><circle cx="14" cy="17" r="2" fill="#ef4444"/><circle cx="22" cy="17" r="2" fill="#f59e0b"/><circle cx="30" cy="17" r="2" fill="#22c55e"/><path d="M20 52h24" stroke="url(#g7)" stroke-width="3" stroke-linecap="round"/><path d="M32 48v4" stroke="url(#g7)" stroke-width="3" stroke-linecap="round"/></svg>'
    title: Presentation Mode
    details: Turn any notebook into a slideshow. 3 split modes (cell, heading, manual), keyboard navigation, transitions, auto-advance, fullscreen support.
  - icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#8b5cf6"/><stop offset="100%" style="stop-color:#6366f1"/></linearGradient></defs><path d="M16 8h24l12 12v36a4 4 0 01-4 4H16a4 4 0 01-4-4V12a4 4 0 014-4z" stroke="url(#g8)" stroke-width="3" stroke-linejoin="round"/><path d="M40 8v12h12" stroke="url(#g8)" stroke-width="3" stroke-linejoin="round"/><path d="M22 32h20M22 40h14M22 48h18" stroke="url(#g8)" stroke-width="2" stroke-linecap="round" opacity="0.6"/><path d="M30 22l4-4 4 4" stroke="url(#g8)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    title: Export
    details: PDF/DOCX export plugin with proper tables, LaTeX, and diagrams. Version history with git-like line-level diffing.
---

<script setup>
import { sampleNotebookData } from './.vitepress/theme/notebooks'
</script>

<div class="vp-doc">
  <h2 style="text-align: center; margin-top: 4rem; border: none;">Try it in your Framework</h2>
  <FrameworkDemo :notebook="sampleNotebookData" title="Live Ecosystem Demo" />
</div>
