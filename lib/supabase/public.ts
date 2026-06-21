import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cookie-less Supabase client for PUBLIC reads in Server Components.
 *
 * Unlike `lib/supabase/server.ts`, this client never touches `cookies()`.
 * That matters for performance: reading cookies opts a route into fully
 * dynamic rendering, which would disable ISR. Public catalog / detail pages
 * only ever read anon-visible data (available cars, their images, the
 * agency settings singleton, the PII-free availability view), so the plain
 * anon key — with no session — is exactly the right level of access and
 * lets those pages be statically prerendered and revalidated.
 *
 * RLS still applies (anon role). Never use this for owner/admin reads.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
