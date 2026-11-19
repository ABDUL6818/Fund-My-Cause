import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts (e.g. a caller's `p-8`
 * overriding a default `p-4`) instead of leaving both classes in the DOM.
 *
 * `clsx` and `tailwind-merge` were already declared dependencies but were
 * unused — every component composed classes with a plain filter+join, so a
 * caller-supplied `className` could never reliably override a component's
 * own conflicting utility classes.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(...classes));
}

/**
 * Shared focus-ring utilities.
 *
 * These reference the semantic `--ring` token (defined once in the shared
 * design-token source) so every interactive element gets the same, WCAG AA
 * contrast-safe focus indicator. The `ring-offset` variants pair with the
 * `--background` token so the offset remains visible on any surface.
 */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Focus-ring variant for elements rendered on a colored/primary surface,
 * where the default offset color would not provide sufficient contrast.
 */
export const focusRingInverse =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary";

/**
 * Contrast-safe text helpers.
 *
 * `textOnPrimary` / `textOnDestructive` pick the foreground token that is
 * guaranteed to meet WCAG AA against the corresponding solid background
 * token, so callers never have to hard-code `text-white` / `text-black`.
 */
export const textOnPrimary = "text-primary-foreground";
export const textOnDestructive = "text-destructive-foreground";

/**
 * Compose a component's base classes with an optional caller-supplied
 * `className`, always letting the caller win on conflicts. Thin wrapper over
 * `cn` kept for readability at call sites that only pass two arguments.
 */
export function withClassName(base: string, className?: string): string {
  return cn(base, className);
}
</｜｜DSML｜｜ parameter>