import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale } from "@/config/site.config";
import { clampDescription, localePath, localizedAlternates } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";
import { FaqSection, FAQ_KEYS } from "@/components/public/faq-section";
import { CtaBand } from "@/components/public/cta-band";

// Static content; revalidate hourly to stay aligned with the rest of the site.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const title = t("metaTitle");
  const description = clampDescription(t("metaDescription"));
  return {
    title,
    description,
    alternates: localizedAlternates(locale as Locale, "/faq"),
    openGraph: { title, description, url: `/${locale}/faq` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "faq" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  // The FAQPage JSON-LD is built from the same `faq.items.*` messages the
  // accordion renders, so the structured data always matches the visible Q&A.
  const faqLd = faqJsonLd(
    FAQ_KEYS.map((key) => ({
      question: t(`items.${key}.q`),
      answer: t(`items.${key}.a`),
    })),
  );
  const breadcrumbLd = breadcrumbJsonLd([
    { name: tNav("home"), path: localePath(locale as Locale) },
    { name: tNav("faq"), path: localePath(locale as Locale, "/faq") },
  ]);

  return (
    <>
      <JsonLd data={[faqLd, breadcrumbLd]} />
      <FaqSection />
      <CtaBand locale={locale} />
    </>
  );
}
