import { defineComponent, h, ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import type { PropType } from "vue";
import type { Cell, CellType } from "@velo-sci/notebook-core";
import { RenderPipeline, MATH_CATEGORIES, type MathBlock } from "@velo-sci/notebook-renderer";
import { useNotebookEngine } from "./composables";
import { ImageCell, renderImagePreview } from "./ImageCell";
import { EmbedCell, renderEmbedPreview } from "./EmbedCell";
import { TableCell, renderTablePreview } from "./TableCell";
import { MermaidPreview } from "./MermaidCell";

const CELL_TYPES: { value: CellType; label: string; icon: string }[] = [
  { value: "markdown", label: "Markdown", icon: "M" },
  { value: "code", label: "Code", icon: "</>" },
  { value: "raw", label: "Raw", icon: "T" },
  { value: "latex", label: "LaTeX", icon: "∑" },
  { value: "image", label: "Image", icon: "🖼" },
  { value: "embed", label: "Embed", icon: "⧉" },
];

const PLACEHOLDERS: Record<string, string> = {
  markdown: "Write markdown here... (click to edit)",
  code: "Write code here...",
  raw: "Raw text...",
  latex: "Write LaTeX here... e.g. \\int_0^1 x^2 dx",
  image: "Click to add image",
  embed: "Click to add embedded content",
};

// ── Vue Math Editor (mirrors React's MathEditor) ──

function renderLatexPreview(latex: string): string {
  const clean = latex.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim();
  if (!clean) return '<span class="sci-nb-math-preview-empty">Empty formula</span>';
  if (typeof globalThis !== "undefined" && (globalThis as any).katex) {
    try {
      return (globalThis as any).katex.renderToString(clean, { displayMode: true, throwOnError: false });
    } catch { /* fall through */ }
  }
  const escaped = clean.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<code class="sci-nb-math-preview-code">${escaped}</code>`;
}

const VueMathEditor = defineComponent({
  name: "VueMathEditor",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    onExit: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const activeCategory = ref(0);
    const showRaw = ref(false);
    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    const containerRef = ref<HTMLDivElement | null>(null);

    const innerLatex = computed(() =>
      props.source.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").trim()
    );

    const updateSource = (newInner: string) => {
      engine.updateCellSource(props.cellId, `$$\n${newInner}\n$$`);
    };

    const exitAndNext = () => {
      props.onExit!();
      const cells = engine.getCells();
      const idx = cells.findIndex(c => c.id === props.cellId);
      if (idx < cells.length - 1) {
        engine.focusCell(cells[idx + 1].id);
        engine.setEditMode(cells[idx + 1].id);
      }
    };

    const insertBlock = (block: MathBlock) => {
      const ta = textareaRef.value;
      if (!ta) {
        updateSource(innerLatex.value + (innerLatex.value ? " " : "") + block.latex.replace(/▢/g, ""));
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const selected = val.slice(start, end);
      let inserted = block.latex;
      if (selected) inserted = inserted.replace("▢", selected);
      inserted = inserted.replace(/▢/g, "");
      const newVal = val.slice(0, start) + inserted + val.slice(end);
      updateSource(newVal);
      requestAnimationFrame(() => {
        if (textareaRef.value) {
          const cursorPos = block.cursor != null ? start + block.cursor : start + inserted.length;
          textareaRef.value.focus();
          textareaRef.value.setSelectionRange(cursorPos, cursorPos);
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); props.onExit!(); }
      else if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); e.stopPropagation(); exitAndNext(); }
      else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); props.onExit!(); }
    };

    onMounted(() => {
      nextTick(() => { containerRef.value?.focus(); });
    });

    return () => {
      const category = MATH_CATEGORIES[activeCategory.value];

      const tabs = h("div", { class: "sci-nb-math-tabs" },
        MATH_CATEGORIES.map((cat, i) =>
          h("button", {
            class: `sci-nb-math-tab ${i === activeCategory.value ? "sci-nb-math-tab--active" : ""}`,
            title: cat.name,
            tabindex: -1,
            onClick: () => { activeCategory.value = i; },
          }, [
            h("span", { class: "sci-nb-math-tab-icon" }, cat.icon),
            h("span", { class: "sci-nb-math-tab-label" }, cat.name),
          ])
        )
      );

      const palette = h("div", { class: "sci-nb-math-palette" },
        category.blocks.map((block, i) =>
          h("button", {
            class: "sci-nb-math-block",
            title: block.latex,
            tabindex: -1,
            onClick: () => insertBlock(block),
          }, block.label)
        )
      );

      const modeToggle = h("div", { class: "sci-nb-math-mode-toggle" }, [
        h("button", {
          class: `sci-nb-math-mode-btn ${!showRaw.value ? "sci-nb-math-mode-btn--active" : ""}`,
          tabindex: -1,
          onClick: () => { showRaw.value = false; },
        }, "Preview"),
        h("button", {
          class: `sci-nb-math-mode-btn ${showRaw.value ? "sci-nb-math-mode-btn--active" : ""}`,
          tabindex: -1,
          onClick: () => { showRaw.value = true; },
        }, "LaTeX"),
      ]);

      let editorContent: any;
      if (showRaw.value) {
        editorContent = h("textarea", {
          class: "sci-nb-math-raw",
          value: innerLatex.value,
          placeholder: "Type LaTeX here...",
          spellcheck: false,
          ref: (el: any) => {
            textareaRef.value = el;
            if (el) nextTick(() => {
              el.focus();
              el.style.height = "auto";
              el.style.height = `${Math.max(60, el.scrollHeight)}px`;
            });
          },
          onInput: (e: Event) => {
            const ta = e.target as HTMLTextAreaElement;
            updateSource(ta.value);
            ta.style.height = "auto";
            ta.style.height = `${Math.max(60, ta.scrollHeight)}px`;
          },
        });
      } else {
        editorContent = h("div", { class: "sci-nb-math-visual" }, [
          h("div", { class: "sci-nb-math-preview", innerHTML: renderLatexPreview(props.source) }),
          h("p", { class: "sci-nb-math-visual-hint", innerHTML: 'Click the blocks above to build your formula. Switch to <strong>LaTeX</strong> mode to edit directly.' }),
        ]);
      }

      const editorArea = h("div", { class: "sci-nb-math-editor-area" }, [modeToggle, editorContent]);

      const hint = h("div", { class: "sci-nb-cell-hint", innerHTML: '<kbd>Esc</kbd> exit &middot; <kbd>Shift+Enter</kbd> next &middot; <kbd>Ctrl+Enter</kbd> render' });

      return h("div", {
        class: "sci-nb-math-editor",
        tabindex: -1,
        onKeydown: handleKeyDown,
        ref: containerRef,
      }, [tabs, palette, editorArea, hint]);
    };
  },
});

export const NotebookCell = defineComponent({
  name: "NotebookCell",
  props: {
    cellId: { type: String, required: true },
    pipeline: { type: Object as PropType<RenderPipeline>, required: true },
    index: { type: Number, required: true },
    totalCells: { type: Number, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const cell = ref<Readonly<Cell> | undefined>(engine.getCell(props.cellId));
    const editorValue = ref(cell.value?.source || "");
    const showTypeMenu = ref(false);
    const hovered = ref(false);

    const unsubs: Array<() => void> = [];

    onMounted(() => {
      const handler = () => {
        cell.value = engine.getCell(props.cellId);
        if (cell.value && !cell.value.editing) {
          editorValue.value = cell.value.source;
        }
      };
      unsubs.push(engine.on("cell:updated", handler));
      unsubs.push(engine.on("cell:mode-changed", handler));
      unsubs.push(engine.on("notebook:updated", handler));
    });

    onUnmounted(() => {
      for (const u of unsubs) u();
    });

    const renderedHtml = computed(() => {
      if (!cell.value) return "";
      return props.pipeline.render(cell.value).html;
    });

    const enterEdit = () => {
      engine.focusCell(props.cellId);
      engine.setEditMode(props.cellId);
    };

    const exitEdit = () => {
      engine.setViewMode(props.cellId);
    };

    const handleInput = (e: Event) => {
      const ta = e.target as HTMLTextAreaElement;
      editorValue.value = ta.value;
      engine.updateCellSource(props.cellId, ta.value);
      ta.style.height = "auto";
      ta.style.height = `${Math.max(40, ta.scrollHeight)}px`;
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exitEdit();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        exitEdit();
        const cells = engine.getCells();
        const idx = cells.findIndex(c => c.id === props.cellId);
        if (idx < cells.length - 1) {
          engine.focusCell(cells[idx + 1].id);
          engine.setEditMode(cells[idx + 1].id);
        }
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exitEdit();
      } else if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const ta = e.target as HTMLTextAreaElement;
        const start = ta.selectionStart;
        engine.updateCellSource(props.cellId, ta.value.substring(0, start) + "  " + ta.value.substring(ta.selectionEnd));
        nextTick(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
      } else if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const ta = e.target as HTMLTextAreaElement;
        const { selectionStart: s, selectionEnd: end, value: v } = ta;
        engine.updateCellSource(props.cellId, v.substring(0, s) + "**" + v.substring(s, end) + "**" + v.substring(end));
      } else if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const ta = e.target as HTMLTextAreaElement;
        const { selectionStart: s, selectionEnd: end, value: v } = ta;
        engine.updateCellSource(props.cellId, v.substring(0, s) + "*" + v.substring(s, end) + "*" + v.substring(end));
      }
    };

    return () => {
      if (!cell.value) return null;

      const isEditing = !!cell.value.editing;
      const isEmpty = !cell.value.source.trim();
      const placeholder = PLACEHOLDERS[cell.value.type] || "Click to edit...";
      const cellType = cell.value.type;

      // Gutter
      const gutter = h("div", { class: "sci-nb-cell-gutter" }, [
        h("div", { class: "sci-nb-cell-handle", title: "Drag to reorder", innerHTML: '<svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor"><circle cx="3" cy="4" r="1.5" /><circle cx="9" cy="4" r="1.5" /><circle cx="3" cy="10" r="1.5" /><circle cx="9" cy="10" r="1.5" /><circle cx="3" cy="16" r="1.5" /><circle cx="9" cy="16" r="1.5" /></svg>' }),
        h("span", { class: "sci-nb-cell-index" }, `[${props.index + 1}]`),
      ]);

      // Type badge
      const typeIcon = CELL_TYPES.find(ct => ct.value === cellType)?.icon || cellType.slice(0, 2).toUpperCase();
      const badgeWrap = h("div", { class: "sci-nb-cell-badge-wrap" }, [
        h("button", {
          class: "sci-nb-cell-badge",
          title: "Change cell type",
          onClick: (e: MouseEvent) => { e.stopPropagation(); showTypeMenu.value = !showTypeMenu.value; },
        }, typeIcon),
        ...(showTypeMenu.value ? [
          h("div", { class: "sci-nb-type-menu" },
            CELL_TYPES.map(ct =>
              h("button", {
                class: `sci-nb-type-option ${cellType === ct.value ? "sci-nb-type-option--active" : ""}`,
                onClick: (e: MouseEvent) => { e.stopPropagation(); engine.setCellType(props.cellId, ct.value); showTypeMenu.value = false; },
              }, [h("span", { class: "sci-nb-type-option-icon" }, ct.icon), ct.label])
            )
          ),
        ] : []),
      ]);

      // Content — uses same CSS classes as React
      const contentChildren: any[] = [];
      if (isEditing && cellType === "latex") {
        // LaTeX cells get the visual math editor (same as React's MathEditor)
        contentChildren.push(
          h(VueMathEditor, {
            cellId: props.cellId,
            source: cell.value!.source,
            onExit: exitEdit,
          }),
        );
      } else if (isEditing && cellType === "image") {
        contentChildren.push(
          h(ImageCell, {
            cellId: props.cellId,
            source: cell.value!.source,
            metadata: cell.value!.metadata,
            onExit: exitEdit,
          }),
        );
      } else if (isEditing && cellType === "embed") {
        contentChildren.push(
          h(EmbedCell, {
            cellId: props.cellId,
            source: cell.value!.source,
            metadata: cell.value!.metadata,
            onExit: exitEdit,
          }),
        );
      } else if (isEditing && cellType === "table") {
        contentChildren.push(
          h(TableCell, {
            cellId: props.cellId,
            source: cell.value!.source,
            metadata: cell.value!.metadata,
            onExit: exitEdit,
          }),
        );
      } else if (isEditing) {
        contentChildren.push(
          h("textarea", {
            class: "sci-nb-editor",
            value: editorValue.value,
            onInput: handleInput,
            onKeydown: handleKeydown,
            placeholder,
            spellcheck: cellType === "markdown",
            rows: 1,
            ref: (el: any) => { if (el && isEditing) nextTick(() => { el.focus(); el.style.height = "auto"; el.style.height = `${Math.max(40, el.scrollHeight)}px`; }); },
          }),
          h("div", { class: "sci-nb-cell-hint", innerHTML: cellType === "code" ? '<kbd>Shift+Enter</kbd> next · <kbd>Esc</kbd> exit' : '<kbd>/</kbd> commands · <kbd>Shift+Enter</kbd> next · <kbd>Esc</kbd> exit' }),
        );
      } else {
        if (cellType === "image") {
          contentChildren.push(
            h("div", {
              class: "sci-nb-preview",
              innerHTML: isEmpty ? `<span class="sci-nb-placeholder">${placeholder}</span>` : renderImagePreview(cell.value!.source, cell.value!.metadata),
              onClick: enterEdit,
            })
          );
        } else if (cellType === "embed") {
          contentChildren.push(
            h("div", {
              class: "sci-nb-preview sci-nb-preview--embed",
              innerHTML: isEmpty ? `<span class="sci-nb-placeholder">${placeholder}</span>` : renderEmbedPreview(cell.value!.source, cell.value!.metadata),
              onClick: enterEdit,
            })
          );
        } else if (cellType === "table") {
          contentChildren.push(
            h("div", {
              class: "sci-nb-preview",
              innerHTML: isEmpty ? `<span class="sci-nb-placeholder">${placeholder}</span>` : renderTablePreview(cell.value!.source),
              onClick: enterEdit,
            })
          );
        } else if (cellType === "mermaid") {
          contentChildren.push(h(MermaidPreview, { source: cell.value!.source, onClick: enterEdit }));
        } else {
          contentChildren.push(
            h("div", {
              class: `sci-nb-preview ${isEmpty ? "sci-nb-preview--empty" : ""}`,
              innerHTML: isEmpty ? `<span class="sci-nb-placeholder">${placeholder}</span>` : renderedHtml.value,
              onClick: enterEdit,
            }),
          );
        }
      }

      const content = h("div", { class: "sci-nb-cell-content" }, contentChildren);

      // Cell actions
      const actions = h("div", { class: "sci-nb-cell-actions" }, [
        h("button", {
          class: "sci-nb-btn",
          disabled: props.index === 0,
          title: "Move up",
          onClick: (e: MouseEvent) => { e.stopPropagation(); engine.moveCell(props.cellId, props.index - 1); },
          innerHTML: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 11V3M7 3L3 7M7 3l4 4" stroke-linecap="round" stroke-linejoin="round" /></svg>',
        }),
        h("button", {
          class: "sci-nb-btn",
          disabled: props.index >= props.totalCells - 1,
          title: "Move down",
          onClick: (e: MouseEvent) => { e.stopPropagation(); engine.moveCell(props.cellId, props.index + 1); },
          innerHTML: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 3v8M7 11l-4-4M7 11l4-4" stroke-linecap="round" stroke-linejoin="round" /></svg>',
        }),
        h("button", {
          class: "sci-nb-btn",
          title: "Duplicate cell",
          onClick: (e: MouseEvent) => { e.stopPropagation(); engine.duplicateCell(props.cellId); },
          innerHTML: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M10 2H3.5A1.5 1.5 0 002 3.5V10" /></svg>',
        }),
        h("button", {
          class: "sci-nb-btn sci-nb-btn--danger",
          title: "Delete cell",
          onClick: (e: MouseEvent) => { e.stopPropagation(); engine.deleteCell(props.cellId); },
          innerHTML: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M6 6.5v3M8 6.5v3M4 4l.5 7a1.5 1.5 0 001.5 1.5h2A1.5 1.5 0 0010 11l.5-7" stroke-linecap="round" stroke-linejoin="round" /></svg>',
        }),
      ]);

      return h(
        "div",
        {
          class: [
            "sci-nb-cell",
            `sci-nb-cell--${cellType}`,
            isEditing ? "sci-nb-cell--edit" : "sci-nb-cell--view",
            hovered.value ? "sci-nb-cell--hover" : "",
          ].filter(Boolean).join(" "),
          "data-testid": `cell-${props.cellId}`,
          "data-cell-id": props.cellId,
          "data-editing": String(isEditing),
          "data-cell-type": cellType,
          role: "region",
          "aria-label": `${cellType} cell ${props.index + 1} of ${props.totalCells}${isEditing ? ", editing" : ""}`,
          "aria-selected": isEditing,
          tabindex: 0,
          draggable: !isEditing,
          onMouseenter: () => { hovered.value = true; },
          onMouseleave: () => { hovered.value = false; },
          onClick: () => engine.focusCell(props.cellId),
          onDragstart: (e: DragEvent) => { e.dataTransfer!.setData("text/plain", props.cellId); e.dataTransfer!.effectAllowed = "move"; },
          onDragover: (e: DragEvent) => { e.preventDefault(); e.dataTransfer!.dropEffect = "move"; },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            const did = e.dataTransfer!.getData("text/plain");
            if (did && did !== props.cellId) {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              engine.moveCell(did, e.clientY < rect.top + rect.height / 2 ? props.index : props.index + 1);
            }
          },
        },
        [gutter, badgeWrap, content, actions]
      );
    };
  },
});
