import type { PromptStore } from "./store";
import type { ManagedPrompt, PromptVersion, Page } from "./types";
import {
  CreatePromptInputSchema,
  UpdatePromptInputSchema,
  CreatePromptVersionInputSchema,
  PageOptionsSchema,
} from "./types";

export function createPromptService(store: PromptStore) {
  return {
    async create(input: unknown): Promise<ManagedPrompt> {
      const parsed = CreatePromptInputSchema.parse(input);
      return store.createPrompt(parsed);
    },

    async get(projectId: string, promptId: string): Promise<ManagedPrompt | null> {
      return store.getPrompt(projectId, promptId);
    },

    async getBySlug(projectId: string, slug: string): Promise<ManagedPrompt | null> {
      return store.getPromptBySlug(projectId, slug);
    },

    async list(projectId: string, options?: unknown): Promise<Page<ManagedPrompt>> {
      const parsed = PageOptionsSchema.parse(options ?? {});
      return store.listPrompts(projectId, parsed);
    },

    async update(projectId: string, promptId: string, input: unknown): Promise<ManagedPrompt> {
      const parsed = UpdatePromptInputSchema.parse(input);
      return store.updatePrompt(projectId, promptId, parsed);
    },

    async delete(projectId: string, promptId: string): Promise<void> {
      return store.deletePrompt(projectId, promptId);
    },

    async createVersion(input: unknown): Promise<PromptVersion> {
      const parsed = CreatePromptVersionInputSchema.parse(input);
      return store.createVersion(parsed);
    },

    async getVersion(projectId: string, versionId: string): Promise<PromptVersion | null> {
      return store.getVersion(projectId, versionId);
    },

    async listVersions(
      projectId: string,
      promptId: string,
      options?: unknown
    ): Promise<Page<PromptVersion>> {
      const parsed = PageOptionsSchema.parse(options ?? {});
      return store.listVersions(projectId, promptId, parsed);
    },

    async publishVersion(
      projectId: string,
      promptId: string,
      versionId: string
    ): Promise<ManagedPrompt> {
      return store.publishVersion(projectId, promptId, versionId);
    },
  };
}
