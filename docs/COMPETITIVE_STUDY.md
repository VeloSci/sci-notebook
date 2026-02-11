# Competitive Study — Scientific Editors and Notebooks

> Goal: identify the strengths and weaknesses of each competitor to build
> the best scientific notebook editor on the market.

---

## 1. Market Overview

| Product | Type | Open Source | Primary Focus |
|---------|------|-------------|---------------|
| **Jupyter Notebook/Lab** | Computational notebook | Yes | Code execution + visualization |
| **Notion** | Collaborative docs/wiki | No | General productivity, blocks |
| **Overleaf** | Online LaTeX editor | Partial | Academic LaTeX documents |
| **Mathcha** | Visual math editor | No | Formulas + diagrams WYSIWYG |
| **Observable** | Reactive notebook | Partial | Data visualization, JS |
| **Quarto** | Scientific publishing | Yes | Reproducible multi-language documents |
| **Typst** | Typesetting language | Yes | Modern alternative to LaTeX |
| **CoCalc** | Collaborative platform | Partial | Jupyter + LaTeX + terminal in the cloud |
| **Deepnote** | Collaborative notebook | No | Jupyter in the cloud + collaboration |
| **HackMD/CodiMD** | Collaborative Markdown | Yes | Real-time Markdown |

---

## 2. Detailed Analysis by Competitor

### 2.1 Jupyter Notebook / JupyterLab

**Strengths:**
- De facto standard for scientific computing
- Code execution in 100+ languages via kernels
- Massive extension ecosystem
- `.ipynb` format widely adopted
- Rich output: charts, tables, interactive widgets

**Weaknesses:**
- Outdated UX — text editing is clunky
- No WYSIWYG for Markdown (separate edit/preview)
- LaTeX only in preview, no visual formula editor
- No drag & drop to reorder cells (JupyterLab added it partially)
- No contextual floating toolbar
- Limited themes, manual CSS customization
- No real-time collaboration (JupyterLab has experimental extension)
- Slow startup (Python server + kernel)

**Opportunity for sci-notebook:**
- Modern UX with click-to-edit, floating toolbar, insert handles
- Visual formula editor that Jupyter doesn't have
- Instant startup (no server, pure frontend)
- Better mobile experience

---

### 2.2 Notion

**Strengths:**
- Exceptional UX — the gold standard in block editing
- Slash commands (`/`) to insert any block type
- Smooth drag & drop reordering
- Inline databases, tables, kanban, calendars
- Real-time collaboration
- Reusable templates
- Robust public API

**Weaknesses:**
- No native LaTeX support (only inline with `$$`, basic rendering)
- No code execution
- No visual formula editor (raw LaTeX only)
- Closed, proprietary, vendor lock-in
- No robust offline mode
- Slow formula rendering compared to native KaTeX
- No advanced syntax highlighting for code

**Opportunity for sci-notebook:**
- Adopt Notion's block UX but with a scientific focus
- Visual formula editor >>> what Notion offers
- Open source, no vendor lock-in
- Better code support with real syntax highlighting

---

### 2.3 Overleaf

**Strengths:**
- Market-leading collaborative LaTeX editor
- Real-time compilation with PDF preview
- Thousands of academic templates
- Integration with journals for direct submission
- Git sync, Dropbox sync
- Complete version history

**Weaknesses:**
- Steep learning curve (requires knowing LaTeX)
- No real WYSIWYG mode (the "rich text" is limited)
- No cells/blocks — it's a plain text editor
- No code execution
- No interactive embeds
- Slow for large documents
- Dated, non-modern interface

**Opportunity for sci-notebook:**
- Visual formula editor that eliminates the LaTeX barrier
- Cell-based structure more flexible than plain text
- Interactive embeds (charts, videos, iframes)
- Superior performance (no need to compile PDF)

---

### 2.4 Mathcha

**Strengths:**
- Most intuitive WYSIWYG math editor on the market
- Visual palette of symbols and structures
- Integrated diagrams (tikz-like)
- Export to LaTeX, PDF, image
- No need to know LaTeX to write formulas

**Weaknesses:**
- Only formulas and diagrams — not a complete notebook
- No code cells
- No Markdown
- No plugins or extensibility
- No programmatic API
- Closed, proprietary
- No real-time collaboration

**Opportunity for sci-notebook:**
- Combine Mathcha's formula UX with a complete notebook
- Our MathEditor already has a similar block palette
- Add: drag & drop formula blocks, real-time preview
- Extensible via plugins

---

### 2.5 Observable

**Strengths:**
- Reactive notebooks — cells update automatically
- First-class data visualization (D3, Plot)
- Notebook import between users
- Native JavaScript execution in the browser
- Active visualization community

**Weaknesses:**
- JavaScript only (no Python, R, etc.)
- No robust LaTeX support
- No visual formula editor
- Proprietary data model (not .ipynb)
- No offline mode
- Learning curve for the reactive model

