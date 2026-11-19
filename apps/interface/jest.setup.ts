import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

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