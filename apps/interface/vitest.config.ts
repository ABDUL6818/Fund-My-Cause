import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Workspace packages ship TypeScript source — point at it directly so
      // vitest transforms them instead of choking on the bare specifier.
      "@fund-my-cause/components": fileURLToPath(
        new URL("../components-lib/src/index.ts", import.meta.url),
      ),
      "@fund-my-cause/shared-utils": fileURLToPath(
        new URL("../../packages/shared-utils/src/index.ts", import.meta.url),
      ),
      "@fund-my-cause/types": fileURLToPath(
        new URL("../../packages/types/src/index.ts", import.meta.url),
      ),
      // Single source of truth for design tokens shared with components-lib.
      "@fund-my-cause/design-tokens": fileURLToPath(
        new URL("../../packages/design-tokens/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Setup file wires jest-axe matchers and global a11y helpers.
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});