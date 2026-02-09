import React, { useState, useRef, useCallback } from "react";
import { SciNotebook } from "@sci-notebook/react";
import {
  EditorEngine,
  Notebook,
  TemplateEngine,
  exportToHTML,
  exportToMarkdown,
  exportToIPYNB,
  exportToJSON,
  downloadExport,
} from "@sci-notebook/core";

const SAMPLE_NOTEBOOK: Notebook = {
  id: "demo_nb_1",
  title: "Sci-Notebook Demo",
  cells: [
    {
      id: "c1",
      type: "markdown",
      source: "# Bienvenido a Sci-Notebook\n\nEste es un editor de notebooks cientifico modular. Haz **click** en cualquier celda para editarla.\n\n- Soporta **Markdown**, codigo, LaTeX, tablas, diagramas y mas\n- Undo/Redo con `Ctrl+Z` / `Ctrl+Shift+Z`\n- Navega entre celdas con `Shift+Enter`\n- Escribe `/` para insertar un nuevo tipo de celda\n- Arrastra celdas para reordenar\n- `Ctrl+F` para buscar y reemplazar",
      metadata: {},
    },
    {
      id: "c2",
      type: "markdown",
      source: "## Formato de texto\n\nPuedes usar formato **bold**, *italic*, `inline code`, y mas.\n\n> Selecciona texto en modo edicion para ver la toolbar flotante.\n\n| Feature | Status |\n|---------|--------|\n| Markdown | OK |\n| Code cells | OK |\n| LaTeX | OK |\n| Tablas | OK |\n| Diagramas | OK |\n| Temas | Light/Dark |\n| Slash commands | OK |\n| Drag & drop | OK |\n| Find & Replace | OK |\n| TOC sidebar | OK |\n| Plantillas | OK |\n| Export | HTML/MD/IPYNB |",
      metadata: {},
    },
    {
      id: "c3",
      type: "code",
      source: 'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nconsole.log(fibonacci(10)); // 55',
      metadata: { language: "javascript" },
    },
    {
      id: "c4",
      type: "table",
      source: "| Atajo | Accion |\n| --- | --- |\n| Click | Editar celda |\n| Escape | Salir de edicion |\n| Shift+Enter | Siguiente celda |\n| Ctrl+B | Bold |\n| Ctrl+I | Italic |\n| Ctrl+F | Buscar |\n| / | Slash commands |\n| Drag handle | Reordenar |",
      metadata: {},
    },
    {
      id: "c5",
      type: "latex",
      source: "$$\n\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}\n$$",
      metadata: {},
    },
    {
      id: "c6",
      type: "markdown",
      source: "## Editor Visual de Formulas\n\nLa celda de arriba es una **celda LaTeX**. Haz click para abrir el editor visual:\n\n- **Paleta de bloques**: fracciones, integrales, sumatorias, matrices, griegos, operadores\n- **Modo Preview**: ve la formula mientras la construyes\n- **Modo LaTeX**: edita el codigo directamente",
      metadata: {},
    },
    {
      id: "c7",
      type: "mermaid",
      source: "graph TD\n    A[Notebook] --> B[Core Engine]\n    A --> C[Renderer]\n    A --> D[React Adapter]\n    B --> E[EditorEngine]\n    B --> F[TemplateEngine]\n    B --> G[ExportEngine]\n    C --> H[Pipeline]\n    D --> I[Components]\n    I --> J[Cell]\n    I --> K[MathEditor]\n    I --> L[TableCell]\n    I --> M[SlashCommand]",
      metadata: {},
    },
    {
      id: "c8",
      type: "image",
      source: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Euler%27s_formula.svg/400px-Euler%27s_formula.svg.png",
      metadata: { alt: "Formula de Euler", caption: "Representacion grafica de la formula de Euler", width: "50%", align: "center" },
    },
    {
      id: "c9",
      type: "embed",
      source: "https://www.youtube.com/embed/aircAruvnKk",
      metadata: { title: "3Blue1Brown - Neural Networks", height: "400px", sandbox: "allow-scripts allow-same-origin allow-popups" },
    },
    {
      id: "c10",
      type: "markdown",
      source: "## Sistema de Plantillas\n\nEl `TemplateEngine` permite usar flags `{{variable}}` en las celdas:\n\n- `{{variable}}` — reemplazo simple\n- `{{obj.prop}}` — acceso por dot-notation\n- `{{#table dataKey}}` — genera tabla Markdown desde array\n- `{{#each items}}...{{/each}}` — loop\n- `{{#if cond}}...{{else}}...{{/if}}` — condicional\n- `{{#date YYYY-MM-DD}}` — fecha formateada\n- `{{value | uppercase}}` — filtros (uppercase, currency, percent, etc.)\n\nIdeal para generar reportes desde bases de datos.",
      metadata: {},
    },
    {
      id: "c11",
      type: "raw",
      source: "Este es un bloque raw — se muestra tal cual, sin procesar.\nUtil para datos crudos, logs, o contenido que no necesita formato.",
      metadata: {},
    },
    {
      id: "c12",
      type: "markdown",
      source: "## Tipos de Celda\n\n| Tipo | Descripcion |\n|------|------------|\n| **Markdown** | Texto con formato, tablas, listas, links |\n| **Code** | Bloques de codigo |\n| **LaTeX** | Formulas con editor visual (100+ bloques) |\n| **Tabla** | Editor interactivo de tablas |\n| **Diagrama** | Mermaid (flowchart, sequence, etc.) |\n| **Imagen** | Drag&drop, URL, caption, resize |\n| **Embed** | YouTube, CodePen, Desmos, GeoGebra |\n| **Raw** | Texto sin formato |",
      metadata: {},
    },
  ],
  metadata: { author: "sci-notebook" },
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [cellCount, setCellCount] = useState(SAMPLE_NOTEBOOK.cells.length);
  const [showJson, setShowJson] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const engineRef = useRef<EditorEngine | null>(null);

  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  const handleChange = useCallback((nb: Notebook) => {
    setCellCount(nb.cells.length);
  }, []);

  const handleExportJSON = () => {
    if (!engineRef.current) return;
    const nb = engineRef.current.getNotebook();
    setJsonContent(JSON.stringify(nb, null, 2));
    setShowJson(true);
  };

  const handleExportHTML = () => {
    if (!engineRef.current) return;
    downloadExport(exportToHTML(engineRef.current.getNotebook()));
  };

  const handleExportMD = () => {
    if (!engineRef.current) return;
    downloadExport(exportToMarkdown(engineRef.current.getNotebook()));
  };

  const handleExportIPYNB = () => {
    if (!engineRef.current) return;
    downloadExport(exportToIPYNB(engineRef.current.getNotebook()));
  };

  const handleImport = () => {
    setJsonContent("");
    setShowJson(true);
  };

  const handleJsonLoad = () => {
    try {
      const nb = JSON.parse(jsonContent) as Notebook;
      if (!nb.cells || !nb.id) {
        alert("JSON invalido: debe tener 'id' y 'cells'");
        return;
      }
      setShowJson(false);
      // Reload page with new notebook — simplest approach for demo
      window.location.reload();
    } catch {
      alert("Error parseando JSON");
    }
  };

  return (
    <div className="app" data-app-theme={theme}>
      <header className="app-header">
        <h1>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="2" width="14" height="16" rx="2" />
            <line x1="6" y1="6" x2="14" y2="6" />
            <line x1="6" y1="10" x2="12" y2="10" />
            <line x1="6" y1="14" x2="10" y2="14" />
          </svg>
          Sci-Notebook
        </h1>
        <div className="app-header-actions">
          <button className="app-btn" onClick={handleExportJSON}>JSON</button>
          <button className="app-btn" onClick={handleExportHTML}>HTML</button>
          <button className="app-btn" onClick={handleExportMD}>MD</button>
          <button className="app-btn" onClick={handleExportIPYNB}>IPYNB</button>
          <button className="app-btn" onClick={handleImport}>Import</button>
          <button
            className={`app-btn ${theme === "dark" ? "app-btn--active" : ""}`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <SciNotebook
        notebook={SAMPLE_NOTEBOOK}
        theme={theme}
        onChange={handleChange}
        engineRef={engineRef}
        showTOC={true}
      />

      <footer className="app-status">
        <span>{cellCount} celdas</span>
        <span>sci-notebook v0.1.0</span>
      </footer>

      {showJson && (
        <div className="json-modal-overlay" onClick={() => setShowJson(false)}>
          <div className="json-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{jsonContent ? "Notebook JSON" : "Importar Notebook"}</h2>
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              placeholder='Pega el JSON del notebook aqui...'
              readOnly={!!jsonContent && jsonContent.length > 10}
            />
            <div className="json-modal-actions">
              <button className="app-btn" onClick={() => setShowJson(false)}>
                Cerrar
              </button>
              {jsonContent && jsonContent.length > 10 && (
                <button
                  className="app-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(jsonContent);
                  }}
                >
                  Copiar
                </button>
              )}
              {(!jsonContent || jsonContent.length <= 10) && (
                <button className="app-btn app-btn--active" onClick={handleJsonLoad}>
                  Cargar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
