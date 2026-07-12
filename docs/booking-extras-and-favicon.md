# Booking extras settings, "from" price & dynamic favicon (2026-07-12)

Three per-client-safe changes requested for elkammaacars.com. All of them are
**settings- or data-driven**: a deployment that never touches the new setting
(or has no tiered prices) behaves exactly as before.

## 1. Owner-controlled booking extras (options supplémentaires)

- New `agency_settings.booking_extras` jsonb column
  (`supabase/migrations/20260712000016_booking_extras.sql`) holding only
  deviations from the built-in catalog:
  `{ "enabled": false, "items": { "gps": { "enabled": false, "price": 25 } } }`.
- `lib/booking/extras.ts` gained `parseExtrasOverrides` / `resolveExtrasSettings`
  (tolerant jsonb parsing, same contract as `lib/design.ts`) plus
  catalog-aware price helpers (`extraPriceIn`, `extrasTotalIn`).
- The booking page resolves the catalog server-side and passes it to the form;
  an empty catalog hides the whole section. `createBooking` re-resolves it
  server-side, drops disabled ids from forged requests, and snapshots the sold
  prices into `bookings.extras` (`{ selected, prices }`) so the PDF renders the
  booking's own prices even after later settings edits.
- Admin UI: new "Options supplémentaires" card in the settings form
  (section toggle + per-extra visibility & price; empty price = default).
- `updateAgencySettings` retries without `booking_extras` on
  `PGRST204`/`42703`, so deployments whose DB doesn't have the migration yet
  can still save settings.

## 2. "From" price on car cards

`lowestDailyRate` (lib/booking/pricing.ts) = cheapest effective daily rate
across the week/15-day/month tiers. When it undercuts `price_per_day`, the
card shows "ابتداءً من / À partir de" + that rate (existing `car.from` i18n
key). Cars without tiers render exactly as before.

The PDF now derives its subtotal from the stored `total_price` minus the
extras (and prints the effective daily rate), so tiered bookings' PDF lines
add up.

## 3. Favicon / Google result icon

The repo had **no** `public/` dir and metadata pointed at a missing
`/favicon.ico` (404) — hence no tab icon and no icon next to the name in
Google results. Fixed with a file-convention `app/icon.tsx` (dynamic
`ImageResponse`, 192×192 PNG, 1h revalidate) that renders the agency's own
`logo_url` on a white tile, falling back to a brand-colored monogram. The
proxy matcher now excludes `icon`/`apple-icon` so next-intl doesn't
locale-redirect the extensionless icon route. Google requires the icon to be
crawlable and a multiple of 48px — both satisfied.

## Rollout

Run the migration on each client's Supabase project **when convenient**
(nothing breaks before it, thanks to the fallbacks above), then redeploy.
Google refreshes result favicons on its own recrawl schedule (days, not
instant).
