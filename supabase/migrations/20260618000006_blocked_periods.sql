-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0006 · blocked_periods
-- ─────────────────────────────────────────────────────────────
-- Manual unavailability set by the owner (maintenance, phone bookings,
-- personal use…). Same half-open [start, end) convention as bookings.
-- Every blocked period reserves the car unconditionally, so the
-- exclusion constraint here has no status predicate.

create table public.blocked_periods (
  id      uuid primary key default gen_random_uuid(),
  car_id  uuid not null references public.cars (id) on delete cascade,
  period  daterange not null,
  reason  text,
  note    text,
  created_at timestamptz not null default now(),

  constraint blocked_periods_period_bounded check (
    not lower_inf(period) and not upper_inf(period) and not isempty(period)
  ),

  -- No two blocked periods for the same car may overlap.
  constraint blocked_periods_no_overlap
    exclude using gist (car_id with =, period with &&)
);

create index blocked_periods_car_id_idx on public.blocked_periods (car_id);
create index blocked_periods_period_gist_idx
  on public.blocked_periods using gist (period);
