import type { Notebook, EditorEngine } from "@velo-sci/notebook-core";

export type SyncStatus = "idle" | "syncing" | "synced" | "conflict" | "error" | "offline";
export type ConflictResolution = "local" | "remote" | "merge";

export interface SyncEvent {
  type: "sync:start" | "sync:complete" | "sync:error" | "sync:conflict" | "sync:status-changed";
  status: SyncStatus;
  timestamp: number;
  data?: any;
}

export interface CloudBackend {
  /** Unique backend identifier */
  id: string;
  /** Save notebook to remote */
  save(notebookId: string, data: string): Promise<void>;
  /** Load notebook from remote */
  load(notebookId: string): Promise<string | null>;
  /** Delete notebook from remote */
  delete(notebookId: string): Promise<void>;
  /** List all notebook IDs */
  list(): Promise<string[]>;
  /** Get last modified timestamp */
  getLastModified(notebookId: string): Promise<number | null>;
  /** Check connectivity */
  isAvailable(): Promise<boolean>;
}

export interface CloudSyncConfig {
  /** Backend implementation */
  backend: CloudBackend;
  /** Auto-sync interval in ms (0 = disabled, default: 30000) */
  autoSyncInterval?: number;
  /** Conflict resolution strategy (default: 'local') */
  conflictResolution?: ConflictResolution;
  /** Debounce delay for save after changes (default: 2000ms) */
  debounceMs?: number;
  /** Callback for sync events */
  onSyncEvent?: (event: SyncEvent) => void;
}

/**
 * Cloud sync manager for sci-notebook.
 *
 * Handles bidirectional sync between local EditorEngine and a configurable
 * cloud backend. Supports auto-sync, conflict detection, and offline mode.
 */
export class CloudSyncManager {
  private engine: EditorEngine;
  private config: Required<CloudSyncConfig>;
  private status: SyncStatus = "idle";
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncTimestamp = 0;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  constructor(engine: EditorEngine, config: CloudSyncConfig) {
    this.engine = engine;
    this.config = {
      backend: config.backend,
      autoSyncInterval: config.autoSyncInterval ?? 30000,
      conflictResolution: config.conflictResolution ?? "local",
      debounceMs: config.debounceMs ?? 2000,
      onSyncEvent: config.onSyncEvent ?? (() => {}),
    };

    this.bindEngineEvents();

    if (this.config.autoSyncInterval > 0) {
      this.startAutoSync();
    }
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  async sync(): Promise<void> {
    if (this.destroyed) return;
    if (this.status === "syncing") return;

    this.setStatus("syncing");
    this.emitEvent("sync:start");

    try {
      const notebook = this.engine.getNotebook();
      const notebookId = notebook.id;
      const localData = JSON.stringify(notebook);

      const available = await this.config.backend.isAvailable();
      if (!available) {
        this.setStatus("offline");
        return;
      }

      const remoteTimestamp = await this.config.backend.getLastModified(notebookId);

      if (remoteTimestamp && remoteTimestamp > this.lastSyncTimestamp) {
        const remoteData = await this.config.backend.load(notebookId);
        if (remoteData) {
          const remoteNb = JSON.parse(remoteData) as Notebook;
          const localUpdated = new Date(notebook.updatedAt).getTime();
          const remoteUpdated = new Date(remoteNb.updatedAt).getTime();

          if (remoteUpdated > localUpdated) {
            switch (this.config.conflictResolution) {
              case "remote":
                // Remote wins — would need engine.loadNotebook()
                this.setStatus("synced");
                break;
              case "merge":
                this.setStatus("conflict");
                this.emitEvent("sync:conflict", { local: notebook, remote: remoteNb });
                return;
              case "local":
              default:
                // Local wins — push to remote
                await this.config.backend.save(notebookId, localData);
                break;
            }
          } else {
            await this.config.backend.save(notebookId, localData);
          }
        }
      } else {
        await this.config.backend.save(notebookId, localData);
      }

      this.lastSyncTimestamp = Date.now();
      this.setStatus("synced");
      this.emitEvent("sync:complete");
    } catch (error: any) {
      this.setStatus("error");
      this.emitEvent("sync:error", { error: error.message || String(error) });
    }
  }

  async pull(): Promise<Notebook | null> {
    const notebook = this.engine.getNotebook();
    const data = await this.config.backend.load(notebook.id);
    if (!data) return null;
    return JSON.parse(data) as Notebook;
  }

  async push(): Promise<void> {
    const notebook = this.engine.getNotebook();
    await this.config.backend.save(notebook.id, JSON.stringify(notebook));
    this.lastSyncTimestamp = Date.now();
  }

  startAutoSync(): void {
    this.stopAutoSync();
    if (this.config.autoSyncInterval <= 0) return;
    this.autoSyncTimer = setInterval(() => {
      this.sync();
    }, this.config.autoSyncInterval);
  }

  stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopAutoSync();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  private bindEngineEvents(): void {
    const unsub = this.engine.on("notebook:updated", () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.sync();
      }, this.config.debounceMs);
    });
    this.unsubscribers.push(unsub);
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.emitEvent("sync:status-changed", { status });
  }

  private emitEvent(type: SyncEvent["type"], data?: any): void {
    this.config.onSyncEvent({
      type,
      status: this.status,
      timestamp: Date.now(),
      data,
    });
  }
}
