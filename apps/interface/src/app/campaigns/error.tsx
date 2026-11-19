/**
 * Error boundary for campaigns route segment — Issue #1285
 *
 * Catches errors during campaigns page rendering and provides recovery.
 */

"use client";

import { ErrorPageProps } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";

export default function CampaignsError({ error, reset }: ErrorPageProps) {
  return (
    <ErrorState
      title="Failed to load campaigns"
      message={
        error?.message ||
        "Unable to load the campaigns list. Please try again."
      }
      onRetry={reset}
      retryLabel="Try again"
      actionHref="/"
      actionLabel="Go home"
    />
  );
}
