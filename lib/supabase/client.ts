import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components / the browser.
 * Uses the public anon key — safe to expose. Subject to RLS policies.
 *
 * The database schema is added in a later phase; this only wires the client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
