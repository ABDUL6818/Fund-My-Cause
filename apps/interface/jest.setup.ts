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
// Polyfill matchMedia for components that respond to prefers-reduced-motion
// and prefers-contrast media queries (used by keyboard/contrast tests).
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => {
      const listeners = new Set<(event: MediaQueryListEvent) => void>();

      const mediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.add(listener);
        },
        removeListener: (listener: (event: MediaQueryListEvent) => void) => {
          listeners.delete(listener);
        },
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.add(listener);
        },
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          listeners.delete(listener);
        },
        dispatchEvent: (event: Event): boolean => {
          listeners.forEach((listener) =>
            listener(event as MediaQueryListEvent),
          );
          return true;
        },
      } as unknown as MediaQueryList;

      return mediaQueryList;
    },
  });
}

// Polyfill ResizeObserver for components that measure layout during focus
// management (e.g. focus traps and roving tabindex implementations).
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  Object.defineProperty(window, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverPolyfill,
  });
}

// Polyfill IntersectionObserver for components that lazily render content
// which must still be reachable via keyboard navigation in tests.
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  class IntersectionObserverPolyfill {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverPolyfill,
  });
}
