import { defineConfig } from "vitest/config";

/**
 * The component tests render through @testing-library/react, which needs a DOM.
 * Without this config vitest defaults to the `node` environment and every
 * render() call fails on a missing `document`.
 *
 * The include glob covers all unit tests under src/, including the focused
 * subcomponent tests for CampaignActions (contribute/withdraw/refund) and
 * CampaignHeader (title/status badge/creator info). The legacy *.entry.ts
 * files have been replaced by a single barrel, so no entry-specific test
 * patterns are needed here.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/index.ts",
        "src/**/index.ts",
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});