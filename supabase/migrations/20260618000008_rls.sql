-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0008 · RLS + grants
-- ─────────────────────────────────────────────────────────────
-- Roles (provided by Supabase):
--   anon          → public, unauthenticated visitors
--   authenticated → the signed-in agency owner (single admin)
--   service_role  → trusted server (Server Actions); BYPASSES RLS
--
-- Principle: anon may read only public, non-PII data. Customer PII in
-- `bookings` and the detailed `blocked_periods` are never readable by
-- anon. Bookings are created exclusively through a service_role Server
-- Action (no anon INSERT). The admin (authenticated) has full access.

-- ── Enable RLS everywhere ──────────────────────────────────────────
alter table public.agency_settings enable row level security;
alter table public.cars            enable row level security;
alter table public.car_images      enable row level security;
alter table public.bookings        enable row level security;
alter table public.blocked_periods enable row level security;

-- ── Schema usage ───────────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- ANON (public) — read-only, public, PII-free
-- ════════════════════════════════════════════════════════════════════

-- agency_settings: the singleton identity row is fully public.
grant select on public.agency_settings to anon;
create policy "anon reads agency settings"
  on public.agency_settings for select to anon
  using (true);

-- cars: only cars the owner has marked available.
grant select on public.cars to anon;
create policy "anon reads available cars"
  on public.cars for select to anon
  using (is_available = true);

-- car_images: only images belonging to an available car.
grant select on public.car_images to anon;
create policy "anon reads images of available cars"
  on public.car_images for select to anon
  using (
    exists (
      select 1 from public.cars c
      where c.id = car_images.car_id and c.is_available = true
    )
  );

-- bookings / blocked_periods: NO grant, NO policy for anon → fully
-- locked. The only public window into availability is the PII-free
-- view + the is_car_available() function below.

-- car_unavailable_ranges view + availability function: PII-free, public.
grant select on public.car_unavailable_ranges to anon, authenticated;
grant execute on function public.is_car_available(uuid, date, date)
  to anon, authenticated, service_role;

-- ════════════════════════════════════════════════════════════════════
-- AUTHENTICATED (agency owner / admin) — full access to everything
-- ════════════════════════════════════════════════════════════════════
grant select, insert, update, delete on
  public.agency_settings,
  public.cars,
  public.car_images,
  public.bookings,
  public.blocked_periods
to authenticated;
grant usage, select on sequence public.booking_reference_seq to authenticated;

create policy "admin full access" on public.agency_settings
  for all to authenticated using (true) with check (true);
create policy "admin full access" on public.cars
  for all to authenticated using (true) with check (true);
create policy "admin full access" on public.car_images
  for all to authenticated using (true) with check (true);
create policy "admin full access" on public.bookings
  for all to authenticated using (true) with check (true);
create policy "admin full access" on public.blocked_periods
  for all to authenticated using (true) with check (true);

-- ════════════════════════════════════════════════════════════════════
-- SERVICE_ROLE — used by Server Actions (e.g. createBooking). It
-- bypasses RLS, but still needs table + sequence privileges.
-- ════════════════════════════════════════════════════════════════════
grant select, insert, update, delete on
  public.agency_settings,
  public.cars,
  public.car_images,
  public.bookings,
  public.blocked_periods
to service_role;
grant usage, select on sequence public.booking_reference_seq to service_role;
