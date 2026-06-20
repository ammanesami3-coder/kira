/**
 * Booking extras catalog — the single source of truth for optional add-ons
 * and their prices. Pure module (no server-only imports) so it is shared by:
 *   - the Zod schema (validates the selected ids),
 *   - the client form (renders options + live price), and
 *   - the Server Action (recomputes the authoritative price — never trust
 *     the client for money).
 *
 * Prices are in the agency currency (whole units). `pricing` decides how the
 * line item scales: `per_day` multiplies by the rental days, `per_booking`
 * is a one-off charge.
 */

export type ExtraPricing = "per_day" | "per_booking";

export interface BookingExtra {
  id: ExtraId;
  /** i18n key under the `bookingExtras` namespace. */
  price: number;
  pricing: ExtraPricing;
}

/** Canonical, ordered list of valid extra ids (drives the Zod enum). */
export const EXTRA_IDS = [
  "full_insurance",
  "additional_driver",
  "gps",
  "child_seat",
] as const;

export type ExtraId = (typeof EXTRA_IDS)[number];

export const BOOKING_EXTRAS: readonly BookingExtra[] = [
  { id: "full_insurance", price: 80, pricing: "per_day" },
  { id: "additional_driver", price: 50, pricing: "per_booking" },
  { id: "gps", price: 20, pricing: "per_day" },
  { id: "child_seat", price: 30, pricing: "per_booking" },
];

const EXTRA_BY_ID: Record<ExtraId, BookingExtra> = Object.fromEntries(
  BOOKING_EXTRAS.map((e) => [e.id, e]),
) as Record<ExtraId, BookingExtra>;

/** Price of a single extra for a rental of `totalDays` days. */
export function extraPrice(id: ExtraId, totalDays: number): number {
  const extra = EXTRA_BY_ID[id];
  if (!extra) return 0;
  return extra.pricing === "per_day" ? extra.price * totalDays : extra.price;
}

/** Sum of all selected extras for a rental of `totalDays` days. */
export function extrasTotal(selected: readonly ExtraId[], totalDays: number) {
  // De-dupe so a repeated id is never charged twice.
  const unique = new Set(selected);
  let total = 0;
  for (const id of unique) total += extraPrice(id, totalDays);
  return total;
}
