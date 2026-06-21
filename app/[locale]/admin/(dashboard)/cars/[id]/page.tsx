import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getCarForAdmin } from "@/server/queries";
import { CarForm } from "@/components/admin/cars/car-form";
import { ImageManager } from "@/components/admin/cars/image-manager";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const car = await getCarForAdmin(id);
  if (!car) notFound();

  const { car_images, ...carRow } = car;

  return (
    <div className="space-y-6">
      <CarForm car={carRow} />
      <ImageManager carId={car.id} initialImages={car_images} />
    </div>
  );
}
