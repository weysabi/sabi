import { createWeysabi } from "@weysabi/client";
import { createServer } from "./index";
import { log } from "./logger";

const PROVIDER_ENV_VARS: Record<string, string> = {
  openai: "SABI_OPENAI_API_KEY",
  groq: "SABI_GROQ_API_KEY",
  anthropic: "SABI_ANTHROPIC_API_KEY",
  google: "SABI_GOOGLE_API_KEY",
  mistral: "SABI_MISTRAL_API_KEY",
  deepseek: "SABI_DEEPSEEK_API_KEY",
  together: "SABI_TOGETHER_API_KEY",
  nvidia: "SABI_NVIDIA_API_KEY",
  openrouter: "SABI_OPENROUTER_API_KEY",
  ollama: "SABI_OLLAMA_API_KEY",
};

const providers: Record<string, { apiKey: string }> = {};

for (const [name, envVar] of Object.entries(PROVIDER_ENV_VARS)) {
  const val = process.env[envVar];
  if (val) {
    providers[name] = { apiKey: val };
  }
}

if (Object.keys(providers).length === 0) {
  log.error("No providers configured. Set at least one SABI_*_API_KEY env var.");
  process.exit(1);
}

const sabi = createWeysabi(providers);

const port = Number(process.env.SABI_PORT) || 3000;
const apiKey = process.env.SABI_API_KEY;
const corsOrigins = process.env.SABI_CORS_ORIGINS
  ? process.env.SABI_CORS_ORIGINS.split(",").map((s) => s.trim())
  : undefined;
const rateLimitRpm = Number(process.env.SABI_RATE_LIMIT_RPM) || 300;

const server = await createServer(sabi, {
  port,
  apiKey,
  corsOrigins,
  rateLimitRpm,
  providers: Object.keys(providers),
});

log.info("Weysabi Server ready", {
  port: server.port,
  providers: Object.keys(providers),
  auth: !!apiKey,
  rateLimitRpm,
});

process.on("SIGINT", () => {
  log.info("Shutting down (SIGINT)");
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  log.info("Shutting down (SIGTERM)");
  server.stop();
  process.exit(0);
});
