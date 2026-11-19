import "@testing-library/jest-dom/vitest";
import { expect, afterEach, vi } from "vitest";
import * as matchers from "jest-axe/extend-expect";
import { cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Register jest-axe matchers (e.g. toHaveNoViolations) for accessibility tests.
expect.extend(matchers);

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

// Polyfill matchMedia for components that rely on media queries
// (e.g. reduced-motion / contrast preferences used in keyboard & a11y tests).
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated API
      removeListener: vi.fn(), // deprecated API
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Polyfill ResizeObserver for components that observe layout changes.
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ResizeObserver = ResizeObserverMock;
}

// Polyfill IntersectionObserver for components that rely on visibility.
if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
  class IntersectionObserverMock {
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).IntersectionObserver = IntersectionObserverMock;
}

// jsdom does not implement scrollIntoView, which is commonly invoked when
// moving focus during keyboard navigation.
if (typeof window !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// jsdom does not implement focus-related helpers used by some focus-trap
// libraries; provide no-op fallbacks so keyboard tests can run.
if (typeof window !== "undefined") {
  if (!HTMLElement.prototype.focus) {
    HTMLElement.prototype.focus = vi.fn();
  }
  if (!HTMLElement.prototype.blur) {
    HTMLElement.prototype.blur = vi.fn();
  }
}
