"use client";

/**
 * Shared ErrorBoundary component — Issue #1285
 *
 * Error boundary for Next.js that catches errors in child components
 * and displays a user-friendly error page with recovery options.
 * Can be used in both Client and Server components via error.tsx.
 */

import {
  ErrorBoundary as SharedErrorBoundary,
  ErrorFallback as SharedErrorFallback,
} from "@interface/components-lib/src/ErrorBoundary";

/**
 * Thin wrapper around the shared components-lib ErrorBoundary so the
 * interface app has a single fallback contract (Issue #1657).
 */
export const ErrorBoundary = SharedErrorBoundary;

/**
 * Default error UI for when no custom fallback is provided.
 * Re-exported from components-lib to avoid duplicate fallback markup.
 */
export const DefaultErrorFallback = SharedErrorFallback;

/**
 * Hook to use error boundary functionality in functional components via error.tsx
 * Pattern: export function error({ error, reset }: ErrorPageProps) { ... }
 */
export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}
