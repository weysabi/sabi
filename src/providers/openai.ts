import type { ProviderHandler } from "./handler";
import type { ProviderCallResult } from "../types";

export const openaiHandler: ProviderHandler = {
  buildUrl(baseUrl: string, _modelId: string) {
    return `${baseUrl}/chat/completions`;
  },

  buildHeaders(apiKey: string) {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
  },

  buildBody(modelId: string, messages, params) {
    const body: Record<string, unknown> = {
      model: modelId,
      messages,
    };
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.maxTokens !== undefined) body.max_tokens = params.maxTokens;
    if (params.topP !== undefined) body.top_p = params.topP;
    if (params.stop !== undefined) body.stop = params.stop;
    if (params.stream) body.stream = true;
    if (params.responseFormat !== undefined) body.response_format = params.responseFormat;
    return body;
  },

  parseResponse(data: unknown): ProviderCallResult {
    const d = data as Record<string, unknown>;
    const choices = d.choices as Array<{ message?: { content?: string | null } }> | undefined;
    const content = choices?.[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error("Empty response content");
    }
    const usageRaw = d.usage as
      | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
      | undefined;
    return {
      content,
      usage: usageRaw
        ? {
            promptTokens: usageRaw.prompt_tokens ?? 0,
            completionTokens: usageRaw.completion_tokens ?? 0,
            totalTokens: usageRaw.total_tokens ?? 0,
          }
        : undefined,
    };
  },

  parseStreamChunk(data: unknown) {
    const d = data as Record<string, unknown>;
    const choices = d.choices as
      | Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>
      | undefined;
    const choice = choices?.[0];
    if (!choice) return null;
    return {
      content: choice.delta?.content ?? "",
      done: choice.finish_reason != null,
    };
  },

  parseStreamUsage(data: unknown) {
    const d = data as Record<string, unknown>;
    const usage = d.usage as
      | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
      | undefined;
    if (!usage) return null;
    return {
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
    };
  },
};
