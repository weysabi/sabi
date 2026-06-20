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
