import type { CompleteRequest, CompleteResponse, Message } from "../types";
import type { StreamChunk } from "../types";

function normalizeMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is Message => m && typeof m === "object" && "role" in m);
}

export function translateRequest(body: Record<string, unknown>): CompleteRequest {
  const req: CompleteRequest = {
    model: String(body.model ?? ""),
    messages: normalizeMessages(body.messages),
  };

  if (typeof body.temperature === "number") req.temperature = body.temperature;
  if (typeof body.max_tokens === "number") req.maxTokens = body.max_tokens;
  if (typeof body.top_p === "number") req.topP = body.top_p;
  if (body.stop !== undefined) req.stop = body.stop as string | string[];
  if (body.max_tokens !== undefined) req.maxTokens = body.max_tokens as number;

  if (body.sabi_fallbacks) req.fallbacks = body.sabi_fallbacks as string[];
  if (body.sabi_rag === true) req.rag = true;

  return req;
}

export interface OpenAiChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string | null;
}

export function translateResponse(
  response: CompleteResponse,
  model: string
): Record<string, unknown> {
  return {
    id: `sabi-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: response.content,
        },
        finish_reason: "stop",
      },
    ],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.promptTokens,
          completion_tokens: response.usage.completionTokens,
          total_tokens: response.usage.totalTokens,
        }
      : undefined,
  };
}

let chunkId = 0;

export function translateStreamChunk(chunk: StreamChunk, model: string): string {
  if (chunk.done) {
    return "data: [DONE]\n\n";
  }

  const id = `sabi-${Date.now()}-${++chunkId}`;
  const data = {
    id,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        delta: {
          content: chunk.content,
        },
        finish_reason: null as string | null,
      },
    ],
  };

  if (chunk.usage && data.choices[0]) {
    data.choices[0].finish_reason = "stop";
    return `data: ${JSON.stringify(data)}\n\ndata: [DONE]\n\n`;
  }

  return `data: ${JSON.stringify(data)}\n\n`;
}
