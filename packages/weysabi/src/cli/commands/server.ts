import { errorMessage } from "../../index";
import { resolveProviders } from "../utils";
import type { Weysabi } from "../../weysabi";

export async function serverCommand(options: { port?: string; host?: string }): Promise<void> {
  const providers = resolveProviders();
  if (Object.keys(providers).length === 0) {
    console.error(
      "No providers configured. Set OPENAI_API_KEY (or similar) or create weysabi.json."
    );
    process.exit(1);
  }

  const { createWeysabi } = await import("../../index");
  const weysabi = createWeysabi(providers);

  let createServer: (
    weysabi: Weysabi,
    options: { port?: number; hostname?: string; providers?: string[] }
  ) => Promise<{ port: number; hostname: string }>;
  try {
    createServer = (await import("weysabi-server")).createServer;
  } catch {
    console.error(
      "weysabi-server is required for weysabi serve. Install it: bun add weysabi-server"
    );
    process.exit(1);
  }

  const port = Number(options.port) || Number(process.env.WEYSABI_PORT) || 3000;
  const hostname = options.host || process.env.WEYSABI_HOST || "0.0.0.0";
  const displayHost = hostname === "0.0.0.0" || hostname === "::" ? "localhost" : hostname;

  console.log(`Weysabi Server starting on http://${displayHost}:${port}`);
  console.log(`Providers: ${Object.keys(providers).join(", ")}`);

  try {
    const server = await createServer(weysabi, {
      port,
      hostname,
      providers: Object.keys(providers),
    });
    console.log(`Weysabi Server ready — http://${displayHost}:${server.port}`);
    console.log("Endpoints:");
    console.log("  POST /v1/chat/completions — OpenAI-compatible chat");
    console.log("  GET  /v1/models           — List models");
    console.log("  GET  /health              — Health check");
  } catch (err) {
    console.error(`Failed to start server: ${errorMessage(err)}`);
    process.exit(1);
  }
}
