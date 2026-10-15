import { z } from 'zod';

/*
 * Rules for the sign up and log in forms. The password limit of 72 matches the
 * most characters the password hashing method reads, so longer input would be
 * silently cut short.
 */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  password: z
    .string()
    .min(8, 'Use at least 8 characters for your password')
    .max(72, 'Use at most 72 characters for your password'),
});
