import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createWeysabi } from "weysabi";
import type { Weysabi } from "weysabi";
import { createRouter } from "./routes";
import { buildModelAliases, resolveAlias, getAliasesList } from "./aliases";

describe("Model aliases", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe("buildModelAliases", () => {
    it("builds map from ModelAlias config", () => {
      const map = buildModelAliases([
        { alias: "weysabi-fast", model: "groq/llama-4-scout" },
        { alias: "weysabi-smart", model: "openai/gpt-4o" },
      ]);
      expect(map.get("weysabi-fast")).toBe("groq/llama-4-scout");
      expect(map.get("weysabi-smart")).toBe("openai/gpt-4o");
      expect(map.size).toBe(2);
    });

    it("parses env var format", () => {
      const map = buildModelAliases(
        undefined,
        "weysabi-fast=groq/llama-4-scout,weysabi-smart=openai/gpt-4o"
      );
      expect(map.get("weysabi-fast")).toBe("groq/llama-4-scout");
      expect(map.get("weysabi-smart")).toBe("openai/gpt-4o");
      expect(map.size).toBe(2);
    });

    it("config overrides env var", () => {
      const map = buildModelAliases(
        [{ alias: "weysabi-fast", model: "override/model" }],
        "weysabi-fast=groq/llama-4-scout"
      );
      expect(map.get("weysabi-fast")).toBe("override/model");
    });

    it("handles empty input", () => {
      const map = buildModelAliases();
      expect(map.size).toBe(0);
    });
  });

  describe("resolveAlias", () => {
    it("returns resolved model for known alias", () => {
      const map = buildModelAliases([{ alias: "weysabi-fast", model: "groq/llama-4-scout" }]);
      expect(resolveAlias(map, "weysabi-fast")).toBe("groq/llama-4-scout");
    });

    it("passes through unknown model", () => {
      const map = buildModelAliases([{ alias: "weysabi-fast", model: "groq/llama-4-scout" }]);
      expect(resolveAlias(map, "openai/gpt-4o")).toBe("openai/gpt-4o");
    });

    it("passes through when no aliases configured", () => {
      const map = buildModelAliases();
      expect(resolveAlias(map, "groq/llama-4-scout")).toBe("groq/llama-4-scout");
    });

    it("resolves aliases that reference another alias", () => {
      const map = buildModelAliases([
        { alias: "weysabi-default", model: "weysabi-fast" },
        { alias: "weysabi-fast", model: "groq/llama-4-scout" },
      ]);
      expect(resolveAlias(map, "weysabi-default")).toBe("groq/llama-4-scout");
    });

    it("rejects alias cycles", () => {
      const map = buildModelAliases([
        { alias: "alias-a", model: "alias-b" },
        { alias: "alias-b", model: "alias-a" },
      ]);
      expect(() => resolveAlias(map, "alias-a")).toThrow("cycle");
    });
  });

  describe("getAliasesList", () => {
    it("returns sorted alias entries", () => {
      const map = buildModelAliases([{ alias: "weysabi-fast", model: "groq/llama-4-scout" }]);
      const list = getAliasesList(map);
      expect(list).toHaveLength(1);
      expect(list[0]!.alias).toBe("weysabi-fast");
      expect(list[0]!.model).toBe("groq/llama-4-scout");
    });
  });

  describe("Route integration", () => {
    it("resolves alias in POST /v1/chat/completions", async () => {
      let capturedModel = "";
      const fakeSabi = {
        complete(request: Record<string, unknown>) {
          capturedModel = request.model as string;
          return Promise.resolve({
            content: "Hello",
            model: capturedModel,
            provider: "groq",
            latencyMs: 10,
          });
        },
        stream() {
          return (async function* () {})();
        },
      } as unknown as Weysabi;

      const router = await createRouter(fakeSabi, {
        modelAliases: [{ alias: "weysabi-fast", model: "groq/llama-4-scout" }],
      });

      const res = await router.fetch(
        new Request("http://localhost/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: "weysabi-fast",
            messages: [{ role: "user", content: "Hi" }],
          }),
        })
      );

      expect(res.status).toBe(200);
      expect(capturedModel).toBe("groq/llama-4-scout");
    });

    it("passes through unresolvable models unchanged", async () => {
      let capturedModel = "";
      const fakeSabi = {
        complete(request: Record<string, unknown>) {
          capturedModel = request.model as string;
          return Promise.resolve({
            content: "Hello",
            model: capturedModel,
            provider: "groq",
            latencyMs: 10,
          });
        },
        stream() {
          return (async function* () {})();
        },
      } as unknown as Weysabi;

      const router = await createRouter(fakeSabi, {
        modelAliases: [{ alias: "weysabi-fast", model: "groq/llama-4-scout" }],
      });

      const res = await router.fetch(
        new Request("http://localhost/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: "groq/llama-4-scout",
            messages: [{ role: "user", content: "Hi" }],
          }),
        })
      );

      expect(res.status).toBe(200);
      expect(capturedModel).toBe("groq/llama-4-scout");
    });

    it("resolves aliases in fallback chains", async () => {
      let capturedFallbacks: string[] = [];
      const fakeSabi = {
        complete(request: Record<string, unknown>) {
          capturedFallbacks = request.fallbacks as string[];
          return Promise.resolve({
            content: "Hello",
            model: request.model as string,
            provider: "groq",
            latencyMs: 10,
          });
        },
        stream() {
          return (async function* () {})();
        },
      } as unknown as Weysabi;
      const router = await createRouter(fakeSabi, {
        modelAliases: [{ alias: "weysabi-backup", model: "openai/gpt-4o-mini" }],
      });

      const response = await router.fetch(
        new Request("http://localhost/v1/chat/completions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: "groq/llama-4-scout",
            messages: [{ role: "user", content: "Hi" }],
            weysabi_fallbacks: ["weysabi-backup"],
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(capturedFallbacks).toEqual(["openai/gpt-4o-mini"]);
    });

    it("GET /v1/models includes aliases", async () => {
      const weysabi = createWeysabi({ groq: { apiKey: "test-key" } });
      const router = await createRouter(weysabi, {
        modelAliases: [{ alias: "weysabi-fast", model: "groq/llama-4-scout" }],
      });

      const res = await router.fetch(new Request("http://localhost/v1/models"));
      const body = (await res.json()) as Record<string, unknown>;
      const data = body.data as Array<Record<string, unknown>>;

      // weysabi-proxy + weysabi-fast alias
      expect(data).toHaveLength(2);
      const aliasEntry = data.find((entry: Record<string, unknown>) => entry.id === "weysabi-fast");
      expect(aliasEntry).toBeTruthy();
      expect(aliasEntry!.owned_by).toBe("groq/llama-4-scout");
    });
  });
});
