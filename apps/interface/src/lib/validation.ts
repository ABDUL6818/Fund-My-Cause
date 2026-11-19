/**
 * Input validation and sanitization utilities for campaign creation.
 *
 * Field-level validators (title, description, goal, deadline, minContribution,
 * feeBps) are delegated to the shared @fund-my-cause/types package so the
 * frontend and backend always apply identical rules.
 *
 * Interface-specific helpers (isValidContractId, validateContractId,
 * sanitizeTitle, sanitizeDescription, validateVideoUrl,
 * validateMaxContribution) remain here.
 */

import {
  validateCampaignTitle,
  validateCampaignDescription,
  validateCampaignGoal,
  validateCampaignDeadline,
  validateMinContribution as sharedValidateMinContribution,
  validateFeeBps as sharedValidateFeeBps,
  validateContractId as sharedValidateContractId,
  validateVideoUrl as sharedValidateVideoUrl,
  validateMaxContribution as sharedValidateMaxContribution,
} from "@fund-my-cause/types";
import { z } from "zod";
import {
  optionalXlmCapSchema,
  firstSchemaError,
} from "@/lib/validationSchemas";
import { sanitizeText } from "@/lib/sanitize";

// Re-export shared constants for callers that import them from this module.
export {
  CAMPAIGN_TITLE_MAX_LENGTH,
  CAMPAIGN_DESCRIPTION_MAX_LENGTH,
  CAMPAIGN_DEADLINE_MIN_HOURS,
  CAMPAIGN_DEADLINE_MAX_YEARS,
  DONATION_MIN_XLM,
  XLM_TO_STROOPS,
} from "@fund-my-cause/types";

// ---------------------------------------------------------------------------
// Interface-specific helpers (not shared)
// ---------------------------------------------------------------------------

/**
 * Validate that a string is a valid Stellar contract ID.
 * Contract IDs start with 'C', are 56 characters long, and use valid base32 characters.
 */
export function isValidContractId(id: string): boolean {
  return sharedValidateContractId(id) === null;
}

/**
 * Validate a Stellar contract ID.
 * @returns Error message if invalid, null if valid
 */
export function validateContractId(id: string): string | null {
  return sharedValidateContractId(id);
}

/**
 * Validate an optional video URL.
 * @returns Error message if invalid, null if valid
 */
export function validateVideoUrl(videoUrl: string): string | null {
  return sharedValidateVideoUrl(videoUrl);
}

/**
 * Validate maximum contribution per contributor.
 * A value of 0 means no limit. If set, must be >= minContribution.
 * Use case: prevents whale dominance by capping any single contributor's total pledge.
 * @returns Error message if invalid, null if valid
 */
export function validateMaxContribution(
  maxContribution: string,
  minContribution: string,
): string | null {
  return sharedValidateMaxContribution(maxContribution, minContribution);
}

/**
 * Sanitize title by stripping HTML tags (including script/style contents) and trimming.
 */
export function sanitizeTitle(title: string): string {
  return sanitizeText(title).trim();
}

/**
 * Sanitize description by stripping HTML tags (including script/style contents) and trimming.
 */
export function sanitizeDescription(description: string): string {
  return sanitizeText(description).trim();
}

// ---------------------------------------------------------------------------
// Delegated validators (backward-compatible wrappers around shared logic)
// ---------------------------------------------------------------------------

/**
 * Validate and sanitize campaign title.
 * @returns Error message if invalid, null if valid
 */
export function validateTitle(title: string): string | null {
  return validateCampaignTitle(title);
}

/**
 * Validate and sanitize campaign description.
 * @returns Error message if invalid, null if valid
 */
export function validateDescription(description: string): string | null {
  return validateCampaignDescription(description);
}

/**
 * Validate funding goal.
 * @returns Error message if invalid, null if valid
 */
export function validateGoal(goal: string): string | null {
  return validateCampaignGoal(goal);
}

/**
 * Validate deadline.
 * @returns Error message if invalid, null if valid
 */
export function validateDeadline(deadline: string): string | null {
  return validateCampaignDeadline(deadline);
}

/**
 * Validate minimum contribution.
 * @returns Error message if invalid, null if valid
 */
export function validateMinContribution(
  minContribution: string,
  goal: string,
): string | null {
  return sharedValidateMinContribution(minContribution, goal);
}

/**
 * Validate platform fee in basis points.
 * @returns Error message if invalid, null if valid
 */
export function validateFeeBps(feeBps: string): string | null {
  return sharedValidateFeeBps(feeBps);
}

// ---------------------------------------------------------------------------
// Shared zod schema for the campaign creation form
// ---------------------------------------------------------------------------

/**
 * Per-step sub-schemas for the multi-step campaign creation form.
 *
 * Each step validates only the fields it owns so the form can gate navigation
 * between steps. The combined `campaignCreationSchema` validates the whole
 * payload on submit. Field-level rules delegate to the shared
 * @fund-my-cause/types validators so frontend and backend stay in sync.
 */

/** Step 1: basic campaign details. */
export const campaignBasicsSchema = z.object({
  title: z
    .string()
    .superRefine((value, ctx) => {
      const error = validateCampaignTitle(value);
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
  description: z
    .string()
    .superRefine((value, ctx) => {
      const error = validateCampaignDescription(value);
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
});

/** Step 2: funding parameters. */
export const campaignFundingSchema = z
  .object({
    goal: z
      .string()
      .superRefine((value, ctx) => {
        const error = validateCampaignGoal(value);
        if (error) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
        }
      }),
    deadline: z
      .string()
      .superRefine((value, ctx) => {
        const error = validateCampaignDeadline(value);
        if (error) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
        }
      }),
    minContribution: z.string(),
    maxContribution: z.string().optional().default(""),
    feeBps: z
      .string()
      .superRefine((value, ctx) => {
        const error = sharedValidateFeeBps(value);
        if (error) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
        }
      }),
  })
  .superRefine((value, ctx) => {
    const minError = sharedValidateMinContribution(
      value.minContribution,
      value.goal,
    );
    if (minError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minContribution"],
        message: minError,
      });
    }

    const maxError = validateMaxContribution(
      value.maxContribution ?? "",
      value.minContribution,
    );
    if (maxError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxContribution"],
        message: maxError,
      });
    }
  });

/** Step 3: media (optional video URL). */
export const campaignMediaSchema = z.object({
  videoUrl: z
    .string()
    .optional()
    .default("")
    .superRefine((value, ctx) => {
      const error = validateVideoUrl(value ?? "");
      if (error) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
      }
    }),
});

/** Step 4: review step — no additional fields, just a confirmation gate. */
export const campaignReviewSchema = z.object({
  confirmed: z.literal(true, {
    errorMap: () => ({
      message: "Please confirm the campaign details before submitting.",
    }),
  }),
});

/** Combined schema for the full campaign creation payload. */
export const campaignCreationSchema = campaignBasicsSchema
  .merge(campaignFundingSchema.innerType())
  .merge(campaignMediaSchema);

export type CampaignBasicsValues = z.infer<typeof campaignBasicsSchema>;
export type CampaignFundingValues = z.infer<typeof campaignFundingSchema>;
export type CampaignMediaValues = z.infer<typeof campaignMediaSchema>;
export type CampaignReviewValues = z.infer<typeof campaignReviewSchema>;
export type CampaignCreationValues = z.infer<typeof campaignCreationSchema>;

/**
 * Validate a single step's values against its schema.
 * @returns A map of field name -> error message (empty when valid).
 */
export function validateCampaignStep<T extends z.ZodTypeAny>(
  schema: T,
  values: unknown,
): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) {
    return {};
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
