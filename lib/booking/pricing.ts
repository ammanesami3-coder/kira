/**
 * Tiered rental pricing — the single source of truth for the base price,
 * shared by the client form (display) and the Server Action (authoritative).
 *
 * Each tier is an optional package total (7 / 15 / 30 days). The booking
 * uses the daily rate of the LONGEST tier the duration qualifies for, so:
 *   7 days  → exactly price_per_week
 *   15 days → exactly price_per_15_days
 *   30 days → exactly price_per_month
 * and in-between durations get the discounted rate (e.g. 10 days at the
 * weekly rate). A missing tier falls back to the next shorter one.
 */

export interface CarPricingTiers {
  pricePerDay: number;
  pricePerWeek?: number | null;
  pricePer15Days?: number | null;
  pricePerMonth?: number | null;
}

const TIERS: Array<{
  minDays: number;
  key: keyof Omit<CarPricingTiers, "pricePerDay">;
  tierDays: number;
}> = [
  { minDays: 7, key: "pricePerWeek", tierDays: 7 },
  { minDays: 15, key: "pricePer15Days", tierDays: 15 },
  { minDays: 30, key: "pricePerMonth", tierDays: 30 },
];

/** Effective daily rate for a rental of `days` days. */
export function dailyRate(days: number, car: CarPricingTiers): number {
  let rate = Number(car.pricePerDay);
  for (const { minDays, key, tierDays } of TIERS) {
    const total = car[key];
    if (days >= minDays && total != null && Number(total) > 0) {
      rate = Number(total) / tierDays;
    }
  }
  return rate;
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
  return Math.round(days * dailyRate(days, car) * 100) / 100;
}
