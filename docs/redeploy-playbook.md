# Redeploy playbook — launching Kira for a new agency

Kira is **single-tenant per deployment**: one agency per Vercel project + one
Supabase project + one WhatsApp gateway. To sell the template to a new client
you redeploy a fresh copy and change **configuration only — no code edits**.

This playbook is the end-to-end checklist for going from zero to a live,
production site for a new client.

> **Estimated time per client: ~2–3 hours** (excluding DNS propagation and the
> one-time WhatsApp gateway host setup). See the time table at the end.

---

## 0. Before you start (gather from the client)

| Item                          | Example                         |
| ----------------------------- | ------------------------------- |
| Agency name (AR + FR)         | `سندباد كار` / `Sindibad Car`   |
| Logo (SVG/PNG, transparent)   | `logo.png`                      |
| Brand colors (primary/accent) | `#0F3D3E` / `#C8A24B`           |
| Production domain             | `sindibadcar.ma`                |
| WhatsApp number (bookings)    | `+212 6 12 34 56 78`            |
| Phone / email / address       | for `agency_settings` + contact |
| Opening hours                 | per weekday                     |
| Default language              | `ar` (or `fr`)                  |
| Currency                      | `MAD`                           |
| Car fleet (photos + specs)    | added later via the admin panel |

---

## 1. Create the Supabase project (backend)

1. **Create a new project** at [supabase.com](https://supabase.com) (free tier
   is enough to start). Choose the EU (Frankfurt/Paris) region — closest to
   Morocco for latency.
2. Copy the project credentials from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only — secret**)
3. **Run the migrations** (`supabase/migrations/`, in filename order). Two ways:
   - **CLI (recommended):**
     ```bash
     pnpm dlx supabase link --project-ref <project-ref>
     pnpm dlx supabase db push
     ```
   - **Dashboard:** open the SQL editor and paste each migration in order
     (`20260618000001_*` → `20260621000010_*`).
     This creates all tables, the `daterange` exclusion constraints (double-
     booking protection), the `is_car_available()` function, the PII-free
     `car_unavailable_ranges` view, RLS policies, and the Storage buckets.
4. **Create the admin user** (the single agency owner login):
   - Dashboard → **Authentication → Users → Add user** → email + password.
   - There are no customer accounts (guest-only booking), so this is the only
     user you ever create.
5. **Seed `agency_settings`** (the singleton row that drives identity + SEO).
   In the SQL editor:
   ```sql
   insert into public.agency_settings
     (name, name_ar, name_fr, phone, whatsapp_number, email, address, address_ar,
      currency, locales, seo_title, seo_description, opening_hours, social_links)
   values
     ('Sindibad Car', 'سندباد كار', 'Sindibad Car',
      '+212612345678', '212612345678', 'contact@sindibadcar.ma',
      'Agadir, Morocco', 'أكادير، المغرب',
      'MAD', array['ar','fr'],
      'كراء السيارات في أكادير | سندباد كار',
      'احجز سيارتك بسهولة مع سندباد كار في أكادير — أسعار مناسبة وأسطول متنوع.',
      '{"mon":"09:00-19:00","tue":"09:00-19:00","wed":"09:00-19:00","thu":"09:00-19:00","fri":"09:00-19:00","sat":"09:00-14:00","sun":"closed"}',
      '{"instagram":"https://instagram.com/...","facebook":"https://facebook.com/..."}');
   ```
   > The owner can edit all of this later from **Admin → Settings**; seeding it
   > here just gives the site correct identity from the first deploy.

---

## 2. Deploy on Vercel (frontend)

1. Push the repo to a new GitHub repository for this client (or reuse a fork).
2. In Vercel: **Add New → Project → Import** the repo. Framework auto-detects as
   Next.js; build command `pnpm build`, install `pnpm install`.
3. **Set environment variables** (Project → Settings → Environment Variables),
   for the **Production** (and Preview) environments. See the full table in
   [`production-launch.md`](./production-launch.md). Minimum to go live:

   ```
   # Branding (NEXT_PUBLIC_* — safe in the browser)
   NEXT_PUBLIC_SITE_NAME="Sindibad Car"
   NEXT_PUBLIC_SITE_URL="https://sindibadcar.ma"
   NEXT_PUBLIC_DEFAULT_LOCALE="ar"
   NEXT_PUBLIC_CURRENCY="MAD"
   NEXT_PUBLIC_LOGO_URL="https://<project>.supabase.co/storage/v1/object/public/branding/logo.png"
   NEXT_PUBLIC_PRIMARY_COLOR="#0F3D3E"
   NEXT_PUBLIC_SECONDARY_COLOR="#C8A24B"

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
   SUPABASE_SERVICE_ROLE_KEY="..."          # server-only secret

   # WhatsApp gateway (server-only) — fill after section 3
   WA_GATEWAY_URL="https://wa.sindibadcar.ma"
   WA_GATEWAY_API_KEY="<long-random-secret>"
   AGENCY_WHATSAPP_NUMBER="212612345678"
   ```

   > **Never** prefix a secret with `NEXT_PUBLIC_`. Only the three Supabase/WA
   > secrets, Resend and Turnstile secret are server-only — see the security
   > audit for the full classification.

4. **Deploy.** Confirm the preview/production build is green.

### Domain + DNS + SSL

1. Vercel → Project → **Settings → Domains → Add** `sindibadcar.ma` (and
   `www.sindibadcar.ma`).
2. At the client's registrar, set the DNS records Vercel shows:
   - Apex `sindibadcar.ma` → **A** record `76.76.21.21` (Vercel), or an
     `ALIAS`/`ANAME` to `cname.vercel-dns.com` if the registrar supports it.
   - `www` → **CNAME** `cname.vercel-dns.com`.
