import { resolveProviders } from "../utils";

export async function serverCommand(options: { port?: string; host?: string }): Promise<void> {
  const providers = resolveProviders();
  if (Object.keys(providers).length === 0) {
    console.error(
      "No providers configured. Set SABI_OPENAI_API_KEY (or similar) or create sabi.json."
    );
    process.exit(1);
  }

  const { createSabi } = await import("../../index");
  const sabi = createSabi(providers);

  const { createSabiServer } = await import("../../server/index");

  const port = Number(options.port) || Number(process.env.SABI_PORT) || 3000;

  console.log(`Sabi Server starting on http://localhost:${port}`);
  console.log(`Providers: ${Object.keys(providers).join(", ")}`);

  try {
    const server = await createSabiServer(sabi, { port });
    console.log(`Sabi Server ready — http://localhost:${server.port}`);
    console.log("Endpoints:");
    console.log(`  POST /v1/chat/completions — OpenAI-compatible chat`);
    console.log(`  GET  /v1/models           — List models`);
    console.log(`  GET  /health              — Health check`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
}
