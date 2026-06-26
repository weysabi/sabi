import {
  AppendMessageInputSchema,
  ConversationQuerySchema,
  CreateConversationInputSchema,
  MessageQuerySchema,
  UpdateConversationInputSchema,
  UpdateMessageInputSchema,
} from "../types";
import type { ControlRouteContext, HonoApp } from "./common";
import { notFound, parseJsonBody, requireProject } from "./common";

export function registerConversationRoutes({ app, projects, store }: ControlRouteContext): void {
  const conversations = store.conversations;

  app.post("/v1/projects/:projectId/conversations", async (c: HonoApp) => {
    const projectId = c.req.param("projectId");
    await requireProject(projects, projectId);
    const body = await parseJsonBody(c);
    const conversation = await conversations.createConversation(
      CreateConversationInputSchema.parse({ ...body, projectId })
    );
    return c.json(conversation, 201);
  });

  app.get("/v1/projects/:projectId/conversations", async (c: HonoApp) => {
    const projectId = c.req.param("projectId");
    await requireProject(projects, projectId);
    const query = ConversationQuerySchema.parse({
      externalUserId: c.req.query("externalUserId") || undefined,
      status: c.req.query("status") || undefined,
      limit: c.req.query("limit") || undefined,
      offset: c.req.query("offset") || undefined,
    });
    return c.json(await conversations.listConversations(projectId, query));
  });

  app.get("/v1/projects/:projectId/conversations/:conversationId", async (c: HonoApp) => {
    const { projectId, conversationId } = c.req.param();
    const conversation = await conversations.getConversation(projectId, conversationId);
    if (!conversation) notFound("Conversation", conversationId, "CONVERSATION_NOT_FOUND");
    return c.json(conversation);
  });

  app.patch("/v1/projects/:projectId/conversations/:conversationId", async (c: HonoApp) => {
    const { projectId, conversationId } = c.req.param();
    const body = UpdateConversationInputSchema.parse(await parseJsonBody(c));
    return c.json(await conversations.updateConversation(projectId, conversationId, body));
  });

  app.delete("/v1/projects/:projectId/conversations/:conversationId", async (c: HonoApp) => {
    const { projectId, conversationId } = c.req.param();
    if (!(await conversations.getConversation(projectId, conversationId))) {
      notFound("Conversation", conversationId, "CONVERSATION_NOT_FOUND");
    }
    await conversations.deleteConversation(projectId, conversationId);
    return c.json({ deleted: true }, 200);
  });

  app.post("/v1/projects/:projectId/conversations/:conversationId/messages", async (c: HonoApp) => {
    const { projectId, conversationId } = c.req.param();
    if (!(await conversations.getConversation(projectId, conversationId))) {
      notFound("Conversation", conversationId, "CONVERSATION_NOT_FOUND");
    }
    const body = await parseJsonBody(c);
    const message = await conversations.appendMessage(
      AppendMessageInputSchema.parse({ ...body, projectId, conversationId })
    );
    return c.json(message, 201);
  });

  app.get("/v1/projects/:projectId/conversations/:conversationId/messages", async (c: HonoApp) => {
    const { projectId, conversationId } = c.req.param();
    if (!(await conversations.getConversation(projectId, conversationId))) {
      notFound("Conversation", conversationId, "CONVERSATION_NOT_FOUND");
    }
    const query = MessageQuerySchema.parse({
      limit: c.req.query("limit") || undefined,
      offset: c.req.query("offset") || undefined,
    });
    return c.json(await conversations.listMessages(projectId, conversationId, query));
  });

  app.patch("/v1/projects/:projectId/messages/:messageId", async (c: HonoApp) => {
    const { projectId, messageId } = c.req.param();
    const body = UpdateMessageInputSchema.parse(await parseJsonBody(c));
    return c.json(await conversations.updateMessage(projectId, messageId, body));
  });
}
