import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Initialize and validate the test environment via the zod env schema so tests
// fail fast on invalid configuration. This also ensures tests do not rely on
// direct process.env reads.
jest.mock("./src/env", () => {
  const actual = jest.requireActual("./src/env");
  return actual;
});

beforeAll(() => {
  // Trigger schema validation at startup for the test environment.
  // The env module validates NEXT_PUBLIC_* variables via zod on import.
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("./src/env");
  });
});