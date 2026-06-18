import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { siteConfig } from "@/config/site.config";
import { getAvailableCars } from "@/server/queries";
import { primaryImage } from "@/lib/display";
import { Hero } from "@/components/public/hero";
import { ValueProps } from "@/components/public/value-props";
import { FeaturedCars } from "@/components/public/featured-cars";
import { AboutSection } from "@/components/public/about-section";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return {
    title: t("title", { name: siteConfig.name }),
    description: t("subtitle"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        siteConfig.locales.map((l) => [l, `/${l}`]),
      ),
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cars = await getAvailableCars();
  const featured = cars.slice(0, 6);

  // First car with an image drives the hero LCP visual.
  const heroImage =
    cars.map((c) => primaryImage(c.car_images)).find(Boolean)?.url ?? null;

  return (
    <>
      <Hero imageUrl={heroImage} />
      <ValueProps />
      <FeaturedCars cars={featured} locale={locale} />
      <AboutSection locale={locale} />
    </>
  );
}
