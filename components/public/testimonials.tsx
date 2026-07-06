import { useTranslations } from "next-intl";
import { ExternalLink, Quote, Star } from "lucide-react";

import type { AgencyReview } from "@/lib/reviews";
import type { AggregateRatingInput } from "@/lib/structured-data";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/public/stars";
import { ReviewsCarousel } from "@/components/public/reviews-carousel";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Magnetic } from "@/components/motion/magnetic";

/**
 * Built-in testimonials shown ONLY while the owner has not curated real
 * Google reviews in the dashboard yet. Their ratings and `AGGREGATE_RATING`
 * below are the fallback source for the `AggregateRating` JSON-LD — when
 * curated reviews exist, both the visible section and the JSON-LD switch to
 * the same DB-derived numbers (see lib/reviews.ts + the home page), so the
 * structured data always matches what users see.
 */
export const TESTIMONIALS = [
  { key: "t1", rating: 5 },
  { key: "t2", rating: 5 },
  { key: "t3", rating: 5 },
  { key: "t4", rating: 4 },
] as const;

/** Fallback aggregate — used only when no curated reviews exist. */
export const AGGREGATE_RATING = {
  ratingValue: 4.9,
  reviewCount: 128,
  bestRating: 5,
} as const;

/**
 * Social-proof section. `reviews` are the owner-curated Google reviews from
 * `agency_settings`; `rating` is whatever the page also fed to the JSON-LD
 * (curated aggregate, or the fallback). `googleMapsLink` powers the
 * "review us on Google" CTA and costs zero API calls.
 */
export function Testimonials({
  reviews = [],
  googleMapsLink = null,
  rating = AGGREGATE_RATING,
}: {
  reviews?: AgencyReview[];
  googleMapsLink?: string | null;
  rating?: AggregateRatingInput;
}) {
  const t = useTranslations("testimonials");
  const curated = reviews.length > 0;

  return (
    <section
      data-sec="testimonials"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>

        {/* Rating summary — same numbers as the AggregateRating JSON-LD. */}
        <div className="glass mx-auto mt-6 flex w-fit items-center gap-3 rounded-full px-5 py-2.5">
          <span className="text-2xl font-bold tracking-tight">
            {rating.ratingValue}
          </span>
          <Stars rating={Math.round(rating.ratingValue)} />
          <span className="text-muted-foreground text-sm">
            {t("ratingLabel", {
              rating: rating.ratingValue,
              count: rating.reviewCount,
            })}
          </span>
        </div>

        {googleMapsLink && (
          <Magnetic className="mt-6">
            <Button asChild size="lg">
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="gap-2"
              >
                <Star className="size-4 fill-current" aria-hidden />
                {t("googleCta")}
                <ExternalLink className="size-3.5 opacity-70" aria-hidden />
              </a>
            </Button>
          </Magnetic>
        )}
      </Reveal>

      {curated ? (
        <div className="mt-12">
          <ReviewsCarousel reviews={reviews} />
        </div>
      ) : (
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map(({ key, rating: itemRating }) => (
            <StaggerItem
              key={key}
              className="glass flex h-full flex-col gap-4 rounded-2xl p-6"
            >
              <Quote className="text-primary/30 size-7" aria-hidden />
              <Stars rating={itemRating} />
              <blockquote className="text-sm leading-relaxed text-pretty">
                {t(`items.${key}.quote`)}
              </blockquote>
              <div className="mt-auto flex items-center gap-3 pt-2">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full font-semibold">
                  {t(`items.${key}.name`).charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {t(`items.${key}.name`)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {t(`items.${key}.location`)}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
