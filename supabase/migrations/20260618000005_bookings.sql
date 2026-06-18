-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0005 · bookings
-- ─────────────────────────────────────────────────────────────
-- `period` (daterange) is the SINGLE SOURCE OF TRUTH for the rented
-- interval. We use the canonical half-open form [start, end):
--   - start_date = lower(period)  = pickup day
--   - end_date   = upper(period)  = drop-off day (exclusive)
-- Half-open ranges make back-to-back rentals (one car returned and
-- re-rented the same day) NOT overlap — the desired behaviour.
--
-- total_days = upper - lower (= number of rental days).
-- start_date / end_date / total_days are GENERATED from `period` so
-- they can never drift from the source of truth and stay easy to read.

create type public.booking_status as enum (
  'pending', 'confirmed', 'cancelled', 'completed'
);

-- Human-friendly reference: KR-2026-000123
create sequence public.booking_reference_seq;

create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  car_id         uuid not null references public.cars (id),
  customer_name  text not null,
  customer_phone text not null,
  customer_email text,

  period daterange not null,
  constraint bookings_period_bounded check (
    not lower_inf(period) and not upper_inf(period) and not isempty(period)
  ),

  -- Derived, read-only projections of `period` for display / indexing.
  start_date date generated always as (lower(period)) stored,
  end_date   date generated always as (upper(period)) stored,
  total_days integer generated always as (upper(period) - lower(period)) stored,

  pickup_location  text,
  dropoff_location text,
  total_price      numeric(10, 2) not null check (total_price >= 0),

  extras jsonb not null default '{}'::jsonb,
  status public.booking_status not null default 'pending',

  notes         text,
  pdf_url       text,
  whatsapp_sent bool not null default false,

  reference text not null unique
    default 'KR-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.booking_reference_seq')::text, 6, '0'),

  created_at timestamptz not null default now(),

  -- ░░ DB-LEVEL DOUBLE-BOOKING PREVENTION ░░
  -- Only CONFIRMED bookings reserve the car. Two confirmed bookings of
  -- the same car may never overlap in time. Pending/cancelled bookings
  -- are ignored by this constraint (the agency may collect several
  -- pending requests for the same slot and confirm one).
  constraint bookings_no_confirmed_overlap
    exclude using gist (car_id with =, period with &&)
    where (status = 'confirmed')
);

create index bookings_car_id_idx on public.bookings (car_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_period_gist_idx on public.bookings using gist (period);
