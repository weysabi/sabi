# Sabi — Agent Handover

## Current State

`@weysabi/sabi` v0.3.0 — a clean Bun-native AI orchestration library. Provider abstraction, failover, circuit breaker, retry, prompt templates. 19 passing tests.

All source lives in `src/`. Tests live next to source (`src/index.test.ts`). Follows the same conventions as `@joinremba/catalog`, `@joinremba/beacon`, and `@joinremba/gate`.

## Code Structure

| File                | Purpose                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`      | `Sabi` class + `createSabi()`. Entry point, re-exports all types and errors.                                                                            |
| `src/types.ts`      | Zod schemas (`SabiOptionsSchema`, `ProviderConfigSchema`, `CompleteRequestSchema`) + TS interfaces.                                                     |
| `src/providers.ts`  | `ProviderClient` class — HTTP calls to OpenAI-compatible `/chat/completions`. Retry with exponential backoff, circuit breaker, AbortController timeout. |
| `src/prompts.ts`    | `PromptRegistry` — stores templates, renders `{variable}` syntax.                                                                                       |
| `src/utils.ts`      | `parseModel("provider/model")` → `{ provider, modelId }`.                                                                                               |
| `src/errors.ts`     | 7 error classes extending `SabiError`                                                                                                                   |
| `src/index.test.ts` | 19 tests: creation, prompts, complete, failover, timeout, circuit breaker.                                                                              |

### Key APIs

```ts
const sabi = createSabi({
  groq: { apiKey: "gsk_..." },
  openai: { apiKey: "sk_..." },
});

sabi.prompt("refund", "Decide if refund is valid: {reason}, amount: {amount}");

const result = await sabi.complete({
  model: "groq/llama-4-scout",
  prompt: "refund",
  inputs: { reason: "Item damaged", amount: "5000" },
  fallbacks: ["openai/gpt-4o-mini"],
});
// { content: string, model: string, provider: string, usage?, latencyMs }
```

### Dependencies

- **Runtime**: `zod` — validation
- **Dev**: `@types/bun`, `eslint`, `prettier`, `typescript`, eslint plugins

## Conventions (match catalog/beacon/gate)

- Tests next to source: `src/*.test.ts`, not a separate `tests/` dir
- `bunfig.toml` at root: `logLevel = "error"`, exact install, hoisted linker
- `.prettierignore`: node_modules, dist, bun.lock, .env, .git
- `package.json` exports: sub-path exports for adapters (`./adapters/hono`, etc.)
- No `export default`. Named exports only
- Zod for all runtime validation
- Custom error classes extending a base `SabiError`
- Mock `globalThis.fetch` in tests

## What Needs to Be Built

The highest-leverage features in priority order:

### 1. Streaming (`sabi.stream()`)

- Method returning `AsyncIterable<StreamChunk>`
- Support OpenAI-style SSE and Anthropic-style streaming
- `StreamChunk = { content: string, usage?: Usage, done: boolean }`
- Framework adapters: `sabi/hono`, `sabi/next`, `sabi/express`
- Client helper: `sabi.readStream(response.body)`

### 2. Anthropic + Gemini providers

- Add `src/providers/anthropic.ts` — Claude API (different endpoint format)
- Add `src/providers/gemini.ts` — Google Gemini API (different endpoint format)
- Both implement the same internal interface as the base `ProviderClient`

### 3. Structured output (`sabi.structured()`)

- Accept Zod schema, return typed object
- Auto-retry on parse failure (up to 3 attempts)
- Model fallback on failure

### 4. Telemetry hooks

- `onAttempt`, `onSuccess`, `onFailure`, `onFallback` callbacks in options
- Wedge for cloud product later

### 5. Cost estimation

- Internal pricing table per model
- `estimatedCostUsd` in every response

### 6. Vercel AI SDK adapter

- `sabi/ai-sdk` as a `LanguageModelV1`-compatible provider
- Get listed on `ai-sdk.dev/providers/community-providers`

## Architecture Notes

- **Modular monolith**: single `@weysabi/sabi` package, no workspaces
- **Adapters via sub-path exports**: `@weysabi/sabi/adapters/hono` etc., zero cost if unused
- **Bun-native**: Bun runtime, Bun test runner, native fetch, no Node.js deps
- **ProviderClient is the abstraction**: every provider (OpenAI, Anthropic, Gemini, etc.) implements the same internal contract. The base `ProviderClient` handles retry + circuit breaker; subclasses override the request format
- **No DI container**: services import each other directly as singletons

## Commands

```bash
bun install              # Install dependencies
bun test                 # Run all 19 tests
bun test --watch         # Watch mode
bun run lint             # ESLint
bun run format           # Prettier
bun run typecheck        # tsc --noEmit
bun run check            # lint + format:check + typecheck + test
bun run build            # Build to dist/
npm publish              # Publish to npm
```

## Future Sub-path Exports Pattern

When adding adapters, add to both `src/` and `package.json` exports:

```json
{
  "exports": {
    "./adapters/hono": {
      "types": "./src/adapters/hono.ts",
      "import": "./src/adapters/hono.ts",
      "default": "./src/adapters/hono.ts"
    }
  }
}
```

## Reference

- **Repo**: `github.com/weysabi/sabi`
- **Package**: `@weysabi/sabi` (v0.3.0, not yet published)
- **Product plan**: `PLAN.md` in this repo
- **Convention references**: `@joinremba/catalog`, `@joinremba/beacon`, `@joinremba/gate` — match their structure
