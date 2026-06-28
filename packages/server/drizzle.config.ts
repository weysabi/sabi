import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/control/drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
