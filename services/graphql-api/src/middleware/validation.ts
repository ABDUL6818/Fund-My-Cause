import { GraphQLError } from "graphql";
import { z } from "zod";
import { XLM_TO_STROOPS } from "@fund-my-cause/types";

/**
 * Standardized validation error structure
 */
export interface ValidationErrorResult {
  code: string;
  message: string;
  validationErrors: Record<string, string>;
}

/**
 * Uniform HTTP-400-style error code used across all validation failures.
 */
export const VALIDATION_ERROR_CODE = "BAD_USER_INPUT";

/**
 * Flattens a ZodError into a `{ field: message }` map for uniform responses.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const validationErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!(path in validationErrors)) {
      validationErrors[path] = issue.message;
    }
  }
  return validationErrors;
}

/**
 * Runs a schema against input and throws a uniform GraphQLError on failure.
 * Returns the parsed (and coerced) value on success.
 */
export function parseWithSchema<T>(
  schema: z.ZodType<T>,
  input: unknown,
  message: string,
): T {
  const result = schema.safeParse(input ?? {});
  if (!result.success) {
    throw new GraphQLError(message, {
      extensions: {
        code: VALIDATION_ERROR_CODE,
        validationErrors: formatZodErrors(result.error),
      },
    });
  }
  return result.data;
}

const nonEmptyString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, `${field} is required`);

const optionalUrl = (field: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidUrl(value), {
      message: `Invalid ${field}`,
    });

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Schema for `createCampaign` resolver input.
 */
export const createCampaignSchema = z.object({
  title: nonEmptyString("Title").max(
    100,
    "Title must be 100 characters or less",
  ),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  goal: z
    .union([z.string(), z.number()])
    .refine((value) => value !== "" && Number(value) > 0, {
      message: "Goal must be a positive number",
    }),
  deadline: z
    .union([z.string(), z.number(), z.date()])
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Deadline must be a valid date",
    }),
  minContribution: z
    .union([z.string(), z.number()])
    .optional()
    .refine((value) => value === undefined || value === "" || Number(value) >= 0, {
      message: "Minimum contribution must be a non-negative number",
    }),
});

/**
 * Schema for `recordContribution` resolver input.
 */
export const recordContributionSchema = z.object({
  campaignId: nonEmptyString("Campaign ID"),
  contributor: nonEmptyString("Contributor address"),
  amount: z
    .union([z.string(), z.number()])
    .refine((value) => value !== "" && Number(value) > 0, {
      message: "Contribution amount must be a positive number",
    }),
  transactionHash: nonEmptyString("Transaction hash"),
});

/**
 * Schema for `updateCampaign` resolver input.
 */
export const updateCampaignSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  image: optionalUrl("image URL"),
  videoUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https:\/\//i.test(value), {
      message: "Video URL must start with https://",
    })
    .refine((value) => !value || isValidUrl(value), {
      message: "Invalid video URL",
    }),
});

/**
 * Schema for `authenticate` resolver input.
 */
export const authenticateSchema = z.object({
  signature: nonEmptyString("Signature"),
  message: nonEmptyString("Message"),
  address: nonEmptyString("Address"),
});

/**
 * Validates campaign creation input
 * @throws GraphQLError with standardized validation errors
 */
export function validateCreateCampaignInput(input: unknown): void {
  parseWithSchema(createCampaignSchema, input, "Invalid campaign input");
}

/**
 * Validates contribution amount input
 * @throws GraphQLError if validation fails
 */
export function validateRecordContributionInput(input: unknown): void {
  const parsed = parseWithSchema(
    recordContributionSchema,
    input,
    "Invalid contribution input",
  );

  // Validate the stroops amount against the shared donation rules.
  const amountXlm = Number(parsed.amount) / Number(XLM_TO_STROOPS);
  if (!Number.isFinite(amountXlm) || amountXlm <= 0) {
    throw new GraphQLError("Invalid contribution amount", {
      extensions: {
        code: VALIDATION_ERROR_CODE,
        validationErrors: {
          amount: "Contribution amount must be a positive number",
        },
      },
    });
  }
}

/**
 * Validates update campaign input
 * @throws GraphQLError with standardized validation errors
 */
export function validateUpdateCampaignInput(input: unknown): void {
  parseWithSchema(
    updateCampaignSchema,
    input,
    "Invalid campaign update input",
  );
}

/**
 * Validates authenticate input
 * @throws GraphQLError with standardized validation errors
 */
export function validateAuthenticateInput(input: unknown): void {
  parseWithSchema(authenticateSchema, input, "Invalid authentication input");
}
