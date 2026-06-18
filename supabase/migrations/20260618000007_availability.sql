-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0007 · availability fn + public view
-- ─────────────────────────────────────────────────────────────

-- is_car_available(car_id, p_start, p_end)
-- Returns false when [p_start, p_end) overlaps any CONFIRMED booking or
-- any blocked period for the car; true otherwise. Invalid ranges
-- (p_end <= p_start) return false.
--
-- SECURITY DEFINER: it must read bookings / blocked_periods which are
-- RLS-locked away from anon. Running as the owner lets the public flow
-- check availability without ever exposing the underlying rows. The
-- function returns only a boolean, so no PII leaks.
create or replace function public.is_car_available(
  car_id uuid,
  p_start date,
  p_end date
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    case
      when p_start is null or p_end is null or p_end <= p_start then false
      else not exists (
        select 1
        from public.bookings b
        where b.car_id = is_car_available.car_id
          and b.status = 'confirmed'
          and b.period && daterange(p_start, p_end, '[)')
        union all
        select 1
        from public.blocked_periods bp
        where bp.car_id = is_car_available.car_id
          and bp.period && daterange(p_start, p_end, '[)')
      )
    end;
$$;

comment on function public.is_car_available(uuid, date, date) is
  'True if the car is free for [p_start, p_end): no overlap with confirmed bookings or blocked periods.';

-- car_unavailable_ranges
-- PUBLIC, PII-FREE view: the union of confirmed-booking ranges and
-- blocked-period ranges. Exposes ONLY car_id + date bounds so the UI
-- can grey out / disable taken dates. Runs with the view owner's rights
-- (security definer — the Postgres default) so anon can read the merged
-- ranges without any access to the underlying customer data.
create view public.car_unavailable_ranges as
  select
    b.car_id,
    lower(b.period) as start_date,
    upper(b.period) as end_date
  from public.bookings b
  where b.status = 'confirmed'
  union all
  select
    bp.car_id,
    lower(bp.period) as start_date,
    upper(bp.period) as end_date
  from public.blocked_periods bp;

comment on view public.car_unavailable_ranges is
  'PII-free: car_id + unavailable date ranges only (confirmed bookings + blocked periods).';
