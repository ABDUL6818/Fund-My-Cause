import "@testing-library/jest-dom/vitest";

// Initialize and validate the test environment variables via the zod env schema
// so Vitest tests use the validated config object instead of reading process.env directly.
import { env } from "./src/lib/env";

// Expose the validated env on globalThis for tests that need to assert against it.
(globalThis as unknown as { __ENV__: typeof env }).__ENV__ = env;