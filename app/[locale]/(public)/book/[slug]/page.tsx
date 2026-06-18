import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { getCarBySlug, type CarWithImages } from "@/server/queries";
import { carName } from "@/lib/display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Booking metadata pages should not be indexed (the real flow lands in
// Phase 3); keep them out of search results for now.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const car = await getCarBySlug(slug);
  const t = await getTranslations({ locale, namespace: "book" });
  if (!car) return { robots: { index: false } };
  return {
    title: t("title", { name: carName(car, locale as Locale) }),
    robots: { index: false },
  };
}

export default async function BookPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  return <BookPlaceholder car={car} />;
}

function BookPlaceholder({ car }: { car: CarWithImages }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const name = carName(car, locale);

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 lg:px-8">
      <Badge variant="secondary" className="gap-1.5">
        <Clock className="size-3.5" aria-hidden />
        {t("book.badge")}
      </Badge>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("book.title", { name })}
      </h1>
      <p className="text-muted-foreground text-pretty">{t("book.soon")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline">
          <Link href={`/cars/${car.slug}`} className="gap-2">
            <Arrow className="size-4 rotate-180" aria-hidden />
            {t("book.back")}
          </Link>
        </Button>
        <Button asChild>
          <Link href="/contact">{t("book.contact")}</Link>
        </Button>
      </div>
    </section>
  );
}
