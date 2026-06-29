import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createWeysabi } from "weysabi";
import { createWsHandler } from "./ws";
import { buildModelAliases } from "./aliases";

function mockWebSocket(): WebSocket {
  const messages: string[] = [];
  const ws = {
    readyState: WebSocket.OPEN,
    send(data: string) {
      messages.push(data);
    },
    close() {},
  } as unknown as WebSocket;
  (ws as unknown as { _messages: string[] })._messages = messages;
  return ws;
}

function getMessages(ws: WebSocket): string[] {
  return (ws as unknown as { _messages: string[] })._messages;
}

describe("WebSocket handler", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Hello!", role: "assistant" } }],
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )) as unknown as typeof globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("responds to a valid chat message", async () => {
    const weysabi = createWeysabi({ groq: { apiKey: "test" } });
    const { handleMessage } = createWsHandler({
      weysabi,
      modelAliases: buildModelAliases(),
    });

    const ws = mockWebSocket();
    await handleMessage(
      ws,
      JSON.stringify({
        type: "chat",
        id: "req-1",
        model: "groq/llama-4-scout",
        messages: [{ role: "user", content: "Hi" }],
      })
    );

    const msgs = getMessages(ws);
    expect(msgs.length).toBeGreaterThanOrEqual(1);
    const last = JSON.parse(msgs[msgs.length - 1]!) as Record<string, unknown>;
    expect(last.type).toBe("done");
    expect(last.id).toBe("req-1");
  });

  it("rejects missing fields", async () => {
    const weysabi = createWeysabi({ groq: { apiKey: "test" } });
    const { handleMessage } = createWsHandler({
      weysabi,
      modelAliases: buildModelAliases(),
    });

    const ws = mockWebSocket();
    await handleMessage(ws, JSON.stringify({ type: "chat", id: "req-1" }));

    const msgs = getMessages(ws);
    expect(msgs).toHaveLength(1);
    const parsed = JSON.parse(msgs[0]!) as Record<string, unknown>;
    expect(parsed.type).toBe("error");
  });

  it("rejects invalid JSON", async () => {
    const weysabi = createWeysabi({ groq: { apiKey: "test" } });
    const { handleMessage } = createWsHandler({
      weysabi,
      modelAliases: buildModelAliases(),
    });

    const ws = mockWebSocket();
    await handleMessage(ws, "not json");

    const msgs = getMessages(ws);
    expect(msgs).toHaveLength(1);
    const parsed = JSON.parse(msgs[0]!) as Record<string, unknown>;
    expect(parsed.type).toBe("error");
  });
});
