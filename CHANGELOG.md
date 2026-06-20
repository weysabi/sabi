# Changelog

## [Unreleased]

### Added

- **RAG engine** — `RagEngine` with file ingestion, chunking, embedding, and HNSW-powered vector search
- **HNSW vector index** — in-memory approximate nearest neighbor with binary persistence to `.hnsw.vec` + `.hnsw.idx`
- **Multi-project manager** — `RagManager` with named project instances, shared providers, cross-project `queryAll()`
- **Query filters** — scope search by exact path, path prefix, or file ID
- **Embedding batch size** — configurable (default 512) to stay under API limits
- **Streaming ingestion** — `loadStream()` async generator yielding granular progress events
- **Object store abstraction** — `FsObjectStore`, `SqliteObjectStore`, BYO interface
- **WAL-mode SQLite** with 64MB cache, mmap, 64KB pages, configurable pragmas
- **`sabi/rag` sub-path export** — `import { RagEngine, RagManager, HnswVectorIndex } from "@weysabi/sabi/rag"`
- **Conversation memory** — `ConversationMemory` with persistent SQLite sessions, auto-truncation, system prompts
- **New design** — pure state manager (no `complete()` wrapper). `prepare()` returns context, user calls provider SDK natively, then `record()` persists the turn
- **Session store** — `SqliteSessionStore` (SQLite) and `PgSessionStore` (Postgres) implementing shared `StoreInterface`
- **Pluggable store architecture** — `ConversationMemory` accepts any `StoreInterface` implementation
- **`sabi/chat` sub-path export** — `import { ConversationMemory, SqliteSessionStore, PgSessionStore } from "@weysabi/sabi/chat"`
- **`postgres` peer dependency** — install when using `PgSessionStore`
