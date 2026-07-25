/**
 * Owner-curated Google reviews: shared read-side helpers.
 *
 * `agency_settings.reviews` is a jsonb array validated by Zod on write, but
 * jsonb carries no schema — so every read goes through `parseReviews`, which
 * silently drops malformed entries instead of ever crashing a page.
 *
 * The homepage derives its visible rating summary AND the JSON-LD
 * `AggregateRating` from the same `aggregateFromReviews` result, so the
 * structured data is truthful by construction (Rich Results requirement).
 *
 * Pure module (no server-only imports) — usable from Server Components and
 * the admin form alike.
 */

import type { Json } from "@/types/database.types";
import type { AggregateRatingInput } from "@/lib/structured-data";

export interface AgencyReview {
  author: string;
  /** Whole stars, 1–5. */
  rating: number;
  quote: string;
  /** Optional display date, e.g. "2026-05". */
  date?: string;
}

export function parseReviews(value: Json | null | undefined): AgencyReview[] {
  if (!Array.isArray(value)) return [];
  const reviews: AgencyReview[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const r = item as Record<string, Json | undefined>;
    if (typeof r.author !== "string" || r.author.trim() === "") continue;
    if (typeof r.quote !== "string" || r.quote.trim() === "") continue;
    if (typeof r.rating !== "number" || r.rating < 1 || r.rating > 5) continue;
    reviews.push({
      author: r.author,
      rating: Math.round(r.rating),
      quote: r.quote,
      ...(typeof r.date === "string" && r.date !== "" ? { date: r.date } : {}),
    });
  }
  return reviews;
}

/**
 * Extract the bare Elfsight app id (a UUID) from whatever the owner pasted:
 * the raw id, the `elfsight-app-<uuid>` class, or the full embed snippet
 * (`<div class="elfsight-app-…">`). Returns null when no id is present, so a
 * blank/garbage value cleanly falls back to curated/built-in reviews.
 */
export function elfsightAppId(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
  );
  return match ? match[0].toLowerCase() : null;
}

/** Average rating (1 decimal) + count, or null when there is nothing to rate. */
export function aggregateFromReviews(
  reviews: AgencyReview[],
): AggregateRatingInput | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    ratingValue: Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
    bestRating: 5,
  };
}
