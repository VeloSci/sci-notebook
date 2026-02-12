import { defineComponent, h, ref, type PropType } from "vue";
import { useNotebookEngine } from "./composables";

interface TableData {
  headers: string[];
  rows: string[][];
}

function parseMarkdownTable(source: string): TableData {
  const lines = source.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) {
    return { headers: ["Col 1", "Col 2", "Col 3"], rows: [["", "", ""], ["", "", ""]] };
  }
  const parseLine = (line: string): string[] =>
    line.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
  const headers = parseLine(lines[0]);
  const rows = lines.slice(2).map(parseLine);
  const colCount = headers.length;
  const normalizedRows = rows.map(row => {
    while (row.length < colCount) row.push("");
    return row.slice(0, colCount);
  });
  if (normalizedRows.length === 0) {
    normalizedRows.push(new Array(colCount).fill(""));
  }
  return { headers, rows: normalizedRows };
}

function toMarkdownTable(data: TableData): string {
  const { headers, rows } = data;
  const headerLine = `| ${headers.join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const rowLines = rows.map(row => `| ${row.join(" | ")} |`);
  return [headerLine, sepLine, ...rowLines].join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderTablePreview(source: string): string {
  const data = parseMarkdownTable(source);
  if (data.headers.length === 0) return "<p>Empty table</p>";
  const ths = data.headers.map(h => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = data.rows.map(row =>
    `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
  ).join("");
  return `<table class="sci-nb-rendered-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

export const TableCell = defineComponent({
  name: "TableCell",
  props: {
    cellId: { type: String, required: true },
    source: { type: String, required: true },
    metadata: { type: Object as PropType<Record<string, unknown>>, default: () => ({}) },
    onExit: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const engine = useNotebookEngine();
    const data = ref<TableData>(parseMarkdownTable(props.source));
    const hoverCol = ref<number | null>(null);
    const hoverRow = ref<number | null>(null);

    const syncToEngine = (newData: TableData) => {
      data.value = newData;
      engine.updateCellSource(props.cellId, toMarkdownTable(newData));
    };

    const updateHeader = (colIdx: number, value: string) => {
      const newHeaders = [...data.value.headers];
      newHeaders[colIdx] = value;
      syncToEngine({ ...data.value, headers: newHeaders });
    };

    const updateCell = (rowIdx: number, colIdx: number, value: string) => {
      const newRows = data.value.rows.map(r => [...r]);
      newRows[rowIdx][colIdx] = value;
      syncToEngine({ ...data.value, rows: newRows });
    };

    const addRow = () => {
      const newRow = new Array(data.value.headers.length).fill("");
      syncToEngine({ ...data.value, rows: [...data.value.rows, newRow] });
    };

    const addColumn = () => {
      const newHeaders = [...data.value.headers, `Col ${data.value.headers.length + 1}`];
      const newRows = data.value.rows.map(row => [...row, ""]);
      syncToEngine({ headers: newHeaders, rows: newRows });
    };

    const removeRow = (rowIdx: number) => {
      if (data.value.rows.length <= 1) return;
      const newRows = data.value.rows.filter((_, i) => i !== rowIdx);
      syncToEngine({ ...data.value, rows: newRows });
    };

    const removeColumn = (colIdx: number) => {
      if (data.value.headers.length <= 1) return;
      const newHeaders = data.value.headers.filter((_, i) => i !== colIdx);
      const newRows = data.value.rows.map(row => row.filter((_, i) => i !== colIdx));
      syncToEngine({ headers: newHeaders, rows: newRows });
    };

    return () => {
      const headerCells = data.value.headers.map((hdr, ci) =>
        h("th", {
          key: ci,
          class: "sci-nb-table-header-cell",
          onMouseenter: () => { hoverCol.value = ci; },
          onMouseleave: () => { hoverCol.value = null; },
        }, [
          h("input", {
            value: hdr,
            onInput: (e: Event) => updateHeader(ci, (e.target as HTMLInputElement).value),
            placeholder: `Col ${ci + 1}`,
          }),
          data.value.headers.length > 1 && hoverCol.value === ci
            ? h("button", {
                class: "sci-nb-table-delete-btn",
                onClick: () => removeColumn(ci),
                title: "Delete column",
              }, "✕")
            : null,
        ])
      );

      const bodyRows = data.value.rows.map((row, ri) =>
        h("tr", {
          key: ri,
          onMouseenter: () => { hoverRow.value = ri; },
          onMouseleave: () => { hoverRow.value = null; },
        },
          row.map((cell, ci) => {
            const isLastCol = ci === row.length - 1;
            return h("td", {
              key: ci,
              class: isLastCol ? "sci-nb-table-row-end" : "",
            }, [
              h("input", {
                value: cell,
                onInput: (e: Event) => updateCell(ri, ci, (e.target as HTMLInputElement).value),
                placeholder: "...",
              }),
              isLastCol && data.value.rows.length > 1 && hoverRow.value === ri
                ? h("button", {
                    class: "sci-nb-table-delete-btn",
                    onClick: () => removeRow(ri),
                    title: "Delete row",
                  }, "✕")
                : null,
            ]);
          })
        )
      );

      return h("div", {
        class: "sci-nb-table-editor",
        onKeydown: (e: KeyboardEvent) => {
          if (e.key === "Escape") { e.preventDefault(); props.onExit!(); }
        },
      }, [
        h("div", { class: "sci-nb-table-toolbar" }, [
          h("button", { onClick: addRow }, "+ Row"),
          h("button", { onClick: addColumn }, "+ Column"),
        ]),
        h("table", null, [
          h("thead", null, [h("tr", null, headerCells)]),
          h("tbody", null, bodyRows),
        ]),
        h("div", { class: "sci-nb-cell-hint" }, [
          h("kbd", null, "Tab"), " next cell \u00B7 ", h("kbd", null, "Esc"), " exit",
        ]),
      ]);
    };
  },
});
