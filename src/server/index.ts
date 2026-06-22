import type { Sabi } from "../index";
import { createRouter } from "./routes";

export interface SabiServerOptions {
  port?: number;
}

export async function createSabiServer(
  sabi: Sabi,
  options: SabiServerOptions = {}
): Promise<{
  fetch: (req: Request) => Response | Promise<Response>;
  port: number;
  stop: () => void;
}> {
  const port = options.port ?? (Number(process.env.SABI_PORT) || 3000);
  const router = await createRouter(sabi);

  const server = Bun.serve({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    port: port as any,
    fetch: router.fetch as (req: Request) => Response | Promise<Response>,
  });

  return {
    fetch: router.fetch as (req: Request) => Response | Promise<Response>,
    port: server.port as number,
    stop: () => server.stop(),
  };
}

export { translateRequest, translateResponse, translateStreamChunk } from "./translate";
