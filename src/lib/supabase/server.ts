import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from '@/lib/env/public';

/*
 * Creates a Supabase connection for the current request. It reads the login
 * session from the request cookies, so every database call is made as the
 * logged in user and Row Level Security applies to it.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /*
             * Server Components cannot write cookies. This is safe to ignore
             * because the proxy refreshes the session on every request.
             */
          }
        },
      },
    },
  );
}
