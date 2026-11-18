import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

expect.extend(toHaveNoViolations);

// Create a fresh QueryClient for each test to avoid cross-test cache leakage.
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper that provides a QueryClientProvider for hook/component tests.
export function createQueryClientWrapper(
  queryClient: QueryClient = createTestQueryClient(),
): React.FC<{ children: React.ReactNode }> {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
}

// Silence expected React Query errors during tests unless explicitly enabled.
const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const first = args[0];
    if (
      typeof first === "string" &&
      (first.includes("QueryClient") || first.includes("React Query"))
    ) {
      return;
    }
    originalConsoleError(...(args as Parameters<typeof console.error>));
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});