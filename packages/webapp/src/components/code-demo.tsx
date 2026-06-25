const code = `import { createWeysabi } from "@weysabi/sabi";
import { z } from "zod";

const sabi = createWeysabi({
  groq: { apiKey: process.env.GROQ_API_KEY },
  openai: { apiKey: process.env.OPENAI_API_KEY },
});

const response = await sabi.complete({
  model: "groq/llama-4-scout",
  messages: [{ role: "user", content: "Hello!" }],
  fallbacks: ["openai/gpt-4o-mini"],
  response: { schema: z.object({
    greeting: z.string(),
  })},
  rag: ["docs/*.md"],
  guardrails: ["pii", "toxicity"],
});

console.log(response.content);`;

export function CodeDemoSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24">
      <div className="animate-fade-in-up">
        <h2 className="text-3xl font-bold text-center mb-4">One library, zero markup</h2>
        <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
          Provider failover, structured output, RAG, and guardrails — no wrappers, no lock-in.
        </p>

        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 bg-muted px-4 py-3 border-b border-border">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">demo.ts</span>
          </div>
          <pre className="bg-card p-5 overflow-x-auto">
            <code className="text-sm leading-relaxed text-foreground/90">{code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
