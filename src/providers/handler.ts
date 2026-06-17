import type { ProviderCallResult } from "../types";

export interface ProviderHandler {
  buildUrl(baseUrl: string, modelId: string): string;
  buildHeaders(apiKey: string): Record<string, string>;
  buildBody(
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    params: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      stop?: string | string[];
      stream: boolean;
      responseFormat?: Record<string, unknown>;
    }
  ): Record<string, unknown>;
  parseResponse(data: unknown): ProviderCallResult;
  parseStreamChunk(data: unknown): { content: string; done: boolean } | null;
  parseStreamUsage(
    data: unknown
  ): { promptTokens: number; completionTokens: number; totalTokens: number } | null;
}