3. **SSL is automatic** — Vercel provisions and renews a Let's Encrypt
   certificate once DNS resolves (usually minutes; allow up to 24–48h for full
   propagation). HTTPS + HSTS (set in `next.config.ts`) are then enforced.
4. Set the canonical redirect (www → apex or apex → www) in Vercel Domains, and
   make sure `NEXT_PUBLIC_SITE_URL` matches the canonical host exactly (it
   drives `sitemap.xml`, canonical tags and hreflang).

---

## 3. Deploy the WhatsApp gateway (free, self-hosted)

The booking PDF is pushed to the owner's WhatsApp by a **separate always-on
service** (`kira-wa-gateway`, Baileys-based) — Vercel cannot host it (no
persistent WebSocket / saved session). Full setup, code and the Evolution-API
no-code alternative are in [`wa-gateway-setup.md`](./wa-gateway-setup.md).
Summary:

1. Provision an always-on host: **Oracle Cloud Always Free** (truly free
   forever), a Raspberry Pi, the agency's office PC, or a ~$4/mo VPS.
2. Deploy the gateway (Docker or `pnpm start`), set its `API_KEY` (must equal
   `WA_GATEWAY_API_KEY` in Vercel) and `PORT`.
3. Put it behind HTTPS (Caddy/Nginx + Let's Encrypt, or Cloudflare Tunnel) at
   e.g. `https://wa.sindibadcar.ma` → that URL is `WA_GATEWAY_URL`.
4. **Scan the QR once** with the agency's WhatsApp number (`GET /qr`). The
   session is saved to disk (`auth_info_baileys/`) and survives restarts.
5. Set `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `AGENCY_WHATSAPP_NUMBER` in
   Vercel and redeploy.

> If the gateway is down, a booking **still succeeds** — delivery is retried and
> (optionally) the owner is emailed via Resend. WhatsApp is best-effort, never a
> hard dependency.

---

## 4. Branding (per-client identity recap)

Everything visual is config-driven (`config/site.config.ts` + `agency_settings`):

| Variable                      | Drives                               |
| ----------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SITE_NAME`       | Titles, navbar, footer               |
| `NEXT_PUBLIC_SITE_URL`        | Canonical URL, sitemap, hreflang     |
| `NEXT_PUBLIC_DEFAULT_LOCALE`  | `ar` (RTL) or `fr` (LTR)             |
| `NEXT_PUBLIC_CURRENCY`        | Price formatting                     |
| `NEXT_PUBLIC_LOGO_URL`        | Logo (empty → icon + name fallback)  |
| `NEXT_PUBLIC_PRIMARY_COLOR`   | Buttons, links, focus rings, accents |
| `NEXT_PUBLIC_SECONDARY_COLOR` | Secondary accents                    |

Colors are injected as CSS variables on `<html>`, overriding the defaults in
`app/globals.css` — so a color change re-themes the **entire** site with no code
edits. The owner can override name/logo/colors/contact at runtime from
**Admin → Settings** (stored in `agency_settings`), which takes precedence over
the env defaults without a redeploy.

---

## 5. Post-deploy verification (go-live checklist)

Run [`qa-checklist.md`](./qa-checklist.md) in full. The smoke test:

- [ ] `https://<domain>` loads over HTTPS, valid certificate, no mixed content.
- [ ] Branding correct: name, logo, colors, default language + direction.
- [ ] `/ar` and `/fr` both work; language switcher keeps the current page.
- [ ] Admin login works at `/<locale>/admin`; bad routes are guarded.
- [ ] Add a test car (Admin → Cars) with images; it appears in the catalog.
- [ ] **Full booking flow in production:** browse → pick dates → book → a PDF is
      generated → the WhatsApp message arrives on the agency number.
- [ ] Cancel/clean up the test car + booking.
- [ ] `https://<domain>/sitemap.xml` and `/robots.txt` resolve.
- [ ] Run the page through Google **Rich Results Test** (LocalBusiness/AutoRental + per-car Vehicle/Offer schema) — no errors.
- [ ] Lighthouse on the home + a car page: Performance ≥ 95, SEO 100,
      Best Practices ≥ 95, Accessibility ≥ 95.
- [ ] Analytics + Speed Insights show traffic in the Vercel dashboard.

---

## 6. Hand over to the client

- Give the owner the admin URL + their login (force a password change).
- Send them [`admin-guide.md`](./admin-guide.md) (Arabic dashboard guide).
- Confirm the backup schedule from [`backup-strategy.md`](./backup-strategy.md).

---

## Time estimate per client

| Step                                            | Time           |
| ----------------------------------------------- | -------------- |
| Gather assets from client                       | 30–60 min      |
| Supabase project + migrations + seed + admin    | 20–30 min      |
| Vercel import + env + deploy                    | 15–20 min      |
| Domain + DNS (config; propagation is async)     | 10–15 min      |
| WhatsApp gateway (if host already exists)       | 20–30 min      |
| WhatsApp gateway (first-ever host provisioning) | +60–90 min     |
| QA + go-live verification                       | 30–45 min      |
| **Total (host reused)**                         | **~2–3 hours** |

DNS propagation (up to 24–48h) and SSL issuance run in the background and don't
add hands-on time.

---

## Appendix: tested second-deployment dry run

The config-only rebrand claim is validated by `scripts/verify-rebrand.mjs`,
which builds the project with a **second agency's** environment profile
(different name, colors, default locale) and confirms the build succeeds and the
branding values are picked up — proving a new client needs configuration changes
only. Run it with:

```bash
pnpm verify:rebrand
```
