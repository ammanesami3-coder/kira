# Production launch — environment, analytics & monitoring

Companion to [`redeploy-playbook.md`](./redeploy-playbook.md). This is the
reference for production configuration, observability and uptime.

---

## 1. Environment variables (full reference)

Set these in **Vercel → Project → Settings → Environment Variables** for the
**Production** environment (and Preview where useful). `NEXT_PUBLIC_*` are
exposed to the browser; everything else is **server-only — never** add a
`NEXT_PUBLIC_` prefix to a secret.

| Variable                         | Scope      | Required | Purpose                                       |
| -------------------------------- | ---------- | -------- | --------------------------------------------- |
| `NEXT_PUBLIC_SITE_NAME`          | public     | ✅       | Agency name (titles, navbar, footer)          |
| `NEXT_PUBLIC_SITE_URL`           | public     | ✅       | Canonical URL — sitemap, canonical, hreflang  |
| `NEXT_PUBLIC_DEFAULT_LOCALE`     | public     | ✅       | `ar` (RTL) or `fr` (LTR)                      |
| `NEXT_PUBLIC_CURRENCY`           | public     | ✅       | Price formatting (e.g. `MAD`)                 |
| `NEXT_PUBLIC_LOGO_URL`           | public     | ⬜       | Logo URL (empty → icon + name fallback)       |
| `NEXT_PUBLIC_PRIMARY_COLOR`      | public     | ⬜       | Brand primary (HEX)                           |
| `NEXT_PUBLIC_SECONDARY_COLOR`    | public     | ⬜       | Brand accent (HEX)                            |
| `NEXT_PUBLIC_SUPABASE_URL`       | public     | ✅       | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | public     | ✅       | Supabase anon key (RLS-guarded)               |
| `SUPABASE_SERVICE_ROLE_KEY`      | **server** | ✅       | Trusted server writes (bookings) — **secret** |
| `WA_GATEWAY_URL`                 | **server** | ⬜\*     | WhatsApp gateway base URL                     |
| `WA_GATEWAY_API_KEY`             | **server** | ⬜\*     | Shared secret for the gateway webhook         |
| `AGENCY_WHATSAPP_NUMBER`         | **server** | ⬜\*     | Owner's receiving WhatsApp number (digits)    |
| `RESEND_API_KEY`                 | **server** | ⬜       | Email fallback when WhatsApp can't deliver    |
| `RESEND_FROM`                    | **server** | ⬜       | From address for the fallback email           |
| `SENTRY_DSN`                     | **server** | ⬜       | Error tracking (optional)                     |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | public     | ⬜       | Cloudflare Turnstile widget (anti-spam)       |
| `TURNSTILE_SECRET_KEY`           | **server** | ⬜       | Turnstile verification secret                 |

\* Optional to **boot**, but required for WhatsApp delivery to actually work.
Without them the booking still succeeds; the PDF just isn't pushed to WhatsApp.

> The app degrades gracefully: each optional integration (`wa-gateway`,
> `email`, `turnstile`) is a no-op when unconfigured and never throws.

---

## 2. Analytics & field performance

Already wired in `app/[locale]/layout.tsx`:

- **`@vercel/analytics`** — privacy-light page analytics (no cookie banner
  needed). View in Vercel → Analytics.
- **`@vercel/speed-insights`** — real-user Core Web Vitals (LCP / CLS / INP)
  from the field. View in Vercel → Speed Insights.

Both no-op in development and outside Vercel, so they cost nothing locally. No
extra env vars; they activate automatically on Vercel. Watch them against the
CLAUDE.md budgets: **LCP < 2.5s, CLS < 0.1, INP < 200ms**.

---

## 3. Error tracking (optional — Sentry)

`SENTRY_DSN` is reserved. To enable, add `@sentry/nextjs`, run its wizard, and
report from the error boundaries (`app/[locale]/error.tsx`,
`app/global-error.tsx`) — the `error.digest` shown there correlates with the
server log / Sentry event. Until configured, errors are still visible in
**Vercel → Logs** (runtime + function logs) and the browser console.

---

## 4. Uptime monitoring

Two surfaces to watch:

1. **The site** (`https://<domain>`) — Vercel's platform is highly available,
   but monitor anyway for DNS/cert/regressions.
2. **The WhatsApp gateway** (`https://wa.<domain>/status`) — this is the fragile
   piece (self-hosted, session can drop). **Monitor `connected:true`.**

Free options (pick one):

- **UptimeRobot / Better Stack / Cronitor** (free tiers): HTTP checks every 5
  min on both URLs; alert by email/Telegram on failure.
  - Site check: `GET https://<domain>` expect `200`.
  - Gateway check: `GET https://wa.<domain>/status` with header
    `x-api-key: <WA_GATEWAY_API_KEY>`, expect body containing `"connected":true`.
- **Supabase** dashboard surfaces DB health, storage usage and API logs.

When the gateway alert fires: re-open `/qr` and re-scan (session dropped).
No booking is lost while it's down — they're retried / emailed.

---

## 5. Production hardening recap (already in the codebase)

- **Security headers** (`next.config.ts`): CSP, HSTS, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy. See
  [`security-audit.md`](./security-audit.md).
- **HTTPS/SSL**: automatic via Vercel; HSTS enforces it for 2 years.
- **RLS** on every table; bookings created only via a service-role Server
  Action; PII never exposed to `anon`.
- **Double-booking** prevented by a Postgres exclusion constraint, not just app
  logic.
- **Spam controls** on the booking form: honeypot + in-memory rate limit
  (+ optional Turnstile).
