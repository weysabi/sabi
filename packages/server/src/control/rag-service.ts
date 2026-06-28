import { RagManager } from "weysabi/rag";
import type { RagManagerConfig } from "weysabi/rag";

export { RagManager };
export type { RagManagerConfig };

export function createRagService(config?: RagManagerConfig) {
  const manager = new RagManager(config);

  return {
    manager,

    project(id: string) {
      return manager.project(id);
    },

    has(id: string) {
      return manager.has(id);
    },

    close() {
      manager.close();
    },
  };
}

export type RagService = ReturnType<typeof createRagService>;
