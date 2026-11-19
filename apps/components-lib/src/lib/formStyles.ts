import { cn } from "./utils";

/**
 * Shared design tokens for form controls.
 *
 * These mirror the token source used by `apps/interface` so that focus rings
 * and semantic colors stay in sync across packages. Values are chosen to meet
 * WCAG AA contrast requirements (>= 3:1 for UI/focus indicators, >= 4.5:1 for
 * text on the associated surfaces).
 */
export const FORM_TOKENS = {
  /** Focus ring color (indigo-600) — >= 3:1 against white and gray-100. */
  focusRing: "ring-indigo-600",
  /** Border color for the default (non-error) state (gray-400). */
  borderDefault: "border-gray-400",
  /** Border + ring color for the error state (red-600). */
  borderError: "border-red-600",
  focusRingError: "ring-red-600",
  /** Disabled surface (gray-100) with gray-500 text for AA contrast. */
  disabledBg: "bg-gray-100",
  disabledText: "text-gray-500",
} as const;

/** Default control styling shared by Input, Select and Textarea. */
export const CONTROL_BASE = cn(
  "px-3 py-2 border rounded-lg text-base transition-colors",
  "focus-visible:outline-none focus-visible:ring-2",
  FORM_TOKENS.focusRing,
  "focus-visible:border-transparent",
  FORM_TOKENS.disabledBg,
  FORM_TOKENS.disabledText,
  "disabled:cursor-not-allowed",
);

export interface ControlClassNameOptions {
  /** Skip the library defaults entirely so the caller's classes fully own the look. */
  unstyled?: boolean;
  hasError?: boolean;
  fullWidth?: boolean;
}

/**
 * Builds the class string for a form control.
 *
 * With `unstyled` only the width modifier is emitted, which lets an app supply
 * its own design-system classes without fighting tailwind-merge over defaults.
 */
export function controlClassName({
  unstyled = false,
  hasError = false,
  fullWidth = false,
}: ControlClassNameOptions): string {
  if (unstyled) return fullWidth ? "w-full" : "";

  return cn(
    CONTROL_BASE,
    hasError
      ? cn(FORM_TOKENS.borderError, `focus-visible:${FORM_TOKENS.focusRingError}`)
      : FORM_TOKENS.borderDefault,
    fullWidth && "w-full",
  );
}