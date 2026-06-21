import { getTranslations, setRequestLocale } from "next-intl/server";
import { Car, CheckCircle2, CalendarClock, Clock } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site.config";
import { formatPrice } from "@/lib/display";
import { getAllCars, getBookings, getAgencySettings } from "@/server/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadgeVariant } from "@/components/admin/bookings/status-badge";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.overview");
  const tStatus = await getTranslations("admin.status");

  const [cars, bookings, settings] = await Promise.all([
    getAllCars(),
    getBookings(),
    getAgencySettings().catch(() => null),
  ]);
  const currency = settings?.currency || siteConfig.currency;
  const today = new Date().toISOString().slice(0, 10);

  const totalCars = cars.length;
  const availableCars = cars.filter((c) => c.is_available).length;
  const upcoming = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "pending") &&
      b.end_date >= today,
  ).length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  const recent = bookings.slice(0, 6);
  const carName = new Map(cars.map((c) => [c.id, c.name]));

  const stats = [
    { label: t("totalCars"), value: totalCars, icon: Car },
    { label: t("availableCars"), value: availableCars, icon: CheckCircle2 },
    { label: t("upcomingBookings"), value: upcoming, icon: CalendarClock },
    { label: t("pendingBookings"), value: pending, icon: Clock },
  ];

  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4">
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className="text-2xl font-semibold">{s.value}</div>
                  <div className="text-muted-foreground text-sm">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("recentBookings")}</h2>
        <Link
          href="/admin/bookings"
          className="text-primary text-sm hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          {t("noBookings")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <ul className="divide-y">
            {recent.map((b) => (
              <li
                key={b.id}
                className="hover:bg-muted/30 flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium" dir="ltr">
                      {b.reference}
                    </span>
                    <Badge variant={StatusBadgeVariant[b.status]}>
                      {tStatus(b.status)}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {b.customer_name} · {carName.get(b.car_id) ?? "—"} ·{" "}
                    {b.start_date} ← {b.end_date}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-medium">
                  {formatPrice(
                    Number(b.total_price),
                    currency,
                    locale as Locale,
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
