export const cloudSyncNotebook = {
  id: "doc-cloud-sync",
  title: "Cloud Sync Plugin",
  cells: [
    {
      id: "cs-intro",
      type: "markdown",
      source: "# Cloud Sync Plugin\n\nSynchronize notebooks across devices with `@velo-sci/notebook-plugin-cloud-sync`. Supports multiple backends, conflict resolution, auto-sync, and offline mode.",
      metadata: {},
    },
    {
      id: "cs-quick",
      type: "code",
      source: "import { CloudSyncManager, LocalStorageBackend } from '@velo-sci/notebook-plugin-cloud-sync';\n\nconst manager = new CloudSyncManager({\n  backend: new LocalStorageBackend(),\n  autoSyncInterval: 30000,       // 30 seconds\n  conflictResolution: 'local',   // 'local' | 'remote' | 'merge'\n});\n\n// Sync operations\nawait manager.push(notebook);              // Push local → remote\nconst remote = await manager.pull(id);     // Pull remote → local\nawait manager.sync(notebook);              // Bidirectional sync\n\n// Auto-sync\nmanager.startAutoSync(notebook);\nmanager.stopAutoSync();\n\nmanager.destroy();",
      metadata: { language: "typescript" },
    },
    {
      id: "cs-backends",
      type: "markdown",
      source: "## Backends\n\n### LocalStorageBackend\nStores notebooks in the browser's `localStorage`. Ideal for offline-first apps and testing.\n\n### RestAPIBackend\nSyncs with a REST API server. Supports bearer token and API key authentication.\n\n### Custom Backend\nImplement the `CloudBackend` interface for any storage provider (Firebase, Supabase, S3, etc.).",
      metadata: {},
    },
    {
      id: "cs-rest",
      type: "code",
      source: "import { RestAPIBackend } from '@velo-sci/notebook-plugin-cloud-sync';\n\nconst backend = new RestAPIBackend({\n  baseUrl: 'https://api.example.com/notebooks',\n  auth: {\n    type: 'bearer',\n    token: 'your-api-token',\n  },\n  timeout: 10000,\n});\n\n// Expected REST endpoints:\n// GET    /{id}   → Fetch notebook\n// PUT    /{id}   → Create/update notebook\n// DELETE /{id}   → Delete notebook\n// GET    /       → List all notebooks",
      metadata: { language: "typescript" },
    },
    {
      id: "cs-custom",
      type: "code",
      source: "import type { CloudBackend } from '@velo-sci/notebook-plugin-cloud-sync';\n\n// Implement your own backend\nclass FirebaseBackend implements CloudBackend {\n  async get(id: string): Promise<Notebook | null> { /* ... */ }\n  async put(notebook: Notebook): Promise<void> { /* ... */ }\n  async delete(id: string): Promise<void> { /* ... */ }\n  async list(): Promise<{ id: string; updatedAt: string }[]> { /* ... */ }\n}",
      metadata: { language: "typescript" },
    },
    {
      id: "cs-conflict-diagram",
      type: "mermaid",
      source: "graph TD\n  A[Push/Pull] --> B{Conflict?}\n  B -->|No| C[Apply Changes]\n  B -->|Yes| D{Resolution Strategy}\n  D -->|local| E[Keep Local]\n  D -->|remote| F[Keep Remote]\n  D -->|merge| G[Cell-Level Merge]\n  G -->|Success| C\n  G -->|Failure| E",
      metadata: {},
    },
    {
      id: "cs-conflict",
      type: "markdown",
      source: "## Conflict Resolution\n\n| Strategy | Behavior |\n|----------|----------|\n| `local` | Local version always wins |\n| `remote` | Remote version always wins |\n| `merge` | Attempts cell-level merge (falls back to local on failure) |",
      metadata: {},
    },
    {
      id: "cs-events",
      type: "code",
      source: "// Listen to sync events\nmanager.on((event) => {\n  switch (event.type) {\n    case 'sync:started':   console.log('Sync started');           break;\n    case 'sync:completed': console.log('Sync completed');         break;\n    case 'sync:error':     console.error('Failed:', event.error); break;\n    case 'sync:conflict':  console.warn('Conflict:', event.resolution); break;\n  }\n});",
      metadata: { language: "typescript" },
    },
    {
      id: "cs-plugin",
      type: "code",
      source: "// Use as EditorEngine plugin\nimport { createCloudSyncPlugin } from '@velo-sci/notebook-plugin-cloud-sync';\n\nconst engine = createNotebook({\n  notebook: myNotebook,\n  config: {\n    plugins: [\n      createCloudSyncPlugin({\n        backend: new LocalStorageBackend(),\n        autoSyncInterval: 30000,\n      }),\n    ],\n  },\n});\n\n// Plugin events: 'sync:trigger', 'sync:push', 'sync:pull'",
      metadata: { language: "typescript" },
    },
  ],
  metadata: { author: "sci-notebook-docs" },
  version: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};
