import React from "react";
import { cn } from "./lib/utils";

export interface ErrorStateProps {
  title: string;
  description?: string;
  error?: string;
  icon?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
  className?: string;
  iconClassName?: string;
  contentClassName?: string;
}

export function ErrorState({
  title,
  description,
  error,
  icon,
  actions,
  className,
  iconClassName,
  contentClassName,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
      data-testid="error-state"
    >
      {icon && (
        <div
          className={cn("mb-4 text-error", iconClassName)}
          data-testid="error-state-icon"
        >
          {icon}
        </div>
      )}
      <div className={cn("space-y-2", contentClassName)}>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm text-error mt-3" role="alert">
            {error}
          </p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                action.variant === "secondary"
                  ? "bg-muted hover:bg-muted/80 text-foreground"
                  : "bg-error hover:bg-error/90 text-error-foreground",
              )}
              data-testid={`error-state-action-${idx}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
