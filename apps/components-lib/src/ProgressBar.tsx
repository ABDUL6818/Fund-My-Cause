"use client";

import React from "react";
import { cn } from "./lib/utils";
import { clampProgress, isProgressFunded } from "./utils/progress";

export interface ProgressBarProps {
  progress: number; // 0–100
  animated?: boolean;
  showLabel?: boolean;
  color?: "indigo" | "green" | "blue" | "red";
}

/**
 * Progress bar component
 * @example
 * <ProgressBar progress={65} animated showLabel />
 */
function ProgressBarComponent({
  progress,
  animated = false,
  showLabel = true,
  color = "indigo",
}: ProgressBarProps) {
  const clamped = clampProgress(progress);
  const isFunded = isProgressFunded(clamped);

  const colorClasses = {
    indigo: "bg-indigo-600",
    green: "bg-green-600",
    blue: "bg-blue-600",
    red: "bg-red-600",
  };

  const labelColorClasses = {
    indigo: "text-indigo-300",
    green: "text-green-300",
    blue: "text-blue-300",
    red: "text-red-300",
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative">
        <div
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${Math.round(clamped)}%`}
          aria-label="Progress"
          className="w-full bg-gray-700 rounded-full h-2 relative overflow-hidden"
        >
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              isFunded ? "bg-green-600" : colorClasses[color],
              animated && "animate-shimmer",
            )}
            style={{ width: `${clamped}%` }}
          />
          <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-500 opacity-50" />
        </div>
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium min-w-[3rem] text-right",
            isFunded ? "text-green-300" : labelColorClasses[color],
          )}
          aria-hidden="true"
        >
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}

export const ProgressBar = React.memo(ProgressBarComponent);
