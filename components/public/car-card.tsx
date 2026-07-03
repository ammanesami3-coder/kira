import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Users, Cog, Fuel, ImageOff } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale, siteConfig } from "@/config/site.config";
import type { CarWithImages } from "@/server/queries";
import { carName, formatPrice, imageAlt, primaryImage } from "@/lib/display";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TiltCard } from "@/components/motion/tilt-card";

/**
 * Catalog / featured car card. The card body is a Server Component: the whole
 * card is a link to the detail page, with a focusable "details" button for an
 * explicit affordance. Only the TiltCard shell (3D hover physics) is client JS.
 *
 * `priority` is forwarded to the image only for the LCP candidate (first
 * card above the fold) — never lazy-load that one, lazy-load the rest.
 *
 * `featured` renders the 2×2 showcase variant used by the discovery grid:
 * the media area stretches to fill the spanned cell instead of a fixed ratio.
 */
export function CarCard({
  car,
  priority = false,
  featured = false,
}: {
  car: CarWithImages;
  priority?: boolean;
  featured?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const image = primaryImage(car.car_images);
  const name = carName(car, locale);

  return (
    <TiltCard className="h-full">
      <article className="group bg-card focus-within:ring-ring/50 relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgb(0_0_0/0.05),0_8px_24px_-12px_rgb(0_0_0/0.12)] transition-shadow duration-300 focus-within:ring-2 hover:shadow-[0_2px_4px_rgb(0_0_0/0.06),0_20px_44px_-16px_rgb(0_0_0/0.22)]">
        <div
          className={cn(
            "bg-muted relative overflow-hidden",
            featured
              ? "aspect-[4/3] lg:aspect-auto lg:min-h-64 lg:flex-1"
              : "aspect-[4/3]",
          )}
        >
          {image ? (
            <Image
              src={image.url}
              alt={imageAlt(image, name, locale)}
              fill
              sizes={
                featured
                  ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 66vw"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={priority}
              // Shared element for the catalog ↔ detail View Transition: the same
              // name on the detail gallery's main image makes it morph in place.
              style={{ viewTransitionName: `car-${car.slug}` }}
            />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              <ImageOff className="size-8" aria-hidden />
              <span className="sr-only">{t("car.noImage")}</span>
            </div>
          )}
          <Badge
            variant="secondary"
            className="glass text-foreground absolute end-3 top-3"
          >
            {t(`categories.${car.category}`)}
          </Badge>
        </div>

        {/* In the featured 2×2 variant the media stretches (lg:flex-1) instead
            of the content, so the two must never both grow. */}
        <div className={cn("flex flex-col gap-4 p-4", !featured && "flex-1")}>
          <div className="space-y-1">
            <h3
              className={cn(
                "leading-tight font-semibold tracking-tight",
                featured && "lg:text-xl",
              )}
            >
              {/* Stretched link makes the whole card clickable */}
              <Link
                href={`/cars/${car.slug}`}
                className="after:absolute after:inset-0 focus:outline-none"
              >
                {name}
              </Link>
            </h3>
            <p className="text-muted-foreground text-sm">
              {car.brand} · {car.year}
            </p>
          </div>

          <ul className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <li className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              {car.seats}
            </li>
            <li className="flex items-center gap-1.5">
              <Cog className="size-4" aria-hidden />
              {t(`transmission.${car.transmission}`)}
            </li>
            <li className="flex items-center gap-1.5">
              <Fuel className="size-4" aria-hidden />
              {t.has(`fuel.${car.fuel_type}`)
                ? t(`fuel.${car.fuel_type}`)
                : car.fuel_type}
            </li>
          </ul>

          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <p className="leading-tight">
              <span className="text-lg font-bold">
                {formatPrice(car.price_per_day, siteConfig.currency, locale)}
              </span>
              <span className="text-muted-foreground text-sm">
                {" "}
                {t("car.perDay")}
              </span>
            </p>
            {/* Visual-only: the stretched link above drives navigation */}
            <Button
              size="sm"
              variant="secondary"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none"
            >
              {t("car.viewDetails")}
            </Button>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
