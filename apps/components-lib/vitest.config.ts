import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * The component tests render through @testing-library/react, which needs a DOM.
 * Without this config vitest defaults to the `node` environment and every
 * render() call fails on a missing `document`.
 *
 * The `@design-tokens` alias points at the single shared token source so the
 * components-lib and apps/interface consume the same tokens (see #1672).
 * `vitest.setup.ts` wires up jest-dom matchers and axe (jest-axe) so
 * accessibility assertions are available in every test (see #1670, #1671).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@design-tokens": fileURLToPath(
        new URL("../interface/src/styles/design-tokens.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});