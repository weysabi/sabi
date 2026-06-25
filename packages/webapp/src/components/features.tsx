import { Sparkles, Shield, Brain, Zap, Workflow, BookOpen } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Provider failover",
    description:
      "Auto-fallback between Groq, OpenAI, Anthropic, Google, and more. Circuit breaker, retry with backoff, and per-provider timeouts.",
  },
  {
    icon: Brain,
    title: "RAG engine",
    description:
      "Built-in vector search with HNSW indexes. Ingest files, directories, or raw text. Query across projects with cross-project search.",
  },
  {
    icon: Shield,
    title: "Guardrails",
    description:
      "PII redaction, prompt injection detection, content safety, output token limits, and custom validators. Plugin architecture.",
  },
  {
    icon: Sparkles,
    title: "Structured output",
    description:
      "Zod schemas for type-safe LLM responses. Streaming SSE, Express, Fastify, Hono, Next.js, and Elysia adapters included.",
  },
  {
    icon: Workflow,
    title: "Prompt management",
    description:
      "Typed, versioned templates with {variable} substitution. Run prompts through the full provider pipeline in one call.",
  },
  {
    icon: BookOpen,
    title: "Server & CLI",
    description:
      "Drop-in OpenAI-compatible HTTP server. CLI for `sabi init`, `sabi server`, and interactive provider setup.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <h2 className="text-3xl font-bold text-center mb-12">
        Everything you need, nothing you don&apos;t
      </h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-lg border border-border p-6 transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <feature.icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
