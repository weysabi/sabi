# Sabi

**AI orchestration for fullstack devs.** Use your own API keys. Get provider failover, structured output, RAG, and streaming. One library, zero token markup.

```ts
import { createSabi } from "@weysabi/sabi";

const sabi = createSabi({
  openai: { apiKey: process.env.OPENAI_API_KEY },
  groq: { apiKey: process.env.GROQ_API_KEY },
});

// Auto-failover, circuit breaker, retry built in
const result = await sabi.complete({
  model: "groq/llama-4-scout",
  prompt: "refund",
  inputs: { reason: "Item damaged", amount: "5000" },
  fallbacks: ["openai/gpt-4o-mini"],
});
```

## Why Sabi?

- **Your keys, your providers.** Sabi never touches your tokens — you pay OpenAI/Groq/Anthropic directly. No markup, no gateway.
- **One dependency.** Not LangChain + Pinecone + provider SDKs. Just `@weysabi/sabi`.
- **Zero config for common cases.** Structured output? Pass a Zod schema. RAG? Point at a PDF.
- **Works offline-first.** No cloud required. Cloud features (versioning, evals, monitoring) are optional.
- **No lock-in.** Stop paying, the library still works with your keys.

## Features

| Feature                                   | Status |
| ----------------------------------------- | ------ |
| Provider abstraction (OpenAI, Groq, etc.) | ✅     |
| Prompt templates with `{variable}` syntax | ✅     |
| Circuit breaker + retry + backoff         | ✅     |
| Provider failover (primary → fallbacks)   | ✅     |
| Structured output (Zod schemas)           | 🔜     |
| Streaming (SSE, async iterable)           | 🔜     |
| Anthropic + Gemini + Mistral providers    | 🔜     |
| Telemetry hooks (latency, cost, errors)   | 🔜     |
| Vercel AI SDK adapter                     | 🔜     |
| RAG (zero-config, local or cloud)         | 🔜     |
| Tool calling                              | 🔜     |
| Memory & conversations                    | 🔜     |
| Guardrails (PII, content filter)          | 🔜     |
| Eval suites                               | 🔜     |
| Cloud dashboard                           | 🔜     |
| Hosted open-source models                 | 🔜     |

## Quick Start

```ts
import { createSabi } from "@weysabi/sabi";

const sabi = createSabi({
  groq: { apiKey: process.env.GROQ_API_KEY },
  openai: { apiKey: process.env.OPENAI_API_KEY },
});

// Prompt templates
sabi.prompt("translate", "Translate {text} to {language}");

// Type-safe completions with auto-failover
const result = await sabi.complete({
  model: "groq/llama-4-scout",
  prompt: "translate",
  inputs: { text: "Hello", language: "French" },
  fallbacks: ["openai/gpt-4o-mini"],
});

console.log(result.content); // "Bonjour"
console.log(result.latencyMs); // 342
```

## Package

```bash
bun add @weysabi/sabi
```

Single package, no splitting. Cloud features runtime-gated by API key.

## Philosophy

- **One dependency** competing with LangChain, not Vercel AI SDK (they handle frontend streaming/hooks, Sabi handles backend orchestration)
- **Bring your own keys** — Sabi never marks up tokens. Revenue comes from cloud features (versioning, evals, monitoring, team sync)
- **Future: hosted inference** — after traction, Sabi hosts Llama/Mistral/DeepSeek. Smart routing sends simple tasks to cheap hosted models, complex ones to GPT-4/Claude. One bill.

## License

MIT
