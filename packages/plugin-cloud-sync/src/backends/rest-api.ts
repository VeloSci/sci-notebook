import type { CloudBackend } from "../cloud-sync";

export interface RestAPIConfig {
  /** Base URL of the API (e.g., 'https://api.example.com/notebooks') */
  baseUrl: string;
  /** Authorization header value (e.g., 'Bearer token123') */
  authorization?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
}

/**
 * REST API backend for cloud sync.
 *
 * Expected API endpoints:
 * - GET    {baseUrl}/{id}       → { data: string, lastModified: number }
 * - PUT    {baseUrl}/{id}       → body: { data: string }
 * - DELETE {baseUrl}/{id}
 * - GET    {baseUrl}            → { notebooks: string[] }
 * - HEAD   {baseUrl}/{id}       → Last-Modified header
 */
export class RestAPIBackend implements CloudBackend {
  readonly id = "rest-api";
  private config: Required<RestAPIConfig>;

  constructor(config: RestAPIConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ""),
      authorization: config.authorization ?? "",
      headers: config.headers ?? {},
      timeout: config.timeout ?? 10000,
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    };
    if (this.config.authorization) {
      headers["Authorization"] = this.config.authorization;
    }
    return headers;
  }

  private async fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeout);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async save(notebookId: string, data: string): Promise<void> {
    const res = await this.fetchWithTimeout(`${this.config.baseUrl}/${notebookId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.status} ${res.statusText}`);
  }

  async load(notebookId: string): Promise<string | null> {
    const res = await this.fetchWithTimeout(`${this.config.baseUrl}/${notebookId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Load failed: ${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.data ?? null;
  }

  async delete(notebookId: string): Promise<void> {
    const res = await this.fetchWithTimeout(`${this.config.baseUrl}/${notebookId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
    }
  }

  async list(): Promise<string[]> {
    const res = await this.fetchWithTimeout(this.config.baseUrl, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`List failed: ${res.status} ${res.statusText}`);
    const json = await res.json();
    return json.notebooks ?? [];
  }

  async getLastModified(notebookId: string): Promise<number | null> {
    try {
      const res = await this.fetchWithTimeout(`${this.config.baseUrl}/${notebookId}`, {
        method: "HEAD",
        headers: this.getHeaders(),
      });
      if (res.status === 404) return null;
      const lm = res.headers.get("Last-Modified");
      return lm ? new Date(lm).getTime() : null;
    } catch {
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(this.config.baseUrl, {
        method: "HEAD",
        headers: this.getHeaders(),
      });
      return res.ok || res.status === 405;
    } catch {
      return false;
    }
  }
}
