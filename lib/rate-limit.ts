import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Intentionally simple: it guards the booking Server Action against rapid
 * automated submissions from a single client. State lives in module memory,
 * so on serverless it is per-instance and best-effort — good enough as a
 * first line of defence alongside the honeypot. For strict, multi-instance
 * limiting, swap this for a Redis/Upstash-backed store later (same API).
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (when blocked). */
  retryAfter: number;
}

/**
 * Allow up to `limit` hits per `windowMs` for a given key (e.g. client IP).
 * Returns `ok: false` once the limit is exceeded within the window.
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfter: 0 };
}

// Opportunistic cleanup so the map cannot grow unbounded on a long-lived
// instance. Runs on each call cheaply when the map is small.
export function pruneRateLimits(now = Date.now()): void {
  for (const [key, win] of buckets) {
    if (now >= win.resetAt) buckets.delete(key);
  }
}
