# Phase 3 — Guest booking flow

End-to-end guest booking (no account) from date selection to a confirmation
screen, with double-booking prevention. **No PDF / WhatsApp yet** (Phase 4):
this phase only creates the booking row and renders confirmation.

## What was built

### Page

| Route                   | File                                         | Notes                                                                                                                                                        |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/[locale]/book/[slug]` | `app/[locale]/(public)/book/[slug]/page.tsx` | Server Component: loads car + unavailable ranges, builds a serializable `BookingCar`, renders the form. `noindex` (transactional) but crawlable (no iframe). |

### Components (`components/public/booking/`)

- `booking-form.tsx` _(client)_ — orchestrates the whole flow: React Hook Form +
  `zodResolver(bookingInputSchema)`, live price summary, server-action submit,
  inline error alert, and swaps to the confirmation view on success.
- `booking-date-range.tsx` _(client)_ — `react-day-picker` range picker. Past
  days + every day of the unavailable ranges are disabled; `excludeDisabled`
  stops a selection from spanning a taken day; `min={2}` enforces ≥ 1 rental day.
- `booking-confirmation.tsx` _(client)_ — success screen: reference (copyable),
  dates, totals, pending status. Renders only data the guest entered + the
  server-issued reference/totals — never re-fetches the PII-protected row.
- `types.ts` — `BookingCar` serializable summary passed Server → Client.

### Lib / server

- `lib/booking/extras.ts` — **shared extras catalog** (pure module). Single
  source of truth for add-ons + prices, consumed by the Zod enum, the client
  form (live price), and the Server Action (authoritative price). `per_day`
  vs `per_booking` pricing.
- `lib/rate-limit.ts` — minimal in-memory fixed-window limiter (5/min per IP).
  Best-effort on serverless (per-instance); swap for Redis later (same API).
- `lib/turnstile.ts` — Cloudflare Turnstile verify, **inert until
  `TURNSTILE_SECRET_KEY` is set** (returns `true` when unconfigured).
- `lib/validations/booking.ts` — `extras` tightened from a loose record to a
  validated `z.enum` array; added `note` + optional `turnstileToken`;
  `pickup_location` now required. Exports `BookingFormValues` (Zod **input**
  type) for RHF alongside `BookingInput` (output) for the action.
- `server/mutations.ts` — `createBooking` extended: per-IP rate limit →
  Turnstile → honeypot → car availability → `is_car_available` re-check →
  **authoritative price** (`base + extrasTotal`) → insert `pending`. Returns
  `BookingConfirmation` (reference + generated dates/totals) for the screen.

## Key decisions

- **Double-booking guard is layered.** UI disables taken dates → Server Action
  re-checks `is_car_available` (confirmed bookings + blocks) → DB exclusion
  constraint is the final authority. A `23P01` conflict maps to a friendly
  `DATES_UNAVAILABLE` message. New bookings are `pending`, so the exclusion
  constraint (confirmed-only) does not fire on insert — the `is_car_available`
  re-check is what rejects overlaps with confirmed/blocked dates. Multiple
  pending requests for the same slot remain allowed by design (CLAUDE.md §4).
- **Price is never trusted from the client.** The client total is display-only;
  `createBooking` recomputes `total_days × price_per_day + extras` from the DB
  car price and the shared catalog.
- **Half-open ranges throughout.** The picked drop-off day is the exclusive
  `end`, matching `period` `[start, end)`. The picker disables up to `end − 1`
  of each taken range (consistent with the read-only availability calendar).
- **RHF input vs output types.** Zod `.default()` makes fields optional in the
  input type; `useForm<BookingFormValues, unknown, BookingInput>` reconciles the
  form value type with the parsed submit type.
- **Confirmation is in-memory, not a fetch.** Avoids exposing a route that reads
  the RLS-protected booking; the client already holds everything to display.

## Spam protection

- **Honeypot** `company` field (visually hidden, `tabIndex={-1}`); any non-empty
  value is silently rejected server-side.
- **Rate limit** 5 submissions/min per IP (`x-forwarded-for`).
- **Turnstile** wired but off until keys are configured (env placeholders exist).

## Not in scope (Phase 4)

PDF generation, WhatsApp gateway dispatch, admin booking management.
