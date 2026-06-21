import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { type Locale } from "@/config/site.config";
import { clampDescription, localePath, localizedAlternates } from "@/lib/seo";
import { resolveBranding } from "@/lib/branding";
import { autoRentalJsonLd, breadcrumbJsonLd } from "@/lib/structured-data";
import { getAgencySettings } from "@/server/queries";
import type { Json } from "@/types/database.types";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";

// Static contact info from the agency settings singleton; revalidate hourly.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  const title = t("title");
  const description = clampDescription(t("subtitle"));
  return {
    title,
    description,
    alternates: localizedAlternates(locale as Locale, "/contact"),
    openGraph: { title, description, url: `/${locale}/contact` },
    twitter: { card: "summary_large_image", title, description },
  };
}

const DAY_KEYS = new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);

/** Expand `opening_hours` entries to localized day labels for display. */
function hoursRows(
  hours: Json,
  dayLabel: (k: string) => string,
): { label: string; value: string }[] {
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return [];
  return Object.entries(hours).map(([key, value]) => {
    const [d0 = "", d1 = ""] = key.toLowerCase().split(/[_-]/);
    const label =
      d1 && DAY_KEYS.has(d0) && DAY_KEYS.has(d1)
        ? `${dayLabel(d0)} – ${dayLabel(d1)}`
        : DAY_KEYS.has(d0)
          ? dayLabel(d0)
          : key;
    const v = typeof value === "string" ? value.replace("-", " – ") : "";
    return { label, value: v };
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [settings, t, tHours, tNav] = await Promise.all([
    getAgencySettings().catch(() => null),
    getTranslations({ locale, namespace: "contactPage" }),
    getTranslations({ locale, namespace: "hours" }),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const brand = resolveBranding(settings, locale as Locale);
  const address =
    locale === "ar"
      ? (settings?.address_ar ?? settings?.address)
      : settings?.address;
  const waDigits = settings?.whatsapp_number?.replace(/\D/g, "");
  const mapHref =
    settings?.lat != null && settings?.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${settings.lat},${settings.lng}`
      : address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : null;

  const rows = hoursRows(settings?.opening_hours ?? null, (k) =>
    tHours(`days.${k}`),
  );

  const businessLd = autoRentalJsonLd(
    settings,
    brand,
    locale as Locale,
    clampDescription(t("subtitle")),
  );
  const breadcrumbLd = breadcrumbJsonLd([
    { name: tNav("home"), path: localePath(locale as Locale) },
    { name: tNav("contact"), path: localePath(locale as Locale, "/contact") },
  ]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <JsonLd data={[businessLd, breadcrumbLd]} />

      <header className="mb-12 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-3 text-pretty">
          {t("subtitle")}
        </p>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">{t("reach")}</h2>
          <ul className="space-y-4">
            {settings?.phone && (
              <ContactRow Icon={Phone} label={t("phone")}>
                <a
                  href={`tel:${settings.phone}`}
                  className="hover:text-primary transition-colors"
                  dir="ltr"
                >
                  {settings.phone}
                </a>
              </ContactRow>
            )}
            {waDigits && (
              <ContactRow Icon={MessageCircle} label={t("whatsapp")}>
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {t("whatsappCta")}
                </a>
              </ContactRow>
            )}
            {settings?.email && (
              <ContactRow Icon={Mail} label={t("email")}>
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {settings.email}
                </a>
              </ContactRow>
            )}
            {address && (
              <ContactRow Icon={MapPin} label={t("address")}>
                <span>{address}</span>
              </ContactRow>
            )}
          </ul>

          {mapHref && (
            <Button asChild variant="outline">
              <a href={mapHref} target="_blank" rel="noopener noreferrer">
                <MapPin className="size-4" aria-hidden />
                {t("openMap")}
              </a>
            </Button>
          )}
        </div>

        {rows.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Clock className="size-5" aria-hidden />
              {t("hoursTitle")}
            </h2>
            <dl className="bg-card divide-y rounded-xl border">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <dt className="font-medium">{row.label}</dt>
                  <dd className="text-muted-foreground" dir="ltr">
                    {/^\s*closed\s*$/i.test(row.value)
                      ? tHours("closed")
                      : row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <Button asChild className="w-full sm:w-auto">
              <Link href="/cars">{t("browseCars")}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function ContactRow({
  Icon,
  label,
  children,
}: {
  Icon: typeof Phone;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="flex flex-col">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-medium">{children}</span>
      </span>
    </li>
  );
}
