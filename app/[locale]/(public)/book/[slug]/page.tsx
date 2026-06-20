import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { type Locale } from "@/config/site.config";
import { getCarBySlug } from "@/server/queries";
import { getUnavailableRanges } from "@/server/availability";
import { carName, imageAlt, primaryImage } from "@/lib/display";
import { BookingForm } from "@/components/public/booking/booking-form";
import type { BookingCar } from "@/components/public/booking/types";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// The booking flow is transactional, not content — keep it out of the index
// (it must still be crawlable, hence a real page rather than an iframe).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const car = await getCarBySlug(slug);
  const t = await getTranslations({ locale, namespace: "book" });
  if (!car) return { robots: { index: false } };
  return {
    title: t("title", { name: carName(car, locale as Locale) }),
    robots: { index: false },
  };
}

export default async function BookPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const ranges = await getUnavailableRanges(car.id);

  const name = carName(car, locale as Locale);
  const primary = primaryImage(car.car_images);
  const bookingCar: BookingCar = {
    id: car.id,
    slug: car.slug,
    name,
    brand: car.brand,
    model: car.model,
    year: car.year,
    category: car.category,
    pricePerDay: Number(car.price_per_day),
    deposit: Number(car.deposit),
    image: primary
      ? { url: primary.url, alt: imageAlt(primary, name, locale as Locale) }
      : null,
  };

  return <BookingForm car={bookingCar} ranges={ranges} />;
}
