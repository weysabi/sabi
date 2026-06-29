import type { Weysabi, StreamChunk } from "weysabi";
import { AllModelsFailedError } from "weysabi/errors";
import { translateRequest } from "./translate";
import { resolveAlias } from "./aliases";
import type { ModelAliasMap } from "./aliases";
import type { QuotaReservation, TokenQuotaConfig, TokenQuotaStore } from "./quota";
import type { UsageLedger } from "./ledger";
import { createModuleLogger } from "./logger";

const log = createModuleLogger("ws");

interface WsChatMessage {
  type: string;
  id: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
}

function sendJson(ws: WebSocket, data: Record<string, unknown>) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(data));
}

function estimateTokens(msg: WsChatMessage): number {
  const chars = msg.messages.reduce((s, m) => s + (m.content?.length ?? 0), 0);
  return Math.max(1, Math.ceil(chars / 4)) + (msg.maxTokens ?? 1024);
}

export function createWsHandler(options: {
  weysabi: Weysabi;
  modelAliases: ModelAliasMap;
  quotaConfig?: TokenQuotaConfig;
  quotaStore?: TokenQuotaStore;
  usageLedger?: UsageLedger;
}) {
  const { weysabi, modelAliases, quotaConfig, quotaStore, usageLedger } = options;

  async function handleMessage(ws: WebSocket, raw: string | Buffer) {
    let msg: WsChatMessage;
    try {
      msg = JSON.parse(raw.toString()) as WsChatMessage;
    } catch {
      sendJson(ws, { type: "error", error: "Invalid JSON" });
      return;
    }

    if (msg.type !== "chat" || !msg.id || !msg.model || !msg.messages?.length) {
      sendJson(ws, {
        type: "error",
        id: msg.id,
        error: "Missing required fields: id, model, messages",
      });
      return;
    }

    const wsData = (ws as unknown as { data?: { keyFingerprint?: string } }).data;
    const keyFingerprint = wsData?.keyFingerprint;
    let quotaReservation: QuotaReservation | undefined;

    if (quotaConfig && keyFingerprint) {
      const result = await quotaStore!.reserve(keyFingerprint, estimateTokens(msg), quotaConfig);
      if (!result.allowed) {
        sendJson(ws, { type: "error", id: msg.id, error: result.reason, code: "QUOTA_EXCEEDED" });
        return;
      }
      quotaReservation = result.reservation;
    }

    const model = resolveAlias(modelAliases, msg.model);
    const request = translateRequest({
      model: msg.model,
      messages: msg.messages,
      maxTokens: msg.maxTokens,
      stream: true,
    });
    request.model = model;

    const start = Date.now();
    log.info("ws chat start", { id: msg.id, model });

    async function commitQuota(actualTokens?: number) {
      if (!quotaReservation) return;
      await quotaStore!.commit(
        quotaReservation.id,
        actualTokens ?? quotaReservation.reservedTokens
      );
      quotaReservation = undefined;
    }

    async function releaseQuota() {
      if (!quotaReservation) return;
      await quotaStore!.release(quotaReservation.id);
      quotaReservation = undefined;
    }

    try {
      const iterable = weysabi.stream(request);
      let totalTokens = 0;
      let promptTokens = 0;

      for await (const chunk of iterable as AsyncIterable<StreamChunk>) {
        if (chunk.content) {
          sendJson(ws, { type: "token", id: msg.id, content: chunk.content });
        }
        if (chunk.usage) {
          totalTokens = chunk.usage.totalTokens;
          promptTokens = chunk.usage.promptTokens;
        }
      }

      await commitQuota(totalTokens || undefined);

      const usage = { promptTokens, completionTokens: totalTokens - promptTokens, totalTokens };
      sendJson(ws, { type: "done", id: msg.id, usage });

      if (keyFingerprint) {
        await usageLedger?.record({
          keyFingerprint,
          model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          timestamp: Date.now(),
          status: "success",
        });
      }

      log.info("ws chat complete", { id: msg.id, model, latencyMs: Date.now() - start });
    } catch (err) {
      await releaseQuota();
      const message = err instanceof AllModelsFailedError ? err.message : "Internal error";
      sendJson(ws, { type: "error", id: msg.id, error: message });
      log.error("ws chat error", { id: msg.id, model, error: message });
    }
  }

  return { handleMessage };
}
