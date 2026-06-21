"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";
import type { ActionResult } from "@/server/mutations";

/**
 * Owner authentication actions (single admin).
 *
 * Sign-in runs in a Server Action so the Supabase session cookies are written
 * server-side (the cookie-bound client's `setAll` succeeds here, unlike in a
 * Server Component). The client form then navigates; the proxy/middleware sees
 * the refreshed session.
 */
export async function signIn(input: unknown): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: "INVALID_CREDENTIALS", code: error.code };
  }
  return { ok: true, data: null };
}

/** Sign the owner out and clear the session cookies. */
export async function signOut(): Promise<ActionResult<null>> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true, data: null };
}
