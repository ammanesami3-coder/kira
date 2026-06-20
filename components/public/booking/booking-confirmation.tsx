"use client";

import { useLocale, useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site.config";
import { formatPrice } from "@/lib/display";
import type { BookingConfirmation as Confirmation } from "@/server/mutations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BookingCar } from "./types";

const dateFnsLocale = { ar: arLocale, fr: frLocale } as const;

/**
 * Post-submit confirmation screen. Renders only data the guest already
 * provided plus the server-issued reference / totals — never re-fetches the
 * (PII-protected) booking row.
 */
export function BookingConfirmationView({
  confirmation,
  car,
  customerName,
  pickup,
  dropoff,
}: {
  confirmation: Confirmation;
  car: BookingCar;
  customerName: string;
  pickup: string;
  dropoff: string | null;
}) {
  const t = useTranslations("book.confirmation");
  const locale = useLocale() as Locale;
  const dfLocale = dateFnsLocale[locale];
  const [copied, setCopied] = useState(false);

  const dateFmt = (iso: string) =>
    format(parseISO(iso), "d MMM yyyy", { locale: dfLocale });

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(confirmation.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — reference is shown on screen anyway */
    }
  };

  const rows: { label: string; value: string }[] = [
    { label: t("car"), value: car.name },
    {
      label: t("dates"),
      value: `${dateFmt(confirmation.start_date)} → ${dateFmt(confirmation.end_date)}`,
    },
    { label: t("pickup"), value: pickup },
    ...(dropoff ? [{ label: t("dropoff"), value: dropoff }] : []),
    {
      label: t("total"),
      value: formatPrice(confirmation.total_price, siteConfig.currency, locale),
    },
  ];

  return (
    <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <span className="bg-primary/10 text-primary mb-4 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <Badge variant="secondary" className="mb-3">
          {t("badge")}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t("title", { name: customerName })}
        </h1>
        <p className="text-muted-foreground mt-2 text-pretty">
          {t("subtitle")}
        </p>
      </div>

      <div className="bg-card mt-8 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3 border-b pb-4">
          <div>
            <p className="text-muted-foreground text-xs">{t("reference")}</p>
            <p className="font-mono text-lg font-semibold tracking-wide">
              {confirmation.reference}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyRef}
            className="gap-2"
          >
            {copied ? (
              <CheckCircle2 className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? t("copied") : t("copy")}
          </Button>
        </div>

        <dl className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground shrink-0">{r.label}</dt>
              <dd className="text-end font-medium">{r.value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 text-sm">
            <dt className="text-muted-foreground shrink-0">{t("status")}</dt>
            <dd className="text-end">
              <Badge variant="outline">{t("statusPending")}</Badge>
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-muted-foreground mt-4 text-center text-sm text-pretty">
        {t("contactNote")}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href="/cars">{t("browseMore")}</Link>
        </Button>
        <Button asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </section>
  );
}
