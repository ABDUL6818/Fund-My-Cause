import { z } from 'zod';

/**
 * Zod schema for validating all NEXT_PUBLIC_* environment variables used by
 * the interface app. Parsed once at module load (startup) and exported as a
 * typed, frozen `env` object so the rest of the codebase never reads
 * `process.env` directly.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_API_URL must be a valid URL' })
    .default('http://localhost:3001'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_APP_URL must be a valid URL' })
    .default('http://localhost:3000'),
  NEXT_PUBLIC_ENVIRONMENT: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_ENABLE_DEBUG: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  NEXT_PUBLIC_LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),
  NEXT_PUBLIC_WS_URL: z
    .string()
    .url({ message: 'NEXT_PUBLIC_WS_URL must be a valid URL' })
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Raw NEXT_PUBLIC_* values pulled from process.env. This is the single place
 * in the app that is allowed to read process.env directly.
 */
function getRawEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS,
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  };
}

/**
 * Parse and validate the provided raw env values. Throws a descriptive error
 * if validation fails. Exported for testing purposes.
 */
export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid NEXT_PUBLIC_* environment configuration:\n${formatted}`,
    );
  }

  return result.data;
}

/**
 * Validated, typed environment configuration. Parsed once at startup.
 */
export const env: Env = Object.freeze(parseEnv(getRawEnv()));

export default env;