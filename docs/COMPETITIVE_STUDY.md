# Estudio Competitivo — Editores Científicos y Notebooks

> Objetivo: identificar las fortalezas y debilidades de cada competidor para construir
> el mejor editor científico de notebooks del mercado.

---

## 1. Panorama del Mercado

| Producto | Tipo | Open Source | Foco Principal |
|----------|------|-------------|----------------|
| **Jupyter Notebook/Lab** | Notebook computacional | Sí | Ejecución de código + visualización |
| **Notion** | Docs/Wiki colaborativo | No | Productividad general, bloques |
| **Overleaf** | Editor LaTeX online | Parcial | Documentos académicos LaTeX |
| **Mathcha** | Editor matemático visual | No | Fórmulas + diagramas WYSIWYG |
| **Observable** | Notebook reactivo | Parcial | Visualización de datos, JS |
| **Quarto** | Publishing científico | Sí | Documentos reproducibles multi-lenguaje |
| **Typst** | Lenguaje de composición | Sí | Alternativa moderna a LaTeX |
| **CoCalc** | Plataforma colaborativa | Parcial | Jupyter + LaTeX + terminal en la nube |
| **Deepnote** | Notebook colaborativo | No | Jupyter en la nube + colaboración |
| **HackMD/CodiMD** | Markdown colaborativo | Sí | Markdown en tiempo real |

---

## 2. Análisis Detallado por Competidor

### 2.1 Jupyter Notebook / JupyterLab

**Fortalezas:**
- Estándar de facto para computación científica
- Ejecución de código en 100+ lenguajes vía kernels
- Ecosistema masivo de extensiones
- Formato `.ipynb` ampliamente adoptado
- Rich output: gráficos, tablas, widgets interactivos

**Debilidades:**
- UX anticuada — la edición de texto es tosca
- Sin WYSIWYG para Markdown (edit/preview separados)
- LaTeX solo en preview, no hay editor visual de fórmulas
- Sin drag & drop para reordenar celdas (JupyterLab lo agregó parcialmente)
- Sin toolbar flotante contextual
- Temas limitados, personalización CSS manual
- Sin colaboración en tiempo real (JupyterLab tiene extensión experimental)
- Arranque lento (servidor Python + kernel)

**Oportunidad para sci-notebook:**
- UX moderna con click-to-edit, toolbar flotante, insert handles
- Editor visual de fórmulas que Jupyter no tiene
- Arranque instantáneo (sin servidor, puro frontend)
- Mejor experiencia mobile

---

### 2.2 Notion

**Fortalezas:**
- UX excepcional — el estándar de oro en edición por bloques
- Slash commands (`/`) para insertar cualquier tipo de bloque
- Drag & drop fluido para reordenar
- Inline databases, tablas, kanban, calendarios
- Colaboración en tiempo real
- Templates reutilizables
- API pública robusta

**Debilidades:**
- Sin soporte nativo de LaTeX (solo inline con `$$`, rendering básico)
- Sin ejecución de código
- Sin editor visual de fórmulas (solo raw LaTeX)
- Cerrado, propietario, vendor lock-in
- Sin modo offline robusto
- Rendering de fórmulas lento comparado con KaTeX nativo
- Sin syntax highlighting avanzado para código

**Oportunidad para sci-notebook:**
- Adoptar la UX de bloques de Notion pero con foco científico
- Editor visual de fórmulas >>> lo que Notion ofrece
- Open source, sin vendor lock-in
- Mejor soporte de código con syntax highlighting real

---

### 2.3 Overleaf

**Fortalezas:**
- Editor LaTeX colaborativo líder del mercado
- Compilación en tiempo real con preview PDF
- Miles de templates académicos
- Integración con journals para submission directa
- Git sync, Dropbox sync
- Historial de versiones completo

**Debilidades:**
- Curva de aprendizaje alta (requiere saber LaTeX)
- Sin modo WYSIWYG real (el "rich text" es limitado)
- Sin celdas/bloques — es un editor de texto plano
- Sin ejecución de código
- Sin embeds interactivos
- Lento para documentos grandes
- Interfaz datada, no moderna

