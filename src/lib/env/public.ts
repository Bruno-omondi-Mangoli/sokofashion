import { z } from 'zod';

/*
 * Values here are copied into the browser bundle and are visible to everyone.
 * Only put values in this file that are safe for the public to see.
 * Next.js only inlines NEXT_PUBLIC_ variables when they are written out in full,
 * which is why each one is listed by hand below.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
});

const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid public environment variables:\n${problems}`);
}

export const publicEnv = parsed.data;
