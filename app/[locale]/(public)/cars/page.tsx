import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { clampDescription, localePath, localizedAlternates } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { parseFilters, type RawSearchParams } from "@/lib/catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { CarFilters } from "@/components/public/car-filters";
import { CarResults } from "@/components/public/car-results";
import { CarGridSkeleton } from "@/components/public/car-card-skeleton";

// Revalidate hourly. Filtered views (query params) render dynamically; the
// canonical points at the param-less /cars to avoid duplicate-content from
// every filter combination.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const title = t("title");
  const description = clampDescription(t("subtitle"));
  return {
    title,
    description,
    alternates: localizedAlternates(locale as Locale, "/cars"),
    openGraph: { title, description, url: `/${locale}/cars` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CarsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const filters = parseFilters(sp);

  const breadcrumbLd = breadcrumbJsonLd([
    { name: tNav("home"), path: localePath(locale as Locale) },
    { name: tNav("cars"), path: localePath(locale as Locale, "/cars") },
  ]);

  // A query key changes whenever filters change → Suspense re-shows the
  // skeleton while the new result set streams in.
  const suspenseKey = JSON.stringify(sp);

  // Build the "remove dates" link target = current params minus from/to.
  const withoutDates = Object.fromEntries(
    Object.entries(sp).filter(
      ([k, v]) => k !== "from" && k !== "to" && typeof v === "string",
    ),
  ) as Record<string, string>;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <JsonLd data={breadcrumbLd} />
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <CarFilters />

        <div className="space-y-6">
          {filters.from && filters.to && (
            <Badge
              variant="secondary"
              className="gap-1.5 px-3 py-1.5 text-sm"
              asChild
            >
              <Link href={{ pathname: "/cars", query: withoutDates }}>
                <CalendarDays className="size-3.5" aria-hidden />
                {t("datesFilter", { from: filters.from, to: filters.to })}
                <X className="size-3.5" aria-hidden />
                <span className="sr-only">{t("clearDates")}</span>
              </Link>
            </Badge>
          )}

          <Suspense key={suspenseKey} fallback={<CarGridSkeleton />}>
            <CarResults searchParams={sp} locale={locale} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
