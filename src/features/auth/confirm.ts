import { z } from 'zod';

/*
 * What the email link must contain. Only email confirmation and password
 * recovery are accepted, so this route cannot be used for anything else.
 */
export const confirmParamsSchema = z.object({
  token_hash: z.string().min(10).max(200),
  type: z.enum(['email', 'signup', 'recovery']),
});

/*
 * Where to send the person after confirming an email. Only these fixed paths
 * are allowed, so a crafted link can never send someone to another website.
 * Password recovery links always go to /reset-password and ignore this list.
 */
const allowedNextPaths = ['/dashboard', '/onboarding'];

export function safeNextPath(value: unknown): string {
  return typeof value === 'string' && allowedNextPaths.includes(value) ? value : '/dashboard';
}
