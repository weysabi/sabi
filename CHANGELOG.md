# Changelog

## [Unreleased]

### Added

- **Auto-routing sugar** — `model` accepts `string | string[]`. When an array, elements after the first become fallbacks. `model: ["groq/cheap", "openai/gpt-4o"]` chains automatically
- **ChatSDK** — `ChatSDK` class wraps `ConversationMemory` + `ChatAdapter` for prepare+call+record in one `chat()` / `stream()` call
- **ChatAdapter interface** — public interface, users write ~20 lines for any API. Ships OpenAI + Anthropic examples
- **`sabi/chat` exports** — `ChatSDK`, `OpenAIAdapter`, `AnthropicAdapter`, `ChatAdapter` type
- **Per-provider timeout & retry** — `ProviderConfig` accepts `timeout` and `retry` (statusCodes, maxRetries, backoffMs) that override global defaults per provider
- **`sabi/chat` sub-path export** — `import { ConversationMemory, SqliteSessionStore, PgSessionStore } from "@weysabi/sabi/chat"`
- **Pluggable store architecture** — `ConversationMemory` accepts any `StoreInterface` implementation
- **Session store** — `SqliteSessionStore` (SQLite) and `PgSessionStore` (Postgres) implementing shared `StoreInterface`
- **`postgres` peer dependency** — install when using `PgSessionStore`
- **Conversation memory** — `ConversationMemory` with persistent SQLite sessions, auto-truncation, system prompts
- **New design** — pure state manager (no `complete()` wrapper). `prepare()` returns context, user calls provider SDK natively, then `record()` persists the turn
- **RAG engine** — `RagEngine` with file ingestion, chunking, embedding, and HNSW-powered vector search
- **HNSW vector index** — in-memory approximate nearest neighbor with binary persistence to `.hnsw.vec` + `.hnsw.idx`
- **Multi-project manager** — `RagManager` with named project instances, shared providers, cross-project `queryAll()`
- **Query filters** — scope search by exact path, path prefix, or file ID
- **Embedding batch size** — configurable (default 512) to stay under API limits
- **Streaming ingestion** — `loadStream()` async generator yielding granular progress events
- **Object store abstraction** — `FsObjectStore`, `SqliteObjectStore`, BYO interface
- **WAL-mode SQLite** with 64MB cache, mmap, 64KB pages, configurable pragmas
- **`sabi/rag` sub-path export** — `import { RagEngine, RagManager, HnswVectorIndex } from "@weysabi/sabi/rag"`
