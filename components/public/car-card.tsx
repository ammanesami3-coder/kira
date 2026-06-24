import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Users, Cog, Fuel, ImageOff } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale, siteConfig } from "@/config/site.config";
import type { CarWithImages } from "@/server/queries";
import { carName, formatPrice, imageAlt, primaryImage } from "@/lib/display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Catalog / featured car card. Server Component (no client JS): the whole
 * card is a link to the detail page, with a focusable "details" button for
 * an explicit affordance.
 *
 * `priority` is forwarded to the image only for the LCP candidate (first
 * card above the fold) — never lazy-load that one, lazy-load the rest.
 */
export function CarCard({
  car,
  priority = false,
}: {
  car: CarWithImages;
  priority?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const image = primaryImage(car.car_images);
  const name = carName(car, locale);

  return (
    <article className="group bg-card focus-within:ring-ring/50 relative flex flex-col overflow-hidden rounded-xl border shadow-sm transition duration-300 focus-within:ring-2 hover:-translate-y-1 hover:shadow-md">
      <div className="bg-muted relative aspect-[4/3] overflow-hidden">
        {image ? (
          <Image
            src={image.url}
            alt={imageAlt(image, name, locale)}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
        <Badge variant="secondary" className="absolute end-3 top-3 shadow-sm">
          {t(`categories.${car.category}`)}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-1">
          <h3 className="leading-tight font-semibold tracking-tight">
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
  );
}
