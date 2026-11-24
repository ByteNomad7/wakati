import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server environment; it is a no-op in tests.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    // Real-backend tests have their own config (npm run test:integration).
    exclude: ["tests/integration/**", "node_modules/**"],
    setupFiles: ["tests/support/setup.ts"],
    testTimeout: 30_000,
  },
});
