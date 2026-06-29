# Weysabi Project Review

Generated: 2026-06-29

---

## 1. Core SDK (`packages/weysabi`)

### Strengths

- Provider abstraction works well — OpenAI, Groq, Anthropic, Google, Mistral, DeepSeek, Together, Nvidia, OpenRouter, Ollama
- Failover, circuit breaker, retry/backoff all solid
- Structured output with Zod auto-retry
- Tool calling with auto-execute chaining
- Plugin system with request/response/error lifecycle
- Caching (InMemory, Redis, BYO)
- OpenTelemetry integration
- Vercel AI SDK adapter
- Cost estimation per-model
- CLI: `init`, `create`, `complete`, `stream`, `config`, `prompt`, `benchmark`, `doctor`, `server`, `upgrade`
- RAG engine: ingest, embed (OpenAI-compatible), HNSW vector search, SQLite persistence
- Guardrails: PII redaction, injection detection, content moderation, token limits
- Conversation memory: SQLite/Postgres, auto-truncation, ChatSDK with adapters
- 463 tests, all passing

### Gaps & Issues

**Missing providers**

- Amazon Bedrock (popular for enterprise)
- Azure OpenAI (popular for enterprise)
- Cohere (used for RAG/embedding)
- Perplexity (growing in popularity)
- xAI/Grok
- Custom provider SDK (bring-your-own provider class)

**SDK gaps**

