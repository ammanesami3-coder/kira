-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0002 · agency_settings (singleton)
-- ─────────────────────────────────────────────────────────────
-- A single-row table that drives the agency's identity + SEO.
-- Single-tenant per deployment, so a unique index on a constant
-- expression enforces "exactly one row".

-- Shared trigger function: keep updated_at fresh on UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.agency_settings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  name_ar       text,
  name_fr       text,
  logo_url      text,
  primary_color text not null default '#0F3D3E',
  secondary_color text not null default '#C8A24B',

  phone           text,
  whatsapp_number text,
  email           text,
  address         text,
  address_ar      text,
  lat             double precision,
  lng             double precision,

  currency      text not null default 'MAD',
  opening_hours jsonb not null default '{}'::jsonb,
  social_links  jsonb not null default '{}'::jsonb,

  locales         text[] not null default array['ar', 'fr'],
  seo_title       text,
  seo_description text,
  og_image_url    text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.agency_settings is
  'Singleton row holding the agency identity, contact, branding and SEO defaults.';

-- Enforce the singleton: a unique index over a constant only allows one row.
create unique index agency_settings_singleton_idx on public.agency_settings ((true));

create trigger agency_settings_set_updated_at
  before update on public.agency_settings
  for each row execute function public.set_updated_at();