**Opportunity for sci-notebook:**
- Multi-format support (Markdown + LaTeX + code + embeds)
- Visual formula editor
- Standard, portable JSON format
- Observable embeds as iframe

---

### 2.6 Quarto

**Strengths:**
- First-class scientific publishing
- Multi-language (Python, R, Julia, Observable JS)
- Output to HTML, PDF, Word, presentations, books
- Integration with Jupyter kernels
- Cross-references, citations, bibliography
- Extensible via Lua filters

**Weaknesses:**
- Not an editor — it's a build/publishing system
- Requires CLI + external editor (VS Code, RStudio)
- No interactive UX in the browser
- No visual formula editor
- No drag & drop
- No real-time collaboration

**Opportunity for sci-notebook:**
- Be the visual editor that Quarto needs as a frontend
- Interactive UX that Quarto doesn't have
- Possible integration: export to Quarto format (.qmd)

---

### 2.7 Typst

**Strengths:**
- Modern alternative to LaTeX with simpler syntax
- Ultra-fast incremental compilation
- Real-time preview
- Built-in functions and scripting
- Better error handling than LaTeX
- Open source

**Weaknesses:**
- Young ecosystem, few packages
- No visual formula editor
- No cell/notebook model
- No external code execution
- Limited adoption vs LaTeX

**Opportunity for sci-notebook:**
- Possible plugin to render Typst in addition to LaTeX
- Our visual formula editor is something Typst doesn't have
- More flexible cell model

---

### 2.8 CoCalc

**Strengths:**
- Jupyter + LaTeX + terminal + chat in one platform
- Real-time collaboration with CRDT
- Granular version history
- Support for Sage, R, Julia, Octave
- TimeTravel (edit replay)

**Weaknesses:**
- Complex, overloaded UX
- Slow (remote server required)
- No visual formula editor
- Outdated interface
- Requires account and connection

**Opportunity for sci-notebook:**
- Clean, modern UX vs CoCalc's complexity
- Works offline, no server
- Visual formula editor

---

## 3. Feature Comparison Matrix

| Feature | Jupyter | Notion | Overleaf | Mathcha | Observable | Quarto | Typst | CoCalc | **sci-notebook** |
|---------|---------|--------|----------|---------|------------|--------|-------|--------|-----------------|
| **Cells/Blocks** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Markdown WYSIWYG** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **LaTeX rendering** | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Visual formula editor** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Symbol palette** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Image cells** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Image drag & drop** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Embeds/iframes** | ⚠️ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Floating toolbar** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Insert handles** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Click-to-edit** | ❌ | ✅ | N/A | N/A | ❌ | N/A | N/A | ❌ | ✅ |
| **Drag reorder** | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Keyboard nav** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | N/A | ✅ | ✅ | ✅ |
| **Light/dark themes** | ⚠️ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Code execution** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **RT collaboration** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | 🔜 |
| **Open source** | ✅ | ❌ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| **Serverless** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Plugin system** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **AI integration** | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| **Framework agnostic** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Presentation mode** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **PDF/DOCX export** | ⚠️ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Cloud sync** | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Mobile support** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Legend:** ✅ = Yes | ⚠️ = Partial | ❌ = No | 🔜 = Planned

---

## 4. Unique Competitive Advantages of sci-notebook

### 4.1 What NOBODY else has (combined)

1. **Visual formula editor + notebook**: Only Mathcha has a visual editor, but it's not a notebook. Only Jupyter has a notebook, but no visual editor. **sci-notebook is the only one that combines both.**

2. **Framework agnostic + serverless**: Works 100% in the browser with no backend. No competitor offers this with the same level of features.

3. **Plugin system + modern UX**: Jupyter's extensibility with Notion's UX.

4. **Open source + scientific focus**: Quarto is open source but not an editor. Jupyter is open source but the UX is outdated.

### 4.2 Key Differentiators

| Differentiator | Description |
|----------------|-------------|
| **Visual MathEditor** | 9 categories, 100+ blocks, real-time preview, dual mode (visual/raw) |
| **Zero-server** | Pure TypeScript, works offline, embed in any app |
| **Micro-bundle** | Core ~45KB, React adapter ~80KB, vs Jupyter (MB of Python + JS) |
| **Instant boot** | No kernel startup, no compilation, immediate rendering |
| **Composable** | Every feature is an opt-in plugin, tree-shakeable |

---

## 5. Identified Gaps — What We Were Missing

### 5.1 Critical (necessary to compete)

