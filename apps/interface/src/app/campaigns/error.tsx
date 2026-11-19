/**
 * Error boundary for campaigns route segment — Issue #1285
 *
 * Catches errors during campaigns page rendering and provides recovery.
 */

"use client";

import { RouteError, type RouteErrorProps } from "@/components/ErrorBoundary";

export default function CampaignsError({ error, reset }: RouteErrorProps) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Failed to load campaigns"
      message={
        error?.message ||
        "Unable to load the campaigns list. Please try again."
      }
    />
  );
}
