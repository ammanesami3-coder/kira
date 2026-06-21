# Security audit — final (Phase 7)

Date: 2026-06-21 · Scope: full application before production launch.
Result: **PASS** — no high/critical issues. Findings + the controls in place are
documented below.

---

## 1. Secrets management

| Secret                        | Exposure           | Status                                                                 |
| ----------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`   | server-only        | ✅ never `NEXT_PUBLIC_`; used only via `lib/supabase/admin.ts`         |
| `WA_GATEWAY_URL` / `_API_KEY` | server-only        | ✅ used only in `lib/wa-gateway.ts`, guarded by `import "server-only"` |
| `AGENCY_WHATSAPP_NUMBER`      | server-only        | ✅                                                                     |
| `RESEND_API_KEY`              | server-only        | ✅ `lib/email.ts` is `server-only`                                     |
| `TURNSTILE_SECRET_KEY`        | server-only        | ✅ `lib/turnstile.ts` is `server-only`                                 |
| anon key / branding           | public (by design) | ✅ anon key is RLS-guarded; safe to expose                             |

- **`server-only` import** on every secret-touching module (`wa-gateway`,
  `email`, `turnstile`, `rate-limit`, `supabase/admin`) — a build error fires if
  any leaks into a client bundle.
- **No secrets in Git:** `.gitignore` covers `.env*`, `*.key`, `ssh-key-*.key`,
  `*.pem`. Verified `git ls-files` exposes no secret material (`.env.example`
  documents shape only; the local `ssh-key-*.key` is untracked).
- **Action for each deployment:** keep an encrypted off-Git copy of prod env
  vars (see `backup-strategy.md`).

---

## 2. Row-Level Security (RLS)

Audited `supabase/migrations/20260618000008_rls.sql`:

- RLS **enabled on every table** (`agency_settings`, `cars`, `car_images`,
  `bookings`, `blocked_periods`).
- **`anon`** can `SELECT` only: `agency_settings`, available `cars`, images of
  available cars, and the PII-free `car_unavailable_ranges` view + execute
  `is_car_available()`. **No grant/policy** on `bookings` or `blocked_periods`
  → customer PII is unreadable by the public.
- **No anon `INSERT`** anywhere. Bookings are created exclusively by a
  **service-role Server Action** (`createBooking`) after re-validating
  availability — clients can't write directly.
- **`authenticated`** (single admin) has full access via `for all` policies.
- **`service_role`** bypasses RLS but is server-only.

✅ PII isolation and least-privilege are correctly enforced at the database
layer, not just the app.

---

## 3. Booking flow hardening (`server/mutations.ts`)

- **Double-booking:** Postgres `EXCLUDE USING gist` exclusion constraint on
  `(car_id, period)` is the source of truth; the code also pre-checks
  `is_car_available()` and handles the constraint violation
  (`PG_EXCLUSION_VIOLATION`) with a friendly "dates unavailable" message. Race
  conditions cannot produce a double booking.
- **Rate limiting:** `rateLimit(\`booking:${ip}\`, 5, 60_000)` — 5 attempts /
  minute / IP (in-memory, best-effort; swap for Redis/Upstash for strict
  multi-instance limits).
- **Honeypot:** hidden `company` field constrained to `max(0)` — real users leave
  it empty; bots that fill it are rejected.
- **CAPTCHA:** Cloudflare Turnstile wired (`verifyTurnstile`); inert until
  `TURNSTILE_SECRET_KEY` is set, then enforced with no code change.
- **A booking never hard-fails on WhatsApp/email errors** — delivery is
  best-effort and retried.

---

## 4. Input validation & sanitization

- **Shared Zod schemas** (`lib/validations/*`) validate on **both** client and
  server; the server never trusts client input. All string inputs are
  `trim()`-ed and length-capped (name ≤120, note ≤1000, etc.); phone/email are
  format-checked.
- **XSS:** React escapes all interpolated output by default. No
  `dangerouslySetInnerHTML` on user-controlled data. JSON-LD is built from
  typed, server-controlled data.
- **SQL injection:** all DB access goes through the Supabase client / parameter-
  ized RPC — no string-concatenated SQL.

---

## 5. HTTP security headers (`next.config.ts`)

| Header                      | Value                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`   | self + explicit allow-list (Supabase, Vercel analytics, Turnstile); `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'`, `upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`                                                                                                                    |
| `X-Content-Type-Options`    | `nosniff`                                                                                                                                                         |
| `X-Frame-Options`           | `SAMEORIGIN`                                                                                                                                                      |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                                                                                 |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                                                                                                                        |

**CSP note (intentional trade-off):** the policy keeps `'unsafe-inline'` for
scripts/styles rather than a per-request nonce. A nonce forces dynamic rendering,
which would disable static rendering / ISR and break the CLAUDE.md performance
budgets. For a mostly-static marketing + catalog site, a static allow-list CSP is
the correct balance. `'unsafe-eval'` is dev-only. Validate headers post-deploy
with [securityheaders.com](https://securityheaders.com).

---

## 6. Auth & route protection

- Admin area guarded in `proxy.ts` (middleware): unauthenticated `/admin` access
  redirects to login; authenticated users are bounced off the login page.
  Session refreshed on every request via Supabase SSR cookies.
- Guest-only customer model → no customer auth surface to attack.

---

## 7. Dependency audit

```
pnpm audit  →  No known vulnerabilities found
```

The previously-flagged moderate `postcss < 8.5.10` (build-time XSS in CSS
stringify) is resolved via a `pnpm.overrides` pin to `>=8.5.10`. **No high or
critical advisories.** Re-run `pnpm audit` before each release.

---

## 8. Residual risks / recommendations

| Risk                                 | Mitigation / note                                                    |
| ------------------------------------ | -------------------------------------------------------------------- |
| In-memory rate limit is per-instance | Acceptable with honeypot+Turnstile; move to Upstash for high traffic |
| Baileys (unofficial) ban risk        | Low volume, dedicated number, owner-only messages                    |
| CSP `'unsafe-inline'`                | Deliberate (ISR); revisit with nonce if app goes mostly-dynamic      |
| Service-role key compromise          | Rotate via Supabase; never expose client-side                        |

**Conclusion:** the application meets the security bar for production launch.
