import { VersionHistory } from "@velo-sci/notebook-core";

export function showJsonModal(content: string, readOnly: boolean) {
  const overlay = document.createElement("div");
  overlay.className = "json-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement("div");
  modal.className = "json-modal";
  modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = `<h2>${content ? "Notebook JSON" : "Import Notebook"}</h2>`;
  const ta = document.createElement("textarea");
  ta.value = content;
  ta.placeholder = "Paste notebook JSON here...";
  ta.readOnly = readOnly;
  modal.appendChild(ta);
  const actions = document.createElement("div");
  actions.className = "json-modal-actions";
  const closeBtn = document.createElement("button");
  closeBtn.className = "app-btn"; closeBtn.textContent = "Close";
  closeBtn.onclick = () => overlay.remove();
  actions.appendChild(closeBtn);
  if (readOnly && content) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "app-btn"; copyBtn.textContent = "Copy";
    copyBtn.onclick = () => navigator.clipboard.writeText(ta.value);
    actions.appendChild(copyBtn);
  }
  if (!readOnly) {
    const loadBtn = document.createElement("button");
    loadBtn.className = "app-btn app-btn--active"; loadBtn.textContent = "Load";
    loadBtn.onclick = () => {
      try {
        const nb = JSON.parse(ta.value);
        if (!nb.cells || !nb.id) { alert("Invalid JSON"); return; }
        overlay.remove();
        window.location.reload();
      } catch { alert("Error parsing JSON"); }
    };
    actions.appendChild(loadBtn);
  }
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

export function showHistoryModal(versionHistory: VersionHistory) {
  const overlay = document.createElement("div");
  overlay.className = "json-modal-overlay";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement("div");
  modal.className = "json-modal";
  modal.onclick = (e) => e.stopPropagation();
  modal.innerHTML = "<h2>Version History</h2>";
  const list = document.createElement("div");
  list.className = "version-list";
  const entries = versionHistory.getEntries();
  if (entries.length === 0) {
    list.innerHTML = '<p class="version-empty">No versions saved yet. Click "Save Version" to create a snapshot.</p>';
  } else {
    for (const entry of [...entries].reverse()) {
      const item = document.createElement("div");
      item.className = "version-item";
      item.innerHTML = `<div class="version-item-header"><strong>${entry.description}</strong><span class="version-item-time">${new Date(entry.timestamp).toLocaleString()}</span></div><div class="version-item-meta">${entry.cellCount} cells · ID: ${entry.id}</div>`;
      list.appendChild(item);
    }
  }
  modal.appendChild(list);
  const actions = document.createElement("div");
  actions.className = "json-modal-actions";
  const closeBtn = document.createElement("button");
  closeBtn.className = "app-btn"; closeBtn.textContent = "Close";
  closeBtn.onclick = () => overlay.remove();
  actions.appendChild(closeBtn);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
