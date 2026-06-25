import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
};

export default config;
