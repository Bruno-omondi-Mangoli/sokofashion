import { z } from 'zod';

/*
 * Rules for the create shop form. They match the database rules so people get
 * a friendly message before the database has to refuse anything. The database
 * still enforces everything, because it can be called without this form.
 */
export const createShopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Shop name must be at least 2 characters')
    .max(80, 'Shop name must be at most 80 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Link name must be at least 3 characters')
    .max(40, 'Link name must be at most 40 characters')
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Link name can use only lowercase letters, numbers and single hyphens',
    ),
  countryCode: z.string().regex(/^[A-Z]{2}$/, 'Choose a country'),
});
