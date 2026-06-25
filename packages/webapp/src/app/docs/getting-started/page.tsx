import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-8 block">
        &larr; Back to docs
      </Link>
      <h1 className="text-3xl font-bold mb-6">Getting Started</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Installation</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>bun add @weysabi/sabi</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Basic Usage</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`import { createWeysabi } from "@weysabi/sabi";

const sabi = createWeysabi({
  groq: { apiKey: process.env.GROQ_API_KEY },
  openai: { apiKey: process.env.OPENAI_API_KEY },
});

const response = await sabi.complete({
  model: "groq/llama-4-scout",
  messages: [
    { role: "user", content: "Hello!" },
  ],
});

console.log(response.content);`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Streaming</h2>
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
        <h2 className="text-xl font-semibold mb-3">Provider Failover</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Pass an array of models to automatically fail over between providers:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`const response = await sabi.complete({
  model: ["groq/llama-4-scout", "openai/gpt-4o-mini"],
  messages: [{ role: "user", content: "Hello" }],
});`}</code>
        </pre>
      </section>
    </article>
  );
}
