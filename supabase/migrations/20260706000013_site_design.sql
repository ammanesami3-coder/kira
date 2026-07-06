-- ─────────────────────────────────────────────────────────────
-- Kira — Migration 0013 · owner-editable site design
-- ─────────────────────────────────────────────────────────────
-- One additive jsonb column on the agency_settings singleton holding the
-- dashboard-editable design overrides:
--
--   {
--     "hero_image_url":     "https://…",   -- landing hero visual (falls back
--                                          -- to the first car photo when unset)
--     "logo_height_header": 88,            -- px, navbar logo
--     "logo_height_footer": 32,            -- px, footer logo
--     "stats": { "cars": 40, "clients": 1200, "years": 8, "satisfaction": 98 },
--     "sections": { "<sectionId>": { "heading": "#hex", "text": "#hex" } }
--   }
--
-- All keys are optional; absent keys mean "use the built-in default". The
-- shape is validated by Zod on write (lib/validations/agencySettings.ts) and
-- defensively re-parsed on read (lib/design.ts), so no CHECK constraint is
-- needed here.

alter table public.agency_settings
  add column design jsonb not null default '{}'::jsonb;

comment on column public.agency_settings.design is
  'Owner-editable site design overrides (hero image, logo sizes, stats figures, per-section text colors). Parsed by lib/design.ts.';
