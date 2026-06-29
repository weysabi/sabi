import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { createWeysabi } from "weysabi";
import { createRouter } from "./routes";
import { MetricsStore } from "./metrics";

describe("MetricsStore", () => {
  it("produces valid Prometheus text output", () => {
    const m = new MetricsStore();
    m.incCounter("test_requests", { method: "GET", path: "/test", status: "200" });
    m.observeHistogram("test_duration_seconds", 0.05, { method: "GET", path: "/test" });

    const output = m.textOutput();
    expect(output).toContain("# HELP test_requests");
    expect(output).toContain("# TYPE test_requests counter");
    expect(output).toContain('test_requests{method="GET",path="/test",status="200"} 1');
    expect(output).toContain("_bucket");
  });

  it("increments counters", () => {
    const m = new MetricsStore();
    m.incCounter("requests", { status: "200" });
    m.incCounter("requests", { status: "200" });
    m.incCounter("requests", { status: "500" });

    const output = m.textOutput();
    expect(output).toContain('requests{status="200"} 2');
    expect(output).toContain('requests{status="500"} 1');
  });

  it("sets and updates gauges", () => {
    const m = new MetricsStore();
    m.setGauge("active_connections", 5, {});
    expect(m.textOutput()).toContain("active_connections{} 5");

    m.setGauge("active_connections", 3, {});
    expect(m.textOutput()).toContain("active_connections{} 3");
  });

  it("buckets histogram values correctly", () => {
    const m = new MetricsStore();
    m.observeHistogram("latency", 0.003, { method: "GET" });
    m.observeHistogram("latency", 0.2, { method: "GET" });
    m.observeHistogram("latency", 15, { method: "GET" });

    const output = m.textOutput();
    expect(output).toContain('latency_bucket{le="0.005",method="GET"} 1');
    expect(output).toContain('latency_bucket{le="0.25",method="GET"} 2');
    expect(output).toContain('latency_bucket{le="+Inf",method="GET"} 3');
    expect(output).toContain('latency_count{method="GET"}');
    expect(output).toContain('latency_sum{method="GET"}');
  });

  it("resets all metrics", () => {
    const m = new MetricsStore();
    m.incCounter("requests", { status: "200" });
    m.observeHistogram("latency", 0.1, { method: "GET" });
    m.incWsConnection();
    m.reset();
    const out = m.textOutput().trim();
    expect(out).toContain("# weysabi server metrics");
    expect(out).not.toContain("# HELP requests");
    expect(out).not.toContain("# HELP latency");
  });
});

describe("MetricsStore — gap-fill metrics", () => {
  it("incLlmTokens increments prompt, completion, and total counters", () => {
    const m = new MetricsStore();
    m.incLlmTokens(50, 30);

    const output = m.textOutput();
    expect(output).toContain('llm_tokens_total{type="prompt"} 50');
    expect(output).toContain('llm_tokens_total{type="completion"} 30');
    expect(output).toContain('llm_tokens_total{type="total"} 80');
  });

  it("multiple incLlmTokens calls accumulate", () => {
    const m = new MetricsStore();
    m.incLlmTokens(10, 5);
    m.incLlmTokens(20, 10);

    const output = m.textOutput();
    expect(output).toContain('llm_tokens_total{type="prompt"} 30');
    expect(output).toContain('llm_tokens_total{type="completion"} 15');
    expect(output).toContain('llm_tokens_total{type="total"} 45');
  });

  it("setDbHealthy emits gauge with backend label", () => {
    const m = new MetricsStore();
    m.setDbHealthy(true, "sqlite");

    const output = m.textOutput();
    expect(output).toContain("# HELP db_healthy");
    expect(output).toContain("# TYPE db_healthy gauge");
    expect(output).toContain('db_healthy{backend="sqlite"} 1');
  });

  it("setDbHealthy with unhealthy state", () => {
    const m = new MetricsStore();
    m.setDbHealthy(false, "postgres");

    const output = m.textOutput();
    expect(output).toContain('db_healthy{backend="postgres"} 0');
  });

  it("setProviderEnabled emits gauge", () => {
    const m = new MetricsStore();
    m.setProviderEnabled("openai", true);
    m.setProviderEnabled("groq", true);
    m.setProviderEnabled("anthropic", false);

    const output = m.textOutput();
    expect(output).toContain("# HELP provider_enabled");
    expect(output).toContain("# TYPE provider_enabled gauge");
    expect(output).toContain('provider_enabled{provider="openai"} 1');
    expect(output).toContain('provider_enabled{provider="groq"} 1');
    expect(output).toContain('provider_enabled{provider="anthropic"} 0');
  });

  it("process_memory_bytes appears in output", () => {
    const m = new MetricsStore();
    const output = m.textOutput();
    expect(output).toContain("# HELP process_memory_bytes");
    expect(output).toContain("# TYPE process_memory_bytes gauge");
    expect(output).toContain('process_memory_bytes{type="rss"}');
    expect(output).toContain('process_memory_bytes{type="heapUsed"}');
    expect(output).toContain('process_memory_bytes{type="heapTotal"}');
  });
});

describe("Metrics integration", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "ok", role: "assistant" } }],
            usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )) as unknown as typeof globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("exposes request metrics at GET /metrics", async () => {
    const store = new MetricsStore();
    const weysabi = createWeysabi({ groq: { apiKey: "test" } });
    const router = await createRouter(weysabi, {
      apiKey: "sk-metrics",
      metricsStore: store,
    });

    const res = await router.fetch(
      new Request("http://localhost/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer sk-metrics",
        },
        body: JSON.stringify({
          model: "groq/llama-4-scout",
          messages: [{ role: "user", content: "Hi" }],
        }),
      })
    );
    expect(res.status).toBe(200);

    const metricsRes = await router.fetch(new Request("http://localhost/metrics"));
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.headers.get("content-type")).toBe("text/plain; version=0.0.4");

    const body = await metricsRes.text();
    expect(body).toContain("http_requests_total");
    expect(body).toContain('path="/v1/chat/completions"');
    expect(body).toContain('status="200"');
    expect(body).toContain("http_request_duration_seconds_bucket");
  });
});
