import Link from "next/link";

export default function ProvidersPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-8 block">
        &larr; Back to docs
      </Link>
      <h1 className="text-3xl font-bold mb-6">Provider Configuration</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Setup</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Pass provider configs to <code className="text-xs">createWeysabi()</code>. Each provider
          needs at least an <code className="text-xs">apiKey</code>:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`import { createWeysabi } from "@weysabi/sabi";

const sabi = createWeysabi({
  groq: { apiKey: process.env.GROQ_API_KEY },
  openai: { apiKey: process.env.OPENAI_API_KEY },
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  google: { apiKey: process.env.GOOGLE_API_KEY },
});`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Supported Providers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4">Provider</th>
                <th className="text-left py-2 pr-4">Handler</th>
                <th className="text-left py-2">Env Var</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Groq", "OpenAI-compatible", "GROQ_API_KEY"],
                ["OpenAI", "OpenAI-compatible", "OPENAI_API_KEY"],
                ["Anthropic", "Anthropic Messages API", "ANTHROPIC_API_KEY"],
                ["Google Gemini", "Gemini API", "GOOGLE_API_KEY"],
                ["Mistral AI", "Mistral API", "MISTRAL_API_KEY"],
                ["NVIDIA", "OpenAI-compatible", "NVIDIA_API_KEY"],
                ["DeepSeek", "OpenAI-compatible", "DEEPSEEK_API_KEY"],
                ["Together AI", "OpenAI-compatible", "TOGETHER_API_KEY"],
                ["OpenRouter", "OpenAI-compatible", "OPENROUTER_API_KEY"],
                ["Ollama", "Ollama API", "OLLAMA_API_KEY"],
              ].map(([provider, handler, env]) => (
                <tr key={provider} className="border-b border-border">
                  <td className="py-2 pr-4 font-medium">{provider}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{handler}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{env}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          OpenAI-compatible providers use the same handler. Set a custom{" "}
          <code className="text-xs">baseUrl</code> to point at any OpenAI-compatible API.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Custom Base URL</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Point any provider at a different endpoint:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const sabi = createWeysabi({
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: "https://api.groq.com/openai/v1",
  },
});`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Per-Provider Timeouts</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Override the global timeout for specific providers:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const sabi = createWeysabi({
  openai: { apiKey: "...", timeout: 30_000 },
  groq: { apiKey: "...", timeout: 15_000 },
}, { timeout: 10_000 });`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Retry &amp; Backoff</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Configure retry behavior globally or per-provider:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const sabi = createWeysabi(
  { groq: { apiKey: "...", retry: { maxRetries: 5, statusCodes: [429, 500, 502, 503], backoffMs: 500 } } },
  { retry: { maxRetries: 3, statusCodes: [429, 500], backoffMs: 1000 } }
);`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          Retries use exponential backoff with jitter. Per-provider retry config overrides the
          global default.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Circuit Breaker</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Stops requests to a failing provider after N failures within a window:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const sabi = createWeysabi({ groq: { apiKey: "..." } }, {
  circuitBreaker: {
    threshold: 5,      // failures before tripping
    cooldownMs: 30_000, // wait 30s before retrying
    windowMs: 60_000,   // count failures within 1min window
  },
});`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Provider Failover</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Pass an array of models to automatically fail over on errors:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const response = await sabi.complete({
  model: ["groq/llama-4-scout", "openai/gpt-4o-mini", "anthropic/claude-3-5-haiku-20241022"],
  messages: [{ role: "user", content: "Hello!" }],
});`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          If the first model fails (after retries and circuit breaker), it automatically tries the
          next in sequence.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Error Types</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <code className="text-xs">ProviderRequestError</code> — API returned an error or request
            failed
          </li>
          <li>
            <code className="text-xs">CircuitBreakerOpenError</code> — Provider is in cooldown
          </li>
          <li>
            <code className="text-xs">AllModelsFailedError</code> — All models in the array failed
          </li>
        </ul>
      </section>
    </article>
  );
}
