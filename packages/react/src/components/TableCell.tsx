import React, { useState, useCallback } from "react";
import { useSciNotebook } from "../hooks";

interface TableCellProps {
  cellId: string;
  source: string;
  metadata: Record<string, unknown>;
  onExit: () => void;
}

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

export const TableCell: React.FC<TableCellProps> = ({ cellId, source, onExit }) => {
  const engine = useSciNotebook();
  const [data, setData] = useState<TableData>(() => parseMarkdownTable(source));
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const syncToEngine = useCallback((newData: TableData) => {
    setData(newData);
    engine.updateCellSource(cellId, toMarkdownTable(newData));
  }, [engine, cellId]);

  const updateHeader = useCallback((colIdx: number, value: string) => {
    const newHeaders = [...data.headers];
    newHeaders[colIdx] = value;
    syncToEngine({ ...data, headers: newHeaders });
  }, [data, syncToEngine]);

  const updateCell = useCallback((rowIdx: number, colIdx: number, value: string) => {
    const newRows = data.rows.map(r => [...r]);
    newRows[rowIdx][colIdx] = value;
    syncToEngine({ ...data, rows: newRows });
  }, [data, syncToEngine]);

  const addRow = useCallback(() => {
    const newRow = new Array(data.headers.length).fill("");
    syncToEngine({ ...data, rows: [...data.rows, newRow] });
  }, [data, syncToEngine]);

  const addColumn = useCallback(() => {
    const newHeaders = [...data.headers, `Col ${data.headers.length + 1}`];
    const newRows = data.rows.map(row => [...row, ""]);
    syncToEngine({ headers: newHeaders, rows: newRows });
  }, [data, syncToEngine]);

  const removeRow = useCallback((rowIdx: number) => {
    if (data.rows.length <= 1) return;
    const newRows = data.rows.filter((_, i) => i !== rowIdx);
    syncToEngine({ ...data, rows: newRows });
  }, [data, syncToEngine]);

  const removeColumn = useCallback((colIdx: number) => {
    if (data.headers.length <= 1) return;
    const newHeaders = data.headers.filter((_, i) => i !== colIdx);
    const newRows = data.rows.map(row => row.filter((_, i) => i !== colIdx));
    syncToEngine({ headers: newHeaders, rows: newRows });
  }, [data, syncToEngine]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    }
  }, [onExit]);

  return (
    <div className="sci-nb-table-editor" onKeyDown={handleKeyDown}>
      <div className="sci-nb-table-toolbar">
        <button onClick={addRow}>+ Row</button>
        <button onClick={addColumn}>+ Column</button>
      </div>
      <table>
        <thead>
          <tr>
            {data.headers.map((h, ci) => (
              <th
                key={ci}
                className="sci-nb-table-header-cell"
                onMouseEnter={() => setHoverCol(ci)}
                onMouseLeave={() => setHoverCol(null)}
              >
                <input
                  value={h}
                  onChange={e => updateHeader(ci, e.target.value)}
                  placeholder={`Col ${ci + 1}`}
                />
                {data.headers.length > 1 && hoverCol === ci && (
                  <button
                    className="sci-nb-table-delete-btn"
                    onClick={() => removeColumn(ci)}
                    title="Delete column"
                  >
                    ✕
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr
              key={ri}
              onMouseEnter={() => setHoverRow(ri)}
              onMouseLeave={() => setHoverRow(null)}
            >
              {row.map((cell, ci) => {
                const isLastCol = ci === row.length - 1;
                return (
                  <td
                    key={ci}
                    className={isLastCol ? "sci-nb-table-row-end" : ""}
                  >
                    <input
                      value={cell}
                      onChange={e => updateCell(ri, ci, e.target.value)}
                      placeholder="..."
                    />
                    {isLastCol && data.rows.length > 1 && hoverRow === ri && (
                      <button
                        className="sci-nb-table-delete-btn"
                        onClick={() => removeRow(ri)}
                        title="Delete row"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sci-nb-cell-hint">
        <kbd>Tab</kbd> next cell &middot; <kbd>Esc</kbd> exit
      </div>
    </div>
  );
};

export function renderTablePreview(source: string): string {
  const data = parseMarkdownTable(source);
  if (data.headers.length === 0) return "<p>Empty table</p>";

  const ths = data.headers.map(h => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = data.rows.map(row =>
    `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`
  ).join("");

  return `<table class="sci-nb-rendered-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
