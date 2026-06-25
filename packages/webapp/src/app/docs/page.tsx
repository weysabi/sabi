import Link from "next/link";

const pages = [
  {
    title: "Getting Started",
    description: "Installation, basic usage, and API overview",
    href: "/docs/getting-started",
  },
  {
    title: "Running the Server",
    description: "Start an OpenAI-compatible HTTP server",
    href: "/docs/running-the-server",
  },
  {
    title: "Provider Configuration",
    description: "Set up providers, retries, circuit breaker, and timeout",
    href: "/docs/providers",
  },
  {
    title: "Guardrails",
    description: "PII redaction, injection detection, content safety",
    href: "/docs/guardrails",
  },
  {
    title: "RAG Engine",
    description: "Vector search, file ingestion, and conversation memory",
    href: "/docs/rag",
  },
  {
    title: "Prompts",
    description: "Typed templates with variable substitution",
    href: "/docs/prompts",
  },
  {
    title: "Streaming",
    description: "SSE adapters for Hono, Next.js, Express, Fastify, Elysia",
    href: "/docs/streaming",
  },
  {
    title: "API Reference",
    description: "Complete API documentation for all exports",
    href: "/docs/api",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Documentation</h1>
      <p className="text-muted-foreground mb-10">Everything you need to build with Weysabi.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="group rounded-lg border border-border p-5 transition-all hover:border-primary"
          >
            <h2 className="font-semibold group-hover:text-primary">{page.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{page.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
