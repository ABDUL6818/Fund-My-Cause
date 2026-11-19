"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  /** Size in pixels (default 16) */
  size?: number;
  /** Extra Tailwind classes */
  className?: string;
  /** Screen-reader label (default "Loading…") */
  label?: string;
}

/**
 * Inline spinner for action buttons and async states.
 * Uses the brand color token so it adapts to light/dark automatically.
 *
 * This is the single source of truth for inline spinners. Do not create
 * duplicate spinner components; import this one instead. For list/detail
 * loading states, prefer the shared skeletons (e.g. CampaignDetailSkeleton)
 * over spinners.
 */
export function Spinner({
  size = 16,
  className,
  label = "Loading…",
}: SpinnerProps) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-[var(--color-brand)]", className)}
      aria-label={label}
      role="status"
    />
  );
}

export default Spinner;