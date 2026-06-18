import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
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
import { getCarBySlug, type CarWithImages } from "@/server/queries";
import { getUnavailableRanges, type DateRange } from "@/server/availability";
import {
  carDescription,
  carName,
  formatPrice,
  galleryImages,
  imageAlt,
  primaryImage,
} from "@/lib/display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CarGallery, type GalleryImage } from "@/components/public/car-gallery";
import { AvailabilityCalendar } from "@/components/public/availability-calendar";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return {};

  const name = carName(car, locale as Locale);
  const description =
    carDescription(car, locale as Locale) ?? `${car.brand} ${car.model}`;
  const image = primaryImage(car.car_images)?.url;

  return {
    title: name,
    description,
    alternates: {
      canonical: `/${locale}/cars/${slug}`,
      languages: Object.fromEntries(
        siteConfig.locales.map((l) => [l, `/${l}/cars/${slug}`]),
      ),
    },
    openGraph: {
      title: name,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function CarDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const ranges = await getUnavailableRanges(car.id);

  return <CarDetail car={car} ranges={ranges} />;
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

  // Product / Car JSON-LD for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name,
    brand: { "@type": "Brand", name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    vehicleTransmission: t(`transmission.${car.transmission}`),
    fuelType: car.fuel_type,
    seatingCapacity: car.seats,
    numberOfDoors: car.doors,
    image: images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      price: car.price_per_day,
      priceCurrency: siteConfig.currency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <article className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
