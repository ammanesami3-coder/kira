-- ─────────────────────────────────────────────────────────────
-- Kira — Migration 0017 · Elfsight Google Reviews widget (opt-in)
-- ─────────────────────────────────────────────────────────────
-- One additive column on the agency_settings singleton:
--   · reviews_elfsight_app_id — the Elfsight "Google Reviews" app id
--     (a UUID, e.g. 618e726b-427e-4e44-b9c9-edbd86ead43f). When set, the
--     public testimonials section renders the live Elfsight widget (real
--     Google Maps reviews) instead of the owner-curated / built-in cards.
--     Empty/null = keep the previous behaviour. Purely per-client opt-in.
-- Validated by Zod on write (lib/validations/agencySettings.ts); no CHECK
-- constraint needed. `add column if not exists` keeps re-runs idempotent.

alter table public.agency_settings
  add column if not exists reviews_elfsight_app_id text;

comment on column public.agency_settings.reviews_elfsight_app_id is
  'Elfsight Google Reviews app id (UUID). When set, the public site shows the live Elfsight widget instead of curated reviews.';