| # | Gap | Reference Competitor | Priority |
|---|-----|---------------------|----------|
| G1 | **Slash commands** (`/` to insert) | Notion | 🔴 High |
| G2 | **Drag & drop reorder** of cells | Notion, JupyterLab | 🔴 High |
| G3 | **Code execution** (at least JS/Python via Pyodide) | Jupyter, Observable | 🔴 High |
| G4 | **Syntax highlighting** in code cells | Jupyter, VS Code | 🔴 High |
| G5 | **Export** to PDF, HTML, Markdown, .ipynb | Quarto, Jupyter | 🔴 High |
| G6 | **Real-time collaboration** (Yjs/CRDT) | Notion, Overleaf, CoCalc | 🟡 Medium |

### 5.2 Important (quality differentiators)

| # | Gap | Reference Competitor | Priority |
|---|-----|---------------------|----------|
| G7 | **Table editor** interactive within cells | Notion | 🟡 Medium |
| G8 | **Mermaid diagrams** rendering | Jupyter, Quarto | 🟡 Medium |
| G9 | **TOC sidebar** (table of contents) | Notion, JupyterLab | 🟡 Medium |
| G10 | **Find & replace** across cells | Overleaf, Jupyter | 🟡 Medium |
| G11 | **Cell output** display (for execution) | Jupyter | 🟡 Medium |
| G12 | **Version history** / diffing | Overleaf, CoCalc | 🟡 Medium |

### 5.3 Nice-to-have (polish)

| # | Gap | Reference Competitor | Priority |
|---|-----|---------------------|----------|
| G13 | **Presentation mode** (slideshow) | Jupyter RISE | 🟢 Low |
| G14 | **Comments / annotations** | Notion, Google Docs | 🟢 Low |
| G15 | **Templates** gallery | Notion, Overleaf | 🟢 Low |
| G16 | **Mobile-optimized** UI | Notion | 🟢 Low |
| G17 | **Autocomplete** for LaTeX commands | Overleaf | 🟢 Low |
| G18 | **Citation management** (BibTeX) | Overleaf, Quarto | 🟢 Low |

---

## 6. Strategy — How to Be the Best

### Immediate Phase (v0.2) ✅ COMPLETE
- [x] **G1**: Slash commands — SlashCommand.tsx with 8 types, filter, keyboard nav
- [x] **G2**: Drag & drop reorder with top/bottom indicator
- [x] **G4**: Syntax highlighting with Shiki (lazy loading, 30+ languages)
- [x] **G8**: Mermaid diagrams — renderMermaidFallback() in pipeline

### Short Phase (v0.3) ✅ COMPLETE
- [x] **G3**: JS code execution in sandbox + custom language executors
- [x] **G5**: Export to standalone HTML + Markdown + .ipynb + JSON
- [x] **G7**: Interactive table editor — TableCell.tsx
- [x] **G9**: TOC sidebar — TOCSidebar.tsx

### Medium Phase (v0.4) ✅ COMPLETE
- [x] **G10**: Global find & replace — FindReplace.tsx with Ctrl+F
- [x] **G11**: Cell outputs — CellOutputDisplay.tsx (stream/display/error)
- [x] **G17**: LaTeX autocomplete — 120+ commands in 8 categories
- [x] **G12**: Version history — VersionHistory with save/restore/diff

### Long Phase (v1.0) ✅ COMPLETE (partial)
- [x] **G13**: Presentation mode — PresentationEngine with 3 split modes, transitions, fullscreen
- [x] **G16**: Mobile-optimized UI — MobileAdapter with touch gestures, responsive CSS
- [x] **G5** (extended): PDF/DOCX export — plugin-export with browser print and Office Open XML
- [ ] **G6**: Real-time collaboration (Yjs) — out of scope v1.0
- [ ] **G14**: Comments — out of scope v1.0
- [ ] **G18**: Citations — out of scope v1.0

---

## 7. Design Principles for "The Best Editor"

1. **Instant feedback**: Every user action produces immediate visual result (<16ms)
2. **Zero friction**: Never more than 2 clicks for any common operation
3. **Progressive disclosure**: Simple by default, powerful when you need it
4. **Keyboard-first**: Everything accessible by keyboard, mouse is optional
5. **Offline-first**: Works without connection, syncs when online
6. **Composable**: Every feature is a plugin, nothing is mandatory
7. **Beautiful defaults**: Looks professional without configuration
8. **Accessible**: WCAG 2.1 AA, screen readers, high contrast
9. **Fast**: <100ms for any operation, <1s for boot
10. **Open**: Standard JSON format, no vendor lock-in, MIT license

---

## 8. Conclusion

sci-notebook occupies a unique niche: **scientific notebook editor with modern UX, visual formula editor, and plugin architecture — all serverless, open source, and framework agnostic**.

No competitor combines these characteristics. The strategy is:
1. Maintain the unique advantages (MathEditor, zero-server, plugins)
2. Close the critical gaps (slash commands, drag reorder, code execution, syntax highlighting) — ✅ DONE
3. Polish the UX to surpass Notion in the scientific niche
4. Build community with excellent docs and working examples
