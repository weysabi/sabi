import Link from "next/link";

export default function ApiPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-8 block">
        &larr; Back to docs
      </Link>
      <h1 className="text-3xl font-bold mb-6">API Reference</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Core</h2>
        <div className="space-y-4">
          <ApiEntry
            name="createWeysabi"
            signature="createWeysabi(providers: Record<string, ProviderConfig>, options?: WeysabiOptions): Weysabi"
            description="Creates a new Weysabi instance. The only required export."
          />
          <ApiEntry
            name="Weysabi.complete"
            signature="complete<T>(request: CompleteRequest): Promise<CompleteResponse<T>>"
            description="Send a completion request. Supports model failover via string array, Zod schemas for typed output, and tool calling."
          />
          <ApiEntry
            name="Weysabi.stream"
            signature="stream(request: StreamRequest): AsyncIterable<StreamChunk>"
            description="Stream a completion token-by-token. Yields StreamChunk until done."
          />
          <ApiEntry
            name="Weysabi.use"
            signature="use(plugin: Plugin): void"
            description="Register a plugin (e.g. guardrails) with lifecycle hooks."
          />
          <ApiEntry
            name="Weysabi.guardrail"
            signature="guardrail(name: string, options: GuardrailOptions): void"
            description="Register an inline custom guardrail."
          />
          <ApiEntry
            name="Weysabi.prompts"
            signature="prompts: Prompts"
            description="Prompt registry with register, run, list, get, remove, has, render, clear."
          />
          <ApiEntry
            name="Weysabi.rag"
            signature="rag: RagEngine"
            description="RAG engine for ingestion, vector search, and querying."
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Request &amp; Response Types</h2>
        <div className="space-y-4">
          <ApiEntry
            name="CompleteRequest"
            signature="{ model: string | string[], messages: Message[], schema?: ZodType, temperature?: number, maxTokens?: number, topP?: number, stop?: string | string[], tools?: ToolDefinition[], toolChoice?: ToolChoice, cacheKey?: string }"
            description="Request body for sabi.complete(). model can be an array for failover."
          />
          <ApiEntry
            name="CompleteResponse"
            signature="{ content: string, usage?: Usage, model: string, parsed?: T, toolCalls?: ToolCall[] }"
            description="Response from sabi.complete(). parsed contains validated schema data when schema is provided."
          />
          <ApiEntry
            name="StreamRequest"
            signature="{ model: string | string[], messages: Message[], temperature?: number, maxTokens?: number, topP?: number, stop?: string | string[], signal?: AbortSignal }"
            description="Request body for sabi.stream(). Supports AbortSignal for client-side cancellation."
          />
          <ApiEntry
            name="StreamChunk"
            signature="{ content: string, usage?: { promptTokens: number, completionTokens: number, totalTokens: number }, done: boolean }"
            description="A single token chunk from sabi.stream(). The final chunk includes usage and done: true."
          />
          <ApiEntry
            name="Message"
            signature="{ role: string, content: string | null, tool_calls?: ToolCall[], tool_call_id?: string }"
            description="A chat message with role (system, user, assistant, tool) and content."
          />
          <ApiEntry
            name="Usage"
            signature="{ promptTokens: number, completionTokens: number, totalTokens: number }"
            description="Token usage returned by providers."
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Provider Config</h2>
        <div className="space-y-4">
          <ApiEntry
            name="ProviderConfig"
            signature="{ apiKey: string, baseUrl?: string, timeout?: number, retry?: { maxRetries?: number, statusCodes?: number[], backoffMs?: number } }"
            description="Per-provider configuration. baseUrl defaults to the provider's standard API URL."
          />
          <ApiEntry
            name="WeysabiOptions"
            signature="{ timeout?: number, retry?: RetryOptions, circuitBreaker?: CircuitBreakerOptions, telemetry?: TelemetryOptions, pricing?: PricingConfig, cache?: CacheConfig, promptDefinitions?: PromptDefinition[], rag?: RagOptions }"
            description="Global options passed as the second argument to createWeysabi()."
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Errors</h2>
        <div className="space-y-4">
          <ApiEntry
            name="SabiError"
            signature="extends Error"
            description="Base class for all Weysabi errors. All error classes extend this."
          />
          <ApiEntry
            name="ProviderRequestError"
            signature="(provider, model, statusCode, message)"
            description="Provider API returned an error or request failed."
          />
          <ApiEntry
            name="CircuitBreakerOpenError"
            signature="(provider, remainingMs)"
            description="Provider circuit breaker is open. Requests are temporarily blocked."
          />
          <ApiEntry
            name="AllModelsFailedError"
            signature="(primaryModel, fallbacks, errors)"
            description="All models in the failover array failed."
          />
          <ApiEntry
            name="SchemaValidationError"
            signature="(raw, issues)"
            description="Response failed Zod schema validation. raw contains the unparsed response."
          />
          <ApiEntry
            name="GuardrailError"
            signature="(match)"
            description="A guardrail policy was violated. match contains the violation details."
          />
          <ApiEntry
            name="PromptNotFoundError"
            signature="(id)"
            description="The requested prompt ID is not registered."
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sub-path Exports</h2>
        <div className="space-y-4">
          <ApiEntry
            name="@weysabi/sabi/sse"
            signature="toResponse(stream: AsyncIterable<StreamChunk>): Response"
            description="Convert a stream into an SSE Response."
          />
          <ApiEntry
            name="@weysabi/sabi/stream"
            signature="readStream(body: ReadableStream): AsyncIterable<StreamChunk>"
            description="Client-side SSE stream consumer."
          />
          <ApiEntry
            name="@weysabi/sabi/hono"
            signature="re-exports toResponse"
            description="SSE adapter for Hono."
          />
          <ApiEntry
            name="@weysabi/sabi/next"
            signature="re-exports toResponse"
            description="SSE adapter for Next.js App Router."
          />
          <ApiEntry
            name="@weysabi/sabi/elysia"
            signature="re-exports toResponse"
            description="SSE adapter for Elysia."
          />
          <ApiEntry
            name="@weysabi/sabi/express"
            signature="pipe(stream, res)"
            description="Pipe stream chunks into an Express response."
          />
          <ApiEntry
            name="@weysabi/sabi/fastify"
            signature="pipe(stream, reply)"
            description="Pipe stream chunks into a Fastify reply."
          />
          <ApiEntry
            name="@weysabi/sabi/errors"
            signature="exports all error classes"
            description="All error classes for type-safe error handling."
          />
          <ApiEntry
            name="@weysabi/sabi/prompts"
            signature="exports Prompt, PromptRegistry, types"
            description="Prompt primitives for advanced use cases."
          />
          <ApiEntry
            name="@weysabi/sabi/ai-sdk"
            signature="createWeysabiProvider(options): ProviderV3"
            description="Vercel AI SDK adapter."
          />
          <ApiEntry
            name="@weysabi/sabi/otel"
            signature="OpenTelemetry plugin"
            description="OpenTelemetry integration for observability."
          />
          <ApiEntry
            name="@weysabi/sabi/guardrails"
            signature="createGuardrails(config): Plugin"
            description="Guardrails plugin factory."
          />
          <ApiEntry
            name="@weysabi/sabi/rag"
            signature="RagEngine, RagManager, types"
            description="RAG primitives for advanced usage."
          />
          <ApiEntry
            name="@weysabi/sabi/chat"
            signature="ConversationMemory, SqliteSessionStore, PgSessionStore, types"
            description="Conversation memory with persistent storage."
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Server</h2>
        <div className="space-y-4">
          <ApiEntry
            name="@weysabi/server"
            signature="createServer(sabi, options?): Server"
            description="Create an OpenAI-compatible HTTP server programmatically."
          />
          <ApiEntry
            name="ServerOptions"
            signature="{ port?: number, hostname?: string, apiKey?: string, corsOrigins?: string[], modelAliases?: ModelAlias[], rateLimiting?: RateLimitConfig, quotas?: TokenQuotaConfig }"
            description="Configuration for createServer."
          />
        </div>
      </section>
    </article>
  );
}

function ApiEntry({
  name,
  signature,
  description,
}: {
  name: string;
  signature: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="font-mono text-sm font-semibold mb-1">{name}</h3>
      <pre className="text-xs text-muted-foreground mb-2 overflow-x-auto whitespace-pre-wrap">
        {signature}
      </pre>
      <p className="text-sm">{description}</p>
    </div>
  );
}