**Oportunidad para sci-notebook:**
- Editor visual de fórmulas que elimina la barrera de LaTeX
- Estructura por celdas más flexible que texto plano
- Embeds interactivos (gráficos, videos, iframes)
- Rendimiento superior (no necesita compilar PDF)

---

### 2.4 Mathcha

**Fortalezas:**
- Editor WYSIWYG de matemáticas más intuitivo del mercado
- Paleta visual de símbolos y estructuras
- Diagramas integrados (tikz-like)
- Export a LaTeX, PDF, imagen
- Sin necesidad de saber LaTeX para escribir fórmulas

**Debilidades:**
- Solo fórmulas y diagramas — no es un notebook completo
- Sin celdas de código
- Sin Markdown
- Sin plugins ni extensibilidad
- Sin API programática
- Cerrado, propietario
- Sin colaboración en tiempo real

**Oportunidad para sci-notebook:**
- Combinar la UX de fórmulas de Mathcha con un notebook completo
- Nuestro MathEditor ya tiene paleta de bloques similar
- Agregar: drag & drop de bloques de fórmula, preview en tiempo real
- Extensible vía plugins

---

### 2.5 Observable

**Fortalezas:**
- Notebooks reactivos — las celdas se actualizan automáticamente
- Visualización de datos de primera clase (D3, Plot)
- Importación de notebooks entre usuarios
- Ejecución JavaScript nativa en el browser
- Comunidad activa de visualización

**Debilidades:**
- Solo JavaScript (no Python, R, etc.)
- Sin soporte robusto de LaTeX
- Sin editor visual de fórmulas
- Modelo de datos propietario (no .ipynb)
- Sin modo offline
- Curva de aprendizaje para el modelo reactivo

**Oportunidad para sci-notebook:**
- Soporte multi-formato (Markdown + LaTeX + código + embeds)
- Editor visual de fórmulas
- Formato JSON estándar, portable
- Embeds de Observable como iframe

---

### 2.6 Quarto

**Fortalezas:**
- Publishing científico de primera clase
- Multi-lenguaje (Python, R, Julia, Observable JS)
- Output a HTML, PDF, Word, presentaciones, libros
- Integración con Jupyter kernels
- Cross-references, citaciones, bibliografía
- Extensible vía Lua filters

**Debilidades:**
- No es un editor — es un sistema de build/publishing
- Requiere CLI + editor externo (VS Code, RStudio)
- Sin UX interactiva en el browser
- Sin editor visual de fórmulas
- Sin drag & drop
- Sin colaboración en tiempo real

**Oportunidad para sci-notebook:**
- Ser el editor visual que Quarto necesita como frontend
- UX interactiva que Quarto no tiene
- Posible integración: exportar a formato Quarto (.qmd)

---

### 2.7 Typst

**Fortalezas:**
- Alternativa moderna a LaTeX con sintaxis más simple
- Compilación incremental ultra-rápida
- Preview en tiempo real
- Funciones y scripting integrados
- Mejor manejo de errores que LaTeX
- Open source

**Debilidades:**
- Ecosistema joven, pocos packages
- Sin editor visual de fórmulas
- Sin modelo de celdas/notebook
- Sin ejecución de código externo
- Adopción limitada vs LaTeX

**Oportunidad para sci-notebook:**
- Posible plugin para renderizar Typst además de LaTeX
- Nuestro editor visual de fórmulas es algo que Typst no tiene
- Modelo de celdas más flexible

---

### 2.8 CoCalc

**Fortalezas:**
- Jupyter + LaTeX + terminal + chat en una plataforma
- Colaboración en tiempo real con CRDT
- Historial de versiones granular
- Soporte para Sage, R, Julia, Octave
- TimeTravel (replay de ediciones)

**Debilidades:**
- UX compleja, sobrecargada
- Lento (servidor remoto obligatorio)
- Sin editor visual de fórmulas
- Interfaz anticuada
- Requiere cuenta y conexión

