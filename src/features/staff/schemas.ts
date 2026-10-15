import { z } from 'zod';

/*
 * Rules for the invite form. The database repeats them, because the invite
 * function can be called without this form. Owners cannot be invited.
 */
export const inviteStaffSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  role: z.enum(['manager', 'attendant'], { error: 'Choose a role' }),
});
