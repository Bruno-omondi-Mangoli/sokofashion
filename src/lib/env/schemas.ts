import { z } from 'zod';

/*
 * Rules for environment variables, kept free of process.env and server-only
 * so they can be tested directly.
 */
export const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export const serverSchema = z.object({
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
});

/*
 * Checks input against a schema. Returns the clean values, or throws one error
 * that lists every problem, so a bad configuration is fixed in a single pass.
 */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  input: unknown,
  label: string,
): z.output<T> {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid ${label} environment variables:\n${problems}`);
  }

  return parsed.data;
}
