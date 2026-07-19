/**
 * Tiered rental pricing — the single source of truth for the base price,
 * shared by the client form (display) and the Server Action (authoritative).
 *
 * Tier prices are package totals that apply ONLY when the duration matches
 * the package exactly:
 *   exactly 7 days  → price_per_week      (if configured)
 *   exactly 15 days → price_per_15_days   (if configured)
 *   exactly 30 days → price_per_month     (if configured)
 * Every other duration — and any duration whose tier is not configured —
 * is charged at the plain daily rate: price_per_day × days.
 */

export interface CarPricingTiers {
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePer15Days?: number | null;
  pricePerMonth?: number | null;
}

const TIERS: Array<{
  key: keyof Omit<CarPricingTiers, "pricePerDay">;
  tierDays: number;
}> = [
  { key: "pricePerWeek", tierDays: 7 },
  { key: "pricePer15Days", tierDays: 15 },
  { key: "pricePerMonth", tierDays: 30 },
];

/** The configured package total for exactly `days` days, or null. */
function exactTierTotal(days: number, car: CarPricingTiers): number | null {
  for (const { key, tierDays } of TIERS) {
    const total = car[key];
    if (days === tierDays && total != null && Number(total) > 0) {
      return Number(total);
    }
  }
  return null;
}

/** Effective daily rate for a rental of `days` days. */
export function dailyRate(days: number, car: CarPricingTiers): number {
  const tierTotal = exactTierTotal(days, car);
  if (tierTotal != null && days > 0) return tierTotal / days;
  return Number(car.pricePerDay);
}

/**
 * Cheapest effective daily rate across all configured tiers — the "from"
 * price shown on catalog cards. Equals `pricePerDay` when no tier is set
 * (or none is cheaper), so cards without tiered prices look unchanged.
 */
export function lowestDailyRate(car: CarPricingTiers): number {
  let lowest = Number(car.pricePerDay);
  for (const { key, tierDays } of TIERS) {
    const total = car[key];
    if (total != null && Number(total) > 0) {
      lowest = Math.min(lowest, Number(total) / tierDays);
    }
  }
  return lowest;
}

/** Base rental price (before extras), rounded to 2 decimals. */
export function baseRentalPrice(days: number, car: CarPricingTiers): number {
  if (days <= 0) return 0;
  const tierTotal = exactTierTotal(days, car);
  const base = tierTotal ?? days * Number(car.pricePerDay);
  return Math.round(base * 100) / 100;
}
