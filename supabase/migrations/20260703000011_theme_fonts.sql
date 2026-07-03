-- ─────────────────────────────────────────────────────────────
-- Kira — Migration 0011 · admin-selectable global fonts
-- ─────────────────────────────────────────────────────────────
-- Two additive columns on the agency_settings singleton so the owner can
-- pick the site-wide Latin and Arabic font families from the dashboard.
-- Values are identifiers resolved to next/font instances in lib/fonts.ts;
-- the CHECK constraints mirror that whitelist (config/fonts.config.ts) so
-- the DB can never hold a font the frontend cannot render.

alter table public.agency_settings
  add column font_latin text not null default 'jakarta'
    constraint agency_settings_font_latin_check
    check (font_latin in ('jakarta', 'inter', 'montserrat')),
  add column font_arabic text not null default 'tajawal'
    constraint agency_settings_font_arabic_check
    check (font_arabic in ('tajawal', 'cairo', 'ibm-plex-arabic'));

comment on column public.agency_settings.font_latin is
  'Site-wide Latin font id (whitelisted in config/fonts.config.ts).';
comment on column public.agency_settings.font_arabic is
  'Site-wide Arabic font id (whitelisted in config/fonts.config.ts).';
