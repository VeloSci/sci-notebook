import type { CloudBackend } from "../cloud-sync";

/**
 * LocalStorage-based backend for cloud sync.
 * Useful for offline-first apps and testing.
 */
export class LocalStorageBackend implements CloudBackend {
  readonly id = "local-storage";
  private prefix: string;

  constructor(prefix: string = "sci-nb-sync:") {
    this.prefix = prefix;
  }

  async save(notebookId: string, data: string): Promise<void> {
    localStorage.setItem(this.prefix + notebookId, data);
    localStorage.setItem(this.prefix + notebookId + ":ts", String(Date.now()));
  }

  async load(notebookId: string): Promise<string | null> {
    return localStorage.getItem(this.prefix + notebookId);
  }

  async delete(notebookId: string): Promise<void> {
    localStorage.removeItem(this.prefix + notebookId);
    localStorage.removeItem(this.prefix + notebookId + ":ts");
  }

  async list(): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix) && !key.endsWith(":ts")) {
        ids.push(key.slice(this.prefix.length));
      }
    }
    return ids;
  }

  async getLastModified(notebookId: string): Promise<number | null> {
    const ts = localStorage.getItem(this.prefix + notebookId + ":ts");
    return ts ? parseInt(ts, 10) : null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const key = "__sci_nb_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}
