import type { CacheAdapter, CompleteResponse } from "./types";

interface CacheEntry {
  value: CompleteResponse;
  expiresAt: number;
}

export class InMemoryCache implements CacheAdapter {
  private store = new Map<string, CacheEntry>();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 60_000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): CompleteResponse | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: CompleteResponse, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}
