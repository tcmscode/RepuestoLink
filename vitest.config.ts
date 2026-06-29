import path from "path";
import { loadEnvFile } from "node:process";
import { defineConfig } from "vitest/config";

try {
  loadEnvFile(path.resolve(__dirname, ".env"));
} catch {
  // .env opcional en CI (variables inyectadas)
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["tests/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.integration.test.ts"],
          fileParallelism: false,
          hookTimeout: 60000,
          testTimeout: 60000,
        },
      },
    ],
  },
});