**Oportunidad para sci-notebook:**
- UX limpia y moderna vs la complejidad de CoCalc
- Funciona offline, sin servidor
- Editor visual de fórmulas

---

## 3. Matriz Comparativa de Features

| Feature | Jupyter | Notion | Overleaf | Mathcha | Observable | Quarto | Typst | CoCalc | **sci-notebook** |
|---------|---------|--------|----------|---------|------------|--------|-------|--------|-----------------|
| **Celdas/Bloques** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Markdown WYSIWYG** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **LaTeX rendering** | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| **Editor visual fórmulas** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Paleta de símbolos** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Celdas de imagen** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Drag & drop imágenes** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Embeds/iframes** | ⚠️ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Toolbar flotante** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Insert handles** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Click-to-edit** | ❌ | ✅ | N/A | N/A | ❌ | N/A | N/A | ❌ | ✅ |
| **Drag reorder** | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Keyboard nav** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | N/A | ✅ | ✅ | ✅ |
| **Temas light/dark** | ⚠️ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Ejecución de código** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Colaboración RT** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | 🔜 |
| **Open source** | ✅ | ❌ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| **Sin servidor** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Plugin system** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **AI integration** | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| **Framework agnostic** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Leyenda:** ✅ = Sí | ⚠️ = Parcial | ❌ = No | 🔜 = Planeado

---

## 4. Ventajas Competitivas Únicas de sci-notebook

### 4.1 Lo que NADIE más tiene (combinado)

1. **Editor visual de fórmulas + notebook**: Solo Mathcha tiene editor visual, pero no es un notebook. Solo Jupyter tiene notebook, pero no tiene editor visual. **sci-notebook es el único que combina ambos.**

2. **Framework agnostic + sin servidor**: Funciona 100% en el browser sin backend. Ningún competidor ofrece esto con el mismo nivel de features.

3. **Plugin system + UX moderna**: La extensibilidad de Jupyter con la UX de Notion.

4. **Open source + foco científico**: Quarto es open source pero no es un editor. Jupyter es open source pero la UX es anticuada.

### 4.2 Diferenciadores Clave

| Diferenciador | Descripción |
|---------------|-------------|
| **MathEditor visual** | 9 categorías, 100+ bloques, preview en tiempo real, modo dual (visual/raw) |
| **Zero-server** | Puro TypeScript, funciona offline, embed en cualquier app |
| **Micro-bundle** | Core ~25KB, React adapter ~54KB, vs Jupyter (MB de Python + JS) |
| **Instant boot** | Sin kernel startup, sin compilación, rendering inmediato |
| **Composable** | Cada feature es un plugin opt-in, tree-shakeable |

---

## 5. Gaps Identificados — Qué Nos Falta

### 5.1 Críticos (necesarios para competir)

| # | Gap | Competidor referencia | Prioridad |
|---|-----|-----------------------|-----------|
| G1 | **Slash commands** (`/` para insertar) | Notion | 🔴 Alta |
| G2 | **Drag & drop reorder** de celdas | Notion, JupyterLab | 🔴 Alta |
| G3 | **Ejecución de código** (al menos JS/Python vía Pyodide) | Jupyter, Observable | 🔴 Alta |
| G4 | **Syntax highlighting** en celdas de código | Jupyter, VS Code | 🔴 Alta |
| G5 | **Export** a PDF, HTML, Markdown, .ipynb | Quarto, Jupyter | 🔴 Alta |
| G6 | **Colaboración en tiempo real** (Yjs/CRDT) | Notion, Overleaf, CoCalc | 🟡 Media |

### 5.2 Importantes (diferenciadores de calidad)

