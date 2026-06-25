import Link from "next/link";

export default function GuardrailsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-8 block">
        &larr; Back to docs
      </Link>
      <h1 className="text-3xl font-bold mb-6">Guardrails</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Overview</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Guardrails are a built-in plugin that intercepts input and output to enforce safety
          policies. Use them as a <code className="text-xs">sabi.use()</code> plugin.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Setup</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`import { createWeysabi } from "@weysabi/sabi";
import { createGuardrails } from "@weysabi/sabi/guardrails";

const sabi = createWeysabi({ groq: { apiKey: "..." } });

sabi.use(createGuardrails({
  input: {
    pii: { email: { action: "redact" }, phone: { action: "block" } },
    injection: { block: true, threshold: 0.5 },
    content: { hate: { action: "block" }, harassment: { action: "block" } },
  },
  output: {
    pii: { email: { action: "redact" } },
    tokenLimit: { maxTokens: 4096, action: "truncate" },
    content: { violence: { action: "warn" } },
  },
  moderationApiKey: process.env.OPENAI_API_KEY,
}));`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">PII Detection</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Detects and redacts or blocks personally identifiable information:
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-left py-2 pr-4">Actions</th>
                <th className="text-left py-2">Example</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["email", "block, redact, warn", "user@example.com"],
                ["phone", "block, redact, warn", "+1-555-0123"],
                ["ssn", "block, redact, warn", "123-45-6789"],
                ["credit_card", "block, redact, warn", "4111-1111-1111-1111"],
                ["api_key", "block, redact, warn", "sk-abc123..."],
                ["ip", "block, redact, warn", "192.168.1.1"],
              ].map(([cat, actions, example]) => (
                <tr key={cat} className="border-b border-border">
                  <td className="py-2 pr-4 font-medium">{cat}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{actions}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`{
  input: {
    pii: {
      email: { action: "redact" },   // replaces email with [REDACTED]
      credit_card: { action: "block" }, // throws GuardrailError
      api_key: { action: "warn" },     // logs warning, passes through
    },
  },
}`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Injection Detection</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Detects prompt injection, jailbreaks, and system prompt extraction attempts:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`{
  input: {
    injection: {
      block: true,
      threshold: 0.5, // 0-1, lower = more sensitive
    },
  },
}`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Content Safety</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Regex-based content filtering for input and output:
        </p>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto mb-4">
          <code>{`{
  input: {
    content: {
      hate: { action: "block" },
      harassment: { action: "block" },
      violence: { action: "warn" },
      sexual: { action: "block" },
      self_harm: { action: "block" },
    },
  },
}`}</code>
        </pre>
        <p className="text-sm text-muted-foreground">
          Combined with OpenAI Moderation API when <code className="text-xs">moderationApiKey</code>{" "}
          is set.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Output Token Limits</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`{
  output: {
    tokenLimit: {
      maxTokens: 2048,
      action: "truncate", // "block" | "warn" | "truncate"
    },
  },
}`}</code>
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Custom Guardrails</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-x-auto">
          <code>{`sabi.guardrail("custom-check", {
  scope: "both", // "input" | "output" | "both"
  validate(text) {
    if (text.includes("secret")) return { passed: false, message: "Contains 'secret'" };
    return { passed: true };
  },
  onViolation(match) {
    console.warn("Guardrail violation:", match);
  },
});`}</code>
        </pre>
      </section>
    </article>
  );
}
