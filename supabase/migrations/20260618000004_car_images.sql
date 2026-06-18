-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0004 · car_images
-- ─────────────────────────────────────────────────────────────

create table public.car_images (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text,
  alt_ar       text,
  is_primary   bool not null default false,
  sort_order   integer not null default 0
);

create index car_images_car_id_idx on public.car_images (car_id);

-- At most one primary image per car.
create unique index car_images_one_primary_idx
  on public.car_images (car_id)
  where is_primary;
