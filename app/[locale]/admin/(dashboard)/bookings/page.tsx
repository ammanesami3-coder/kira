import { setRequestLocale } from "next-intl/server";

import { siteConfig } from "@/config/site.config";
import { getBookings, getAllCars, getAgencySettings } from "@/server/queries";
import { BookingsClient } from "@/components/admin/bookings/bookings-client";

export default async function AdminBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [bookings, cars, settings] = await Promise.all([
    getBookings(),
    getAllCars(),
    getAgencySettings().catch(() => null),
  ]);
  const currency = settings?.currency || siteConfig.currency;
  const carInfo = cars.map((c) => ({
    id: c.id,
    name: c.name,
    name_ar: c.name_ar,
  }));

  return (
    <BookingsClient
      initialBookings={bookings}
      cars={carInfo}
      currency={currency}
    />
  );
}
