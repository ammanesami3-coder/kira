/**
 * Catalog filtering / sorting — driven entirely by URL search params so
 * every filtered view is shareable and crawlable. Pure functions, no I/O.
 */

import type { CarWithImages } from "@/server/queries";
import type { CarCategory, TransmissionType } from "@/types/database.types";

export const CATEGORIES: readonly CarCategory[] = [
  "economy",
  "sedan",
  "suv",
  "luxury",
  "van",
  "pickup",
  "sport",
] as const;

export const TRANSMISSIONS: readonly TransmissionType[] = [
  "manual",
  "automatic",
] as const;

export const SORT_OPTIONS = ["newest", "priceAsc", "priceDesc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** Seat thresholds offered as "N+ seats" filters. */
export const SEAT_OPTIONS = [2, 4, 5, 7] as const;

/** Raw Next.js searchParams (string | string[] | undefined per key). */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface CatalogFilters {
  category: CarCategory | null;
  transmission: TransmissionType | null;
  minSeats: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
  /** Optional availability window (ISO YYYY-MM-DD), both required to apply. */
  from: string | null;
  to: string | null;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDate(value: string | undefined): string | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : value;
}

/** Parse + validate the raw search params into typed catalog filters. */
export function parseFilters(params: RawSearchParams): CatalogFilters {
  const categoryRaw = first(params.category);
  const category =
    categoryRaw && CATEGORIES.includes(categoryRaw as CarCategory)
      ? (categoryRaw as CarCategory)
      : null;

  const transmissionRaw = first(params.transmission);
  const transmission =
    transmissionRaw &&
    TRANSMISSIONS.includes(transmissionRaw as TransmissionType)
      ? (transmissionRaw as TransmissionType)
      : null;

  const sortRaw = first(params.sort);
  const sort = SORT_OPTIONS.includes(sortRaw as SortOption)
    ? (sortRaw as SortOption)
    : "newest";

  const from = toIsoDate(first(params.from));
  const to = toIsoDate(first(params.to));

  return {
    category,
    transmission,
    minSeats: toInt(first(params.seats)),
    minPrice: toInt(first(params.minPrice)),
    maxPrice: toInt(first(params.maxPrice)),
    sort,
    // Only treat the window as valid when from is strictly before to.
    from: from && to && from < to ? from : null,
    to: from && to && from < to ? to : null,
  };
}

/** Apply the non-availability filters + sort to a car list (pure). */
export function applyFilters(
  cars: CarWithImages[],
  f: CatalogFilters,
): CarWithImages[] {
  const filtered = cars.filter((car) => {
    if (f.category && car.category !== f.category) return false;
    if (f.transmission && car.transmission !== f.transmission) return false;
    if (f.minSeats !== null && car.seats < f.minSeats) return false;
    if (f.minPrice !== null && car.price_per_day < f.minPrice) return false;
    if (f.maxPrice !== null && car.price_per_day > f.maxPrice) return false;
    return true;
  });

  switch (f.sort) {
    case "priceAsc":
      filtered.sort((a, b) => a.price_per_day - b.price_per_day);
      break;
    case "priceDesc":
      filtered.sort((a, b) => b.price_per_day - a.price_per_day);
      break;
    case "newest":
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
  }
  return filtered;
}

/** True when any non-default filter is active (controls the "clear" UI). */
export function hasActiveFilters(f: CatalogFilters): boolean {
  return (
    f.category !== null ||
    f.transmission !== null ||
    f.minSeats !== null ||
    f.minPrice !== null ||
    f.maxPrice !== null ||
    f.sort !== "newest"
  );
}
