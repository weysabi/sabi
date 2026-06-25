import Link from "next/link";

export default function StreamingPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-8 block">
        &larr; Back to docs
      </Link>
      <h1 className="text-3xl font-bold mb-6">Streaming</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Client-Side Streaming</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Use <code className="text-xs">sabi.stream()</code> for token-by-token consumption:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`for await (const chunk of sabi.stream({
  model: "groq/llama-4-scout",
  messages: [{ role: "user", content: "Count to 5" }],
})) {
  process.stdout.write(chunk.content);
}`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Stream Chunk Type</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`interface StreamChunk {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  done: boolean;
}`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          Each chunk contains the next token in <code className="text-xs">content</code>. The final
          chunk sets <code className="text-xs">done: true</code> and may include{" "}
          <code className="text-xs">usage</code>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Server-Sent Events (SSE)</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Convert a stream into an SSE <code className="text-xs">Response</code>:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`import { toResponse } from "@weysabi/sabi/sse";

const stream = sabi.stream({ model: "groq/llama-4-scout", messages });
return toResponse(stream);`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Framework Adapters</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Re-exported adapters for popular frameworks:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`// Hono
import { toResponse } from "@weysabi/sabi/hono";
// or: import { toResponse } from "@weysabi/sabi/sse"

// Next.js App Router
import { toResponse } from "@weysabi/sabi/next";

// Elysia
import { toResponse } from "@weysabi/sabi/elysia";

// Express
import { pipe } from "@weysabi/sabi/express";
app.post("/chat", async (req, res) => {
  const stream = sabi.stream({ model: "groq/llama-4-scout", messages });
  pipe(stream, res);
});

// Fastify
import { pipe } from "@weysabi/sabi/fastify";
app.post("/chat", async (req, reply) => {
  const stream = sabi.stream({ model: "groq/llama-4-scout", messages });
  pipe(stream, reply);
});`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          Express and Fastify adapters pipe stream chunks into the response object directly. All
          others return a standard <code className="text-xs">Response</code>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Client: readStream</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Consume an SSE response on the client side:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`import { readStream } from "@weysabi/sabi/sse";

const response = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ messages }) });
for await (const chunk of readStream(response.body)) {
  console.log(chunk.content);
}`}</code>
        </pre>
      </section>
    </article>
  );
}
