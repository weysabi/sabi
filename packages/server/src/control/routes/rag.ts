import { z } from "zod";
import type { ControlRouteContext } from "./common";
import { parseJsonBody, requireProject } from "./common";

const RagQueryBodySchema = z.object({
  text: z.string().min(1),
  topK: z.number().int().positive().optional(),
});

export function registerRagRoutes({ app, projects, ragService }: ControlRouteContext): void {
  app.post("/v1/projects/:projectId/rag/query", async (c) => {
    const projectId = c.req.param("projectId");
    await requireProject(projects, projectId);
    if (!ragService) {
      return c.json({ error: "RAG is not configured" }, 400);
    }
    const body = RagQueryBodySchema.parse(await parseJsonBody(c));
    const engine = ragService.project(projectId);
    const results = await engine.query(body.text, body.topK);
    return c.json({ results }, 200);
  });
}
