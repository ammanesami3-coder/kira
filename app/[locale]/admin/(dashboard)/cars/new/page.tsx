import { setRequestLocale } from "next-intl/server";

import { CarForm } from "@/components/admin/cars/car-form";

export default async function NewCarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CarForm car={null} />;
}
