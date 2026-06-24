import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale } from "@/config/site.config";
import { clampDescription, localizedAlternates } from "@/lib/seo";
import { resolveBranding } from "@/lib/branding";
import { autoRentalJsonLd, faqJsonLd } from "@/lib/structured-data";
import { getAgencySettings, getAvailableCars } from "@/server/queries";
import { primaryImage } from "@/lib/display";
import { JsonLd } from "@/components/seo/json-ld";
import { Hero } from "@/components/public/hero";
import { TrustBadges } from "@/components/public/trust-badges";
import { HowItWorks } from "@/components/public/how-it-works";
import { FleetCategories } from "@/components/public/fleet-categories";
import { ValueProps } from "@/components/public/value-props";
import { FeaturedCars } from "@/components/public/featured-cars";
import { Stats } from "@/components/public/stats";
import {
  AGGREGATE_RATING,
  Testimonials,
} from "@/components/public/testimonials";
import { FaqSection, FAQ_KEYS } from "@/components/public/faq-section";
import { CtaBand } from "@/components/public/cta-band";

// ISR: the landing page is content, not per-user. Revalidate hourly so a new
// car / branding edit appears without a redeploy, while serving from cache.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale as Locale);

  const title = t("title", { name: brand.name });
  const description = clampDescription(
    settings?.seo_description || t("subtitle"),
  );

  return {
    title,
    description,
    alternates: localizedAlternates(locale as Locale),
    openGraph: { title, description, url: `/${locale}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [cars, settings, t, tFaq] = await Promise.all([
    getAvailableCars(),
    getAgencySettings().catch(() => null),
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "faq" }),
  ]);

  const brand = resolveBranding(settings, locale as Locale);
  const featured = cars.slice(0, 6);

  // First car with an image drives the hero LCP visual.
  const heroImage =
    cars.map((c) => primaryImage(c.car_images)).find(Boolean)?.url ?? null;

  // Structured data: the rental business (with its aggregate rating) + the FAQ.
  // Both validate clean on the Rich Results Test.
  const businessLd = autoRentalJsonLd(
    settings,
    brand,
    locale as Locale,
    clampDescription(settings?.seo_description || t("subtitle")),
    AGGREGATE_RATING,
  );
  const faqLd = faqJsonLd(
    FAQ_KEYS.map((key) => ({
      question: tFaq(`items.${key}.q`),
      answer: tFaq(`items.${key}.a`),
    })),
  );

  return (
    <>
      <JsonLd data={[businessLd, faqLd]} />
      <Hero imageUrl={heroImage} />
      <TrustBadges />
      <HowItWorks />
      <FleetCategories locale={locale} />
      <FeaturedCars cars={featured} locale={locale} />
      <ValueProps />
      <Stats carsCount={cars.length} />
      <Testimonials />
      <FaqSection />
      <CtaBand locale={locale} />
    </>
  );
}
