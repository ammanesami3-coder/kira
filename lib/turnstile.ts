import "server-only";

/**
 * Cloudflare Turnstile verification — wired but inert until configured.
 *
 * When `TURNSTILE_SECRET_KEY` is unset (default), verification is skipped so
 * the booking flow works out of the box. Set the secret (and surface the
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` widget on the client) to switch it on with
 * no further code changes.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Not configured → treat as passed.
  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
