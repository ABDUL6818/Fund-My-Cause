import React from "react";
import { cn } from "./lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  iconClassName?: string;
  contentClassName?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  iconClassName,
  contentClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
      data-testid="empty-state"
    >
      {icon && (
        <div
          className={cn(
            "mb-4 text-muted-foreground",
            iconClassName,
          )}
          data-testid="empty-state-icon"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <div className={cn("space-y-2", contentClassName)}>
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "mt-4 px-4 py-2 rounded-lg text-sm font-medium transition",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          data-testid="empty-state-action"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}