import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { CarWithImages } from "@/server/queries";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/public/car-card";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

/** Featured grid on the home page. Renders nothing when the fleet is empty. */
export function FeaturedCars({
  cars,
  locale,
}: {
  cars: CarWithImages[];
  locale: string;
}) {
  const t = useTranslations("home.featured");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  if (cars.length === 0) return null;

  return (
    <section className="bg-muted/40 border-y">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-3">{t("subtitle")}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/cars" className="gap-2">
              {t("viewAll")}
              <Arrow className="size-4" aria-hidden />
            </Link>
          </Button>
        </Reveal>

        <Stagger className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <StaggerItem key={car.id}>
              <CarCard car={car} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
