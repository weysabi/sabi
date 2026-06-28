import type { Weysabi } from "weysabi";
import { ControlError, ControlResourceNotFoundError } from "../errors";
import type { IdempotencyInstance } from "../../middleware";
import type { createPromptService } from "../prompt-service";
import type { createProjectService } from "../service";
import type { ControlPlaneStore } from "../store";
import type { TokenQuotaConfig, TokenQuotaStore } from "../../quota";
import type { RagService } from "../rag-service";
import type { Hono } from "hono";
import type { Context } from "hono";

export type HonoApp = Hono;
export type HonoContext = Context;

export interface ControlRouteContext {
  app: HonoApp;
  weysabi: Weysabi;
  store: ControlPlaneStore;
  projects: ReturnType<typeof createProjectService>;
  prompts: ReturnType<typeof createPromptService>;
  idempotency?: IdempotencyInstance;
  quotaStore?: TokenQuotaStore;
  quotaConfig?: TokenQuotaConfig;
  ragService?: RagService;
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function parseJsonBody(c: HonoContext): Promise<Record<string, unknown>> {
  try {
    return (await c.req.json()) as Record<string, unknown>;
  } catch {
    throw new ControlError("Request body must be valid JSON", "INVALID_JSON", 400);
  }
}

export function notFound(resource: string, id: string, code: string): never {
  throw new ControlResourceNotFoundError(resource, id, code);
}

export async function requireProject(
  projects: ControlRouteContext["projects"],
  projectId: string
): Promise<void> {
  if (!(await projects.get(projectId))) {
    notFound("Project", projectId, "PROJECT_NOT_FOUND");
  }
}
