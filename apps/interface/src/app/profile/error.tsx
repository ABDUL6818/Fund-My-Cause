/**
 * Error boundary for profile route segment — Issue #1285
 *
 * Catches errors during profile page rendering and provides recovery.
 */

"use client";

import { RouteError, type RouteErrorProps } from "@components-lib/ErrorBoundary";

export default function ProfileError({ error, reset }: RouteErrorProps) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Failed to load profile"
      description="Unable to load your profile. Please try again or contact support."
      homeHref="/"
    />
  );
}
