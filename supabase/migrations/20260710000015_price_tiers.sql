-- Tiered rental pricing: optional package totals for 15-day and monthly
-- rentals, alongside the existing price_per_week. A booking's base price
-- uses the daily rate of the longest tier the duration qualifies for
-- (see lib/booking/pricing.ts) — so 7 days costs exactly price_per_week,
-- 15 days exactly price_per_15_days, 30 days exactly price_per_month.
alter table public.cars
  add column if not exists price_per_15_days numeric(10, 2)
    check (price_per_15_days >= 0),
  add column if not exists price_per_month numeric(10, 2)
    check (price_per_month >= 0);
