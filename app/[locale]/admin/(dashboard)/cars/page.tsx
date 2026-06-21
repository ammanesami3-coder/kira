import { getTranslations, setRequestLocale } from "next-intl/server";

import { siteConfig } from "@/config/site.config";
import { getAgencySettings, getAllCars } from "@/server/queries";
import { CarsTable } from "@/components/admin/cars/cars-table";

export default async function AdminCarsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await getTranslations("admin");

  const [cars, settings] = await Promise.all([
    getAllCars(),
    getAgencySettings().catch(() => null),
  ]);
  const currency = settings?.currency || siteConfig.currency;

  return <CarsTable initialCars={cars} currency={currency} />;
}
