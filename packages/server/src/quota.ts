export interface TokenQuotaConfig {
  maxTokensPerMin?: number;
  maxTokensPerDay?: number;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
}

export interface TokenQuotaStore {
  check(key: string, config: TokenQuotaConfig): Promise<QuotaCheck>;
  record(key: string, tokens: number): Promise<void>;
}

interface WindowEntry {
  timestamp: number;
  tokens: number;
}

export class InMemoryTokenQuotaStore implements TokenQuotaStore {
  private windows = new Map<string, WindowEntry[]>();

  async check(key: string, config: TokenQuotaConfig): Promise<QuotaCheck> {
    const now = Date.now();
    const entries = this.windows.get(key) ?? [];

    if (config.maxTokensPerMin !== undefined) {
      const minuteAgo = now - 60_000;
      const minuteTokens = entries
        .filter((e) => e.timestamp > minuteAgo)
        .reduce((sum, e) => sum + e.tokens, 0);
      if (minuteTokens >= config.maxTokensPerMin) {
        return {
          allowed: false,
          reason: `Token quota exceeded: ${minuteTokens}/${config.maxTokensPerMin} per minute`,
        };
      }
    }

    if (config.maxTokensPerDay !== undefined) {
      const dayAgo = now - 86_400_000;
      const dayTokens = entries
        .filter((e) => e.timestamp > dayAgo)
        .reduce((sum, e) => sum + e.tokens, 0);
      if (dayTokens >= config.maxTokensPerDay) {
        return {
          allowed: false,
          reason: `Token quota exceeded: ${dayTokens}/${config.maxTokensPerDay} per day`,
        };
      }
    }

    return { allowed: true };
  }

  async record(key: string, tokens: number): Promise<void> {
    const now = Date.now();
    const entries = this.windows.get(key) ?? [];

    entries.push({ timestamp: now, tokens });

    const oldest = now - 86_400_000;
    const trimmed = entries.filter((e) => e.timestamp > oldest);
    this.windows.set(key, trimmed);
  }
}

export function extractKeyFromAuth(req: Request): string | null {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s*/i, "").trim();
  if (!token) return null;
  return token.length > 16 ? token.slice(0, 16) : token;
}
