import React from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  action,
}: EmptyStateProps) {
  const visual = icon ?? illustration;
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      {visual && (
        <div className="text-gray-400 dark:text-gray-600">{visual}</div>
      )}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 px-5 py-2 ds-btn-primary text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}


