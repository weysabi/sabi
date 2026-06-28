import {
  bigint,
  doublePrecision,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  metadata: text("metadata").notNull().default("{}"),
  settings: text("settings").notNull().default("{}"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export const prompts = pgTable(
  "prompts",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    publishedVersionId: text("published_version_id"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("prompts_project_slug_idx").on(table.projectId, table.slug),
    index("prompts_project_idx").on(table.projectId),
  ]
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    promptId: text("prompt_id").notNull(),
    version: integer("version").notNull(),
    messages: text("messages").notNull(),
    inputSchema: text("input_schema"),
    outputSchema: text("output_schema"),
    model: text("model"),
    fallbacks: text("fallbacks"),
    temperature: doublePrecision("temperature"),
    maxTokens: integer("max_tokens"),
    status: text("status").notNull().default("draft"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    publishedAt: bigint("published_at", { mode: "number" }),
  },
  (table) => [
    foreignKey({
      columns: [table.promptId, table.projectId],
      foreignColumns: [prompts.id, prompts.projectId],
    }).onDelete("cascade"),
    uniqueIndex("prompt_versions_prompt_version_idx").on(table.promptId, table.version),
    index("prompt_versions_prompt_idx").on(table.promptId),
  ]
);

export const conversations = pgTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    externalUserId: text("external_user_id"),
    title: text("title"),
    summary: text("summary"),
    status: text("status").notNull().default("active"),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("conversations_project_updated_idx").on(table.projectId, table.updatedAt),
    index("conversations_user_idx").on(table.projectId, table.externalUserId, table.updatedAt),
  ]
);

export const conversationMessages = pgTable(
  "conversation_messages",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("complete"),
    tokenCount: integer("token_count"),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.conversationId, table.projectId],
      foreignColumns: [conversations.id, conversations.projectId],
    }).onDelete("cascade"),
    index("messages_conversation_idx").on(table.conversationId, table.createdAt),
  ]
);

export const runs = pgTable(
  "runs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id"),
    userMessageId: text("user_message_id"),
    assistantMessageId: text("assistant_message_id"),
    promptId: text("prompt_id"),
    promptVersionId: text("prompt_version_id"),
    requestedModel: text("requested_model").notNull(),
    resolvedModel: text("resolved_model"),
    provider: text("provider"),
    fallbackAttempts: text("fallback_attempts").notNull().default("[]"),
    documentIds: text("document_ids").notNull().default("[]"),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    totalTokens: integer("total_tokens"),
    estimatedCostUsd: doublePrecision("estimated_cost_usd"),
    latencyMs: integer("latency_ms"),
    status: text("status").notNull().default("pending"),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    completedAt: bigint("completed_at", { mode: "number" }),
  },
  (table) => [
    index("runs_project_created_idx").on(table.projectId, table.createdAt),
    index("runs_conversation_idx").on(table.conversationId, table.createdAt),
  ]
);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceType: text("source_type").notNull(),
    sourceUri: text("source_uri"),
    contentHash: text("content_hash").notNull(),
    status: text("status").notNull().default("pending"),
    chunkCount: integer("chunk_count").notNull().default(0),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (table) => [
    uniqueIndex("documents_project_hash_idx").on(table.projectId, table.contentHash),
    index("documents_project_idx").on(table.projectId),
  ]
);

export const projectApiKeys = pgTable(
  "project_api_keys",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fingerprint: text("fingerprint").notNull().unique(),
    keyHash: text("key_hash").notNull(),
    scopes: text("scopes").notNull().default("[]"),
    expiresAt: bigint("expires_at", { mode: "number" }),
    lastUsedAt: bigint("last_used_at", { mode: "number" }),
    revokedAt: bigint("revoked_at", { mode: "number" }),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [index("api_keys_project_idx").on(table.projectId)]
);
