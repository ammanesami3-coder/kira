import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site.config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  return <HomeContent locale={locale as Locale} />;
}

function HomeContent({ locale }: { locale: Locale }) {
  const t = useTranslations("home");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="hero-grid relative">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
          <Sparkles className="size-3.5" />
          {t("badge")}
        </Badge>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
          {t("title", { name: siteConfig.name })}
        </h1>

        <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
          {t("subtitle")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/cars" className="gap-2">
              {t("ctaPrimary")}
              <Arrow className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">{t("ctaSecondary")}</Link>
          </Button>
        </div>

        <p className="text-muted-foreground/70 mt-4 text-sm">{t("soon")}</p>
      </div>
    </section>
  );
}
