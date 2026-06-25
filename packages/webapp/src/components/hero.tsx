import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <div className="relative mx-auto max-w-4xl">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          AI orchestration for fullstack devs
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          One library, zero markup. Provider failover, structured output, RAG, streaming,
          guardrails, and prompts — all in a single Bun-native package.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/docs"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Get started
          </Link>
          <Link
            href="https://github.com/weysabi/sabi"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium transition-colors hover:bg-muted"
          >
            GitHub
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Requires Bun &ge; 1.3</p>
      </div>
    </section>
  );
}
