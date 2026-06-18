-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0003 · cars
-- ─────────────────────────────────────────────────────────────

create type public.car_category as enum (
  'economy', 'sedan', 'suv', 'luxury', 'van', 'pickup', 'sport'
);

create type public.transmission_type as enum ('manual', 'automatic');

create table public.cars (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  name_ar       text,
  brand         text not null,
  model         text not null,
  year          smallint not null check (year between 1980 and 2100),

  category      public.car_category not null,
  transmission  public.transmission_type not null,
  fuel_type     text not null,
  seats         smallint not null check (seats between 1 and 60),
  doors         smallint not null check (doors between 1 and 10),

  price_per_day  numeric(10, 2) not null check (price_per_day >= 0),
  price_per_week numeric(10, 2) check (price_per_week >= 0),
  deposit        numeric(10, 2) not null default 0 check (deposit >= 0),

  features        text[] not null default '{}',
  description     text,
  description_ar  text,
  description_fr  text,

  -- Master toggle the owner uses to show/hide a car from the public catalog.
  is_available bool not null default true,
  sort_order   integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.cars.is_available is
  'Owner master switch: false hides the car from the public catalog entirely.';

create index cars_is_available_idx on public.cars (is_available);
create index cars_category_idx on public.cars (category);
create index cars_sort_order_idx on public.cars (sort_order);

create trigger cars_set_updated_at
  before update on public.cars
  for each row execute function public.set_updated_at();
