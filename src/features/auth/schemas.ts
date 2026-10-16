import { z } from 'zod';

/*
 * The password limit of 72 matches the most characters the password hashing
 * method reads, so longer input would be silently cut short.
 */
const passwordRule = z
  .string()
  .min(8, 'Use at least 8 characters for your password')
  .max(72, 'Use at most 72 characters for your password');

const emailRule = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

/* Rules for the sign up and log in forms */
export const credentialsSchema = z.object({
  email: emailRule,
  password: passwordRule,
});

/* Rules for the forgot password form */
export const forgotPasswordSchema = z.object({
  email: emailRule,
});

/* Rules for choosing a new password: two boxes that must match */
export const newPasswordSchema = z
  .object({
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'The two passwords do not match',
    path: ['confirmPassword'],
  });
