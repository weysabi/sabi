interface Counter {
  name: string;
  help: string;
  labels: Record<string, string>;
  value: number;
  type: "counter" | "gauge" | "histogram";
}

export class MetricsStore {
  private counters = new Map<string, Counter>();
  private histograms = new Map<string, Counter>();
  private gauges = new Map<string, Counter>();
  private wsCount = 0;
  private histogramSums = new Map<string, number>();

  private static readonly histogramBuckets = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
  ];

  private labelKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }

  incWsConnection() {
    this.wsCount++;
  }

  decWsConnection() {
    this.wsCount--;
  }

  incCounter(name: string, labels: Record<string, string>, help?: string, value = 1) {
    const key = `${name}{${this.labelKey(labels)}}`;
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, {
        name,
        help: help ?? name,
        labels,
        value,
        type: "counter",
      });
    }
  }

  incLlmTokens(promptTokens: number, completionTokens: number) {
    this.incCounter(
      "llm_tokens_total",
      { type: "prompt" },
      "Total LLM tokens by type",
      promptTokens
    );
    this.incCounter(
      "llm_tokens_total",
      { type: "completion" },
      "Total LLM tokens by type",
      completionTokens
    );
    this.incCounter(
      "llm_tokens_total",
      { type: "total" },
      "Total LLM tokens by type",
      promptTokens + completionTokens
    );
  }

  setDbHealthy(healthy: boolean, backend?: string) {
    const labels: Record<string, string> = {};
    if (backend) labels.backend = backend;
    this.setGauge(
      "db_healthy",
      healthy ? 1 : 0,
      labels,
      "Database connectivity (1=healthy, 0=unhealthy)"
    );
  }

  setProviderEnabled(provider: string, enabled: boolean) {
    this.setGauge(
      "provider_enabled",
      enabled ? 1 : 0,
      { provider },
      "Provider configured and available (1=enabled, 0=disabled)"
    );
  }

  setGauge(name: string, value: number, labels: Record<string, string>, help?: string) {
    const key = `${name}{${this.labelKey(labels)}}`;
    this.gauges.set(key, {
      name,
      help: help ?? name,
      labels,
      value,
      type: "gauge",
    });
  }

  observeHistogram(baseName: string, value: number, labels: Record<string, string>, help?: string) {
    const sumKey = `${baseName}{${this.labelKey(labels)}}`;
    this.histogramSums.set(sumKey, (this.histogramSums.get(sumKey) ?? 0) + value);

    for (const le of MetricsStore.histogramBuckets) {
      if (value > le) continue;
      const ls = { ...labels, le: String(le) };
      const key = `${baseName}_bucket{${this.labelKey(ls)}}`;
      const existing = this.histograms.get(key);
      if (existing) {
        existing.value++;
      } else {
        this.histograms.set(key, {
          name: baseName,
          help: help ?? baseName,
          labels: ls,
          value: 1,
          type: "histogram",
        });
      }
    }
    const infKey = `${baseName}_bucket{${this.labelKey({ ...labels, le: "+Inf" })}}`;
    const inf = this.histograms.get(infKey);
    if (inf) {
      inf.value++;
    } else {
      this.histograms.set(infKey, {
        name: baseName,
        help: help ?? baseName,
        labels: { ...labels, le: "+Inf" },
        value: 1,
        type: "histogram",
      });
    }
  }

  private formatMetric(m: Counter): string {
    const labels = Object.entries(m.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${m.name}{${labels}} ${m.value}`;
  }

  private formatHeader(m: Counter): string {
    return `# HELP ${m.name} ${m.help}\n# TYPE ${m.name} ${m.type}`;
  }

  private emitHistogram(
    baseName: string,
    labels: Record<string, string>,
    description: string
  ): string[] {
    const lines: string[] = [];
    const key = `${baseName}{${this.labelKey(labels)}}`;

    lines.push(`# HELP ${baseName} ${description}`, `# TYPE ${baseName} histogram`);

    for (const le of MetricsStore.histogramBuckets) {
      const m = this.histograms.get(
        `${baseName}_bucket{${this.labelKey({ ...labels, le: String(le) })}}`
      );
      lines.push(
        `${baseName}_bucket{${this.labelKey({ ...labels, le: String(le) })}} ${m?.value ?? 0}`
      );
    }
    const inf = this.histograms.get(
      `${baseName}_bucket{${this.labelKey({ ...labels, le: "+Inf" })}}`
    );
    lines.push(
      `${baseName}_bucket{${this.labelKey({ ...labels, le: "+Inf" })}} ${inf?.value ?? 0}`
    );

    const count = inf?.value ?? 0;
    lines.push(`${baseName}_count{${this.labelKey(labels)}} ${count}`);
    const sum = this.histogramSums.get(key) ?? 0;
    lines.push(`${baseName}_sum{${this.labelKey(labels)}} ${sum}`);

    return lines;
  }

  private collect() {
    const mem = process.memoryUsage();
    for (const [type, bytes] of Object.entries(mem)) {
      this.setGauge("process_memory_bytes", bytes, { type }, "Process memory in bytes");
    }
  }

  textOutput(): string {
    this.collect();
    const lines: string[] = [];
    lines.push("# weysabi server metrics");

    const seenHeaders = new Set<string>();
    for (const m of this.counters.values()) {
      const h = this.formatHeader(m);
      if (!seenHeaders.has(h)) {
        lines.push(h);
        seenHeaders.add(h);
      }
      lines.push(this.formatMetric(m));
    }

    const histByBase = new Map<string, Map<string, Map<string, Counter>>>();
    for (const m of this.histograms.values()) {
      const base = m.name;
      if (!histByBase.has(base)) histByBase.set(base, new Map());
      const byLabels = histByBase.get(base)!;
      const lbl = this.labelKey(
        Object.fromEntries(Object.entries(m.labels).filter(([k]) => k !== "le"))
      );
      if (!byLabels.has(lbl)) byLabels.set(lbl, new Map());
      byLabels.get(lbl)!.set(m.labels.le ?? "+Inf", m);
    }

    for (const [base, byLabels] of histByBase) {
      for (const buckets of byLabels.values()) {
        const first = buckets.values().next().value;
        if (!first) continue;
        const baseLabels = Object.fromEntries(
          Object.entries(first.labels).filter(([k]) => k !== "le")
        );
        lines.push(...this.emitHistogram(base, baseLabels, first.help));
      }
    }

    this.gauges.set(`ws_connections_active{}`, {
      name: "ws_connections_active",
      help: "Active WebSocket connections",
      labels: {},
      value: this.wsCount,
      type: "gauge",
    });
    for (const m of this.gauges.values()) {
      const h = this.formatHeader(m);
      if (!seenHeaders.has(h)) {
        lines.push(h);
        seenHeaders.add(h);
      }
      lines.push(this.formatMetric(m));
    }

    return lines.join("\n") + "\n";
  }

  reset() {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.histogramSums.clear();
    this.wsCount = 0;
  }
}
