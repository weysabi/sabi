import type { ProviderHandler } from "./handler";
import type { ProviderCallResult } from "../types";

export const anthropicHandler: ProviderHandler = {
  buildUrl(baseUrl: string, _modelId: string) {
    return `${baseUrl}/v1/messages`;
  },

  buildHeaders(apiKey: string) {
    return {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  },

  buildBody(modelId: string, messages, params) {
    const body: Record<string, unknown> = {
      model: modelId,
      messages,
      max_tokens: params.maxTokens ?? 1024,
    };
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.topP !== undefined) body.top_p = params.topP;
    if (params.stop !== undefined) body.stop = params.stop;
    if (params.stream) body.stream = true;
    if (params.responseFormat !== undefined) body.response_format = params.responseFormat;
    return body;
  },

  parseResponse(data: unknown): ProviderCallResult {
    const d = data as Record<string, unknown>;
    const content = d.content as Array<{ type: string; text?: string }> | undefined;
    const text = content?.find((c) => c.type === "text")?.text;
    if (text === undefined || text === null) {
      throw new Error("Empty response content");
    }
    const usageRaw = d.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    return {
      content: text,
      usage: usageRaw
        ? {
            promptTokens: usageRaw.input_tokens ?? 0,
            completionTokens: usageRaw.output_tokens ?? 0,
            totalTokens: (usageRaw.input_tokens ?? 0) + (usageRaw.output_tokens ?? 0),
          }
        : undefined,
    };
  },

  parseStreamChunk(data: unknown) {
    const d = data as Record<string, unknown>;
    const type = d.type as string;

    if (type === "content_block_delta") {
      const delta = d.delta as { type?: string; text?: string } | undefined;
      return { content: delta?.text ?? "", done: false };
    }

    if (type === "message_delta") {
      const delta = d.delta as { stop_reason?: string } | undefined;
      return { content: "", done: delta?.stop_reason != null };
    }

    if (type === "message_stop") {
      return { content: "", done: true };
    }

    return null;
  },

  parseStreamUsage(data: unknown) {
    const d = data as Record<string, unknown>;
    if (d.type !== "message_delta") return null;
    const usage = d.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    if (!usage) return null;
    return {
      promptTokens: usage.input_tokens ?? 0,
      completionTokens: usage.output_tokens ?? 0,
      totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
    };
  },
};
