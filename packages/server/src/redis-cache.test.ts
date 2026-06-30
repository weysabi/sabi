import { describe, it, expect } from "bun:test";
import { RedisCache, type RedisLikeClient } from "./redis-cache";

function createMockRedis(): { client: RedisLikeClient } {
  const store = new Map<string, string>();
  const ttlMap = new Map<string, number>();

  return {
    client: {
      async get(key: string): Promise<string | null> {
        const expiresAt = ttlMap.get(key);
        if (expiresAt !== undefined && Date.now() > expiresAt) {
          store.delete(key);
          ttlMap.delete(key);
          return null;
        }
        return store.get(key) ?? null;
      },
      async set(key: string, value: string, options?: { PX?: number }): Promise<"OK"> {
        store.set(key, value);
        if (options?.PX) {
          ttlMap.set(key, Date.now() + options.PX);
        }
        return "OK";
      },
      async del(key: string): Promise<number> {
        store.delete(key);
        ttlMap.delete(key);
        return 1;
      },
    },
  };
}

describe("RedisCache", () => {
  it("stores and retrieves values", async () => {
    const { client } = createMockRedis();
    const cache = new RedisCache(client);

    await cache.set("key1", {
      content: "hello",
      model: "groq/llama-3.1-8b-instant",
      provider: "groq",
      latencyMs: 100,
    });

    const result = await cache.get("key1");
    expect(result?.content).toBe("hello");
  });

  it("returns null for missing keys", async () => {
    const { client } = createMockRedis();
    const cache = new RedisCache(client);

    const result = await cache.get("nonexistent");
    expect(result).toBeNull();
  });

  it("expires entries after TTL", async () => {
    const { client } = createMockRedis();
    const cache = new RedisCache(client, 50);

    await cache.set("key1", {
      content: "hello",
      model: "groq/llama-3.1-8b-instant",
      provider: "groq",
      latencyMs: 100,
    });

    expect(await cache.get("key1")).not.toBeNull();

    await new Promise((r) => setTimeout(r, 60));
    expect(await cache.get("key1")).toBeNull();
  });

  it("handles corrupted JSON gracefully", async () => {
    const { client } = createMockRedis();
    const cache = new RedisCache(client);

    await client.set("corrupt", "not-json");
    const result = await cache.get("corrupt");
    expect(result).toBeNull();
  });
});
