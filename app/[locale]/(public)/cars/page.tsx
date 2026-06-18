import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return {
    title: t("cars"),
    alternates: { canonical: `/${locale}/cars` },
  };
}

export default async function CarsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CarsContent />;
}

function CarsContent() {
  const t = useTranslations();
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("nav.cars")}
      </h1>
      <p className="text-muted-foreground mt-4">{t("home.soon")}</p>
    </section>
  );
}