- No `onStreamChunk` plugin hook (plugins can only hook complete, not individual stream chunks)
- No batch/completion API (process multiple requests in parallel with controlled concurrency)
- No image input support in messages (multi-modal)
- No token counting utility (users can't estimate tokens client-side)
- `CacheAdapter` only caches `CompleteResponse` — no stream caching
- `Weysabi` interface doesn't expose provider list or status
- RAG engine can only use OpenAI-compatible embedding — no Cohere/Voyage/self-hosted

**CLI gaps**

- No `weysabi config set/get` for managing config files
- No `weysabi logs` to view server logs
- No `weysabi version` to check installed version
- No `--json` flag on CLI commands for machine-readable output

**Test coverage gaps**

- No tests for guardrails standalone usage (`guardrail()` export)
- No integration tests that exercise the full plugin chain
- No tests for the chat adapters (OpenAIAdapter, AnthropicAdapter)
- No tests for RAG streaming ingestion (`loadStream`)
- No tests for conversation memory with Postgres store

---

## 2. Server (`packages/server`)

### Strengths

- OpenAI-compatible API (`POST /v1/chat/completions`, streaming, `GET /v1/models`)
- API key auth with scoped permissions (chat:write, models:read, admin)
- Admin endpoints for usage stats
- Rate limiting per-IP/per-key with Redis support for distributed deployment
- Idempotency key support with Redis backend
- CORS config, body limits, trusted proxies
- Control plane: SQLite/Postgres stores for projects, API keys, prompts, conversations, runs, documents, messages
- Token quota management (per-minute/per-day)
- Usage ledger with stats
- Control plane auth with project-scoped API keys
- Model alias resolution

### Gaps & Issues

**Resolved (Jun 29)**

The following gaps have been addressed:

- ✅ **SQLite-backed quota store** — `SqliteTokenQuotaStore` with WAL mode, TTL, persistence
- ✅ **SQLite-backed usage ledger** — `SqliteUsageLedger` with WAL mode, retention pruning
- ✅ **Dockerfile fixed** — stale `packages/sabi/` and `SABI_PORT` references removed
- ✅ **`WEYSABI_*` env var naming** — consistent across codebase
- ✅ **better-auth integration** — optional Postgres-backed auth via Drizzle adapter, mounted at `/api/auth/*`
- ✅ **WebSocket streaming** — bi-directional JSON protocol at `/v1/ws` with SSE HTTP fallback
- ✅ **Docker Compose** — Postgres 17 + Redis 7 + weysabi-server with health checks
- ✅ **Health check endpoint** — `GET /health` returns `{ status: "ok" }`

**Remaining gaps**

- No connection pooling for Postgres control plane
- No response caching beyond idempotency (could cache common completions in Redis)
- No request queueing or backpressure for high-load scenarios
- Single-process — no horizontal scaling story

**Observability**

- Prometheus metrics endpoint exists (`GET /metrics`) with request counters, latency histograms, WebSocket tracking — needs process memory, DB connectivity, and provider health gauges
- No structured logging configuration (log level, output format)
- No request tracing across provider calls
- No alerting/webhook on provider failures or quota exhaustion

**Control plane**

- No UI for the control plane (the webapp's admin is read-only stats)
- No eval/experiment tracking
- No prompt version comparison/diff
- No run comparison UI
- No webhook/event system for project events (key created, prompt deployed, etc.)

**Security**

- No TLS/HTTPS built in — users need a reverse proxy
- No rate limiting per-endpoint (single global RPM)
- No IP allowlist/blocklist
- No API key rotation support
- No audit log for admin actions
- No secret encryption at rest for stored API keys (control plane stores Argon2id hashes, which is good, but no envelope encryption)

**Deployment**

- Dockerfile builds from source — no multi-stage build optimization
- No Helm chart or Kubernetes manifests
- No graceful shutdown timeout

---

## 3. Webapp (`packages/webapp`)

### Strengths

- Clean Next.js 15 + React 19 + Tailwind 4 setup
- Statically exported for easy hosting
- Admin dashboard shows usage stats and projects
- Docs section with Fumadocs

### Gaps

- Admin dashboard is **read-only** — can view stats but can't manage projects, keys, or prompts
- No real-time updates (no WebSocket or polling)
- No charts/graphs for usage visualization
- No login/session — admin URL is public (relies on server-side auth for API calls)
- No mobile-responsive admin layout
- No eval viewer or experiment comparison UI
- Landing page is static marketing — no interactive demo
- Admin project page (at `/admin/projects`) links to a non-existent route

---

## 4. Create App (`packages/create-weysabi-app`)

### Strengths

- Works as `bunx create-weysabi-app my-app`
- Supports `--template server|nextjs|tanstack|agent`
- Delegates to core create logic

### Gaps

- Templates are hard-coded strings, not external files — hard to maintain
- No `--typescript`/`--javascript` flag
- No `--package-manager bun|npm|pnpm` flag
- No CI/CD setup in generated projects
- No database choice prompt for server template (SQLite vs Postgres)
- No auth choice prompt (API key vs OAuth)
- Generated `.env.example` uses `WEYSABI_DEFAULT_MODEL` etc. but doesn't comment what each variable means

---

## 5. Cross-Cutting Issues

### better-auth / User Auth

- The server has API-key auth but **no user auth**. `better-auth` could provide:
  - Email/password sign-up
  - OAuth (Google, GitHub, etc.)
  - Session management with JWT
  - Organization/team management
  - Rate limiting per-user
  - Admin roles
  - This would enable a multi-tenant SaaS offering

### Missing Features for v1

- [x] SQLite-backed quota store
- [x] SQLite-backed usage ledger
- [x] WebSocket streaming support
- [x] Prometheus metrics endpoint
- [x] Docker-compose for local dev
- [x] Health check with DB + provider status
- [x] User auth with better-auth
- [ ] Process memory, DB, provider health Prometheus gauges
- [ ] Response caching layer (Redis)
- [ ] Multi-tenant isolation
- [ ] Eval/experiment tracking
- [ ] Audit log

### Documentation

- READMEs are up to date with package name changes
- Server README doesn't document control plane endpoints in detail
- No migration guide from v0.9 to v0.10
- No architecture docs explaining the provider dispatch flow

---

## 6. Summary by Priority

### High (blocking production use) — All resolved

1. ✅ Persisted quota store + usage ledger (SQLite)
2. ✅ Dockerfile fix (stale paths and env vars)
3. ✅ User auth for multi-tenant (better-auth)
4. ✅ Docker-compose + health check for deployment

### Medium (important for DX)

5. ✅ WebSocket streaming
6. ✅ Prometheus metrics (basic — needs process memory, DB, provider health gauges)
7. Response caching
8. Admin UI for managing projects/keys
9. Missing providers (Bedrock, Azure, Cohere)

### Low (nice to have)

10. Multi-modal support (images)
11. Batch API
12. Eval tracking
13. Audit logging
14. Helm chart / K8s manifests
