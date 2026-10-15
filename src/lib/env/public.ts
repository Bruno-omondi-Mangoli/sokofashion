import { parseEnv, publicSchema } from './schemas';

/*
 * Values here are copied into the browser bundle and are visible to everyone.
 * Next.js only inlines NEXT_PUBLIC_ variables when they are written out in full,
 * which is why each one is listed by hand below.
 */
export const publicEnv = parseEnv(
  publicSchema,
  {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  'public',
);
