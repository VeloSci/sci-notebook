import React from "react";
import { Notebook, VersionHistory } from "@velo-sci/notebook-core";

interface JsonModalProps {
  show: boolean;
  content: string;
  onClose: () => void;
  onContentChange: (val: string) => void;
  onLoad: () => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ show, content, onClose, onContentChange, onLoad }) => {
  if (!show) return null;
  const isExport = !!content && content.length > 10;

  return (
    <div className="json-modal-overlay" onClick={onClose}>
      <div className="json-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isExport ? "Notebook JSON" : "Import Notebook"}</h2>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder='Paste notebook JSON here...'
          readOnly={isExport}
        />
        <div className="json-modal-actions">
          <button className="app-btn" onClick={onClose}>Close</button>
          {isExport && (
            <button className="app-btn" onClick={() => navigator.clipboard.writeText(content)}>Copy</button>
          )}
          {!isExport && (
            <button className="app-btn app-btn--active" onClick={onLoad}>Load</button>
          )}
        </div>
      </div>
    </div>
  );
};

interface HistoryModalProps {
  show: boolean;
  history: VersionHistory;
  onClose: () => void;
  simpleMarkdown: (s: string) => string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ show, history, onClose }) => {
  if (!show) return null;
  const entries = history.getEntries();

  return (
    <div className="json-modal-overlay" onClick={onClose}>
      <div className="json-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Version History</h2>
        <div className="version-list">
          {entries.length === 0 ? (
            <p className="version-empty">No versions saved yet. Click "Save Version" to create a snapshot.</p>
          ) : (
            entries.slice().reverse().map((entry, i, arr) => (
              <div key={entry.id} className="version-item">
                <div className="version-item-header">
                  <strong>{entry.description}</strong>
                  <span className="version-item-time">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div className="version-item-meta">
                  {entry.cellCount} cells · ID: {entry.id}
                  {i < arr.length - 1 && (() => {
                    const prev = arr[i + 1];
                    const summary = history.diffSummary(prev.id, entry.id);
                    return summary ? <span className="version-diff"> · {summary}</span> : null;
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="json-modal-actions">
          <button className="app-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
