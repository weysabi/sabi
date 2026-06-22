import { describe, it, expect } from "bun:test";
import { translateRequest, translateResponse, translateStreamChunk } from "./translate";

describe("translateRequest", () => {
  it("converts OpenAI-style request to Sabi CompleteRequest", () => {
    const result = translateRequest({
      model: "groq/llama-4-scout",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ],
      temperature: 0.7,
      max_tokens: 100,
      top_p: 0.9,
      stop: ["END"],
    });

    expect(result.model).toBe("groq/llama-4-scout");
    expect(result.messages).toHaveLength(2);
    expect(result.temperature).toBe(0.7);
    expect(result.maxTokens).toBe(100);
    expect(result.topP).toBe(0.9);
    expect(result.stop).toEqual(["END"]);
  });

  it("handles minimal request", () => {
    const result = translateRequest({
      model: "groq/llama-4-scout",
      messages: [{ role: "user", content: "Hi" }],
    });

    expect(result.model).toBe("groq/llama-4-scout");
    expect(result.messages).toHaveLength(1);
    expect(result.temperature).toBeUndefined();
  });

  it("handles sabi-specific fields", () => {
    const result = translateRequest({
      model: "groq/llama-4-scout",
      messages: [{ role: "user", content: "Hi" }],
      sabi_fallbacks: ["openai/gpt-4o-mini"],
      sabi_rag: true,
    });

    expect(result.fallbacks).toEqual(["openai/gpt-4o-mini"]);
    expect(result.rag).toBeTrue();
  });

  it("handles missing messages", () => {
    const result = translateRequest({
      model: "groq/llama-4-scout",
    });

    expect(result.messages).toEqual([]);
  });
});

describe("translateResponse", () => {
  it("converts Sabi CompleteResponse to OpenAI format", () => {
    const result = translateResponse(
      {
        content: "Hello!",
        model: "groq/llama-4-scout",
        provider: "groq",
        latencyMs: 100,
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      },
      "groq/llama-4-scout"
    );

    expect(result.object).toBe("chat.completion");
    expect(result.choices).toHaveLength(1);
    expect((result.choices as Array<Record<string, unknown>>)[0]!.message).toEqual({
      role: "assistant",
      content: "Hello!",
    });
    expect(result.usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    });
  });

  it("handles missing usage", () => {
    const result = translateResponse(
      {
        content: "OK",
        model: "groq/llama-4-scout",
        provider: "groq",
        latencyMs: 50,
      },
      "groq/llama-4-scout"
    );

    expect(result.usage).toBeUndefined();
  });
});

describe("translateStreamChunk", () => {
  it("converts content chunk to SSE format", () => {
    const line = translateStreamChunk({ content: "Hello", done: false }, "groq/llama-4-scout");

    expect(line).toStartWith("data: ");
    const parsed = JSON.parse(line.slice(6).trim());
    expect(parsed.object).toBe("chat.completion.chunk");
    expect(parsed.choices[0].delta.content).toBe("Hello");
    expect(parsed.choices[0].finish_reason).toBeNull();
  });

  it("converts done chunk to [DONE]", () => {
    const line = translateStreamChunk({ content: "", done: true }, "groq/llama-4-scout");

    expect(line).toBe("data: [DONE]\n\n");
  });

  it("includes usage in final chunk and appends [DONE]", () => {
    const line = translateStreamChunk(
      {
        content: "Done",
        done: false,
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      },
      "groq/llama-4-scout"
    );

    expect(line).toInclude("data: [DONE]");
    const parts = line.split("\n\n").filter(Boolean);
    const dataPart = parts[0]!;
    expect(dataPart).toStartWith("data: ");
    const parsed = JSON.parse(dataPart.slice(6));
    expect(parsed.choices[0].finish_reason).toBe("stop");
  });
});
