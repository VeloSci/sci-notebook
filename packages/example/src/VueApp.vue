<script setup lang="ts">
import { ref, onMounted } from "vue";
import { SciNotebook } from "@velo-sci/notebook-vue";
import {
  EditorEngine,
  Notebook,
  VersionHistory,
  PresentationEngine,
  getPresentationCSS,
  MobileAdapter,
  exportToHTML,
  exportToMarkdown,
  exportToIPYNB,
  downloadExport,
} from "@velo-sci/notebook-core";
import { SAMPLE_NOTEBOOK, simpleMarkdown } from "@example/shared/sample-notebook";

import mermaid from "mermaid";

(globalThis as any).mermaid = mermaid;
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

const theme = ref<"light" | "dark">("light");
const cellCount = ref(SAMPLE_NOTEBOOK.cells.length);
const showJson = ref(false);
const jsonContent = ref("");
const showHistory = ref(false);
const presenting = ref(false);
const currentSlide = ref(0);
const isMobile = ref(false);
const notebookRef = ref<InstanceType<typeof SciNotebook> | null>(null);
const versionHistory = new VersionHistory({ maxEntries: 50 });
let presentationEngine: PresentationEngine | null = null;

const getEngine = (): EditorEngine | null => {
  return (notebookRef.value as any)?.engine ?? null;
};

onMounted(() => {
  isMobile.value = MobileAdapter.isTouchDevice();
  requestAnimationFrame(() => mermaid.run());
});

const copyToClipboard = (text: string) => {
  window.navigator.clipboard.writeText(text);
};

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

const handleChange = (nb: Notebook) => {
  cellCount.value = nb.cells.length;
  requestAnimationFrame(() => mermaid.run());
};

const handleExportJSON = () => {
  const engine = getEngine();
  if (!engine) return;
  jsonContent.value = JSON.stringify(engine.getNotebook(), null, 2);
  showJson.value = true;
};

const handleExportHTML = () => {
  const engine = getEngine();
  if (!engine) return;
  downloadExport(exportToHTML(engine.getNotebook()));
};

const handleExportMD = () => {
  const engine = getEngine();
  if (!engine) return;
  downloadExport(exportToMarkdown(engine.getNotebook()));
};

const handleExportIPYNB = () => {
  const engine = getEngine();
  if (!engine) return;
  downloadExport(exportToIPYNB(engine.getNotebook()));
};

const handleExportPDF = () => {
  const engine = getEngine();
  if (!engine) return;
  const html = exportToHTML(engine.getNotebook());
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow popups for PDF export"); return; }
  w.document.write(html.content);
  w.document.close();
  w.onload = () => setTimeout(() => w.print(), 400);
};

const handleImport = () => {
  jsonContent.value = "";
  showJson.value = true;
};

const handleJsonLoad = () => {
  try {
    const nb = JSON.parse(jsonContent.value) as Notebook;
    if (!nb.cells || !nb.id) { alert("Invalid JSON: must have 'id' and 'cells'"); return; }
    showJson.value = false;
    window.location.reload();
  } catch { alert("Error parsing JSON"); }
};

const handleSaveVersion = () => {
  const engine = getEngine();
  if (!engine) return;
  const nb = engine.getNotebook();
  const entry = versionHistory.save(nb, `Manual save — ${nb.cells.length} cells`);
  alert(`Version saved: ${entry.id}\n${versionHistory.count} versions stored.`);
};

const handlePresent = () => {
  const engine = getEngine();
  if (!engine) return;
  const nb = engine.getNotebook();
  presentationEngine = new PresentationEngine(nb, { splitMode: "heading", transition: "fade" });
  presentationEngine.on((event) => {
    if (event.type === "slide:changed") currentSlide.value = event.slide;
    if (event.type === "presentation:ended") presenting.value = false;
  });
  presentationEngine.start();
  presenting.value = true;
  currentSlide.value = 0;
};

const handleEndPresentation = () => {
  presentationEngine?.end();
  presentationEngine?.destroy();
  presentationEngine = null;
  presenting.value = false;
};

const prevSlide = () => presentationEngine?.prev();
const nextSlide = () => presentationEngine?.next();
</script>

