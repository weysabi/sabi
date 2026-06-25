import Link from "next/link";

export default function RagPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-8 block">
        &larr; Back to docs
      </Link>
      <h1 className="text-3xl font-bold mb-6">RAG Engine</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Overview</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Weysabi includes a built-in RAG (Retrieval-Augmented Generation) engine with zero external
          dependencies. It uses SQLite for metadata storage, HNSW for vector search, and supports
          file ingestion, text splitting, and embedding-based retrieval.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Basic Usage</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`import { createWeysabi } from "@weysabi/sabi";

const sabi = createWeysabi({
  openai: { apiKey: process.env.OPENAI_API_KEY },
});

await sabi.rag.setProviders({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});

// Ingest a file
await sabi.rag.load("README.md");

// Ingest a directory
await sabi.rag.load("./docs");

// Ingest raw text
await sabi.rag.load({ name: "notes.txt", content: "Some text..." });

// Query
const results = await sabi.rag.query("What is the project about?");
console.log(results[0]?.content);`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Streaming Ingestion</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Monitor ingestion progress with <code className="text-xs">loadStream()</code>:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`for await (const event of sabi.rag.loadStream("./large-dir")) {
  switch (event.type) {
    case "start": console.log(\`Processing \${event.total} files...\`); break;
    case "file_start": console.log(\`Loading \${event.filePath}\`); break;
    case "chunk": console.log(\`  \${event.chunks} chunks created\`); break;
    case "embed": console.log(\`  Embedding batch \${event.batch}/\${event.total}\`); break;
    case "file_done": console.log(\`  Done: \${event.chunks} chunks\`); break;
    case "error": console.error(\`  Error: \${event.error}\`); break;
    case "done": console.log("All done."); break;
  }
}`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Multi-Project Management</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Use <code className="text-xs">RagManager</code> for multiple isolated projects:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`import { RagManager } from "@weysabi/sabi/rag";

const manager = new RagManager({
  basePath: ".sabi/rag/projects",
  providers: {
    embeddingProvider: { provider: "openai", apiKey: process.env.OPENAI_API_KEY },
  },
});

const docs = manager.project("docs");
await docs.load("./documentation");

const support = manager.project("support");
await support.load("./support-tickets");

// Cross-project search
const all = await manager.queryAll("How to reset password?");
all.forEach(r => console.log(\`[\${r.project}] \${r.content}\`));

manager.close();`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Query Filters</h2>
        <p className="mb-3 text-sm text-muted-foreground">Scope queries by file path or ID:</p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`const results = await sabi.rag.query("deployment", 5, {
  path: "docs/deployment.md",
});

// By path prefix
const allInDir = await sabi.rag.query("setup", 10, {
  pathPrefix: "docs/",
});`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Configuration</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Tune chunking, embedding, and search behavior:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const sabi = createWeysabi(
  { openai: { apiKey: process.env.OPENAI_API_KEY } },
  {
    rag: {
      chunkSize: 2000,
      chunkOverlap: 200,
      topK: 10,
      dbPath: ".sabi/rag.db",
      embeddingModel: "openai/text-embedding-3-small",
      embeddingBatchSize: 20,
    },
  }
);`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Conversation Memory</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Pair RAG with <code className="text-xs">ConversationMemory</code> for persistent,
          context-aware sessions:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`import { ConversationMemory } from "@weysabi/sabi/chat";

const memory = new ConversationMemory("session-123", {
  store: new SqliteSessionStore(),
  maxTurns: 10,
});

await memory.add("user", "What is the API rate limit?");
const ragResults = await sabi.rag.query("API rate limit");
await memory.add("system", \`Context: \${ragResults.map(r => r.content).join("\\n")}\`);

const response = await sabi.complete({
  model: "groq/llama-4-scout",
  messages: await memory.getMessages(),
});
await memory.add("assistant", response.content);`}</code>
        </pre>
      </section>
    </article>
  );
}
