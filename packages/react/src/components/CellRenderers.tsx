import React from "react";
import { Cell as ICell, CellType } from "@velo-sci/notebook-core";
import { FloatingToolbar } from "./FloatingToolbar";
import { MathEditor } from "./MathEditor";
import { ImageCell, renderImagePreview } from "./ImageCell";
import { EmbedCell, renderEmbedPreview } from "./EmbedCell";
import { SlashCommand } from "./SlashCommand";
import { TableCell, renderTablePreview } from "./TableCell";
import { MermaidPreview } from "./MermaidCell";
import { CodeEditor } from "./CodeEditor";
import { ComponentCell } from "./ComponentCell";

/** Render the edit-mode content for a cell */
export function renderEditMode(
  cell: ICell,
  cellId: string,
  engine: { updateCellSource: (id: string, src: string) => void },
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  handleSourceChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void,
  placeholder: string,
  exitEdit: () => void,
  slashState: { query: string; pos: { top: number; left: number } } | null,
  onSlashSelect: (type: CellType) => void,
  onSlashClose: () => void,
): React.ReactNode {
  if (cell.type === "latex") {
    return <MathEditor cellId={cellId} source={cell.source} onExit={exitEdit} />;
  }
  if (cell.type === "image") {
    return <ImageCell cellId={cellId} source={cell.source} metadata={cell.metadata} onExit={exitEdit} />;
  }
  if (cell.type === "embed") {
    return <EmbedCell cellId={cellId} source={cell.source} metadata={cell.metadata} onExit={exitEdit} />;
  }
  if (cell.type === "table") {
    return <TableCell cellId={cellId} source={cell.source} metadata={cell.metadata} onExit={exitEdit} />;
  }

  // Code or Component cells: syntax-highlighted editor
  if (cell.type === "code" || cell.type === "component") {
    const lang = cell.type === "component" ? "json" : ((cell.metadata.language as string) || "javascript");
    return (
      <>
        <CodeEditor
          cellId={cellId}
          source={cell.source}
          language={lang}
          onChange={(val) => engine.updateCellSource(cellId, val)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <div className="sci-nb-cell-hint">
          <kbd>Shift+Enter</kbd> next &middot; <kbd>Esc</kbd> exit
        </div>
      </>
    );
  }

  // Default: textarea editor (markdown, raw, etc.)
  return (
    <>
      {cell.type === "markdown" && (
        <FloatingToolbar cellId={cellId} textareaRef={textareaRef} />
      )}
      <textarea
        ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
        className="sci-nb-editor"
        value={cell.source}
        onChange={handleSourceChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={cell.type === "markdown"}
        rows={1}
      />
      {slashState && (
        <SlashCommand
          position={slashState.pos}
          query={slashState.query}
          onSelect={onSlashSelect}
          onClose={onSlashClose}
        />
      )}
      <div className="sci-nb-cell-hint">
        <kbd>/</kbd> commands &middot; <kbd>Shift+Enter</kbd> next &middot; <kbd>Esc</kbd> exit
      </div>
    </>
  );
}

/** Render the view-mode content for a cell */
export function renderViewMode(
  cell: ICell,
  renderedHtml: string,
  isEmpty: boolean,
  placeholder: string,
  enterEdit: () => void,
  components?: Record<string, React.ElementType>,
): React.ReactNode {
  if (cell.type === "image") {
    const html = renderImagePreview(cell.source, cell.metadata);
    return (
      <div className="sci-nb-preview" onClick={enterEdit} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  if (cell.type === "embed") {
    const html = renderEmbedPreview(cell.source, cell.metadata);
    return (
      <div className="sci-nb-preview sci-nb-preview--embed" onClick={enterEdit} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  if (cell.type === "table") {
    const html = renderTablePreview(cell.source);
    return (
      <div className="sci-nb-preview" onClick={enterEdit} dangerouslySetInnerHTML={{ __html: html }} />
    );
  }

  if (cell.type === "mermaid") {
    return <MermaidPreview source={cell.source} onClick={enterEdit} />;
  }

  if (cell.type === "component") {
    return (
      <div className="sci-nb-preview sci-nb-preview--component" onClick={enterEdit}>
        <ComponentCell cellId={cell.id} source={cell.source} components={components} />
      </div>
    );
  }

  return (
    <div
      className={`sci-nb-preview ${isEmpty ? "sci-nb-preview--empty" : ""}`}
      onClick={enterEdit}
      dangerouslySetInnerHTML={
        isEmpty
          ? { __html: `<span class="sci-nb-placeholder">${placeholder}</span>` }
          : { __html: renderedHtml }
      }
    />
  );
}