<template>
  <div class="app" :data-app-theme="theme">
    <header class="app-header">
      <h1>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="2" width="14" height="16" rx="2" />
          <line x1="6" y1="6" x2="14" y2="6" />
          <line x1="6" y1="10" x2="12" y2="10" />
          <line x1="6" y1="14" x2="10" y2="14" />
        </svg>
        Sci-Notebook <span class="app-framework-badge">Vue</span>
        <span v-if="isMobile" class="app-badge">Touch</span>
      </h1>
      <div class="app-header-actions">
        <div class="app-btn-group">
          <button class="app-btn" @click="handleExportJSON" title="Export as JSON">JSON</button>
          <button class="app-btn" @click="handleExportHTML" title="Export as HTML">HTML</button>
          <button class="app-btn" @click="handleExportMD" title="Export as Markdown">MD</button>
          <button class="app-btn" @click="handleExportIPYNB" title="Export as Jupyter Notebook">IPYNB</button>
          <button class="app-btn" @click="handleExportPDF" title="Export as PDF (print)">PDF</button>
        </div>
        <div class="app-btn-group">
          <button class="app-btn" @click="handleImport" title="Import notebook from JSON">Import</button>
          <button class="app-btn" @click="handleSaveVersion" title="Save a version snapshot">Save Version</button>
          <button class="app-btn" @click="showHistory = true" title="Browse version history">History</button>
        </div>
        <div class="app-btn-group">
          <button class="app-btn app-btn--accent" @click="handlePresent" title="Start presentation mode">▶ Present</button>
          <button :class="['app-btn', theme === 'dark' ? 'app-btn--active' : '']" @click="toggleTheme">
            {{ theme === "dark" ? "☀ Light" : "🌙 Dark" }}
          </button>
        </div>
      </div>
    </header>

    <SciNotebook
      ref="notebookRef"
      :notebook="SAMPLE_NOTEBOOK"
      :theme="theme"
      :onChange="handleChange"
      :showTOC="true"
    />

    <footer class="app-status">
      <span>{{ cellCount }} cells</span>
      <span>v{{ versionHistory.count }} versions</span>
      <span>sci-notebook v0.6.2 — Vue</span>
    </footer>

    <!-- JSON Modal -->
    <div v-if="showJson" class="json-modal-overlay" @click="showJson = false">
      <div class="json-modal" @click.stop>
        <h2>{{ jsonContent ? "Notebook JSON" : "Import Notebook" }}</h2>
        <textarea
          :value="jsonContent"
          @input="jsonContent = ($event.target as HTMLTextAreaElement).value"
          placeholder="Paste notebook JSON here..."
          :readonly="!!jsonContent && jsonContent.length > 10"
        />
        <div class="json-modal-actions">
          <button class="app-btn" @click="showJson = false">Close</button>
          <button v-if="jsonContent && jsonContent.length > 10" class="app-btn" @click="copyToClipboard(jsonContent)">Copy</button>
          <button v-if="!jsonContent || jsonContent.length <= 10" class="app-btn app-btn--active" @click="handleJsonLoad">Load</button>
        </div>
      </div>
    </div>

    <!-- Version History Modal -->
    <div v-if="showHistory" class="json-modal-overlay" @click="showHistory = false">
      <div class="json-modal" @click.stop>
        <h2>Version History</h2>
        <div class="version-list">
          <p v-if="versionHistory.getEntries().length === 0" class="version-empty">
            No versions saved yet. Click "Save Version" to create a snapshot.
          </p>
          <div v-for="entry in [...versionHistory.getEntries()].reverse()" :key="entry.id" class="version-item">
            <div class="version-item-header">
              <strong>{{ entry.description }}</strong>
              <span class="version-item-time">{{ new Date(entry.timestamp).toLocaleString() }}</span>
            </div>
            <div class="version-item-meta">
              {{ entry.cellCount }} cells · ID: {{ entry.id }}
            </div>
          </div>
        </div>
        <div class="json-modal-actions">
          <button class="app-btn" @click="showHistory = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Presentation Mode Overlay -->
    <div v-if="presenting && presentationEngine" class="presentation-overlay">
      <component :is="'style'">{{ getPresentationCSS({ transition: 'fade' }) }}</component>
      <div class="sci-nb-presentation">
        <div class="sci-nb-slide">
          <div class="sci-nb-slide-content">
            <div
              v-for="cell in (presentationEngine as PresentationEngine).getCurrentSlide()?.cells"
              :key="cell.id"
              :class="['sci-nb-slide-cell', 'sci-nb-slide-cell--' + cell.type]"
            >
              <div v-if="cell.type === 'markdown'" v-html="simpleMarkdown(cell.source)" />
              <pre v-else-if="cell.type === 'code'"><code>{{ cell.source }}</code></pre>
              <div v-else-if="cell.type === 'latex'" class="slide-latex">{{ cell.source }}</div>
              <pre v-else>{{ cell.source }}</pre>
            </div>
          </div>
        </div>
        <div class="sci-nb-presentation-controls">
          <button @click="prevSlide" :disabled="currentSlide === 0">← Prev</button>
          <span class="sci-nb-slide-number">{{ currentSlide + 1 }} / {{ (presentationEngine as PresentationEngine).getSlideCount() }}</span>
          <button @click="nextSlide" :disabled="currentSlide >= (presentationEngine as PresentationEngine).getSlideCount() - 1">Next →</button>
          <button @click="handleEndPresentation">✕ Exit</button>
        </div>
        <div class="sci-nb-progress-bar">
          <div class="sci-nb-progress-bar-fill" :style="{ width: ((currentSlide + 1) / (presentationEngine as PresentationEngine).getSlideCount() * 100) + '%' }" />
        </div>
      </div>
    </div>
  </div>
</template>
