import { setRequestLocale } from "next-intl/server";

import { getAllCars, getBookings } from "@/server/queries";
import { AvailabilityClient } from "@/components/admin/availability/availability-client";

export default async function AdminAvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [cars, bookings] = await Promise.all([getAllCars(), getBookings()]);
  const carInfo = cars.map((c) => ({
    id: c.id,
    name: c.name,
    name_ar: c.name_ar,
    is_available: c.is_available,
  }));

  return (
    <AvailabilityClient initialCars={carInfo} initialBookings={bookings} />
  );
}
