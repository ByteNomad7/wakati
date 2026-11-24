import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Tests against a real Supabase stack. See tests/integration and docs/SUPABASE.md. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server environment; it is a no-op in tests.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.int.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Tests share users and run in order within the file.
    fileParallelism: false,
  },
});
