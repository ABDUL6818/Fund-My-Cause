import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Ensure the DOM is cleaned up between tests when using @testing-library/react.
afterEach(() => {
  cleanup();
});

// Provide a fresh QueryClient for each test to avoid cross-test cache leakage.
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

// Wrapper component that supplies a QueryClientProvider for hook tests.
export function createQueryClientWrapper(
  queryClient: QueryClient = createTestQueryClient(),
) {
  return function QueryClientWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

// Default wrapper usable directly with render options.
export const QueryClientWrapper = createQueryClientWrapper();

// Silence noisy console errors that are expected in negative-path tests
// unless a test explicitly opts in to asserting on them.
vi.spyOn(console, "error").mockImplementation(() => {});