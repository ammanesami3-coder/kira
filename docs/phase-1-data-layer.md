# Phase 1 — Data layer & availability

Schema, RLS, double-booking prevention and the typed data-access layer.

## Date model — half-open ranges `[start, end)`

`bookings.period` and `blocked_periods.period` are Postgres `daterange`
values in the canonical half-open form `[start, end)`:

- `start_date` = pickup day (inclusive)
- `end_date` = drop-off day (**exclusive**)
- `total_days` = `end_date - start_date`

Because the upper bound is exclusive, a car returned on `2026-07-05` can
be re-rented starting `2026-07-05` **without** the two ranges overlapping
— exactly the desired same-day-turnover behaviour. On `bookings` the
generated columns `start_date` / `end_date` / `total_days` are derived
from `period`, so they can never drift from the source of truth.

## Double-booking prevention is enforced by the database

This is a hard guarantee, not an application check:

- `blocked_periods` — `EXCLUDE USING gist (car_id WITH =, period WITH &&)`:
  no two blocks for the same car may overlap.
- `bookings` — the same exclusion constraint **with a predicate**
  `WHERE (status = 'confirmed')`. Only confirmed bookings reserve the
  car, so the agency can collect several `pending` requests for the same
  slot and confirm exactly one. Confirming a second overlapping booking
  fails at the DB with SQLSTATE `23P01`, which the Server Actions map to
  a friendly message.

`btree_gist` (migration 0001) is what lets a GiST index mix the scalar
equality column with the range-overlap column.

## Availability surface (no PII leaks)

- `is_car_available(car_id, p_start, p_end) → boolean` — `SECURITY
DEFINER` so the public flow can ask "is this free?" without any read
  access to `bookings`. Returns only a boolean. `false` for invalid
  ranges (`p_end <= p_start`).
- `car_unavailable_ranges` view — the union of confirmed-booking ranges
  and blocked-period ranges, exposing **only** `car_id, start_date,
end_date`. Runs with the view owner's rights (the Postgres default) so
  `anon` can read merged ranges with zero access to the underlying rows.

## RLS summary

| Role                  | cars                    | car_images                 | agency_settings | bookings | blocked_periods | view / fn        |
| --------------------- | ----------------------- | -------------------------- | --------------- | -------- | --------------- | ---------------- |
| anon                  | SELECT (available only) | SELECT (of available cars) | SELECT          | ❌       | ❌              | SELECT / EXECUTE |
| authenticated (owner) | ALL                     | ALL                        | ALL             | ALL      | ALL             | SELECT / EXECUTE |
| service_role          | ALL (bypasses RLS)      | …                          | …               | …        | …               | …                |

Guests never get an `INSERT` grant on `bookings`. Booking creation goes
through `createBooking` (Server Action) using the **service-role** client
after re-validating availability; the exclusion constraint remains the
final authority.

## Files

- `supabase/migrations/0001..0008` — schema, constraints, fn, view, RLS.
- `supabase/seed.sql` — 1 agency, 7 cars (+images), sample bookings/blocks.
- `types/database.types.ts` — hand-authored to match the schema.
- `lib/validations/*` — shared Zod schemas (client + server).
- `server/queries.ts` · `server/mutations.ts` · `server/availability.ts`.

## Verifying & applying

The guarantees are verified without Docker via an in-memory Postgres
(PGlite, real Postgres compiled to WASM):

```bash
pnpm db:test   # loads every migration + seed, asserts 24 checks
```

Against a real Supabase project:

```bash
supabase link --project-ref <ref>
supabase db push                         # apply migrations
supabase db reset                        # (local) apply + run seed.sql
supabase gen types typescript --linked > types/database.types.ts
```
