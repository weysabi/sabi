import type { Weysabi } from "weysabi";
import type { IdempotencyInstance } from "../middleware";
import type { ControlPlaneStore } from "./store";
import { createPromptService } from "./prompt-service";
import { createProjectService } from "./service";
import type { HonoApp, ControlRouteContext } from "./routes/common";
import { registerApiKeyRoutes } from "./routes/api-keys";
import { registerConversationRoutes } from "./routes/conversations";
import { registerDocumentRoutes } from "./routes/documents";
import { registerProjectRoutes } from "./routes/projects";
import { registerPromptRoutes } from "./routes/prompts";
import { registerRagRoutes } from "./routes/rag";
import { registerRunRoutes } from "./routes/runs";
import type { TokenQuotaConfig, TokenQuotaStore } from "../quota";
import type { RagService } from "./rag-service";

export interface RegisterControlRoutesOptions {
  idempotency?: IdempotencyInstance;
  quotaStore?: TokenQuotaStore;
  quotaConfig?: TokenQuotaConfig;
  ragService?: RagService;
}

export function registerControlRoutes(
  app: HonoApp,
  sabi: Weysabi,
  store: ControlPlaneStore,
  options: RegisterControlRoutesOptions = {}
): void {
  const context: ControlRouteContext = {
    app,
    sabi,
    store,
    projects: createProjectService(store.projects),
    prompts: createPromptService(store.prompts),
    idempotency: options.idempotency,
    quotaStore: options.quotaStore,
    quotaConfig: options.quotaConfig,
    ragService: options.ragService,
  };

  registerProjectRoutes(context);
  registerPromptRoutes(context);
  registerConversationRoutes(context);
  registerRunRoutes(context);
  registerDocumentRoutes(context);
  registerApiKeyRoutes(context);
  registerRagRoutes(context);
}
