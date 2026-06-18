-- ─────────────────────────────────────────────────────────────
-- Kira — Phase 1 · Migration 0001 · Extensions
-- ─────────────────────────────────────────────────────────────
-- btree_gist lets a GiST index combine a scalar equality column
-- (car_id WITH =) with a range overlap column (period WITH &&) in a
-- single EXCLUDE constraint. This is the foundation of DB-level
-- double-booking prevention (see migrations 0005 / 0006).
--
-- gen_random_uuid() is in core Postgres (>= 13) so no pgcrypto is
-- required for UUID defaults.

create extension if not exists btree_gist;
