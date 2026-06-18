import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the SERVICE ROLE key.
 *
 * ⚠️ SERVER-ONLY. This bypasses Row Level Security. The `server-only` import
 * makes the build fail if this module is ever pulled into client code.
 * Use exclusively inside Server Actions / Route Handlers for trusted writes
 * (e.g. creating a booking after re-validating availability).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
