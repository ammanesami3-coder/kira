-- ─────────────────────────────────────────────────────────────
-- Kira — Migration 0012 · Google reviews module (zero-API-cost)
-- ─────────────────────────────────────────────────────────────
-- Two additive columns on the agency_settings singleton:
--   · google_maps_link — the agency's Google Maps business link; drives the
--     public "leave us a review on Google" CTA (no Places API involved).
--   · reviews — owner-curated showcase reviews as a jsonb array of
--     { author, rating (1–5), quote, date? }. Shape is validated by Zod on
--     write (lib/validations/agencySettings.ts) and defensively re-parsed on
--     read (lib/reviews.ts), so no CHECK constraint is needed here.
-- The visible reviews and the JSON-LD AggregateRating are both derived from
-- this same array, keeping structured data truthful by construction.

alter table public.agency_settings
  add column google_maps_link text,
  add column reviews jsonb not null default '[]'::jsonb;

comment on column public.agency_settings.google_maps_link is
  'Google Maps business link for the public "write a review" CTA.';
comment on column public.agency_settings.reviews is
  'Owner-curated showcase reviews: [{author, rating 1-5, quote, date?}].';
