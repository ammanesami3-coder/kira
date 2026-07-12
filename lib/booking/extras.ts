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
 *
 * The owner can override visibility and prices per deployment through
 * `agency_settings.booking_extras` (jsonb) — see `resolveExtrasSettings`.
 * An absent/empty blob resolves to exactly the defaults below, so
 * deployments that never touch the setting keep today's behavior.
 */

import type { Json } from "@/types/database.types";

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

/* ── Owner overrides (agency_settings.booking_extras jsonb) ─────────── */

export interface ExtraOverride {
  enabled: boolean;
  /** null = use the default catalog price. */
  price: number | null;
}

export interface ExtrasOverrides {
  /** Whether the extras section is shown at all in the booking flow. */
  enabled: boolean;
  items: Record<ExtraId, ExtraOverride>;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asPrice(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

/**
 * Tolerant read of the raw jsonb blob (same contract as lib/design.ts):
 * malformed or missing values silently fall back to "enabled, default price"
 * so a bad row can never crash a page or change other deployments.
 */
export function parseExtrasOverrides(
  value: Json | null | undefined,
): ExtrasOverrides {
  const root = asObject(value);
  const rawItems = asObject(root?.items);
  const items = Object.fromEntries(
    EXTRA_IDS.map((id) => {
      const item = asObject(rawItems?.[id]);
      return [
        id,
        {
          enabled: typeof item?.enabled === "boolean" ? item.enabled : true,
          price: asPrice(item?.price),
        },
      ];
    }),
  ) as Record<ExtraId, ExtraOverride>;

  return {
    enabled: typeof root?.enabled === "boolean" ? root.enabled : true,
    items,
  };
}

/**
 * Effective extras catalog for a deployment: only enabled items, in
 * canonical order, with owner prices applied. Empty when the owner hid the
 * whole section (or every item) — callers hide the extras UI entirely then.
 */
export function resolveExtrasSettings(
  value: Json | null | undefined,
): BookingExtra[] {
  const overrides = parseExtrasOverrides(value);
  if (!overrides.enabled) return [];
  return BOOKING_EXTRAS.filter((def) => overrides.items[def.id].enabled).map(
    (def) => ({ ...def, price: overrides.items[def.id].price ?? def.price }),
  );
}

/* ── Price math ──────────────────────────────────────────────────────── */

/** Price of one extra from an explicit catalog (0 if not in the catalog). */
export function extraPriceIn(
  catalog: readonly BookingExtra[],
  id: ExtraId,
  totalDays: number,
): number {
  const extra = catalog.find((e) => e.id === id);
  if (!extra) return 0;
  return extra.pricing === "per_day" ? extra.price * totalDays : extra.price;
}

/** Sum of the selected extras priced from an explicit catalog. */
export function extrasTotalIn(
  catalog: readonly BookingExtra[],
  selected: readonly ExtraId[],
  totalDays: number,
): number {
  // De-dupe so a repeated id is never charged twice.
  const unique = new Set(selected);
  let total = 0;
  for (const id of unique) total += extraPriceIn(catalog, id, totalDays);
  return total;
}

/** Price of a single extra (default catalog) for a rental of `totalDays`. */
export function extraPrice(id: ExtraId, totalDays: number): number {
  return extraPriceIn(BOOKING_EXTRAS, id, totalDays);
}

/** Sum of all selected extras (default catalog). */
export function extrasTotal(selected: readonly ExtraId[], totalDays: number) {
  return extrasTotalIn(BOOKING_EXTRAS, selected, totalDays);
}

/* ── Per-booking price snapshot ─────────────────────────────────────── */

/**
 * `bookings.extras` jsonb payload: the selected ids plus the price each one
 * was actually sold at, so later consumers (the PDF) render the booking's
 * own prices even after the owner edits the settings.
 */
export function extrasSnapshot(
  catalog: readonly BookingExtra[],
  selected: readonly ExtraId[],
): Json {
  const prices: Record<string, number> = {};
  for (const id of new Set(selected)) {
    const extra = catalog.find((e) => e.id === id);
    if (extra) prices[id] = extra.price;
  }
  return { selected: [...new Set(selected)], prices };
}

/**
 * Rebuild the catalog a stored booking was priced with: default catalog with
 * the snapshotted prices applied. Bookings created before the snapshot
 * existed simply fall back to the defaults.
 */
export function parseExtrasCatalog(
  value: Json | null | undefined,
): BookingExtra[] {
  const prices = asObject(asObject(value)?.prices);
  return BOOKING_EXTRAS.map((def) => ({
    ...def,
    price: asPrice(prices?.[def.id]) ?? def.price,
  }));
}
