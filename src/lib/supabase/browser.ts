import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env/public';

/*
 * A Supabase connection for code that runs in the browser, such as uploading a
 * photo straight to storage. It uses the logged in person's own session, so
 * the same storage rules apply as for any other request.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
