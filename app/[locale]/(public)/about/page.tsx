import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, HeartHandshake, ShieldCheck } from "lucide-react";

import { type Locale } from "@/config/site.config";
import { clampDescription, localePath, localizedAlternates } from "@/lib/seo";
import { resolveBranding } from "@/lib/branding";
import { autoRentalJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { getAgencySettings, getAvailableCars } from "@/server/queries";
import { primaryImage } from "@/lib/display";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Stats } from "@/components/public/stats";
import { CtaBand } from "@/components/public/cta-band";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

// Static marketing content from the agency settings; revalidate hourly.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

const VALUES = [
  { key: "transparency", Icon: BadgeCheck },
  { key: "quality", Icon: ShieldCheck },
  { key: "service", Icon: HeartHandshake },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "aboutPage" });
  const settings = await getAgencySettings().catch(() => null);
  const brand = resolveBranding(settings, locale as Locale);

  const title = t("metaTitle");
  const description = clampDescription(
    t("metaDescription", { name: brand.name }),
  );
  return {
    title,
    description,
    alternates: localizedAlternates(locale as Locale, "/about"),
    openGraph: { title, description, url: `/${locale}/about` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [cars, settings, t, tNav] = await Promise.all([
    getAvailableCars(),
    getAgencySettings().catch(() => null),
    getTranslations({ locale, namespace: "aboutPage" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const brand = resolveBranding(settings, locale as Locale);
  const image =
    cars.map((c) => primaryImage(c.car_images)).find(Boolean)?.url ?? null;

  const businessLd = autoRentalJsonLd(
    settings,
    brand,
    locale as Locale,
    clampDescription(t("metaDescription", { name: brand.name })),
  );
  const breadcrumbLd = breadcrumbJsonLd([
    { name: tNav("home"), path: localePath(locale as Locale) },
    { name: tNav("about"), path: localePath(locale as Locale, "/about") },
  ]);

  return (
    <>
      <JsonLd data={[businessLd, breadcrumbLd]} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <Reveal className="flex flex-col gap-5" variant="fade">
            <Badge variant="secondary" className="w-fit px-3 py-1 text-xs">
              {t("badge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg text-pretty">
              {t("lead")}
            </p>
          </Reveal>

          {image && (
            <Reveal
              variant="scale"
              className="relative order-first aspect-[4/3] overflow-hidden rounded-2xl border shadow-xl lg:order-none"
            >
              <Image
                src={image}
                alt={brand.name}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </Reveal>
          )}
        </div>

        <Reveal className="mx-auto mt-12 max-w-3xl space-y-4 md:mt-16">
          <p className="text-muted-foreground leading-relaxed text-pretty">
            {t("p1")}
          </p>
          <p className="text-muted-foreground leading-relaxed text-pretty">
            {t("p2")}
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:pb-24 lg:px-8">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("valuesTitle")}
          </h2>
        </Reveal>
        <Stagger className="mt-8 grid gap-6 sm:grid-cols-3">
          {VALUES.map(({ key, Icon }) => (
            <StaggerItem
              key={key}
              className="bg-card flex h-full flex-col gap-3 rounded-xl border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="font-semibold">{t(`values.${key}.title`)}</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                {t(`values.${key}.desc`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Stats carsCount={cars.length} />
      <CtaBand locale={locale} />
    </>
  );
}
