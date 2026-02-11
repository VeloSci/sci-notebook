import type { SciNotebookPlugin, PluginContext } from "@velo-sci/notebook-core";
import { CloudSyncManager, type CloudSyncConfig } from "./cloud-sync";

/**
 * Create the cloud sync plugin for sci-notebook.
 */
export function createCloudSyncPlugin(config: CloudSyncConfig): SciNotebookPlugin {
  let manager: CloudSyncManager | null = null;

  return {
    id: "sci-notebook-cloud-sync",
    name: "Cloud Sync Plugin",
    version: "0.6.1",
    apiVersion: "1",

    setup(ctx: PluginContext) {
      ctx.on("sync:trigger", () => {
        manager?.sync();
      });

      ctx.on("sync:push", () => {
        manager?.push();
      });

      ctx.on("sync:pull", async () => {
        const nb = await manager?.pull();
        if (nb) {
          ctx.emit("sync:pulled", nb);
        }
      });

      ctx.log.info("Cloud sync plugin initialized");
    },

    teardown() {
      manager?.destroy();
      manager = null;
    },
  };
}
