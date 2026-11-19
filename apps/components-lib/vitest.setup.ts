import "@testing-library/jest-dom";
import { expect } from "vitest";
import * as matchers from "jest-axe/extend-expect";

// Register jest-axe matchers (e.g. toHaveNoViolations) for accessibility tests.
expect.extend(matchers);

// Polyfill matchMedia for components that rely on media queries (e.g. reduced motion,
// color scheme, responsive breakpoints) during keyboard navigation and contrast tests.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
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
      };
      return mediaQueryList as unknown as MediaQueryList;
    },
  });
}

// Polyfill ResizeObserver, commonly required by focus-management and layout-aware
// components exercised in keyboard navigation tests.
if (typeof window !== "undefined" && typeof window.ResizeObserver === "undefined") {
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
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverPolyfill,
  });
}

// Polyfill IntersectionObserver for components that lazy-render or manage focus
// based on visibility.
if (
  typeof window !== "undefined" &&
  typeof window.IntersectionObserver === "undefined"
) {
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
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverPolyfill,
  });
}

// Ensure focus-related APIs exist in jsdom environments used by keyboard tests.
if (typeof HTMLElement !== "undefined") {
  if (typeof HTMLElement.prototype.scrollIntoView !== "function") {
    HTMLElement.prototype.scrollIntoView = function scrollIntoView(): void {};
  }
  if (typeof HTMLElement.prototype.focus !== "function") {
    HTMLElement.prototype.focus = function focus(): void {};
  }
}