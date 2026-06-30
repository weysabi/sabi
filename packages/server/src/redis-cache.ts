import type { CacheAdapter, CompleteResponse } from "weysabi";

export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { PX?: number }): Promise<unknown>;
  del(key: string): Promise<number>;
}

export class RedisCache implements CacheAdapter {
  private client: RedisLikeClient;
  private defaultTtlMs: number;

  constructor(client: RedisLikeClient, defaultTtlMs: number = 60_000) {
    this.client = client;
    this.defaultTtlMs = defaultTtlMs;
  }

  async get(key: string): Promise<CompleteResponse | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CompleteResponse;
    } catch {
      await this.client.del(key);
      return null;
    }
  }

  async set(key: string, value: CompleteResponse, ttlMs?: number): Promise<void> {
    const raw = JSON.stringify(value);
    const ttl = ttlMs ?? this.defaultTtlMs;
    await this.client.set(key, raw, { PX: ttl });
  }
}
