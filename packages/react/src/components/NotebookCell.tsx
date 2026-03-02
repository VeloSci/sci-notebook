import React, { useMemo } from "react";
import { Notebook } from "@velo-sci/notebook-core";
import { SciNotebook } from "./SciNotebook";

export interface NotebookCellProps {
  cellId: string;
  source: string;
  metadata: Record<string, any>;
  readOnly?: boolean;
  engine?: any;
  onExit?: () => void;
}

export const NotebookCell: React.FC<NotebookCellProps> = ({
  cellId,
  source,
  metadata,
  readOnly,
  engine,
  onExit
}) => {
  const isReadOnly = metadata?.readOnly || readOnly || false;

  const nestedNotebook = useMemo(() => {
    try {
      if (source) {
        return JSON.parse(source) as Notebook;
      }
    } catch(e) {}
    
    return {
      id: `nested-${cellId}`,
      title: "Nested Notebook",
      cells: [],
      metadata: {},
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Notebook;
  }, [source, cellId]);

  const handleNestedChange = (updated: Notebook) => {
    if (engine && engine.updateCellSource) {
      engine.updateCellSource(cellId, JSON.stringify(updated));
    }
  };

  const toggleReadOnly = () => {
    if (engine && engine.updateCellMetadata) {
      engine.updateCellMetadata(cellId, { readOnly: !metadata?.readOnly });
    }
  };

  return (
    <div className="sci-nb-nested" style={{ 
      border: "1px solid var(--sci-nb-border, #e5e7eb)", 
      borderRadius: "6px", 
      padding: "1px", 
      background: "var(--sci-nb-bg, #fafafa)",
      marginTop: "8px",
      marginBottom: "8px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Top bar for NotebookCell settings when editing */}
      {!readOnly && engine && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 12px",
          borderBottom: "1px solid var(--sci-nb-border, #e5e7eb)",
          background: "var(--sci-nb-bg-toolbar, #f1f5f9)",
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px",
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--sci-nb-text, #333)"
        }}>
          <div>Nested Notebook (Level 1)</div>
          <div style={{ display: "flex", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={!!metadata?.readOnly} 
                onChange={toggleReadOnly}
              />
              Read-Only for users
            </label>
            {onExit && (
              <button 
                onClick={onExit}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--sci-nb-text-dim, #64748b)"
                }}
                title="Exit Edit Mode"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
      
      <div style={{ padding: "8px" }}>
        <SciNotebook
          notebook={nestedNotebook}
          level={1}
          onChange={handleNestedChange}
          readOnly={isReadOnly}
          showToolbar={false}
          showTOC={false}
          theme="inherit"
          onExit={onExit}
        />

      </div>
    </div>
  );
};
