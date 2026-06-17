import type { ProviderHandler } from "./handler";
import type { ProviderCallResult } from "../types";

export const googleHandler: ProviderHandler = {
  buildUrl(baseUrl: string, modelId: string) {
    return `${baseUrl}/v1beta/models/${modelId}:generateContent`;
  },

  buildHeaders(_apiKey: string) {
    return { "Content-Type": "application/json" };
  },

  buildBody(_modelId: string, messages, params) {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = { contents };

    const config: Record<string, unknown> = {};
    if (params.temperature !== undefined) config.temperature = params.temperature;
    if (params.maxTokens !== undefined) config.maxOutputTokens = params.maxTokens;
    if (params.topP !== undefined) config.topP = params.topP;
    if (params.stop !== undefined)
      config.stopSequences = Array.isArray(params.stop) ? params.stop : [params.stop];
    if (Object.keys(config).length > 0) body.generationConfig = config;

    if (params.stream) {
      body.stream = true;
    }

    return body;
  },

  parseResponse(data: unknown): ProviderCallResult {
    const d = data as Record<string, unknown>;
    const candidates = d.candidates as
      | Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>
      | undefined;
    const parts = candidates?.[0]?.content?.parts;
    const text = parts?.map((p) => p.text ?? "").join("");
    if (!text) {
      throw new Error("Empty response content");
    }
    const usageRaw = d.usageMetadata as
      | { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
      | undefined;
    return {
      content: text,
      usage: usageRaw
        ? {
            promptTokens: usageRaw.promptTokenCount ?? 0,
            completionTokens: usageRaw.candidatesTokenCount ?? 0,
            totalTokens: usageRaw.totalTokenCount ?? 0,
          }
        : undefined,
    };
  },

  parseStreamChunk(data: unknown) {
    const d = data as Record<string, unknown>;
    const candidates = d.candidates as
      | Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>
      | undefined;
    const parts = candidates?.[0]?.content?.parts;
    const text = parts?.map((p) => p.text ?? "").join("");
    const done = candidates?.[0]?.finishReason != null;
    return { content: text ?? "", done };
  },

  parseStreamUsage(data: unknown) {
    const d = data as Record<string, unknown>;
    const usage = d.usageMetadata as
      | { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
      | undefined;
    if (!usage) return null;
    return {
      promptTokens: usage.promptTokenCount ?? 0,
      completionTokens: usage.candidatesTokenCount ?? 0,
      totalTokens: usage.totalTokenCount ?? 0,
    };
  },
};
