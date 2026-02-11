<script setup>
import { cloudSyncNotebook } from '../.vitepress/theme/notebooks/cloud-sync'
</script>

# Cloud Sync Plugin

<InteractiveDoc :notebook="cloudSyncNotebook" title="Cloud Sync — Interactive Notebook" />

Synchronize notebooks across devices with `@velo-sci/notebook-plugin-cloud-sync`.

---

## Installation

```bash
pnpm add @velo-sci/notebook-plugin-cloud-sync
```

---

## Quick Start

### As a Plugin

```typescript
import { createCloudSyncPlugin } from "@velo-sci/notebook-plugin-cloud-sync";
import { LocalStorageBackend } from "@velo-sci/notebook-plugin-cloud-sync";

const engine = createNotebook({
  notebook: myNotebook,
  config: {
    plugins: [
      createCloudSyncPlugin({
        backend: new LocalStorageBackend(),
        autoSyncInterval: 30000, // 30 seconds
      }),
    ],
  },
});
```

### Standalone Manager

```typescript
import { CloudSyncManager, LocalStorageBackend } from "@velo-sci/notebook-plugin-cloud-sync";

const manager = new CloudSyncManager({
  backend: new LocalStorageBackend(),
  autoSyncInterval: 30000,
  conflictResolution: "local",
});

// Sync operations
await manager.push(notebook);
const remote = await manager.pull(notebook.id);
await manager.sync(notebook);

// Auto-sync
manager.startAutoSync(notebook);
manager.stopAutoSync();

// Clean up
manager.destroy();
```

---

## Backends

### LocalStorageBackend

Stores notebooks in the browser's `localStorage`. Ideal for offline-first apps and testing.

```typescript
import { LocalStorageBackend } from "@velo-sci/notebook-plugin-cloud-sync";

const backend = new LocalStorageBackend({
  prefix: "sci-nb-", // localStorage key prefix (default: "sci-nb-sync-")
});
```

### RestAPIBackend

Syncs with a REST API server. Supports authentication, timeouts, and full CRUD.

```typescript
import { RestAPIBackend } from "@velo-sci/notebook-plugin-cloud-sync";

const backend = new RestAPIBackend({
  baseUrl: "https://api.example.com/notebooks",
  auth: {
    type: "bearer",
    token: "your-api-token",
  },
  timeout: 10000, // 10 seconds
});
```

#### REST API Endpoints

The backend expects these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/{id}` | Fetch a notebook by ID |
| `PUT` | `/{id}` | Create or update a notebook |
| `DELETE` | `/{id}` | Delete a notebook |
| `GET` | `/` | List all notebooks |

#### Authentication Options

```typescript
// Bearer token
{ type: "bearer", token: "..." }

// API key header
{ type: "apikey", key: "X-API-Key", value: "..." }

// No auth
undefined
```

### Custom Backend

Implement the `CloudBackend` interface to create your own backend:

```typescript
import type { CloudBackend } from "@velo-sci/notebook-plugin-cloud-sync";

class MyBackend implements CloudBackend {
  async get(id: string): Promise<Notebook | null> { ... }
  async put(notebook: Notebook): Promise<void> { ... }
  async delete(id: string): Promise<void> { ... }
  async list(): Promise<{ id: string; updatedAt: string }[]> { ... }
}
```

---

## Conflict Resolution

When local and remote versions differ, the manager uses one of three strategies:

| Strategy | Behavior |
|----------|----------|
| `local` | Local version always wins |
| `remote` | Remote version always wins |
| `merge` | Attempts cell-level merge (falls back to local on failure) |

```typescript
const manager = new CloudSyncManager({
  backend: new RestAPIBackend({ baseUrl: "..." }),
  conflictResolution: "merge",
});
```

---

## Events

The sync manager emits events you can listen to:

```typescript
manager.on((event) => {
  switch (event.type) {
    case "sync:started":
      console.log("Sync started");
      break;
    case "sync:completed":
      console.log("Sync completed");
      break;
    case "sync:error":
      console.error("Sync failed:", event.error);
      break;
    case "sync:conflict":
      console.warn("Conflict detected, resolved with:", event.resolution);
      break;
  }
});
```

---

## Plugin Events

When using `createCloudSyncPlugin()`, the plugin listens for these events:

| Event | Payload | Action |
|-------|---------|--------|
| `sync:trigger` | `{ notebook }` | Triggers a full sync |
| `sync:push` | `{ notebook }` | Pushes local to remote |
| `sync:pull` | `{ notebookId }` | Pulls remote to local |

---

## Configuration

```typescript
interface CloudSyncOptions {
  /** Backend implementation */
  backend: CloudBackend;

  /** Auto-sync interval in ms (default: 30000) */
  autoSyncInterval?: number;

  /** Conflict resolution strategy (default: "local") */
  conflictResolution?: "local" | "remote" | "merge";

  /** Enable offline mode — queues operations when offline (default: true) */
  offlineMode?: boolean;
}
```

---

## API Reference

### `CloudSyncManager`

```typescript
class CloudSyncManager {
  constructor(options: CloudSyncOptions);

  push(notebook: Notebook): Promise<void>;
  pull(id: string): Promise<Notebook | null>;
  sync(notebook: Notebook): Promise<Notebook>;

  startAutoSync(notebook: Notebook): void;
  stopAutoSync(): void;

  on(handler: (event: SyncEvent) => void): void;
  destroy(): void;
}
```

### `createCloudSyncPlugin(options)`

Returns a `SciNotebookPlugin` that registers sync event handlers and manages auto-sync lifecycle.
