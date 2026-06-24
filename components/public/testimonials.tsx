import { useTranslations } from "next-intl";
import { Quote, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

/**
 * Testimonials shown on the home page. The per-review ratings here and the
 * `AGGREGATE_RATING` below are the single source of truth for both the visible
 * stars and the `AggregateRating` JSON-LD emitted by the page — keep them in
 * sync so the structured data always matches what users see (Rich Results
 * requirement).
 */
export const TESTIMONIALS = [
  { key: "t1", rating: 5 },
  { key: "t2", rating: 5 },
  { key: "t3", rating: 5 },
  { key: "t4", rating: 4 },
] as const;

/** Aggregate rating surfaced as `AggregateRating` structured data. */
export const AGGREGATE_RATING = {
  ratingValue: 4.9,
  reviewCount: 128,
  bestRating: 5,
} as const;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-secondary text-secondary"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
        <p className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-sm">
          <span className="flex" aria-hidden>
            <Star className="fill-secondary text-secondary size-4" />
          </span>
          {t("ratingLabel", {
            rating: AGGREGATE_RATING.ratingValue,
            count: AGGREGATE_RATING.reviewCount,
          })}
        </p>
      </Reveal>

      <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TESTIMONIALS.map(({ key, rating }) => (
          <StaggerItem
            key={key}
            className="bg-card flex h-full flex-col gap-4 rounded-xl border p-6 shadow-sm"
          >
            <Quote className="text-primary/30 size-7" aria-hidden />
            <Stars rating={rating} />
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
    </section>
  );
}
