/**
 * Pure presentation helpers shared by server and client components.
 *
 * Keep this module free of server-only imports: it is used in both
 * Server Components (car cards, detail page) and Client Components
 * (gallery, availability calendar).
 */

import type { Car, CarImage } from "@/types/database.types";
import type { Locale } from "@/config/site.config";

type CarLike = Pick<Car, "name" | "name_ar">;
type CarDescriptionLike = Pick<
  Car,
  "description" | "description_ar" | "description_fr"
>;

/** Localized car name, falling back to the default `name`. */
export function carName(car: CarLike, locale: Locale): string {
  if (locale === "ar" && car.name_ar) return car.name_ar;
  return car.name;
}

/** Localized car description (nullable). */
export function carDescription(
  car: CarDescriptionLike,
  locale: Locale,
): string | null {
  if (locale === "ar") return car.description_ar ?? car.description;
  if (locale === "fr") return car.description_fr ?? car.description;
  return car.description;
}

/** Localized image alt text, falling back to the car name. */
export function imageAlt(
  image: Pick<CarImage, "alt" | "alt_ar">,
  fallback: string,
  locale: Locale,
): string {
  if (locale === "ar" && image.alt_ar) return image.alt_ar;
  return image.alt ?? fallback;
}

/**
 * Primary image of a car, or the first one, or null.
 * Images are already sorted by `sort_order` by the query layer.
 */
export function primaryImage(images: CarImage[]): CarImage | null {
  return images.find((img) => img.is_primary) ?? images[0] ?? null;
}

/** Gallery order: primary first, then the rest by their existing order. */
export function galleryImages(images: CarImage[]): CarImage[] {
  return [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

const localeTag: Record<Locale, string> = {
  ar: "ar-MA",
  fr: "fr-MA",
};

/** Currency amount formatted for the locale (no fractional dirhams). */
export function formatPrice(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(localeTag[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
