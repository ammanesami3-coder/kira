import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Car as CarIcon,
  Cog,
  DoorOpen,
  Fuel,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site.config";
import {
  absoluteUrl,
  clampDescription,
  localePath,
  localizedAlternates,
} from "@/lib/seo";
import { breadcrumbJsonLd, carJsonLd } from "@/lib/structured-data";
import { routing } from "@/i18n/routing";
import {
  getCarBySlug,
  getCarSlugs,
  type CarWithImages,
} from "@/server/queries";
import { getUnavailableRanges, type DateRange } from "@/server/availability";
import {
  carDescription,
  carName,
  formatPrice,
  galleryImages,
  imageAlt,
} from "@/lib/display";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarGallery, type GalleryImage } from "@/components/public/car-gallery";
import { AvailabilityCalendar } from "@/components/public/availability-calendar";

// Detail pages are content: prerender on first hit, then serve from the ISR
// cache and revalidate hourly. Date conflicts are always re-checked live at
// booking time, so a slightly stale availability calendar is safe.
export const revalidate = 3600;

// Prerender every available car in both locales at build time. `dynamicParams`
// stays true (default) so a newly added slug still renders on-demand and is
// then cached, picked up automatically on the next revalidation.
export async function generateStaticParams() {
  const cars = await getCarSlugs().catch(() => []);
  return routing.locales.flatMap((locale) =>
    cars.map((car) => ({ locale, slug: car.slug })),
  );
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return { robots: { index: false } };

  const name = carName(car, locale as Locale);
  const description = clampDescription(
    carDescription(car, locale as Locale) ??
      `${name} — ${car.brand} ${car.model} ${car.year}.`,
  );

  return {
    title: name,
    description,
    alternates: localizedAlternates(locale as Locale, `/cars/${slug}`),
    // OG image is provided by the route's dynamic `opengraph-image` (next/og).
    openGraph: {
      title: name,
      description,
      type: "website",
      url: `/${locale}/cars/${slug}`,
    },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function CarDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const ranges = await getUnavailableRanges(car.id);
  const t = await getTranslations({ locale });

  const name = carName(car, locale as Locale);
  const description = carDescription(car, locale as Locale);
  const url = absoluteUrl(localePath(locale as Locale, `/cars/${slug}`));

  // Car + Offer and BreadcrumbList structured data, built server-side where
  // the locale-aware translations and absolute URLs are available.
  const carLd = carJsonLd({
    name,
    description: clampDescription(
      description ?? `${name} — ${car.brand} ${car.model} ${car.year}.`,
    ),
    brand: car.brand,
    model: car.model,
    year: car.year,
    transmission: t(`transmission.${car.transmission}`),
    fuelType: t.has(`fuel.${car.fuel_type}`)
      ? t(`fuel.${car.fuel_type}`)
      : car.fuel_type,
    seats: car.seats,
    doors: car.doors,
    images: galleryImages(car.car_images).map((img) => img.url),
    pricePerDay: Number(car.price_per_day),
    currency: siteConfig.currency,
    url,
    available: car.is_available,
  });
  const breadcrumbLd = breadcrumbJsonLd([
    { name: t("nav.home"), path: localePath(locale as Locale) },
    { name: t("nav.cars"), path: localePath(locale as Locale, "/cars") },
    { name, path: localePath(locale as Locale, `/cars/${slug}`) },
  ]);

  return (
    <>
      <JsonLd data={[carLd, breadcrumbLd]} />
      <CarDetail car={car} ranges={ranges} />
    </>
  );
}

function CarDetail({
  car,
  ranges,
}: {
  car: CarWithImages;
  ranges: DateRange[];
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const name = carName(car, locale);
  const description = carDescription(car, locale);
  const images: GalleryImage[] = galleryImages(car.car_images).map((img) => ({
    url: img.url,
    alt: imageAlt(img, name, locale),
  }));

  const specs = [
    {
      Icon: Tag,
      label: t("car.category"),
      value: t(`categories.${car.category}`),
    },
    { Icon: CarIcon, label: t("car.brand"), value: car.brand },
    { Icon: CalendarDays, label: t("car.year"), value: String(car.year) },
    { Icon: Users, label: t("car.seats"), value: String(car.seats) },
    { Icon: DoorOpen, label: t("car.doors"), value: String(car.doors) },
    {
      Icon: Cog,
      label: t("car.transmission"),
      value: t(`transmission.${car.transmission}`),
    },
    {
      Icon: Fuel,
      label: t("car.fuel"),
      value: t.has(`fuel.${car.fuel_type}`)
        ? t(`fuel.${car.fuel_type}`)
        : car.fuel_type,
    },
  ];

  return (
    <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ms-2 mb-6">
        <Link href="/cars" className="text-muted-foreground gap-2">
          <Arrow className="size-4 rotate-180" aria-hidden />
          {t("car.backToCatalog")}
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <CarGallery images={images} name={name} />

        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <Badge variant="secondary">{t(`categories.${car.category}`)}</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {name}
            </h1>
            <p className="text-muted-foreground">
              {car.brand} {car.model} · {car.year}
            </p>
          </header>

          <div className="bg-card rounded-xl border p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-xs">{t("car.from")}</p>
                <p>
                  <span className="text-3xl font-bold">
                    {formatPrice(
                      car.price_per_day,
                      siteConfig.currency,
                      locale,
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    {t("car.perDay")}
                  </span>
                </p>
              </div>
              {car.price_per_week != null && (
                <Badge variant="outline" className="gap-1">
                  {formatPrice(car.price_per_week, siteConfig.currency, locale)}
                  {t("car.perWeek")}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="size-4" aria-hidden />
              {t("car.deposit")}:{" "}
              {formatPrice(car.deposit, siteConfig.currency, locale)}
            </p>

            <Button asChild size="lg" className="mt-5 w-full">
              <Link href={`/book/${car.slug}`} className="gap-2">
                {t("car.book")}
                <Arrow className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="mb-3 font-semibold">
              {t("car.specs")}
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="bg-muted/40 flex items-start gap-2.5 rounded-lg border p-3"
                >
                  <Icon
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="truncate text-sm font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {car.features.length > 0 && (
            <section aria-labelledby="features-heading">
              <h2 id="features-heading" className="mb-3 font-semibold">
                {t("car.features")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <li key={f}>
                    <Badge variant="outline" className="font-normal">
                      {t.has(`features.${f}`) ? t(`features.${f}`) : f}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-12">
        {description && (
          <section aria-labelledby="desc-heading">
            <h2 id="desc-heading" className="mb-3 text-xl font-semibold">
              {t("car.description")}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              {description}
            </p>
          </section>
        )}

        <section aria-labelledby="availability-heading">
          <h2 id="availability-heading" className="mb-3 text-xl font-semibold">
            {t("car.availability")}
          </h2>
          <AvailabilityCalendar ranges={ranges} />
        </section>
      </div>
    </article>
  );
}
