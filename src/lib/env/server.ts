import 'server-only';
import { z } from 'zod';

/*
 * Values here exist only on the server. Database keys and payment secrets
 * will be added here in later phases. Never add the NEXT_PUBLIC_ prefix to a secret.
 */
const serverSchema = z.object({
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
});

const parsed = serverSchema.safeParse({
  APP_ENV: process.env.APP_ENV,
});

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid server environment variables:\n${problems}`);
}

export const serverEnv = parsed.data;
