# Redeploy playbook — new agency

Kira is **single-tenant per deployment**: one agency per Vercel project. To
launch the template for a new client, you redeploy a fresh copy and change
configuration only — no code edits.

## 1. Create the deployment

1. Fork/duplicate the repository (or create a new Vercel project from it).
2. Import into Vercel and connect the production domain.

## 2. Branding (per-client identity)

These `NEXT_PUBLIC_*` variables drive the whole site (see
`config/site.config.ts`). Changing them re-themes everything.

| Variable                      | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SITE_NAME`       | Agency name (titles, navbar, footer) |
| `NEXT_PUBLIC_SITE_URL`        | Canonical URL (SEO, sitemap)         |
| `NEXT_PUBLIC_DEFAULT_LOCALE`  | `ar` or `fr`                         |
| `NEXT_PUBLIC_CURRENCY`        | e.g. `MAD`                           |
| `NEXT_PUBLIC_PRIMARY_COLOR`   | Brand primary (HEX)                  |
| `NEXT_PUBLIC_SECONDARY_COLOR` | Brand accent (HEX)                   |

> Changing `NEXT_PUBLIC_PRIMARY_COLOR` recolors buttons, links, focus rings and
> accents across the entire site, because the value is injected as a CSS
> variable on `<html>` (overriding the defaults in `app/globals.css`).

## 3. Backend (later phases)

- Create a Supabase project; set `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- Run the SQL migrations in `supabase/migrations/`.
- Seed `agency_settings` (the singleton row that drives runtime identity/SEO).

## 4. WhatsApp gateway (later phases)

- Deploy the separate `kira-wa-gateway` service on an always-on host
  (Oracle Cloud Always Free / Raspberry Pi / cheap VPS), scan the QR once.
- Set `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `AGENCY_WHATSAPP_NUMBER`
  (all server-only) in Vercel.

## 5. Verify

- `pnpm build` succeeds locally.
- Vercel preview deploy is green.
- Site name, colors, default language and direction (RTL/LTR) reflect the
  client's configuration.