| # | Gap | Competidor referencia | Prioridad |
|---|-----|-----------------------|-----------|
| G7 | **Table editor** interactivo dentro de celdas | Notion | 🟡 Media |
| G8 | **Mermaid diagrams** rendering | Jupyter, Quarto | 🟡 Media |
| G9 | **TOC sidebar** (tabla de contenidos) | Notion, JupyterLab | 🟡 Media |
| G10 | **Find & replace** across cells | Overleaf, Jupyter | 🟡 Media |
| G11 | **Cell output** display (para ejecución) | Jupyter | 🟡 Media |
| G12 | **Version history** / diffing | Overleaf, CoCalc | 🟡 Media |

### 5.3 Nice-to-have (polish)

| # | Gap | Competidor referencia | Prioridad |
|---|-----|-----------------------|-----------|
| G13 | **Presentation mode** (slideshow) | Jupyter RISE | 🟢 Baja |
| G14 | **Comments / annotations** | Notion, Google Docs | 🟢 Baja |
| G15 | **Templates** gallery | Notion, Overleaf | 🟢 Baja |
| G16 | **Mobile-optimized** UI | Notion | 🟢 Baja |
| G17 | **Autocomplete** para LaTeX commands | Overleaf | 🟢 Baja |
| G18 | **Citation management** (BibTeX) | Overleaf, Quarto | 🟢 Baja |

---

## 6. Estrategia — Cómo Ser el Mejor

### Fase Inmediata (v0.2) ✅ COMPLETADA
- [x] **G1**: Slash commands — SlashCommand.tsx con 8 tipos, filtro, keyboard nav
- [x] **G2**: Drag & drop reorder con indicador top/bottom
- [x] **G4**: Syntax highlighting con Shiki (lazy loading, 30+ lenguajes)
- [x] **G8**: Mermaid diagrams — renderMermaidFallback() en pipeline

### Fase Corta (v0.3) ✅ COMPLETADA
- [x] **G3**: Ejecución de código JS en sandbox + custom language executors
- [x] **G5**: Export a HTML standalone + Markdown + .ipynb + JSON
- [x] **G7**: Table editor interactivo — TableCell.tsx
- [x] **G9**: TOC sidebar — TOCSidebar.tsx

### Fase Media (v0.4) ✅ COMPLETADA
- [x] **G10**: Find & replace global — FindReplace.tsx con Ctrl+F
- [x] **G11**: Cell outputs — CellOutputDisplay.tsx (stream/display/error)
- [x] **G17**: Autocomplete LaTeX — 120+ comandos en 8 categorías
- [x] **G12**: Version history — VersionHistory con save/restore/diff

### Fase Larga (v1.0) — Pendiente
- [ ] **G6**: Colaboración en tiempo real (Yjs)
- [ ] **G13**: Presentation mode
- [ ] **G14**: Comments
- [ ] **G18**: Citations

---

## 7. Principios de Diseño para "El Mejor Editor"

1. **Instant feedback**: Cada acción del usuario produce resultado visual inmediato (<16ms)
2. **Zero friction**: Nunca más de 2 clicks para cualquier operación común
3. **Progressive disclosure**: Simple por defecto, potente cuando lo necesitas
4. **Keyboard-first**: Todo accesible por teclado, mouse es opcional
5. **Offline-first**: Funciona sin conexión, sync cuando hay red
6. **Composable**: Cada feature es un plugin, nada es obligatorio
7. **Beautiful defaults**: Se ve profesional sin configuración
8. **Accessible**: WCAG 2.1 AA, screen readers, high contrast
9. **Fast**: <100ms para cualquier operación, <1s para boot
10. **Open**: Formato JSON estándar, sin vendor lock-in, MIT license

---

## 8. Conclusión

sci-notebook ocupa un nicho único: **editor científico de notebooks con UX moderna, editor visual de fórmulas, y arquitectura de plugins — todo sin servidor, open source, y framework agnostic**.

Ningún competidor combina estas características. La estrategia es:
1. Mantener las ventajas únicas (MathEditor, zero-server, plugins)
2. Cerrar los gaps críticos (slash commands, drag reorder, code execution, syntax highlighting)
3. Pulir la UX hasta superar a Notion en el nicho científico
4. Construir comunidad con docs excelentes y ejemplos funcionales
