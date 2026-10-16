import { z } from 'zod';

/*
 * What the confirmation link must contain. Only the two email confirmation
 * types are accepted, so this route cannot be used for anything else.
 */
export const confirmParamsSchema = z.object({
  token_hash: z.string().min(10).max(200),
  type: z.enum(['email', 'signup']),
});

/*
 * Where to send the person after confirming. Only these fixed paths are
 * allowed, so a crafted link can never send someone to another website.
 */
const allowedNextPaths = ['/dashboard', '/onboarding'];

export function safeNextPath(value: unknown): string {
  return typeof value === 'string' && allowedNextPaths.includes(value) ? value : '/dashboard';
}
